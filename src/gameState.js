import { baseCards, cards, getImageForCard } from "./cards.js?v=verkenner-image-1";

export const BOARD_ROWS = 9;
export const BOARD_COLS = 9;
export const BASE_ENERGY_PER_TURN = 3;
export const MAX_ENERGY = 10;
export const HAND_SIZE = 5;
export const PROTECTED_BASE_ROWS = 2;
let nextUnitId = 1;

function cloneCard(card) {
  return { ...card, attacks: card.attacks ? card.attacks.map((attack) => ({ ...attack })) : [], tags: [...(card.tags || [])] };
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const state = {
  boardRows: BOARD_ROWS,
  boardCols: BOARD_COLS,
  turn: 1,
  activePlayer: 1,
  players: [],
  units: [],
  tiles: [],
  selectedCardIndex: null,
  selectedUnitId: null,
  inspectedUnitId: null,
  currentMode: "idle",
  unitActionIntent: "move",
  pendingDiscardPlayer: null,
  pendingSpell: null,
  radiationZones: [],
  log: []
};

function createTiles() {
  const tiles = [];
  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLS; x += 1) {
      const protectedForPlayer = y < PROTECTED_BASE_ROWS ? 2 : y >= BOARD_ROWS - PROTECTED_BASE_ROWS ? 1 : null;
      tiles.push({
        x,
        y,
        territoryOwner: protectedForPlayer,
        isProtectedBaseZone: protectedForPlayer !== null,
        protectedForPlayer
      });
    }
  }
  return tiles;
}

export function createUnit(card, owner, x, y) {
  const antCount = card.id === "mier-token" ? Math.max(1, card.antCount || 1) : 0;
  const unit = {
    unitId: `u${nextUnitId++}`,
    cardId: card.id,
    name: card.name,
    owner,
    x,
    y,
    type: card.type,
    role: card.role || "",
    tags: [...(card.tags || [])],
    image: card.image || getImageForCard(card),
    maxHp: antCount ? antCount * 10 : card.maxHp,
    hp: antCount ? antCount * 10 : ((card.maxHp || 0) > 0 ? card.maxHp : 1),
    shield: card.shield || 0,
    baseShield: card.shield || 0,
    maxAttachedShield: 0,
    speed: card.speed || 0,
    cost: card.cost || 0,
    abilityCost: card.abilityCost ?? 1,
    attacks: card.attacks ? card.attacks.map((attack) => ({ ...attack, baseDamage: attack.baseDamage ?? attack.damage })) : [],
    abilityText: card.abilityText || "Deze ability is nog niet volledig geïmplementeerd.",
    abilityTargetType: card.abilityTargetType || "none",
    statuses: {},
    attachedShield: 0,
    insideBuildingId: null,
    occupiedBy: null,
    cooldownRemaining: 0,
    healCooldownRemaining: 0,
    hookCooldownRemaining: 0,
    mercyReviveCooldownRemaining: 0,
    attackCooldowns: {},
    carriedBuildingId: null,
    carriedByUnitId: null,
    sigmaBarrier: card.id === "sigma" ? { placedUnitId: null, shield: 700, maxShield: 700, destroyed: false } : null,
    usedAbility: false,
    hasMovedThisTurn: false,
    hasAttackedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    wasAttackedThisTurn: false,
    ignoredFirstHitThisTurn: false,
    damageMultiplier: 1,
    speedMultiplier: 1,
    extraMoveAvailable: false,
    potionUses: { permanentBrew: 0, goldPotion: 0 },
    moveCost: 1,
    hitMemory: {}
  };
  if (antCount) {
    unit.antCount = antCount;
    syncAntStats(unit);
  }
  if (card.id === "manager") unit.hp = 150;
  if (card.id === "business-vampire") unit.hp = 500;
  if (card.id === "schwerer-gustav") unit.gustavMoveCooldown = 0;
  Object.defineProperties(unit, {
    currentHp: {
      enumerable: true,
      get() {
        return this.hp;
      },
      set(value) {
        this.hp = value;
      }
    },
    currentShield: {
      enumerable: true,
      get() {
        return (this.shield || 0) + (this.attachedShield || 0);
      },
      set(value) {
        this.shield = value;
        this.attachedShield = 0;
      }
    },
    maxShield: {
      enumerable: true,
      get() {
        return (this.baseShield || 0) + (this.maxAttachedShield || 0);
      },
      set(value) {
        this.baseShield = value;
      }
    }
  });
  return unit;
}

