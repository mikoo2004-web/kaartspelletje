import { cardById } from "./cards.js";
import { addLog, claimTerritory, createUnit, drawCards, getBase, getEnemyPlayerId, getPlayer, getUnit, isAntToken, isInsideBoard, isPetrified, MAX_ENERGY, petrifyUnitByMedusa, removeUnit, spawnSummonNear, spendEnergy, state, syncAntStats, tileAt, unitsAt } from "./gameState.js";
import { useHealAbility, useSpell, useUnitAbility } from "./effects.js";

export function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function rangedDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function hasLineOfSight(attacker, target) {
  if (!attacker || !target) return false;
  if (attacker.tags?.includes("pierce")) return true;
  if (attacker.cardId === "schwerer-gustav") return true;
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  if (dx === 0 && dy === 0) return true;
  const steps = greatestCommonDivisor(Math.abs(dx), Math.abs(dy));
  if (steps <= 1) return true;
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let step = 1; step < steps; step += 1) {
    const x = attacker.x + stepX * step;
    const y = attacker.y + stepY * step;
    if (unitsAt(x, y).some((unit) => unit.unitId !== attacker.unitId && unit.unitId !== target.unitId && unit.type !== "base")) return false;
  }
  return true;
}

function greatestCommonDivisor(a, b) {
  let left = a;
  let right = b;
  while (right !== 0) {
    const next = left % right;
    left = right;
    right = next;
  }
  return left || 1;
}

export function isDeployCell(card, x, y) {
  if (x < 0 || x >= state.boardCols || y < 0 || y >= state.boardRows) return false;
  if (card.type === "building") return canPlaceBuilding(state.activePlayer, x, y);
  if (unitsAt(x, y).some((unit) => !isAntToken(unit))) return false;
  if (card.tags?.includes("deploy-anywhere")) return true;
  return state.activePlayer === 1 ? y >= state.boardRows - 2 : y <= 1;
}

export function canPlaceBuilding(playerId, x, y) {
  const tile = tileAt(x, y);
  if (!tile || tile.territoryOwner !== playerId) return false;
  return !unitsAt(x, y).some((unit) => unit.owner !== playerId);
}

export function playCard(index, x, y, targetUnitId = null) {
  const player = getPlayer();
  const card = player.hand[index];
  if (!card) return false;
  if (player.energy < (card.cost || 0)) {
    addLog(`Niet genoeg energie voor ${card.name}.`);
    return false;
  }

  if (card.type === "spell") {
    const used = useSpell(card, x, y, targetUnitId);
    if (!used) return false;
    if (!spendEnergy(card.cost || 0)) return false;
    player.hand.splice(index, 1);
    if (card.id === "boost") {
      const insertAt = Math.floor(Math.random() * (player.deck.length + 1));
      player.deck.splice(insertAt, 0, card);
    } else {
      player.graveyard.push({ ...card, zoneReason: "used-spell" });
    }
    drawCards(player.id, 1);
    return true;
  }

  if (!isDeployCell(card, x, y)) {
    if (card.type === "building") {
      addLog("Je kunt hier geen gebouw plaatsen. Gebouwen mogen alleen op eigen gebied en niet op vijanden.");
      return false;
    }
    addLog(`${card.name} kan hier niet geplaatst worden.`);
    return false;
  }
  if (!spendEnergy(card.cost || 0)) return false;
  player.hand.splice(index, 1);
  state.units.push(createUnit(card, player.id, x, y));
  addLog(`Speler ${player.id} plaatst ${card.name}.`);
  drawCards(player.id, 1);
  return true;
}

export function moveUnit(unit, x, y) {
  if (!unit || unit.owner !== state.activePlayer) return false;
  if (isPetrified(unit)) {
    addLog(`${unit.name} is een standbeeld en kan niet bewegen.`);
    return false;
  }
  const usingExtraMove = !!unit.extraMoveAvailable;
  if (unit.hasMovedThisTurn && !usingExtraMove) {
    addLog(`${unit.name} heeft deze beurt al bewogen.`);
    return false;
  }
  if (unit.statuses.stunned || unit.statuses.cannotAct) {
    addLog(`${unit.name} kan nu niet bewegen.`);
    return false;
  }
  if (unit.cardId === "schwerer-gustav" && unit.gustavMoveCooldown > 0) {
    addLog("Schwerer Gustav kan maar 1 keer per 2 eigen beurten bewegen.");
    return false;
  }
  if (unit.speed <= 0 && !unit.tags.includes("moving")) {
    addLog(`${unit.name} kan niet bewegen.`);
    return false;
  }
  const elPrimoTax = unitsAt(unit.x, unit.y).some((candidate) => candidate.owner !== unit.owner && candidate.cardId === "el-primo");
  if (elPrimoTax) {
    if (getPlayer().energy < 2) {
      addLog(`${unit.name} moet 2 energie betalen om weg te lopen van El Primo.`);
      return false;
    }
    spendEnergy(2);
    addLog(`${unit.name} betaalt 2 energie om weg te lopen van El Primo.`);
  }
  const antPath = isAntToken(unit) ? findAntPath(unit, x, y) : null;
  const occupants = unitsAt(x, y);
  const blockingOccupants = occupants.filter((candidate) => !isAntToken(candidate));
  const friendlyBuilding = occupants.find((candidate) => candidate.owner === unit.owner && candidate.type === "building");
  const ownBase = blockingOccupants.find((candidate) => candidate.owner === unit.owner && candidate.type === "base");
  const isOwnBaseTile = !!ownBase;
  const hasFriendlyBlocker = !isAntToken(unit) && blockingOccupants.some((candidate) =>
    candidate.owner === unit.owner
    && candidate.type !== "building"
    && candidate.type !== "base"
    && candidate.unitId !== unit.unitId
  );
  const hasEnemy = blockingOccupants.some((candidate) => candidate.owner !== unit.owner);
  const canEnterEnemySquare = hasEnemy && canEnterEnemyOccupiedTile(unit, isOwnBaseTile);
  const canEnterFriendlyBuilding = unit.cardId !== "the-rook" && friendlyBuilding && unit.type !== "building" && !friendlyBuilding.occupiedBy && !(friendlyBuilding.cardId === "wall-wrecker" && hasEnemy);
  if (!isAntToken(unit) && (hasFriendlyBlocker || (friendlyBuilding && !canEnterFriendlyBuilding) || (blockingOccupants.length && !canEnterEnemySquare && !canEnterFriendlyBuilding))) {
    addLog("Dat vakje is bezet.");
    return false;
  }
  const maxDistance = Math.max(0, unit.speed * (unit.speedMultiplier || 1));
  if (isAntToken(unit) ? !antPath : distance(unit, { x, y }) > maxDistance) {
    addLog(`${unit.name} kan niet zo ver lopen.`);
    return false;
  }
  if (unit.cardId === "the-rook" && unit.x !== x && unit.y !== y) {
    addLog("THE ROOK mag alleen horizontaal of verticaal in een rechte lijn bewegen.");
    return false;
  }
  if (unit.cardId === "schwerer-gustav" && !isValidGustavMove(unit, x, y)) {
    addLog("Schwerer Gustav kan alleen rechtdoor of naar achter bewegen.");
    return false;
  }
  const path = antPath || getMovementPath(unit.x, unit.y, x, y);
  const chargeTargets = unit.cardId === "the-rook" ? getCastleChargeTargets(unit, path) : [];
  leaveBuilding(unit);
  unit.x = x;
  unit.y = y;
  if (unit.cardId === "wall-wrecker") {
    state.units
      .filter((candidate) => candidate.insideBuildingId === unit.unitId)
      .forEach((candidate) => {
        candidate.x = x;
        candidate.y = y;
      });
  }
  if (canEnterFriendlyBuilding) enterBuilding(unit, friendlyBuilding);
  unit.hasMovedThisTurn = true;
  if (usingExtraMove) unit.extraMoveAvailable = false;
  if (!unit.tags?.includes("no-claim")) path.forEach((spot) => claimTerritory(unit.owner, spot.y, spot.x));
  if (isAntToken(unit)) mergeFriendlyAntsOnTile(unit);
  else resolveAntStomp(unit);
  if (unit.cardId === "medusa") resolveMedusaPetrify(unit);
  if (unit.cardId === "the-rook") resolveCastleCharge(unit, chargeTargets);
  if (unit.cardId === "schwerer-gustav") unit.gustavMoveCooldown = 2;
  if (isOwnBaseTile && hasEnemy) {
    addLog(`${unit.name} beweegt naar de eigen base en contest de enemy.`);
  } else {
    addLog(`${unit.name} beweegt naar ${x + 1},${y + 1}${canEnterFriendlyBuilding ? ` en gaat in ${friendlyBuilding.name}` : ""}.`);
  }
  return true;
}

