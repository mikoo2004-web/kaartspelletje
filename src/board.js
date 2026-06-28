import { baseCards, buildImageDebugRows, cards } from "./cards.js?v=verkenner-image-1";
import { activateAbility, activateHeal, attackGustavTile, attackUnit, canAttack, canEnterEnemyOccupiedTile, distance, getBaseTileBlockers, getReachableAntSquares, getValidGustavTargetTiles, isDeployCell, isSmilerUntargetableBy, makeBaseAttackTarget, moveUnit, playCard, rangedDistance } from "./actions.js";
import { addLog, clearSelection, discardCardForEndTurn, endTurn, getBase, getPlayer, getUnit, isAntToken, isPetrified, MAX_ENERGY, resetGame, skipEndTurnDiscard, state, tileAt, unitsAt } from "./gameState.js";

const boardEl = document.querySelector("#board");
const baseStatusP1El = document.querySelector("#baseStatusP1");
const baseStatusP2El = document.querySelector("#baseStatusP2");
const handEl = document.querySelector("#hand");
const statsEl = document.querySelector("#statsBar");
const logEl = document.querySelector("#battleLog");
const selectionEl = document.querySelector("#selectionInfo");
const detailsEl = document.querySelector("#detailsPanel");
const debugEl = document.querySelector("#imageDebug");
const selectedUnitPanelEl = document.querySelector("#selectedUnitPanel");
const energyBarEl = document.querySelector("#energyBar");
const unitActionControlsEl = document.querySelector("#unitActionControls");
const allCardsOverviewEl = document.querySelector("#allCardsOverview");
const cardFiltersEl = document.querySelector("#cardFilters");
const keywordsOverviewEl = document.querySelector("#keywordsOverview");
const viewTabs = document.querySelectorAll(".view-tab");
const views = {
  game: document.querySelector("#gameView"),
  rules: document.querySelector("#rulesView"),
  cards: document.querySelector("#cardsView"),
  keywords: document.querySelector("#keywordsView")
};

const defaultCardGalleryFilters = {
  search: "",
  energy: "all",
  type: "all",
  sort: "name-asc"
};
let cardGalleryFilters = { ...defaultCardGalleryFilters };

const ICONS = {
  cost: { emoji: "&#9889;", image: "" },
  hp: { emoji: "&#10084;&#65039;", image: "" },
  shield: { emoji: "&#128737;&#65039;", image: "" },
  speed: { emoji: "&#128095;", image: "" },
  melee: { emoji: "&#9876;&#65039;", image: "" },
  ranged: { emoji: "&#127993;", image: "" },
  ability: { emoji: "&#10024;", image: "" },
  spell: { emoji: "&#128220;", image: "" },
  building: { emoji: "&#127984;", image: "" },
  flying: { emoji: "&#129781;", image: "" },
  heal: { emoji: "&#128154;", image: "" },
  cooldown: { emoji: "&#9203;", image: "" },
  graveyard: { emoji: "&#128128;", image: "" },
  library: { emoji: "&#128218;", image: "" }
};

const keywordCategoryOrder = ["Combat", "Movement", "Defense", "Support", "Summon / Death", "Board / Territory", "Role / Flavor", "Overige labels"];

const keywordDefinitions = {
  melee: { label: "Melee", category: "Combat", description: "Deze unit valt enemies aan op hetzelfde vakje. Melee attacks raken flying units normaal niet, behalve als kaarttekst dat specifiek zegt." },
  ranged: { label: "Ranged", category: "Combat", description: "Deze unit kan enemies binnen zijn range aanvallen. Ranged attacks kunnen meestal flying units raken, maar kunnen niet door andere units heen schieten zonder pierce." },
  "multi-hit": { label: "Multi-hit", category: "Combat", description: "Deze attack bestaat uit meerdere losse hits. Elke hit wordt apart verwerkt." },
  "stack-damage": { label: "Stack Damage", category: "Combat", description: "Een aanval of ability met Stack Damage raakt alle enemy units op het gekozen vakje, behalve als kaarttekst zegt dat friendlies ook geraakt worden." },
  "area-damage": { label: "Area Damage", category: "Combat", description: "Een aanval of ability met Area Damage raakt meerdere vakjes en doet op elk geraakt vakje ook Stack Damage." },
  siege: { label: "Siege", category: "Combat", description: "Zware lange-afstandsunit met trage beweging en krachtige line attacks." },
  "line-attack": { label: "Line attack", category: "Combat", description: "Deze aanval mag alleen in een rechte horizontale of verticale lijn." },
  "line-shot-through-units": { label: "Line shot through units", category: "Combat", description: "Deze siege attack mag door units heen schieten, maar telt niet als Pierce en geeft dit voordeel niet aan andere attacks." },
  "anti-building": { label: "Anti-building", category: "Combat", description: "Deze kaart is extra sterk tegen buildings." },
  "anti-air": { label: "Anti-air", category: "Combat", description: "Deze kaart is extra sterk tegen flying units." },
  "ground-only": { label: "Ground-only", category: "Combat", description: "Deze attack kan flying units niet raken." },
  "targeted-fire": { label: "Targeted-fire", category: "Combat", description: "Als deze unit een enemy met Targeted raakt, doet die hit 50% meer damage. Daarna verdwijnt Targeted en dezelfde aanval geeft niet meteen opnieuw Targeted." },
  "scaling-damage": { label: "Scaling-damage", category: "Combat", description: "Deze unit doet damage die schaalt met HP, shield, afstand of een andere waarde." },
  "shield-counter": { label: "Shield-counter", category: "Combat", description: "Deze kaart is speciaal goed tegen shield of krijgt voordeel wanneer shield breekt." },
  pierce: { label: "Pierce", category: "Combat", description: "Deze aanval kan door andere units heen schieten. Op dit moment heeft vooral Big Ben dit." },
  "damage-over-time": { label: "Damage-over-time", category: "Combat", description: "Deze kaart geeft een status die later extra damage doet." },
  counter: { label: "Counter Damage", category: "Combat", description: "Deze unit doet automatisch damage terug volgens zijn kaarttekst." },
  revealed: { label: "Revealed", category: "Support", description: "Deze unit verliest stealth/untargetable en krijgt 25% meer damage." },
  echo: { label: "Echo Attack", category: "Combat", description: "Na de hoofdattack volgt nog een extra hit volgens kaarttekst." },
  hitted: { label: "Hitted", category: "Combat", description: "Als deze unit genoeg damage in 1 beurt krijgt, volgt een straf wanneer hij beweegt." },
  "true-damage": { label: "True damage", category: "Combat", description: "Damage die shield negeert en direct HP raakt. Shield-only units verdwijnen door true damage." },
  swarm: { label: "Swarm", category: "Combat", description: "Swarm-units bestaan uit meerdere kleine eenheden in een token. Bij Mier(en) heeft elke mier 10 HP en 10 damage. Damage wordt per 10 omgerekend naar dode mieren; restdamage onder 10 vervalt." },

  flying: { label: "Flying", category: "Movement", description: "Deze unit vliegt. Flying units kunnen niet door alle melee of ground-only attacks geraakt worden." },
  teleport: { label: "Teleport", category: "Movement", description: "Deze unit kan verplaatsen zonder normaal te lopen." },
  "deploy-anywhere": { label: "Deploy-anywhere", category: "Movement", description: "Deze kaart mag buiten de normale deploy-zone geplaatst worden." },
  moving: { label: "Moving", category: "Movement", description: "Deze building kan bewegen." },
  charger: { label: "Charger", category: "Movement", description: "Deze unit doet damage door te bewegen of te chargen." },
  "line-movement": { label: "Line-movement", category: "Movement", description: "Deze unit mag alleen horizontaal of verticaal in een rechte lijn bewegen." },
  "slow-move": { label: "Slow move", category: "Movement", description: "Deze unit beweegt trager dan normale units volgens zijn kaarttekst." },
  "no-claim": { label: "No-claim", category: "Movement", description: "Deze unit claimt geen territory wanneer hij beweegt." },
  "hit-and-run": { label: "Hit-and-run", category: "Movement", description: "Deze unit mag na een attack nog extra bewegen volgens zijn kaarttekst." },
  mierenlijn: { label: "Mierenlijn", category: "Movement", description: "Als een Mier(en)-token naar een vakje met eigen Mier(en) beweegt, kost die stap 0 movement. Elk mierenvakje kan maximaal 1 keer per movement gratis gebruikt worden." },

  building: { label: "Building", category: "Defense", description: "Een gebouw. Buildings kunnen normaal niet bewegen en sommige kaarten doen extra damage tegen buildings." },
  base: { label: "Base", category: "Defense", description: "De hoofdstructuur van een speler. Als je base kapotgaat, verlies je. De base telt als building/structure, maar niet als bunker." },
  structure: { label: "Structure", category: "Defense", description: "Verzamelnaam voor buildings en bases." },
  bunker: { label: "Bunker", category: "Defense", description: "Een speciaal soort building of transport-label. Dit blokt Stack/Area Damage niet automatisch; daarvoor is True Bunker nodig." },
  "true-bunker": { label: "True Bunker", category: "Defense", description: "Een True Bunker beschermt units die erin zitten tegen Stack Damage en Area Damage. Alleen de True Bunker zelf krijgt de damage, zolang de kaarttekst dat zegt." },
  barrier: { label: "Barrier", category: "Defense", description: "Een verdedigende building/token met vooral shield. Barriers zijn bedoeld om damage op te vangen." },
  "shield-only": { label: "Shield-only", category: "Defense", description: "Deze kaart heeft geen HP, alleen shield. Als het shield weg is of true damage hem raakt, verdwijnt de kaart." },
  shield: { label: "Shield", category: "Defense", description: "Shield vangt damage op voordat HP geraakt wordt. In dit spel lekt een enkele hit die shield breekt niet door naar HP." },
  tank: { label: "Tank", category: "Defense", description: "Een unit met veel HP of shield die bedoeld is om damage op te vangen." },
  shielded: { label: "Shielded", category: "Defense", description: "Deze kaart begint met shield." },
  reflect: { label: "Reflect", category: "Defense", description: "Deze unit doet damage terug wanneer hij wordt aangevallen, volgens zijn kaarttekst." },
  petrify: { label: "Petrify", category: "Defense", description: "Deze kaart kan units tijdelijk in een standbeeld veranderen." },
  petrified: { label: "Petrified", category: "Defense", description: "Deze unit is versteend en kan niets doen tot het effect eindigt." },
  standbeeld: { label: "Standbeeld", category: "Defense", description: "Een versteende unit met alleen HP. Kan niet bewegen, aanvallen, abilities gebruiken of passives activeren." },
  "anti-ranged": { label: "Anti-ranged", category: "Defense", description: "Deze unit heeft een speciale verdediging tegen ranged attacks." },
  stealth: { label: "Stealth", category: "Defense", description: "Deze unit kan onder voorwaarden niet direct getarget worden door attacks of abilities." },
  shelter: { label: "Shelter", category: "Defense", description: "Deze building kan een friendly unit beschermen die erin zit." },

  healer: { label: "Healer", category: "Support", description: "Deze unit kan friendly units healen." },
  support: { label: "Support", category: "Support", description: "Deze unit helpt vooral andere units met healing, movement, protection of utility." },
  hook: { label: "Hook", category: "Support", description: "Deze unit kan een enemy naar zich toe trekken." },
  stun: { label: "Stun", category: "Support", description: "Een stunned unit kan tijdelijk niet bewegen, aanvallen of abilities gebruiken." },
  cooldown: { label: "Cooldown", category: "Support", description: "Deze attack of ability kan niet elke beurt gebruikt worden. Het cooldown-cijfer laat zien hoeveel beurten je moet wachten." },
  transport: { label: "Transport", category: "Support", description: "Deze kaart kan friendly units of gebouwen dragen/verplaatsen." },
  "carry-building": { label: "Carry-building", category: "Support", description: "Deze kaart kan een non-base building oppakken en later weer neerzetten." },
  resurrect: { label: "Resurrect", category: "Support", description: "Deze kaart kan een dode friendly unit uit de graveyard terugbrengen." },
  "area-heal": { label: "Area-heal", category: "Support", description: "Deze kaart kan meerdere friendly units in een klein gebied healen." },
  aura: { label: "Aura", category: "Support", description: "Deze kaart geeft automatisch voordeel aan units in een gebied om hem heen." },
  "damage-boost": { label: "Damage-boost", category: "Support", description: "Deze kaart kan de attack damage van een andere unit verhogen." },
  koffieboost: { label: "Koffieboost", category: "Support", description: "Tijdelijke boost: +1 speed en +20% damage. Herhaald gebruik kan Crash veroorzaken." },
  tax: { label: "Tax", category: "Support", description: "De enemy moet energie betalen om deze kaart direct te targeten." },
  politiek: { label: "Politiek", category: "Support", description: "Politieke kaarten geven steun, tax of andere board-control effecten." },
  economy: { label: "Economy", category: "Support", description: "Deze kaart kan extra energie of deck/hand-voordeel opleveren." },
  buff: { label: "Buff", category: "Support", description: "Deze kaart geeft een friendly unit een blijvende of tijdelijke verbetering." },
  lifesteal: { label: "Lifesteal", category: "Support", description: "Deze unit healt zichzelf of iemand anders op basis van damage." },
  mark: { label: "Mark", category: "Support", description: "Deze kaart zet een speciale status op een enemy." },
  "blood-contract": { label: "Blood Contract", category: "Support", description: "Een tijdelijke mark waardoor de killer healing krijgt als de marked unit doodgaat." },

  summon: { label: "Summon", category: "Summon / Death", description: "Deze unit is gemaakt door een kaart/effect, of deze kaart kan andere units maken." },
  summoner: { label: "Summoner", category: "Summon / Death", description: "Deze kaart roept andere units of tokens op." },
  token: { label: "Token", category: "Summon / Death", description: "Deze kaart zit normaal niet in het deck en ontstaat alleen door summons/effects." },
  deathrattle: { label: "Deathrattle", category: "Summon / Death", description: "Dit effect triggert wanneer de unit doodgaat." },
  sacrifice: { label: "Sacrifice", category: "Summon / Death", description: "Deze unit offert zichzelf op om een effect te activeren." },
  suicide: { label: "Suicide", category: "Summon / Death", description: "Deze unit beschadigt of vernietigt zichzelf door zijn eigen attack of ability." },
  "self-damage": { label: "Self-damage", category: "Summon / Death", description: "Deze unit krijgt damage door zijn eigen effect." },
  "chain-kill": { label: "Chain-kill", category: "Summon / Death", description: "Deze unit mag na een kill opnieuw aanvallen volgens zijn kaarttekst." },

  territory: { label: "Territory", category: "Board / Territory", description: "Deze kaart heeft een effect dat territory claimt of beïnvloedt." },
  scout: { label: "Scout", category: "Board / Territory", description: "Deze unit is snel en kan extra territory of informatie pakken." },
  phase: { label: "Phase", category: "Board / Territory", description: "Deze unit verandert permanent zodra een bepaalde voorwaarde wordt gehaald." },
  "tax-zone": { label: "Tax-zone", category: "Board / Territory", description: "Deze kaart maakt wegbewegen uit hetzelfde vakje duurder of lastiger." },

  boss: { label: "Boss", category: "Role / Flavor", description: "Beschrijvend label voor grote, centrale dreiging." },
  assassin: { label: "Assassin", category: "Role / Flavor", description: "Beschrijvend label voor snelle units die kwetsbare targets willen pakken." },
  defender: { label: "Defender", category: "Role / Flavor", description: "Beschrijvend label voor units die goed eigen gebied verdedigen." },
  control: { label: "Control", category: "Role / Flavor", description: "Beschrijvend label voor units die vijandelijke acties beperken of units uitschakelen." },
  fragile: { label: "Fragile", category: "Role / Flavor", description: "Beschrijvend label voor units met relatief weinig HP." },
  cheap: { label: "Cheap", category: "Role / Flavor", description: "Beschrijvend label voor goedkope kaarten." },
  fast: { label: "Fast", category: "Role / Flavor", description: "Beschrijvend label voor units met relatief hoge speed." },
  "long-range": { label: "Long-range", category: "Role / Flavor", description: "Beschrijvend label voor kaarten met langere attack range." },
  hybrid: { label: "Hybrid", category: "Role / Flavor", description: "Beschrijvend label voor kaarten met meerdere rollen." },
  loot: { label: "Loot", category: "Role / Flavor", description: "Steve-label: krijgt voordeel na een kill volgens zijn kaarttekst." },
  spell: { label: "Spell", category: "Role / Flavor", description: "Een kaart die direct een effect doet en daarna normaal naar de graveyard gaat." }
  ,
  "mier-en": { label: "Mier(en)", category: "Summon / Death", description: "Mier(en) is een swarm-token. Eigen Mier(en)-tokens op hetzelfde vakje worden samengevoegd. Ze mogen op bezette vakjes staan en enemies op hetzelfde vakje aanvallen." }
};