function makePlayer(id) {
  const tokenIds = ["orisa-barrier", "sigma-barrier", "turk", "marokkaan", "slime", "pillager", "gta-cop", "skeleton", "mier-token", "nyan-kat-token"];
  const deck = shuffle(cards.filter((card) => !tokenIds.includes(card.id)).map(cloneCard));
  return {
    id,
    energy: 0,
    nextTurnEnergyBonus: 0,
    deck,
    hand: [],
    graveyard: [],
    baseAlive: true
  };
}

export function resetGame() {
  nextUnitId = 1;
  state.turn = 1;
  state.activePlayer = 1;
  state.players = [makePlayer(1), makePlayer(2)];
  getPlayer(1).energy = BASE_ENERGY_PER_TURN;
  state.tiles = createTiles();
  state.units = [
    createUnit(baseCards.p1, 1, -1, BOARD_ROWS),
    createUnit(baseCards.p2, 2, -1, -1)
  ];
  state.selectedCardIndex = null;
  state.selectedUnitId = null;
  state.inspectedUnitId = null;
  state.currentMode = "idle";
  state.unitActionIntent = "move";
  state.pendingDiscardPlayer = null;
  state.pendingSpell = null;
  state.radiationZones = [];
  state.log = [];
  drawCards(1, HAND_SIZE);
  drawCards(2, HAND_SIZE);
  addLog(`Spel gestart. Speler 1 begint met ${BASE_ENERGY_PER_TURN} energie.`);
}

export function getPlayer(id = state.activePlayer) {
  return state.players.find((player) => player.id === id);
}

export function getEnemyPlayerId(playerId = state.activePlayer) {
  return playerId === 1 ? 2 : 1;
}

export function getBase(playerId) {
  return state.units.find((unit) => unit.owner === playerId && unit.type === "base" && isUnitAlive(unit));
}

export function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 80);
}

export function drawCards(playerId, amount = 1) {
  const player = getPlayer(playerId);
  if (!player || !player.baseAlive) return;
  for (let i = 0; i < amount; i += 1) {
    if (player.deck.length === 0 || player.hand.length >= HAND_SIZE) return;
    player.hand.push(player.deck.shift());
  }
}

export function spendEnergy(amount) {
  const player = getPlayer();
  if (player.energy < amount) {
    addLog(`Speler ${player.id} heeft niet genoeg energie.`);
    return false;
  }
  player.energy -= amount;
  return true;
}

export function activeUnits(playerId = state.activePlayer) {
  return state.units.filter((unit) => unit.owner === playerId && isUnitAlive(unit) && unit.type !== "base");
}

export function unitAt(x, y) {
  return state.units.find((unit) => unit.x === x && unit.y === y && isUnitAlive(unit));
}

export function unitsAt(x, y) {
  return state.units.filter((unit) => unit.x === x && unit.y === y && isUnitAlive(unit));
}

export function isUnitAlive(unit) {
  if (!unit) return false;
  if ((unit.maxHp || 0) <= 0) return (unit.currentShield || unit.shield || 0) > 0 && unit.hp > 0;
  return unit.hp > 0;
}

export function isAntToken(unit) {
  return unit?.cardId === "mier-token";
}

export function isStackingToken(unit) {
  return isAntToken(unit) || unit?.cardId === "nyan-kat-token";
}

export function getAntDisplayName(unit) {
  if (!isAntToken(unit)) return unit?.name || "";
  const count = Math.max(1, unit.antCount || 1);
  return count === 1 ? "Mier x1" : `Mier(en) x${count}`;
}

export function syncAntStats(unit) {
  if (!isAntToken(unit)) return unit;
  unit.antCount = Math.max(0, Math.floor(unit.antCount || 0));
  unit.name = getAntDisplayName(unit);
  unit.maxHp = unit.antCount * 10;
  unit.hp = unit.maxHp;
  unit.attacks = unit.attacks?.length ? unit.attacks : [{ name: "melee", damage: 10, range: 0, baseDamage: 10 }];
  unit.attacks.forEach((attack) => {
    attack.name = "melee";
    attack.damage = unit.antCount * 10;
    attack.baseDamage = attack.damage;
    attack.range = 0;
  });
  return unit;
}

export function isPetrified(unit) {
  return !!unit?.statuses?.standbeeld;
}

