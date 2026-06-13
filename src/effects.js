import { cardById } from "./cards.js";
import { applyDamage, distance } from "./actions.js";
import { addLog, createUnit, getFreeOrthogonalSpot, getPlayer, getUnit, HAND_SIZE, isInsideBoard, MAX_ENERGY, removeUnit, spawnAntToken, spawnSummonNear, spawnTokenInArea, state, tileAt, unitsAt } from "./gameState.js";

export function useSpell(card, x, y, targetUnitId = null) {
  const targets = unitsAt(x, y);
  const directTarget = targetUnitId ? targets.find((unit) => unit.unitId === targetUnitId) : null;
  const enemyTarget = directTarget && directTarget.owner !== state.activePlayer
    ? directTarget
    : targets.find((unit) => unit.owner !== state.activePlayer);
  const friendlyTarget = directTarget && directTarget.owner === state.activePlayer
    ? directTarget
    : targets.find((unit) => unit.owner === state.activePlayer);
  const playerId = state.activePlayer;
  if (card.id === "boost") {
    getPlayer().nextTurnEnergyBonus = (getPlayer().nextTurnEnergyBonus || 0) + 3;
    addLog("Boost: volgende beurt +3 extra energie.");
    return true;
  }
  if (card.id === "krab-rave") {
    if (!enemyTarget) return fail("Krab Rave moet op een enemy unit.");
    enemyTarget.originalOwnerBeforeKrabRave = enemyTarget.owner;
    enemyTarget.owner = playerId;
    enemyTarget.statuses.krabRaveControl = Math.max(enemyTarget.statuses.krabRaveControl || 0, 1);
    addLog(`Krab Rave neemt ${enemyTarget.name} over voor 1 beurt.`);
    return true;
  }
  if (card.id === "f2") {
    if (!enemyTarget || enemyTarget.type === "base") return fail("F2 moet op een enemy target en werkt niet op base.");
    applyDamage(enemyTarget, 700, null, { ignoreShield: true, ignoreTitanHide: true });
    addLog(`F2 Raket doet 700 true damage op ${enemyTarget.name}.`);
    return true;
  }
  if (card.id === "pumpkin-shield") {
    if (!friendlyTarget || friendlyTarget.type === "base") return fail("Pumpkin Shield moet op een eigen unit.");
    friendlyTarget.attachedShield += 500;
    friendlyTarget.maxAttachedShield = (friendlyTarget.maxAttachedShield || 0) + 500;
    addLog(`${friendlyTarget.name} krijgt een Pumpkin Shield van 500 HP.`);
    return true;
  }
  if (card.id === "rage") {
    if (!friendlyTarget || friendlyTarget.type === "base" || friendlyTarget.type === "building") return fail("Rage moet op een eigen non-building unit.");
    const wantsDamage = window.confirm("OK = 50% meer damage. Annuleren = dubbele snelheid.");
    if (wantsDamage) {
      friendlyTarget.damageMultiplier = Math.max(friendlyTarget.damageMultiplier || 1, 1.5);
      addLog(`${friendlyTarget.name} krijgt 50% meer damage tot hij doodgaat.`);
    } else {
      friendlyTarget.speedMultiplier = 2;
      addLog(`${friendlyTarget.name} krijgt dubbele snelheid.`);
    }
    return true;
  }
  if (card.id === "nyan-kat-regen") {
    const useColumn = window.confirm("OK = kolom raken. Annuleren = rij raken.");
    state.units.slice().forEach((unit) => {
      if ((useColumn && unit.x === x) || (!useColumn && unit.y === y)) {
        applyDamage(unit, unit.owner === playerId ? 100 : 200, null, { antDamageType: "area", sourceName: "Nyan Kat Regen", stackOrAreaDamage: true });
      }
    });
    addLog(`Nyan Kat Regen raakt een hele ${useColumn ? "kolom" : "rij"}.`);
    return true;
  }
  if (card.id === "sneeuwstorm") {
    state.units.slice().forEach((unit) => {
      if (unit.owner === playerId || unit.type === "base") return;
      applyDamage(unit, 50, null, { antDamageType: "area", sourceName: "Sneeuwstorm", stackOrAreaDamage: true });
      unit.statuses.stunned = Math.max(unit.statuses.stunned || 0, 2);
      if (unit.tags.includes("flying")) unit.statuses.grounded = 1;
    });
    addLog("Sneeuwstorm doet 50 damage, stuns alle enemy troepen 1 beurt en groundt enemy flying units.");
    return true;
  }
  if (card.id === "nuke") {
    state.units.slice().forEach((unit) => {
      if (unit.x === x && unit.y === y) {
        if (unit.type === "base") return;
        applyDamage(unit, 500, null, { ignoreShield: true, ignoreTitanHide: true, antDamageType: "area", sourceName: "Nuke", stackOrAreaDamage: true });
        addLog(`Nuke doet 500 true damage op ${unit.name}.`);
      }
    });
    state.radiationZones.push({ x, y, owner: playerId, turnsRemaining: 3 });
    addLog("Nuke maakt een 3x3 radiation arena voor 3 beurten.");
    return true;
  }
  if (card.id === "mind-stone") {
    const enemy = enemyTarget;
    if (!enemy) return fail("Mind Stone heeft een enemy target nodig.");
    if (enemy.type === "base" || enemy.type === "building" || enemy.tags?.includes("token")) {
      return fail("Mind Stone werkt niet op base, buildings of tokens.");
    }
    enemy.owner = playerId;
    enemy.statuses.mindStoneDrain = 99;
    enemy.statuses.cannotAttack = Math.max(enemy.statuses.cannotAttack || 0, 1);
    addLog(`Mind Stone steelt ${enemy.name}. Die unit verliest elke eigen upkeep 20% van max HP + shield.`);
    return true;
  }
  if (card.id === "wanted-level") return useWantedLevel(x, y);
  if (card.id === "sniper-scope") return useSniperScope(friendlyTarget);
  return fail("Deze spell is nog niet volledig geïmplementeerd.");
}

