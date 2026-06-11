import { cardById, cards } from "./cards.js";
import { activateAbility, applyDamage, attackGustavTile, attackUnit, canAttack, makeBaseAttackTarget, moveUnit, playCard } from "./actions.js";
import { useSpell, useUnitAbility } from "./effects.js";
import { addLog, BASE_ENERGY_PER_TURN, claimTerritory, createUnit, discardCardForEndTurn, endTurn, getBase, getPlayer, HAND_SIZE, MAX_ENERGY, resetGame, spawnAntToken, state, tileAt } from "./gameState.js";

const tests = [
  ["all", "Run all tests", runAllTests],
  ["movement", "Test movement", () => runOne("Movement", testMovement)],
  ["melee", "Test melee combat", () => runOne("Melee combat", testMeleeCombat)],
  ["ranged", "Test ranged combat", () => runOne("Ranged combat", testRangedCombat)],
  ["junkrat", "Test Junkrat", () => runOne("Junkrat", testJunkrat)],
  ["buildings", "Test buildings", () => runOne("Buildings", testBuildings)],
  ["territory", "Test territory", () => runOne("Territory", testTerritory)],
  ["draw", "Test card draw", () => runOne("Card draw", testCardDraw)],
  ["graveyard", "Test graveyard", () => runOne("Graveyard", testGraveyard)],
  ["discard", "Test end-turn discard", () => runOne("End-turn discard", testEndTurnDiscard)],
  ["upkeep", "Test upkeep", () => runOne("Upkeep", testUpkeep)],
  ["iron-titan", "Test Iron Titan", () => runOne("Iron Titan", testIronTitan)],
  ["sigma-barrier", "Test Sigma barrier", () => runOne("Sigma barrier", testSigmaBarrier)],
  ["balance", "Test balance patch", () => runOne("Balance patch", testBalancePatch)],
  ["knight", "Test Knight", () => runOne("Knight", testKnight)],
  ["ants", "Test mieren", () => runOne("Mieren", testAnts)],
  ["gustav", "Test Schwerer Gustav", () => runOne("Schwerer Gustav", testGustav)],
  ["medusa", "Test Medusa", () => runOne("Medusa", testMedusa)],
  ["a10", "Test A-10", () => runOne("A-10 Thunderbolt", testA10)],
  ["abilities", "Test abilities", () => runOne("Abilities", testAbilities)]
];

let renderCallback = () => {};

export function bindTestPanel(render) {
  renderCallback = render;
  const root = document.querySelector("#testButtons");
  if (!root) return;
  root.innerHTML = tests.map(([id, label]) => `<button type="button" data-test="${id}">${label}</button>`).join("");
  root.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const test = tests.find(([id]) => id === button.dataset.test);
      test?.[2]();
      renderCallback();
    });
  });
}

function runAllTests() {
  const results = [
    runCase("Start", testStart),
    runCase("Card draw", testCardDraw),
    runCase("Movement", testMovement),
    runCase("Melee combat", testMeleeCombat),
    runCase("Ranged combat", testRangedCombat),
    runCase("Junkrat", testJunkrat),
    runCase("Buildings", testBuildings),
    runCase("Territory", testTerritory),
    runCase("Graveyard", testGraveyard),
    runCase("End-turn discard", testEndTurnDiscard),
    runCase("Upkeep", testUpkeep),
    runCase("Iron Titan", testIronTitan),
    runCase("Sigma barrier", testSigmaBarrier),
    runCase("Balance patch", testBalancePatch),
    runCase("Knight", testKnight),
    runCase("Mieren", testAnts),
    runCase("Schwerer Gustav", testGustav),
    runCase("Medusa", testMedusa),
    runCase("A-10 Thunderbolt", testA10),
    runCase("Abilities", testAbilities)
  ];
  showResults(results);
}

function runOne(name, fn) {
  showResults([runCase(name, fn)]);
}

function runCase(name, fn) {
  try {
    resetGame();
    fn();
    return { name, pass: true, detail: "PASS" };
  } catch (error) {
    return { name, pass: false, detail: error.message };
  }
}