export function petrifyUnitByMedusa(medusa, target) {
  if (!medusa || medusa.cardId !== "medusa" || !target || target.owner === medusa.owner) return false;
  if (target.type !== "unit" || target.type === "base" || target.tags?.includes("barrier") || isPetrified(target)) return false;
  if (target.tags?.includes("flying")) {
    addLog("Medusa kan flying targets niet verstenen.");
    return false;
  }
  const currentHp = isAntToken(target) ? (target.antCount || 1) * 10 : Math.max(1, target.hp || target.currentHp || 1);
  target.petrifiedOriginal = {
    cardId: target.cardId,
    name: target.name,
    type: target.type,
    role: target.role,
    tags: [...(target.tags || [])],
    image: target.image,
    maxHp: target.maxHp,
    speed: target.speed,
    attacks: target.attacks ? target.attacks.map((attack) => ({ ...attack })) : [],
    abilityText: target.abilityText,
    abilityTargetType: target.abilityTargetType,
    antCount: target.antCount,
    isToken: target.isToken
  };
  target.statuses = { standbeeld: 999999 };
  target.petrifiedByMedusaId = medusa.unitId;
  target.image = "assets/cards/standbeeld.PNG";
  target.maxHp = currentHp;
  target.hp = currentHp;
  target.shield = 0;
  target.baseShield = 0;
  target.attachedShield = 0;
  target.maxAttachedShield = 0;
  target.speed = 0;
  target.attacks = [];
  target.abilityTargetType = "none";
  target.tags = ["unit", "standbeeld", "petrified"];
  delete target.antCount;
  addLog(`Medusa verandert ${target.name} in een standbeeld.`);
  addLog(`${target.name} is versteend en kan niets meer doen.`);
  return true;
}

function restorePetrifiedByMedusa(medusa) {
  const statues = state.units.filter((unit) => unit.petrifiedByMedusaId === medusa.unitId && unit.petrifiedOriginal);
  if (!statues.length) return;
  addLog("Medusa is dood. Haar standbeelden worden weer normaal.");
  statues.forEach((statue) => {
    const original = statue.petrifiedOriginal;
    const currentHp = Math.max(1, statue.hp || 1);
    statue.cardId = original.cardId;
    statue.name = original.name;
    statue.type = original.type;
    statue.role = original.role;
    statue.tags = [...(original.tags || [])];
    statue.image = original.image;
    statue.maxHp = original.maxHp;
    statue.hp = Math.min(currentHp, Math.max(currentHp, original.maxHp || currentHp));
    statue.speed = original.speed;
    statue.attacks = original.attacks ? original.attacks.map((attack) => ({ ...attack })) : [];
    statue.abilityText = original.abilityText;
    statue.abilityTargetType = original.abilityTargetType;
    statue.shield = 0;
    statue.baseShield = 0;
    statue.attachedShield = 0;
    statue.maxAttachedShield = 0;
    statue.statuses = {};
    statue.isToken = original.isToken;
    if (original.cardId === "mier-token") {
      statue.antCount = Math.max(1, Math.floor(currentHp / 10));
      syncAntStats(statue);
    } else {
      delete statue.antCount;
    }
    delete statue.petrifiedOriginal;
    delete statue.petrifiedByMedusaId;
    addLog(`${statue.name} keert terug uit verstening met ${statue.hp} HP.`);
  });
}

export function tileAt(x, y) {
  return state.tiles.find((tile) => tile.x === x && tile.y === y);
}

export function isInsideBoard(x, y) {
  return x >= 0 && x < state.boardCols && y >= 0 && y < state.boardRows;
}

export function claimTerritory(playerId, y, x) {
  const candidates = [
    { x, y },
    { x: x - 1, y },
    { x: x + 1, y }
  ];
  let claimed = 0;
  for (const spot of candidates) {
    if (!isInsideBoard(spot.x, spot.y)) continue;
    const tile = tileAt(spot.x, spot.y);
    if (!tile) continue;
    if (tile.isProtectedBaseZone) continue;
    const occupants = unitsAt(spot.x, spot.y);
    if (occupants.some((unit) => unit.owner !== playerId)) continue;
    if (tile.territoryOwner !== playerId) {
      tile.territoryOwner = playerId;
      claimed += 1;
    }
  }
  if (claimed > 0) addLog(`Player ${playerId} neemt ${claimed} vakjes over.`);
  return claimed;
}

export function getUnit(unitId) {
  return state.units.find((unit) => unit.unitId === unitId && isUnitAlive(unit));
}