function resolveMedusaPetrify(medusa) {
  const flyingTarget = unitsAt(medusa.x, medusa.y).find((candidate) =>
    candidate.owner !== medusa.owner
    && candidate.type === "unit"
    && candidate.unitId !== medusa.unitId
    && candidate.tags?.includes("flying")
    && !isPetrified(candidate)
  );
  if (flyingTarget) {
    addLog("Medusa kan flying targets niet verstenen.");
    return;
  }
  const target = unitsAt(medusa.x, medusa.y).find((candidate) =>
    candidate.owner !== medusa.owner
    && candidate.type === "unit"
    && candidate.unitId !== medusa.unitId
    && !candidate.tags?.includes("flying")
    && !candidate.tags?.includes("barrier")
    && !isPetrified(candidate)
  );
  if (target) petrifyUnitByMedusa(medusa, target);
}

function isValidGustavMove(unit, x, y) {
  const dist = distance(unit, { x, y });
  if (dist !== 1) return false;
  const forwardY = unit.owner === 1 ? unit.y - 1 : unit.y + 1;
  const backY = unit.owner === 1 ? unit.y + 1 : unit.y - 1;
  return (x === unit.x && (y === forwardY || y === backY));
}

export function findAntPath(unit, toX, toY) {
  if (!isAntToken(unit) || !isInsideBoard(toX, toY) || (unit.x === toX && unit.y === toY)) return null;
  const maxCost = Math.max(0, unit.speed * (unit.speedMultiplier || 1));
  const start = { x: unit.x, y: unit.y, cost: 0, path: [{ x: unit.x, y: unit.y }], freeUsed: new Set() };
  const queue = [start];
  const seen = new Set([`${unit.x},${unit.y}|`]);
  while (queue.length) {
    const current = queue.shift();
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];
    for (const next of neighbors) {
      if (!isInsideBoard(next.x, next.y)) continue;
      const key = `${next.x},${next.y}`;
      const hasOwnAnt = unitsAt(next.x, next.y).some((candidate) => candidate.owner === unit.owner && candidate.unitId !== unit.unitId && isAntToken(candidate));
      const usesFreeStep = hasOwnAnt && !current.freeUsed.has(key);
      const nextCost = current.cost + (usesFreeStep ? 0 : 1);
      if (nextCost > maxCost) continue;
      const nextFreeUsed = new Set(current.freeUsed);
      if (usesFreeStep) nextFreeUsed.add(key);
      const signature = `${key}|${[...nextFreeUsed].sort().join(";")}`;
      if (seen.has(signature)) continue;
      const nextState = { x: next.x, y: next.y, cost: nextCost, path: [...current.path, next], freeUsed: nextFreeUsed };
      if (next.x === toX && next.y === toY) return nextState.path;
      seen.add(signature);
      queue.push(nextState);
    }
  }
  return null;
}

export function getReachableAntSquares(unit) {
  const squares = [];
  if (!isAntToken(unit)) return squares;
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) {
      const path = findAntPath(unit, x, y);
      if (path) squares.push({ x, y });
    }
  }
  return squares;
}

function mergeFriendlyAntsOnTile(unit) {
  if (!isAntToken(unit) || !getUnit(unit.unitId)) return;
  const ants = unitsAt(unit.x, unit.y).filter((candidate) => candidate.owner === unit.owner && isAntToken(candidate));
  if (ants.length <= 1) {
    syncAntStats(unit);
    return;
  }
  const keeper = ants.find((candidate) => candidate.unitId !== unit.unitId) || unit;
  const total = ants.reduce((sum, ant) => sum + (ant.antCount || 1), 0);
  keeper.antCount = total;
  syncAntStats(keeper);
  state.units = state.units.filter((candidate) => !ants.some((ant) => ant.unitId === candidate.unitId) || candidate.unitId === keeper.unitId);
  addLog(`Eigen mieren stacken samen tot ${keeper.name}.`);
}

function resolveAntStomp(unit) {
  if (!unit || unit.tags?.includes("flying") || unit.type !== "unit") return;
  unitsAt(unit.x, unit.y)
    .filter((candidate) => candidate.owner !== unit.owner && isAntToken(candidate))
    .forEach((ant) => damageAntStack(ant, 10, unit, { antDamageType: "stepOnAnt", sourceName: "vertrapt" }));
}