const hiddenKeywordLabels = new Set(["unit", "passive"]);

function renderIcon(iconKey) {
  const icon = ICONS[iconKey];
  if (!icon) return "";
  if (icon.image) return `<img class="stat-icon-img" src="${icon.image}" alt="${iconKey}">`;
  return "";
}

export function getHpPercent(unit) {
  const currentHp = unit.currentHp ?? unit.hp ?? 0;
  const maxHp = unit.maxHp || 1;
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
}

export function getShieldPercent(unit) {
  const maxShield = unit.maxShield ?? unit.baseShield ?? unit.shield ?? 0;
  if (!maxShield) return 0;
  const currentShield = unit.currentShield ?? unit.shield ?? 0;
  return Math.max(0, Math.min(100, (currentShield / maxShield) * 100));
}

function getHpLevel(unit) {
  const percent = getHpPercent(unit);
  if (percent <= 25) return "low";
  if (percent <= 50) return "medium";
  return "high";
}

function hasVisibleHp(unitOrCard) {
  return (unitOrCard.maxHp || 0) > 0;
}

function renderBars(unit, showText = false) {
  const currentHp = Math.max(0, unit.currentHp ?? unit.hp ?? 0);
  const maxHp = unit.maxHp || 0;
  const currentShield = Math.max(0, unit.currentShield ?? unit.shield ?? 0);
  const maxShield = unit.maxShield ?? unit.baseShield ?? unit.shield ?? 0;
  const showHp = hasVisibleHp(unit);
  return `
    <div class="unit-bars">
      ${showHp ? `<div class="hp-bar-bg" title="HP ${currentHp}/${maxHp}">
        <div class="hp-bar-fill ${getHpLevel(unit)}" style="width: ${getHpPercent(unit)}%"></div>
      </div>` : ""}
      ${currentShield > 0 ? `
        <div class="shield-bar-bg" title="Shield ${currentShield}/${maxShield}">
          <div class="shield-bar-fill" style="width: ${getShieldPercent(unit)}%"></div>
        </div>
      ` : ""}
      ${showText ? `<div class="bar-values">${showHp ? `HP ${currentHp}/${maxHp} | ` : ""}Shield ${currentShield}/${maxShield || 0}</div>` : ""}
    </div>
  `;
}

function renderCardMiniBars(card) {
  if (card.type === "spell" || (!hasVisibleHp(card) && !(card.shield || 0))) return "";
  const shield = card.shield || 0;
  return `
    <div class="card-mini-bars">
      ${hasVisibleHp(card) ? `<div class="mini-stat-line"><span>HP ${card.maxHp}</span><div class="card-mini-bar"><div class="card-mini-bar-fill hp" style="width: 100%"></div></div></div>` : ""}
      ${shield > 0 ? `<div class="mini-stat-line"><span>Shield ${shield}</span><div class="card-mini-bar"><div class="card-mini-bar-fill shield" style="width: 100%"></div></div></div>` : ""}
    </div>
  `;
}

function getSigmaBarrierDisplay(unit) {
  if (!unit?.sigmaBarrier) return null;
  const liveBarrier = unit.sigmaBarrier.placedUnitId ? getUnit(unit.sigmaBarrier.placedUnitId) : null;
  const shield = liveBarrier ? liveBarrier.shield : unit.sigmaBarrier.shield;
  const maxShield = unit.sigmaBarrier.maxShield || liveBarrier?.baseShield || 700;
  return {
    shield: Math.max(0, shield || 0),
    maxShield,
    placed: !!liveBarrier,
    destroyed: !!unit.sigmaBarrier.destroyed
  };
}