export function removeUnit(unit, killer = null) {
  const player = getPlayer(unit.owner);
  const wasPetrified = isPetrified(unit);
  if (unit.cardId === "medusa") restorePetrifiedByMedusa(unit);
  if (!wasPetrified && unit.cardId === "bom-gooier") {
    const burstTargets = state.units.slice().filter((candidate) =>
      candidate.unitId !== unit.unitId
      && candidate.owner !== unit.owner
      && candidate.type !== "base"
      && candidate.x === unit.x
      && candidate.y === unit.y
    );
    burstTargets.forEach((target) => {
      applyStatusDamage(target, 150, "Bom Gooier death burst");
      addLog(`Bom Gooier death burst doet 150 damage op ${target.name}.`);
      if (!isUnitAlive(target)) removeUnit(target, unit);
    });
  }
  if (!wasPetrified && unit.cardId === "politicus") {
    state.units.slice()
      .filter((candidate) => candidate.owner === unit.owner && candidate.supportedByPoliticusId === unit.unitId)
      .forEach((candidate) => {
        const shieldLoss = candidate.politiekeSteunShield || 0;
        candidate.attachedShield = Math.max(0, (candidate.attachedShield || 0) - shieldLoss);
        candidate.maxAttachedShield = Math.max(0, (candidate.maxAttachedShield || 0) - shieldLoss);
        candidate.politiekeSteunShield = 0;
        candidate.supportedByPoliticusId = null;
        const damage = Math.floor((candidate.maxHp || 0) * 0.3);
        if (damage > 0) applyStatusDamage(candidate, damage, "Val van de Regering");
        if (!isUnitAlive(candidate)) removeUnit(candidate, unit);
        addLog(`Val van de Regering: ${candidate.name} verliest Politieke Steun en krijgt ${damage} damage.`);
      });
  }
  if (!wasPetrified && unit.cardId === "sigma-barrier" && unit.sourceSigmaId) {
    const sigma = getUnit(unit.sourceSigmaId);
    if (sigma?.sigmaBarrier) {
      sigma.sigmaBarrier.placedUnitId = null;
      sigma.sigmaBarrier.destroyed = true;
      sigma.sigmaBarrier.shield = 0;
      addLog("Sigma Barrier is gesloopt.");
    }
  }
  if (unit.insideBuildingId) {
    const building = getUnit(unit.insideBuildingId);
    if (building?.occupiedBy === unit.unitId) building.occupiedBy = null;
  }
  if (unit.type === "building") {
    state.units.forEach((candidate) => {
      if (candidate.insideBuildingId === unit.unitId) candidate.insideBuildingId = null;
    });
  }
  if (unit.type === "base") {
    player.baseAlive = false;
    addLog(`Base van speler ${unit.owner} is kapot. Deze speler trekt geen kaarten meer.`);
  } else {
    player.graveyard.push({ ...unit });
    addLog(`${unit.name} van speler ${unit.owner} is dood.`);
  }

  if (!wasPetrified && unit.cardId === "big-ben" && killer) {
    killer.statuses.cannotAct = Math.max(killer.statuses.cannotAct || 0, 1);
    addLog(`${killer.name} kan 1 beurt niks door Big Ben.`);
  }

  if (!wasPetrified && unit.cardId === "geertje") {
    spawnSummonNear("turk", unit.owner, unit.x, unit.y);
    spawnSummonNear("marokkaan", unit.owner, unit.x, unit.y);
    addLog("Geertje is dood: Turk en Marokkaan worden opgeroepen als er plek is.");
  }

  if (!wasPetrified && unit.cardId === "slime-king") {
    spawnSummonNear("slime", unit.owner, unit.x, unit.y);
    spawnSummonNear("slime", unit.owner, unit.x, unit.y);
    spawnSummonNear("slime", unit.owner, unit.x, unit.y);
    addLog("Slime King splitst in 3 Slimes.");
  }

  if (!wasPetrified && unit.cardId === "slime") {
    const spots = [
      { x: unit.x, y: unit.y },
      { x: unit.x + 1, y: unit.y },
      { x: unit.x - 1, y: unit.y },
      { x: unit.x, y: unit.y + 1 },
      { x: unit.x, y: unit.y - 1 }
    ];
    let claimed = 0;
    spots.forEach((spot) => {
      const tile = tileAt(spot.x, spot.y);
      if (!tile || tile.isProtectedBaseZone) return;
      if (tile.territoryOwner !== unit.owner) {
        tile.territoryOwner = unit.owner;
        claimed += 1;
      }
    });
    if (claimed > 0) addLog(`Slime neemt ${claimed} vakjes over voor speler ${unit.owner}.`);
  }

  if (!wasPetrified && unit.statuses.bloodContract && killer && killer.type !== "base") {
    const healAmount = Math.max(0, unit.lastDamageAmount || 0);
    if (healAmount > 0 && (killer.maxHp || 0) > 0) {
      const before = killer.hp;
      killer.hp = Math.min(killer.maxHp, killer.hp + healAmount);
      addLog(`Blood Contract triggert: ${killer.name} healt ${killer.hp - before} HP.`);
    }
  }

  if (!wasPetrified && unit.type === "unit" && !unit.tags?.includes("token")) {
    state.units
      .filter((candidate) => candidate.cardId === "necromancer" && candidate.unitId !== unit.unitId && isUnitAlive(candidate))
      .forEach((necromancer) => {
        const skeleton = spawnTokenInArea("skeleton", necromancer.owner, necromancer.x, necromancer.y, 1);
        if (skeleton) addLog(`${necromancer.name} raiset een Skeleton door ${unit.name}'s death.`);
      });
  }

  state.units = state.units.filter((candidate) => candidate.unitId !== unit.unitId);
  if (state.selectedUnitId === unit.unitId) state.selectedUnitId = null;
  if (state.inspectedUnitId === unit.unitId) state.inspectedUnitId = null;
}

