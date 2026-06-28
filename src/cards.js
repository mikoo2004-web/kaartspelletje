export const CARD_IMAGE_DIR = "assets/cards/";
export const PLACEHOLDER_IMAGE = `${CARD_IMAGE_DIR}placeholder.svg`;

// ZET HIER ALLE AFBEELDINGBESTANDEN DIE IN assets/cards/ STAAN
export const availableImages = [
  "assets/cards/base 1.jpg",
  "assets/cards/base 2.jpg",
  "assets/cards/a-10-thunderbolt.PNG",
  "assets/cards/alchemist.jpg",
  "assets/cards/assassin.jpg",
  "assets/cards/biem.jpg",
  "assets/cards/big ben.jpg",
  "assets/cards/bom gooier.jpg",
  "assets/cards/bomber.jpg",
  "assets/cards/boost.jpg",
  "assets/cards/bunker.jpg",
  "assets/cards/collete.jpg",
  "assets/cards/creeper.jpg",
  "assets/cards/dart-monkey.jpg",
  "assets/cards/el primo.jpg",
  "assets/cards/electro giant.jpg",
  "assets/cards/enderman.jpg",
  "assets/cards/eye of cthulhu.jpg",
  "assets/cards/f2.jpg",
  "assets/cards/geertje.jpg",
  "assets/cards/gta cop token 1.jpg",
  "assets/cards/gta cop token 2.jpg",
  "assets/cards/iron-titan.jpg",
  "assets/cards/jet.jpg",
  "assets/cards/junkrat.jpg",
  "assets/cards/knight.jpg",
  "assets/cards/krab rave.jpg",
  "assets/cards/marokaan.jpg",
  "assets/cards/medic-drone.jpg",
  "assets/cards/medusa.PNG",
  "assets/cards/mercy.jpg",
  "assets/cards/mier(en).png",
  "assets/cards/mierenkoningin.png",
  "assets/cards/mind stone.jpg",
  "assets/cards/placeholder.svg",
  "assets/cards/miner.jpg",
  "assets/cards/necromancer.jpg",
  "assets/cards/nuke.jpg",
  "assets/cards/Nyan Kat Regen.jpg",
  "assets/cards/nyan-kat-token.png",
  "assets/cards/orisa (barrier).jpg",
  "assets/cards/orisa.jpg",
  "assets/cards/pam.jpg",
  "assets/cards/Pillager Captain.jpg",
  "assets/cards/Pillager.jpg",
  "assets/cards/pumpkin shield.jpg",
  "assets/cards/rage.jpg",
  "assets/cards/rex.jpg",
  "assets/cards/roadhog.jpg",
  "assets/cards/shield-breaker.jpg",
  "assets/cards/Schwerer Gustav.png",
  "assets/cards/sigma.jpg",
  "assets/cards/sigma-barrier.jpg",
  "assets/cards/slime-king.png",
  "assets/cards/slime.jpg",
  "assets/cards/smiler.jpg",
  "assets/cards/sneeuwstorm.jpg",
  "assets/cards/sniper-monkey.png",
  "assets/cards/sniper-scope.jpg",
  "assets/cards/steve.jpg",
  "assets/cards/takel heli.jpg",
  "assets/cards/THE-ROOK.jpg",
  "assets/cards/thanos.jpg",
  "assets/cards/trump.jpg",
  "assets/cards/turk.jpg",
  "assets/cards/wall wreaker.jpg",
  "assets/cards/Wanted Level.jpg",
  "assets/cards/whiter skelenton.jpg",
  "assets/cards/skelenton.jpg",
  "assets/cards/standbeeld.PNG",
  "assets/cards/Business Vampire.jpg",
  "assets/cards/boze oma.png",
  "assets/cards/duif met mes.png",
  "assets/cards/Koffieautomaat.png",
  "assets/cards/Maandagochtend Medewerker.png",
  "assets/cards/maarschalk.png",
  "assets/cards/manager.png",
  "assets/cards/politicus.png",
  "assets/cards/verkenner.png",
];

export const manualImageMap = {
  base: "assets/cards/base 1.jpg",
  "base-p1": "assets/cards/base 1.jpg",
  "base-p2": "assets/cards/base 2.jpg",
  "a-10-thunderbolt": "assets/cards/a-10-thunderbolt.PNG",
  "orisa-barrier": "assets/cards/orisa (barrier).jpg",
  "sigma-barrier": "assets/cards/sigma-barrier.jpg",
  "shield-breaker": "assets/cards/shield-breaker.jpg",
  "iron-titan": "assets/cards/iron-titan.jpg",
  "dart-monkey": "assets/cards/dart-monkey.jpg",
  enderman: "assets/cards/enderman.jpg",
  "eye-of-cthulhu": "assets/cards/eye of cthulhu.jpg",
  "slime-king": "assets/cards/slime-king.png",
  "sniper-monkey": "assets/cards/sniper-monkey.png",
  "the-rook": "assets/cards/THE-ROOK.jpg",
  "wall-wrecker": "assets/cards/wall wreaker.jpg",
  marokkaan: "assets/cards/marokaan.jpg",
  "mierenkoningin": "assets/cards/mierenkoningin.png",
  "mier-token": "assets/cards/mier(en).png",
  "nyan-kat-token": "assets/cards/nyan-kat-token.png",
  alchemist: "assets/cards/alchemist.jpg",
  "business-vampire": "assets/cards/Business Vampire.jpg",
  "gta-cop": "assets/cards/gta cop token 1.jpg",
  knight: "assets/cards/knight.jpg",
  medusa: "assets/cards/medusa.PNG",
  necromancer: "assets/cards/necromancer.jpg",
  "pillager-captain": "assets/cards/Pillager Captain.jpg",
  pillager: "assets/cards/Pillager.jpg",
  skeleton: "assets/cards/skelenton.jpg",
  "schwerer-gustav": "assets/cards/Schwerer Gustav.png",
  smiler: "assets/cards/smiler.jpg",
  "sniper-scope": "assets/cards/sniper-scope.jpg",
  "wanted-level": "assets/cards/Wanted Level.jpg",
  "wither-skeleton": "assets/cards/whiter skelenton.jpg",
  "boze-oma": "assets/cards/boze oma.png",
  "duif-met-mes": "assets/cards/duif met mes.png",
  koffieautomaat: "assets/cards/Koffieautomaat.png",
  "maandagochtend-medewerker": "assets/cards/Maandagochtend Medewerker.png",
  verkenner: "assets/cards/verkenner.png",
  maarschalk: "assets/cards/maarschalk.png",
  manager: "assets/cards/manager.png",
  politicus: "assets/cards/politicus.png",
  "t-rex": "assets/cards/rex.jpg"
};

