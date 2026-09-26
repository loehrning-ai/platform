# Copy audit: workshops, courses, demos (learner-facing strings)

Date: 2026-09-26. Read-only audit of `/home/user/platform/packages/website`. Pattern numbers refer to `scratchpad/research/slop-language.md` (§2). All paths below are relative to `packages/website/`.

## Scope and method

- **TS/TSX copy modules (14 files):** `src/lib/workshops.ts`, `src/lib/workshops-data-readiness.ts`, `src/app/workshops/workshop-copy.ts`, `src/app/workshops/[slug]/*.tsx` (page, detail-content, decision-lab, material-link), `src/lib/courses/course-hub-copy.ts`, `catalog-copy.ts`, `course-gallery-copy.ts`, `catalog.ts`, `src/lib/demos.ts`, `demos-copy.ts`, `demos-ui-copy.ts`.
- **Static pages (visible text and JS strings):** `public/workshops/ki-prognosen-einschaetzen/hub.html` (261 words) and `field-card.html` (743), plus `public/workshops/datenbereitschaft-fuer-ki/guide.html` (1,467) and `demo.html` (about 1,500 words of prose next to the captured data). W02 has only `slides.html`, which is outside this brief.
- **Totals:** about 15.5k visible words, 1,214 text units and 1,828 sentences.
- **How the scan ran:**
  - Two read-only Node scripts: `scratchpad/tmp/audit-copy-scan.mjs` (pattern regexes from the catalogue, extended) and `scratchpad/tmp/audit-copy-neg.mjs` (negation share per file).
  - `scratchpad/tmp/visible-lines.mjs` extracts the HTML text.
  - Every quoted passage below was checked by hand. Raw counts include noise, so the table in §3 gives both raw and confirmed numbers.
- **Fields that are not rendered:** `integrationNote` and `sourceFacts` in `catalog.ts` / `catalog-copy.ts` are used only in tests. Their copy ("Native Route in diesem Quellstand …") is developer language, but no learner sees it, so it is excluded from the top 50.
- **What the `[slug]` TSX files contain:** almost no prose. Their UI strings (`workshop-decision-lab.tsx:40-75`) are clean microcopy ("Wähle den stärksten Beleg aus, bevor du das Ergebnis prüfst.").

## 1. Findings in brief

1. **Slide grammar leaks into page prose.** It shows up as count-first fragments ("Fünf Prompts, ein Analyst.", "Eine Frage, zwei Datenstände, zwei Antworten.", "One question, two databases."; 11 cases), colon reveals ("Das Herzstück:", "Die Reparatur:", "Die Frage auf dem Tisch:"; 9) and act scaffolding ("Erster/Zweiter/Dritter Akt"; 8). Card summaries and hero text are hit hardest, which are the most visible strings on the site.
2. **The same slogans repeat across pages.**
   - "earns its cost / earns its keep / verdient ihren Aufwand": 9 times across W01 (detail page, hub, field card).
   - "Instructions guide, grants enforce" / "Anweisungen leiten, Rechte setzen durch": 7 times. The four-beat "guides · defines · serves · enforces" appears 4 more times in W03, three of them on `demo.html` alone.
   - "Das Praxisbeispiel zeigt/begrenzt/markiert …" is the sentence subject 12 times in the German demo copy (EN "The example …" 6 times).
   - Once a slogan repeats like this, readers notice the template.
3. **The voice is defensive.** 22% of the sentences in `demos-copy.ts` and 15% in `workshops-data-readiness.ts` contain a negation.
   - Every demo detail page stacks five disclaimers: the H2 "Sandbox-Szenario", a proof text that starts again with "Sandbox-Szenario:", a negative closing sentence ("Keine der beiden Zahlen ist ein Messergebnis."), the `syntheticDataLabel` ("…; keine Verbindung zu Microsoft 365.") and a risk note.
   - Reassurances of the "ohne Code, ohne KI-Konto" kind appear 17 times across the three workshops.
4. **Some copy oversells, and some of it contradicts the site's own evidence.**
   - W02 promises that Claude "immer zuerst deine Regeln" reads, that "dieselben Regeln jedes Mal" apply, and that "jede Zahl … rückführbar" is. W03 then shows that the recorded runs cited the definition "0 von 3 Mal".
   - "DSGVO-Guard" is a regex highlighter whose own risk note admits false negatives.
   - "Disponenten-Morgen, automatisch" describes a demo that ends in manual approval.
   - "live demand simulator" describes a static page.
   - "One question, two databases" describes one database with two logins.
5. **The copy has its own pet words.** ehrlich/honest appears 12 times, including as a term ("ehrliche Nachfrage" next to "Nachfrage p50" and EN "underlying demand"). explicit appears 7 times, belastbar 4, defensible 3, konkret 3 and sauber/clean 3.
6. **Unsourced or vaguely sourced claims.**
   - The demo "why" openers state rules of thumb as fact: "Viele Analysen im Mittelstand entstehen in Excel.", "Rechnungseingang ist in vielen Firmen Handarbeit.", "KI-Projekte scheitern selten an der Technik."
   - The W01 field card gives precise real-world numbers for companies it does not name ("A connected-fitness firm … ~$2.8B", "a hardware giant … ~$56B", "5,507 teams").
7. **Some copy already works and should stay as the model.**
   - The decision-lab prompts: "Drei Standorte melden 1.370 Stück an. Das Modell schätzt 1.180 Stück Nachfrage, lieferbar sind 1.050."
   - The privacy microcopy.
   - W03 step 04 ("die Läufe zitierten die Definition 0 von 3 Mal").
   - The W02 data limitations ("Keine echte Bruttomarge je Linie: Es liegen keine Stückkosten pro Produkt vor.").
   - The guide's bathtub explanation, and `demo.html:845` ("Nobody wrote down what this table means.").
   - Dashes are not a problem in this scope: there are 0 em or en dashes in visible text. The single one in `hub.html` sits in a CSS comment, and one spaced hyphen appears in an image alt at `catalog.ts:407`.

## 2. The 50 worst passages

Each entry gives the file and line, the quote (shortened with …), the pattern, and a proposed rewrite in the passage's own language. German uses "du". Where a German/English mirror exists, the English line is named, and the same fix applies there.

### Workshops: data and detail pages