export function spawnSummonNear(cardId, owner, x, y) {
  const card = cards.find((candidate) => candidate.id === cardId);
  if (!card) return null;
  const spots = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
  const spot = spots.find((candidate) => isInsideBoard(candidate.x, candidate.y) && unitsAt(candidate.x, candidate.y).length === 0);
  if (!spot) return null;
  const summon = createUnit(card, owner, spot.x, spot.y);
  summon.isToken = true;
  state.units.push(summon);
  addLog(`${card.name} wordt opgeroepen.`);
  return summon;
}

export function spawnTokenInArea(cardId, owner, x, y, radius = 1) {
  const card = cards.find((candidate) => candidate.id === cardId);
  if (!card) return null;
  const spots = [];
  for (let yy = y - radius; yy <= y + radius; yy += 1) {
    for (let xx = x - radius; xx <= x + radius; xx += 1) {
      spots.push({ x: xx, y: yy });
    }
  }
  const spot = spots.find((candidate) => isInsideBoard(candidate.x, candidate.y) && unitsAt(candidate.x, candidate.y).length === 0);
  if (!spot) return null;
  const summon = createUnit(card, owner, spot.x, spot.y);
  summon.isToken = true;
  state.units.push(summon);
  addLog(`${card.name} wordt opgeroepen.`);
  return summon;
}

export function spawnAntToken(owner, x, y, antCount = 1) {
  const card = cards.find((candidate) => candidate.id === "mier-token");
  if (!card || !isInsideBoard(x, y)) return null;
  const summon = createUnit({ ...card, antCount }, owner, x, y);
  summon.isToken = true;
  syncAntStats(summon);
  state.units.push(summon);
  addLog(`${summon.name} wordt opgeroepen.`);
  return summon;
}

export function decrementStatuses(playerId) {
  state.units
    .filter((unit) => unit.owner === playerId)
    .forEach((unit) => {
      Object.keys(unit.statuses).forEach((key) => {
        unit.statuses[key] -= 1;
        if (unit.statuses[key] <= 0) {
          delete unit.statuses[key];
          if (key === "koffieboost") {
            const boosts = unit.koffieBoostSources || [];
            boosts.forEach((boost) => {
              unit.speed = Math.max(0, unit.speed - (boost.speed || 0));
              unit.damageMultiplier = (unit.damageMultiplier || 1) / (boost.damageMultiplier || 1);
            });
            unit.koffieBoostSources = [];
            addLog(`Koffieboost op ${unit.name} loopt af.`);
          }
          if (key === "koffieCrash") {
            const crashes = unit.koffieCrashSources || [];
            crashes.forEach((crash) => {
              unit.speed = Math.max(0, unit.speed - (crash.speed || 0));
              unit.damageMultiplier = (unit.damageMultiplier || 1) / (crash.damageMultiplier || 1);
            });
            unit.koffieCrashSources = [];
            addLog(`Crash op ${unit.name} loopt af.`);
          }
          if (key === "krabRaveControl" && unit.originalOwnerBeforeKrabRave) {
            const oldOwner = unit.owner;
            unit.owner = unit.originalOwnerBeforeKrabRave;
            unit.originalOwnerBeforeKrabRave = null;
            addLog(`${unit.name} keert terug naar speler ${unit.owner} na Krab Rave.`);
            if (oldOwner !== unit.owner) {
              unit.hasMovedThisTurn = false;
              unit.hasAttackedThisTurn = false;
              unit.hasUsedAbilityThisTurn = false;
            }
          }
        }
      });
      if (unit.cooldownRemaining > 0) unit.cooldownRemaining -= 1;
      if (unit.healCooldownRemaining > 0) unit.healCooldownRemaining -= 1;
      if (unit.hookCooldownRemaining > 0) unit.hookCooldownRemaining -= 1;
      if (unit.mercyReviveCooldownRemaining > 0) unit.mercyReviveCooldownRemaining -= 1;
      if (unit.gustavMoveCooldown > 0) unit.gustavMoveCooldown -= 1;
      if (unit.cardId === "koffieautomaat") unit.koffieUsesThisTurn = 0;
      Object.keys(unit.attackCooldowns || {}).forEach((key) => {
        unit.attackCooldowns[key] -= 1;
        if (unit.attackCooldowns[key] <= 0) delete unit.attackCooldowns[key];
      });
      if (!isPetrified(unit) && unit.sigmaBarrier && !unit.sigmaBarrier.placedUnitId && !unit.sigmaBarrier.destroyed) {
        unit.sigmaBarrier.shield = Math.min(unit.sigmaBarrier.maxShield, unit.sigmaBarrier.shield + 100);
      }
    });
}