export function normalizeName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function fileBase(path) {
  return path.split("/").pop() || path;
}

function scoreImage(card, imagePath) {
  const file = normalizeName(fileBase(imagePath));
  const id = normalizeName(card.id);
  const name = normalizeName(card.name);
  if (file === id || file === name) return 100;
  if (file.includes(id) || file.includes(name)) return 80;
  if (id.includes(file) || name.includes(file)) return 62;

  const chunks = [card.id, card.name]
    .join(" ")
    .toLowerCase()
    .split(/[\s-_()]+/)
    .filter((part) => part.length >= 3);
  return chunks.reduce((total, part) => total + (file.includes(normalizeName(part)) ? 12 : 0), 0);
}

export function getImageForCard(card) {
  if (manualImageMap[card.id]) return manualImageMap[card.id];

  const id = normalizeName(card.id);
  const name = normalizeName(card.name);
  const exact = availableImages.find((path) => {
    const file = normalizeName(fileBase(path));
    return file === id || file === name;
  });
  if (exact) return exact;

  const ranked = availableImages
    .map((path) => ({ path, score: scoreImage(card, path) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 24 ? ranked[0].path : PLACEHOLDER_IMAGE;
}

const attack = (name, damage, range = 1, extra = {}) => ({ name, damage, range, ...extra });

export const cards = [
  { id: "thanos", name: "Thanos", type: "unit", role: "hybrid", tags: ["melee", "ranged", "tank"], maxHp: 500, shield: 150, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("melee", 250), attack("ranged", 150, 1, { cooldown: 1 })], abilityText: "Attack: melee 250. Ranged 150, range 1, cooldown 1.\nAbility: sacrifice Thanos if he has more than 300 HP and has not attacked this turn. Deal 1000 true damage to 1 enemy within range 1." },
  { id: "junkrat", name: "Junkrat", type: "unit", role: "ranged", tags: ["ranged", "multi-hit", "stack-damage"], maxHp: 400, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("ranged", 50, 3)], abilityText: "Passive: Stack Damage. Junkrat hits all enemy units on the chosen tile.\nAttack: damage depends on distance: distance 0 = 50 x5; distance 1 = 50 x4; distance 2 = 50 x3; distance 3 = 50 x1.\nAbility: take 100 selfdamage. Deal 350 damage to an enemy on the same tile." },
  { id: "krab-rave", name: "Krab Rave", type: "spell", cost: 2, abilityText: "Target: 1 enemy unit.\nEffect: take control of that unit for 1 turn." },
  { id: "nyan-kat-regen", name: "Nyan Kat Regen", type: "spell", cost: 4, abilityText: "Target: choose row or column, then choose a tile.\nRestriction: the chosen line may not pass through enemy protected base territory.\nEffect: enemy units take 200 damage. Friendly units take 100 damage.\nAftereffect: each damaged tile spawns 1 Nyan Kat token for you. Max 1 Nyan Kat per tile." },
  { id: "steve", name: "Steve", type: "unit", role: "melee", tags: ["melee", "loot"], maxHp: 300, shield: 50, speed: 1, cost: 2, attacks: [attack("melee", 200)], abilityText: "Attack: melee 200.\nPassive - Loot: when Steve kills a unit, restore his shield and give him +50 damage." },
  { id: "el-primo", name: "El Primo", type: "unit", role: "melee", tags: ["melee", "tank", "tax-zone"], maxHp: 1000, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 50, 1, { hits: 2 })], abilityText: "Attack: melee 50 x2.\nPassive: enemy units must pay 2 energy to move away from El Primo's tile." },
  { id: "big-ben", name: "Big Ben", type: "building", role: "ranged-building", tags: ["building", "ranged", "passive", "pierce"], maxHp: 1050, shield: 0, speed: 0, cost: 4, attacks: [attack("ranged", 250, 2, { cooldown: 2 })], abilityText: "Attack: ranged 250, range 2, cooldown 2.\nPassive: Pierce. Big Ben can shoot through units.\nDeath: the killer cannot act for 1 turn." },
  { id: "biem", name: "Biem", type: "building", role: "suicide-building", tags: ["building", "ranged", "suicide"], maxHp: 400, shield: 0, speed: 0, cost: 2, attacks: [attack("ranged", 400, 1)], abilityText: "Attack: ranged 400, range 1.\nNote: after attacking, Biem takes 400 selfdamage and dies." },
  { id: "pumpkin-shield", name: "Pumpkin Shield", type: "spell", role: "shield", cost: 3, abilityText: "Target: 1 friendly unit.\nEffect: give it 500 attached shield." },
  { id: "takel-heli", name: "Takel Heli", type: "unit", role: "flying-support", tags: ["flying", "support", "transport", "carry-building"], maxHp: 500, shield: 150, speed: 2, cost: 2, abilityCost: 1, attacks: [], abilityText: "Ability: if Takel Heli is above a non-base building, pick that building up.\nAbility: activate again to drop the carried building.\nNote: the building cannot contain a unit.\nNote: while carrying a building, Takel Heli takes all damage." },
  { id: "boost", name: "Boost", type: "spell", cost: 2, abilityText: "Effect: your next turn gives +3 extra energy.\nAftereffect: shuffle Boost back into your deck." },
  { id: "rage", name: "Rage", type: "spell", cost: 2, abilityText: "Target: 1 friendly non-building unit.\nEffect: choose one: +50% damage until death, or double speed." },
  { id: "trump", name: "Trump", type: "unit", role: "ranged", tags: ["ranged", "targeted-fire", "passive"], maxHp: 650, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 250)], abilityText: "Attack: ranged 250.\nPassive - Targeted Fire: when Trump hits a unit, that unit gets Targeted for 2 turns.\nNote: the next targeted-fire hit on a Targeted unit deals 50% more damage." },
  { id: "miner", name: "Miner", type: "unit", role: "melee", tags: ["melee", "deploy-anywhere", "fast", "passive"], maxHp: 600, shield: 50, speed: 3, cost: 3, attacks: [attack("melee", 200)], abilityText: "Attack: melee 200.\nPassive: Miner may be deployed anywhere.\nNote: against buildings, Miner deals only 100 damage." },
  { id: "roadhog", name: "Roadhog", type: "unit", role: "tank-hybrid", tags: ["melee", "ranged", "hook", "stun"], maxHp: 800, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("melee", 250), attack("ranged", 150)], abilityText: "Attack: melee 250 or ranged 150.\nAbility - Hook: range 1. Pull 1 enemy to Roadhog. That enemy is stunned and cannot act for 1 turn.\nNote: cooldown 2 turns." },
  { id: "bunker", name: "Bunker", type: "building", role: "bunker", tags: ["building", "shelter", "true-bunker"], maxHp: 700, shield: 0, speed: 0, cost: 3, attacks: [], abilityText: "Passive - True Bunker: a unit inside takes 0 damage from direct damage, Stack Damage and Area Damage.\nNote: Bunker takes the full damage instead, as its card text allows." },
  { id: "jet", name: "Jet", type: "unit", role: "flying-ranged", tags: ["flying", "ranged", "anti-air", "passive", "stack-damage"], maxHp: 350, shield: 50, speed: 3, cost: 2, abilityCost: 1, attacks: [attack("ranged", 50)], abilityText: "Passive: Stack Damage. Jet hits all enemy units on the chosen tile.\nAttack: deal 350 damage to flying units, or 50 damage to ground units.\nAbility: return Jet to hand once." },
  { id: "bomber", name: "Bomber", type: "unit", role: "flying-melee-area", tags: ["flying", "melee", "anti-building", "area-damage", "stack-damage"], maxHp: 400, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 100, 0, { hits: 2, areaRadius: 1 })], abilityText: "Attack: melee 100 x2 on its tile and all tiles within range 1.\nPassive: Area Damage. Each hit tile also applies Stack Damage.\nPassive: deals +125 damage to buildings." },
  { id: "mercy", name: "Mercy", type: "unit", role: "healer-ranged", tags: ["healer", "ranged", "resurrect"], maxHp: 400, shield: 0, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 50), attack("ranged-heal", 50)], abilityText: "Attack: ranged 50. Ranged heal 50.\nAbility: revive a friendly unit from graveyard with max 300 HP.\nNote: cooldown 7 turns." },
  { id: "pam", name: "Pam", type: "unit", role: "healer-ranged", tags: ["healer", "ranged", "area-heal"], maxHp: 400, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("ranged", 10, 1, { hits: 10 })], abilityText: "Attack: ranged 10 x10, range 1.\nAbility: heal friendly non-building units within range 1 for 75 HP.\nNote: cooldown 2 turns." },
  { id: "geertje", name: "Geertje", type: "unit", role: "summoner", tags: ["summoner", "ranged", "passive"], maxHp: 350, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 50)], abilityText: "Attack: ranged 50.\nPassive: after a hit, summon a Turk or Marokkaan next to the target.\nDeath: summon both if there is space." },
  { id: "turk", name: "Turk", type: "unit", role: "summon-melee", tags: ["summon", "token", "melee"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 150)], abilityText: "Attack: melee 150.\nNote: token from Geertje. Not in deck." },
  { id: "marokkaan", name: "Marokkaan", type: "unit", role: "summon-melee", tags: ["summon", "token", "melee"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 50)], abilityText: "Attack: melee 50.\nPassive: after attacking, summon a Marokkaan with 25 less HP behind the enemy. If behind is blocked, try adjacent.\nNote: if the new Marokkaan would have 0 HP, do not summon it.\nNote: token from Geertje. Not in deck." },
  { id: "f2", name: "F2 Raket", type: "spell", cost: 5, abilityText: "Target: 1 enemy target.\nRestriction: cannot target base.\nEffect: deal 700 true damage." },
  { id: "bom-gooier", name: "Bom Gooier", type: "unit", role: "ground-ranged", tags: ["ranged", "anti-building", "ground-only", "passive", "stack-damage"], maxHp: 200, shield: 0, speed: 2, cost: 2, attacks: [attack("ranged", 150)], abilityText: "Passive: Stack Damage. Bom Gooier hits all enemy units on the chosen tile.\nAttack: ranged 150. Cannot hit flying units.\nPassive: deals 500 damage to buildings.\nDeath: deal 150 damage to each enemy on the same tile." },
  { id: "electro-giant", name: "Electro Giant", type: "unit", role: "tank-reflect", tags: ["tank", "melee", "reflect"], maxHp: 800, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 150)], abilityText: "Attack: melee 150.\nPassive: when Electro Giant takes projectile damage, it returns damage to the attacker.\nNote: return damage is max 150 per attack and range 1." },
  { id: "wall-wrecker", name: "Wall Wrecker", type: "building", role: "moving-building", tags: ["building", "bunker", "true-bunker", "moving", "transport", "passive"], maxHp: 750, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 150, 0)], abilityText: "Attack: melee 150. Deals 150 x2 against bunker-type buildings.\nPassive - True Bunker: friendly units can enter and move with Wall Wrecker.\nNote: units inside cannot attack until they leave.\nNote: units inside are protected from direct damage, Stack Damage and Area Damage. Wall Wrecker takes the damage instead." },
  { id: "collete", name: "Collete", type: "unit", role: "melee-scaling", tags: ["melee", "scaling-damage"], maxHp: 550, shield: 0, speed: 1, cost: 2, attacks: [attack("melee", 50)], abilityText: "Attack: melee. Deal 50 damage plus 33% of the target unit's current HP." },
  { id: "sneeuwstorm", name: "Sneeuwstorm", type: "spell", cost: 3, abilityText: "Target: enemy troops.\nEffect: deal 50 damage and stun them for 1 turn.\nAftereffect: enemy flying units are grounded for 1 turn." },
  { id: "mind-stone", name: "Mind Stone", type: "spell", cost: 5, abilityText: "Target: 1 enemy non-base non-building unit.\nEffect: steal that unit.\nAftereffect: during its own upkeep, the stolen unit loses 20% of its max HP plus max shield." },
  { id: "sigma", name: "Sigma", type: "unit", role: "ranged-area", tags: ["ranged", "area-damage", "stack-damage", "barrier"], maxHp: 300, shield: 215, speed: 1, cost: 4, abilityCost: 2, attacks: [attack("ranged", 75, 1, { hits: 2 })], abilityText: "Attack: ranged 75 x2, range 1.\nPassive: also hits all enemy units within range 1 of the target for 50 x2.\nPassive: Area Damage applies Stack Damage on each hit tile.\nAbility - Barrier: place a 700 shield barrier on Sigma's tile or within range 1. Activate again to remove it.\nUpkeep: if the barrier is not placed, it heals 100 shield on Sigma's upkeep.\nNote: if the barrier shield is destroyed, Sigma loses it." },
  { id: "orisa", name: "Orisa", type: "unit", role: "ranged-tank", tags: ["ranged", "shield", "barrier"], maxHp: 200, shield: 200, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 100, 1, { hits: 2 })], abilityText: "Attack: ranged 100 x2, range 1.\nAbility: place Orisa Barrier with 500 shield on Orisa's tile or a valid tile within range 1.\nNote: cooldown 6 own upkeep turns." },
  { id: "orisa-barrier", name: "Orisa Barrier", type: "building", role: "summon-barrier", tags: ["building", "barrier", "bunker", "summon", "token", "shield-only"], maxHp: 0, shield: 500, speed: 0, cost: 0, attacks: [], abilityText: "Note: token from Orisa. Not in deck.\nPassive: shield-only barrier with 500 shield.\nNote: true damage removes it directly." },
  { id: "sigma-barrier", name: "Sigma Barrier", type: "building", role: "summon-barrier", tags: ["building", "barrier", "bunker", "summon", "token", "shield-only"], maxHp: 0, shield: 700, speed: 0, cost: 0, attacks: [], abilityText: "Note: token from Sigma. Not in deck.\nPassive: shield-only barrier with 700 shield.\nNote: true damage removes it directly." },
  { id: "nuke", name: "Nuke", type: "spell", cost: 6, abilityText: "Target: 1 tile.\nEffect: exact tile takes 500 true damage.\nAftereffect: create a 3x3 radiation zone for 3 turns. Units in the zone take 100 true damage during upkeep." },
  { id: "iron-titan", name: "Iron Titan", type: "unit", role: "titan-tank", tags: ["unit", "melee", "tank", "shielded", "passive", "shield-only"], maxHp: 0, shield: 450, speed: 1, cost: 5, attacks: [attack("melee", 200)], abilityText: "Attack: melee 200.\nPassive - Titan Hide: Iron Titan has no visible HP, only 450 shield.\nPassive: the first hit Iron Titan takes each turn deals 0 damage.\nNote: against multi-hit attacks, only the first hit is ignored." },
  { id: "shield-breaker", name: "Shield Breaker", type: "unit", role: "melee", tags: ["unit", "melee", "shield-counter", "multi-hit"], maxHp: 100, shield: 300, speed: 1, cost: 2, attacks: [attack("melee", 100, 1, { hits: 2 })], abilityText: "Attack: melee 100 x2.\nPassive: deals double damage to shield.\nPassive: heals its own shield for 50% of shield damage dealt.\nPassive: if Shield Breaker breaks shield, the target gets cannotAttack for 1 turn." },
  { id: "sniper-monkey", name: "Sniper Monkey", type: "unit", role: "long-range", tags: ["unit", "ranged", "long-range", "fragile", "cooldown", "targeted-fire"], maxHp: 250, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 300, 3, { cooldown: 2 })], abilityText: "Attack: ranged 300, range 3, cooldown 2.\nPassive: cannot shoot while an enemy is on the same tile.\nPassive - Targeted Fire: when Sniper Monkey hits a unit, that unit gets Targeted for 4 turns.\nNote: the next targeted-fire hit on a Targeted unit deals 50% more damage." },
  { id: "assassin", name: "Assassin", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "assassin", "fast"], maxHp: 300, shield: 50, speed: 2, cost: 3, attacks: [attack("melee", 250)], abilityText: "Attack: melee 250.\nPassive - Backstab: if the enemy was already attacked this turn, deal 400 damage instead.\nPassive: Assassin cannot be hit by units with range 2 or more." },
  { id: "medic-drone", name: "Medic Drone", type: "unit", role: "flying-healer", tags: ["unit", "flying", "healer", "support", "sacrifice"], maxHp: 200, shield: 0, speed: 2, cost: 1, abilityCost: 1, attacks: [], abilityText: "Ability - Emergency Heal: heal a friendly non-building unit within range 1 for 200 HP.\nNote: Medic Drone dies after using this ability." },
  { id: "slime-king", name: "Slime King", type: "unit", role: "tank-summoner", tags: ["unit", "melee", "tank", "summon", "deathrattle"], maxHp: 900, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 100)], abilityText: "Attack: melee 100.\nDeath: summon 3 Slime tokens on free adjacent tiles.\nPassive: when Slime King kills a unit, summon a Slime." },
  { id: "slime", name: "Slime", type: "unit", role: "token-melee", tags: ["unit", "token", "summon", "melee", "territory"], maxHp: 200, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 75)], abilityText: "Attack: melee 75.\nDeath: claim its tile and adjacent tiles as territory for its owner.\nNote: token. Not in deck." },
  { id: "creeper", name: "Creeper", type: "unit", role: "suicide-melee", tags: ["unit", "melee", "suicide", "area-damage", "stack-damage"], maxHp: 300, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("melee", 0)], abilityText: "Ability - Explode: Creeper dies and deals 300 Area Damage to all units and buildings on its tile and adjacent tiles.\nNote: friendly units also take damage." },
  { id: "enderman", name: "Enderman", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "teleport", "anti-ranged", "assassin"], maxHp: 450, shield: 0, speed: 2, cost: 3, attacks: [attack("melee", 200, 0)], abilityText: "Attack: melee 200.\nPassive - Ranged Dodge: ranged attacks deal 0 damage to Enderman. Then Enderman teleports to a random empty tile within range 2.\nPassive - Ender Blink: when hit by a melee attack, Enderman teleports to a random empty tile within range 2.\nNote: against multi-hit attacks, Enderman teleports after the first hit." },
  { id: "eye-of-cthulhu", name: "Eye of Cthulhu", type: "unit", role: "flying-boss", tags: ["unit", "melee", "flying", "boss", "phase"], maxHp: 800, shield: 0, speed: 2, cost: 4, abilityCost: 1, attacks: [attack("melee", 150, 0)], abilityText: "Attack: melee 150.\nPassive - Second Phase: the first time Eye drops below 400 HP, it permanently gains +1 speed and +100 melee damage.\nAbility - Demon Dash: move up to 3 tiles in a straight line. All enemies on the start tile and in the path take 200 damage.\nNote: buildings, ground units and flying units can be hit." },
  { id: "dart-monkey", name: "Dart Monkey", type: "unit", role: "ranged-defender", tags: ["unit", "ranged", "cheap", "defender", "no-claim"], maxHp: 200, shield: 0, speed: 2, cost: 1, attacks: [attack("ranged", 100, 1)], abilityText: "Attack: ranged 100, range 1.\nPassive - Own Territory Defender: while on own territory, Dart Monkey gets +1 range.\nPassive - No Claim: Dart Monkey does not claim territory when moving." },
  { id: "the-rook", name: "THE ROOK", type: "unit", role: "charger", tags: ["unit", "charger", "line-movement", "no-claim", "self-damage"], maxHp: 700, shield: 0, speed: 9, cost: 6, attacks: [], abilityText: "Passive - Castle Charge: THE ROOK may only move horizontally or vertically in a straight line.\nPassive: it may move through units, but cannot end on a friendly unit.\nPassive: each unit on moved-through tiles takes 150 damage. Start tile does not count. End tile counts.\nPassive: THE ROOK takes 50 true damage per unit hit.\nPassive - No Claim: THE ROOK does not claim territory." },
  { id: "knight", name: "Knight", type: "unit", role: "melee-charger", tags: ["unit", "melee", "charger", "assassin", "chain-kill"], maxHp: 300, shield: 0, speed: 2, cost: 3, attacks: [attack("melee", 250, 0)], abilityText: "Attack: melee 250.\nPassive - Lunge Attack: Knight can attack enemies within distance 1. It moves to the target tile before dealing damage.\nNote: the lunge tile must be a legal movement end tile.\nPassive - Chain Kill: if Knight kills a non-base enemy unit with its attack, it may attack again this turn." },
  { id: "pillager-captain", name: "Pillager Captain", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "summon", "aura"], maxHp: 400, shield: 0, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 150, 2)], abilityText: "Attack: ranged 150, range 2.\nPassive - Raid Banner: friendly summoned units and tokens in the 3x3 around Pillager Captain get +50 attack damage.\nAbility - Start Raid: spawn 2 Pillager tokens on free adjacent tiles." },
  { id: "pillager", name: "Pillager", type: "unit", role: "token-ranged", tags: ["unit", "ranged", "summon", "token"], maxHp: 150, shield: 0, speed: 1, cost: 0, attacks: [attack("ranged", 75, 1)], abilityText: "Attack: ranged 75, range 1.\nNote: token from Pillager Captain. Not in deck." },
  { id: "wanted-level", name: "Wanted Level", type: "spell", role: "summon-spell", cost: 3, tags: ["spell", "summon", "targeted", "economy"], abilityText: "Target: choose an empty tile within range 3 of a friendly unit, or inside your deploy zone.\nEffect: spawn 2 GTA Cop tokens on free tiles within range 1.\nAftereffect: GTA Cops mark enemies with Targeted and give +1 next-turn energy when they hit a Targeted enemy." },
  { id: "gta-cop", name: "GTA Cop", type: "unit", role: "token-ranged", tags: ["unit", "ranged", "token", "summon", "targeted-fire"], maxHp: 100, shield: 0, speed: 1, cost: 0, attacks: [attack("ranged", 100, 2)], abilityText: "Attack: ranged 100, range 2.\nPassive - Mark Suspect: when GTA Cop hits an enemy that is not Targeted, that enemy gets Targeted for 2 turns.\nPassive - Arrest Bonus: when GTA Cop hits a Targeted enemy, its controller gets +1 energy next turn.\nNote: token. Not in deck." },
  { id: "necromancer", name: "Necromancer", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "summon", "sacrifice", "deathrattle"], maxHp: 450, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("ranged", 100, 2)], abilityText: "Attack: ranged 100, range 2.\nPassive - Raise Dead: when a non-token unit dies, Necromancer tries to summon a Skeleton token in its 3x3.\nAbility - Bone Shield: sacrifice a friendly token within range 1. Necromancer gets 200 shield." },
  { id: "skeleton", name: "Skeleton", type: "unit", role: "token-melee", tags: ["unit", "melee", "summon", "token"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 50, 0)], abilityText: "Attack: melee 50.\nNote: token from Necromancer. Not in deck." },
  { id: "smiler", name: "Smiler", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "stun", "no-claim", "stealth", "assassin", "hit-and-run"], maxHp: 20, shield: 0, speed: 2, cost: 2, attacks: [attack("melee", 200, 0)], abilityText: "Attack - Jumpscare: melee 200 and stun 1 turn.\nPassive - In the Dark: on own territory outside protected base territory, Smiler cannot be directly targeted by enemy attacks or abilities.\nPassive - No Claim: Smiler does not claim territory.\nPassive - Hit and Run: after attacking, Smiler may move 1 extra time with speed 2 without claiming territory." },
  { id: "wither-skeleton", name: "Wither Skeleton", type: "unit", role: "melee-dot", tags: ["unit", "melee", "damage-over-time", "true-damage"], maxHp: 400, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 200, 0)], abilityText: "Attack: melee 200.\nPassive - Wither: when Wither Skeleton hits an enemy, that enemy gets Wither for 2 turns.\nUpkeep: the affected unit takes 75 true damage at the start of its owner's turn." },
  { id: "alchemist", name: "Alchemist", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "damage-boost", "economy", "stack-damage"], maxHp: 300, shield: 0, speed: 1, cost: 3, abilityCost: 0, attacks: [attack("ranged", 75, 2)], abilityText: "Passive: Stack Damage on Alchemist's attack.\nAttack: ranged 75, range 2.\nAbility: choose a potion.\nAbility - Permanent Brew: friendly unit within range 1 gets permanent +25% attack damage based on original damage. Stacks linearly.\nAbility - Gold Potion: friendly unit gets +1 energy this turn for each non-base unit kill.\nNote: first use per potion costs 0. Repeating the same potion with the same Alchemist costs +1 extra each time." },
  { id: "sniper-scope", name: "Sniper Scope", type: "spell", role: "ranged-buff", cost: 2, tags: ["spell", "ranged", "buff", "pierce"], abilityText: "Target: 1 friendly unit with a real ranged attack.\nEffect: normal ranged attacks permanently get +1 range and Pierce Shot.\nRestriction: melee, heals and abilities do not get the range bonus." },
  { id: "business-vampire", name: "Business Vampire", type: "unit", role: "melee-support", tags: ["unit", "melee", "lifesteal", "support", "mark", "blood-contract"], maxHp: 1000, shield: 0, speed: 1, cost: 5, abilityCost: 1, attacks: [attack("melee", 200, 0)], abilityText: "Note: Business Vampire comes into play with 500/1000 HP.\nAttack: melee 200.\nPassive - Lifesteal: its own attack heals it for 100% of damage dealt.\nAbility - Blood Contract: choose an enemy non-base unit for 3 turns.\nNote: if that unit dies, the killer heals for the killing hit damage." }
  ,
  { id: "mierenkoningin", name: "Mierenkoningin", type: "unit", role: "swarm-engine", tags: ["unit", "melee", "swarm", "mierenlijn", "summon"], maxHp: 100, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("melee", 50, 0)], abilityText: "Attack: melee 50.\nPassive - Mierenkolonie: at the start of your turn, spawn up to 3 Mier(en) tokens with antCount 1 on free tiles in the 3x3 around her.\nAbility - Split: only if she has more than 50 HP. Lose 50 HP and spawn a Mier(en) token with antCount 10 on a free orthogonal adjacent tile." },
  { id: "mier-token", name: "Mier(en)", type: "unit", role: "swarm-token", tags: ["unit", "token", "summon", "melee", "swarm", "mierenlijn", "mier-en"], maxHp: 10, shield: 0, speed: 1, cost: 0, antCount: 1, attacks: [attack("melee", 10, 0)], abilityText: "Attack: melee 10 per ant.\nPassive: antCount sets HP and damage. Each ant has 10 HP and 10 melee damage.\nPassive: friendly Mier(en) tokens on the same tile merge.\nPassive: stepping to a tile with friendly Mier(en) costs 0 movement. Each ant tile can be used once per movement.\nNote: token. Not in deck." },
  { id: "nyan-kat-token", name: "Nyan Kat", type: "unit", role: "token-melee", tags: ["unit", "token", "summon", "melee", "cat"], maxHp: 150, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 75, 0)], abilityText: "Attack: melee 75.\nPassive: may share a tile with normal units.\nNote: token from Nyan Kat Regen. Not in deck." },
  { id: "schwerer-gustav", name: "Schwerer Gustav", type: "unit", role: "siege", tags: ["unit", "siege", "ranged", "area-damage", "stack-damage", "line-attack", "line-shot-through-units", "slow-move"], maxHp: 1000, shield: 0, speed: 1, cost: 8, abilityCost: 1, attacks: [attack("siege", 400, 5, { minRange: 2, areaDamage: 200, areaRadius: 1, lineOnly: true, ignoresLineBlockers: true })], abilityText: "Attack: siege 400, range 2-5, straight line only. Cannot attack range 1.\nPassive: siege attack may shoot through units. This is not Pierce.\nPassive: may attack a legal empty tile for Area Damage only.\nAttack: deal 200 Area Damage within range 1 around the target tile. Hits enemies and friendlies.\nPassive: moves once per 2 own turns and only forward or backward.\nAbility - Zijspoor: cost 1. Move 1 lane left or right to a valid free tile.\nNote: after Zijspoor, Schwerer Gustav cannot act for 1 turn." }
  ,
  { id: "medusa", name: "Medusa", type: "unit", role: "control", tags: ["unit", "melee", "control", "petrify"], maxHp: 300, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 0, 0)], abilityText: "Passive - Verstening: when Medusa enters the same tile as a valid non-flying enemy unit, that unit becomes a standbeeld.\nNote: flying units, buildings, barriers and non-unit objects cannot be petrified.\nDeath: Medusa's standbeelden return to their original form with current HP and 0 shield." }
  ,
  { id: "a-10-thunderbolt", name: "A-10 Thunderbolt", type: "unit", role: "flying-ground-attack", tags: ["unit", "flying", "ranged", "ground-attack", "area-damage", "stack-damage", "multi-hit"], maxHp: 250, shield: 400, speed: 2, cost: 5, attacks: [attack("BRRRRT", 25, 2, { hits: 10 }), attack("air", 150, 2)], abilityText: "Attack - BRRRRT: against non-flying units, grounded flying units and buildings, deal 25 x10 damage, range 2.\nAttack - Air: against flying units, deal 150 damage, range 2.\nAttack: BRRRRT deals 50 Area Damage within range 1 around the target.\nNote: Area Damage hits all enemy units on each hit tile." }
  ,
  { id: "politicus", name: "Politicus", type: "unit", role: "support-control", tags: ["unit", "support", "tax", "aura", "politiek"], maxHp: 350, shield: 100, speed: 1, cost: 3, attacks: [attack("ranged", 75, 2)], abilityText: "Attack: ranged 75, range 2.\nPassive - Tax: enemies pay 1 energy to directly target Politicus.\nUpkeep: friendly units in Politicus' 3x3 get Politieke Steun shield equal to 10% max HP.\nDeath: supported units lose that shield and take 30% max HP as damage." },
  { id: "koffieautomaat", name: "Koffieautomaat", type: "building", role: "buff-building", tags: ["building", "support", "speed-boost", "damage-boost", "koffieboost"], maxHp: 500, shield: 0, speed: 0, cost: 2, abilityCost: 0, attacks: [], abilityText: "Ability - Koffieboost: range 1. Choose a friendly unit. It gets +1 speed and +20% damage this turn.\nNote: first use each turn costs 0. Then 1, 2, 3, and so on.\nNote: boosting the same unit two turns in a row gives Crash: -1 speed and -30% damage." },
  { id: "boze-oma", name: "Boze Oma", type: "unit", role: "anti-range-counter", tags: ["unit", "melee", "anti-ranged", "counter", "damage-over-time"], maxHp: 450, shield: 0, speed: 1, cost: 4, attacks: [attack("hete-thee", 75, 2)], abilityText: "Passive: cannot be directly targeted from range 2+.\nPassive - Counter Damage: when attacked from melee or range 1, deal 200 true damage back. Does not hit flying.\nAttack - Hete Thee Gooien: range 2, deal 75 damage and apply Thee Burn.\nUpkeep: Thee Burn deals 25 damage per stack for 3 turns.\nNote: Thee Burn stacks and makes other damage hit 20% harder." },
  { id: "duif-met-mes", name: "Duif met Mes", type: "unit", role: "flying-assassin", tags: ["unit", "flying", "melee", "charger", "assassin", "grounded"], maxHp: 250, shield: 0, speed: 2, cost: 3, attacks: [attack("mesduik", 200, 1, { lunge: true, duifDive: true })], abilityText: "Attack - Mesduik: attack an enemy at distance 1, then move to the target or a free adjacent tile.\nAttack: deal 200 damage, or +50 damage if the target was already damaged.\nNote: Duif becomes grounded until your next upkeep.\nNote: on kill, Duif may move 1 extra tile but cannot attack again." },
  { id: "manager", name: "Manager", type: "unit", role: "risky-support", tags: ["unit", "support", "damage-boost", "speed-boost", "lifesteal", "scaling-damage"], maxHp: 1000, shield: 0, speed: 1, cost: 4, abilityCost: 0, attacks: [attack("prestatiegesprek", 0, 3)], abilityText: "Passive: Manager comes into play with 150/1000 HP.\nAbility - Motiverende Speech: range 3, cost 0, once per turn. Choose a friendly unit. It permanently gets +25% damage and +1 speed. Each unit can get this once.\nUpkeep: buffed units lose 10% max HP. Manager heals that amount.\nAttack - Prestatiegesprek: range 3. Deal 70% of the total damage of friendly units with Motiverende Speech." },
  { id: "maandagochtend-medewerker", name: "Maandagochtend Medewerker", type: "unit", role: "scaling-bruiser", tags: ["unit", "melee", "scaling-damage", "rage"], maxHp: 500, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 100, 0)], abilityText: "Attack: melee damage equals 100 plus missing HP.\nNote: at 500 HP, damage is 100. At 250 HP, damage is 350. At 1 HP, damage is 599." },
  { id: "verkenner", name: "Verkenner", type: "unit", role: "scout-territory", tags: ["unit", "melee", "scout", "speed", "revealed", "territory"], maxHp: 150, shield: 0, speed: 5, cost: 2, attacks: [attack("melee", 50, 0)], abilityText: "Attack: melee 50 and apply Revealed for 2 turns.\nPassive - Revealed: target loses stealth/untargetable and takes 25% more damage.\nPassive: claims a 3x3 area around its end position." },
  { id: "maarschalk", name: "Maarschalk", type: "unit", role: "boss-duelist", tags: ["unit", "melee", "tank", "boss", "duelist", "echo"], maxHp: 2000, shield: 0, speed: 1, cost: 10, abilityCost: 0, attacks: [attack("maarschalkslag", 500, 0)], abilityText: "Attack - Maarschalkslag: 500 melee damage.\nPassive - Echo Attack: after the hit, deal 50% damage again to the same target. If that target is dead, the echo may hit another enemy on the same tile.\nPassive: cannot be stunned by units with cost 3 or lower.\nPassive - Hitted: if Maarschalk takes 150 damage in 1 turn, he becomes Hitted. If he moves after that, he loses 100 HP.\nAbility - Ranged Buff Command: choose a friendly ranged unit in 3x3. That unit cannot attack this turn. Maarschalk gets temporary range 1 if he has not attacked yet." },
  { id: "t-rex", name: "T-Rex", type: "unit", role: "tanky melee boss", tags: ["unit", "melee", "tank", "dinosaur", "roar", "boss"], maxHp: 1400, shield: 0, speed: 1, cost: 7, abilityCost: 1, attacks: [attack("Bite", 350, 0)], abilityText: "Attack - Bite: melee 350.\nAbility - Oerbrul: cost 1, cooldown 3 own turns. All enemy units within range 1 get Intimidated for 1 turn.\nNote: Intimidated means -25% damage and -1 speed until the end of their next turn." }
];

