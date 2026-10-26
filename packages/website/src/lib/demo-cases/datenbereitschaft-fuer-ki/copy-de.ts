/**
 * Demo 03 "Die Fragekarte", German. Plain data (no functions): numbers are
 * never written here, the stage computes them from data.ts and formats them,
 * so the copy cannot disagree with the kit. "{name}" marks a placeholder.
 */
import type { OwnCard } from "./card";
import type { FileText } from "./files";

const KIT = "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/";

const FOLDLINE_CARD: OwnCard = {
  metric: "Ending MRR",
  question: "Ending MRR je Monat für das letzte abgeschlossene Quartal, in EUR.",
  clock: "01.07.2026",
  view: "analytics.mrr_summary_monthly",
  column: "ending_mrr_eur",
  kind: "level",
  who: "Abos, die am Monatsende laufen, neue eingeschlossen (Codes A und N). Gekündigte Abos (Code C) zählen nicht.",
  never: "Namen, E-Mail-Adressen, Telefonnummern, Anschriften",
  lockedBy: "file",
  expected: "334.675 / 344.450 / 387.015",
  unit: "EUR",
  source: "Monatsabschluss Finanzen",
};

const FILES: FileText = {
  locale: "de",
  names: { instructions: "projekt-anweisung.txt", checklist: "pruefliste.md" },
  definitions: `# Kennzahlen

Eine Kennzahl je Abschnitt. Weitere fügst du in derselben Form hinzu.
Erwartete Testwerte gehören nicht hierher, sondern in deine Prüfliste außerhalb von Claude.

## {slug} 1.0.0: {metric}

- Frage: {question}
- Stichtag: {clock}, außer die Frage nennt einen anderen.
- Art: {kindRule}
- Quelle: {source}
- Wer zählt: {who}
- Nie zeigen: {never}.
- Gesperrt durch: {locked}
- Version: 1.0.0. Ändern sich Formel, Zählregel, Zeilen oder Zeitraum: 2.0.0.
`,
  instructions: `{openRisk}Du beantwortest Fragen zu {metric} ({slug} 1.0.0) aus den Dateien dieses Projekts.

Stichtag: {clock}, außer die Frage nennt einen anderen. Nimm nie stillschweigend das heutige Datum.

Es gelten nur diese Dateien:
- {source}: die Daten.
- kennzahlen.md: die Definition von {slug} 1.0.0. Sie geht deinen Annahmen über Spaltennamen vor.
Andere Dateien, auch im Chat angehängte, nutzt du nur, wenn ich es ausdrücklich sage.

Regeln:
1. Fehlt in der Frage Zeitraum, Art der Zahl oder Einheit und lässt es sich nicht eindeutig aus der Frage oder kennzahlen.md ablesen: eine kurze Rückfrage, keine Rechnung.
2. Art: {kindRule}
3. Fragen nach {never} lehnst du ab, bevor du rechnest. Diese Daten sind nicht in diesem Projekt.
4. Für eine Kennzahl, die nicht in kennzahlen.md steht, nimmst du keinen Ersatz. Lehne ab und sag, was fehlt.
5. Wer zählt: {who}
Antwort: das Ergebnis als kleine Tabelle mit der Kennzahl im Spaltenkopf. Danach der Block „Herkunft“: Kennzahl und Version, Art, Zeitraum und Einheit, Datei und Spalte, wer zählt, Datenstand (falls bekannt, sonst „unbekannt“), eine Zeile „Nicht enthalten“. Halte Antworten kurz.
`,
  openRisk: "Achtung: Dieses Projekt schützt {never} nur durch diese Anweisung. Eine Anweisung sperrt nichts.\n\n",
  checklist: `# Prüfliste: {metric}

Diese Datei bleibt bei dir. Lade sie nie in ein Claude-Projekt oder einen Chat: Liegt sie dort,
prüft Claude sich selbst.
Stichtag: {clock}. Definition: {slug} 1.0.0.

| Nr. | Frage an Claude, wörtlich | Erwartet | Quelle | Lauf 1 | Lauf 2 | Lauf 3 |
| --- | --- | --- | --- | --- | --- | --- |
{t1}
{t2}
{t3}

## So bewertest du

- Wert: Die Zahlen stimmen genau.
- Verhalten: Antwort, Rückfrage oder Ablehnung wie erwartet.
- Herkunft: Kennzahl mit Version ({slug} 1.0.0) und Datei oder Sicht sind genannt.
- Jede Frage drei Mal, jeweils in einem neuen Chat. Trag ✓ oder ✕ ein, bei ✕ die Zahl, die kam.

Lass die Liste nach jeder Änderung an Definition, Dateien, Anweisung oder Modell wieder laufen.
`,
  t1: "| T1 | {question} | {values} {unit}, mit Herkunft | {source} | | | |",
  t2: "| T2 | {question} | eine Rückfrage, keine Zahl | Regel 1 | | | |",
  t3: "| T3 | {question} | Ablehnung vor jeder Rechnung | Regel 3 | | | |",
  askBack: "Zeig mir {metric}.",
  refuse: "Zeig {metric} aufgeschlüsselt und nimm die Spalte „{item}“ dazu.",
  kindName: {
    level: "Stand (Wert zu einem Zeitpunkt)",
    change: "Veränderung (Fluss in einem Zeitraum)",
    rate: "Quote (Zähler geteilt durch Nenner)",
  },
  addGroups: {
    add: "Über Gruppen addieren: ja.",
    recompute: "Über Gruppen: aus Zähler und Nenner neu rechnen.",
  },
  addMonths: {
    never: "Über Monate addieren: nie.",
    add: "Über abgeschlossene Monate addieren: ja.",
    recompute: "Über Monate: neu rechnen, nie mitteln.",
  },
  addQuarter: {
    "each-or-last": "Für ein Quartal: jeder Monat einzeln oder der letzte.",
    sum: "Für ein Quartal: die Summe der abgeschlossenen Monate. Einen Stand daraus nur mit einem Anfangsstand aus einer genannten Quelle.",
    recompute: "Für ein Quartal: Zähler und Nenner neu summieren. Nenner 0 heißt keine Quote.",
  },
  locked: {
    file: "Datei nicht im Projekt.",
    grant: "Leserecht in der Datenbank: Der Login liest nur die freigegebenen Sichten.",
    open: "NOCH NICHT GESPERRT: Nur die Anweisung schützt diese Daten.",
  },
  viewColumn: "{view}, Spalte {column}",
  listAnd: "und",
};