export function clearSelection() {
  state.selectedCardIndex = null;
  state.selectedUnitId = null;
  state.inspectedUnitId = null;
  state.currentMode = "idle";
  state.unitActionIntent = "move";
  state.pendingSpell = null;
}

export function endTurn() {
  const player = getPlayer();
  if (player.hand.length > 0) {
    state.selectedCardIndex = null;
    state.selectedUnitId = null;
    state.inspectedUnitId = null;
    state.currentMode = "discarding";
    state.pendingDiscardPlayer = player.id;
    addLog(`Speler ${player.id}: je mag 1 kaart weggooien voor +1 energie volgende beurt, of eindigen zonder discard.`);
    return false;
  }
  finishEndTurn();
  return true;
}

export function skipEndTurnDiscard() {
  const player = getPlayer(state.pendingDiscardPlayer);
  if (!player || player.id !== state.activePlayer || state.currentMode !== "discarding") return false;
  addLog(`Speler ${player.id} eindigt de beurt zonder kaart weg te gooien.`);
  state.pendingDiscardPlayer = null;
  finishEndTurn();
  return true;
}

export function discardCardForEndTurn(index) {
  const player = getPlayer(state.pendingDiscardPlayer);
  if (!player || player.id !== state.activePlayer) return false;
  const card = player.hand[index];
  if (!card) return false;
  player.hand.splice(index, 1);
  player.graveyard.push({ ...card, zoneReason: "end-turn-discard" });
  player.nextTurnEnergyBonus = (player.nextTurnEnergyBonus || 0) + 1;
  addLog(`Speler ${player.id} gooit ${card.name} weg en krijgt volgende beurt +1 energie.`);
  state.pendingDiscardPlayer = null;
  finishEndTurn();
  return true;
}

function finishEndTurn() {
  clearEndOfTurnEffects(state.activePlayer);
  clearSelection();
  state.activePlayer = getEnemyPlayerId();
  if (state.activePlayer === 1) state.turn += 1;
  runUpkeep(state.activePlayer);
  checkWinCondition();
}

function clearEndOfTurnEffects(playerId) {
  state.units
    .filter((unit) => unit.owner === playerId && unit.statuses.goldPotion)
    .forEach((unit) => {
      delete unit.statuses.goldPotion;
      addLog(`Gold Potion op ${unit.name} loopt af.`);
    });
}

function runUpkeep(playerId) {
  const player = getPlayer(playerId);
  const bonus = player.nextTurnEnergyBonus || 0;
  player.energy = Math.min(MAX_ENERGY, player.energy + BASE_ENERGY_PER_TURN + bonus);
  player.nextTurnEnergyBonus = 0;
  drawCards(player.id, HAND_SIZE - player.hand.length);
  applyBasePressure(player.id);
  spawnQueenAnts(player.id);
  applyPolitiekeSteun(player.id);
  applyManagerContracts(player.id);
  applyTheeBurn(player.id);
  state.units
    .forEach((unit) => {
      if (unit.cardId === "iron-titan") unit.ignoredFirstHitThisTurn = false;
      if (unit.owner !== player.id) return;
      unit.hasMovedThisTurn = false;
      unit.hasAttackedThisTurn = false;
      unit.hasUsedAbilityThisTurn = false;
      unit.wasAttackedThisTurn = false;
      unit.damageTakenThisTurn = 0;
      unit.extraMoveAvailable = false;
    });
  decrementStatuses(player.id);
  applyStartTurnEffects(player.id);
  applyRadiationZones(player.id);
  tickRadiationZones(player.id);
  addLog(`Upkeep speler ${player.id}: +${BASE_ENERGY_PER_TURN + bonus} energie, hand aangevuld tot ${player.hand.length}/${HAND_SIZE}.`);
  addLog(`Speler ${player.id} is aan de beurt met ${player.energy} energie.`);
}

function spawnQueenAnts(playerId) {
  state.units
    .filter((unit) => unit.owner === playerId && unit.cardId === "mierenkoningin" && !isPetrified(unit))
    .forEach((queen) => {
      const spots = getFreeAdjacentSpots(queen.x, queen.y).slice(0, 3);
      if (!spots.length) {
        addLog("Mierenkoningin vindt geen vrij vakje voor Mier x1.");
        return;
      }
      spots.forEach((spot) => spawnAntToken(playerId, spot.x, spot.y, 1));
      addLog(`Mierenkolonie spawnt ${spots.length} Mier${spots.length === 1 ? "" : "en"} x1 rond de Mierenkoningin.`);
    });
}