function fail(message) {
  addLog(message);
  return false;
}

function useWantedLevel(x, y) {
  if (!isInsideBoard(x, y) || unitsAt(x, y).length) return fail("Wanted Level moet op een leeg vakje.");
  const inDeployZone = state.activePlayer === 1 ? y >= state.boardRows - 2 : y <= 1;
  const nearFriendly = state.units.some((unit) => unit.owner === state.activePlayer && unit.type !== "base" && distance(unit, { x, y }) <= 3);
  if (!inDeployZone && !nearFriendly) return fail("Wanted Level moet binnen deploy zone of range 3 van een friendly unit.");
  let spawned = 0;
  const spots = [
    { x, y },
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
  for (const spot of spots) {
    if (spawned >= 2) break;
    if (!isInsideBoard(spot.x, spot.y) || unitsAt(spot.x, spot.y).length) continue;
    const cop = createUnit(cardById["gta-cop"], state.activePlayer, spot.x, spot.y);
    cop.isToken = true;
    state.units.push(cop);
    spawned += 1;
  }
  if (!spawned) return fail("Geen vrije plek voor GTA Cops.");
  addLog(`Wanted Level spawnt ${spawned} GTA Cop token${spawned === 1 ? "" : "s"}.`);
  return true;
}

function useSniperScope(target) {
  const rangedAttacks = target?.attacks?.filter((attack) => attack.name === "ranged") || [];
  if (!target || target.owner !== state.activePlayer || !rangedAttacks.length) {
    return fail("Sniper Scope moet op een friendly unit met een echte ranged attack.");
  }
  if (!target.tags.includes("pierce")) target.tags.push("pierce");
  rangedAttacks.forEach((attack) => {
    attack.range = (attack.range || 0) + 1;
  });
  addLog(`${target.name} krijgt +1 range en Pierce Shot.`);
  return true;
}

function useStartRaid(unit) {
  const first = spawnSummonNear("pillager", unit.owner, unit.x, unit.y);
  const second = spawnSummonNear("pillager", unit.owner, unit.x, unit.y);
  if (!first && !second) return fail("Geen vrije adjacent plek voor Pillagers.");
  addLog(`Start Raid spawnt ${[first, second].filter(Boolean).length} Pillager token${first && second ? "s" : ""}.`);
  return true;
}

function useBoneShield(unit, target) {
  if (!target || target.owner !== unit.owner || !target.tags?.includes("token") || distance(unit, target) > 1) {
    return fail("Bone Shield moet een friendly token binnen range 1 sacrificen.");
  }
  removeUnit(target, unit);
  unit.shield += 200;
  unit.baseShield += 200;
  addLog(`Necromancer sacrificet een token en krijgt 200 shield.`);
  return true;
}

function useAlchemistPotion(unit, target) {
  if (!target || target.owner !== unit.owner || target.type === "base" || distance(unit, target) > 1) {
    return fail("Alchemist moet een friendly unit binnen range 1 kiezen.");
  }
  const useBrew = window.confirm("OK = Permanent Brew. Annuleren = Gold Potion.");
  const key = useBrew ? "permanentBrew" : "goldPotion";
  const cost = unit.potionUses?.[key] || 0;
  const player = getPlayer(unit.owner);
  if (player.energy < cost) return fail(`${unit.name} heeft ${cost} energie nodig voor deze potion.`);
  player.energy -= cost;
  unit.potionUses[key] = cost + 1;
  if (useBrew) {
    target.brewStacks = (target.brewStacks || 0) + 1;
    target.attacks.forEach((attack) => {
      if (typeof attack.baseDamage !== "number") attack.baseDamage = attack.damage || 0;
      attack.damage = attack.baseDamage + Math.floor(attack.baseDamage * 0.25 * target.brewStacks);
    });
    addLog(`Permanent Brew geeft ${target.name} +25% attack damage. Potion kostte ${cost} energie.`);
  } else {
    target.statuses.goldPotion = 1;
    addLog(`Gold Potion op ${target.name}: kills geven tot einde beurt +1 energie. Potion kostte ${cost} energie.`);
  }
  return true;
}

function useBloodContract(unit, target) {
  if (!target || target.owner === unit.owner || target.type !== "unit") {
    return fail("Blood Contract moet op een enemy unit.");
  }
  target.statuses.bloodContract = Math.max(target.statuses.bloodContract || 0, 4);
  addLog(`Business Vampire zet Blood Contract op ${target.name} voor 3 beurten.`);
  return true;
}

export function useUnitAbility(unit, target = null) {
  if (unit.cardId === "thanos") return useThanosSacrifice(unit, target);
  if (unit.cardId === "junkrat") return useJunkratShot(unit, target);
  if (unit.cardId === "el-primo") return useElPrimoJump(unit, target);
  if (unit.cardId === "orisa") return useOrisaBarrier(unit, target);
  if (unit.cardId === "roadhog") return useRoadhogHook(unit, target);
  if (unit.cardId === "biem") return useBiemMoveEnemy(unit, target);
  if (unit.cardId === "jet") return useJetReturnToHand(unit);
  if (unit.cardId === "mercy") return useMercyResurrect(unit);
  if (unit.cardId === "takel-heli") return useTakelHeliMoveBuilding(unit);
  if (unit.cardId === "sigma") return useSigmaBarrier(unit, target);
  if (unit.cardId === "medic-drone") return useMedicDroneHeal(unit, target);
  if (unit.cardId === "creeper") return useCreeperExplode(unit);
  if (unit.cardId === "eye-of-cthulhu") return useDemonDash(unit, target);
  if (unit.cardId === "pillager-captain") return useStartRaid(unit);
  if (unit.cardId === "necromancer") return useBoneShield(unit, target);
  if (unit.cardId === "alchemist") return useAlchemistPotion(unit, target);
  if (unit.cardId === "business-vampire") return useBloodContract(unit, target);
  if (unit.cardId === "mierenkoningin") return useQueenSplit(unit);
  if (unit.cardId === "schwerer-gustav") return useGustavSideTrack(unit, target);
  if (unit.cardId === "nuke") return useNuke();
  if (unit.cardId === "mind-stone") return useMindStone();
  return fail("Deze ability is nog niet volledig geïmplementeerd.");
}

export function useHealAbility(unit, target = null) {
  if (unit.healCooldownRemaining > 0) return fail(`${unit.name} heal zit nog op cooldown.`);
  if (unit.cardId === "mercy") return useMercyHeal(unit, target);
  if (unit.cardId === "pam") return usePamHeal(unit);
  return fail("Deze heal is nog niet volledig geïmplementeerd.");
}

function healUnit(target, amount) {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  return target.hp - before;
}

function useQueenSplit(unit) {
  if (unit.hp <= 50) return fail("Mierenkoningin heeft meer dan 50 HP nodig voor Split.");
  const spot = getFreeOrthogonalSpot(unit.x, unit.y);
  if (!spot) return fail("Geen vrij adjacent vakje voor Split.");
  unit.hp -= 50;
  spawnAntToken(unit.owner, spot.x, spot.y, 10);
  addLog("Split: Mierenkoningin verliest 50 HP en spawnt Mier(en) x10.");
  return true;
}

function useGustavSideTrack(unit, target) {
  if (!target || typeof target.x !== "number" || typeof target.y !== "number") {
    return fail("Zijspoor heeft een leeg vakje links of rechts nodig.");
  }
  const sideStep = Math.abs(target.x - unit.x) === 1 && target.y === unit.y;
  if (!sideStep) return fail("Zijspoor mag alleen 1 baan naar links of rechts.");
  if (!isInsideBoard(target.x, target.y) || unitsAt(target.x, target.y).length) return fail("Zijspoor-doelvakje moet geldig en vrij zijn.");
  unit.x = target.x;
  unit.y = target.y;
  unit.statuses.cannotAct = Math.max(unit.statuses.cannotAct || 0, 2);
  addLog("Schwerer Gustav gebruikt Zijspoor en kan 1 beurt niks doen.");
  return true;
}

function useMercyHeal(unit, target = null) {
  const candidates = state.units.filter((candidate) =>
    candidate.owner === unit.owner
    && candidate.type !== "base"
    && candidate.type !== "building"
    && distance(unit, candidate) <= 1
    && candidate.hp < candidate.maxHp
  );
  const chosen = target && candidates.includes(target) ? target : chooseUnitFromPrompt(candidates, "Kies friendly unit voor Mercy heal");
  if (!chosen) return fail("Geen damaged friendly unit binnen range 1 voor Mercy.");
  const healed = healUnit(chosen, 50);
  unit.healCooldownRemaining = 1;
  addLog(`Mercy healt ${chosen.name} voor ${healed} HP.`);
  return true;
}

function usePamHeal(unit) {
  const targets = state.units.filter((candidate) =>
    candidate.owner === unit.owner
    && candidate.type !== "base"
    && candidate.type !== "building"
    && distance(unit, candidate) <= 1
    && candidate.hp < candidate.maxHp
  );
  if (!targets.length) return fail("Geen damaged friendly units binnen range 1 voor Pam.");
  const total = targets.reduce((sum, target) => sum + healUnit(target, 75), 0);
  unit.healCooldownRemaining = 2;
  addLog(`Pam healt ${targets.length} units voor totaal ${total} HP.`);
  return true;
}

function useMedicDroneHeal(unit, target = null) {
  if (!target || target.owner !== unit.owner || target.type === "base" || target.type === "building" || distance(unit, target) > 1) {
    return fail("Medic Drone moet een friendly non-building unit binnen range 1 healen.");
  }
  const healed = healUnit(target, 200);
  removeUnit(unit);
  addLog(`Medic Drone healt ${target.name} voor ${healed} HP en gaat dood.`);
  return true;
}

function useCreeperExplode(unit) {
  const targets = state.units.slice().filter((target) => target.unitId !== unit.unitId && target.type !== "base" && distance(unit, target) <= 1);
  removeUnit(unit);
  targets.forEach((target) => {
    if (getUnit(target.unitId)) applyDamage(target, 300, unit, { antDamageType: "deathExplosion", sourceName: "Creeper death explosion", stackOrAreaDamage: true });
  });
  addLog("Creeper explodeert voor 300 damage in radius 1.");
  return true;
}

function useDemonDash(unit, target = null) {
  if (!target || typeof target.x !== "number" || typeof target.y !== "number") {
    return fail("Demon Dash heeft een vakje in een rechte lijn nodig.");
  }
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const straightLine = dx === 0 || dy === 0;
  const steps = Math.abs(dx) + Math.abs(dy);
  if (!straightLine || steps < 1 || steps > 3) return fail("Demon Dash moet maximaal 3 vakjes in een rechte lijn.");
  const occupants = unitsAt(target.x, target.y);
  if (occupants.some((candidate) => candidate.owner === unit.owner && candidate.type !== "building" && candidate.type !== "base" && candidate.unitId !== unit.unitId)) {
    return fail("Demon Dash kan niet eindigen op een eigen unit.");
  }
  const path = getStraightPath(unit.x, unit.y, target.x, target.y);
  const dashTiles = [{ x: unit.x, y: unit.y }, ...path];
  const enemiesInPath = dashTiles.flatMap((spot) =>
    unitsAt(spot.x, spot.y).filter((candidate) => candidate.owner !== unit.owner && candidate.type !== "base")
  );
  unit.x = target.x;
  unit.y = target.y;
  addLog(`Eye of Cthulhu gebruikt Demon Dash naar ${target.x + 1},${target.y + 1}.`);
  enemiesInPath.forEach((enemy) => {
    if (!getUnit(enemy.unitId)) return;
    applyDamage(enemy, 200, unit, { attackName: "melee" });
    addLog(`Demon Dash doet 200 damage op ${enemy.name}.`);
  });
  return true;
}

function getStraightPath(fromX, fromY, toX, toY) {
  const path = [];
  const stepX = Math.sign(toX - fromX);
  const stepY = Math.sign(toY - fromY);
  let x = fromX;
  let y = fromY;
  while (x !== toX || y !== toY) {
    x += stepX;
    y += stepY;
    path.push({ x, y });
  }
  return path;
}

export function useThanosSacrifice(unit, target = null) {
  if (unit.hp <= 300) return fail("Thanos heeft meer dan 300 HP nodig.");
  if (unit.hasAttackedThisTurn) return fail("Thanos kan Powerpunch alleen gebruiken als hij deze beurt niet heeft aangevallen.");
  const chosenTarget = target?.owner !== unit.owner && distance(unit, target) === 1
    ? target
    : state.units.find((candidate) => candidate.owner !== unit.owner && candidate.type !== "base" && distance(unit, candidate) === 1);
  if (!chosenTarget) return fail("Geen enemy naast Thanos.");
  applyDamage(chosenTarget, 1000, unit, { ignoreShield: true, ignoreTitanHide: true });
  addLog(`Powerpunch doet 1000 true damage op ${chosenTarget.name}.`);
  removeUnit(unit);
  addLog("Thanos sacrificet zichzelf voor Powerpunch.");
  return true;
}

function useJunkratShot(unit, target) {
  if (!target || target.owner === unit.owner || target.type === "base" || distance(unit, target) !== 0) {
    return fail("Concussion Mine heeft een enemy unit op hetzelfde vakje nodig.");
  }
  applyDamage(unit, 100, unit, { ignoreShield: true });
  if (getUnit(target.unitId)) applyDamage(target, 350, unit);
  addLog("Junkrat gebruikt Concussion Mine: 100 selfdamage en 350 damage op de enemy.");
  return true;
}

function useElPrimoJump(unit, target) {
  if (!target || unitsAt(target.x, target.y).length || distance(unit, target) > 2) return fail("El Primo kan maximaal 2 vakjes naar een leeg vak springen.");
  unit.x = target.x;
  unit.y = target.y;
  unit.statuses.cannotAct = 1;
  addLog("El Primo springt en kan 1 beurt niks.");
  return true;
}

function useOrisaBarrier(unit, target = null) {
  if (unit.cooldownRemaining > 0) return fail("Orisa barrier zit nog op cooldown.");
  const spot = target && Number.isInteger(target.x) && distance(unit, target) <= 1 ? target : unit;
  if (spot.x < 0 || spot.x >= state.boardCols || spot.y < 0 || spot.y >= state.boardRows) {
    return fail("Orisa Barrier moet binnen het bord.");
  }
  const blockers = unitsAt(spot.x, spot.y).filter((candidate) =>
    candidate.type === "building" || candidate.owner !== unit.owner
  );
  if (blockers.length) return fail("Orisa Barrier kan hier niet geplaatst worden.");
  const card = cardById["orisa-barrier"];
  state.units.push(createUnit(card, unit.owner, spot.x, spot.y));
  unit.cooldownRemaining = 6;
  addLog("Orisa plaatst een barrier.");
  return true;
}

function useJetReturnToHand(unit) {
  if (unit.usedAbility) return fail("Jet heeft deze ability al gebruikt.");
  const player = getPlayer(unit.owner);
  if (player.hand.length >= HAND_SIZE) return fail("Hand is vol.");
  player.hand.push(cardById.jet);
  unit.usedAbility = true;
  state.units = state.units.filter((candidate) => candidate.unitId !== unit.unitId);
  addLog("Jet gaat terug naar de hand.");
  return true;
}

function useRoadhogHook(unit, target) {
  if (unit.hookCooldownRemaining > 0) return fail("Ability op cooldown.");
  if (
    !target
    || target.owner === unit.owner
    || target.type === "base"
    || target.type === "building"
    || distance(unit, target) !== 1
  ) {
    return fail("Roadhog Hook heeft een enemy unit exact 1 orthogonaal vakje naast zich nodig.");
  }
  target.x = unit.x;
  target.y = unit.y;
  target.statuses.stunned = Math.max(target.statuses.stunned || 0, 2);
  target.statuses.cannotAct = Math.max(target.statuses.cannotAct || 0, 2);
  unit.hookCooldownRemaining = 2;
  addLog(`${unit.name} pullt ${target.name} naar zich toe. ${target.name} is 1 beurt stunned en kan niks doen.`);
  return true;
}

function useBiemMoveEnemy(unit, target) {
  if (unit.usedAbility) return fail("Biem heeft deze ability al gebruikt.");
  if (!target || target.owner === unit.owner) return fail("Biem moet een enemy kiezen.");
  const empty = [];
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) {
      if (!unitsAt(x, y).length) empty.push({ x, y });
    }
  }
  const destinationText = window.prompt("Naar welk vakje? Gebruik x,y van 1-9. Leeg = eerste vrije vakje.");
  let destination = empty[0];
  if (destinationText) {
    const [rawX, rawY] = destinationText.split(",").map((value) => Number.parseInt(value.trim(), 10) - 1);
    const requested = empty.find((spot) => spot.x === rawX && spot.y === rawY);
    if (requested) destination = requested;
  }
  if (!destination) return fail("Geen leeg vakje gevonden.");
  target.x = destination.x;
  target.y = destination.y;
  unit.usedAbility = true;
  addLog(`Biem verplaatst ${target.name} naar ${destination.x + 1},${destination.y + 1}.`);
  return true;
}

