export function renderRulesPage() {
  const root = document.querySelector("#rulesView");
  if (!root) return;
  root.innerHTML = `
    <section class="rules-hero">
      <p class="eyebrow">Spelregels</p>
      <h2>Uitleg</h2>
      <p>Het doel van het spel is om de tegenstander zijn base kapot te maken. Elke speler heeft een base met 2500 HP. De base staat niet op een normaal bordvakje, maar als brede base-zone achter het bord.</p>
    </section>

    <section class="rules-grid">
      ${ruleCard("Het bord", "Het spel wordt gespeeld op een 9x9 bord. Speler 1 begint onderaan, speler 2 bovenaan. Boven het bord staat de base-zone van speler 2 en onder het bord de base-zone van speler 1. De base zelf neemt geen bordvakje in en claimt geen territory.")}
      ${ruleCard("Beurten en energie", "Spelers spelen om de beurt. Aan het begin van je beurt krijg je +3 energie. Energie blijft opgespaard tussen beurten, tot maximaal 10. Bewegen en aanvallen kosten geen energie meer. Abilities kosten standaard 1 energie tenzij de kaart anders zegt. Kaarten spelen kost de cost op de kaart. Boost geeft je volgende beurt +3 extra energie en gaat terug in je deck.")}
      ${ruleCard("Upkeep", "Aan het begin van je beurt gebeurt de upkeep: je krijgt energie, je hand wordt aangevuld tot 5 kaarten, cooldowns en tijdelijke effecten van jouw kaarten gaan 1 omlaag, en radiation-zones doen damage op alle units die erin staan. Effecten met een duur tellen alleen af bij de speler van wie de kaart of het effect is.")}
      ${ruleCard("Library en graveyard", "Je library is je trekstapel. Je begint met 5 kaarten op hand. Aan het begin van je beurt vul je je hand weer aan tot 5 kaarten. Als je een kaart speelt, trek je normaal een nieuwe kaart tot maximaal 5 handkaarten. Aan het einde van je beurt mag je optioneel 1 handkaart weggooien naar je graveyard voor +1 energie volgende beurt. Gebruikte spells, dode units en kapotte gebouwen gaan ook naar de graveyard.")}
      ${ruleCard("Soorten kaarten", "Units kunnen lopen en aanvallen. Melee units moeten op hetzelfde vakje als de vijand staan. Ranged units vallen aan volgens hun range. Ranged attacks kunnen niet door andere units heen schieten, behalve als de aanvaller pierce heeft zoals Big Ben. Schwerer Gustav heeft een eigen siege line-shot die door units heen mag schieten, maar dat is geen gewone Pierce. Flying units kunnen meestal door schieters of gebouwen geraakt worden. Buildings mogen alleen op eigen territory worden geplaatst, dus ook in je eigen beschermde base-gebied. De base telt als building/structure, maar niet als bunker-type building.")}
      ${ruleCard("Bewegen en aanvallen", "Klik op een eigen unit. Groene vakjes zijn geldige move-vakjes. Rode targets kun je nu aanvallen. Een unit mag per beurt maximaal 1 keer bewegen, 1 keer aanvallen en 1 keer een ability gebruiken.")}
      ${ruleCard("Melee", "Melee-poppetjes kunnen alleen aanvallen als ze op hetzelfde vakje staan als een vijand. Als je met een melee-poppetje naar een vakje met een vijand loopt, kun je daarna die vijand aanvallen als hij deze beurt nog niet heeft aangevallen.")}
      ${ruleCard("Contested vakjes", "Als friendly en enemy units op hetzelfde vakje staan, is dat vakje contested. Units op een contested vakje kunnen niet ranged aanvallen buiten dat vakje. Ze kunnen nog wel enemies op hetzelfde vakje aanvallen als hun aanval dat toestaat.")}
      ${ruleCard("HP, shield en damage", "Shield vangt een volledige hit op. Als een hit groter is dan het shield, gaat de rest van diezelfde hit niet door naar HP. Bij multi-hit attacks kan een latere hit wel HP raken nadat shield kapot is. True damage negeert shield. Shield-only kaarten hebben verborgen 1 HP en gaan direct dood door true damage.")}
      ${ruleCard("Stack Damage en Area Damage", "Stack Damage raakt alle enemy units op een gekozen vakje, behalve als kaarttekst zegt dat friendlies ook geraakt worden. Area Damage raakt meerdere vakjes en bevat op elk geraakt vakje automatisch Stack Damage. Dus als meerdere units op hetzelfde geraakte vakje staan, worden ze allemaal geraakt. True Bunkers kunnen units erin hiertegen beschermen. Rij/kolom-effecten volgen hun eigen kaarttekst.")}
      ${ruleCard("Units in gebouwen", "Bij normale buildings krijgt een unit in het gebouw 50% minder damage, naar beneden afgerond. Het gebouw krijgt 100% damage. True Bunker kaarten zoals Bunker en Wall Wrecker beschermen units erin tegen directe damage, Stack Damage en Area Damage: de True Bunker krijgt dan de damage. Orisa Barrier en Sigma Barrier zijn barriers, maar geen True Bunker. Kaarttekst gaat altijd boven algemene regels.")}
      ${ruleCard("Territory", "Als een unit loopt, neemt hij gebied over: het eindvakje en het vakje links en rechts daarvan. Je kunt buildings alleen plaatsen op eigen gebied. De onderste 2 rijen zijn vaste protected base-territory van speler 1 en de bovenste 2 rijen vaste protected base-territory van speler 2. Deze rijen kunnen niet worden geclaimd door units of effecten.")}
      ${ruleCard("Base aanvallen", "Melee units kunnen de enemy base aanvallen vanaf de laatste rij aan de kant van die base: speler 1 vanaf rij 0, speler 2 vanaf rij 8. Ranged units kunnen de base aanvallen als ze een vakje op die laatste rij binnen range en line-of-sight kunnen raken. Als op het gekozen laatste-rij-vakje een unit of building staat, moet die eerst kapot voordat dat base-vakje geraakt kan worden. De base heeft 1 gedeelde HP-pool.")}
      ${ruleCard("Base Pressure", "Aan het begin van je beurt telt hoeveel enemy combat units in jouw protected base-gebied staan op vakjes waar geen eigen unit staat. Units zonder damage-aanval, zoals Medic Drone, geven geen Base Pressure. Je base verliest 5% van zijn huidige HP per tellende enemy unit. Dit is true damage, maar Base Pressure kan de base niet onder 1 HP brengen. Als de base door normale damage kapot gaat, wint de andere speler.")}
      ${ruleCard("Abilities", "Veel kaarten hebben een speciale ability. Klik op een unit en kijk onder het bord in het selected unit panel. Daar kun je de ability gebruiken als die beschikbaar is. Sommige abilities hebben cooldown of kunnen maar 1 keer per spel.")}
      ${ruleCard("Aura's", "Een aura is alleen een passief effect dat automatisch geldt in een gebied rond een unit of building. Ability-ranges, heal-ranges, summon-ranges en barrier-placement tellen niet als aura. Op het bord worden daarom alleen echte passieve aura's visueel als aura-zone getoond.")}
      ${ruleCard("Nieuwe kaartstatussen", "Tax betekent dat de enemy energie moet betalen om direct te targeten. Revealed haalt stealth/untargetable weg en laat de unit 25% meer damage krijgen. Thee Burn doet 25 damage per stack tijdens upkeep en laat andere damage 20% harder raken. Koffieboost geeft tijdelijk +1 speed en +20% damage, maar herhaald boost-werk kan Crash geven. Hitted op Maarschalk betekent dat hij 100 HP verliest als hij daarna beweegt.")}
      ${ruleCard("Belangrijke uitzondering", "Kaarttekst heeft altijd voorrang op algemene regels. Als een kaart expliciet zegt dat hij troepen in gebouwen raakt, dan mag die damage direct op de unit doen.")}
      ${ruleCard("Voorbeeldbeurt", "1. Je krijgt +3 energie, tot maximaal 10. 2. Klik op Steve. 3. Groene vakjes laten zien waar Steve heen kan. 4. Loop richting de vijand. 5. Staat Steve op hetzelfde vakje als een vijand, dan wordt die rood. 6. Klik om aan te vallen. 7. Klik op Einde beurt en kies eventueel een discard voor +1 energie volgende beurt.")}
    </section>

    <section class="rules-legend">
      <h2>Kleuren</h2>
      <span><b class="legend-move"></b>Groen = bewegen</span>
      <span><b class="legend-attack"></b>Rood = aanvallen</span>
      <span><b class="legend-selected"></b>Geel/blauw = geselecteerd of bekeken</span>
      <span><b class="legend-p1"></b>Blauw = territory speler 1</span>
      <span><b class="legend-p2"></b>Rood = territory speler 2</span>
      <span><b class="legend-protected-p1"></b>Donkerblauw = beschermd P1</span>
      <span><b class="legend-protected-p2"></b>Donkerrood = beschermd P2</span>
    </section>
  `;
}

function ruleCard(title, text) {
  return `
    <article class="rule-card">
      <h3>${title}</h3>
      <p>${text}</p>
    </article>
  `;
}