function applyPolitiekeSteun(playerId) {
  const politici = state.units.filter((unit) => unit.owner === playerId && unit.cardId === "politicus" && !isPetrified(unit));
  state.units
    .filter((unit) => unit.owner === playerId && unit.type === "unit" && unit.cardId !== "politicus")
    .forEach((unit) => {
      const supporter = politici.find((politicus) => Math.abs(politicus.x - unit.x) <= 1 && Math.abs(politicus.y - unit.y) <= 1);
      const currentSupporterAlive = unit.supportedByPoliticusId && getUnit(unit.supportedByPoliticusId);
      if (!supporter) {
        if (!currentSupporterAlive && unit.politiekeSteunShield) {
          unit.attachedShield = Math.max(0, (unit.attachedShield || 0) - unit.politiekeSteunShield);
          unit.maxAttachedShield = Math.max(0, (unit.maxAttachedShield || 0) - unit.politiekeSteunShield);
          unit.politiekeSteunShield = 0;
          unit.supportedByPoliticusId = null;
        }
        return;
      }
      const desiredShield = Math.floor((unit.maxHp || 0) * 0.1);
      const currentShield = unit.politiekeSteunShield || 0;
      if (desiredShield > currentShield) {
        const gained = desiredShield - currentShield;
        unit.attachedShield = (unit.attachedShield || 0) + gained;
        unit.maxAttachedShield = (unit.maxAttachedShield || 0) + gained;
      } else if (desiredShield < currentShield) {
        const lost = currentShield - desiredShield;
        unit.attachedShield = Math.max(0, (unit.attachedShield || 0) - lost);
        unit.maxAttachedShield = Math.max(0, (unit.maxAttachedShield || 0) - lost);
      }
      unit.politiekeSteunShield = desiredShield;
      unit.supportedByPoliticusId = supporter.unitId;
    });
}

function applyManagerContracts(playerId) {
  state.units.slice()
    .filter((unit) => unit.owner === playerId && unit.statuses.managerBuff && !isPetrified(unit))
    .forEach((unit) => {
      const manager = getUnit(unit.managerBuffSourceId);
      const damage = Math.floor((unit.maxHp || 0) * 0.1);
      if (damage <= 0) return;
      applyStatusDamage(unit, damage, "Burn-out Contract");
      if (!isUnitAlive(unit)) removeUnit(unit, manager || null);
      if (manager && (manager.maxHp || 0) > 0) {
        const before = manager.hp;
        manager.hp = Math.min(manager.maxHp, manager.hp + damage);
        addLog(`Burn-out Contract: ${unit.name} verliest ${damage} HP en Manager healt ${manager.hp - before}.`);
      } else {
        addLog(`Burn-out Contract: ${unit.name} verliest ${damage} HP.`);
      }
    });
}

function applyTheeBurn(playerId) {
  state.units.slice()
    .filter((unit) => unit.owner === playerId && unit.theeBurnStacks?.length)
    .forEach((unit) => {
      const stacks = unit.theeBurnStacks.filter((turns) => turns > 0);
      if (!stacks.length) {
        unit.theeBurnStacks = [];
        return;
      }
      const damage = stacks.length * 25;
      applyStatusDamage(unit, damage, "Thee Burn");
      if (!isUnitAlive(unit)) removeUnit(unit);
      unit.theeBurnStacks = stacks.map((turns) => turns - 1).filter((turns) => turns > 0);
      addLog(`${unit.name} krijgt ${damage} Thee Burn damage (${stacks.length} stack${stacks.length === 1 ? "" : "s"}).`);
    });
}

export function getFreeAdjacentSpots(x, y) {
  const spots = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      const spot = { x: x + dx, y: y + dy };
      if (isInsideBoard(spot.x, spot.y) && unitsAt(spot.x, spot.y).length === 0) spots.push(spot);
    }
  }
  return spots;
}

export function getFreeOrthogonalSpot(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ].find((spot) => isInsideBoard(spot.x, spot.y) && unitsAt(spot.x, spot.y).length === 0);
}