export function useMindStone() {
  return fail("Mind Stone is een spell en heeft geen unit ability.");
}

export function useNuke() {
  return fail("Nuke is een spell en heeft geen unit ability.");
}

export function useMercyResurrect(unit) {
  if (unit.mercyReviveCooldownRemaining > 0) return fail("Mercy revive zit nog op cooldown.");
  const player = getPlayer(unit.owner);
  const dead = chooseGraveyardFromPrompt(
    player.graveyard.filter((grave) => grave.type === "unit"),
    "Kies unit om te reviven"
  );
  if (!dead) return fail("Geen friendly dode unit voor Mercy.");
  const spot = [
    { x: unit.x + 1, y: unit.y },
    { x: unit.x - 1, y: unit.y },
    { x: unit.x, y: unit.y + 1 },
    { x: unit.x, y: unit.y - 1 }
  ].find((item) => item.x >= 0 && item.x < state.boardCols && item.y >= 0 && item.y < state.boardRows && !unitsAt(item.x, item.y).length);
  if (!spot) return fail("Geen plek naast Mercy.");
  const revived = createUnit(cardById[dead.cardId], unit.owner, spot.x, spot.y);
  revived.hp = Math.min(300, revived.maxHp);
  revived.shield = 0;
  revived.baseShield = 0;
  revived.attachedShield = 0;
  revived.maxAttachedShield = 0;
  state.units.push(revived);
  player.graveyard = player.graveyard.filter((grave) => grave.unitId !== dead.unitId);
  unit.mercyReviveCooldownRemaining = 7;
  addLog(`Mercy revived ${revived.name}.`);
  return true;
}