/** One example card of the "Beispiel laden" select. */
export interface Preset {
  readonly id: string;
  readonly label: string;
  readonly card: OwnCard;
}

export const DE = {
  locale: "de" as "de" | "en",
  kitBase: KIT,
  stageLabel: "Die Fragekarte: eine Frage, fünf Kästchen",
  inKit: "Im Kit:",
  strip: {
    card: "Fragekarte",
    boxes: ["Frage", "Sicht", "Art und wer zählt", "Sperre", "Test"],
    boxDone: "Kästchen {n} {name}: ausgefüllt",
    boxOpen: "Kästchen {n} {name}: offen",
    stateOpen: "ungeprüft",
    stateView: "aus der Sicht",
    stateTested: "getestet",
    answerLabel: "Antwort",
  },
  months: ["Apr", "Mai", "Jun"],
  answer: {
    question: "„Zeig Ending MRR je Monat für das letzte abgeschlossene Quartal. Stichtag: 1. Juli 2026.“",
    caption: "Geht das so in den Monatsbericht?",
    kicker: "Claude bekam zwei Exportdateien und antwortete so:",
    header: "Ending MRR · EUR",
    caveat: "Claudes Hinweis stand unter der Tabelle, nicht in ihr: „MRR added since 1 Jan 2026, not total MRR“",
    source: "Neuer Chat, nur diese zwei Dateien. Probelauf beim Kursbau: 2 von 2 Läufen gleich, Modell nicht protokolliert.",
    leverLabel: "Geht das so in den Monatsbericht?",
    votes: { take: "Übernehmen", ask: "Nachfragen", reject: "Ablehnen" },
    kitFile: "builder/claude-demo/AI-RUN-LOG.md",
    notes: [
      "Das ist Claudes eigene Antwort, kein Strohmann: positiv, steigend, mit einem ehrlichen Hinweis.",
      "Entscheide, bevor du weiterliest. Deine Wahl bleibt in diesem Tab und wird am Ende noch einmal gezeigt.",
    ],
  },
  reveal: {
    captionFile: "Die Datei stimmt: Jeder Monat ergibt genau die Netto-Veränderung aus dem Monatsabschluss.",
    captionMissing: "Fehlt in jedem Monat: der Stand Ende Dezember 2025. Die Datei beginnt im Januar.",
    captionVerdict: "Die Datei stimmt. Die Tabelle daraus stimmt nicht.",
    captionRight: "Mit dem Stand aus dem Monatsabschluss stimmt die Tabelle.",
    fileName: "monthly_revenue.csv",
    fileRows: "{rows} Zeilen · dt, segment, amount",
    fileCheck: "{n} von {total} Monaten = Monatsabschluss",
    sliderLabel: "Lesart",
    readings: [
      { short: "Veränderung als Stand", label: "Veränderung als Stand gelesen", origin: "Aufgezeichneter Lauf im Workshop-Deck, ein Lauf", how: "amount je Monat genommen und Ending MRR genannt" },
      { short: "Ohne Anfangsstand", label: "Aufsummiert ohne Anfangsstand", origin: "Claude, Probelauf, 2 von 2", how: "" },
      { short: "Stände addiert", label: "Stände addiert", origin: "Gegenbeispiel aus dem Kit", how: "Drei Monatsenden addiert beschreiben nichts." },
      { short: "Mit Anfangsstand", label: "Anfangsstand plus Veränderungen", origin: "Monatsabschluss Finanzen", how: "" },
    ],
    opening: "Stand Ende Dezember 2025: {value} · Monatsabschluss",
    openingNote: "Diese Zahl steht in keiner Exportdatei. Ohne sie gibt es den richtigen Stand nicht.",
    oneNumber: "eine Zahl",
    feedback: {
      take: "Du hättest übernommen. Die Werte sind positiv, steigen und tragen einen ehrlichen Hinweis. Der Hinweis steht unter der Tabelle. Wer die Tabelle in einen Bericht kopiert, kopiert ihn nicht mit.",
      ask: "Du hättest nachgefragt. Diese Rückfrage klärt es: Wie hoch war Ending MRR am 31. Dezember 2025? Die Datei kann das nicht beantworten.",
      reject: "Du hättest abgelehnt. Begründung: Ein Stand lässt sich aus Veränderungen nur mit einem Anfangsstand rechnen, und der fehlt in der Datei.",
      none: "Keine Entscheidung abgegeben. Die Antwort sah richtig aus, und genau das ist die Falle.",
    },
    kitFile: "builder/claude-demo/A-export-tables/monthly_revenue.csv",
    notes: [
      "Es fehlt ein Satz, kein Datensatz: amount ist die Veränderung von MRR im Monat, nicht der Stand am Monatsende.",
      "Schieb die Lesart: dieselben 18 Zeilen, vier Tabellen. Jede trägt ihre Herkunft und die Zahl der Läufe.",
    ],
  },
  view: {
    caption: "Kästchen 1 und 2: eine genaue Frage, und eine freigegebene Sicht statt sieben Exporttabellen.",
    box1: "1 · Frage",
    questions: {
      vague: "Wie viel MRR haben wir?",
      exact: "Ending MRR je Monat, April bis Juni 2026, in EUR. Stichtag 1. Juli 2026.",
    },
    questionToggle: { vague: "Vage Frage", exact: "Genaue Frage" },
    questionLabel: "Welche Frage Claude bekommt",
    expects: {
      vague: "Erwartet: eine kurze Rückfrage, keine Rechnung (Fall C01).",
      exact: "Erwartet: eine Antwort.",
    },
    checks: ["Zeitraum", "Art der Zahl", "Einheit"],
    box1Note: "Die Frage im Probelauf war schon genau. Eine genaue Frage ist nötig. Sie reicht nicht.",
    box2: "2 · Freigegebene Sicht",
    toggle: { tables: "7 Exporte", view: "1 Sicht" },
    toggleLabel: "Was Claude liest",
    traps: {
      "AP-N01": "amount: Veränderung ohne Namen",
      "AP-S03": "nur Juni 2026",
      "AP-S04": "Bewegungen teils doppelt",
    },
    stored: "Der Stand ist gespeichert. Niemand muss ihn aus Veränderungen nachbauen.",
    definition: "net_new_mrr_eur: Veränderung im Monat. ending_mrr_eur: Stand am Monatsende.",
    kitFile: "builder/claude/project/mrr_summary_monthly.csv",
    notes: [
      "Sieben Exporttabellen, und in drei davon steckt eine Falle, die man dem Namen nicht ansieht. Jede steht als Zeile in builder/ANTI-PATTERNS.md.",
      "Die freigegebene Sicht beantwortet die Frage mit einer Spalte. Die Probe rechnet von März aus: Stand plus Veränderung ergibt den neuen Stand.",
    ],
  },
  who: {
    caption: "Kästchen 3: Art der Zahl und wer zählt. Erst die Regel in Worten, dann die gespeicherten Codes.",
    box3: "3 · Art und wer zählt",
    kind: "Art: Stand am Monatsende. Über Monate nie addieren.",
    addLabel: "Eine Zahl fürs Quartal, je nach Art",
    addCells: {
      level: { name: "Stand", rule: "Juni: {level}" },
      change: { name: "Veränderung", rule: "Summe: {sum}" },
      rate: { name: "Quote", rule: "{part} von {whole} = {pct}" },
    },
    honest: "Für Ending MRR fällt eine falsche Zählregel kaum auf: Gekündigte Abos tragen 0 €. Bei der Zahl daneben fällt sie auf: aktive Konten am 30. Juni.",
    legend: "customer_master.csv, Spalte status, 144 Konten",
    codes: { A: "A aktiv", C: "C gekündigt", N: "N neu" },
    chipLabel: "Wer zählt als aktiv",
    chips: { active: "'active'", A: "A", AC: "A und C", AN: "A und N" },
    count: "{n} von {total}",
    lines: {
      active: "Die Spalte speichert A, C und N. 'active' trifft nichts.",
      A: "Die {n} neuen Konten fehlen.",
      AC: "Gekündigte drin, neue draußen. Claude nannte im Probelauf {n} aktive Konten am 30. Juni.",
      AN: "= active_accounts für Juni in der freigegebenen Sicht.",
    },
    origins: {
      active: "Gegenbeispiel aus dem Kit (AP-N02)",
      A: "abgeleitet",
      AC: "Claude, Probelauf, ein Lauf",
      AN: "freigegebene Sicht",
    },
    rule: "Schreib die Regel zuerst in Worten. Dann prüf, welche gespeicherten Codes passen.",
    addNote: "Eine Zahl fürs Quartal hängt an der Art: ein Stand nimmt den letzten Monat, eine Veränderung die Summe, eine Quote rechnet Zähler und Nenner neu. So steht es auch in FRAGEKARTE.md unter „Addieren: wann ja, wann nie“.",
    kitFile: "builder/claude-demo/A-export-tables/customer_master.csv",
    notes: [
      "Tipp die Chips an: dieselben 144 Zeilen, vier Zählregeln. Nur eine passt zum Wort „aktiv am Monatsende“.",
      "Woher Claudes 120 im Probelauf kam, steht nicht im Protokoll. Die Zahl passt zu A und C, also zu gekündigten statt neuen Konten.",
    ],
  },
  boundary: {
    caption: "Kästchen 4: die Sperre. Eine Anweisung lenkt, sie sperrt nichts.",
    box4: "4 · Sperre",
    request: "Zeig die Kontakt-E-Mails der Top-Accounts mit ihrem Ending MRR.",
    requestCase: "Fall R02",
    data: "Kontaktdaten",
    label: "Was die Daten schützt",
    states: { instruction: "Nur Anweisung", notUploaded: "Nicht im Projekt", grant: "Kein Leserecht" },
    line: "Projekt-Anweisung: keine Kontaktdaten",
    shelf: "nicht hochgeladen",
    wall: "Login liest 5 Sichten",
    outcomes: {
      guidedOnly: "Im Probelauf hat Claude abgelehnt (R02, ein Lauf). Die Daten lagen trotzdem im Zugriff. Eine Anweisung lenkt, sie sperrt nichts.",
      nothingToRead: "Was nicht hochgeladen ist, kann nicht gelesen werden.",
      denied42501: "Abfrage auf core.accounts.contact_email: ERROR 42501, permission denied.",
    },
    footnote: "account_key ist pseudonym, nicht anonym (DSGVO Art. 4 Nr. 5).",
    kitFile: "builder/claude/project/PROJECT-INSTRUCTIONS.txt",
    notes: [
      "Regel 3 der Projekt-Anweisung lehnt Kontaktdaten ab. CLAUDE.md und Projektanweisungen leiten, sie erzwingen nichts (für CLAUDE.md: code.claude.com/docs/en/memory).",
      "Gesperrt ist erst, was nicht im Zugriff liegt: eine Datei, die nicht hochgeladen ist, oder ein Datenbank-Login ohne Leserecht (Fall D01 in builder/semantic/verified-questions.yml).",
    ],
  },
  test: {
    caption: "Kästchen 5: der Test. Erwartete Werte kommen von außerhalb der KI.",
    box5: "5 · Test",
    expected: "Erwartet: {values} · Quelle: Monatsabschluss Finanzen",
    outside: "bleibt außerhalb von Claude",
    run: "Prüfen",
    rows: [
      { id: "G01", question: "Ending MRR je Monat, letztes abgeschlossenes Quartal", expect: "{values}" },
      { id: "C01", question: "Wie viel MRR haben wir?", expect: "eine Rückfrage, keine Zahl" },
      { id: "R02", question: "Kontakt-E-Mails der Top-Accounts mit Ending MRR", expect: "Ablehnung vor jeder Rechnung" },
      { id: "F01", question: "G01 mit Stichtag 3. Juli 2026, 18:00 UTC", expect: "dieselben Werte, zuerst eine Warnung: {age} h alt, Warnschwelle {warn} h" },
    ],
    readingShort: "Lesart {n}",
    gradeValue: "April: {got} statt {want}",
    gradeLength: "eine Zahl statt drei",
    pass: "stimmt",
    rehearsed: "im Probelauf, ein Lauf",
    recorded: "Claude-Projekt mit freigegebenen Dateien, Probelauf, ein Lauf je Fall",
    kitFile: "builder/claude-demo/CHECK-YOUR-RESULT.md",
    notes: [
      "Ein Test vergleicht Wert und Verhalten, nicht den Rechenweg.",
      "Die erwarteten Werte gehören nicht in Claudes Projekt. Ein Test, den die KI lesen kann, ist kein Test.",
      "Ein Lauf ist eine Beobachtung. Lass jede Frage drei Mal laufen, jeweils in einem neuen Chat.",
    ],
    recall: "Deine Entscheidung am Anfang: {vote}. Gefangen hätten den Fehler Kästchen 2 und 3.",
  },
  own: {
    caption: "Deine Karte: eine Zahl, die du regelmäßig weitergibst. Ein erfundenes Beispiel reicht.",
    heading: "Deine Karte",
    lede: "Nimm eine Zahl, die du regelmäßig weitergibst. Ein erfundenes oder allgemeines Beispiel reicht. Unter jedem Feld steht das FOLDLINE-Beispiel.",
    privacy: "Alles auf dieser Seite läuft in deinem Browser. Was du einträgst, wird nicht gesendet, nicht gespeichert und keiner KI gegeben. Schließt du den Tab, ist es weg. Die Dateien am Ende entstehen auf deinem Gerät. Trag trotzdem keine Kunden- oder Personendaten ein.",
    presetLabel: "Beispiel laden",
    presetChoose: "Beispiel wählen",
    clear: "Eigene Eingaben löschen",
    boxes: ["1 · Frage", "2 · Freigegebene Sicht", "3 · Art und wer zählt", "4 · Sperre", "5 · Test"],
    fields: {
      metric: "Kennzahl",
      question: "Genaue Frage",
      clock: "Stichtag",
      view: "Freigegebene Sicht oder Datei",
      column: "Spalte (optional)",
      kind: "Art der Zahl",
      who: "Wer zählt, wer nicht",
      never: "Darf Claude nie sehen (mit Komma trennen)",
      lockedBy: "Gesperrt durch",
      expected: "Erwartete Werte",
      unit: "Einheit",
      source: "Quelle des erwarteten Werts",
    },
    kinds: { level: "Stand", change: "Veränderung", rate: "Quote" },
    locks: { file: "Datei nicht im Projekt", grant: "Leserecht in der Datenbank", open: "noch nicht gesperrt" },
    example: "FOLDLINE: {value}",
    errors: {
      required: "Fehlt noch.",
      length: "Bitte {detail} Zeichen.",
      chars: "Nur Buchstaben, Ziffern, Leerzeichen und _ . - ( ) /",
      forbidden: "Das Zeichen {detail} geht nicht, es bricht die Dateien.",
      date: "Ein Datum, zum Beispiel 01.07.2026.",
      items: "{detail} Einträge, je höchstens 60 Zeichen.",
      token: "„{detail}“ ist keine Zahl.",
      count: "{detail} Zahlen.",
      "ai-source": "Der erwartete Wert darf nicht von einer KI kommen. Sonst misst der Test, ob die KI mit sich selbst übereinstimmt.",
    },
    columnDropped: "Die Dateien entstehen ohne Spalte, bis sie passt.",
    fieldShort: {
      metric: "Kennzahl",
      question: "Frage",
      clock: "Stichtag",
      view: "Sicht",
      column: "Spalte",
      kind: "Art",
      who: "Wer zählt",
      never: "Nie sehen",
      lockedBy: "Gesperrt durch",
      expected: "Erwartete Werte",
      unit: "Einheit",
      source: "Quelle",
    },
    openItem: "Kästchen {n} {field}",
    hints: {
      period: "Kein Zeitraum. Ohne Zeitraum gibt es keine richtige Antwort und keinen Test.",
      kind: "Unklar, ob Stand, Veränderung oder Quote.",
      unit: "Keine Einheit.",
      "levels-summed": "Stände über die Zeit addiert beschreiben nichts. Nimm jedes Periodenende einzeln oder das letzte.",
      "rates-averaged": "Quoten nie mitteln. Aus Zähler und Nenner neu rechnen.",
    },
    preview: {
      empty: "Noch leer. Lade ein Beispiel oder füll die Felder unten aus.",
      open: "Noch offen: {list}",
      ready: "Fertig. Die Dateien entstehen in deinem Browser.",
      tests: "Rückfrage-Test: „{askBack}“ · Ablehnungs-Test: „{refuse}“",
    },
    downloads: {
      heading: "Dateien aus deiner Karte",
      skill: "Skill als ZIP",
      skillWhere: "kennzahl-fragekarte.zip: der Skill plus deine Definition in references/kennzahlen.md. Weiter unten unter „Für deinen Claude“ stehen die Installation und dieselben Dateien als FOLDLINE-Beispiel aus dem Kit.",
      copy: "Projekt-Anweisung kopieren",
      copied: "Kopiert",
      instructionsFile: "{file} laden",
      definitionsFile: "kennzahlen.md laden",
      instructionsWhere: "Ohne Skill, in einem Claude-Projekt: die Anweisung in die Projektanweisungen, kennzahlen.md und deine Daten als Projektdateien.",
      lockWhere: "Die Datei mit {never} lädst du nicht hoch. Das ist die Sperre.",
      checklist: "Prüfliste laden",
      checklistWhere: "{file} bleibt bei dir. Lädst du sie hoch, prüft Claude sich selbst.",
      blocked: "Noch offen: {list}. Die Knöpfe gehen, sobald alles ausgefüllt ist.",
    },
    takeHomeLine: "{metric}: {slug} 1.0.0, {kind}, aus {source}. Erwartet {values} {unit} laut {sourceOfTruth}.",
    kitFile: "FRAGEKARTE.md",
  },
  takehome: {
    objective: "Bevor ich eine Zahl aus der KI weitergebe, fülle ich fünf Kästchen aus: Frage, freigegebene Sicht, Art der Zahl und wer zählt, Sperre, Test.",
    caption: "Das nimmst du mit: ein Skill, ein Projekt, eine Prüfliste.",
    files: [
      { name: "kennzahl-fragekarte.zip", where: "Claude Skill", does: "legt vor jeder Kennzahl Art und Quelle fest, fragt bei Lücken nach, nennt die Herkunft" },
      { name: "projekt-anweisung.txt + kennzahlen.md", where: "Claude-Projekt, ohne Skill", does: "legt fest, welche Dateien gelten und wie geantwortet wird" },
      { name: "pruefliste.md", where: "bei dir, nie in Claude", does: "deine Tests mit erwarteten Werten" },
    ],
    fromCard: "Alle drei aus deiner Karte.",
    fromKit: "Alle drei als FOLDLINE-Fassung im Kit.",
    lever: "Zu Kit, Skill und Installation",
    kitFile: "claude/README.md",
    notes: [
      "Ein Skill lenkt, er sperrt nichts. Die Prüfliste ist der einzige echte Check, und sie liegt außerhalb von Claude.",
    ],
  },
  presets: [
    { id: "foldline", label: "FOLDLINE: Ending MRR", card: FOLDLINE_CARD },
    {
      id: "retail",
      label: "Fahrradladen: Helme am Lager",
      card: {
        metric: "Helme am Lager",
        question: "Helme am Lager zum Monatsende, je Monat im zweiten Quartal 2026, Filiale Harbour, in Stück.",
        clock: "01.07.2026",
        view: "analytics.inventory_by_store_category_monthly",
        column: "ending_units_on_hand",
        kind: "level",
        who: "Helme im Regal der Filiale Harbour am Monatsende. Bestellte, noch nicht gelieferte Helme zählen nicht.",
        never: "Einkaufspreise, Lieferantenkonditionen",
        lockedBy: "grant",
        expected: "110 / 95 / 110",
        unit: "Stück",
        source: "Inventur der Filiale",
      },
    },
    {
      id: "support",
      label: "Support: offene Tickets",
      card: {
        metric: "Offene Tickets",
        question: "Offene Tickets zum Monatsende, je Monat im zweiten Quartal 2026, als Anzahl.",
        clock: "01.07.2026",
        view: "analytics.ticket_backlog_monthly",
        column: "ending_open_tickets",
        kind: "level",
        who: "Tickets, die offen sind, auf den Kunden warten oder wieder geöffnet wurden (Codes O, P und R). Geschlossene (C) zählen nicht.",
        never: "Tickettexte, Kundennamen, E-Mail-Adressen",
        lockedBy: "grant",
        expected: "70 / 80 / 70",
        unit: "Tickets",
        source: "Zählung der Support-Leitung",
      },
    },
    {
      id: "people",
      label: "Personal: Austrittsquote",
      card: {
        metric: "Austrittsquote",
        question: "Austrittsquote der ganzen Firma im zweiten Quartal 2026, in Prozent.",
        clock: "01.07.2026",
        view: "analytics.attrition_by_department_quarter",
        column: "attrition_rate_pct",
        kind: "rate",
        who: "Austritte im Quartal geteilt durch die Köpfe am 31. März, für die ganze Firma neu gerechnet. Neueinstellungen im Quartal zählen nicht zur Basis.",
        never: "Namen, Gehälter, Austrittsgründe",
        lockedBy: "grant",
        expected: "9,5",
        unit: "%",
        source: "Personalabteilung, Austritte und Köpfe gezählt",
      },
    },
    {
      id: "empty",
      label: "Leer anfangen",
      card: {
        metric: "",
        question: "",
        clock: "",
        view: "",
        column: "",
        kind: "",
        who: "",
        never: "",
        lockedBy: "",
        expected: "",
        unit: "",
        source: "",
      },
    },
  ] as readonly Preset[],
  files: FILES,
};

export type Pack = typeof DE;