function applyBasePressure(playerId) {
  const base = getBase(playerId);
  if (!base) return;
  const enemyUnits = state.units.filter((unit) => {
    if (unit.owner === playerId || unit.type === "base") return false;
    if (!unit.attacks?.some((attack) => (attack.damage || 0) > 0)) return false;
    const tile = tileAt(unit.x, unit.y);
    if (!tile || tile.protectedForPlayer !== playerId) return false;
    return !unitsAt(unit.x, unit.y).some((candidate) => candidate.owner === playerId && candidate.type !== "base");
  });
  if (!enemyUnits.length) return;
  const percent = enemyUnits.length * 0.05;
  const damage = Math.floor(base.hp * percent);
  if (damage <= 0) return;
  const before = base.hp;
  base.hp = Math.max(1, base.hp - damage);
  addLog(`Base Pressure: ${enemyUnits.length} enemy unit${enemyUnits.length === 1 ? "" : "s"} in P${playerId} protected gebied zonder eigen unit. Base ${before} -> ${base.hp}.`);
}

function applyRadiationZones(activePlayerId) {
  if (!state.radiationZones.length) return;
  state.units.slice()
    .filter((unit) => unit.type !== "base")
    .forEach((unit) => {
      const inZone = state.radiationZones.some((zone) => (
        unit.x >= zone.x - 1
        && unit.x <= zone.x + 1
        && unit.y >= zone.y - 1
        && unit.y <= zone.y + 1
      ));
      if (!inZone) return;
      if ((unit.maxHp || 0) <= 0) {
        addLog(`Upkeep speler ${activePlayerId}: ${unit.name} krijgt true radiation damage en verdwijnt.`);
        removeUnit(unit);
        return;
      }
      unit.hp -= 100;
      addLog(`Upkeep speler ${activePlayerId}: ${unit.name} krijgt 100 true radiation damage.`);
      if (unit.hp <= 0) removeUnit(unit);
    });
}

function tickRadiationZones(ownerId) {
  state.radiationZones = state.radiationZones
    .map((zone) => zone.owner === ownerId ? { ...zone, turnsRemaining: zone.turnsRemaining - 1 } : zone)
    .filter((zone) => zone.turnsRemaining > 0);
}

function applyStartTurnEffects(playerId) {
  state.units
    .filter((unit) => unit.owner === playerId && (unit.statuses.radiation || unit.statuses.mindStoneDrain || unit.statuses.wither))
    .forEach((unit) => {
      if (unit.statuses.radiation) {
        if (unit.cardId !== "bunker" && unit.cardId !== "trump") {
          applyStatusDamage(unit, 100, "radiation");
          addLog(`${unit.name} krijgt 100 radiation damage.`);
        }
      }
      if (unit.statuses.mindStoneDrain && getUnit(unit.unitId)) {
        const total = Math.max(1, (unit.maxHp || 0) + (unit.maxShield || unit.baseShield || 0));
        const amount = Math.ceil(total * 0.2);
        applyStatusDamage(unit, amount, "Mind Stone drain");
        addLog(`${unit.name} verliest ${amount} door Mind Stone.`);
      }
      if (unit.statuses.wither && getUnit(unit.unitId)) {
        if ((unit.maxHp || 0) <= 0) {
          addLog(`${unit.name} verdwijnt door 75 true Wither damage.`);
          removeUnit(unit);
        } else {
          unit.hp -= 75;
          addLog(`${unit.name} krijgt 75 true Wither damage.`);
        }
      }
      if (!isUnitAlive(unit)) removeUnit(unit);
    });
}

function applyStatusDamage(unit, amount, sourceName) {
  let remaining = amount;
  if (unit.attachedShield > 0) {
    const before = unit.attachedShield;
    const blocked = Math.min(unit.attachedShield, remaining);
    unit.attachedShield -= blocked;
    remaining -= blocked;
    addLog(`${unit.name}'s extra shield blokt ${sourceName} (${before} -> ${unit.attachedShield}).`);
    if (remaining <= 0) return false;
  }
  if (unit.shield > 0) {
    const before = unit.shield;
    const blocked = Math.min(unit.shield, remaining);
    unit.shield -= blocked;
    remaining -= blocked;
    addLog(`${unit.name}'s shield blokt ${sourceName} (${before} -> ${unit.shield}).`);
    if (remaining <= 0) return false;
  }
  if ((unit.maxHp || 0) <= 0) return true;
  unit.hp -= remaining;
  return true;
}

export function checkWinCondition() {
  for (const player of state.players) {
    const hasBase = !!getBase(player.id);
    const hasUnits = activeUnits(player.id).length > 0;
    const canDraw = player.baseAlive && player.deck.length > 0;
    const hasHand = player.hand.length > 0;
    if (!hasBase || (!hasUnits && !canDraw && !hasHand)) {
      addLog(`Speler ${getEnemyPlayerId(player.id)} wint!`);
      return getEnemyPlayerId(player.id);
    }
  }
  return null;
}