const abilityTargetTypes = {
  thanos: "enemyUnit",
  junkrat: "enemyUnit",
  biem: "none",
  "takel-heli": "none",
  trump: "none",
  roadhog: "enemyUnit",
  jet: "none",
  mercy: "deadFriendlyUnit",
  pam: "friendlyUnit",
  geertje: "special",
  sigma: "tile",
  "medic-drone": "friendlyUnit",
  creeper: "none",
  "eye-of-cthulhu": "tile",
  "pillager-captain": "none",
  necromancer: "friendlyUnit",
  alchemist: "friendlyUnit",
  "business-vampire": "enemyUnit",
  mierenkoningin: "none",
  "schwerer-gustav": "tile",
  politicus: "none",
  koffieautomaat: "friendlyUnit",
  "duif-met-mes": "none",
  manager: "friendlyUnit",
  maarschalk: "friendlyUnit",
  "t-rex": "none",
  orisa: "tile",
  "krab-rave": "enemyUnit",
  "nyan-kat-regen": "tile",
  "pumpkin-shield": "friendlyUnit",
  boost: "none",
  rage: "friendlyUnit",
  f2: "enemyUnit",
  sneeuwstorm: "none",
  "mind-stone": "enemyUnit",
  nuke: "tile",
  "wanted-level": "emptyTile",
  "sniper-scope": "friendlyUnit"
};

for (const card of cards) {
  card.abilityTargetType = abilityTargetTypes[card.id] || "none";
}

export const cardById = Object.fromEntries(cards.map((card) => [card.id, card]));

for (const card of cards) {
  card.image = getImageForCard(card);
}

export const baseCards = {
  p1: { id: "base-p1", name: "Base P1", type: "base", role: "structure", maxHp: 2500, shield: 0, speed: 0, attacks: [], tags: ["base", "building", "structure"], abilityTargetType: "none", image: getImageForCard({ id: "base-p1", name: "Base P1" }) },
  p2: { id: "base-p2", name: "Base P2", type: "base", role: "structure", maxHp: 2500, shield: 0, speed: 0, attacks: [], tags: ["base", "building", "structure"], abilityTargetType: "none", image: getImageForCard({ id: "base-p2", name: "Base P2" }) }
};

export function buildImageDebugRows() {
  return [
    "Image mapping loaded",
    ...cards.map((card) => `${card.name} -> ${card.image}`),
    `Base P1 -> ${baseCards.p1.image}`,
    `Base P2 -> ${baseCards.p2.image}`
  ];
}