function showResults(results) {
  const root = document.querySelector("#testResults");
  const lines = results.map((result) => `${result.pass ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
  if (root) root.innerHTML = lines.map((line) => `<div class="${line.startsWith("PASS") ? "pass" : "fail"}">${line}</div>`).join("");
  lines.forEach((line) => {
    console.log(line);
    addLog(line);
  });
  resetGame();
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function addUnit(id, owner, x, y) {
  const unit = createUnit(cardById[id], owner, x, y);
  state.units.push(unit);
  return unit;
}

function clearNonBases() {
  state.units = state.units.filter((unit) => unit.type === "base");
}

function setEnergy(playerId, energy) {
  getPlayer(playerId).energy = energy;
}

function testStart() {
  expect(state.boardRows === 9 && state.boardCols === 9, "expected 9x9 board");
  expect(state.units.filter((unit) => unit.type === "base").every((base) => base.maxHp === 2500 && base.hp === 2500), "both bases should have 2500 HP");
  expect(getPlayer(1).hand.length === HAND_SIZE && getPlayer(2).hand.length === HAND_SIZE, "both players need 5 hand cards");
  const tokenIds = ["orisa-barrier", "sigma-barrier", "turk", "marokkaan", "slime", "pillager", "gta-cop", "skeleton", "mier-token"];
  const deckCards = cards.filter((card) => !tokenIds.includes(card.id)).length;
  expect(getPlayer(1).deck.length === deckCards - HAND_SIZE && getPlayer(2).deck.length === deckCards - HAND_SIZE, "library count should match deck minus starting hand");
  expect(getPlayer(1).energy === BASE_ENERGY_PER_TURN && getPlayer(2).energy === 0, "P1 starts with 3 energy, P2 gains energy at first turn start");
  expect(MAX_ENERGY === 10, "max energy should be 10");
  expect(getBase(1).x === -1 && getBase(2).y === -1, "bases should live outside the normal board");
  expect(state.tiles.filter((tile) => tile.territoryOwner === 1).length === 18, "P1 start territory should be the bottom two protected rows");
  expect(state.tiles.filter((tile) => tile.territoryOwner === 2).length === 18, "P2 start territory should be the top two protected rows");
}

function testCardDraw() {
  const player = getPlayer(1);
  player.hand = [cardById.steve];
  player.deck = [cardById.jet];
  setEnergy(1, 6);
  expect(playCard(0, 0, 7), "expected Steve to be playable in deploy zone");
  expect(player.energy === 4, "playing Steve should use its card cost");
  expect(player.hand.length === 1 && player.deck.length === 0, "card should be replaced from library");
}

function testMovement() {
  clearNonBases();
  const unit = addUnit("steve", 1, 4, 7);
  setEnergy(1, 3);
  expect(moveUnit(unit, 4, 6), "expected first move to work");
  expect(unit.hasMovedThisTurn, "unit should be marked as moved");
  expect(getPlayer(1).energy === 3, "move should not cost energy");
  expect(!moveUnit(unit, 4, 5), "unit should not move twice in one turn");
}

function testMeleeCombat() {
  clearNonBases();
  const attacker = addUnit("steve", 1, 4, 4);
  const target = addUnit("turk", 2, 4, 3);
  setEnergy(1, 5);
  expect(!canAttack(attacker, target), "melee should not attack adjacent target");
  target.y = 4;
  expect(canAttack(attacker, target), "melee should attack same-tile target");
  expect(attackUnit(attacker, target), "same-tile melee attack should execute");
  expect(getPlayer(2).graveyard.some((unit) => unit.cardId === "turk"), "dead target should enter graveyard");
}

function testRangedCombat() {
  clearNonBases();
  const attacker = addUnit("trump", 1, 4, 4);
  const target = addUnit("steve", 2, 4, 5);
  setEnergy(1, 2);
  expect(attackUnit(attacker, target), "ranged adjacent attack should execute");
  expect(target.shield === 0 && target.hp === 300, "a single hit should break shield but not overflow to HP");
}

function testJunkrat() {
  clearNonBases();
  const cases = [
    { distance: 0, targetX: 4, targetY: 4, expectedHp: 150 },
    { distance: 1, targetX: 4, targetY: 3, expectedHp: 200 },
    { distance: 2, targetX: 4, targetY: 2, expectedHp: 250 },
    { distance: 3, targetX: 4, targetY: 1, expectedHp: 350 }
  ];
  cases.forEach((testCase) => {
    clearNonBases();
    const attacker = addUnit("junkrat", 1, 4, 4);
    const target = addUnit("pam", 2, testCase.targetX, testCase.targetY);
    expect(attackUnit(attacker, target), `Junkrat should attack at distance ${testCase.distance}`);
    expect(target.hp === testCase.expectedHp, `Junkrat distance ${testCase.distance} damage should match card text`);
  });
}

function testBuildings() {
  clearNonBases();
  const bunker = addUnit("bunker", 1, 4, 7);
  const steve = addUnit("steve", 1, 4, 6);
  setEnergy(1, 2);
  expect(moveUnit(steve, 4, 7), "unit should enter friendly bunker");
  expect(steve.insideBuildingId === bunker.unitId, "unit should record containing building");
  applyDamage(steve, 200);
  expect(steve.hp === 300, "bunkerShield should prevent unit damage");
  expect(bunker.hp === 500, "bunker should take full damage");
}

function testTerritory() {
  clearNonBases();
  const unit = addUnit("steve", 1, 4, 7);
  setEnergy(1, 2);
  expect(moveUnit(unit, 4, 6), "movement should work");
  expect(tileAt(4, 6).territoryOwner === 1 && tileAt(3, 6).territoryOwner === 1 && tileAt(5, 6).territoryOwner === 1, "move should claim destination plus left/right");
  expect(claimTerritory(2, 8, 4) === 0 && tileAt(4, 8).territoryOwner === 1, "enemy cannot claim protected P1 base row");
}

function testGraveyard() {
  clearNonBases();
  const target = addUnit("steve", 2, 4, 4);
  applyDamage(target, 999, null, { ignoreShield: true, ignoreTitanHide: true });
  expect(getPlayer(2).graveyard.some((unit) => unit.cardId === "steve"), "dead unit should enter owner graveyard");
  const player = getPlayer(1);
  player.hand = [cardById.f2];
  player.deck = [cardById.jet];
  setEnergy(1, 5);
  addUnit("turk", 2, 5, 5);
  expect(playCard(0, 5, 5), "F2 should kill enemy");
  expect(player.graveyard.some((card) => card.id === "f2"), "used spell should enter caster graveyard");
}

function testEndTurnDiscard() {
  const player = getPlayer(1);
  player.hand = [cardById.steve, cardById.jet];
  const nextPlayer = getPlayer(2);
  nextPlayer.hand = [cardById.pam];
  nextPlayer.deck = [cardById.steve, cardById.jet, cardById.trump, cardById.bunker];
  const p2EnergyBefore = getPlayer(2).energy;
  expect(!endTurn(), "end turn should wait for a discard when hand has cards");
  expect(state.currentMode === "discarding" && state.pendingDiscardPlayer === 1, "game should enter discard mode for active player");
  expect(discardCardForEndTurn(0), "discarding a card should finish the turn");
  expect(state.activePlayer === 2, "turn should pass to player 2 after discard");
  expect(player.hand.length === 1, "one card should be discarded");
  expect(player.graveyard.some((card) => card.id === "steve" && card.zoneReason === "end-turn-discard"), "discarded card should enter graveyard");
  expect(getPlayer(2).energy === Math.min(MAX_ENERGY, p2EnergyBefore + BASE_ENERGY_PER_TURN), "next player should gain energy after discard");
  expect(getPlayer(2).hand.length === HAND_SIZE, "upkeep should refill next player's hand to 5");
}

function testUpkeep() {
  clearNonBases();
  const orisa = addUnit("orisa", 1, 4, 7);
  const victim = addUnit("steve", 2, 4, 4);
  state.radiationZones = [{ x: 4, y: 4, owner: 1, turnsRemaining: 3 }];
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  setEnergy(1, 3);
  expect(activateAbility(orisa, { x: 4, y: 6 }), "Orisa should place barrier on chosen range-1 tile");
  expect(state.units.some((unit) => unit.cardId === "orisa-barrier" && unit.x === 4 && unit.y === 6), "Orisa barrier should be placed on clicked tile");
  expect(orisa.cooldownRemaining === 6, "Orisa cooldown should start at 6");
  endTurn();
  expect(state.activePlayer === 2, "empty hand should pass to player 2 immediately");
  expect(orisa.cooldownRemaining === 6, "Orisa cooldown should not tick on opponent upkeep");
  expect(victim.hp === 200, "radiation should trigger on upkeep and damage units in zone");
  expect(state.radiationZones[0].turnsRemaining === 3, "Nuke zone should not tick down on non-owner upkeep");
  getPlayer(2).hand = [];
  endTurn();
  expect(state.activePlayer === 1, "second empty-hand end turn should pass back to player 1");
  expect(orisa.cooldownRemaining === 5, "Orisa cooldown should tick on owner's upkeep");
  expect(state.radiationZones[0].turnsRemaining === 2, "Nuke zone duration should tick on owner upkeep");
}

function testIronTitan() {
  clearNonBases();
  const titan = addUnit("iron-titan", 1, 4, 4);
  const attacker = addUnit("shield-breaker", 2, 4, 4);
  expect(titan.cost === 5, "Iron Titan cost should be 5");
  expect(titan.maxHp === 0 && titan.hp === 1, "Iron Titan should have hidden 1 HP");
  expect(titan.shield === 450 && titan.maxShield === 450, "Iron Titan shield should be 450");
  expect(titan.attacks.some((attack) => attack.name === "melee" && attack.damage === 200), "Iron Titan melee damage should be 200");
  applyDamage(titan, 100, attacker);
  expect(titan.shield === 450, "Titan Hide should ignore the first hit");
  applyDamage(titan, 100, attacker);
  expect(titan.shield === 350, "second hit in same turn should deal damage");
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  endTurn();
  expect(titan.ignoredFirstHitThisTurn === false, "Titan Hide should reset at upkeep");
  applyDamage(titan, 100, attacker);
  expect(titan.shield === 350, "first hit after reset should be ignored");
}

function testSigmaBarrier() {
  clearNonBases();
  const sigma = addUnit("sigma", 1, 4, 4);
  const friendly = addUnit("pam", 1, 4, 5);
  setEnergy(1, 10);
  expect(activateAbility(sigma, { x: 4, y: 5 }), "Sigma should place barrier on a friendly-occupied tile");
  const barrier = state.units.find((unit) => unit.cardId === "sigma-barrier");
  expect(barrier && barrier.x === friendly.x && barrier.y === friendly.y && barrier.maxHp === 0 && barrier.hp === 1 && barrier.shield === 700, "Sigma barrier should be shield-only and share a tile with friendly units");
  applyDamage(barrier, 250);
  expect(barrier.shield === 450, "Sigma barrier should take shield damage");
  sigma.hasUsedAbilityThisTurn = false;
  expect(activateAbility(sigma, { x: sigma.x, y: sigma.y }), "Sigma should recall barrier");
  expect(!state.units.some((unit) => unit.unitId === barrier.unitId), "recalled Sigma barrier should leave the board");
  expect(sigma.sigmaBarrier.shield === 450, "Sigma should remember recalled barrier shield");
  sigma.hasUsedAbilityThisTurn = false;
  expect(activateAbility(sigma, { x: sigma.x, y: sigma.y }), "Sigma should place barrier on his own tile");
  const selfBarrier = state.units.find((unit) => unit.cardId === "sigma-barrier");
  expect(selfBarrier.x === sigma.x && selfBarrier.y === sigma.y, "Sigma self tile should be valid for barrier placement");
  sigma.hasUsedAbilityThisTurn = false;
  expect(activateAbility(sigma, { x: sigma.x, y: sigma.y }), "Sigma should recall self barrier");
  sigma.hasUsedAbilityThisTurn = false;
  addUnit("steve", 2, 3, 4);
  expect(!activateAbility(sigma, { x: 3, y: 4 }), "Sigma should not place barrier on an enemy unit");
  addUnit("bunker", 1, 5, 4);
  expect(!activateAbility(sigma, { x: 5, y: 4 }), "Sigma should not place barrier on a building");
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  endTurn();
  getPlayer(2).hand = [];
  endTurn();
  expect(sigma.sigmaBarrier.shield === 550, "Sigma barrier should heal 100 shield on owner's upkeep while recalled");
}

function testBalancePatch() {
  clearNonBases();
  const thanos = addUnit("thanos", 1, 4, 4);
  const thanosTarget = addUnit("steve", 2, 4, 5);
  setEnergy(1, 6);
  expect(attackUnit(thanos, thanosTarget), "Thanos should be able to attack first");
  expect(!activateAbility(thanos, thanosTarget), "Thanos should not Powerpunch after attacking this turn");

  clearNonBases();
  const gooier = addUnit("bom-gooier", 1, 4, 4);
  const burstTarget = addUnit("steve", 2, 4, 4);
  applyDamage(gooier, 999);
  expect(burstTarget.shield === 0 && burstTarget.hp === 200, "Bom Gooier death burst should deal 150 to enemies on same tile");

  clearNonBases();
  const slimeKing = addUnit("slime-king", 1, 4, 4);
  applyDamage(slimeKing, 999);
  expect(state.units.filter((unit) => unit.cardId === "slime" && unit.owner === 1).length === 3, "Slime King should split into 3 Slimes on death");

  clearNonBases();
  const slime = addUnit("slime", 1, 4, 4);
  [tileAt(4, 4), tileAt(5, 4), tileAt(3, 4), tileAt(4, 5), tileAt(4, 3)].forEach((tile) => {
    tile.territoryOwner = 2;
  });
  applyDamage(slime, 999);
  expect([tileAt(4, 4), tileAt(5, 4), tileAt(3, 4), tileAt(4, 5), tileAt(4, 3)].every((tile) => tile.territoryOwner === 1), "Slime death should claim territory in range 1");

  clearNonBases();
  const wallWrecker = addUnit("wall-wrecker", 1, 4, 4);
  const bunker = addUnit("bunker", 2, 4, 4);
  expect(attackUnit(wallWrecker, bunker), "Wall Wrecker should hit bunker on same tile");
  expect(bunker.hp === 400, "Wall Wrecker should deal 150 x2 to bunker-type buildings");

  clearNonBases();
  const sniper = addUnit("sniper-monkey", 1, 4, 4);
  const trump = addUnit("trump", 1, 5, 6);
  const target = addUnit("steve", 2, 4, 6);
  expect(attackUnit(sniper, target), "Sniper Monkey should attack at range");
  expect(target.statuses.targeted >= 4, "Sniper Monkey should mark target for 4 turns");
  expect(attackUnit(trump, target), "Trump targeted-fire should attack marked target");
  expect(!state.units.includes(target), "targeted-fire hit should get 50% bonus damage");
  expect(!target.statuses.targeted, "targeted-fire should consume targeted and not reapply it in the same attack");

  clearNonBases();
  const blockedShooter = addUnit("sniper-monkey", 1, 4, 4);
  addUnit("turk", 2, 4, 5);
  const blockedShotTarget = addUnit("pam", 2, 4, 6);
  expect(!canAttack(blockedShooter, blockedShotTarget), "ranged units without pierce should not shoot through another unit");
  const pierceShooter = addUnit("big-ben", 1, 6, 4);
  const pierceBlocker = addUnit("turk", 2, 6, 5);
  const pierceTarget = addUnit("pam", 2, 6, 6);
  expect(canAttack(pierceShooter, pierceTarget), "Big Ben should pierce through units");

  clearNonBases();
  const meleeScopeTarget = addUnit("steve", 1, 4, 4);
  expect(!useSpell(cardById["sniper-scope"], 4, 4, meleeScopeTarget.unitId), "Sniper Scope should fail on melee units");
  const fakeRanged = addUnit("steve", 1, 5, 4);
  fakeRanged.tags.push("ranged");
  expect(!useSpell(cardById["sniper-scope"], 5, 4, fakeRanged.unitId), "Sniper Scope should fail on units with ranged tag but no ranged attack");
  const scoped = addUnit("roadhog", 1, 4, 4);
  const scopedTarget = addUnit("pam", 2, 4, 2);
  expect(!canAttack(scoped, scopedTarget), "Roadhog ranged attack should not reach range 2 before Sniper Scope");
  expect(useSpell(cardById["sniper-scope"], 4, 4, scoped.unitId), "Sniper Scope should work on a true ranged attack");
  expect(canAttack(scoped, scopedTarget), "Sniper Scope should increase normal ranged attack range by 1");

  clearNonBases();
  addUnit("pillager-captain", 1, 4, 4);
  const diagonalPillager = addUnit("pillager", 1, 5, 5);
  const diagonalTarget = addUnit("pam", 2, 5, 6);
  expect(attackUnit(diagonalPillager, diagonalTarget), "Pillager in captain 3x3 diagonal should attack");
  expect(diagonalTarget.hp === 275, "Raid Banner should give +50 damage in diagonals");
  const farPillager = addUnit("pillager", 1, 7, 7);
  const farPillagerTarget = addUnit("pam", 2, 7, 6);
  expect(attackUnit(farPillager, farPillagerTarget), "Pillager outside captain 3x3 should attack");
  expect(farPillagerTarget.hp === 325, "Raid Banner should not buff units outside 3x3");
  const enemyPillager = addUnit("pillager", 2, 3, 3);
  const enemyPillagerTarget = addUnit("pam", 1, 3, 2);
  expect(attackUnit(enemyPillager, enemyPillagerTarget), "Enemy token near captain should attack");
  expect(enemyPillagerTarget.hp === 325, "Raid Banner should not buff enemy tokens");

  clearNonBases();
  const shielded = addUnit("miner", 2, 4, 4);
  const shieldAttacker = addUnit("trump", 1, 4, 4);
  expect(attackUnit(shieldAttacker, shielded), "single hit should attack shielded unit");
  expect(shielded.shield === 0 && shielded.hp === 600, "single hit should break shield without overflowing to HP");

  clearNonBases();
  const caster = getPlayer(1);
  caster.hand = [cardById["mind-stone"]];
  caster.deck = [];
  const stolen = addUnit("steve", 2, 4, 4);
  setEnergy(1, 6);
  expect(playCard(0, 4, 4), "Mind Stone should steal an enemy unit");
  expect(stolen.owner === 1 && stolen.statuses.mindStoneDrain, "stolen unit should belong to caster and receive drain status");
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  endTurn();
  getPlayer(2).hand = [];
  endTurn();
  expect(stolen.shield === 0 && stolen.hp === 280, "Mind Stone drain should deal 20% of max HP plus shield on owner's upkeep");

  clearNonBases();
  const ranged = addUnit("trump", 1, 4, 4);
  addUnit("steve", 2, 4, 4);
  const outsideTarget = addUnit("pam", 2, 4, 5);
  const sameTileTarget = state.units.find((unit) => unit.owner === 2 && unit.x === 4 && unit.y === 4);
  expect(!canAttack(ranged, outsideTarget), "contested ranged unit should not attack outside its tile");
  expect(canAttack(ranged, sameTileTarget), "contested ranged unit should still attack an enemy on the same tile");

  clearNonBases();
  const trueDamageTarget = addUnit("sigma-barrier", 2, 4, 4);
  applyDamage(trueDamageTarget, 1, null, { ignoreShield: true, ignoreTitanHide: true });
  expect(!state.units.includes(trueDamageTarget), "shield-only units should die from any true damage");

  clearNonBases();
  const stackSpellCaster = getPlayer(1);
  stackSpellCaster.hand = [cardById.f2];
  stackSpellCaster.deck = [];
  setEnergy(1, 10);
  const ignoredStackTarget = addUnit("pam", 2, 4, 4);
  const clickedStackTarget = addUnit("steve", 2, 4, 4);
  expect(playCard(0, 4, 4, clickedStackTarget.unitId), "F2 should use the clicked stacked unit as target");
  expect(state.units.includes(ignoredStackTarget), "F2 should not hit the first stacked enemy when another unit was clicked");
  expect(!state.units.includes(clickedStackTarget), "F2 should kill the clicked stacked enemy");

  clearNonBases();
  expect(!useSpell({ id: "unknown-spell", name: "Unknown Spell", type: "spell" }, 4, 4), "unknown spells should fail instead of being consumed");
  expect(!useUnitAbility(addUnit("steve", 1, 4, 4)), "unknown unit abilities should fail instead of spending energy");

  clearNonBases();
  const enderman = addUnit("enderman", 2, 4, 4);
  const sniperAttacker = addUnit("sniper-monkey", 1, 4, 6);
  expect(attackUnit(sniperAttacker, enderman), "ranged attack should be attempted on Enderman");
  expect(enderman.hp === 450 && (enderman.x !== 4 || enderman.y !== 4), "Enderman should dodge ranged damage and teleport");

  clearNonBases();
  const dodgedGeertje = addUnit("geertje", 1, 4, 5);
  const dodgingEnderman = addUnit("enderman", 2, 4, 4);
  expect(attackUnit(dodgedGeertje, dodgingEnderman), "Geertje attack should be attempted on Enderman");
  expect(!state.units.some((unit) => unit.owner === 1 && (unit.cardId === "turk" || unit.cardId === "marokkaan")), "Geertje should not summon when attack deals 0 damage");
  clearNonBases();
  const hitGeertje = addUnit("geertje", 1, 4, 4);
  const hitTarget = addUnit("pam", 2, 4, 5);
  expect(attackUnit(hitGeertje, hitTarget), "Geertje should hit a normal target");
  expect(state.units.some((unit) => unit.owner === 1 && (unit.cardId === "turk" || unit.cardId === "marokkaan")), "Geertje should summon after a hit");

  clearNonBases();
  const closeEnderman = addUnit("enderman", 2, 4, 4);
  const closeRanged = addUnit("trump", 1, 4, 4);
  expect(attackUnit(closeRanged, closeEnderman), "ranged unit on same tile should be able to hit Enderman");
  expect(closeEnderman.hp === 200 && closeEnderman.x === 4 && closeEnderman.y === 4, "Enderman should not dodge ranged attacks from the same tile");

  clearNonBases();
  const blinkingEnderman = addUnit("enderman", 2, 4, 4);
  const elPrimo = addUnit("el-primo", 1, 4, 4);
  expect(attackUnit(elPrimo, blinkingEnderman), "melee attack should hit Enderman");
  expect(blinkingEnderman.hp === 400 && (blinkingEnderman.x !== 4 || blinkingEnderman.y !== 4), "Enderman should take only the first melee hit and blink away");

  clearNonBases();
  const eye = addUnit("eye-of-cthulhu", 1, 4, 4);
  applyDamage(eye, 450);
  expect(eye.hp === 350 && eye.speed === 3 && eye.secondPhaseActive, "Eye of Cthulhu should enter second phase once below 400 HP");
  expect(eye.attacks.some((attack) => attack.name === "melee" && attack.damage === 250), "Second phase should add 100 melee damage");
  applyDamage(eye, 50);
  expect(eye.speed === 3 && eye.attacks.some((attack) => attack.name === "melee" && attack.damage === 250), "Second phase should only activate once");
  const dashStartEnemy = addUnit("turk", 2, 4, 4);
  const dashStartFriendly = addUnit("turk", 1, 4, 4);
  const dashTarget = addUnit("steve", 2, 7, 4);
  const dashMiddleGround = addUnit("pam", 2, 5, 4);
  const dashMiddleBuilding = addUnit("bunker", 2, 6, 4);
  setEnergy(1, 6);
  expect(activateAbility(eye, { x: 7, y: 4 }), "Demon Dash should move in a straight line up to 3 tiles");
  expect(!state.units.includes(dashStartEnemy) && state.units.includes(dashStartFriendly), "Demon Dash should hit enemies on the start tile but not friendlies");
  expect(eye.x === 7 && eye.y === 4 && dashTarget.shield === 0 && dashTarget.hp === 300, "Demon Dash should break shield without same-hit overflow");
  expect(dashMiddleGround.hp === 200 && dashMiddleBuilding.hp === 500, "Demon Dash should hit every enemy unit or building in its path");

  clearNonBases();
  const dart = addUnit("dart-monkey", 1, 4, 7);
  tileAt(4, 7).territoryOwner = 1;
  const dartTarget = addUnit("pam", 2, 4, 5);
  const diagonalDartTarget = addUnit("turk", 2, 5, 6);
  expect(canAttack(dart, dartTarget), "Dart Monkey should get +1 range on own territory");
  expect(canAttack(dart, diagonalDartTarget), "Dart Monkey +1 range should include diagonal tiles");
  const rangeCheckSniper = addUnit("sniper-monkey", 1, 0, 0);
  const tooFarSniperTarget = addUnit("turk", 2, 2, 3);
  expect(!canAttack(rangeCheckSniper, tooFarSniperTarget), "Sniper Monkey range 3 should not hit dx2/dy3 because Manhattan distance is 5");
  tileAt(5, 7).territoryOwner = 2;
  expect(moveUnit(dart, 5, 7), "Dart Monkey should move normally");
  expect(tileAt(5, 7).territoryOwner === 2, "Dart Monkey should not claim territory when moving");

  clearNonBases();
  const flyingMelee = addUnit("bomber", 1, 4, 4);
  const flyingTarget = addUnit("jet", 2, 4, 4);
  expect(canAttack(flyingMelee, flyingTarget), "flying melee units should attack flying units on the same tile");
  const groundMelee = addUnit("steve", 1, 5, 5);
  const otherFlyingTarget = addUnit("jet", 2, 5, 5);
  expect(!canAttack(groundMelee, otherFlyingTarget), "ground melee units should still not attack flying units without a special effect");
  const cop = addUnit("gta-cop", 1, 1, 1);
  const copTarget = addUnit("turk", 2, 3, 1);
  expect(canAttack(cop, copTarget), "GTA Cop should have range 2");

  clearNonBases();
  const sigmaArea = addUnit("sigma", 1, 4, 4);
  const areaTarget = addUnit("pam", 2, 4, 5);
  const nearArea = addUnit("turk", 2, 5, 5);
  const farFromTarget = addUnit("turk", 2, 6, 4);
  expect(attackUnit(sigmaArea, areaTarget), "Sigma should attack chosen target");
  expect(!state.units.includes(nearArea), "Sigma Area Damage should hit enemies within range 1 of the target");
  expect(state.units.includes(farFromTarget), "Sigma Area Damage should not hit enemies only near Sigma but not near the target");

  clearNonBases();
  const electro = addUnit("electro-giant", 2, 4, 4);
  const farShooter = addUnit("sniper-monkey", 1, 4, 6);
  expect(attackUnit(farShooter, electro), "range 2 attack should hit Electro Giant");
  expect(farShooter.hp === 250, "Electro Giant should not reflect attacks from range 2 or more");

  clearNonBases();
  const takel = addUnit("takel-heli", 1, 4, 4);
  const carriedBuilding = addUnit("bunker", 1, 4, 4);
  setEnergy(1, 6);
  expect(activateAbility(takel), "Takel Heli should pick up a friendly empty building under itself");
  expect(takel.carriedBuildingId === carriedBuilding.unitId && carriedBuilding.carriedByUnitId === takel.unitId, "Takel Heli should mark carried building");
  takel.x = 5;
  takel.y = 4;
  takel.hasUsedAbilityThisTurn = false;
  expect(activateAbility(takel), "Takel Heli should drop carried building on current tile");
  expect(carriedBuilding.x === 5 && carriedBuilding.y === 4 && !takel.carriedBuildingId, "Takel Heli should drop building correctly");
  takel.hasUsedAbilityThisTurn = false;
  takel.x = 6;
  takel.y = 4;
  expect(!activateAbility(takel), "Takel Heli without building underneath should fail without effect");

  clearNonBases();
  const blockedTakel = addUnit("takel-heli", 1, 4, 4);
  const blockedCarry = addUnit("bunker", 1, 4, 4);
  expect(activateAbility(blockedTakel), "Takel Heli should pick up building before blocked drop test");
  blockedTakel.x = 5;
  blockedTakel.y = 4;
  blockedTakel.hasUsedAbilityThisTurn = false;
  addUnit("big-ben", 1, 5, 4);
  expect(!activateAbility(blockedTakel), "Takel Heli should not drop on a tile with another building");

  clearNonBases();
  const rook = addUnit("the-rook", 1, 1, 7);
  const firstVictim = addUnit("steve", 2, 3, 7);
  const secondVictim = addUnit("pam", 2, 5, 7);
  tileAt(5, 7).territoryOwner = 2;
  expect(!moveUnit(rook, 3, 5), "THE ROOK should not move diagonally");
  expect(moveUnit(rook, 5, 7), "THE ROOK should charge in a straight line");
  expect(rook.x === 5 && rook.y === 7, "THE ROOK should end on chosen tile");
  expect(rook.hp === 600, "THE ROOK should take 50 true selfdamage per hit unit");
  expect(firstVictim.hp === 300 && firstVictim.shield === 0, "Castle Charge should break shield without same-hit overflow");
  expect(secondVictim.hp === 250, "Castle Charge should damage unit on end tile");
  expect(tileAt(5, 7).territoryOwner === 2, "THE ROOK should not claim territory");

  clearNonBases();
  const fragileRook = addUnit("the-rook", 1, 1, 7);
  fragileRook.hp = 50;
  const earlyVictim = addUnit("pam", 2, 3, 7);
  const lateVictim = addUnit("pam", 2, 5, 7);
  expect(moveUnit(fragileRook, 5, 7), "fragile THE ROOK should still start Castle Charge");
  expect(!state.units.includes(fragileRook), "fragile THE ROOK should die from selfdamage after the first hit");
  expect(earlyVictim.hp === 250, "Castle Charge should damage the first unit before THE ROOK dies");
  expect(lateVictim.hp === 400, "Castle Charge should stop damaging later units after THE ROOK dies");

  clearNonBases();
  const p2Base = getBase(2);
  const baseMelee = addUnit("steve", 1, 4, 0);
  expect(attackUnit(baseMelee, makeBaseAttackTarget(2, 4)), "melee unit on enemy last row should attack base");
  expect(p2Base.hp === 2300, "base should take normal melee damage");

  clearNonBases();
  const blockedBaseMelee = addUnit("steve", 1, 4, 0);
  const baseBlocker = addUnit("turk", 2, 4, 0);
  expect(!canAttack(blockedBaseMelee, makeBaseAttackTarget(2, 4)), "melee base attack should be blocked by enemy on last-row tile");
  expect(attackUnit(blockedBaseMelee, baseBlocker), "melee unit should attack blocker instead");

  clearNonBases();
  const sameTileBlockedBase = addUnit("steve", 1, 4, 0);
  addUnit("bunker", 2, 4, 0);
  expect(!canAttack(sameTileBlockedBase, makeBaseAttackTarget(2, 4)), "base tile should stay blocked by any unit or building sharing that base square");

  clearNonBases();
  const baseRanged = addUnit("trump", 1, 4, 1);
  const p2BaseBeforeRanged = getBase(2).hp;
  expect(attackUnit(baseRanged, makeBaseAttackTarget(2, 4)), "ranged unit should attack base if it can reach a top-row tile");
  expect(getBase(2).hp === p2BaseBeforeRanged - 250, "base should take normal ranged damage");

  clearNonBases();
  const blockedBaseRanged = addUnit("trump", 1, 4, 1);
  const rangedBlocker = addUnit("turk", 2, 4, 0);
  expect(!canAttack(blockedBaseRanged, makeBaseAttackTarget(2, 4)), "ranged base attack should be blocked by enemy on chosen last-row tile");
  expect(attackUnit(blockedBaseRanged, rangedBlocker), "ranged unit should hit blocker instead of base");

  clearNonBases();
  const pressureBase = getBase(1);
  pressureBase.hp = 1000;
  addUnit("turk", 2, 3, 8);
  addUnit("marokkaan", 2, 4, 7);
  addUnit("pam", 2, 5, 8);
  addUnit("steve", 1, 5, 8);
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  state.activePlayer = 2;
  endTurn();
  expect(pressureBase.hp === 900, "Base Pressure should deal 5% current HP per enemy unit in protected base-territory");
  pressureBase.hp = 1;
  getPlayer(1).hand = [];
  endTurn();
  getPlayer(2).hand = [];
  endTurn();
  expect(pressureBase.hp === 1, "Base Pressure should not reduce base below 1 HP");
  expect(claimTerritory(2, 8, 4) === 0 && tileAt(4, 8).territoryOwner === 1, "base-territory should not be claimable");
  expect(getBase(1).tags.includes("structure") && getBase(1).tags.includes("building") && !getBase(1).tags.includes("bunker"), "base should count as building/structure but not bunker");
}

function testKnight() {
  clearNonBases();
  const knight = addUnit("knight", 1, 4, 4);
  const target = addUnit("turk", 2, 4, 5);
  expect(canAttack(knight, target), "Knight should be able to lunge an adjacent enemy");
  expect(attackUnit(knight, target), "Knight lunge attack should execute");
  expect(knight.x === 4 && knight.y === 5, "Knight should move to the target tile before damage");
  expect(!state.units.includes(target), "Knight should kill the fragile target");
  expect(!knight.hasAttackedThisTurn, "Knight should reset attack after Chain Kill");

  const secondTarget = addUnit("turk", 2, 5, 5);
  expect(attackUnit(knight, secondTarget), "Knight should attack again after Chain Kill");
  expect(knight.x === 5 && knight.y === 5, "Knight should stay on the second killed target tile");
}

function testAnts() {
  clearNonBases();
  const queen = addUnit("mierenkoningin", 1, 4, 4);
  getPlayer(1).hand = [];
  getPlayer(2).hand = [];
  state.activePlayer = 2;
  endTurn();
  const passiveAnts = state.units.filter((unit) =>
    unit.cardId === "mier-token" &&
    unit.owner === 1 &&
    unit.antCount === 1 &&
    Math.abs(unit.x - queen.x) <= 1 &&
    Math.abs(unit.y - queen.y) <= 1
  );
  expect(passiveAnts.length === 3, "Mierenkoningin should spawn 3 Mier x1 tokens in her 3x3 at owner upkeep");

  clearNonBases();
  const splitQueen = addUnit("mierenkoningin", 1, 4, 4);
  setEnergy(1, 3);
  expect(activateAbility(splitQueen), "Split should be usable above 50 HP with a free adjacent tile");
  expect(splitQueen.hp === 50, "Split should cost 50 HP");
  expect(state.units.some((unit) => unit.cardId === "mier-token" && unit.antCount === 10), "Split should spawn Mier(en) x10");

  clearNonBases();
  const antA = spawnAntToken(1, 2, 2, 1);
  const antB = spawnAntToken(1, 3, 2, 1);
  expect(moveUnit(antA, 3, 2), "Mier should move onto own Mier token");
  const stacked = state.units.find((unit) => unit.cardId === "mier-token" && unit.x === 3 && unit.y === 2);
  expect(stacked?.antCount === 2 && stacked.hp === 20 && stacked.attacks[0].damage === 20, "own Mieren should stack into x2 with 20 HP/damage");

  applyDamage(stacked, 25);
  expect(stacked.antCount === 1 && stacked.hp === 10, "single-hit 25 damage should kill max 1 ant");
  const bigAnt = spawnAntToken(1, 1, 1, 10);
  applyDamage(bigAnt, 25);
  expect(bigAnt.antCount === 9 && bigAnt.hp === 90 && bigAnt.attacks[0].damage === 90, "single-hit 25 damage should drop x10 to x9");

  const dartTarget = spawnAntToken(2, 1, 2, 10);
  const dart = addUnit("dart-monkey", 1, 1, 1);
  expect(attackUnit(dart, dartTarget), "Dart Monkey should attack Mier(en)");
  expect(dartTarget.antCount === 9, "Dart Monkey single-hit should kill exactly 1 ant");

  clearNonBases();
  const pamTarget = spawnAntToken(2, 4, 3, 10);
  const pam = addUnit("pam", 1, 4, 4);
  pam.attacks = [{ name: "ranged", damage: 50, range: 1, hits: 3 }];
  expect(attackUnit(pam, pamTarget), "Pam-style multi-hit should attack Mier(en)");
  expect(pamTarget.antCount === 7, "3 multi-hit hits should kill 3 ants");

  const areaAnt = spawnAntToken(2, 6, 6, 10);
  applyDamage(areaAnt, 50, null, { antDamageType: "area", sourceName: "test Area Damage" });
  expect(areaAnt.antCount === 5, "50 Area Damage should kill 5 ants");
  applyDamage(areaAnt, 200, null, { antDamageType: "area", sourceName: "test Area Damage" });
  expect(!state.units.includes(areaAnt), "200 Area Damage should remove remaining ant stack");

  clearNonBases();
  const runner = spawnAntToken(1, 0, 0, 1);
  spawnAntToken(1, 1, 0, 1);
  spawnAntToken(1, 2, 0, 1);
  expect(moveUnit(runner, 3, 0), "Mier should use own ant line for 0-cost steps and spend 1 movement at the end");

  clearNonBases();
  const trap = spawnAntToken(1, 4, 4, 6);
  const enemy = addUnit("steve", 2, 4, 5);
  state.activePlayer = 2;
  expect(moveUnit(enemy, 4, 4), "enemy non-flying should move onto ants");
  expect(trap.antCount === 5, "enemy non-flying movement should kill 1 ant");

  clearNonBases();
  const flyingTrap = spawnAntToken(1, 4, 4, 6);
  const flyer = addUnit("jet", 2, 4, 5);
  state.activePlayer = 2;
  expect(moveUnit(flyer, 4, 4), "enemy flying should move onto ants");
  expect(flyingTrap.antCount === 6, "enemy flying movement should not kill an ant");
}

function testGustav() {
  clearNonBases();
  const gustav = addUnit("schwerer-gustav", 1, 4, 4);
  const rangeOne = addUnit("steve", 2, 4, 3);
  const rangeTwo = addUnit("steve", 2, 4, 2);
  const diagonal = addUnit("steve", 2, 5, 3);
  expect(!canAttack(gustav, rangeOne), "Schwerer Gustav should not attack range 1");
  expect(canAttack(gustav, rangeTwo), "Schwerer Gustav should shoot through unit blockers with siege line shot");
  expect(!gustav.tags.includes("pierce"), "Schwerer Gustav should not have the normal pierce tag");
  expect(!canAttack(gustav, diagonal), "Schwerer Gustav should not attack diagonal targets");

  clearNonBases();
  const clearGustav = addUnit("schwerer-gustav", 1, 4, 4);
  const clearRangeTwo = addUnit("steve", 2, 4, 2);
  expect(canAttack(clearGustav, clearRangeTwo), "Schwerer Gustav should attack unblocked straight-line range 2");

  clearNonBases();
  const areaGustav = addUnit("schwerer-gustav", 1, 4, 4);
  const areaTarget = addUnit("steve", 2, 4, 2);
  const areaFriend = addUnit("pam", 1, 5, 2);
  const areaEnemy = addUnit("turk", 2, 3, 2);
  expect(attackUnit(areaGustav, areaTarget), "Schwerer Gustav should fire on unit target");
  expect(areaTarget.shield === 0 && areaTarget.hp === 300, "main target should take one 400-damage hit, with shield blocking without same-hit overflow");
  expect(areaFriend.hp === 200, "friendly unit near impact should take 200 Area Damage");
  expect(!state.units.includes(areaEnemy), "enemy token near impact should take 200 Area Damage and die");

  clearNonBases();
  const emptyShotGustav = addUnit("schwerer-gustav", 1, 4, 4);
  const emptyArea = addUnit("steve", 2, 7, 4);
  expect(attackGustavTile(emptyShotGustav, 6, 4), "Schwerer Gustav should fire at an empty valid tile");
  expect(emptyArea.shield === 0 && emptyArea.hp === 300, "empty tile shot should deal one 200 Area Damage hit, with shield blocking without same-hit overflow");

  clearNonBases();
  const baseGustav = addUnit("schwerer-gustav", 1, 4, 4);
  const p2Base = getBase(2);
  const baseHpBefore = p2Base.hp;
  expect(attackUnit(baseGustav, makeBaseAttackTarget(2, 4)), "Schwerer Gustav should attack base in valid straight range");
  expect(p2Base.hp === baseHpBefore - 400, "Schwerer Gustav should deal 400 base damage");

  clearNonBases();
  const sideTrackGustav = addUnit("schwerer-gustav", 1, 4, 4);
  setEnergy(1, 3);
  expect(activateAbility(sideTrackGustav, { x: 5, y: 4 }), "Zijspoor should move one lane sideways");
  expect(sideTrackGustav.x === 5 && sideTrackGustav.statuses.cannotAct, "Zijspoor should apply cannotAct");

  clearNonBases();
  const slowGustav = addUnit("schwerer-gustav", 1, 4, 4);
  expect(moveUnit(slowGustav, 4, 3), "Schwerer Gustav should move forward");
  expect(!moveUnit(slowGustav, 4, 2), "Schwerer Gustav should not move again immediately");
}

function testMedusa() {
  clearNonBases();
  const flyingMedusa = addUnit("medusa", 1, 4, 4);
  const flyingTarget = addUnit("jet", 2, 4, 3);
  expect(moveUnit(flyingMedusa, 4, 3), "Medusa should be able to move onto a flying enemy tile");
  expect(!flyingTarget.statuses.standbeeld && flyingTarget.cardId === "jet", "Medusa should not petrify flying units");

  clearNonBases();
  const medusa = addUnit("medusa", 1, 4, 4);
  const steve = addUnit("steve", 2, 4, 3);
  steve.hp = 250;
  steve.shield = 50;
  expect(moveUnit(medusa, 4, 3), "Medusa should move onto enemy tile");
  expect(steve.statuses.standbeeld && steve.image.includes("standbeeld"), "enemy unit should become a standbeeld");
  expect(steve.hp === 250 && steve.shield === 0 && steve.speed === 0 && steve.attacks.length === 0, "standbeeld should keep current HP, lose shield, speed and attacks");
  state.activePlayer = 2;
  expect(!moveUnit(steve, 4, 2), "standbeeld should not move");
  state.activePlayer = 1;
  applyDamage(steve, 100);
  applyDamage(medusa, 999);
  expect(steve.cardId === "steve" && steve.hp === 150 && steve.shield === 0 && steve.speed === 1 && steve.attacks.length > 0, "Steve should return from petrification with current HP and 0 shield");

  clearNonBases();
  const antMedusa = addUnit("medusa", 1, 4, 4);
  const ants = spawnAntToken(2, 4, 3, 8);
  expect(moveUnit(antMedusa, 4, 3), "Medusa should petrify ant stacks");
  expect(ants.statuses.standbeeld && ants.hp === 70 && !ants.antCount, "Medusa should stomp 1 ant and petrify the surviving stack as one statue");
}

function testA10() {
  clearNonBases();
  const a10 = addUnit("a-10-thunderbolt", 1, 4, 4);
  const groundTarget = addUnit("steve", 2, 4, 2);
  const areaEnemy = addUnit("turk", 2, 5, 2);
  const areaFriendly = addUnit("pam", 1, 3, 2);
  expect(attackUnit(a10, groundTarget), "A-10 should attack ground target at range 2");
  expect(groundTarget.shield === 0 && groundTarget.hp === 100, "BRRRRT should do 25x10 total damage to ground target");
  expect(!state.units.includes(areaEnemy), "A-10 Area Damage should hit nearby enemy after BRRRRT");
  expect(areaFriendly.hp === 350, "A-10 Area Damage should hit nearby friendly after BRRRRT");

  clearNonBases();
  const airA10 = addUnit("a-10-thunderbolt", 1, 4, 4);
  const flyingTarget = addUnit("jet", 2, 4, 2);
  const airNearby = addUnit("turk", 2, 5, 2);
  expect(attackUnit(airA10, flyingTarget), "A-10 should attack flying target at range 2");
  expect(flyingTarget.shield === 0 && flyingTarget.hp === 350, "A-10 air attack should be one 150-damage hit, blocked by shield without same-hit overflow");
  expect(state.units.includes(airNearby) && airNearby.hp === 50, "A-10 air attack should not cause Area Damage");

  clearNonBases();
  const groundedA10 = addUnit("a-10-thunderbolt", 1, 4, 4);
  const groundedFlyingTarget = addUnit("jet", 2, 4, 2);
  groundedFlyingTarget.statuses.grounded = 1;
  const groundedNearby = addUnit("turk", 2, 5, 2);
  expect(attackUnit(groundedA10, groundedFlyingTarget), "A-10 should use BRRRRT on grounded flying targets");
  expect(groundedFlyingTarget.shield === 0 && groundedFlyingTarget.hp === 150, "grounded flying target should take BRRRRT multi-hit damage");
  expect(!state.units.includes(groundedNearby), "grounded flying target should trigger A-10 Area Damage");
}

function testAbilities() {
  clearNonBases();
  const thanos = addUnit("thanos", 1, 4, 4);
  const enemy = addUnit("steve", 2, 4, 5);
  setEnergy(1, 3);
  expect(activateAbility(thanos, enemy), "Thanos sacrifice should execute on chosen adjacent enemy");
  expect(!state.units.includes(thanos) && !state.units.includes(enemy), "Thanos and target should be gone");

  const jet = addUnit("jet", 1, 1, 7);
  getPlayer(1).hand = [];
  setEnergy(1, 2);
  expect(activateAbility(jet), "Jet should return to hand");
  expect(getPlayer(1).hand.some((card) => card.id === "jet"), "Jet card should be in hand");

  clearNonBases();
  const orisa = addUnit("orisa", 1, 4, 4);
  setEnergy(1, 3);
  expect(activateAbility(orisa, { x: 4, y: 4 }), "Orisa should place barrier on her own tile");
  expect(state.units.some((unit) => unit.cardId === "orisa-barrier" && unit.x === 4 && unit.y === 4), "Orisa Barrier should be on Orisa's tile");

  clearNonBases();
  getPlayer(1).graveyard = [];
  const deadJet = addUnit("jet", 1, 4, 4);
  applyDamage(deadJet, 999, null, { ignoreShield: true, ignoreTitanHide: true });
  const mercy = addUnit("mercy", 1, 4, 5);
  setEnergy(1, 3);
  expect(activateAbility(mercy), "Mercy should revive a dead friendly unit");
  const revivedJet = state.units.find((unit) => unit.cardId === "jet" && unit.owner === 1);
  expect(revivedJet && revivedJet.hp === 300 && revivedJet.shield === 0 && revivedJet.baseShield === 0 && revivedJet.attachedShield === 0 && revivedJet.maxAttachedShield === 0, "Mercy revive should return unit with max 300 HP and no shield");

  clearNonBases();
  const geertje = addUnit("geertje", 1, 4, 4);
  applyDamage(geertje, 999, null, { ignoreShield: true, ignoreTitanHide: true });
  const summonedMarokkaan = state.units.find((unit) => unit.cardId === "marokkaan" && unit.owner === 1);
  const summonedTurk = state.units.find((unit) => unit.cardId === "turk" && unit.owner === 1);
  expect(summonedTurk && summonedTurk.hp === 50 && summonedTurk.shield === 0, "Geertje death should summon Turk without shield");
  expect(summonedMarokkaan && summonedMarokkaan.hp === 50 && summonedMarokkaan.shield === 0 && summonedMarokkaan.baseShield === 0, "Geertje death should summon Marokkaan without shield");
}