function getCastleChargeTargets(unit, path) {
  return path.slice(1).flatMap((spot) =>
    unitsAt(spot.x, spot.y).filter((candidate) => candidate.unitId !== unit.unitId && candidate.type === "unit")
  );
}

function resolveCastleCharge(unit, targets) {
  if (!targets.length) return;
  let hits = 0;
  for (const target of targets) {
    if (!getUnit(unit.unitId)) break;
    if (!getUnit(target.unitId)) continue;
    applyDamage(target, 150, unit);
    hits += 1;
    if (getUnit(unit.unitId)) applyDamage(unit, 50, unit, { ignoreShield: true, ignoreTitanHide: true });
  }
  addLog(`Castle Charge raakt ${hits} unit${hits === 1 ? "" : "s"}. THE ROOK krijgt ${hits * 50} true selfdamage.`);
}

function getMovementPath(fromX, fromY, toX, toY) {
  const path = [{ x: fromX, y: fromY }];
  let x = fromX;
  let y = fromY;
  while (x !== toX) {
    x += Math.sign(toX - x);
    path.push({ x, y });
  }
  while (y !== toY) {
    y += Math.sign(toY - y);
    path.push({ x, y });
  }
  return path;
}

function enterBuilding(unit, building) {
  unit.insideBuildingId = building.unitId;
  building.occupiedBy = unit.unitId;
}

function leaveBuilding(unit) {
  if (!unit.insideBuildingId) return;
  const building = getUnit(unit.insideBuildingId);
  if (building?.occupiedBy === unit.unitId) building.occupiedBy = null;
  unit.insideBuildingId = null;
}

export function isMeleeUnit(unit) {
  return unit.tags?.includes("melee");
}

export function canEnterEnemyOccupiedTile() {
  return true;
}

export function isSmilerUntargetableBy(attacker, target) {
  if (!attacker || !target || target.cardId !== "smiler" || attacker.owner === target.owner) return false;
  const tile = tileAt(target.x, target.y);
  return !!tile && tile.territoryOwner === target.owner && !tile.isProtectedBaseZone;
}

export function canAttack(attacker, target) {
  if (!attacker || !target || attacker.owner === target.owner) return false;
  if (isPetrified(attacker)) return false;
  if (attacker.hasAttackedThisTurn) return false;
  if (attacker.statuses.stunned || attacker.statuses.cannotAct || attacker.statuses.cannotAttack) return false;
  if (isSmilerUntargetableBy(attacker, target)) return false;
  const attack = chooseAttack(attacker, target);
  if (!attack) return false;
  const sameTileOccupants = unitsAt(attacker.x, attacker.y);
  const isContested = sameTileOccupants.some((unit) => unit.owner === attacker.owner) && sameTileOccupants.some((unit) => unit.owner !== attacker.owner);
  if (isContested && attack.name !== "melee" && distance(attacker, target) > 0) return false;
  if (attacker.cardId === "sniper-monkey" && unitsAt(attacker.x, attacker.y).some((unit) => unit.owner !== attacker.owner)) return false;
  if (target.cardId === "assassin" && (attack.range || 0) >= 2) return false;
  if ((attacker.attackCooldowns?.[attack.name] || 0) > 0) return false;
  if (attacker.insideBuildingId) {
    const building = getUnit(attacker.insideBuildingId);
    if (building?.cardId === "wall-wrecker") return false;
  }
  if (target.type === "base") return canAttackBase(attacker, target, attack);
  if (attacker.cardId === "schwerer-gustav" && !isValidGustavTarget(attacker, target.x, target.y)) return false;
  if (attacker.cardId === "knight" && attack.lunge) {
    if (!canKnightLunge(attacker, target)) return false;
  }
  if (attack.name === "melee" || (!attacker.tags?.includes("ranged") && attacker.tags?.includes("melee"))) {
    if (distance(attacker, target) !== 0 && !attack.lunge) return false;
  } else if (rangedDistance(attacker, target) > attack.range) {
    return false;
  }
  if (attack.name !== "melee" && distance(attacker, target) > 0 && !hasLineOfSight(attacker, target)) return false;
  const targetFlying = target.tags?.includes("flying") && !target.statuses.grounded;
  if (targetFlying && attack.name === "melee" && !attacker.tags?.includes("flying") && !attacker.tags?.includes("melee-hits-flying")) return false;
  if (targetFlying && attacker.cardId === "bom-gooier") return false;
  const attackerCanHitFlying = attacker.tags?.includes("ranged") || attacker.tags?.includes("building") || attacker.type === "building";
  if (targetFlying && attack.name !== "melee" && !attackerCanHitFlying) return false;
  return true;
}

function canKnightLunge(attacker, target) {
  if (distance(attacker, target) !== 1 || target.type === "base") return false;
  return !unitsAt(target.x, target.y).some((unit) =>
    unit.owner === attacker.owner
    && unit.type !== "building"
    && unit.type !== "base"
    && unit.unitId !== attacker.unitId
  );
}

export function makeBaseAttackTarget(ownerId, column) {
  const base = getBase(ownerId);
  if (!base) return null;
  base.targetColumn = column;
  base.baseZoneTarget = true;
  return base;
}

export function canAttackBase(attacker, target, attack = chooseAttack(attacker, target)) {
  if (!attacker || !target || target.type !== "base" || attacker.owner === target.owner || !attack) return false;
  const row = target.owner === 1 ? state.boardRows - 1 : 0;
  const column = Number.isInteger(target.targetColumn) ? target.targetColumn : attacker.x;
  const blockers = getBaseTileBlockers(attacker, column, row);
  if (blockers.length) return false;
  if (attack.name === "melee" || (!attacker.tags?.includes("ranged") && attacker.tags?.includes("melee"))) {
    return attacker.y === row && attacker.x === column;
  }
  if (attacker.cardId === "schwerer-gustav") return isValidGustavTarget(attacker, column, row);
  return rangedDistance(attacker, { x: column, y: row }) <= attack.range && hasLineOfSight(attacker, { x: column, y: row });
}

export function getBaseTileBlockers(attacker, column, row) {
  return unitsAt(column, row).filter((unit) => unit.type !== "base" && unit.unitId !== attacker?.unitId);
}