export function useTakelHeliMoveBuilding(unit) {
  if (unit.carriedBuildingId) {
    const building = state.units.find((candidate) => candidate.unitId === unit.carriedBuildingId);
    if (!building) {
      unit.carriedBuildingId = null;
      return fail("Takel Heli draagt geen gebouw meer.");
    }
    if (unitsAt(unit.x, unit.y).some((candidate) => candidate.type === "building" && candidate.unitId !== building.unitId)) return fail("Hier staat al een gebouw.");
    building.x = unit.x;
    building.y = unit.y;
    building.carriedByUnitId = null;
    unit.carriedBuildingId = null;
    addLog(`Takel Heli dropt ${building.name}.`);
    return true;
  }
  const building = state.units.find((candidate) =>
    candidate.owner === unit.owner
    && candidate.type === "building"
    && candidate.type !== "base"
    && candidate.x === unit.x
    && candidate.y === unit.y
    && !candidate.occupiedBy
  );
  if (!building) return fail("Takel Heli moet boven een leeg friendly non-base gebouw staan.");
  building.carriedByUnitId = unit.unitId;
  unit.carriedBuildingId = building.unitId;
  building.x = -1;
  building.y = -1;
  addLog(`Takel Heli pakt ${building.name} op.`);
  return true;
}