function renderSigmaBarrierPanel(unit) {
  const barrier = getSigmaBarrierDisplay(unit);
  if (!barrier) return "";
  const percent = barrier.maxShield ? Math.max(0, Math.min(100, (barrier.shield / barrier.maxShield) * 100)) : 0;
  return `
    <div class="sigma-barrier-panel wide-stat">
      <strong>Sigma Barrier: ${barrier.destroyed ? "gesloopt" : barrier.placed ? "op veld" : "bij Sigma"}</strong>
      <div class="shield-bar-bg" title="Sigma Barrier ${barrier.shield}/${barrier.maxShield}">
        <div class="shield-bar-fill" style="width: ${percent}%"></div>
      </div>
      <span>${barrier.shield} / ${barrier.maxShield} shield</span>
    </div>
  `;
}

function truncateText(text = "", max = 82) {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function formatAttack(attack) {
  const kind = attack.name === "melee" ? "melee" : "ranged";
  const label = attack.name === "ranged-heal"
    ? "Ranged Heal"
    : kind === "melee"
      ? "Melee Damage"
      : attack.name === "anti-building"
        ? "Anti-building"
        : "Ranged Damage";
  const value = `${attack.damage}${attack.hits ? ` x${attack.hits}` : ""}`;
  const range = kind === "ranged" ? ` | Range ${attack.range ?? 1}` : "";
  const cooldown = attack.cooldown ? ` | Cooldown ${attack.cooldown}` : "";
  return `<div class="attack-row"><strong>${label}</strong><span>${value}${range}${cooldown}</span></div>`;
}

function renderAttacks(cardOrUnit) {
  const attacks = cardOrUnit.attacks || [];
  if (!attacks.length) return "";
  return `<div class="attack-list">${attacks.map(formatAttack).join("")}</div>`;
}

function getRuleSections(cardOrUnit) {
  const text = cardOrUnit.abilityText || "";
  if (!text) return [];
  const isSpell = cardOrUnit.type === "spell";
  if (isSpell) return [{ label: "Effect", body: text }];
  const markers = ["Passive:", "Ability:", "Powerpunch:", "Concussion Mine:", "Hook:", "BunkerShield:"];
  const pattern = new RegExp(`(?=${markers.map((marker) => marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return [{ label: "Info", body: text }];
  return parts.map((part) => {
    const match = part.match(/^([^:]+):\s*(.*)$/);
    if (!match) return { label: "Info", body: part };
    return { label: match[1], body: match[2] };
  });
}

function renderRuleText(cardOrUnit, { fullText = false, preview = false } = {}) {
  const sections = getRuleSections(cardOrUnit);
  if (!sections.length) return "";
  const className = `${cardOrUnit.type === "spell" ? "effect-box" : "ability-box"} rule-text ${preview ? "preview" : ""} ${fullText ? "full" : ""}`;
  return `
    <div class="${className}">
      ${sections.map((section) => `
        <div>
          <strong>${section.label}</strong>
          <span>${fullText ? section.body : truncateText(section.body || "", preview ? 82 : 120)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAbility(cardOrUnit, fullText = false) {
  return renderRuleText(cardOrUnit, { fullText });
}

function getCardKeywords(card) {
  const keywords = new Set();
  if (card.type && card.type !== "unit") keywords.add(card.type);
  (card.tags || []).forEach((tag) => {
    if (!hiddenKeywordLabels.has(tag)) keywords.add(tag);
  });
  if (card.role && keywordDefinitions[card.role]) keywords.add(card.role);
  (card.attacks || []).forEach((attack) => {
    if (attack.name !== "ranged-heal" && attack.name !== "anti-building") keywords.add(attack.name);
    if (attack.range > 1 || attack.name === "ranged") keywords.add("ranged");
    if (attack.name === "melee") keywords.add("melee");
    if (attack.hits && attack.hits > 1) keywords.add("multi-hit");
    if (attack.cooldown) keywords.add("cooldown");
    if (attack.name === "anti-building") keywords.add("anti-building");
  });
  if ((card.maxHp || 0) >= 700 || (card.shield || 0) >= 150 || card.tags?.includes("tank")) keywords.add("tank");
  if ((card.maxHp || 0) <= 200 && card.type === "unit") keywords.add("fragile");
  if ((card.shield || 0) > 0) keywords.add("shielded");
  if ((card.speed || 0) >= 2) keywords.add("fast");
  const text = `${card.name} ${card.abilityText || ""} ${card.role || ""} ${(card.tags || []).join(" ")}`.toLowerCase();
  const textMatches = [
    ["heal", "healer"],
    ["revive", "resurrect"],
    ["stun", "stun"],
    ["barrier", "barrier"],
    ["bunker", "bunker"],
    ["summon", "summon"],
    ["token", "token"],
    ["flying", "flying"],
    ["area damage", "area-damage"],
    ["stack damage", "stack-damage"],
    ["hook", "hook"],
    ["building", "building"],
    ["territory", "territory"],
    ["phase", "phase"],
    ["reflect", "reflect"],
    ["cooldown", "cooldown"]
  ];
  textMatches.forEach(([needle, keyword]) => {
    if (text.includes(needle)) keywords.add(keyword);
  });
  return [...keywords]
    .filter((keyword) => keyword && !hiddenKeywordLabels.has(keyword))
    .sort(compareKeywords);
}

function compareKeywords(a, b) {
  const aDef = getKeywordDefinition(a);
  const bDef = getKeywordDefinition(b);
  const categoryDiff = keywordCategoryOrder.indexOf(aDef.category) - keywordCategoryOrder.indexOf(bDef.category);
  if (categoryDiff !== 0) return categoryDiff;
  return aDef.label.localeCompare(bDef.label);
}

function getKeywordDefinition(keyword) {
  return keywordDefinitions[keyword] || {
    label: toLabel(keyword),
    category: "Overige labels",
    description: "Nog geen officiële uitleg. Dit label komt uit kaartdata of role-tekst en is vooral handig als filter."
  };
}

function toLabel(keyword = "") {
  return keyword
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAllKeywordCards() {
  return [...cards, baseCards.p1, baseCards.p2];
}

function renderKeywordChips(card) {
  return `<div class="keyword-chips">${getCardKeywords(card).slice(0, 9).map((keyword) => `<span>${getKeywordDefinition(keyword).label}</span>`).join("")}</div>`;
}

function renderCardStats(card, options = {}) {
  const fullText = !!options.fullText;
  if (card.type === "spell") {
    return `
      <div class="card-stat-list compact">
        <div class="stat-row"><strong>Spell</strong><span>${card.abilityTargetType || "target"}</span></div>
      </div>
      ${renderRuleText(card, { fullText, preview: true })}
    `;
  }
  return `
    <div class="card-stat-list compact">
      <div class="stat-row"><strong>Type</strong><span>${card.type}${card.role ? ` / ${card.role}` : ""}</span></div>
      ${renderCardMiniBars(card)}
      ${card.type !== "building" ? `<div class="stat-row"><strong>Speed</strong><span>${card.speed || 0}</span></div>` : ""}
    </div>
    ${renderAttacks(card)}
    ${renderRuleText(card, { fullText, preview: true })}
  `;
}

export function bindUi() {
  viewTabs.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelector("#newGameBtn").addEventListener("click", () => {
    resetGame();
    render();
  });
}

function setView(viewName) {
  Object.entries(views).forEach(([name, view]) => view.classList.toggle("active", name === viewName));
  viewTabs.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  if (viewName === "cards") renderAllCardsOverview();
  if (viewName === "keywords") renderKeywordsOverview();
}

function setMode(mode) {
  const unit = getUnit(state.selectedUnitId);
  if (!unit || unit.owner !== state.activePlayer) return;
  if (mode === "ability" && !hasActiveAbility(unit)) {
    addLog(`${unit.name} heeft geen actieve ability.`);
    render();
    return;
  }
  state.currentMode = mode === "ability" ? "abilityTargeting" : "unitAction";
  state.selectedCardIndex = null;
  render();
}

export function render() {
  document.body.classList.toggle("active-player-1", state.activePlayer === 1);
  document.body.classList.toggle("active-player-2", state.activePlayer === 2);
  renderStats();
  renderEnergyBar();
  renderBaseStatuses();
  renderBoard();
  renderUnitActionControls();
  renderSelectedUnitPanel();
  renderHand();
  renderDetails();
  renderLog();
  renderImageDebug();
  renderAllCardsOverview();
  renderKeywordsOverview();
}

function renderEnergyBar() {
  const player = getPlayer();
  const bonus = player.nextTurnEnergyBonus || 0;
  energyBarEl.innerHTML = `
    <div class="energy-label">Energie speler ${player.id}: ${player.energy}/${MAX_ENERGY}${bonus ? ` <span>+${bonus} volgende beurt</span>` : ""}</div>
    <div class="energy-pips">
      ${Array.from({ length: MAX_ENERGY }, (_, index) => `<span class="${index < player.energy ? "filled" : "empty"}"></span>`).join("")}
    </div>
  `;
}

function renderUnitActionControls() {
  const unit = getUnit(state.selectedUnitId);
  const isOwnActiveUnit = unit?.owner === state.activePlayer && unit.type !== "base";
  if (!isOwnActiveUnit || state.currentMode === "discarding") {
    unitActionControlsEl.innerHTML = "";
    unitActionControlsEl.classList.remove("active");
    return;
  }
  unitActionControlsEl.classList.add("active");
  unitActionControlsEl.innerHTML = `
    <div class="unit-action-label">${unit.name}: rood klikt aanval, groen klikt lopen. Lopen/Aanvallen kan je nog forceren.</div>
    <div class="unit-action-buttons">
      <button type="button" data-intent="move" class="${state.unitActionIntent === "move" ? "active" : ""}" ${unit.hasMovedThisTurn ? "disabled" : ""}>Lopen</button>
      <button type="button" data-intent="attack" class="${state.unitActionIntent === "attack" ? "active" : ""}" ${unit.hasAttackedThisTurn ? "disabled" : ""}>Aanvallen</button>
      <button type="button" data-intent="cancel">Cancel selectie</button>
    </div>
  `;
  unitActionControlsEl.querySelectorAll("button[data-intent]").forEach((button) => {
    button.addEventListener("click", () => {
      const intent = button.dataset.intent;
      if (intent === "cancel") {
        clearSelection();
      } else {
        state.currentMode = "unitAction";
        state.unitActionIntent = intent;
        if (intent === "attack") {
          const targets = getValidAttackTargets(unit).filter((target) => target.type !== "base");
          if (targets.length === 1) {
            attackUnit(unit, targets[0]);
            selectUnit(unit.unitId);
            state.unitActionIntent = "attack";
          }
        }
      }
      render();
    });
  });
}

export function renderPlayerStats() {
  renderStats();
}

function renderStats() {
  const active = getPlayer();
  const rows = state.players.map((player) => {
    const base = getBase(player.id);
    return `
      <div class="player-stat p${player.id}">
        <strong>Speler ${player.id}</strong>
        <span>Base ${base ? base.hp : 0}/${base ? base.maxHp : 2500}</span>
        <span>Library ${player.deck.length}</span>
        <span>Hand ${player.hand.length}</span>
        <span>Graveyard ${player.graveyard.length}</span>
      </div>
    `;
  });
  statsEl.innerHTML = `
    <div class="stat-pill active-stat">Actief: speler ${state.activePlayer}</div>
    <div class="stat-pill active-stat">Energie ${active.energy}</div>
    <div class="stat-pill active-stat">Ronde ${state.turn}</div>
    ${rows.join("")}
  `;
}

function renderBoard() {
  boardEl.innerHTML = "";
  const selected = getUnit(state.selectedUnitId);
  const validMoves = state.currentMode === "unitAction" && selected?.owner === state.activePlayer ? getValidMoveSquares(selected) : [];
  const validAttacks = state.currentMode === "unitAction" && selected?.owner === state.activePlayer ? getValidAttackTargets(selected) : [];
  const validGustavTiles = state.currentMode === "unitAction" && selected?.cardId === "schwerer-gustav" ? getValidGustavTargetTiles(selected) : [];
  const validBaseAttacks = state.currentMode === "unitAction" && selected?.owner === state.activePlayer
    ? getValidBaseAttackTiles(selected)
    : [];
  const validAbilityTargets = state.currentMode === "abilityTargeting" && selected?.owner === state.activePlayer ? getValidAbilityTargets(selected) : [];
  const placingCard = state.currentMode === "placingCard" && state.selectedCardIndex !== null ? getPlayer().hand[state.selectedCardIndex] : null;
  const validSpellTargets = placingCard?.type === "spell" ? getValidSpellTargets(placingCard) : [];

  boardEl.style.gridTemplateColumns = `repeat(${state.boardCols}, var(--board-cell-size))`;
  boardEl.style.gridTemplateRows = `repeat(${state.boardRows}, var(--board-cell-size))`;
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) {
      const cell = document.createElement("button");
      cell.className = "board-cell cell";
      cell.type = "button";
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (y >= state.boardRows - 2) cell.classList.add("deploy-zone-p1");
      if (y <= 1) cell.classList.add("deploy-zone-p2");
      if (y === 0 || y === state.boardRows - 1) {
        cell.classList.add("base-attack-row");
        cell.dataset.baseMarker = "🏰";
      }
      const units = unitsAt(x, y);
      decorateAura(cell, x, y, selected);
      if (units.length) cell.appendChild(renderUnitsStack(units));
      decorateTerritory(cell, x, y);
      decorateCell(cell, x, y, validMoves, validAttacks, validBaseAttacks, validAbilityTargets, placingCard, validSpellTargets, validGustavTiles);
      cell.addEventListener("click", () => handleCellClick(x, y));
      boardEl.appendChild(cell);
    }
  }
}

function renderBaseStatuses() {
  renderBaseStatus(baseStatusP2El, 2);
  renderBaseStatus(baseStatusP1El, 1);
}

function renderBaseStatus(root, ownerId) {
  if (!root) return;
  const base = getBase(ownerId);
  root.className = `base-status p${ownerId}`;
  root.innerHTML = `
    <strong>Speler ${ownerId} Base</strong>
    <span>${base ? `${base.hp}/${base.maxHp}` : "kapot"}</span>
  `;
}

function decorateTerritory(cell, x, y) {
  const tile = tileAt(x, y);
  if (!tile) return;
  cell.classList.add(`territory-${tile.territoryOwner || "neutral"}`);
  if (tile.isProtectedBaseZone) cell.classList.add(`protected-p${tile.protectedForPlayer}`);
}

const auraDefinitions = [
  { cardId: "politicus", radius: 1, className: "aura-politics", label: "+SH", title: "Politieke Steun: friendly units krijgen shield." },
  { cardId: "koffieautomaat", radius: 1, className: "aura-coffee", label: "+SPD", title: "Koffieboost range: friendly unit kan speed/damage boost krijgen." },
  { cardId: "manager", radius: 3, className: "aura-manager", label: "+DMG", title: "Motiverende Speech range: friendly unit kan permanent damage/speed krijgen." },
  { cardId: "mierenkoningin", radius: 1, className: "aura-summon", label: "SUM", title: "Mierenkoningin spawnt mieren rondom haar." },
  { cardId: "pillager-captain", radius: 1, className: "aura-raid", label: "+ATK", title: "Raid Banner: summons/tokens in dit gebied krijgen attack bonus." },
  { cardId: "necromancer", radius: 1, className: "aura-necro", label: "BONE", title: "Necromancer support range voor tokens en summons." },
  { cardId: "alchemist", radius: 1, className: "aura-alchemy", label: "POT", title: "Alchemist potion range voor friendly units." },
  { cardId: "mercy", radius: 1, className: "aura-heal", label: "HEAL", title: "Mercy heal/revive support range." },
  { cardId: "pam", radius: 1, className: "aura-heal", label: "HEAL", title: "Pam area-heal range." },
  { cardId: "orisa", radius: 1, className: "aura-barrier", label: "BAR", title: "Orisa Barrier placement range." },
  { cardId: "sigma", radius: 1, className: "aura-barrier", label: "BAR", title: "Sigma Barrier placement range." },
  { cardId: "maarschalk", radius: 1, className: "aura-command", label: "CMD", title: "Maarschalk command range voor ranged units." }
];

function decorateAura(cell, x, y, selected = null) {
  const auras = getAuraInfoForTile(x, y);
  if (!auras.length) return;
  cell.classList.add("has-aura");
  auras.forEach((aura) => cell.classList.add(aura.className));
  if (selected && auras.some((aura) => aura.sourceId === selected.unitId)) cell.classList.add("selected-aura");
  const strongest = auras.find((aura) => aura.sourceId === selected?.unitId) || auras[0];
  cell.title = [cell.title, ...auras.map((aura) => aura.title)].filter(Boolean).join(" | ");
  const badge = document.createElement("span");
  badge.className = "aura-cell-label";
  badge.textContent = auras.length > 1 ? `${strongest.label}+` : strongest.label;
  cell.appendChild(badge);
}

function getAuraInfoForTile(x, y) {
  return state.units.flatMap((unit) => {
    if (unit.type === "base" || isPetrified(unit)) return [];
    const definition = auraDefinitions.find((item) => item.cardId === unit.cardId);
    if (!definition || distance(unit, { x, y }) > definition.radius) return [];
    return [{ ...definition, sourceId: unit.unitId, owner: unit.owner }];
  });
}

function decorateCell(cell, x, y, validMoves, validAttacks, validBaseAttacks, validAbilityTargets, placingCard, validSpellTargets, validGustavTiles = []) {
  const radiationZone = state.radiationZones?.find((zone) => x >= zone.x - 1 && x <= zone.x + 1 && y >= zone.y - 1 && y <= zone.y + 1);
  if (radiationZone) {
    cell.classList.add("radiation-zone");
    cell.dataset.radiation = `Radiation ${radiationZone.turnsRemaining}`;
  }
  if (placingCard?.type === "spell" && validSpellTargets.some((target) => target.x === x && target.y === y)) cell.classList.add("valid-spell-target");
  if (placingCard?.type === "spell" && !validSpellTargets.some((target) => target.x === x && target.y === y)) cell.classList.add("invalid-place");
  if (placingCard && placingCard.type !== "spell" && isDeployCell(placingCard, x, y)) cell.classList.add("valid-place");
  if (placingCard && placingCard.type !== "spell" && !isDeployCell(placingCard, x, y)) cell.classList.add("invalid-place");
  if (validMoves.some((square) => square.x === x && square.y === y)) cell.classList.add("valid-move");
  if (validAttacks.some((target) => target.x === x && target.y === y)) cell.classList.add("valid-attack");
  if (validGustavTiles.some((target) => target.x === x && target.y === y)) cell.classList.add("valid-attack");
  if (validBaseAttacks.some((target) => target.x === x && target.y === y)) cell.classList.add("valid-base-attack");
  if (validAbilityTargets.some((target) => target.x === x && target.y === y)) cell.classList.add("valid-ability");
}

function renderUnitsStack(units) {
  const stack = document.createElement("div");
  stack.className = units.length > 1 ? "unit-stack multi" : "unit-stack";
  if (units.length > 4) stack.classList.add("crowded");
  stack.dataset.count = units.length;
  units.forEach((unit) => stack.appendChild(renderUnit(unit)));
  return stack;
}

function renderUnit(unit) {
  const token = document.createElement("div");
  token.className = `board-piece unit-token p${unit.owner}`;
  token.dataset.unitId = unit.unitId;
  if (unit.owner === state.activePlayer && unit.type !== "base") {
    if (!unit.hasMovedThisTurn && !unit.statuses.stunned && !unit.statuses.cannotAct && unit.speed > 0) token.classList.add("can-move-glow");
    else if (!unit.hasAttackedThisTurn && !unit.statuses.stunned && !unit.statuses.cannotAct && !unit.statuses.cannotAttack && unit.attacks?.length) token.classList.add("can-attack-glow");
  }
  if (unit.unitId === state.selectedUnitId) token.classList.add("selected-unit");
  if (unit.unitId === state.inspectedUnitId && unit.unitId !== state.selectedUnitId) token.classList.add("inspected-unit");
  const statuses = Object.entries(unit.statuses)
    .map(([key, value]) => `${key}:${value}`)
    .join(" ");
  const statusBadges = [
    unit.statuses.grounded ? `<span class="status-badge snow">SNOW</span>` : "",
    unit.carriedBuildingId ? `<span class="status-badge carry">CARRY</span>` : "",
    unit.carriedByUnitId ? `<span class="status-badge carry">HELD</span>` : "",
    ...renderAuraBadges(unit),
    renderCooldownBadge(unit)
  ].join("");
  token.innerHTML = `
    <img src="${unit.image}" alt="${unit.name}" onerror="this.src='assets/cards/placeholder.svg'; this.onerror=null;">
    <div class="unit-meta">
      <div class="board-piece-name unit-name">P${unit.owner} ${unit.name}</div>
      ${isAntToken(unit) ? `<div class="status-line">antCount ${unit.antCount || 1} · dmg ${(unit.antCount || 1) * 10}</div>` : ""}
      ${renderBars(unit)}
      ${statusBadges}
      ${unit.type === "base" ? "" : `<div class="status-line">${statuses || "&nbsp;"}</div>`}
    </div>
  `;
  token.addEventListener("click", (event) => {
    event.stopPropagation();
    handleCellClick(unit.x, unit.y, unit.unitId);
  });
  return token;
}

function renderAuraBadges(unit) {
  const badges = [];
  if (unit.politiekeSteunShield > 0) badges.push(`<span class="status-badge aura-badge shield">+SH</span>`);
  if (unit.statuses.managerBuff) badges.push(`<span class="status-badge aura-badge manager">+DMG</span>`);
  if (unit.statuses.koffieboost) badges.push(`<span class="status-badge aura-badge coffee">+SPD</span>`);
  if (unit.statuses.koffieCrash) badges.push(`<span class="status-badge aura-badge crash">CRASH</span>`);
  if (unit.statuses.revealed) badges.push(`<span class="status-badge aura-badge reveal">REV</span>`);
  if (unit.theeBurnStacks?.length) badges.push(`<span class="status-badge aura-badge burn">TEA</span>`);
  if (unit.statuses.hitted) badges.push(`<span class="status-badge aura-badge hit">HIT</span>`);
  const hasRaidBanner = unit.tags?.some((tag) => tag === "summon" || tag === "token")
    && state.units.some((source) => source.owner === unit.owner && source.cardId === "pillager-captain" && distance(source, unit) <= 1 && !isPetrified(source));
  if (hasRaidBanner) badges.push(`<span class="status-badge aura-badge raid">+ATK</span>`);
  return badges;
}

function renderHand() {
  const player = getPlayer();
  const isDiscarding = state.currentMode === "discarding" && state.pendingDiscardPlayer === player.id;
  handEl.innerHTML = "";
  if (isDiscarding) {
    const notice = document.createElement("div");
    notice.className = "discard-notice";
    notice.textContent = "Optioneel: klik 1 kaart om weg te gooien voor +1 energie volgende beurt.";
    handEl.appendChild(notice);
  }
  player.hand.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    if (isDiscarding) button.classList.add("discard-choice");
    if (index === state.selectedCardIndex) button.classList.add("selected");
    if (!isDiscarding && (card.cost ?? 0) > player.energy) button.classList.add("unaffordable");
    button.innerHTML = `
      <img src="${card.image}" alt="${card.name}" onerror="this.src='assets/cards/placeholder.svg'; this.onerror=null;">
      <div class="card-body">
        <div class="card-title"><span>${card.name}</span><span class="cost-badge"><span class="cost-icon"></span>${card.cost ?? 0}</span></div>
        ${renderCardStats(card)}
      </div>
    `;
    button.addEventListener("click", () => {
      if (isDiscarding) {
        discardCardForEndTurn(index);
        render();
        return;
      }
      if ((card.cost ?? 0) > player.energy) {
        addLog("Niet genoeg energie.");
        render();
        return;
      }
      if (card.type === "spell" && getValidSpellTargets(card).length === 0) {
        addLog(`${card.name} heeft nu geen geldig target.`);
        render();
        return;
      }
      state.selectedCardIndex = index;
      state.selectedUnitId = null;
      state.inspectedUnitId = null;
      state.currentMode = "placingCard";
      render();
    });
    handEl.appendChild(button);
  });
  const endButton = document.createElement("button");
  endButton.type = "button";
  endButton.className = "hand-end-turn";
  endButton.textContent = isDiscarding ? "Einde beurt zonder discard" : "Einde beurt";
  endButton.addEventListener("click", () => {
    if (isDiscarding) skipEndTurnDiscard();
    else endTurn();
    render();
  });
  handEl.appendChild(endButton);
}

function renderDetails() {
  const card = state.selectedCardIndex !== null ? getPlayer().hand[state.selectedCardIndex] : null;
  const unit = getUnit(state.selectedUnitId) || getUnit(state.inspectedUnitId);
  if (card) {
    selectionEl.textContent = `${card.name} geselecteerd. Klik op het bord.`;
    detailsEl.innerHTML = `<strong>${card.name}</strong><br>${card.abilityText || ""}`;
    return;
  }
  if (state.currentMode === "discarding") {
    selectionEl.textContent = `Speler ${state.activePlayer}: gooi 1 kaart weg.`;
    detailsEl.textContent = "Klik op een handkaart om die naar de graveyard te doen.";
    return;
  }
  if (unit) {
    const actionHint = unit.owner === state.activePlayer ? `Groen = lopen, rood = aanvallen. Actief: ${state.unitActionIntent === "attack" ? "aanvallen" : "lopen"}.` : "Enemy stats bekijken.";
    selectionEl.textContent = `${unit.name} geselecteerd. ${actionHint}`;
    detailsEl.innerHTML = `<strong>${unit.name}</strong><br>${hasVisibleHp(unit) ? `HP ${unit.hp}/${unit.maxHp}, ` : ""}shield ${unit.currentShield}/${unit.maxShield || 0}<br>${unit.abilityText}`;
    return;
  }
  selectionEl.textContent = "Kies een kaart of unit.";
  detailsEl.textContent = "Nog niets geselecteerd.";
}

export function renderSelectedUnitPanel() {
  const unit = getUnit(state.selectedUnitId) || getUnit(state.inspectedUnitId);
  if (!unit) {
    selectedUnitPanelEl.innerHTML = `<div class="empty-selected">Geen unit geselecteerd.</div>`;
    return;
  }

  if (unit.type === "base") {
    selectedUnitPanelEl.innerHTML = `
      <div class="selected-unit-card p${unit.owner} base-summary">
        <img src="${unit.image}" alt="${unit.name}" onerror="this.src='assets/cards/placeholder.svg'; this.onerror=null;">
        <div class="selected-unit-info">
          <div class="selected-unit-head">
            <h2>${unit.name}</h2>
            <span>Eigenaar: speler ${unit.owner}</span>
          </div>
          <div class="base-hp">HP: ${unit.currentHp} / ${unit.maxHp}</div>
          ${renderBars(unit, true)}
          <div class="selected-actions">
            <button id="panelCancelBtn" type="button">Cancel selectie</button>
          </div>
        </div>
      </div>
    `;
    document.querySelector("#panelCancelBtn")?.addEventListener("click", () => {
      clearSelection();
      render();
    });
    return;
  }

  const isOwnActiveUnit = unit.owner === state.activePlayer;
  const hasAbility = hasActiveAbility(unit);
  const statuses = Object.entries(unit.statuses)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ") || "geen";
  const tags = [unit.type, unit.role, ...(unit.tags || [])].filter(Boolean).join(", ");
  const abilityOnCooldown = unit.cardId === "roadhog" && (unit.hookCooldownRemaining || 0) > 0;

  selectedUnitPanelEl.innerHTML = `
    <div class="selected-unit-card p${unit.owner}">
      <img src="${unit.image}" alt="${unit.name}" onerror="this.src='assets/cards/placeholder.svg'; this.onerror=null;">
      <div class="selected-unit-info">
        <div class="selected-unit-head">
          <h2>${unit.name}</h2>
          <span>Eigenaar: speler ${unit.owner}</span>
        </div>
        <div class="unit-info-grid">
          <span>Type: ${tags}</span>
          ${hasVisibleHp(unit) ? `<span>HP: ${unit.currentHp} / ${unit.maxHp}</span>` : ""}
          ${isPetrified(unit) ? `<span>Status: Standbeeld</span><span>Damage: geen</span><span>Speed: geen</span>` : ""}
          ${isAntToken(unit) ? `<span>antCount: ${unit.antCount || 1}</span><span>Swarm damage: ${(unit.antCount || 1) * 10}</span>` : ""}
          <span>Shield: ${unit.currentShield} / ${unit.maxShield || 0}</span>
          <div class="wide-stat">${renderBars(unit, true)}</div>
          ${unit.cardId === "sigma" ? renderSigmaBarrierPanel(unit) : ""}
          <span>In gebouw: ${unit.insideBuildingId ? getUnit(unit.insideBuildingId)?.name || "ja" : "nee"}</span>
          <span>Speed: ${unit.speed} x${unit.speedMultiplier || 1}</span>
          <div class="wide-stat">${renderAttacks(unit) || "<span>Geen aanval</span>"}</div>
          <span>Statussen: ${statuses}</span>
          <span>Cooldown: ${unit.cooldownRemaining || 0}</span>
          ${unit.tags.includes("healer") ? `<span>Heal cooldown: ${unit.healCooldownRemaining || 0}</span>` : ""}
          ${unit.cardId === "roadhog" ? `<span>Hook cooldown: ${unit.hookCooldownRemaining || 0}</span>` : ""}
          ${unit.cardId === "mercy" ? `<span>Revive cooldown: ${unit.mercyReviveCooldownRemaining || 0}</span>` : ""}
          ${unit.cardId === "sigma" && unit.sigmaBarrier ? `<span>Sigma barrier: ${getSigmaBarrierDisplay(unit)?.destroyed ? "gesloopt" : `${getSigmaBarrierDisplay(unit)?.shield}/${getSigmaBarrierDisplay(unit)?.maxShield}`}</span>` : ""}
          <span>Ability gebruikt: ${unit.usedAbility ? "ja" : "nee"}</span>
          <span>Bewogen deze beurt: ${unit.hasMovedThisTurn ? "ja" : "nee"}</span>
          <span>Aangevallen deze beurt: ${unit.hasAttackedThisTurn ? "ja" : "nee"}</span>
          <span>Ability deze beurt: ${unit.hasUsedAbilityThisTurn ? "ja" : "nee"}</span>
          ${hasAbility ? `<span>Ability cost: ${unit.abilityCost ?? 1} energie</span>` : ""}
          <span>Ability target: ${unit.abilityTargetType || "none"}</span>
        </div>
        ${renderAbility(unit)}
        <div class="selected-actions">
          ${isOwnActiveUnit && hasAbility ? `<button id="panelAbilityBtn" type="button" ${abilityOnCooldown ? "disabled" : ""}>${abilityOnCooldown ? "Ability op cooldown" : "Gebruik ability"}</button>` : ""}
          ${isOwnActiveUnit && unit.tags.includes("healer") && !["medic-drone"].includes(unit.cardId) ? `<button id="panelHealBtn" type="button">Gebruik heal</button>` : ""}
          ${isOwnActiveUnit && unit.cardId === "jet" ? `<button id="panelReturnBtn" type="button">Terug naar hand</button>` : ""}
          <button id="panelCancelBtn" type="button">Cancel selectie</button>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#panelCancelBtn")?.addEventListener("click", () => {
    clearSelection();
    render();
  });
  document.querySelector("#panelAbilityBtn")?.addEventListener("click", () => {
    if (abilityOnCooldown) {
      addLog("Ability op cooldown.");
      render();
      return;
    }
    if (unit.hasUsedAbilityThisTurn) {
      addLog(`${unit.name} heeft deze beurt al een ability gebruikt.`);
      render();
      return;
    }
    if (getPlayer().energy < (unit.abilityCost ?? 1)) {
      addLog(`Speler ${state.activePlayer} heeft niet genoeg energie.`);
      render();
      return;
    }
    if ((unit.abilityTargetType || "none") === "none" || unit.cardId === "takel-heli") {
      activateAbility(unit);
      clearSelection();
      render();
      return;
    }
    state.currentMode = "abilityTargeting";
    addLog(`Kies een target of vakje voor ${unit.name}.`);
    render();
  });
  document.querySelector("#panelHealBtn")?.addEventListener("click", () => {
    activateHeal(unit);
    render();
  });
  document.querySelector("#panelReturnBtn")?.addEventListener("click", () => {
    activateAbility(unit);
    clearSelection();
    render();
  });
}

function renderLog() {
  logEl.innerHTML = state.log.map((item) => `<div class="log-item">${item}</div>`).join("");
}

function renderImageDebug() {
  debugEl.innerHTML = buildImageDebugRows().map((row) => `<code>${row}</code>`).join("");
}

export function renderAllCardsOverview() {
  if (!allCardsOverviewEl || !cardFiltersEl) return;
  renderCardGalleryControls();

  const shownCards = cards
    .filter(cardMatchesGalleryFilters)
    .sort(compareGalleryCards);

  if (!shownCards.length) {
    allCardsOverviewEl.innerHTML = `<p class="empty-card-results">Geen kaarten gevonden.</p>`;
    return;
  }

  allCardsOverviewEl.innerHTML = shownCards
    .map((card) => {
      return `
        <article class="card overview-card full-card">
          <img src="${card.image}" alt="${card.name}" onerror="this.src='assets/cards/placeholder.svg'; this.onerror=null;">
          <div class="card-body">
            <div class="card-title"><span>${card.name}</span><span class="cost-badge"><span class="cost-icon"></span>${card.cost ?? 0}</span></div>
            ${card.tags?.includes("token") ? `<p class="token-label">Token / niet in deck</p>` : ""}
            ${card.abilityCost !== undefined ? `<p>Ability cost: ${card.abilityCost} energie</p>` : ""}
            ${renderCardStats(card, { fullText: true })}
            ${renderKeywordChips(card)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCardGalleryControls() {
  const typeOptions = getCardGalleryTypes();
  cardFiltersEl.innerHTML = `
    <label class="card-filter-field search">
      <span>Zoeken</span>
      <input id="cardSearchInput" type="search" placeholder="Zoek kaartnaam..." value="${escapeAttribute(cardGalleryFilters.search)}">
    </label>
    <label class="card-filter-field">
      <span>Energy</span>
      <select id="cardEnergyFilter">
        ${[
          ["all", "Alle energy costs"],
          ["0", "0 energy"],
          ["1", "1 energy"],
          ["2", "2 energy"],
          ["3", "3 energy"],
          ["4", "4 energy"],
          ["5", "5 energy"],
          ["6", "6 energy"],
          ["7", "7 energy"],
          ["8plus", "8+ energy"]
        ].map(([value, label]) => `<option value="${value}" ${cardGalleryFilters.energy === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
    <label class="card-filter-field">
      <span>Type</span>
      <select id="cardTypeFilter">
        <option value="all">Alle types</option>
        ${typeOptions.map((type) => `<option value="${type.value}" ${cardGalleryFilters.type === type.value ? "selected" : ""}>${type.label}</option>`).join("")}
      </select>
    </label>
    <label class="card-filter-field">
      <span>Sorteren</span>
      <select id="cardSortFilter">
        ${[
          ["name-asc", "Alfabetisch A-Z"],
          ["name-desc", "Alfabetisch Z-A"],
          ["energy-asc", "Energy laag naar hoog"],
          ["energy-desc", "Energy hoog naar laag"],
          ["hp-asc", "HP laag naar hoog"],
          ["hp-desc", "HP hoog naar laag"],
          ["damage-asc", "Damage laag naar hoog"],
          ["damage-desc", "Damage hoog naar laag"]
        ].map(([value, label]) => `<option value="${value}" ${cardGalleryFilters.sort === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
    <button id="resetCardFiltersBtn" class="reset-card-filters" type="button">Reset filters</button>
  `;

  cardFiltersEl.querySelector("#cardSearchInput")?.addEventListener("input", (event) => {
    cardGalleryFilters.search = event.target.value;
    renderAllCardsOverview();
  });
  cardFiltersEl.querySelector("#cardEnergyFilter")?.addEventListener("change", (event) => {
    cardGalleryFilters.energy = event.target.value;
    renderAllCardsOverview();
  });
  cardFiltersEl.querySelector("#cardTypeFilter")?.addEventListener("change", (event) => {
    cardGalleryFilters.type = event.target.value;
    renderAllCardsOverview();
  });
  cardFiltersEl.querySelector("#cardSortFilter")?.addEventListener("change", (event) => {
    cardGalleryFilters.sort = event.target.value;
    renderAllCardsOverview();
  });
  cardFiltersEl.querySelector("#resetCardFiltersBtn")?.addEventListener("click", () => {
    cardGalleryFilters = { ...defaultCardGalleryFilters };
    renderAllCardsOverview();
  });
}

function getCardGalleryTypes() {
  const wantedTypes = [
    ["unit", "Unit", (card) => card.type === "unit"],
    ["spell", "Spell", (card) => card.type === "spell"],
    ["building", "Building", (card) => card.type === "building"],
    ["flying", "Flying", (card) => card.tags?.includes("flying") || card.role?.includes("flying")],
    ["token", "Token", (card) => card.tags?.includes("token")],
    ["structure", "Structure", (card) => card.tags?.includes("structure") || card.tags?.includes("building") || card.type === "building"]
  ];
  return wantedTypes
    .filter(([, , predicate]) => cards.some(predicate))
    .map(([value, label]) => ({ value, label }));
}

function cardMatchesGalleryFilters(card) {
  const search = cardGalleryFilters.search.trim().toLowerCase();
  if (search && !card.name.toLowerCase().includes(search)) return false;
  if (!matchesEnergyFilter(card, cardGalleryFilters.energy)) return false;
  if (!matchesTypeFilter(card, cardGalleryFilters.type)) return false;
  return true;
}

function matchesEnergyFilter(card, filter) {
  if (filter === "all") return true;
  const cost = card.cost ?? 0;
  if (filter === "8plus") return cost >= 8;
  return cost === Number(filter);
}

function matchesTypeFilter(card, filter) {
  if (filter === "all") return true;
  if (filter === "unit" || filter === "spell" || filter === "building") return card.type === filter;
  if (filter === "flying") return card.tags?.includes("flying") || card.role?.includes("flying");
  if (filter === "token") return card.tags?.includes("token");
  if (filter === "structure") return card.tags?.includes("structure") || card.tags?.includes("building") || card.type === "building";
  return card.tags?.includes(filter) || card.role === filter;
}

function compareGalleryCards(a, b) {
  const sort = cardGalleryFilters.sort;
  if (sort === "name-desc") return b.name.localeCompare(a.name);
  if (sort === "energy-asc") return compareNumberThenName(a.cost ?? 0, b.cost ?? 0, a, b);
  if (sort === "energy-desc") return compareNumberThenName(b.cost ?? 0, a.cost ?? 0, a, b);
  if (sort === "hp-asc") return compareNumberThenName(getCardHpValue(a), getCardHpValue(b), a, b);
  if (sort === "hp-desc") return compareNumberThenName(getCardHpValue(b), getCardHpValue(a), a, b);
  if (sort === "damage-asc") return compareNumberThenName(getCardDamageValue(a), getCardDamageValue(b), a, b);
  if (sort === "damage-desc") return compareNumberThenName(getCardDamageValue(b), getCardDamageValue(a), a, b);
  return a.name.localeCompare(b.name);
}

function compareNumberThenName(first, second, cardA, cardB) {
  const diff = first - second;
  return diff || cardA.name.localeCompare(cardB.name);
}

function getCardHpValue(card) {
  return (card.maxHp || 0) + (card.shield || 0);
}

function getCardDamageValue(card) {
  return Math.max(0, ...(card.attacks || []).map((attack) => (attack.damage || 0) * (attack.hits || 1)));
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderKeywordsOverview() {
  if (!keywordsOverviewEl) return;
  const keywordMap = new Map();
  getAllKeywordCards().forEach((card) => {
    getCardKeywords(card).forEach((keyword) => {
      if (!keywordMap.has(keyword)) keywordMap.set(keyword, []);
      keywordMap.get(keyword).push(card);
    });
  });

  const rows = [...keywordMap.entries()]
    .map(([keyword, keywordCards]) => ({
      keyword,
      definition: getKeywordDefinition(keyword),
      cards: keywordCards.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => compareKeywords(a.keyword, b.keyword));

  const grouped = keywordCategoryOrder
    .map((category) => ({
      category,
      rows: rows.filter((row) => row.definition.category === category)
    }))
    .filter((group) => group.rows.length);

  const unknownKeywords = rows
    .filter((row) => row.definition.category === "Overige labels")
    .map((row) => row.keyword);
  if (unknownKeywords.length) console.info("Keywords zonder officiële uitleg:", unknownKeywords.join(", "));

  keywordsOverviewEl.innerHTML = grouped
    .map((group) => `
      <section class="keyword-category">
        <h3>${group.category}</h3>
        <div class="keyword-category-grid">
          ${group.rows.map(({ keyword, definition, cards: keywordCards }) => `
            <article class="keyword-card ${definition.category === "Role / Flavor" ? "flavor" : ""}">
              <div class="keyword-card-head">
                <h4>${definition.label}</h4>
                <span>${definition.category}</span>
              </div>
              <p>${definition.description}</p>
              <div class="keyword-card-list">
                ${keywordCards.map(renderKeywordCardChip).join("")}
              </div>
              <small>${keywordCards.length} kaart${keywordCards.length === 1 ? "" : "en"} met ${definition.label}</small>
            </article>
          `).join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderKeywordCardChip(card) {
  const typeLabel = card.type === "base" ? "Base" : card.type === "building" ? "Building" : card.type === "spell" ? "Spell" : "Unit";
  const costLabel = card.cost !== undefined ? `${card.cost} energy` : "-";
  return `
    <div class="keyword-card-chip" title="${card.name}">
      <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.src='assets/cards/placeholder.png'">
      <div>
        <strong>${card.name}</strong>
        <span>${costLabel} · ${typeLabel}</span>
      </div>
    </div>
  `;
}

export function selectUnit(unitId) {
  const unit = getUnit(unitId);
  if (!unit) return;
  state.selectedUnitId = unitId;
  state.inspectedUnitId = unitId;
  state.selectedCardIndex = null;
  state.currentMode = unit.owner === state.activePlayer ? "unitAction" : "idle";
  state.unitActionIntent = "auto";
}

export function getValidMoveSquares(unit) {
  if (!unit || unit.owner !== state.activePlayer || unit.statuses.stunned || unit.statuses.cannotAct) return [];
  if (isPetrified(unit)) return [];
  if (unit.hasMovedThisTurn) return [];
  if (unit.speed <= 0 && !unit.tags.includes("moving")) return [];
  if (isAntToken(unit)) return getReachableAntSquares(unit);
  const maxDistance = Math.max(0, unit.speed * (unit.speedMultiplier || 1));
  const squares = [];
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) {
      if (distance(unit, { x, y }) === 0 || distance(unit, { x, y }) > maxDistance) continue;
      const occupants = unitsAt(x, y);
      const blockingOccupants = occupants.filter((candidate) => !isAntToken(candidate));
      const friendlyBuilding = occupants.find((candidate) => candidate.owner === unit.owner && candidate.type === "building");
      const ownBase = blockingOccupants.find((candidate) => candidate.owner === unit.owner && candidate.type === "base");
      const isOwnBaseTile = !!ownBase;
      const hasFriendly = blockingOccupants.some((candidate) =>
        candidate.owner === unit.owner
        && candidate.type !== "building"
        && candidate.type !== "base"
        && candidate.unitId !== unit.unitId
      );
      const hasEnemy = blockingOccupants.some((candidate) => candidate.owner !== unit.owner);
      const canEnterFriendlyBuilding = friendlyBuilding && unit.type !== "building" && !friendlyBuilding.occupiedBy && !(friendlyBuilding.cardId === "wall-wrecker" && hasEnemy);
      if (unit.cardId === "schwerer-gustav") {
        const forwardY = unit.owner === 1 ? unit.y - 1 : unit.y + 1;
        const backY = unit.owner === 1 ? unit.y + 1 : unit.y - 1;
        if (!(x === unit.x && (y === forwardY || y === backY))) continue;
        if ((unit.gustavMoveCooldown || 0) > 0) continue;
      }
      if (!hasFriendly && (!blockingOccupants.length || canEnterFriendlyBuilding || (hasEnemy && canEnterEnemyOccupiedTile(unit, isOwnBaseTile)))) squares.push({ x, y });
    }
  }
  return squares;
}

export function getValidAttackTargets(unit) {
  if (!unit || unit.owner !== state.activePlayer) return [];
  if (isPetrified(unit)) return [];
  return state.units.filter((candidate) => candidate.owner !== unit.owner && canAttack(unit, candidate));
}

function renderCooldownBadge(unit) {
  const values = [
    unit.cooldownRemaining || 0,
    unit.healCooldownRemaining || 0,
    unit.hookCooldownRemaining || 0,
    unit.mercyReviveCooldownRemaining || 0,
    ...Object.values(unit.attackCooldowns || {})
  ].filter((value) => value > 0);
  const cooldown = values.length ? Math.max(...values) : 0;
  return cooldown > 0 ? `<span class="cooldown-badge" title="Cooldown ${cooldown}">${cooldown}</span>` : "";
}

export function getValidBaseAttackColumns(unit, baseOwnerId = unit?.owner === 1 ? 2 : 1) {
  if (!unit || unit.owner !== state.activePlayer || unit.owner === baseOwnerId) return [];
  const base = getBase(baseOwnerId);
  if (!base) return [];
  const enemyRow = baseOwnerId === 1 ? state.boardRows - 1 : 0;
  const attack = unit.attacks?.find((item) => item.name === "ranged") || unit.attacks?.find((item) => item.name === "melee") || unit.attacks?.[0];
  if (!attack || unit.hasAttackedThisTurn || unit.statuses.stunned || unit.statuses.cannotAct || unit.statuses.cannotAttack) return [];
  const columns = [];
  for (let x = 0; x < state.boardCols; x += 1) {
    const target = makeBaseAttackTarget(baseOwnerId, x);
    if (canAttack(unit, target)) columns.push(x);
    else {
      const blocker = getBaseTileBlockers(unit, x, enemyRow).find((candidate) => canAttack(unit, candidate));
      if (blocker) columns.push(x);
    }
  }
  return columns;
}

function getValidBaseAttackTiles(unit) {
  const enemyBaseOwnerId = unit?.owner === 1 ? 2 : 1;
  const row = enemyBaseOwnerId === 1 ? state.boardRows - 1 : 0;
  return getValidBaseAttackColumns(unit, enemyBaseOwnerId).map((x) => ({ x, y: row, baseOwnerId: enemyBaseOwnerId }));
}

export function getValidAbilityTargets(unit) {
  if (!unit || unit.owner !== state.activePlayer || (unit.hasUsedAbilityThisTurn && unit.cardId !== "koffieautomaat") || unit.statuses.cannotAct) return [];
  if (getPlayer().energy < (unit.abilityCost ?? 1)) return [];
  const type = unit.abilityTargetType || "none";
  if (unit.cooldownRemaining > 0) return [];
  if (unit.cardId === "thanos") {
    if (unit.hasAttackedThisTurn || unit.hp <= 300) return [];
    return state.units.filter((target) => target.owner !== unit.owner && target.type !== "base" && distance(unit, target) === 1);
  }
  if (unit.cardId === "roadhog") {
    if (unit.hookCooldownRemaining > 0) return [];
    return state.units.filter((target) =>
      target.owner !== unit.owner
      && target.type !== "base"
      && target.type !== "building"
      && distance(unit, target) === 1
    );
  }
  if (unit.cardId === "junkrat") return state.units.filter((target) => target.owner !== unit.owner && target.type !== "base" && distance(unit, target) === 0);
  if (unit.cardId === "medic-drone") {
    return state.units.filter((target) => target.owner === unit.owner && target.type !== "base" && target.type !== "building" && distance(unit, target) <= 1);
  }
  if (unit.cardId === "eye-of-cthulhu") {
    const targets = [];
    for (let step = 1; step <= 3; step += 1) {
      const dashTargets = [
        { x: unit.x + step, y: unit.y },
        { x: unit.x - step, y: unit.y },
        { x: unit.x, y: unit.y + step },
        { x: unit.x, y: unit.y - step }
      ];
      dashTargets.forEach((target) => {
        if (target.x < 0 || target.x >= state.boardCols || target.y < 0 || target.y >= state.boardRows) return;
        const occupants = unitsAt(target.x, target.y);
        const ownBlocker = occupants.some((candidate) => candidate.owner === unit.owner && candidate.type !== "building" && candidate.type !== "base" && candidate.unitId !== unit.unitId);
        if (!ownBlocker) targets.push(target);
      });
    }
    return targets;
  }
  if (unit.cardId === "pillager-captain") return [{ x: unit.x, y: unit.y, abilitySelf: true }];
  if (unit.cardId === "necromancer") {
    return state.units.filter((target) =>
      target.owner === unit.owner
      && target.tags?.includes("token")
      && distance(unit, target) <= 1
    );
  }
  if (unit.cardId === "alchemist") {
    return state.units.filter((target) =>
      target.owner === unit.owner
      && target.type !== "base"
      && distance(unit, target) <= 1
    );
  }
  if (unit.cardId === "business-vampire") {
    return state.units.filter((target) =>
      target.owner !== unit.owner
      && target.type === "unit"
      && !isSmilerUntargetableBy(unit, target)
    );
  }
  if (unit.cardId === "schwerer-gustav") {
    return [
      { x: unit.x + 1, y: unit.y },
      { x: unit.x - 1, y: unit.y }
    ].filter((target) => target.x >= 0 && target.x < state.boardCols && !unitsAt(target.x, target.y).length);
  }
  if (unit.cardId === "koffieautomaat") {
    return state.units.filter((target) =>
      target.owner === unit.owner
      && target.type !== "base"
      && target.type !== "building"
      && distance(unit, target) <= 1
    );
  }
  if (unit.cardId === "manager") {
    return state.units.filter((target) =>
      target.owner === unit.owner
      && target.type !== "base"
      && target.type !== "building"
      && !target.statuses.managerBuff
      && distance(unit, target) <= 3
    );
  }
  if (unit.cardId === "maarschalk") {
    return state.units.filter((target) =>
      target.owner === unit.owner
      && target.type !== "base"
      && target.tags?.includes("ranged")
      && Math.abs(unit.x - target.x) <= 1
      && Math.abs(unit.y - target.y) <= 1
    );
  }
  if (unit.cardId === "orisa") {
    const targets = [];
    for (let y = 0; y < state.boardRows; y += 1) {
      for (let x = 0; x < state.boardCols; x += 1) {
        if (distance(unit, { x, y }) > 1) continue;
        const blockers = unitsAt(x, y).filter((candidate) =>
          candidate.type === "building" || candidate.unitId !== unit.unitId && candidate.owner !== unit.owner
        );
        if (!blockers.length) targets.push({ x, y });
      }
    }
    return targets;
  }
  if (unit.cardId === "sigma") {
    if (unit.sigmaBarrier?.placedUnitId) return [{ x: unit.x, y: unit.y, abilitySelf: true }];
    const targets = [];
    for (let y = 0; y < state.boardRows; y += 1) {
      for (let x = 0; x < state.boardCols; x += 1) {
        if (distance(unit, { x, y }) > 1) continue;
        const occupants = unitsAt(x, y);
        if (occupants.some((candidate) => candidate.type === "building" || candidate.owner !== unit.owner)) continue;
        targets.push({ x, y });
      }
    }
    return targets;
  }
  if (type === "none" || type === "deadFriendlyUnit") return [{ x: unit.x, y: unit.y, abilitySelf: true }];
  if (type === "enemyUnit") return state.units.filter((target) => target.owner !== unit.owner && target.type !== "base" && !isSmilerUntargetableBy(unit, target));
  if (type === "friendlyUnit") return state.units.filter((target) => target.owner === unit.owner && target.type !== "base");
  if (type === "anyUnit") return state.units.filter((target) => target.type !== "base");
  if (type === "emptyTile" || type === "tile" || type === "special") {
    const targets = [];
    for (let y = 0; y < state.boardRows; y += 1) {
      for (let x = 0; x < state.boardCols; x += 1) {
        if (type === "emptyTile" && unitsAt(x, y).length) continue;
        targets.push({ x, y });
      }
    }
    return targets;
  }
  return [];
}

function hasActiveAbility(unit) {
  if (isPetrified(unit)) return false;
  return ["thanos", "junkrat", "orisa", "roadhog", "jet", "mercy", "takel-heli", "sigma", "medic-drone", "creeper", "eye-of-cthulhu", "pillager-captain", "necromancer", "alchemist", "business-vampire", "mierenkoningin", "schwerer-gustav", "koffieautomaat", "manager", "maarschalk"].includes(unit.cardId);
}

export function getValidSpellTargets(card) {
  if (!card || card.type !== "spell") return [];
  const allTiles = [];
  for (let y = 0; y < state.boardRows; y += 1) {
    for (let x = 0; x < state.boardCols; x += 1) allTiles.push({ x, y });
  }
  const active = state.activePlayer;
  if (card.id === "boost" || card.id === "sneeuwstorm") return allTiles;
  if (card.id === "nyan-kat-regen" || card.id === "nuke") return allTiles;
  if (card.id === "krab-rave" || card.id === "f2" || card.id === "mind-stone") {
    return state.units.filter((unit) => unit.owner !== active && unit.type !== "base");
  }
  if (card.id === "pumpkin-shield") {
    return state.units.filter((unit) => unit.owner === active && unit.type !== "base");
  }
  if (card.id === "rage") {
    return state.units.filter((unit) => unit.owner === active && unit.type !== "base" && unit.type !== "building");
  }
  if (card.id === "wanted-level") {
    const targets = [];
    for (let y = 0; y < state.boardRows; y += 1) {
      for (let x = 0; x < state.boardCols; x += 1) {
        if (unitsAt(x, y).length) continue;
        const inDeployZone = active === 1 ? y >= state.boardRows - 2 : y <= 1;
        const nearFriendly = state.units.some((unit) => unit.owner === active && unit.type !== "base" && distance(unit, { x, y }) <= 3);
        if (inDeployZone || nearFriendly) targets.push({ x, y });
      }
    }
    return targets;
  }
  if (card.id === "sniper-scope") {
    return state.units.filter((unit) =>
      unit.owner === active
      && unit.type !== "base"
      && unit.attacks?.some((attack) => attack.name === "ranged")
    );
  }
  return [];
}

export function highlightValidMoves(unit) {
  return getValidMoveSquares(unit);
}

export function highlightValidAttacks(unit) {
  return getValidAttackTargets(unit);
}

export function moveSelectedUnitTo(x, y) {
  const unit = getUnit(state.selectedUnitId);
  return moveUnit(unit, x, y);
}

export function attackSelectedTarget(targetId) {
  const unit = getUnit(state.selectedUnitId);
  const target = getUnit(targetId);
  return attackUnit(unit, target);
}

function handleCellClick(x, y, clickedUnitId = null) {
  const clickedUnits = unitsAt(x, y);
  const directlyClickedUnit = clickedUnitId ? clickedUnits.find((unit) => unit.unitId === clickedUnitId) : null;
  const { clickedOwn, clickedEnemy } = resolveClickedUnits(clickedUnits, directlyClickedUnit, state.activePlayer);

  if (state.currentMode === "placingCard" && state.selectedCardIndex !== null) {
    const card = getPlayer().hand[state.selectedCardIndex];
    if (card?.type === "spell" && !getValidSpellTargets(card).some((target) => target.x === x && target.y === y)) {
      addLog("Dit is geen geldig spell-target.");
      render();
      return;
    }
    const played = playCard(state.selectedCardIndex, x, y, directlyClickedUnit?.unitId || null);
    if (played) clearSelection();
    render();
    return;
  }

  const selected = getUnit(state.selectedUnitId);
  if (selected?.owner === state.activePlayer && state.currentMode === "abilityTargeting") {
    const validAbilityTargets = getValidAbilityTargets(selected);
    const abilityTarget = getClickedAbilityTarget(clickedUnits, directlyClickedUnit, validAbilityTargets, x, y);
    if (!abilityTarget) {
      addLog("Dit is geen geldig ability-target.");
      render();
      return;
    }
    activateAbility(selected, abilityTarget);
    clearSelection();
    render();
    return;
  }

  if (selected?.owner === state.activePlayer && state.currentMode === "unitAction") {
    if (state.unitActionIntent === "attack") {
      if (clickedEnemy && canAttack(selected, clickedEnemy)) {
        attackUnit(selected, clickedEnemy);
        selectUnit(selected.unitId);
        state.unitActionIntent = "attack";
        render();
        return;
      }
      if (selected.cardId === "schwerer-gustav" && getValidGustavTargetTiles(selected).some((target) => target.x === x && target.y === y)) {
        attackGustavTile(selected, x, y);
        selectUnit(selected.unitId);
        state.unitActionIntent = "attack";
        render();
        return;
      }
      const enemyBaseOwnerId = selected.owner === 1 ? 2 : 1;
      const enemyBaseRow = enemyBaseOwnerId === 1 ? state.boardRows - 1 : 0;
      if (y === enemyBaseRow) {
        handleBaseTileAttack(enemyBaseOwnerId, x);
        return;
      }
      addLog("Kies een rood target om aan te vallen.");
      render();
      return;
    }
    if (state.unitActionIntent !== "move") {
      if (clickedEnemy && canAttack(selected, clickedEnemy)) {
        attackUnit(selected, clickedEnemy);
        selectUnit(selected.unitId);
        render();
        return;
      }
      if (selected.cardId === "schwerer-gustav" && getValidGustavTargetTiles(selected).some((target) => target.x === x && target.y === y)) {
        attackGustavTile(selected, x, y);
        selectUnit(selected.unitId);
        render();
        return;
      }
      const enemyBaseOwnerId = selected.owner === 1 ? 2 : 1;
      const enemyBaseRow = enemyBaseOwnerId === 1 ? state.boardRows - 1 : 0;
      if (y === enemyBaseRow && getValidBaseAttackTiles(selected).some((target) => target.x === x && target.y === y)) {
        handleBaseTileAttack(enemyBaseOwnerId, x);
        return;
      }
    }
    if (getValidMoveSquares(selected).some((square) => square.x === x && square.y === y)) {
      moveUnit(selected, x, y);
      selectUnit(selected.unitId);
      render();
      return;
    }
    if (clickedEnemy && canAttack(selected, clickedEnemy)) {
      addLog("Klik op het rode target om aan te vallen, of kies Lopen als je bewust wil bewegen.");
      render();
      return;
    }
  }

  if (clickedOwn) {
    selectUnit(clickedOwn.unitId);
    render();
    return;
  }
  if (clickedEnemy) {
    state.inspectedUnitId = clickedEnemy.unitId;
    state.selectedUnitId = null;
    state.selectedCardIndex = null;
    state.currentMode = "idle";
    render();
    return;
  }

  render();
}

function handleBaseTileAttack(ownerId, column) {
  const selected = getUnit(state.selectedUnitId);
  if (!selected || selected.owner !== state.activePlayer || state.currentMode !== "unitAction" || state.unitActionIntent !== "attack") {
    addLog("Selecteer een unit en kies Aanvallen om de base te raken.");
    render();
    return;
  }
  if (selected.owner === ownerId) {
    addLog("Je kunt je eigen base niet aanvallen.");
    render();
    return;
  }
  const row = ownerId === 1 ? state.boardRows - 1 : 0;
  const blockers = getBaseTileBlockers(selected, column, row);
  const blocker = blockers.find((unit) => canAttack(selected, unit));
  if (blocker) {
    attackUnit(selected, blocker);
    selectUnit(selected.unitId);
    state.unitActionIntent = "attack";
    render();
    return;
  }
  if (blockers.length) {
    addLog("Dit base-vakje is nog bezet. Sloop eerst de units of gebouwen op dat vakje.");
    render();
    return;
  }
  const baseTarget = makeBaseAttackTarget(ownerId, column);
  if (!baseTarget || !canAttack(selected, baseTarget)) {
    addLog("Deze unit kan dit base-vakje nu niet aanvallen.");
    render();
    return;
  }
  attackUnit(selected, baseTarget);
  selectUnit(selected.unitId);
  state.unitActionIntent = "attack";
  render();
}

export function resolveClickedUnits(clickedUnits, directlyClickedUnit, activePlayerId) {
  return {
    clickedOwn: directlyClickedUnit
      ? (directlyClickedUnit.owner === activePlayerId ? directlyClickedUnit : null)
      : clickedUnits.find((unit) => unit.owner === activePlayerId),
    clickedEnemy: directlyClickedUnit
      ? (directlyClickedUnit.owner !== activePlayerId ? directlyClickedUnit : null)
      : clickedUnits.find((unit) => unit.owner !== activePlayerId)
  };
}

function getClickedAbilityTarget(clickedUnits, directlyClickedUnit, validAbilityTargets, x, y) {
  const validUnitIds = new Set(validAbilityTargets.filter((target) => target.unitId).map((target) => target.unitId));
  const validTileTarget = validAbilityTargets.find((target) => target.x === x && target.y === y && !target.unitId);
  if (directlyClickedUnit) return validUnitIds.has(directlyClickedUnit.unitId) ? directlyClickedUnit : validTileTarget || null;
  const validUnitOnTile = clickedUnits.find((unit) => validUnitIds.has(unit.unitId));
  if (validUnitOnTile) return validUnitOnTile;
  return validTileTarget || null;
}