export function chooseAttack(attacker, target) {
  if (!attacker.attacks?.length) return null;
  if (target?.type === "base") {
    const ranged = attacker.attacks.find((item) => item.name === "ranged");
    const melee = attacker.attacks.find((item) => item.name === "melee");
    return ranged || melee || attacker.attacks[0];
  }
  if (attacker.cardId === "dart-monkey") {
    const tile = tileAt(attacker.x, attacker.y);
    const bonusRange = tile?.territoryOwner === attacker.owner ? 1 : 0;
    return { name: "ranged", damage: 100, range: 1 + bonusRange };
  }
  if (attacker.cardId === "mier-token") return { name: "melee", damage: (attacker.antCount || 1) * 10, range: 0 };
  if (attacker.cardId === "a-10-thunderbolt") {
    const targetFlying = target.tags?.includes("flying") && !target.statuses.grounded;
    return targetFlying
      ? { name: "air", damage: 150, range: 2 }
      : { name: "BRRRRT", damage: 25, range: 2, hits: 10 };
  }
  if (attacker.cardId === "schwerer-gustav") return { name: "siege", damage: 400, range: 5, minRange: 2, areaDamage: 200, areaRadius: 1, lineOnly: true, ignoresLineBlockers: true };
  if (attacker.cardId === "jet") return { name: "ranged", damage: target.tags?.includes("flying") ? 350 : 50, range: 1 };
  if (attacker.cardId === "wall-wrecker" && (target.tags?.includes("bunker") || target.role === "bunker")) return { name: "melee", damage: 150, range: 0, hits: 2 };
  if (attacker.cardId === "wall-wrecker" && target.type === "building") return { name: "melee", damage: 150, range: 0 };
  if (attacker.cardId === "bom-gooier" && target.type === "building") return { name: "anti-building", damage: 500, range: 1 };
  if (attacker.cardId === "miner" && target.type === "building") return { name: "melee", damage: 100, range: 1 };
  if (attacker.cardId === "junkrat") {
    const dist = distance(attacker, target);
    if (dist === 0) return { name: "melee", damage: 50, range: 0, hits: 5 };
    if (dist === 1) return { name: "ranged", damage: 50, range: 3, hits: 4 };
    if (dist === 2) return { name: "ranged", damage: 50, range: 3, hits: 3 };
    return { name: "ranged", damage: 50, range: 3 };
  }
  if (attacker.cardId === "knight" && distance(attacker, target) === 1) return { name: "melee", damage: 250, range: 1, lunge: true };
  if (attacker.cardId === "assassin" && target.wasAttackedThisTurn) return { name: "melee", damage: 400, range: 1 };
  if (attacker.cardId === "bomber") return { name: "melee", damage: 100, range: 0, hits: 2, areaRadius: 1 };
  if (attacker.cardId === "sigma") return { name: "ranged", damage: 75, range: 1, hits: 2 };
  if (attacker.cardId === "collete") {
    const damage = 50 + Math.floor(Math.max(0, target.hp || 0) * 0.33);
    return { name: "scaling", damage, range: 1 };
  }
  const dist = distance(attacker, target);
  const melee = attacker.attacks.find((item) => item.name === "melee");
  const ranged = attacker.attacks.find((item) => item.name === "ranged");
  if (target.tags?.includes("flying") && !target.statuses.grounded && ranged && dist <= ranged.range) return ranged;
  if (dist === 0 && melee) return melee;
  if (ranged && rangedDistance(attacker, target) <= ranged.range) return ranged;
  return attacker.attacks[0];
}

function hasRaidBannerBonus(attacker) {
  if (!attacker?.tags?.some((tag) => tag === "summon" || tag === "token")) return false;
  return state.units.some((unit) =>
    unit.owner === attacker.owner
    && unit.cardId === "pillager-captain"
    && unit.unitId !== attacker.unitId
    && Math.abs(unit.x - attacker.x) <= 1
    && Math.abs(unit.y - attacker.y) <= 1
  );
}

export function hasAreaDamage(source) {
  if (!source) return false;
  const card = source.cardId ? cardById[source.cardId] : null;
  return !!source.areaDamage || !!source.areaRadius || source.tags?.includes("area-damage") || card?.tags?.includes("area-damage");
}

export function hasStackDamage(source) {
  if (!source) return false;
  const card = source.cardId ? cardById[source.cardId] : null;
  return hasAreaDamage(source) || source.stackDamage || source.tags?.includes("stack-damage") || card?.tags?.includes("stack-damage");
}

export function isTrueBunker(unit) {
  return !!unit?.tags?.includes("true-bunker");
}

function isProtectedByTrueBunker(unit) {
  if (!unit?.insideBuildingId) return false;
  return isTrueBunker(getUnit(unit.insideBuildingId));
}

function stackAreaTargetsOnTile(attacker, x, y, { includeFriendly = false, excludeUnitId = null } = {}) {
  return unitsAt(x, y).filter((unit) =>
    unit.type !== "base"
    && unit.unitId !== attacker?.unitId
    && unit.unitId !== excludeUnitId
    && !isProtectedByTrueBunker(unit)
    && (includeFriendly || unit.owner !== attacker?.owner)
  );
}

function stackAreaTargetsAround(attacker, center, radius, { includeFriendly = false, excludeUnitId = null } = {}) {
  return state.units.slice().filter((unit) =>
    unit.type !== "base"
    && unit.unitId !== attacker?.unitId
    && unit.unitId !== excludeUnitId
    && !isProtectedByTrueBunker(unit)
    && distance(unit, center) <= radius
    && (includeFriendly || unit.owner !== attacker?.owner)
  );
}

function baseRowForOwner(ownerId) {
  return ownerId === 1 ? state.boardRows - 1 : 0;
}

function impactPointForTarget(target) {
  if (target?.type === "base" && target.baseZoneTarget) {
    return { x: target.targetColumn, y: baseRowForOwner(target.owner) };
  }
  return { x: target.x, y: target.y };
}

function applyAreaDamageToBaseIfNeeded(attacker, impact, radius, amount, options = {}) {
  const enemyBaseOwnerId = attacker.owner === 1 ? 2 : 1;
  const base = getBase(enemyBaseOwnerId);
  if (!base) return;
  const baseRow = baseRowForOwner(enemyBaseOwnerId);
  const canReachBaseRow = Array.from({ length: state.boardCols }, (_, x) => ({ x, y: baseRow }))
    .some((baseTile) => distance(impact, baseTile) <= radius);
  if (!canReachBaseRow) return;
  applyDamage(base, amount, attacker, options);
  addLog(`${base.name} krijgt ${amount} Area Damage.`);
}