function useSigmaBarrier(unit, target = null) {
  if (!unit.sigmaBarrier) unit.sigmaBarrier = { placedUnitId: null, shield: 700, maxShield: 700, destroyed: false };
  if (unit.sigmaBarrier.destroyed) return fail("Sigma Barrier is gesloopt en komt niet meer terug.");
  if (unit.sigmaBarrier.placedUnitId) {
    const barrier = getUnit(unit.sigmaBarrier.placedUnitId);
    if (barrier) {
      unit.sigmaBarrier.shield = barrier.shield;
      state.units = state.units.filter((candidate) => candidate.unitId !== barrier.unitId);
    }
    unit.sigmaBarrier.placedUnitId = null;
    addLog("Sigma haalt zijn barrier van het veld.");
    return true;
  }
  const spot = target && Number.isInteger(target.x) && distance(unit, target) <= 1 ? target : unit;
  const occupants = unitsAt(spot.x, spot.y);
  if (occupants.some((candidate) => candidate.type === "building")) return fail("Hier staat al een gebouw.");
  if (occupants.some((candidate) => candidate.owner !== unit.owner)) return fail("Hier staat een enemy unit.");
  const barrier = createUnit(cardById["sigma-barrier"], unit.owner, spot.x, spot.y);
  barrier.sourceSigmaId = unit.unitId;
  barrier.shield = unit.sigmaBarrier.shield;
  barrier.baseShield = unit.sigmaBarrier.maxShield;
  state.units.push(barrier);
  unit.sigmaBarrier.placedUnitId = barrier.unitId;
  addLog(`Sigma plaatst zijn barrier op ${spot.x + 1},${spot.y + 1} met ${barrier.shield}/${unit.sigmaBarrier.maxShield} shield.`);
  return true;
}

function chooseUnitFromPrompt(units, title) {
  if (!units.length) return null;
  if (units.length === 1) return units[0];
  const list = units.map((unit, index) => `${index + 1}: ${unit.name} (${unit.hp}/${unit.maxHp})`).join("\n");
  const choice = window.prompt(`${title}:\n${list}`);
  const index = Number.parseInt(choice, 10) - 1;
  return units[index] || units[0];
}

function chooseGraveyardFromPrompt(units, title) {
  if (!units.length) return null;
  if (units.length === 1) return units[0];
  const list = units.map((unit, index) => `${index + 1}: ${unit.name}`).join("\n");
  const choice = window.prompt(`${title}:\n${list}`);
  const index = Number.parseInt(choice, 10) - 1;
  return units[index] || units[0];
}