1. **`src/lib/workshops.ts:372`** (EN `:779`)
   - Quote: „Fünf Prompts, ein Analyst. In der Claude-App arbeitest du für ein synthetisches Unternehmen, bekommst dessen Monatsbericht samt der Rohdaten, aus denen er geschrieben wurde, und hältst in Klartext fest, was die Zahlen hier bedeuten.“
   - Pattern: count-first fragment as opener (#2); a 30-word sentence with three verbs.
   - Rewrite: „In der Claude-App arbeitest du für die erfundene Firma NORTHWIND. Du bekommst ihren Monatsbericht und die Rohdaten dahinter und schreibst in fünf Prompts auf, was Umsatz, Mängel und Marketing dort bedeuten.“

2. **`workshops.ts:463`**
   - Quote: „Das Herzstück: Der Kennzahlen-Skill liegt halb fertig im Kit. Claude fragt dich die Lücken einzeln ab (was bedeuten Umsatz, Mängel, Marketing HIER?) … Keine Zeile Code.“
   - Pattern: colon reveal with puffery (#2, #7); caps for emphasis; staccato closer (#3); "ohne Code" reassurance.
   - Rewrite: „Im Kit liegt ein halb fertiger Kennzahlen-Skill. Claude fragt dich nacheinander, was Umsatz, Mängel und Marketing bei NORTHWIND bedeuten, und schreibt deine Antworten in die Skill-Datei. Programmieren musst du dafür nicht.“

3. **`workshops.ts:470`** (EN `:874`)
   - Quote: „… prüft eine Zahl gegen die Rohdaten-CSV: jede Zahl bleibt auf Datei und Spalte rückführbar. … mit Skill greifen dieselben Regeln jedes Mal.“
   - Pattern: certainty claim. The step checks only one number, and W03 measured the definition being cited 0 of 3 times.
   - Rewrite: „Der Skill liest den Bericht mit deinen Regeln und schreibt die Monatskennzahlen in eine Tabelle. Eine davon prüfst du gegen die Rohdaten-CSV, mit Datei und Spalte. Stell dieselbe Frage einmal ohne Skill und vergleiche die Antworten.“

4. **`workshops.ts:484`** (EN `:888` „a decision rather than a summary“)
   - Quote: „Am Ende steht keine Zusammenfassung, sondern eine Entscheidung: Premium-Linie nacharbeiten oder ihr Q3-Marketingbudget erhöhen? Mit der Zahl, die sie stützt, … und der Gegenposition, so überzeugend wie möglich argumentiert.“
   - Pattern: staged contrast (#1), a colon followed by a question, a 35-word verbless tail, and "ehrlich".
   - Rewrite: „Zum Schluss entscheidest du, ob CRAFT nachgearbeitet wird oder mehr Q3-Marketingbudget bekommt. Du nennst die Zahl, die das stützt, was ein Irrtum kosten würde, was die Daten offenlassen, und das stärkste Argument des Vertriebsleiters.“

5. **`workshops.ts:166`** (EN `:573`, W01 card summary)
   - Quote: „Wann darfst du einer Prognose trauen? Du bezifferst die Kosten des Irrtums, bemisst den Puffer und prüfst den Go-live: in drei Laboren und einem Launch-Fall.“
   - Pattern: rhetorical-question opener (#10), triad (#6), colon tail, Anglicism.
   - Rewrite: „Du rechnest aus, was eine falsche Prognose kostet, wie groß der Puffer sein muss und wann eine Person freigeben muss. Drei Browser-Labore und ein Launch-Fall.“

6. **`workshops.ts:168`** (W01 description)
   - Quote: „Eine Prognose verdient ihren Aufwand erst, wenn sie eine Entscheidung verändert; … Und im Betrieb musst du merken, wann eine Prognose kippt. … eine Go/No-Go-Entscheidung, die du auch verteidigen kannst. Ohne Programmierung, ohne Installation, ohne KI-Zugang: alles läuft als statische Seite im Browser.“
   - Pattern: aphorism opener (#5), a sentence starting with "Und", a promise, and a triple "ohne" stack that repeats `accessNote` (`:172`).
   - Rewrite: „Zuerst prüfst du, ob ein Modell das heutige Verfahren schlägt: denselben Wochentag der Vorwoche. Dann rechnest du, was zu viel und was zu wenig Kapazität kostet, und legst den Puffer fest. Zum Schluss bestimmst du, woran du im Betrieb merkst, dass eine Prognose danebenliegt, und wer dann freigibt.“ Drop the access sentence, because `accessNote` already says it.

7. **`workshops.ts:575`** (EN W01 description)
   - Quote: "A forecast earns its cost only when it changes a decision, so the model question comes last here. … a defensible go or no-go decision. No programming, no installation, no AI account; everything runs as static pages in the browser."
   - Pattern: aphorism (#5), promise, "no X, no Y" stack.
   - Rewrite: "First you check whether a model beats the current method, the same weekday one week earlier. Then you price too much and too little capacity and set the buffer. Finally you decide how you will notice a forecast going wrong, and who approves then."

8. **`src/lib/workshops-data-readiness.ts:14`** (EN `:215`, W03 card summary)
   - Quote: „Eine Frage, zwei Datenstände, zwei Antworten. Du siehst, wie eine KI eine plausible, aber falsche Zahl liefert und was sie repariert. Ohne Code, ohne KI-Konto.“
   - Pattern: count-first fragment (#2), a verbless "ohne" fragment (#3), and an ambiguous "sie".
   - Rewrite: „Eine KI meldet für April einen MRR-Endbestand von −19.960 €. Du findest heraus, warum die Zahl falsch ist und was sie korrigiert. Du brauchst weder Code noch KI-Konto.“ (EN: "An AI reports April ending MRR as −€19,960. You find out why that is wrong and what fixes it. No code or AI account needed.")

9. **`workshops-data-readiness.ts:16`** (EN `:217`)
   - Quote: „Die Reparatur: freigegebene Auswertungssichten, eine schriftliche Kennzahl-Definition …, reiner Lesezugriff und Tests. … Der Kurs zeigt auch die ehrlichen Grenzen …“
   - Pattern: colon reveal with a verbless list (#2), false agency (#16), "ehrlich", and "Kurs" used for a workshop.
   - Rewrite: „Danach liest die KI nur freigegebene Sichten, bekommt eine schriftliche Kennzahl-Definition (die semantische Schicht) und darf nur lesen; Tests prüfen den Aufbau. … Zum Schluss siehst du, was der Aufbau nicht absichert, und schreibst deine eigene Frage in fünf Felder.“

10. **`workshops.ts:250`**
    - Quote: „Erster Akt im Entscheidungslabor: … Zu wenig Kapazität kostet mehr als zu viel, und genau diese Schieflage entscheidet. … Ein nicht eingetragener Aktionstag bleibt für jede Stufe unsichtbar, und geht an einen Menschen.“
    - Pattern: act scaffolding (#18), false agency (#16), and a broken ", und geht".
    - Rewrite: „Sechs Wochen Paketnachfrage laufen im Schattenbetrieb gegen den Wert, den die Planung heute nutzt: denselben Wochentag der Vorwoche. Fehlende Kapazität kostet mehr als überschüssige, deshalb rechnest du beides in Euro. Einen Aktionstag, den niemand eingetragen hat, sieht keine Ausbaustufe; diesen Fall bekommt eine Person.“

11. **`workshops.ts:264`** (EN `:671`)
    - Quote: „Dritter Akt: … Der Wert steckt im geregelten Ablauf, nicht in der schöneren Kurve.“
    - Pattern: aphorism plus tailing negation (#4, #5).
    - Rewrite: cut the closing sentence, because the sentence before it already names the mechanism (Tor schließen, Person benennen, nachtrainieren). Start the step with „Im dritten Labor löst du Nachfrageschocks aus …“.

12. **`workshops.ts:257`**
    - Quote: „Zweiter Akt: … Darunter stehen Aufschaukelungsgrad, Lieferfähigkeit und gebundenes Kapital. Sie trennen, was echter Prognosefehler ist und was reine Verstärkung durch aufeinandergestapelte Puffer.“
    - Pattern: act scaffolding, noun jargon (#15), metrics as agents (#16).
    - Rewrite: „Im zweiten Labor läuft dieselbe Nachfrage zweimal durch die Lieferkette: einmal schlägt jede Stufe ihren eigenen Puffer auf, einmal planen alle mit derselben Prognose. Du vergleichst, wie stark die Bestellungen schwanken, wie oft geliefert werden kann und wie viel Geld im Lager liegt.“

13. **`workshops.ts:271`** (EN `:678`)
    - Quote: „Elf Stationen zu einem Produktlaunch: Aus 1.370 angemeldeten Stück werden 1.180 ehrliche Nachfrage … Der Fall führt von der manuellen Tabellenrunde über die Kostenasymmetrie und die Modellwahl … zu den Datenfallen einer einzigen Abfrage, dem rollierenden Rücktest und einem täglichen Tor aus vier Prüfungen.“
    - Pattern: colon opener, a 41-word noun chain (#15), "ehrlich" used as a term.
    - Rewrite: „Der Fall hat elf Stationen. Du verteilst erst von Hand in einer Tabelle, rechnest die ungleichen Fehlerkosten und wählst ein Modell (12 % statt 21 % Abweichung). Danach suchst du Datenfehler in einer Abfrage, testest rückwirkend über mehrere Startpunkte und legst vier tägliche Prüfungen vor der Freigabe fest.“

14. **`workshops.ts:278`** (EN `:685`)
    - Quote: „Vier Zahlen und ein Satz beantworten die eigentliche Frage: Hat die Glättung ihren Aufwand verdient? Ein Tabellenblatt genügt, Code ist nicht nötig.“
    - Pattern: "die eigentliche Frage" (#5), a colon followed by a question, the slogan repeated, "no code" reassurance.
    - Rewrite: „Aus den vier Zahlen schreibst du einen Satz dazu, ob die geglättete Prognose genauer war als die naive. Du brauchst nur ein Tabellenprogramm.“

15. **`workshops.ts:285`** (EN `:692` „records the durable parts of the method“)
    - Quote: „Die einseitige Field Card fasst zusammen, was bleibt: … die vier Klassen von Ereignissen, die grundsätzlich nicht prognostizierbar sind.“
    - Pattern: colon reveal "was bleibt", an Anglicism, the ambiguous "grundsätzlich", and the puffery word "durable".
    - Rewrite: „Die Prüfkarte passt auf eine A4-Seite: fünf Säulen, die Servicelevel-Formel aus den Kosten von zu viel und zu wenig Ware, eine Faustregel für den Sicherheitsbestand und vier Arten von Ereignissen, die kein Modell vorhersagt.“

16. **`workshops.ts:296`**, with the label at `:299` „Ehrliche Nachfrage (p50)“
    - Quote: „Der Geschäftsfall stellt eine Lage nach, die in jeder Launchplanung vorkommt: … 1.180 ehrliche Nachfrage … Die im Übungslabor genannten Unternehmen dienen als Blickwinkel auf typische Abläufe: sämtliche Zahlen sind …“
    - Pattern: unsourced generalisation (#17), a pet word as a term (the same number is also called „Nachfrage p50“, „geschätzte Nachfrage“ and EN "underlying demand"), copula avoidance (#16), two colons.
    - Rewrite: „Bei diesem Launch ist die Nachfrage größer als die zugesagte Menge. Drei Standorte melden 1.370 Stück an, das Modell schätzt 1.180, zugesagt sind 1.050. Drei Abteilungen lesen daraus drei verschiedene Zahlen. Alle Firmen und Zahlen im Labor sind erfunden.“ Label: „Geschätzte Nachfrage (Median)“.

17. **`workshops.ts:327`** (EN `:734`)
    - Quote: „Drei interaktive Akte auf einer Seite: Kapazität festlegen, Aufschaukelung stoppen, schnelle Nachfrage kontrolliert freigeben, jeweils mit Simulation zum Mitspielen.“
    - Pattern: count-first list-colon opener with an infinitive triad (#2, #6).
    - Rewrite: „Drei Simulationen auf einer Seite. Du legst Kapazität fest, dämpfst die Schwankung durch gestapelte Puffer und gibst einen plötzlichen Nachfrageanstieg kontrolliert frei.“

18. **`workshops.ts:335`** (EN `:742`)
    - Quote: „Ein Launch, drei Zahlen, eine knappe Menge: Zuteilungsentscheidung, Systemkarte, Kostenasymmetrie und das tägliche Freigabe-Tor.“
    - Pattern: count-first fragment followed by a noun stack.
    - Rewrite: „Der Launch-Fall in elf Stationen. Du verteilst 1.050 Stück auf drei Standorte und legst fest, was täglich vor einer Freigabe geprüft wird.“

19. **`workshops.ts:229` and `:233`** (EN `:636`, `:640`)
    - Quote: „Knappheit verlangt eine nachvollziehbare Zuteilungsregel. Und der Restfehler von 12 % verlangt einen Menschen mit Namen …“ / „Erst Liefergrenze und Restfehler zusammen tragen die Regel.“
    - Pattern: abstractions as actors, three times (#16); a sentence starting with "Und"; a pet word.
    - Rewrite: „1.050 Stück reichen nicht für 1.180 Nachfrage. Du brauchst also eine Regel, die jede Person nachrechnen kann, und bei 12 % Restfehler gibt eine benannte Person jede Ausnahme frei.“ / „Deine Regel stützt sich auf zwei Zahlen: 130 Stück fehlen, und das Modell liegt noch 12 % daneben.“

20. **`workshops.ts:241`** (EN `:648`)
    - Quote: „Anmeldungen allein sind keine Nachfrage, ein Genauigkeitswert allein ist keine Regel. Verknüpfe Liefergrenze, Nachfrage und Restfehler.“
    - Pattern: parallel negations as an aphorism (#1, #5).
    - Rewrite: „Die Standorte melden 1.370 Stück an, die geschätzte Nachfrage liegt bei 1.180, lieferbar sind 1.050. Verteile nach der Nachfrage und lass bei 12 % Restfehler eine benannte Person jede Ausnahme freigeben.“

21. **`workshops.ts:447`** (EN `:851`)
    - Quote: „Ein starker Umsatz ist kein Qualitätsbeleg; geringes Volumen ist kein Einstellungsgrund. Beginne mit dem wiederholten Mängelsignal.“
    - Pattern: parallel negations (#1); "Signal" is jargon here.
    - Rewrite: „Umsatz (Rang 2) und Absatz (Rang 6 von 7) sagen nichts über die Qualität. Fang mit den Mängeln an: CRAFT führt die Mängelliste den zweiten Monat an.“

22. **`workshops.ts:477`**
    - Quote: „Ein Prompt, und Claude schreibt die extrahierten Kennzahlen hinein und öffnet die Seite: Umsatz je Linie … und die anstehende Entscheidung: der 8-Seiten-Bericht für den Analysten, die eine Seite für den Raum.“
    - Pattern: stacked colons (#2) and a fragment opener.
    - Rewrite: „Das Kit enthält eine leere Dashboard-Vorlage. Mit einem Prompt trägt Claude die Kennzahlen ein und öffnet die Seite. Sie zeigt Umsatz je Linie mit CRAFT markiert, Mängel, Marketing, offene Eskalationen und die anstehende Entscheidung. Den 8-Seiten-Bericht behält der Analyst, das Meeting bekommt diese eine Seite.“

23. **`workshops.ts:491`** (EN `:895`)
    - Quote: „Dieselbe Methode verlässt die Sandbox: … Die Frage auf dem Tisch: 31 Mrd. $ Capex in einem Quartal, Investment oder Leck?“
    - Pattern: false agency, colon reveal, a metaphor presented as a question, jargon (Capex, Investment).
    - Rewrite: „Jetzt nimmst du ein echtes Unternehmen. Claude lädt Metas Quartalsmitteilung Q2 2026 direkt von der SEC; im Kit liegt sie nicht. Du definierst sechs Kennzahlen, liest das Quartal aus (+28 % Umsatz, −8 % operatives Ergebnis) und beurteilst, ob sich 31 Mrd. $ Investitionen in einem Quartal rechnen können.“

24. **`workshops.ts:534` and `:542`** (EN `:938`, `:946`)
    - Quote: „Dasselbe Muster wie im Übungsfall, nur in echt: eine starke Schlagzeile mit einer Frage darunter.“ / „31 Mrd. $ … : eine Wette, die sich verzinst, oder ein Leck? Und welche Lesart ist ehrlicher: …“
    - Pattern: colon reveals, metaphors, "ehrlich".
    - Rewrite: „Meta meldet für Q2 2026 28 % mehr Umsatz und 8 % weniger operatives Ergebnis. Fast der gesamte operative Cashflow floss in Infrastruktur; der freie Cashflow lag bei 784 Mio. $.“ / „Lassen sich 31,1 Mrd. $ Investitionen in einem Quartal mit künftigen Erträgen begründen? Und welche Zahl beschreibt das Quartal besser, das gemeldete Minus oder der Wert ohne Sondereffekte?“

25. **`workshops-data-readiness.ts:177`** (EN `:377`; also `guide.html:91, 93, 94` and `demo.html:778, 1327`)
    - Quote: „Anweisungen leiten, Rechte setzen durch.“ / "Instructions guide, grants enforce."
    - Pattern: an aphorism repeated 7 times across W03 (#5, #19).
    - Rewrite (use it once, next to the forbidden read): „Ein Prompt kann die KI nur bitten, eine Tabelle nicht zu lesen. Blockieren kann das nur eine Datenbankberechtigung.“ (EN: "A prompt can only ask the AI not to read a table. Only a database permission can block the read.")

26. **`src/app/workshops/workshop-copy.ts:127`** (EN `:197`)
    - Quote: „${companyName} ist frei erfunden: kein echtes Unternehmen, keine echten Geschäftszahlen. Die Werte sind realistisch gewählt, damit Berichte, Kennzahlen und die Entscheidung im Workshop einem typischen Analysefall entsprechen.“
    - Pattern: a negation stack and over-explanation.
    - Rewrite: „${companyName} und alle Zahlen sind für diesen Workshop erfunden.“

27. **`workshop-copy.ts:88-94`** (catalogue header)
    - Quote: „Entscheidungswerkstatt · Selbstgeführt“ / „für konkrete Entscheidungen.“ / „Erst entscheiden, dann Belege prüfen und die Methode auf den eigenen Kontext übertragen.“ / „Wähle die Entscheidung“ / „Jeder Fall beginnt direkt im Entscheidungslabor.“
    - Pattern: "Entscheidung" five times in one block, the pet word "konkret", abstract nouns.
    - Rewrite: headingSecond „zum Durcharbeiten in 90 Minuten.“; introduction „${count} Workshops, jeder mit einer erfundenen Firma, ihren Zahlen und Dateien zum Herunterladen. Du entscheidest zuerst und prüfst dann an den Daten.“; available „Workshops“.

### Courses

28. **`src/lib/courses/course-hub-copy.ts:16-19`**
    - Quote: „§ Warum kostenlos“ / „Alles kostenlos. Vier Reader brauchen trotzdem ein Konto.“ / five sentences of account rules ending in „Akkreditiert sind sie nicht.“
    - Pattern: the heading promises a reason that the body never gives; a staccato heading; over-explanation; an inverted negation as the closer.
    - Rewrite: heading „Kosten und Konto“. Body: „Alle Kurse sind kostenlos. Für die vier Grundlagenkurse legst du ein Lernkonto an, damit dein Fortschritt auf jedem Gerät gleich ist. Technikkurse, Workshops und Bücher öffnest du ohne Konto; nur das PDF des Lernbuchs braucht eins. Die Teilnahmebestätigung stellt loehrning.ai selbst aus, sie ist nicht akkreditiert.“

29. **`catalog.ts:184`** (EN `catalog-copy.ts:62`)
    - Quote: „Arbeit verändert sich, Medien werden manipuliert, Systeme diskriminieren. Drei Blöcke trennen belastbare Befunde von Behauptungen. Quelle, Interesse und Unsicherheit stehen jeweils getrennt.“
    - Pattern: a sweeping triad as opener (#6), false agency, "belastbar", and a second triad.
    - Rewrite: „Drei Blöcke zu Arbeitsmarkt, Deepfakes und Bias. Zu jeder Aussage siehst du die Quelle, wer ein Interesse an ihr hat und wie sicher der Befund ist.“

30. **`catalog.ts:160`** (EN `catalog-copy.ts:50`)
    - Quote: „Wie generative KI antwortet, wo sie scheitert, welche Daten draußen bleiben und wie du sie trotzdem sicher einsetzt. Dazu die seit 27. Juli 2026 geltende Fassung von Artikel 4, eingeordnet. Am Ende eine lokal erstellte Teilnahmebestätigung.“
    - Pattern: three verbless fragments (#3).
    - Rewrite: „Du lernst, wie generative KI Antworten erzeugt, wo sie danebenliegt und welche Daten du nicht eingibst. Der Kurs erklärt Artikel 4 des AI Act in der seit 27. Juli 2026 geltenden Fassung. Am Ende erstellst du eine Teilnahmebestätigung.“

31. **`catalog.ts:208`** (EN `catalog-copy.ts:74`)
    - Quote: „Verboten, transparenzpflichtig, GPAI, Hochrisiko oder keine davon: Der Kurs zeigt dir, wie du deinen Anwendungsfall einordnest. … Rechtsberatung ist das nicht.“
    - Pattern: list-colon opener (#2), false agency, an inverted negation as the closer.
    - Rewrite: „Du ordnest einen Anwendungsfall einer Klasse zu: verboten, transparenzpflichtig, GPAI, Hochrisiko oder keine. Jede Aussage mit Frist nennt Rechtsstand und Primärquelle. Der Kurs ersetzt keine Rechtsberatung.“ Note: the card says "du", but the course itself uses "Sie" (form map). Pick one on purpose.

32. **`catalog.ts:265`** (EN `catalog-copy.ts:98`)
    - Quote: „Zwölf Lektionen, immer dasselbe Muster: ein Modell, eine begrenzte Übung. Die Themen: …“ / "Twelve lessons, always the same pattern. One model, one bounded exercise."
    - Pattern: count-first fragment and a colon reveal.
    - Rewrite: „Zwölf Lektionen mit je einer kurzen Übung in Claude, zu Prompt-Aufbau, Kontextdateien, Tool-Nutzung, Grounding, Reviews, Evaluation und Zusammenarbeit.“

33. **`catalog.ts:451` and `:453`** (EN `catalog-copy.ts:164`, `:166`)
    - Quote: „Eine belastbare Datenpipeline … entwerfen.“ / „Eine Pipeline scheitert selten an einer Stelle. … Siebzehn Simulationen und ein Abschlussfall spielen die typischen Fehlerketten durch.“
    - Pattern: pet word; an unsourced law of nature as the opener (#17); false agency.
    - Rewrite: tagline „Eine Datenpipeline von der Quelle bis zur Nutzung entwerfen und absichern.“ Description: „Zwölf Kapitel folgen den Daten von Ingest bis Governance. In 17 Simulationen und einem Abschlussfall verfolgst du, wie ein Fehler an einer Stelle weiter hinten Schaden anrichtet.“

34. **`catalog.ts:574`** (EN `catalog-copy.ts:209`)
    - Quote: „Wer trägt die Verantwortung, wenn KI mitarbeitet? … Dreißig Übungen fragen nach Entscheidungen, nicht nach Begriffen.“
    - Pattern: rhetorical opener (#10), false agency, tailing negation (#4).
    - Rewrite: „Neun Module mit 39 Lektionen zu Engineering, Produktarbeit, Betrieb, Rollen, Organisation, Daten, Governance und Messung. In 30 Übungen legst du fest, wer bei KI-gestützter Arbeit was entscheidet und prüft.“

### Demos

35. **`src/lib/demos-copy.ts:88`** (EN `:163`)
    - Quote: „KI-Projekte scheitern selten an der Technik. Sie scheitern an Annahmen, die niemand aufgeschrieben hat. Der Rechner legt jede Zahl und die Formel offen: zum Prüfen, nicht zum Verkaufen.“
    - Pattern: unsourced law (#17), anaphora, tailing negation (#4).
    - Rewrite: „Der Rechner zeigt jede Annahme als Zahl und die Formel dazu. Ändere Teamgröße, Stundensatz oder Nutzungsquote und sieh, wie sich das Ergebnis verschiebt.“

36. **`demos-copy.ts:64`** (EN `:139`)
    - Quote: „Governance gehört vor den Prompt, nicht hinter den Vorfall. Das Praxisbeispiel markiert PII …“
    - Pattern: chiasmus aphorism (#5), an unexplained acronym.
    - Rewrite: „Das Beispiel markiert personenbezogene Daten und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt, und zeigt einen Injection-Fall, den die Regeln übersehen.“

37. **`demos-copy.ts:40`** (EN `:115`), plus `demos.ts:195` and `:198`
    - Quote: „Recherche, Synthese, Kritik, Redaktion: vier Schritte, vier Zuständigkeiten.“ / „Vier Köpfe, ein Memo.“ / „Scout recherchiert, Analyst synthetisiert, Kritiker red-teamt, Redakteur formuliert. Redaktion statt Generalist.“
    - Pattern: list-colon opener, count-first fragments, the Anglicism "red-teamt" used as a verb, a "statt" slogan.
    - Rewrite: „Vier Agenten schreiben ein Memo: einer recherchiert, einer fasst zusammen, einer sucht Fehler, einer redigiert. Das lohnt sich nur, wenn die Fehlersuche das Memo besser macht.“ Kicker: „Ein Memo in vier Schritten.“

38. **`demos-copy.ts:46`** (EN `:121`), plus `demos.ts:229` and ogSubtitle `demos-copy.ts:49` / `:124`
    - Quote: „Verzug erkennen, Bestand prüfen, Nachricht entwerfen, Nachbestellung markieren. Ausnahmen in der Lieferkette folgen Regeln, und Regeln lassen sich automatisieren.“ / „Disponenten-Morgen, automatisch.“ / „Supply-Chain-Ausnahmen automatisch koordiniert.“
    - Pattern: a verbless infinitive stack, a syllogism, and an oversell: the demo ends in manual approval (`demos.ts:232`).
    - Rewrite: „Ein Lieferverzug löst vier Schritte aus: Bestand prüfen, Kundennachricht entwerfen, Nachbestellung markieren, eskalieren. Du siehst, welche davon der n8n-Workflow übernimmt und wo die Disponentin freigibt.“ Kicker: „Lieferverzug mit Freigabe.“

39. **`demos-copy.ts:52`** (EN `:127`)
    - Quote: „RAG spart Suchzeit. Aber nur, wenn das Archiv sauber ist und ein Review dahintersteht. Das Praxisbeispiel zeigt Fundstellen und Grenzen, keine rechtsverbindliche Auskunft.“
    - Pattern: staccato with an "Aber nur, wenn" fragment (#3), "sauber", tailing negation.
    - Rewrite: „Du fragst ein Archiv mit Beispielverträgen und bekommst die Klausel mit Fundstelle. Das Beispiel zeigt auch Fragen, auf die das System nicht antworten sollte. Eine Rechtsauskunft ersetzt es nicht.“

40. **`demos-copy.ts:70`** (EN `:145`)
    - Quote: „Ein LLM ohne Observability betreibst du blind. Logs, Budget-Alerts und Qualitätsmetriken zeigen, ob ein KI-Workflow stabil bleibt oder gerade kippt.“
    - Pattern: aphorism (#5), an Anglicism triad, false agency.
    - Rewrite: „Vier Beispielanwendungen mit Kosten, Antwortzeit, Fehlerquote und Drift nebeneinander. Du siehst, bei welcher ein Budget-Alarm anschlagen würde.“

41. **`demos-copy.ts:22` and `:58`** (EN `:97`, `:133`)
    - Quote: „Viele Analysen im Mittelstand entstehen in Excel. Also setzt das Praxisbeispiel dort an …“ / „Rechnungseingang ist in vielen Firmen Handarbeit. Das Praxisbeispiel begrenzt den KI-Einsatz auf das, was prüfbar bleibt: klare Felder, Validierung, menschliche Freigabe.“
    - Pattern: unsourced generalisation as opener (#17), a template subject (#18), a triad.
    - Rewrite: „Du arbeitest in einer Excel-Tabelle mit erfundenen Controlling-Zahlen: Formeln, eine Pivot-Tabelle und eine Plausibilitätsprüfung.“ / „Die KI liest die Felder einer PDF-Rechnung aus. Regeln prüfen Pflichtfelder und Dubletten, und vor dem SAP-Import gibt ein Mensch frei.“

42. **`demos-copy.ts:76`** (EN `:151`), plus `demos.ts:470`
    - Quote: „Wird dein LLM-System besser oder schlechter? Ohne eigene Messpunkte weißt du es nicht.“ / „Wie misst man, ob …?“
    - Pattern: rhetorical question with an instant answer (#10); "man".
    - Rewrite: „Du vergleichst für vier Beispielantworten die automatische Bewertung mit dem Urteil eines Menschen. In einem Fall widersprechen sich beide, und ein Drift-Indikator schlägt an.“

43. **`demos.ts:433` and `:436`**
    - Quote: „Formel statt Bauchgefühl.“ / „Welche Annahmen machen einen KI-Use-Case plausibel? Das Praxisbeispiel legt Formel und Unsicherheitsband offen.“
    - Pattern: a "statt" slogan and a rhetorical opener.
    - Rewrite: kicker „Annahmen einzeln ändern.“ Description: „Du trägst Teamgröße, Stundensatz und Nutzungsquote ein und siehst die Formel und die Spanne des Ergebnisses.“

### Static workshop pages

44. **`public/workshops/ki-prognosen-einschaetzen/hub.html:137-138`**
    - Quote: "Turn a forecast into a decision. A forecast only earns its keep when it changes a decision. … leave with a go/no-go policy you can defend, across three operating perspectives and a live demand simulator."
    - Pattern: aphorism, a promise, and "live", which oversells a static page.
    - Rewrite: "In about 90 minutes you work out what a wrong forecast costs, how big the buffer should be, and when a person has to approve. You work through three practice companies and a demand simulator that runs in your browser."

45. **`hub.html:145-147` and `:155-157`**
    - Quote: "Make a model earn its workflow: beat the process you already trust, in dollars" / "service level is a cost decision, not a gut feeling" / "deploy cheap, watch leading signals, retrain through a gate" / "Parcel network: Operations at scale · Device maker: Planning & precision · Social app: Signals & growth".
    - Pattern: colon-label aphorisms, "dollars" (the German page says Euro), and alliterative taglines that carry no information.
    - Rewrite: "01 Check whether a model beats 'same weekday last week', in euros · 02 Set the service level from the cost of too much and too little stock · 03 Decide which signal stops the automation and who approves the restart." Replace each tagline with the question that case asks.

46. **`field-card.html:197-203`** (and `:111`)
    - Quote: "★ The mindset that outlives every model" · "Predict ranges, not points." · "Respect the edge: forecast the probable, name the unforecastable out loud." · "A forecast is a range, not a line, and it earns its keep only through the decision it drives."
    - Pattern: a puffery heading, an aphorism cluster, tailing negations (5.4 per 1k words on this page).
    - Rewrite: heading "Five checks before you trust a forecast". Then: "1. Compare against 'same as last week'; if the model does not beat it, stop. 2. Pick the model by its backtest score. 3. Report a range with every forecast. 4. Test on weeks the model has not seen, from several start dates. 5. Write down which events the forecast cannot cover."

47. **`field-card.html:193, 205, 211`**
    - Quote: "A connected-fitness firm extrapolated lockdown demand, then cut guidance by ~$1B in 70 days …" · "on public retail demand data, 5,507 teams competed; only 7.5% beat plain exponential smoothing" · "a hardware giant: … ~$56B of manufacturing purchase obligations" · "Figures from public competition results, SEC filings and earnings calls".
    - Pattern: vague attribution with precise real numbers (#17).
    - Rewrite: name each company or competition with a dated source link (the retail benchmark looks like the M5 accuracy competition; verify before citing), or drop the numbers.

48. **`public/workshops/datenbereitschaft-fuer-ki/demo.html:544-545`**
    - Quote: "One question, two databases. One question about FOLDLINE's revenue. Asked twice. On raw export tables the AI gets the wrong answer. On approved views it gets the right one. Below you can see why."
    - Pattern: count-first headline that is factually wrong (one PostgreSQL database with two logins, `foldline_bad_reader`/`public` and `foldline_ready_reader`/`analytics`), plus staccato (#3).
    - Rewrite: H1 "Same question, two logins". Lede: "FOLDLINE asks for ending MRR in Q2 2026. The first login reads seven raw export tables and gets −19,960 for April. The second reads five approved views with a written definition and gets 334,675, the database value. Replay both runs below."

49. **`demo.html:675`** (repeated at `:760-763`, `:778`, `:1327`)
    - Quote: "Four layers. The Skill guides. The semantic layer defines. The approved view serves. The grant enforces. Step through them."
    - Pattern: a four-beat staccato slogan, used four times on one page (#3, #19).
    - Rewrite: "Four things changed between the two runs: a Skill file with working rules, a written metric definition, approved views, and a login that can read only those views. Step through them in order." Keep one instance.

50. **`demo.html:723`**
    - Quote: "The database grant is the lock. What if the AI ignores the guidance and reaches for customer names? … The database says no. This is the only layer that cannot be talked around."
    - Pattern: a rhetorical question, a punchline, and an overclaim. The guide itself says "Read-only access can still expose too much."
    - Rewrite: "The login may read five approved views and nothing else. When the AI asks `core.accounts` for customer names, PostgreSQL returns ERROR 42501. A prompt cannot switch this check off."

**Also worth fixing (outside the top 50):**
- `workshops.ts:498` / `:902`: „Nächster Monat, neuer Bericht, derselbe Skill.“ is a triad fragment.
- `catalog.ts:512` / `catalog-copy.ts:187`: „Eine Kennzahl kann gut aussehen und trotzdem täuschen. … zeigen, wo genau das passiert.“
- `catalog.ts:390` / `catalog-copy.ts:143`: „Wo bricht ein Datensystem?“ with "Simulations find the limit first."
- `catalog.ts:232`: „Ein Arbeitsablauf, der sich wiederholen lässt: Recherche, Dokumentation, Automatisierung.“
- `catalog.ts:328` / `catalog-copy.ts:121`: „der Abschlussfall zieht alles zusammen“.
- `course-hub-copy.ts:10-11`: „KI verstehen, einsetzen und prüfen.“ fails the swap test.
- `demos-ui-copy.ts:20-22`: „12 prüfbare Simulationen“, „Arbeitsabläufe prüfen. Annahmen sichtbar machen.“
- `workshops-data-readiness.ts:124`: „entlarven“; `:138`: „Die ehrlichen Grenzen kennen“ (use „Grenzen des Aufbaus“).
- `workshops.ts:551`: „drei anspruchsvollere Zusatz-Prompts“.
- `guide.html:95`: "Words without the fog" (use "Glossary").
- `demo.html:703`: "A manager asks a plain question. It sounds simple. But …".
- `demo.html:1401`: "That was the whole demo."

## 3. Counts per pattern

Scope is about 15.5k words. "Raw" is what the regex scan found. "Confirmed slop" is what remains after a manual check.

| # | Pattern | Raw | Confirmed slop | Worst files |
|---|---|---|---|---|
| 1 | Staged contrast (`keine X, sondern Y`, `rather than`, "X statt Y" slogans; split-sentence form) | 8 (split form: 0) | 5 | workshops.ts:484/888, demos-copy.ts:163, demos.ts:198/433 |
| 2a | Colon reveal (`Das Herzstück:`, `Die Reparatur:`, `Die Frage auf dem Tisch:`, `Verdict:`) | 9 | 7 | workshops.ts, workshops-data-readiness.ts |
| 2b | Stacked colons in one prose sentence | 12 | 3 (the rest are code, YAML or merged headings) | workshops.ts:477, :542 |
| 2c | Count-first / symmetric fragments | 11 | 11 | W02 "Fünf Prompts, ein Analyst" (DE+EN), W03 summary (DE+EN), guide/demo H1s, demos |
| 2d | List-colon openers and verbless infinitive stacks | 3 | 3 | demos-copy.ts:28, :40, :46 |
| 3 | Staccato runs (3+ sentences of ≤ 4 words) and punchline closers | 6 runs | 8 incl. closers | demo.html (544, 675, 778, 1327), "Keine Zeile Code.", "Ohne Code, ohne KI-Konto." |
| 4 | Tailing negation (`…, nicht X.`) | 41 | about 21 (the rest are scope statements to keep, e.g. "not signed off", "not profit") | density per 1k words: field-card 5.4, workshops-data-readiness 4.6, demos-copy 4.4, guide 4.1 (catalogue threshold 4.0) |
| 5 | Aphorisms and quotables | 30 | 30, in 10 families | "earns its cost/keep" ×9; "Instructions guide…" ×7 plus the four-beat variant ×4; "scheitern selten/rarely fail" ×4; "blind" ×2; "Wert steckt/value sits" ×2 |
| 6 | Forced triads (inline) | not measured per file | about 14 spotted | card descriptions, demos "why", hub headings |
| 7 | Puffery / evaluative adjectives | 7 | 6 | "Herzstück", "mindset that outlives every model", "durable", "anspruchsvoll", "genau das" |
| 10 | Rhetorical question plus instant answer | 17 | 12 | catalog descriptions (3), demos (3), W01 summary, W02 decision question, field-card:199, demo.html:723 |
| 16 | False agency / copula avoidance | 39 | 39 | „Das Praxisbeispiel zeigt/begrenzt/markiert …“ ×12 DE and "The example …" ×6 EN; "Der Kurs zeigt" ×4; "Simulationen zeigen / Übungen fragen" ×6; „tragen die Regel“, „Knappheit verlangt“, „dienen als“ |
| 17 | Vague attribution / unsourced generalisation | 17 | 14 | demos-copy.ts (8), catalog (2), W01 narrative (2), field-card unnamed firms (2) |
| 18 | Template uniformity | – | 3 templates | 24 demo `proof` strings open with „Sandbox-Szenario:“ / "Sandbox scenario:"; 12 `why` strings follow "claim → Das Praxisbeispiel … → triad"; W01 steps "Erster/Zweiter/Dritter Akt" (8) |
| 19 | Pet words | 37 | 37 | ehrlich/honest 12, explicit 7, belastbar 4, defensible 3, konkret 3, sauber/clean 3, nachvollziehbar/traceable 3, prüfbar 2 |
| 19b | Term drift (one concept, several names) | – | 4 concepts | W03 "Workshop" / „Interaktiver Kurs“ / "course"; demand „Nachfrage p50“ / „geschätzte“ / „ehrliche“ / "underlying"; demos „Praxisbeispiel“ / „Praxislabor“ / „Labor“ / „Simulation“ / "Demo"; W01 „Labor“ / „Akt“ / „Station“ / „Geschäftsfall“ / „Hub“ / „Field Card“ |
| – | Anglicisms in German copy | 44 | about 20 that matter | „Sandbox“ (13 DE), „Hands-on“, „Field Card“, „Walkthrough“, „Go-live“, „Capex“, „Investment“, „Overspend“, „red-teamt“, „Seed-Szenarien“, „Capstone“ |
| 8, 21 | Chat residue, sycophancy, placeholders | 0 | 0 | – |
| 14 | Em/en dashes in visible text | 0 | 0 | one spaced hyphen in an image alt, catalog.ts:407 |

**Main voice problems, in order of impact:**

1. **Headline prose on cards and heroes.** Fragments, colon reveals and count-first openers sit in exactly the strings a visitor reads first (summary, description, H1, kicker).
2. **Slogans as structure.** Each workshop has a refrain it repeats on every surface. Once is emphasis. Seven to eleven times reads as a template.
3. **Defensive negation.** The copy keeps saying what things are not: not real, not measured, not advice, no code, no account, not stored. Where the reader could not have assumed otherwise, this is noise, and it buries the facts.
4. **Abstractions as actors.** „Das Praxisbeispiel zeigt“, „Der Kurs zeigt“, „Knappheit verlangt“, „Simulationen zeigen“. The learner ("du") is rarely the subject in demo and course blurbs. The workshop steps do better.
5. **Pet evaluatives and term drift.** „ehrlich“ does double duty as praise and as a technical term; W03 is both a workshop and a „Kurs“.
6. **Jargon density in W01.** „Aufschaukelungsgrad“, „p50“, „Kostenasymmetrie“, „rollierender Rücktest“, „Freigabe-Tor“, „Go-live“ appear without explanation on the page meant for Disponenten and Führungskräfte.

## 4. Over-explaining and overselling

### 4.1 Certainty claims (unprovable, or contradicted by the site's own evidence)

| Where | Claim | Problem | Rewrite |
|---|---|---|---|
| `workshops.ts:463` (EN `:867`) | „Ab jetzt liest Claude in diesem Ordner immer zuerst deine Regeln.“ | W03 (`workshops-data-readiness.ts:140`) recorded the definition being cited 0 of 3 times | „Claude soll ab jetzt zuerst deine Regeln lesen. Prüfe in der Antwort, ob er sie nennt.“ |
| `workshops.ts:470` (EN `:874`) | „jede Zahl bleibt auf Datei und Spalte rückführbar“ / „mit Skill greifen dieselben Regeln jedes Mal“ / "the recorded rules remain consistent" | The step checks one number. LLM output varies from run to run. | See #3 |
| `demos.ts:331` | „DSGVO-Guard.“ | A regex highlighter; the risk note at `:352` says false negatives are possible | „Personendaten markieren.“ |
| `demos.ts:229`; `demos-copy.ts:49` (EN `:124`) | „Disponenten-Morgen, automatisch.“ / „Supply-Chain-Ausnahmen automatisch koordiniert.“ | The flow ends in manual approval (`demos.ts:232`) | „Lieferverzug mit Freigabe.“ / „Lieferverzug: Workflow-Entwurf mit manueller Freigabe.“ |
| `hub.html:138` | "a live demand simulator" | The page is static ("alles läuft statisch im Browser") | "a demand simulator in your browser" |
| `demo.html:544` | "two databases" | One database, two logins | See #48 |
| `demo.html:723` | "the only layer that cannot be talked around" | An absolute claim; the guide warns that read-only access can still expose too much | See #50 |
| `demos-ui-copy.ts:258` | DE `live_api`: „sendet tatsächliche Anfragen … Kosten entstehen pro Anfrage.“ | EN `:280` says "would send … available only when … enabled". The German states as fact what the English makes conditional. | „Dieser Modus würde echte Anfragen an eine KI-API senden. Er ist nur aktiv, wenn der Anbieter freigeschaltet und geprüft ist. Gib keine persönlichen Daten ein.“ |
| `workshops.ts:168`, `:575`; `hub.html:138`; `workshops.ts:644`, `:839` | „Go/No-Go-Entscheidung, die du auch verteidigen kannst“, "defensible", "a go/no-go policy you can defend" | A promise the kit cannot guarantee | Name the output: „eine Go/No-Go-Regel mit Schwellenwert und benannter Freigabe“ |
| `catalog.ts:451`; `catalog-copy.ts:164` | „belastbare Datenpipeline“ / "reliable data pipeline" | Rates the result the learner will produce | See #33 |

### 4.2 "ohne Code, ohne …" stacks and access reassurance (17 mentions across three workshops)

- **W01:**
  - `workshops.ts:168` „Ohne Programmierung, ohne Installation, ohne KI-Zugang“ (triple)
  - `:172` „Kein KI-Zugang nötig“
  - `:278` „Code ist nicht nötig“
  - `:575` "No programming, no installation, no AI account" (triple)
  - `:579` and `:685` (EN mirrors)
  - `hub.html:139` "No sign-up"
- **W02:**
  - `workshops.ts:372` „Ohne Programmierung und ohne API-Key“
  - `:463` „Keine Zeile Code.“
  - `:779` (EN mirror of `:372`)
  - `:867` "No code is required."
- **W03:**
  - `workshops-data-readiness.ts:14` „Ohne Code, ohne KI-Konto.“
  - `:20` „kein Konto und keine Installation“
  - `:215` "No code, no AI account."
  - `:221` (EN mirror of `:20`)
  - `guide.html:85` "No coding"
- **Workshop page copy:** `workshop-copy.ts:116` / `:186` „Kostenlos, ohne Anmeldung.“ This is fine as a single meta label.

Fix: say it once per workshop, in `accessNote`, in positive form: „Läuft im Browser. Du brauchst ein Tabellenprogramm.“ / „Du brauchst einen Claude-Zugang; nimm nur das Übungskit.“ Remove it from `summary`, `description` and step text.

### 4.3 Triple and stacked negatives

- `workshops-data-readiness.ts:87` (EN `:287`): „Weder Addition noch größeres Modell klärt eine unklare Definition.“ → „Erst die Definition sagt, ob 100 oder 120 Euro stimmen.“ (EN: "Only the definition tells you whether 100 or 120 euros is right.")
- `workshops.ts:839` (EN): "Without unit costs, assigned returns, or marketing attribution, neither more budget nor discontinuing the line is supported." → "The repeated defects justify holding the budget. To decide on more budget or closing the line you would need unit costs, returns per line and marketing attribution, and the kit has none of them."
- `demos-ui-copy.ts:243`: „Kein echter Nutzer, kein echtes Unternehmen, keine echte KI-Inferenz laufen im Hintergrund. Die Zahlen zeigen, wie ein Ergebnis aussehen könnte, nicht was ein System tatsächlich gemessen hat.“ → „Alle Daten sind erfunden, und es läuft kein KI-Modell. Die Zahlen sind Beispiele, gemessen wurde nichts.“
- `workshop-copy.ts:127`: „kein echtes Unternehmen, keine echten Geschäftszahlen“ (see #26).
- Inverted negations as sentence closers: `course-hub-copy.ts:19` „Akkreditiert sind sie nicht.“, `catalog.ts:208` „Rechtsberatung ist das nicht.“ Write them straight: „… ist nicht akkreditiert“, „… ersetzt keine Rechtsberatung“.

### 4.4 Over-explaining and duplication

- **Demo detail pages stack five disclaimers in one box** (`components/demos/demo-detail-layout.tsx:250-275`):
  1. H2 „Sandbox-Szenario“.
  2. The `proof` text starts again with „Sandbox-Szenario:“ (24 strings).
  3. Many `proof` texts end with a negation („Keine der beiden Zahlen ist ein Messergebnis.“, „Es misst keinen produktiven Durchsatz.“, „Das sind keine Trainingsergebnisse.“).
  4. `syntheticDataLabel` adds another negation („keine Verbindung zu Microsoft 365“).
  5. A `riskNote`.
  - The evidence badge tooltip repeats it all again.
  - Fix: drop the „Sandbox-Szenario:“ prefix and keep one sentence stating what is invented.
- **W02 step 01** (`workshops.ts:456` / `:860`): a 38-word sentence on data transfer and retention repeats `accessNote` (`:376`). Cut it from the step.
- **W03 detail page:**
  - The six headline numbers appear in the description (`:16`), step 02 (`:126`) and step 03 (`:133`) on one page.
  - Three sentences say "not approval / not reliability" (`:147`, `:176`, `:178`).
  - Keep the numbers in the steps and one limits sentence.
- **W01 detail page:** 1.370 / 1.180 / 1.050 appear 7 times (lab prompt, facts, evidence, step 04, narrative, metrics, decision question). The decision lab needs them. Narrative and step 04 can refer back to them.
- **`demos-ui-copy.ts:253`** (recorded trace): „spielt eine aufgezeichnete Beispielspur ab. Du siehst die Wiederholung einer aufgezeichneten Beispielspur, keine Live-Ausführung.“ says the same thing twice. Rewrite: „Spielt einen aufgezeichneten Ablauf ab. Nichts läuft live, kein System wird angesprochen.“
- **`course-hub-copy.ts:19`**: five sentences of account rules under a heading (`:16` „§ Warum kostenlos“) that never says why. See #28.

## 5. Recommendations for the rewrite pass

1. **Cards and heroes first.** Rewrite every `summary`, `description`, H1/lede and `titleKicker` with an actor ("du") and a number from the case. No fragment openers, no colon reveals.
2. **One slogan per workshop at most**, used once, where its evidence is shown. Retire "earns its keep", "Instructions guide, grants enforce" and the four-beat refrain.
3. **Fix the contradictions** in §4.1 before any styling work. They are factual problems, not tone.
4. **Demos:**
   - Replace „Das Praxisbeispiel …“ as subject with „Du …“ or the concrete actor (the Agent, the Disponentin).
   - Drop the „Sandbox-Szenario:“ prefix.
   - Give each `why` one sourced or case-bound first sentence.
5. **Fix the terms:**
   - Workshop, not „Kurs“, for W03's format label.
   - One name for estimated demand.
   - „Prüfkarte“, or keep "Field card" consistently as a product name.
   - Define p50, MRR and Capex at first use, or avoid them on German cards.
6. **Put access and data-flow facts in one place per workshop** (`accessNote`), in positive form.
7. **Workshop 04 (ESG):**
   - Apply catalogue §3.8 from the start: no „nachhaltig/klimaneutral“ without object, number and scope.
   - Keep ESRS terms of art („wesentlich“, „doppelte Wesentlichkeit“).
   - Use the W03 order: raw input, AI output, check against the source, rule.