function canReceiveStackDamageFrom(attacker, target) {
  if (attacker?.cardId === "bom-gooier" && target.tags?.includes("flying") && !target.statuses.grounded) return false;
  return true;
}

function applyAttackHits(attacker, target, attack, damage, hits, options = {}) {
  let totalDamage = 0;
  for (let i = 0; i < hits; i += 1) {
    const beforeX = target.x;
    const beforeY = target.y;
    if (attacker.cardId === "shield-breaker") applyShieldBreakerDamage(target, damage, attacker, options);
    else applyDamage(target, damage, attacker, options);
    totalDamage += target.lastDamageAmount || 0;
    if (!getUnit(target.unitId)) break;
    if (target.x !== beforeX || target.y !== beforeY) break;
  }
  return totalDamage;
}

export function attackUnit(attacker, target) {
  if (!canAttack(attacker, target)) {
    addLog("Deze aanval mag nu niet.");
    return false;
  }
  const attack = chooseAttack(attacker, target);
  if ((attacker.attackCooldowns?.[attack.name] || 0) > 0) {
    addLog(`${attacker.name} kan deze aanval nog niet opnieuw gebruiken.`);
    return false;
  }
  let damage = attack.damage * (attacker.damageMultiplier || 1);
  if (hasRaidBannerBonus(attacker)) damage += 50;
  const consumedTargeted = attacker.tags?.includes("targeted-fire") && target.statuses.targeted;
  if (consumedTargeted) {
    damage = Math.floor(damage * 1.5);
    delete target.statuses.targeted;
    addLog(`${target.name} was targeted: targeted-fire hit doet 50% meer damage.`);
  }
  const hits = attack.hits || 1;
  if (attack.lunge) {
    attacker.x = target.x;
    attacker.y = target.y;
    addLog(`Knight lunges naar ${target.name} en doet 250 damage.`);
  }
  let totalDamageForHealing = 0;
  if (attacker.cardId === "schwerer-gustav") {
    if (target.type === "base") {
      applyGustavAttack(attacker, target, true);
      attacker.hasAttackedThisTurn = true;
      return true;
    }
    applyGustavAttack(attacker, target, true);
    attacker.hasAttackedThisTurn = true;
    if (attack.cooldown) attacker.attackCooldowns[attack.name] = attack.cooldown + 1;
    return true;
  }
  if (attacker.cardId === "a-10-thunderbolt") {
    applyA10Attack(attacker, target, attack);
    attacker.hasAttackedThisTurn = true;
    target.wasAttackedThisTurn = true;
    return true;
  }
  if ((hasStackDamage(attacker) || hasStackDamage(attack)) && !(hasAreaDamage(attacker) || hasAreaDamage(attack))) {
    const stackTargets = stackAreaTargetsOnTile(attacker, target.x, target.y);
    stackTargets.forEach((stackTarget) => {
      if (!canReceiveStackDamageFrom(attacker, stackTarget)) return;
      const stackAttack = chooseAttack(attacker, stackTarget) || attack;
      let stackDamage = stackAttack.damage * (attacker.damageMultiplier || 1);
      if (hasRaidBannerBonus(attacker)) stackDamage += 50;
      applyAttackHits(attacker, stackTarget, stackAttack, stackDamage, stackAttack.hits || 1, {
        ignoreBuildingProtection: stackAttack.ignoresBuildingProtection,
        attackName: stackAttack.name,
        stackOrAreaDamage: true
      });
      stackTarget.wasAttackedThisTurn = true;
    });
    addLog(`${attacker.name} gebruikt Stack Damage op ${stackTargets.length} enemy unit(s) op dit vakje.`);
    attacker.hasAttackedThisTurn = true;
    if (attack.cooldown) attacker.attackCooldowns[attack.name] = attack.cooldown + 1;
    return true;
  }
  if (attacker.cardId === "bomber") {
    const areaTargets = stackAreaTargetsAround(attacker, attacker, 1);
    areaTargets.forEach((candidate) => {
      const areaDamage = candidate.type === "building" ? damage + 125 : damage;
      for (let i = 0; i < hits; i += 1) {
        const beforeX = candidate.x;
        const beforeY = candidate.y;
        applyDamage(candidate, areaDamage, attacker, { ignoreBuildingProtection: attack.ignoresBuildingProtection, attackName: attack.name, antDamageType: "area", stackOrAreaDamage: true });
        if (!getUnit(candidate.unitId)) break;
        if (candidate.x !== beforeX || candidate.y !== beforeY) break;
      }
    });
  } else {
    for (let i = 0; i < hits; i += 1) {
      const beforeX = target.x;
      const beforeY = target.y;
      if (attacker.cardId === "shield-breaker") applyShieldBreakerDamage(target, damage, attacker, { ignoreBuildingProtection: attack.ignoresBuildingProtection, attackName: attack.name });
      else applyDamage(target, damage, attacker, { ignoreBuildingProtection: attack.ignoresBuildingProtection, attackName: attack.name });
      totalDamageForHealing += target.lastDamageAmount || 0;
      if (!getUnit(target.unitId)) break;
      if (target.x !== beforeX || target.y !== beforeY) break;
    }
    if (attacker.cardId === "sigma") {
      const sigmaImpact = impactPointForTarget(target);
      stackAreaTargetsAround(attacker, sigmaImpact, 1, { excludeUnitId: target.unitId })
        .forEach((candidate) => {
          for (let i = 0; i < 2; i += 1) {
            const beforeX = candidate.x;
            const beforeY = candidate.y;
            applyDamage(candidate, 50, attacker, { attackName: "ranged", antDamageType: "area", stackOrAreaDamage: true });
            if (!getUnit(candidate.unitId)) break;
            if (candidate.x !== beforeX || candidate.y !== beforeY) break;
          }
        });
      if (target.type !== "base") {
        for (let i = 0; i < 2; i += 1) {
          applyAreaDamageToBaseIfNeeded(attacker, sigmaImpact, 1, 50, { attackName: "ranged", antDamageType: "area", stackOrAreaDamage: true });
        }
      }
      addLog("Sigma Gravity Area Damage raakt enemy units binnen range 1 van het geraakte target voor 50 x2.");
    }
  }
  addLog(`${attacker.name} doet ${damage}${hits > 1 ? ` x${hits}` : ""} damage op ${target.name}.`);
  attacker.hasAttackedThisTurn = true;
  target.wasAttackedThisTurn = true;
  if (attack.cooldown) attacker.attackCooldowns[attack.name] = attack.cooldown + 1;
  if (attacker.cardId === "steve" && !getUnit(target.unitId) && target.type !== "base") {
    attacker.shield = attacker.baseShield;
    attacker.attacks.forEach((item) => {
      item.damage += 50;
    });
    addLog("Steve loott: shield terug en +50 damage.");
  }
  if (attacker.cardId === "business-vampire" && totalDamageForHealing > 0 && (attacker.maxHp || 0) > 0) {
    const before = attacker.hp;
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + totalDamageForHealing);
    addLog(`Business Vampire lifestealt ${attacker.hp - before} HP.`);
  }
  if (attacker.cardId === "knight" && !getUnit(target.unitId) && target.type === "unit") {
    attacker.hasAttackedThisTurn = false;
    addLog("Knight maakt een Chain Kill en mag opnieuw aanvallen.");
  }
  if (attacker.cardId === "geertje" && totalDamageForHealing > 0) {
    const summonId = Math.random() < 0.5 ? "turk" : "marokkaan";
    const summon = spawnSummonNear(summonId, attacker.owner, target.x, target.y);
    if (summon) addLog(`${attacker.name} markeert ${target.name} en roept hulp op.`);
  }
  if (!consumedTargeted && attacker.cardId === "sniper-monkey" && getUnit(target.unitId)) {
    target.statuses.targeted = Math.max(target.statuses.targeted || 0, 5);
    addLog(`${target.name} is targeted voor 4 beurten.`);
  }
  if (!consumedTargeted && attacker.cardId === "gta-cop" && getUnit(target.unitId)) {
    target.statuses.targeted = Math.max(target.statuses.targeted || 0, 3);
    addLog(`${target.name} is targeted voor 2 beurten door GTA Cop.`);
  }
  if (consumedTargeted && attacker.cardId === "gta-cop") {
    const player = getPlayer(attacker.owner);
    player.nextTurnEnergyBonus = (player.nextTurnEnergyBonus || 0) + 1;
    addLog("Arrest Bonus: GTA Cop geeft +1 energie volgende beurt.");
  }
  if (attacker.cardId === "smiler" && getUnit(target.unitId)) {
    target.statuses.stunned = Math.max(target.statuses.stunned || 0, 2);
    attacker.extraMoveAvailable = true;
    attacker.hasMovedThisTurn = false;
    addLog("Smiler kan na zijn Jumpscare nog weglopen.");
  }
  if (attacker.cardId === "wither-skeleton" && getUnit(target.unitId)) {
    target.statuses.wither = Math.max(target.statuses.wither || 0, 3);
    addLog(`${target.name} krijgt Wither voor 2 beurten.`);
  }
  if (attacker.statuses.goldPotion && !getUnit(target.unitId) && target.type === "unit") {
    const player = getPlayer(attacker.owner);
    player.energy = Math.min(MAX_ENERGY, player.energy + 1);
    addLog(`Gold Potion triggert: speler ${attacker.owner} krijgt +1 energie.`);
  }
  if (!consumedTargeted && attacker.cardId === "trump" && getUnit(target.unitId)) {
    target.statuses.targeted = Math.max(target.statuses.targeted || 0, 3);
    addLog(`${target.name} is targeted voor 2 beurten.`);
  }
  if (attacker.cardId === "slime-king" && !getUnit(target.unitId) && target.type !== "base") {
    const summon = spawnSummonNear("slime", attacker.owner, target.x, target.y);
    if (summon) addLog("Slime King maakt een Slime na de kill.");
  }
  if (attacker.cardId === "biem") applyDamage(attacker, 400, attacker, { ignoreShield: true });
  if (attacker.cardId === "marokkaan") spawnMarokkaanChain(attacker, target);
  if (!isPetrified(target) && target.cardId === "electro-giant" && attacker.unitId !== target.unitId && distance(attacker, target) <= 1) {
    applyDamage(attacker, Math.min(150, 50 * hits), target);
    addLog(`${attacker.name} krijgt return damage van Electro Giant.`);
  }
  return true;
}

