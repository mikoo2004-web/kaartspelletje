const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const CARD_IMAGE_DIR = assetPath("assets/cards/");
export const PLACEHOLDER_IMAGE = assetPath("assets/cards/placeholder.svg");

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
  "assets/cards/orisa (barrier).jpg",
  "assets/cards/orisa.jpg",
  "assets/cards/pam.jpg",
  "assets/cards/Pillager Captain.jpg",
  "assets/cards/Pillager.jpg",
  "assets/cards/pumpkin shield.jpg",
  "assets/cards/rage.jpg",
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
  "assets/cards/Business Vampire.jpg"
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
  "wither-skeleton": "assets/cards/whiter skelenton.jpg"
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
  { id: "thanos", name: "Thanos", type: "unit", role: "hybrid", tags: ["melee", "ranged", "tank"], maxHp: 500, shield: 150, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("melee", 250), attack("ranged", 150, 1, { cooldown: 1 })], abilityText: "Ability: sacrifice Thanos als hij meer dan 300 HP heeft en deze beurt niet heeft aangevallen. Doet 1000 true damage op 1 enemy binnen range 1." },
  { id: "junkrat", name: "Junkrat", type: "unit", role: "ranged", tags: ["ranged", "multi-hit"], maxHp: 400, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("ranged", 50, 3)], abilityText: "Passive: damage schaalt met afstand. Range 3 = 50 damage. Range 2 = 50 x3 damage. Range 1 = 50 x4 damage. Range 0/melee = 50 x5 damage. Ability: Junkrat doet 100 selfdamage en 350 damage op een enemy unit op hetzelfde vakje." },
  { id: "krab-rave", name: "Krab Rave", type: "spell", cost: 3, abilityText: "Stun 1 enemy voor 3 beurten." },
  { id: "nyan-kat-regen", name: "Nyan Kat Regen", type: "spell", cost: 3, abilityText: "Raakt hele rij of kolom. Enemy 200 damage, friendly 100." },
  { id: "steve", name: "Steve", type: "unit", role: "melee", tags: ["melee", "loot"], maxHp: 300, shield: 50, speed: 1, cost: 2, attacks: [attack("melee", 200)], abilityText: "Passive: Loot. Als Steve een unit doodmaakt, krijgt hij zijn shield terug en doet hij daarna 50 damage meer." },
  { id: "el-primo", name: "El Primo", type: "unit", role: "melee", tags: ["melee", "tank", "tax-zone"], maxHp: 1000, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 50, 1, { hits: 2 })], abilityText: "Passive: enemy units moeten 2 energie betalen om weg te lopen uit hetzelfde vakje als El Primo." },
  { id: "big-ben", name: "Big Ben", type: "building", role: "ranged-building", tags: ["building", "ranged", "passive", "pierce"], maxHp: 1050, shield: 0, speed: 0, cost: 4, attacks: [attack("ranged", 250, 2, { cooldown: 2 })], abilityText: "Passive: Pierce. Big Ben kan door andere units heen schieten. Als Big Ben kapot gaat, kan de killer 1 beurt niks doen." },
  { id: "biem", name: "Biem", type: "building", role: "suicide-building", tags: ["building", "ranged", "suicide"], maxHp: 400, shield: 0, speed: 0, cost: 2, attacks: [attack("ranged", 400, 1)], abilityText: "Passive: na zijn aanval doet Biem 400 selfdamage en gaat hij direct dood." },
  { id: "pumpkin-shield", name: "Pumpkin Shield", type: "spell", role: "shield", cost: 3, abilityText: "Geeft friendly unit een attached shield van 500 HP." },
  { id: "takel-heli", name: "Takel Heli", type: "unit", role: "flying-support", tags: ["flying", "support", "transport", "carry-building"], maxHp: 500, shield: 150, speed: 2, cost: 2, abilityCost: 1, attacks: [], abilityText: "Ability: als Takel Heli boven een non-base gebouw vliegt, pakt hij dat gebouw op. Activeer opnieuw om het gebouw te droppen. Er mag geen unit in het gebouw zitten. Terwijl hij een gebouw draagt, neemt Takel Heli alle damage." },
  { id: "boost", name: "Boost", type: "spell", cost: 2, abilityText: "Volgende beurt +3 extra energie. Gaat terug in deck." },
  { id: "rage", name: "Rage", type: "spell", cost: 2, abilityText: "Target een friendly non-building unit. Kies: 50% meer damage tot die unit doodgaat, of dubbele snelheid." },
  { id: "trump", name: "Trump", type: "unit", role: "ranged", tags: ["ranged", "targeted-fire", "passive"], maxHp: 650, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 250)], abilityText: "Passive: Targeted Fire. Als Trump een unit raakt, krijgt die targeted voor 2 beurten. Een targeted unit krijgt 50% meer damage van de volgende targeted-fire hit." },
  { id: "miner", name: "Miner", type: "unit", role: "melee", tags: ["melee", "deploy-anywhere", "fast", "passive"], maxHp: 600, shield: 50, speed: 3, cost: 3, attacks: [attack("melee", 200)], abilityText: "Passive: Miner mag overal geplaatst worden. Tegen gebouwen doet hij maar 100 damage." },
  { id: "roadhog", name: "Roadhog", type: "unit", role: "tank-hybrid", tags: ["melee", "ranged", "hook", "stun"], maxHp: 800, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("melee", 250), attack("ranged", 150)], abilityText: "Ability: range 1. Pull een enemy naar Roadhog toe. Die enemy is 1 beurt stunned en kan niks doen. Cooldown 2 beurten." },
  { id: "bunker", name: "Bunker", type: "building", role: "bunker", tags: ["building", "shelter"], maxHp: 700, shield: 0, speed: 0, cost: 3, attacks: [], abilityText: "Passive: unit erin krijgt 0 damage, gebouw krijgt volle damage." },
  { id: "jet", name: "Jet", type: "unit", role: "flying-ranged", tags: ["flying", "ranged", "anti-air", "passive"], maxHp: 350, shield: 50, speed: 3, cost: 2, abilityCost: 1, attacks: [attack("ranged", 50)], abilityText: "Passive: Jet doet 350 damage tegen flying units en 50 damage tegen ground units. Ability: kan 1x terug naar hand." },
  { id: "bomber", name: "Bomber", type: "unit", role: "flying-melee-splash", tags: ["flying", "melee", "anti-building", "splash"], maxHp: 400, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 100, 0, { hits: 2, splashRadius: 1 })], abilityText: "Passive: melee splash op het huidige vakje en alle vakjes binnen range 1. Doet 100 x2 damage en 125 extra damage op gebouwen." },
  { id: "mercy", name: "Mercy", type: "unit", role: "healer-ranged", tags: ["healer", "ranged", "resurrect"], maxHp: 400, shield: 0, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 50), attack("ranged-heal", 50)], abilityText: "Ability: revive uit graveyard met max 300 HP. Cooldown 7 beurten." },
  { id: "pam", name: "Pam", type: "unit", role: "healer-ranged", tags: ["healer", "ranged", "area-heal"], maxHp: 400, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("ranged", 10, 1, { hits: 10 })], abilityText: "Ability: heal friendly non-building units binnen range 1 voor 75 HP. Cooldown 2 beurten." },
  { id: "geertje", name: "Geertje", type: "unit", role: "summoner", tags: ["summoner", "ranged", "passive"], maxHp: 350, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 50)], abilityText: "Passive: na een aanval roept Geertje een Turk of Marokkaan naast het target op. Bij death roept hij beide op als er plek is." },
  { id: "turk", name: "Turk", type: "unit", role: "summon-melee", tags: ["summon", "token", "melee"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 150)], abilityText: "Token van Geertje." },
  { id: "marokkaan", name: "Marokkaan", type: "unit", role: "summon-melee", tags: ["summon", "token", "melee"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 50)], abilityText: "Token van Geertje. Passive: bij aanval summon een Marokkaan met 25 HP minder achter de enemy. Als achter niet kan, ernaast. Als de nieuwe Marokkaan 0 HP zou hebben, wordt hij niet gesummond." },
  { id: "f2", name: "F2 Raket", type: "spell", cost: 5, abilityText: "Doet 700 true damage op 1 enemy target. Werkt niet op base." },
  { id: "bom-gooier", name: "Bom Gooier", type: "unit", role: "ground-ranged", tags: ["ranged", "anti-building", "ground-only", "passive"], maxHp: 200, shield: 0, speed: 2, cost: 2, attacks: [attack("ranged", 150)], abilityText: "Passive: Bom Gooier kan geen flying units raken en doet 500 damage tegen gebouwen. Als hij doodgaat, doet hij 150 damage op elke enemy in hetzelfde vakje." },
  { id: "electro-giant", name: "Electro Giant", type: "unit", role: "tank-reflect", tags: ["tank", "melee", "reflect"], maxHp: 800, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 150)], abilityText: "Passive: range 1. Krijgt Electro Giant projectile damage, dan doet hij return damage terug, max 150 per aanval." },
  { id: "wall-wrecker", name: "Wall Wrecker", type: "building", role: "moving-building", tags: ["building", "bunker", "moving", "transport", "passive"], maxHp: 750, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 150, 0)], abilityText: "Passive: doet 150 damage, of 150 x2 tegen bunker-type gebouwen. Friendly units kunnen erin lopen en meebewegen, maar niet aanvallen tot ze eruit lopen. Wall Wrecker neemt alle damage." },
  { id: "collete", name: "Collete", type: "unit", role: "melee-scaling", tags: ["melee", "scaling-damage"], maxHp: 550, shield: 0, speed: 1, cost: 2, attacks: [attack("melee", 50)], abilityText: "Passive: doet 50 damage + 33% van de huidige HP van de target unit." },
  { id: "sneeuwstorm", name: "Sneeuwstorm", type: "spell", cost: 4, abilityText: "Enemy troepen krijgen 50 damage. Enemy flying units worden grounded 1 beurt." },
  { id: "mind-stone", name: "Mind Stone", type: "spell", cost: 5, abilityText: "Steel 1 enemy non-base non-building unit. Die gestolen unit verliest elke eigen upkeep 20% van zijn max HP + max shield." },
  { id: "sigma", name: "Sigma", type: "unit", role: "ranged-splash", tags: ["ranged", "splash", "barrier"], maxHp: 300, shield: 215, speed: 1, cost: 4, abilityCost: 2, attacks: [attack("ranged", 75, 1, { hits: 2 })], abilityText: "Passive: ranged damage is 75 x2 range 1. Splash raakt ook alle units op range 2 voor 50 x2, maar kan die niet los targetten. Ability: Barrier. Plaats binnen range 1 of op Sigma zelf een 700 shield barrier. Activeer opnieuw om de barrier te verwijderen. Als de barrier niet geplaatst is, geneest hij 100 shield per eigen beurt. Als het shield gesloopt wordt, is Sigma hem kwijt." },
  { id: "orisa", name: "Orisa", type: "unit", role: "ranged-tank", tags: ["ranged", "shield", "barrier"], maxHp: 200, shield: 200, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 100, 1, { hits: 2 })], abilityText: "Ability: plaats Orisa Barrier met 500 shield op een leeg vakje binnen range 1. Cooldown 6 eigen upkeep-beurten." },
  { id: "orisa-barrier", name: "Orisa Barrier", type: "building", role: "summon-barrier", tags: ["building", "barrier", "bunker", "summon", "token", "shield-only"], maxHp: 0, shield: 500, speed: 0, cost: 0, attacks: [], abilityText: "Summon-token van Orisa. Barrier/bunker met 500 shield en geen HP. True damage haalt hem direct weg. Zit niet in de normale library." },
  { id: "sigma-barrier", name: "Sigma Barrier", type: "building", role: "summon-barrier", tags: ["building", "barrier", "bunker", "summon", "token", "shield-only"], maxHp: 0, shield: 700, speed: 0, cost: 0, attacks: [], abilityText: "Summon-token van Sigma. 700 shield barrier zonder HP. True damage haalt hem direct weg. Zit niet in de normale library." },
  { id: "nuke", name: "Nuke", type: "spell", cost: 6, abilityText: "Exacte locatie: 500 true damage. Daarna krijgt de 3x3 arena 3 beurten radiation. Aan het begin van elke upkeep krijgen alle units in die arena 100 true damage." },
  { id: "iron-titan", name: "Iron Titan", type: "unit", role: "titan-tank", tags: ["unit", "melee", "tank", "shielded", "passive", "shield-only"], maxHp: 0, shield: 450, speed: 1, cost: 5, attacks: [attack("melee", 200)], abilityText: "Passive: Titan Hide. Iron Titan heeft geen HP, alleen 450 shield. De eerste hit die Iron Titan elke beurt krijgt, doet 0 damage. Bij multi-hit attacks wordt alleen de eerste hit genegeerd." },
  { id: "shield-breaker", name: "Shield Breaker", type: "unit", role: "melee", tags: ["unit", "melee", "shield-counter", "multi-hit"], maxHp: 100, shield: 300, speed: 1, cost: 2, attacks: [attack("melee", 100, 1, { hits: 2 })], abilityText: "Passive: doet dubbele damage op shield en geneest 50% van de shield damage als eigen shield. Als Shield Breaker shield kapotmaakt, krijgt de target cannotAttack voor 1 beurt." },
  { id: "sniper-monkey", name: "Sniper Monkey", type: "unit", role: "long-range", tags: ["unit", "ranged", "long-range", "fragile", "cooldown", "targeted-fire"], maxHp: 250, shield: 0, speed: 1, cost: 3, attacks: [attack("ranged", 300, 3, { cooldown: 2 })], abilityText: "Passive: kan niet schieten als er een enemy op hetzelfde vakje staat. Targeted Fire: als Sniper Monkey een unit raakt, krijgt die targeted voor 4 beurten. Een targeted unit krijgt 50% meer damage van de volgende targeted-fire hit." },
  { id: "assassin", name: "Assassin", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "assassin", "fast"], maxHp: 300, shield: 50, speed: 2, cost: 3, attacks: [attack("melee", 250)], abilityText: "Passive: als Assassin een enemy aanvalt die deze beurt al is aangevallen, doet hij 400 damage in plaats van 250. Assassin kan niet geraakt worden door units met range 2 of meer." },
  { id: "medic-drone", name: "Medic Drone", type: "unit", role: "flying-healer", tags: ["unit", "flying", "healer", "support", "sacrifice"], maxHp: 200, shield: 0, speed: 2, cost: 1, abilityCost: 1, attacks: [], abilityText: "Ability: heal een friendly non-building unit binnen range 1 voor 200 HP. Daarna gaat Medic Drone dood." },
  { id: "slime-king", name: "Slime King", type: "unit", role: "tank-summoner", tags: ["unit", "melee", "tank", "summon", "deathrattle"], maxHp: 900, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 100)], abilityText: "Passive: als Slime King doodgaat, summon 3 Slime tokens op vrije adjacent vakjes. Als Slime King een unit doodmaakt, summon hij ook een Slime." },
  { id: "slime", name: "Slime", type: "unit", role: "token-melee", tags: ["unit", "token", "summon", "melee", "territory"], maxHp: 200, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 75)], abilityText: "Passive: als Slime doodgaat, neemt hij zijn vakje en adjacent vakjes over als territory van zijn speler." },
  { id: "creeper", name: "Creeper", type: "unit", role: "suicide-melee", tags: ["unit", "melee", "suicide", "splash"], maxHp: 300, shield: 0, speed: 1, cost: 2, abilityCost: 1, attacks: [attack("melee", 0)], abilityText: "Ability: Creeper gaat dood en doet 300 damage aan alle units en buildings op hetzelfde vakje en adjacent vakjes. Friendly units krijgen ook damage." },
  { id: "enderman", name: "Enderman", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "teleport", "anti-ranged", "assassin"], maxHp: 450, shield: 0, speed: 2, cost: 3, attacks: [attack("melee", 200, 0)], abilityText: "Passive: Ranged Dodge. Ranged attacks doen 0 damage op Enderman; daarna teleporteert Enderman naar een random leeg vakje binnen range 2. Passive: Ender Blink. Als Enderman door een melee attack gehit wordt, teleporteert hij naar een random leeg vakje binnen range 2. Bij multi-hit attacks teleporteert hij na de eerste hit weg." },
  { id: "eye-of-cthulhu", name: "Eye of Cthulhu", type: "unit", role: "flying-boss", tags: ["unit", "melee", "flying", "boss", "phase"], maxHp: 800, shield: 0, speed: 2, cost: 4, abilityCost: 1, attacks: [attack("melee", 150, 0)], abilityText: "Passive: Second Phase. Als Eye of Cthulhu voor het eerst onder 400 HP komt, krijgt hij permanent +1 speed en +100 melee damage. Ability: Demon Dash. Beweeg maximaal 3 vakjes in een rechte lijn. Alle enemies in het pad krijgen 200 damage, ook buildings, ground en flying." },
  { id: "dart-monkey", name: "Dart Monkey", type: "unit", role: "ranged-defender", tags: ["unit", "ranged", "cheap", "defender", "no-claim"], maxHp: 200, shield: 0, speed: 2, cost: 1, attacks: [attack("ranged", 100, 1)], abilityText: "Passive: Own Territory Defender. Op eigen territory krijgt Dart Monkey +1 range. Passive: No Claim. Dart Monkey verovert geen territory als hij beweegt." },
  { id: "the-rook", name: "THE ROOK", type: "unit", role: "charger", tags: ["unit", "charger", "line-movement", "no-claim", "self-damage"], maxHp: 700, shield: 0, speed: 9, cost: 6, attacks: [], abilityText: "Passive: Castle Charge. THE ROOK mag alleen horizontaal of verticaal in een rechte lijn bewegen. Hij mag door units heen bewegen, maar niet eindigen op een friendly unit. Elk vakje op zijn route na het startvak telt mee. Elke unit op die vakjes krijgt 150 damage; per geraakte unit krijgt THE ROOK 50 true damage. THE ROOK claimt geen territory." },
  { id: "knight", name: "Knight", type: "unit", role: "melee-charger", tags: ["unit", "melee", "charger", "assassin", "chain-kill"], maxHp: 300, shield: 0, speed: 2, cost: 3, attacks: [attack("melee", 250, 0)], abilityText: "Passive: Lunge Attack. Knight kan enemies binnen distance 1 aanvallen. Hij beweegt eerst naar het vakje van het target en doet daarna 250 melee damage. Passive: Chain Kill. Als Knight een non-base enemy unit doodt met zijn attack, mag hij deze beurt opnieuw aanvallen." },
  { id: "pillager-captain", name: "Pillager Captain", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "summon", "aura"], maxHp: 400, shield: 0, speed: 1, cost: 3, abilityCost: 1, attacks: [attack("ranged", 150, 2)], abilityText: "Passive: Raid Banner. Friendly summoned units/tokens in de 3x3 om Pillager Captain krijgen +50 attack damage. Ability: Start Raid. Spawn 2 Pillager tokens op vrije adjacent vakjes." },
  { id: "pillager", name: "Pillager", type: "unit", role: "token-ranged", tags: ["unit", "ranged", "summon", "token"], maxHp: 150, shield: 0, speed: 1, cost: 0, attacks: [attack("ranged", 75, 1)], abilityText: "Token / niet in deck. Summon-token van Pillager Captain." },
  { id: "wanted-level", name: "Wanted Level", type: "spell", role: "summon-spell", cost: 3, tags: ["spell", "summon", "targeted", "economy"], abilityText: "Kies een leeg vakje binnen range 3 van een friendly unit of binnen je deploy zone. Spawn 2 GTA Cop tokens op vrije vakjes binnen range 1. GTA Cops markeren enemies met Targeted en geven +1 next-turn energie als ze een Targeted enemy raken." },
  { id: "gta-cop", name: "GTA Cop", type: "unit", role: "token-ranged", tags: ["unit", "ranged", "token", "summon", "targeted-fire"], maxHp: 100, shield: 0, speed: 1, cost: 0, attacks: [attack("ranged", 100, 2)], abilityText: "Token / niet in deck. Ranged Damage 100 | Range 2. Passive: Mark Suspect. Als GTA Cop een enemy raakt die niet Targeted is, krijgt die Targeted voor 2 beurten. Arrest Bonus: als GTA Cop een Targeted enemy raakt, krijgt de controller +1 energie volgende beurt." },
  { id: "necromancer", name: "Necromancer", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "summon", "sacrifice", "deathrattle"], maxHp: 450, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("ranged", 100, 2)], abilityText: "Passive: Raise Dead. Wanneer een non-token unit ergens doodgaat, probeert Necromancer een Skeleton token in zijn 3x3 te summonen. Ability: Bone Shield. Sacrifice een friendly token binnen range 1 en geef Necromancer 200 shield." },
  { id: "skeleton", name: "Skeleton", type: "unit", role: "token-melee", tags: ["unit", "melee", "summon", "token"], maxHp: 50, shield: 0, speed: 1, cost: 0, attacks: [attack("melee", 50, 0)], abilityText: "Token / niet in deck. Summon-token van Necromancer." },
  { id: "smiler", name: "Smiler", type: "unit", role: "melee-assassin", tags: ["unit", "melee", "stun", "no-claim", "stealth", "assassin", "hit-and-run"], maxHp: 20, shield: 0, speed: 2, cost: 2, attacks: [attack("melee", 200, 0)], abilityText: "Passive: In the Dark. Op eigen territory buiten protected base territory kan Smiler niet direct getarget worden door enemy attacks of abilities. Passive: No Claim. Passive: Jumpscare. Zijn attack doet 200 damage en geeft stun 1 beurt. Passive: Hit and Run. Na een attack mag Smiler nog 1 extra keer bewegen met speed 2 zonder territory te claimen." },
  { id: "wither-skeleton", name: "Wither Skeleton", type: "unit", role: "melee-dot", tags: ["unit", "melee", "damage-over-time", "true-damage"], maxHp: 400, shield: 0, speed: 1, cost: 3, attacks: [attack("melee", 200, 0)], abilityText: "Passive: Wither. Als Wither Skeleton een enemy raakt, krijgt die Wither voor 2 beurten. Aan het begin van de eigenaar zijn beurt krijgt die unit 75 true damage." },
  { id: "alchemist", name: "Alchemist", type: "unit", role: "ranged-support", tags: ["unit", "ranged", "support", "damage-boost", "economy"], maxHp: 300, shield: 0, speed: 1, cost: 3, abilityCost: 0, attacks: [attack("ranged", 75, 2)], abilityText: "Ability: kies een potion. Permanent Brew geeft een friendly unit binnen range 1 permanent +25% attack damage op basis van originele damage; stapelt lineair. Gold Potion geeft een friendly unit tot einde beurt +1 energie voor elke non-base unit kill. De eerste keer per potion kost 0 energie; daarna kost dezelfde potion per Alchemist telkens +1 extra." },
  { id: "sniper-scope", name: "Sniper Scope", type: "spell", role: "ranged-buff", cost: 2, tags: ["spell", "ranged", "buff", "pierce"], abilityText: "Target een friendly ranged unit. Die krijgt permanent +1 range en Pierce Shot. Pierce Shot betekent dat line blockers genegeerd worden." },
  { id: "business-vampire", name: "Business Vampire", type: "unit", role: "melee-support", tags: ["unit", "melee", "lifesteal", "support", "mark", "blood-contract"], maxHp: 1000, shield: 0, speed: 1, cost: 5, abilityCost: 1, attacks: [attack("melee", 200, 0)], abilityText: "Business Vampire komt in play met 500/1000 HP. Passive: Lifesteal. Zijn eigen attack healt hem voor 100% van de damage die hij doet. Ability: Blood Contract. Kies een enemy non-base unit op het bord voor 3 beurten. Als die unit doodgaat, healt de killer voor de damage van de killing hit." }
  ,
  { id: "mierenkoningin", name: "Mierenkoningin", type: "unit", role: "swarm-engine", tags: ["unit", "melee", "swarm", "mierenlijn", "summon"], maxHp: 100, shield: 0, speed: 1, cost: 4, abilityCost: 1, attacks: [attack("melee", 50, 0)], abilityText: "Passive: Mierenkolonie. Aan het begin van je beurt spawnt Mierenkoningin 1 Mier(en)-token met antCount 1 op een vrij orthogonaal vakje naast haar. Ability: Split. Kost 1 energie. Alleen als ze meer dan 50 HP heeft: verlies 50 HP en spawn een Mier(en)-token met antCount 10 op een vrij orthogonaal vakje naast haar." },
  { id: "mier-token", name: "Mier(en)", type: "unit", role: "swarm-token", tags: ["unit", "token", "summon", "melee", "swarm", "mierenlijn", "mier-en"], maxHp: 10, shield: 0, speed: 1, cost: 0, antCount: 1, attacks: [attack("melee", 10, 0)], abilityText: "Token / niet in deck. Swarm-token. antCount bepaalt HP en damage: elke mier heeft 10 HP en 10 melee damage. Eigen Mier(en)-tokens stacken automatisch. Stappen naar vakjes met eigen Mier(en) kosten 0 movement, elk mierenvakje maximaal 1 keer per movement." },
  { id: "schwerer-gustav", name: "Schwerer Gustav", type: "unit", role: "siege", tags: ["unit", "siege", "ranged", "splash", "line-attack", "slow-move"], maxHp: 1000, shield: 0, speed: 1, cost: 8, abilityCost: 1, attacks: [attack("siege", 400, 5, { minRange: 2, splashDamage: 200, splashRadius: 1, lineOnly: true })], abilityText: "Attack: 400 damage, range 2-5, alleen in een rechte lijn. Kan niet op range 1. Splash doet 200 damage binnen range 1 rond het doelvakje en raakt enemies en friendlies. Mag ook een leeg vakje in geldige range aanvallen voor alleen splash. Movement: beweegt maar 1 keer per 2 eigen beurten en alleen rechtdoor of naar achter. Ability: Zijspoor. Kost 1 energie: verplaats 1 baan links of rechts naar een geldig vrij vakje. Daarna kan Schwerer Gustav 1 beurt niks doen." }
  ,
  { id: "medusa", name: "Medusa", type: "unit", role: "control", tags: ["unit", "melee", "control", "petrify"], maxHp: 300, shield: 0, speed: 1, cost: 4, attacks: [attack("melee", 0, 0)], abilityText: "Passive: Verstening. Als Medusa op hetzelfde vakje komt als een geldige enemy unit, verandert die unit automatisch in een standbeeld. Buildings, barriers en non-unit objecten kunnen niet versteend worden. Als Medusa doodgaat, keren haar standbeelden terug naar hun originele vorm met hun huidige HP en 0 shield." }
  ,
  { id: "a-10-thunderbolt", name: "A-10 Thunderbolt", type: "unit", role: "flying-ground-attack", tags: ["unit", "flying", "ranged", "ground-attack", "splash", "multi-hit"], maxHp: 250, shield: 400, speed: 2, cost: 5, attacks: [attack("BRRRRT", 25, 2, { hits: 10 }), attack("air", 150, 2)], abilityText: "Flying ground-attack unit. Tegen non-flying units en buildings gebruikt A-10 BRRRRT: 25 x10 damage, range 2. Tegen flying units gebruikt hij Air attack: 150 damage, range 2. Na de attack doet hij 50 splash damage binnen range 1 rondom het target; splash raakt enemies en friendlies." }
];

const abilityTargetTypes = {
  thanos: "none",
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
  orisa: "none",
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