function applyA10Attack(attacker, target, attack) {
  const hits = attack.hits || 1;
  const impact = impactPointForTarget(target);
  if (attack.name === "BRRRRT") {
    addLog(`A-10 Thunderbolt gebruikt BRRRRT op ${target.name} en doet 25x10 damage.`);
  } else {
    addLog(`A-10 Thunderbolt valt een flying unit aan en doet 150 damage.`);
  }
  for (let i = 0; i < hits; i += 1) {
    const beforeX = target.x;
    const beforeY = target.y;
    applyDamage(target, attack.damage, attacker, { attackName: attack.name });
    if (!getUnit(target.unitId)) break;
    if (target.x !== beforeX || target.y !== beforeY) break;
  }
  if (attack.name === "BRRRRT") {
    addLog("A-10 Thunderbolt raakt omliggende units met 50 Area Damage.");
    stackAreaTargetsAround(attacker, impact, 1, { excludeUnitId: target.unitId })
      .forEach((unit) => {
        if (!getUnit(unit.unitId)) return;
        applyDamage(unit, 50, attacker, { attackName: "a10-area", antDamageType: "area", sourceName: "A-10 Area Damage", stackOrAreaDamage: true });
        addLog(`${unit.name} krijgt 50 Area Damage van A-10 Thunderbolt.`);
      });
    if (target.type !== "base") {
      applyAreaDamageToBaseIfNeeded(attacker, impact, 1, 50, { attackName: "a10-area", antDamageType: "area", sourceName: "A-10 Area Damage", stackOrAreaDamage: true });
    }
  }
}

export function isValidGustavTarget(unit, x, y) {
  if (!unit || unit.cardId !== "schwerer-gustav") return false;
  const dx = x - unit.x;
  const dy = y - unit.y;
  const straightLine = (dx === 0 && dy !== 0) || (dy === 0 && dx !== 0);
  const dist = Math.abs(dx) + Math.abs(dy);
  return straightLine && dist >= 2 && dist <= 5;
}

export function getValidGustavTargetTiles(unit) {
  if (!unit || unit.cardId !== "schwerer-gustav" || unit.owner !== state.activePlayer) return [];
  if (unit.hasAttackedThisTurn || unit.statuses.stunned || unit.statuses.cannotAct || unit.statuses.cannotAttack) return [];
  const targets = [];
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) {
      if (isValidGustavTarget(unit, x, y)) targets.push({ x, y, gustavTarget: true });
    }
  }
  return targets;
}

export function attackGustavTile(attacker, x, y) {
  if (!attacker || attacker.cardId !== "schwerer-gustav" || attacker.owner !== state.activePlayer) return false;
  if (attacker.hasAttackedThisTurn || attacker.statuses.stunned || attacker.statuses.cannotAct || attacker.statuses.cannotAttack) {
    addLog("Schwerer Gustav kan nu niet aanvallen.");
    return false;
  }
  if (!isValidGustavTarget(attacker, x, y)) {
    addLog("Schwerer Gustav moet een vakje in rechte lijn op range 2-5 kiezen.");
    return false;
  }
  applyGustavAttack(attacker, { x, y, emptyTile: true }, false);
  attacker.hasAttackedThisTurn = true;
  return true;
}

function applyGustavAttack(attacker, target, hasMainTarget) {
  const impact = impactPointForTarget(target);
  if (hasMainTarget && target.unitId) {
    addLog(`Schwerer Gustav vuurt op ${target.name} voor 400 damage.`);
    applyDamage(target, 400, attacker, { attackName: "siege" });
  } else if (hasMainTarget && target.type === "base") {
    addLog("Schwerer Gustav vuurt op de base voor 400 damage.");
    applyDamage(target, 400, attacker, { attackName: "siege" });
  } else {
    addLog("Schwerer Gustav vuurt op een leeg vakje en veroorzaakt 200 Area Damage rondom dat vakje.");
  }
  stackAreaTargetsAround(attacker, impact, 1, { includeFriendly: true, excludeUnitId: target.unitId })
    .forEach((unit) => {
      if (!getUnit(unit.unitId)) return;
      applyDamage(unit, 200, attacker, { attackName: "siege-area", antDamageType: "area", sourceName: "Schwerer Gustav Area Damage", stackOrAreaDamage: true });
      addLog(`${unit.name} krijgt 200 Area Damage.`);
    });
}

export function applyDamage(target, amount, attacker = null, options = {}) {
  if (!target || amount <= 0) return;
  target.lastDamageAmount = 0;
  target.lastDamageAttackerId = attacker?.unitId || null;
  if (target.cardId === "enderman" && attacker && options.attackName && options.attackName !== "melee" && distance(attacker, target) > 0) {
    addLog("Enderman krijgt 0 damage: hij ontwijkt de ranged attack en teleporteert weg.");
    teleportUnitRandomly(target, 2);
    return;
  }
  if (target.cardId === "iron-titan" && !target.ignoredFirstHitThisTurn && !options.ignoreTitanHide) {
    target.ignoredFirstHitThisTurn = true;
    addLog("Iron Titan's Titan Hide negeert de eerste hit van deze beurt.");
    return;
  }
  if (options.ignoreShield && (target.maxHp || 0) <= 0) {
    addLog(`${target.name} heeft geen HP en verdwijnt door true damage.`);
    removeUnit(target, attacker);
    return;
  }
  if (target.carriedByUnitId) {
    const carrier = getUnit(target.carriedByUnitId);
    if (carrier) {
      addLog(`${carrier.name} draagt ${target.name} en neemt de damage.`);
      applyDamage(carrier, amount, attacker, options);
      return;
    }
  }
  if (target.insideBuildingId && !options.ignoreBuildingProtection) {
    const building = getUnit(target.insideBuildingId);
    if (building) {
      if (options.stackOrAreaDamage && !isTrueBunker(building)) {
        addLog(`${target.name} zit in ${building.name}, maar dit is geen True Bunker: Stack/Area Damage raakt de unit.`);
      } else {
        applyDamage(building, amount, attacker, { ignoreBuildingProtection: true });
        amount = isTrueBunker(building) || isBunkerShield(building) ? 0 : Math.floor(amount / 2);
        addLog(`${target.name} zit in ${building.name}: ${building.name} krijgt ${amount === 0 ? "alle" : "volle"} damage, unit krijgt ${amount}.`);
      }
    }
  }
  if (amount <= 0) return;
  if (!options.ignoreShield && target.attachedShield > 0) {
    const before = target.attachedShield;
    target.attachedShield = Math.max(0, target.attachedShield - amount);
    target.lastDamageAmount = Math.min(before, amount);
    addLog(`${target.name}'s extra shield blokt de hit (${before} -> ${target.attachedShield}).`);
    return;
  }
  if (!options.ignoreShield && target.shield > 0) {
    const before = target.shield;
    target.shield = Math.max(0, target.shield - amount);
    target.lastDamageAmount = Math.min(before, amount);
    addLog(`${target.name}'s shield blokt de hit (${before} -> ${target.shield}).`);
    if (target.shield <= 0 && (target.tags?.includes("barrier") || (target.maxHp || 0) <= 0)) removeUnit(target, attacker);
    return;
  }
  if (isAntToken(target)) {
    damageAntStack(target, amount, attacker, {
      antDamageType: options.antDamageType || "singleHit",
      sourceName: options.sourceName || options.attackName || (options.ignoreShield ? "true damage" : "damage")
    });
    return;
  }
  if ((target.maxHp || 0) <= 0) {
    removeUnit(target, attacker);
    return;
  }
  target.lastDamageAmount = amount;
  target.hp -= amount;
  if (target.hp <= 0) removeUnit(target, attacker);
  else {
    if (!isPetrified(target) && target.cardId === "eye-of-cthulhu" && !target.secondPhaseActive && target.hp < 400) {
      target.secondPhaseActive = true;
      target.speed += 1;
      target.attacks
        .filter((attack) => attack.name === "melee")
        .forEach((attack) => {
          attack.damage += 100;
        });
      addLog("Eye of Cthulhu gaat naar Second Phase: +1 speed en +100 melee damage.");
    }
    if (!isPetrified(target) && target.cardId === "enderman" && attacker && options.attackName === "melee") {
      addLog("Enderman gebruikt Ender Blink na de melee hit.");
      teleportUnitRandomly(target, 2);
    }
  }
}

function damageAntStack(target, amount, attacker = null, options = {}) {
  if (!isAntToken(target) || amount <= 0) return;
  const sourceName = options.sourceName || "damage";
  const type = options.antDamageType || "singleHit";
  const killed = type === "area" || type === "deathExplosion"
    ? Math.floor(amount / 10)
    : type === "stepOnAnt"
      ? 1
      : amount >= 10 ? 1 : 0;
  if (killed <= 0) {
    target.lastDamageAmount = 0;
    target.lastDamageAttackerId = attacker?.unitId || null;
    addLog(`${target.name} krijgt ${amount} ${sourceName}, maar restdamage onder 10 vervalt.`);
    return;
  }
  const before = target.antCount || 1;
  const actualKilled = Math.min(before, killed);
  target.lastDamageAmount = actualKilled * 10;
  target.lastDamageAttackerId = attacker?.unitId || null;
  target.antCount = Math.max(0, before - actualKilled);
  if (target.antCount <= 0) {
    addLog(`${sourceName} raakt Mier(en) x${before}. ${before} mier${before === 1 ? "" : "en"} ster${before === 1 ? "ft" : "ven"} en de stack verdwijnt.`);
    removeUnit(target, attacker);
    return;
  }
  syncAntStats(target);
  addLog(`${sourceName} raakt Mier(en) x${before}. ${actualKilled} mier${actualKilled === 1 ? "" : "en"} ster${actualKilled === 1 ? "ft" : "ven"}. ${target.name} blijft over.`);
}

export function teleportUnitRandomly(unit, range = 2) {
  if (!unit) return false;
  const options = [];
  for (let y = Math.max(0, unit.y - range); y <= Math.min(state.boardRows - 1, unit.y + range); y += 1) {
    for (let x = Math.max(0, unit.x - range); x <= Math.min(state.boardCols - 1, unit.x + range); x += 1) {
      if (x === unit.x && y === unit.y) continue;
      if (distance(unit, { x, y }) > range) continue;
      if (unitsAt(x, y).length) continue;
      options.push({ x, y });
    }
  }
  if (!options.length) {
    addLog(`${unit.name} heeft geen leeg vakje om naartoe te teleporteren.`);
    return false;
  }
  const target = options[Math.floor(Math.random() * options.length)];
  leaveBuilding(unit);
  unit.x = target.x;
  unit.y = target.y;
  addLog(`${unit.name} teleporteert naar ${target.x + 1},${target.y + 1}.`);
  return true;
}

function applyShieldBreakerDamage(target, amount, attacker, options = {}) {
  if (!target || !attacker) return;
  const shieldBefore = (target.attachedShield || 0) + (target.shield || 0);
  const boostedAmount = shieldBefore > 0 ? amount * 2 : amount;
  applyDamage(target, boostedAmount, attacker, options);
  const shieldAfter = (target.attachedShield || 0) + (target.shield || 0);
  const shieldDamage = Math.max(0, shieldBefore - shieldAfter);
  if (shieldDamage > 0) {
    const healedShield = Math.floor(shieldDamage * 0.5);
    const maxShield = attacker.baseShield || 0;
    const before = attacker.shield || 0;
    attacker.shield = Math.min(maxShield, before + healedShield);
    addLog(`Shield Breaker geneest ${attacker.shield - before} shield.`);
  }
  if (shieldBefore > 0 && shieldAfter <= 0) {
    target.statuses.cannotAttack = Math.max(target.statuses.cannotAttack || 0, 2);
    addLog(`${target.name} kan 1 beurt niet aanvallen door Shield Breaker.`);
  }
}

function spawnMarokkaanChain(attacker, target) {
  const nextHp = attacker.maxHp - 25;
  if (nextHp <= 0 || !getUnit(attacker.unitId)) return;
  const dx = Math.sign(target.x - attacker.x);
  const dy = Math.sign(target.y - attacker.y);
  const preferred = { x: target.x + dx, y: target.y + dy };
  const fallback = [
    preferred,
    { x: target.x + 1, y: target.y },
    { x: target.x - 1, y: target.y },
    { x: target.x, y: target.y + 1 },
    { x: target.x, y: target.y - 1 }
  ].find((spot) => spot.x >= 0 && spot.x < state.boardCols && spot.y >= 0 && spot.y < state.boardRows && !unitsAt(spot.x, spot.y).length);
  if (!fallback) return;
  const summon = summonCard("marokkaan", attacker.owner, fallback.x, fallback.y);
  if (!summon) return;
  summon.maxHp = nextHp;
  summon.hp = nextHp;
  addLog(`Marokkaan roept een zwakkere Marokkaan op met ${nextHp} HP.`);
}

function isBunkerShield(building) {
  return building.cardId === "bunker" || building.cardId === "orisa-barrier" || building.tags?.includes("barrier");
}

export function instantKill(target, sourceName = "F2") {
  addLog(`${sourceName} vernietigt ${target.name}.`);
  removeUnit(target);
}

export function activateAbility(unit, target = null) {
  if (!unit || unit.owner !== state.activePlayer) return false;
  if (isPetrified(unit)) {
    addLog(`${unit.name} is een standbeeld en kan geen ability gebruiken.`);
    return false;
  }
  const abilityCost = unit.abilityCost ?? 1;
  if (unit.hasUsedAbilityThisTurn) {
    addLog(`${unit.name} heeft deze beurt al een ability gebruikt.`);
    return false;
  }
  if (getPlayer().energy < abilityCost) {
    addLog(`Speler ${state.activePlayer} heeft niet genoeg energie.`);
    return false;
  }
  if (unit.statuses.cannotAct) {
    addLog(`${unit.name} kan nu geen ability gebruiken.`);
    return false;
  }
  const used = useUnitAbility(unit, target);
  if (used) {
    spendEnergy(abilityCost);
    unit.hasUsedAbilityThisTurn = true;
  }
  return used;
}

export function activateHeal(unit, target = null) {
  if (!unit || unit.owner !== state.activePlayer || !unit.tags?.includes("healer")) return false;
  if (isPetrified(unit)) return false;
  const abilityCost = unit.abilityCost ?? 1;
  if (unit.hasUsedAbilityThisTurn) {
    addLog(`${unit.name} heeft deze beurt al een ability gebruikt.`);
    return false;
  }
  if (getPlayer().energy < abilityCost) {
    addLog(`Speler ${state.activePlayer} heeft niet genoeg energie.`);
    return false;
  }
  const used = useHealAbility(unit, target);
  if (used) {
    spendEnergy(abilityCost);
    unit.hasUsedAbilityThisTurn = true;
  }
  return used;
}

export function summonCard(cardId, owner, x, y) {
  const card = cardById[cardId];
  if (!card || unitsAt(x, y).length) return null;
  const unit = createUnit(card, owner, x, y);
  state.units.push(unit);
  return unit;
}
