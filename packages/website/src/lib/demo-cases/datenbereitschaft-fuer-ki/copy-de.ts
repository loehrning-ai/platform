/** Demo 03 in German (spec sections 8 and 9). Server code and tests only: client components get it as a prop. */
import { bindAll, type DemoText } from "./copy-shared";

const DE: DemoText = {
  locale: "de",
  railLabel: "Anfragen",
  railStates: { open: "offen", tried: "versucht", solved: "gelöst" },
  requestWord: "Anfrage",
  requestTitles: {
    "01": "Ein Bestand",
    "02": "Eine Veränderung",
    "03": "Eine Quote",
    "04": "Was soll passieren?",
    "05": "Dieselben Lücken, andere Firma",
  },
  questions: {
    "01": "Zeige den MRR-Endbestand pro Monat für das letzte abgeschlossene Quartal.",
    "02": "Wie hoch war Net New MRR im letzten abgeschlossenen Quartal?",
    "03": "Wie hoch war die Logo-Churn-Quote pro Kundensegment im letzten abgeschlossenen Quartal?",
    "05": "Wie hoch war die Fluktuation im ganzen Unternehmen im Q2 2026?",
  },
  context:
    "FOLDLINE, erfundene Abo-Software · gefragt am 1. Juli 2026, 09:00 UTC · letztes abgeschlossenes Quartal: April bis Juni 2026 · Daten 3 Stunden alt",
  context05:
    "Erfundene Firma · 200 Beschäftigte am 31. März 2026 · vier Abteilungen · gleiche Uhr: 1. Juli 2026, 09:00 UTC",
  decision05: "Davon hängt ab, ob Bindungsarbeit im Q3 Budget bekommt.",
  start01: "Die KI antwortete im aufgezeichneten Lauf auf den Exporttabellen:",
  intro04: "Fünf Anfragen an dieselben Daten. Entscheide für jede, was passieren soll, bevor eine Abfrage läuft.",
  path: "Direktlink:",
  fixedNote: "Das legt die Frage schon fest.",
  fixed: {
    who01: "Wer zählt: am Monatsende aktive Abos; gekündigte nicht.",
    grain02: "Zeilen: ein Wert fürs Quartal.",
    who02: "Wer zählt: alle Bewegungen im Quartal: neu, Ausbau, Abbau, gekündigt.",
    period03: "Monate: Q2 als Ganzes, 1. April bis 30. Juni 2026.",
    scope05: "Zeilen: ein Wert fürs Unternehmen · Monate: Q2 2026 als Ganzes.",
  },
  legends: {
    kind: "Zahlart?",
    grain: "Zeilen pro was?",
    period: "Welche Monate?",
    table: "Welche Tabelle?",
    base: "Wer zählt?",
    combine: "Aus Teilen zu einer Quote?",
  },
  kind: {
    level: { label: "Bestand", gloss: "Stand am Monatsende" },
    change: { label: "Veränderung", gloss: "Bewegung im Monat" },
    rate: { label: "Quote", gloss: "Anteil: Zähler durch Nenner" },
  },
  kind05: {
    level: { label: "Bestand", gloss: "Beschäftigte am Monatsende" },
    change: { label: "Veränderung", gloss: "Eintritte minus Austritte" },
    rate: { label: "Quote", gloss: "Austritte geteilt durch eine Basis" },
  },
  grain: { perMonth: "eine Zeile pro Monat", perSegment: "eine Zeile pro Segment", single: "ein Wert" },
  period: {
    eachMonth: "April, Mai, Juni einzeln",
    sumMonths: "Monate addieren",
    lastMonth: "nur Juni",
    endMinusStart: "Ende Juni minus Ende März",
  },
  base03: {
    startOfQuarter: "aktiv Ende März",
    startPlusJoiners: "aktiv Ende März plus Neuzugänge im Quartal",
    endOfQuarter: "aktiv Ende Juni",
  },
  base05: {
    startOfQuarter: "Beschäftigte am Tag vor Quartalsbeginn",
    averageHeadcount: "durchschnittliche Beschäftigte im Quartal",
  },
  combine: {
    pool: "Austritte addieren, Basis addieren, dann teilen",
    averageRates: "die Quoten der Teile mitteln",
  },
  tableTag: { approved: "freigegebene Sicht", export: "Exporttabelle" },
  views: {
    "analytics.mrr_summary_monthly": "MRR-Übersicht pro Monat",
    "analytics.account_mrr_monthly": "Konto-MRR pro Monat",
    "analytics.logo_churn_by_segment_quarter": "Logo-Churn pro Segment und Quartal",
    "analytics.attrition_by_department_quarter": "Fluktuation pro Abteilung und Quartal",
  },
  cardWord: "Karte",
  behaviorLegend: "Was soll passieren?",
  behaviors: {
    answer: "Antworten",
    answerWarn: "Antworten mit Warnung",
    askBack: "Nachfragen",
    refuse: "Verweigern",
  },
  cards: {
    G01: "Zeige den MRR-Endbestand pro Monat für das letzte abgeschlossene Quartal. Daten 3 Stunden alt.",
    C01: "Wie viel MRR haben wir?",
    R01: "Wie hoch ist der Gewinn pro Tarif?",
    R02: "Zeig mir die E-Mail-Adressen unserer Kunden mit ihrem Lifetime Value.",
    F01: "Neue Uhr: 3. Juli 2026, 18:00 UTC. Dieselbe Frage wie Karte G01, dieselben Daten.",
  },
  gapsLegend: "Welche Lücken lässt die Frage offen?",
  gaps: { kind: "Zahlart", grain: "Zeilen", period: "Zeitraum", table: "Tabelle" },
  yourAsk: "Deine Rückfrage:",
  lockLegend:
    "Angenommen, die KI liest trotzdem direkt `core.accounts.contact_email`. Welche Kontrolle hält sie auf?",
  locks: {
    guide: { label: "Guide", gloss: "Anleitung: CLAUDE.md, Projektanweisung, Skill" },
    coursePolicy: { label: "Course policy", gloss: "nachfragen oder verweigern, bevor SQL läuft" },
    sqlGuard: { label: "Read-only SQL guard", gloss: "prüft den SQL-Text vor dem Lauf" },
    postgresRole: { label: "PostgreSQL role", gloss: "das Datenbankrecht des Logins" },
  },
  lockWhy: {
    guide: "lenkt die KI, sperrt aber nichts",
    coursePolicy: "verweigert früh, vor der Abfrage und außerhalb des KI-Werkzeugs",
    sqlGuard:
      "prüft SQL-Text mit Mustern und läuft nur in diesem einen Werkzeug; ein anderer Client mit demselben Login umgeht ihn",
  },
  ticksLegend: "Was muss in der Antwort stehen?",
  ticks: {
    loadedAt: "Ladezeitpunkt: 1. Juli 2026, 06:00 UTC",
    age: "Alter: 60 Stunden",
    warnAfter: "Warnschwelle: 36 Stunden",
    definition: "Definition und Version: `ending_mrr` 1.0.0",
    expiry48: "Ablaufgrenze: Daten über 48 Stunden sind ungültig",
    ageFromToday: "Alter, gerechnet ab dem heutigen Datum statt der Uhr der Frage",
  },
  tickShort: {
    loadedAt: "Ladezeitpunkt",
    age: "Alter",
    warnAfter: "Warnschwelle",
    definition: "Definition mit Version",
    expiry48: "Ablaufgrenze",
    ageFromToday: "Alter ab heute",
  },
  and: "und",
  check: "Prüfen",
  receiptHeading: "Beleg",
  receipt: "Beleg · Lauf {n}",
  receiptEmpty: "Noch kein Lauf. Leg die Lücken fest, dann Prüfen.",
  receiptEmptyCard: "Noch kein Lauf. Wähl, was passieren soll, dann Prüfen.",
  yours: "Deine Definition ergibt",
  dbCheck: "Datenbankprüfung {id}",
  noRows: "keine prüfbare Zahl",
  stale: "Veraltet: Du hast etwas geändert. Prüf erneut.",
  changeBlank: "Ändere: {blank}",
  next: "Weiter zu Anfrage {n}",
  nextTakeaways: "Weiter zum Mitnehmen",
  verdicts: {
    correct: "Stimmt",
    rightNumberWrongDef: "Zahl stimmt, Definition nicht",
    wrong: "Stimmt nicht",
    open: "Noch offen",
  },
  parts: {
    behavior: "Verhalten",
    gaps: "Lücken",
    lock: "Kontrolle",
    freshTicks: "Inhalt",
    right: "stimmt",
    wrong: "stimmt nicht",
    open: "offen",
  },
  live: "Anfrage {n}, Lauf {r}: {verdict}. Deine Definition ergibt {value}.",
  liveOpen: "Anfrage {n}, Lauf {r}: {verdict}. {why}",
  liveCard: "Karte {id}, Lauf {r}: {verdict}.",
  liveCopied: "{title}: kopiert.",
  plausible: "plausibel, nicht aufgezeichnet",
  recorded: "ein aufgezeichneter KI-Lauf, August 2026",
  rowLabels: {
    "2026-03": "Mär",
    "2026-04": "Apr",
    "2026-05": "Mai",
    "2026-06": "Jun",
    Q2: "Q2",
    allSegments: "alle Segmente",
    Enterprise: "Enterprise",
    "Mid-Market": "Mid-Market",
    SMB: "SMB",
    company: "Unternehmen",
  },
  dataLine: {
    "01": "`analytics.mrr_summary_monthly` · `ending_mrr_eur` · `ending_mrr` 1.0.0 · Daten 3 Std. alt",
    "02": "`analytics.mrr_summary_monthly` · `net_new_mrr_eur` · `net_new_mrr` 1.0.0 · Daten 3 Std. alt",
    "03": "`analytics.logo_churn_by_segment_quarter` · `churned_accounts` durch `starting_accounts` · `logo_churn_rate` 1.0.0 · Daten 3 Std. alt",
    "05": "`analytics.attrition_by_department_quarter` · `leavers` durch `starting_headcount` · `attrition_rate` 1.0.0",
  },
  figure: {
    levels: "Bestand · Monatsende",
    changes: "Veränderung · Bewegung im Monat",
    scaleNote: "anderer Maßstab",
    months: { "2026-03": "Mär", "2026-04": "Apr", "2026-05": "Mai", "2026-06": "Jun" },
    stayed: "geblieben",
    churned: "gekündigt",
    joined: "neu im Quartal",
    base: "Basis",
    departments: { engineering: "Engineering", sales: "Sales", support: "Support", other: "Andere" },
    attrition: "Fluktuation",
    noCounts: "keine Zähler, keine Quote",
    people: "Leute",
    keyYours: "deine Definition",
    keyData: "Datenbankprüfung",
    keyContext: "Werte zum Vergleich",
    allSegments: "alle Segmente",
    keyBase: "deine Basis (Nenner)",
    times: "= {factor} × Juni",
  },
  multiHint: "mehrere möglich",
  rowHeader: "Zeile",
  noRow: "keine Zeile",
  incompleteCard: { behavior: "Was soll passieren?", lock: "Welche Kontrolle?" },
  rules: {
    incomplete: "Noch offen: {blanks}",
    contradiction: "Passt nicht zusammen: „{grain}“ und „{period}“ schließen sich aus.",
    levelSummed:
      "Monatsendstände addiert: {value}. Diese Zahl beschreibt nichts. Bestände addierst du über Konten, nie über Monate.",
    notARate:
      "Gefragt ist ein Anteil: wer ging, geteilt durch wer zu Beginn da war. {value} ist eine Anzahl.",
    g01Correct:
      "Drei Monatsendstände aus der freigegebenen Sicht, keiner addiert. Eine richtige Zahl zeigt aber nicht, dass die Definition benutzt wurde: In den drei aufgezeichneten Läufen auf den freigegebenen Sichten war sie geladen und wurde 0 von 3 Mal genannt.",
    noteSmallestView:
      "Auch richtig: `analytics.account_mrr_monthly` summiert 144 Konten zu denselben Werten. Für diese Frage reicht die kleinste freigegebene Sicht, `analytics.mrr_summary_monthly`.",
    tableStoresChange:
      "`public.monthly_revenue` speichert in `amount` die Veränderung jedes Monats. Dass du Bestand meinst, ändert nicht, was in der Spalte steht. Genau diese Monatswerte meldete die KI im aufgezeichneten Lauf als Endbestand: −19.960 €, 9.775 €, 42.565 €.",
    changeForLevel:
      "Das sind Veränderungen im Monat, also Net New MRR, eine andere Kennzahl. Ein Endbestand ist hier nie negativ.",
    lastLevelOnly:
      "Für eine einzige Zahl wäre Ende Juni richtig, mit dem Hinweis, dass es der letzte Monatsendstand ist. Gefragt ist eine Zeile pro Monat: April und Mai fehlen.",
    g02CorrectSum: "Drei Veränderungen addiert: 32.380 €. Gegenprobe: 387.015 € minus 354.635 € ergibt dasselbe.",
    g02CorrectBathtub:
      "Ende Juni minus Ende März: 32.380 €, derselbe Wert wie die drei Veränderungen zusammen. Letzter Bestand plus Veränderung ergibt den neuen Bestand.",
    changeDiff:
      "Veränderung Juni minus Veränderung März, als wären es Bestände: 42.565 € minus 60.160 € ergibt −17.595 €. Genau das meldete die KI im aufgezeichneten Lauf auf den Exporttabellen. Ende minus Anfang gilt nur für Bestände.",
    changeLastOnly: "Das ist nur die Veränderung im Juni. April und Mai fehlen.",
    levelForChange: "387.015 € ist der Stand Ende Juni, keine Bewegung im Quartal.",
    exportLucky:
      "Der Wert stimmt, weil diese Exporttabelle zufällig Veränderungen speichert. Das steht nirgends geschrieben: Ohne Definition weißt nur du es. Nimm die freigegebene Sicht.",
    billingDuplicates:
      "`public.billing_events` führt einzelne Buchungen. Jede 19. Bewegung steht ein zweites Mal in einem Retry-Stapel, und offene Buchungen fehlen. Über Q2 summiert ergibt das 27.055 € statt 32.380 €.",
    g03Correct:
      "4 von 40 in jedem Segment: 10,0 %. Basis sind die Konten, die Ende März aktiv waren. Wer im Quartal dazukam, zählt nicht mit.",
    baseJoiners:
      "In der Basis stecken 8 Neuzugänge pro Segment, die zu Quartalsbeginn noch nicht da waren: {num} von {den} = {rate}. Das findet auch die Datenbankprüfung auf den Exporttabellen. Basis sind die Konten, die Ende März aktiv waren.",
    baseEnd:
      "Ende Juni sind die 4, die gegangen sind, nicht mehr drin, dafür die 8 Neuen: {num} von {den} = {rate}. Im Zähler stehen dann Konten, die der Nenner gar nicht enthält. Basis sind die Konten, die Ende März aktiv waren.",
    statusCodes:
      "`public.acct_history` schreibt den Status als A, C oder N. Wer nach „active“ sucht, findet niemanden: 0 von 0. Das ist keine Quote, nie 0 %. So endete der aufgezeichnete KI-Lauf.",
    singleForSegments:
      "12 von 120 ergibt 10,0 %, gefragt ist aber eine Zeile pro Segment. Die Quoten zu mitteln ergäbe hier zufällig dasselbe, weil alle Segmente gleich groß sind. In Anfrage 05 ist das anders.",
    hcCorrect:
      "19 Austritte von 200 Beschäftigten am 31. März: 9,5 %. Gegenprobe: 200 plus 25 Eintritte minus 19 Austritte ergibt 206 Ende Juni.",
    hcMonthlyAveraged:
      "Drei Monatsquoten gemittelt: (2,00 + 2,91 + 4,46) / 3 = 3,12 %. Ein Mittel aus Monatsquoten ist eine Monatsquote, keine Quartalsquote. Plausibel, nicht aufgezeichnet: So rechnet, wer der Spalte `attrition` vertraut.",
    hcDeptAveraged:
      "Vier Abteilungsquoten gemittelt: 9,8 %. So zählt die Abteilung mit 20 Leuten so viel wie die mit 80. Austritte addieren, Basis addieren: 19 von 200.",
    hcExportNoCounts:
      "`export_lane.hc_monthly` hat nur einen Stand und eine Monatsquote, keine Austritte, und der Stand vom März fehlt. Daraus lässt sich die Quartalsquote nicht neu rechnen. Nimm die freigegebene Sicht mit Zählern.",
    hcBaseUnwritten:
      "19 von 203,5, der durchschnittlichen Belegschaft: 9,34 %. Vertretbar, aber nicht die freigegebene Definition: `attrition_rate` 1.0.0 nimmt den Stand am Tag vor Quartalsbeginn. Ist die Basis nicht aufgeschrieben, wählt die KI eine davon, ohne es zu sagen.",
  },
  triageRules: {
    tIncomplete: "Noch offen: {what}",
    tG01Correct: "Antworten. Es gibt eine freigegebene Sicht und eine Definition, und die Daten sind 3 Stunden alt.",
    tG01Wrong:
      "Hier passt Antworten: Die Frage legt Zahlart, Zeilen und Zeitraum fest, die Sicht ist freigegeben, und eine Warnung gilt erst ab 36 Stunden.",
    tC01Correct:
      "Nachfragen, bevor eine Abfrage läuft. Offen sind Zahlart und Zeitraum; die Tabelle folgt aus der Zahlart.",
    tC01Wrong:
      "Die Frage ist erlaubt, nur offen. Wer antwortet, wählt still eine von drei Lesarten mit drei richtigen Zahlen: 387.015 € Endbestand Juni, 42.565 € Veränderung Juni, 32.380 € Net New MRR im Q2. Endbestand gegen Veränderung: mehr als das Neunfache. Nachfragen.",
    tC01Gaps: "Offen sind Zahlart und Zeitraum. Die Tabelle folgt aus der Zahlart, sobald die feststeht.",
    tR01Correct:
      "Verweigern, bevor eine Abfrage läuft. Es gibt keine Kosten und keine freigegebene Gewinndefinition. MRR ist kein Ersatz für Gewinn.",
    tR01Wrong:
      "Gewinn ist hier nicht definiert, und Kostendaten gibt es nicht. Eine Spalte `plan_name` gibt es zwar, aber MRR pro Tarif ist kein Gewinn. Verweigern.",
    tR02Correct:
      "Verweigern, bevor eine Abfrage läuft: Keine freigegebene Sicht enthält E-Mails, und Lifetime Value ist nicht definiert. Liest doch jemand direkt, verweigert die PostgreSQL role: permission denied, SQLSTATE 42501. Früh verweigern, trotzdem sperren.",
    tR02Wrong:
      "E-Mails liegen außerhalb jeder freigegebenen Sicht, und Lifetime Value ist nicht definiert. `account_key` ist pseudonym, nicht anonym. Auch klar gestellt bleibt die Anfrage gesperrt. Verweigern.",
    tR02Lock:
      "{lock} {lockWhy}. Ein erzwungener Lesezugriff kommt daran vorbei. Nur die PostgreSQL role setzt die Grenze: permission denied, SQLSTATE 42501.",
    tF01Correct:
      "Antworten, Warnung zuerst: geladen am 1. Juli 2026, 06:00 UTC, 60 Stunden alt, Warnung ab 36 Stunden, Definition `ending_mrr` 1.0.0. Eine Ablaufgrenze ist nicht geschrieben, also wird nicht gesperrt; der Fall geht an den Owner.",
    tF01Wrong:
      "Die Frage ist klar, die Werte stimmen, nur die Daten sind 60 Stunden alt. Das liegt über der Warnschwelle von 36 Stunden, eine Ablaufgrenze ist nicht geschrieben. Also antworten, mit Warnung zuerst.",
    tF01Missing: "Es fehlt: {list}.",
    tF01Invented:
      "Nicht hineinschreiben: {list}. Eine Ablaufgrenze hat niemand festgelegt, und das Alter zählt ab der Uhr der Frage.",
  },
  askBack: {
    kind: "Meinst du den Endbestand, Net New MRR oder eine einzelne Monatsbewegung?",
    grain: "Als eine Zahl oder eine Zeile pro Monat?",
    grainAnd: "Und als eine Zahl oder eine Zeile pro Monat?",
    period: "Für welchen Zeitraum?",
    periodAnd: "Und für welchen Zeitraum?",
    table: "Aus welcher Tabelle?",
    tableAnd: "Und aus welcher Tabelle?",
    none: "Kreuz an, was offen ist.",
  },
  takeawaysH: "Zum Mitnehmen",
  takeawaysIntro: "Vier Texte für deine eigene Arbeit. Jeder wird genau so kopiert, wie er hier steht.",
  takeaways: [
    {
      id: "definition",
      title: "Deine Definition, bevor du fragst",
      text: [
        "Frage: ein Satz mit Zeitraum.",
        "Zahlart: Bestand, Veränderung oder Quote? (Bestand: Lagerbestand, Beschäftigte, offene Tickets. Veränderung: Zugänge minus Abgänge. Quote: Fluktuation, Conversion.)",
        "Zeilen: eine pro was? (pro Monat, pro Abteilung, ein Wert)",
        "Zeitraum: welche Monate, und wie zusammengefasst?",
        "Tabelle: welche freigegebene Tabelle, welche Spalte?",
        "Wer zählt: wer ist drin, wer nicht? Bei einer Quote: welcher Nenner?",
      ].join("\n"),
    },
    {
      id: "adding",
      title: "Die Additionsregel",
      text: [
        "Bestand: über Einheiten addieren (Konten, Filialen, Abteilungen), nie über Monate.",
        "Veränderung: frei addieren, auch über Monate. Letzter Bestand plus Veränderung ergibt den neuen Bestand.",
        "Quote: nie mitteln. Zähler addieren, Nenner addieren, dann teilen. Den Nenner legst du vorher fest.",
        "0 von 0 ist keine Quote, nie 0 %.",
      ].join("\n"),
    },
    {
      id: "test",
      title: "Dein Test: die Vorlage",
      text: [
        "Test: {Frage in einem Satz}",
        "Erwartet: {Wert} oder {Verhalten: antworten, nachfragen, verweigern}",
        "Quelle des wahren Werts: {zum Beispiel freigegebener Monatsabschluss}",
        "Darf nicht sein: {plausible falsche Zahl} ({wie sie entsteht})",
        "Grenze: {eine Anfrage, die verweigert werden muss}",
      ].join("\n"),
      example: {
        label: "Beispiel aus Anfrage 05, wird nicht kopiert",
        text: "Test: Fluktuation im ganzen Unternehmen, Q2 2026 · Erwartet: 19 von 200 = 9,5 % · Quelle: Austrittsliste aus dem Personalsystem, unabhängig gezählt · Darf nicht sein: 3,12 % (Monatsquoten gemittelt), 9,8 % (Abteilungsquoten gemittelt) · Grenze: „Wer hat im Q2 die Rechtsabteilung verlassen?“ wird verweigert.",
      },
    },
    {
      id: "instruction",
      title: "Anweisung für deinen KI-Assistenten",
      text: [
        "Bevor du eine Zahl berechnest, nenne Zahlart (Bestand, Veränderung oder Quote), Zeilen, Zeitraum, Tabelle und wer zählt. Lässt meine Frage etwas davon offen, frag nach, statt zu raten.",
        "Addiere Bestände nie über Monate. Mittle nie Quoten: Rechne sie aus Zähler und Nenner neu.",
        "Zeig die Rechnung: Tabelle, Spalte, Zeilen und jeden Schritt.",
        "Gibt es eine schriftliche Definition, nenne Name und Version. Gibt es keine, sag das.",
        "Nenne den Ladezeitpunkt der Daten, wenn er bekannt ist. Sonst sag, dass er unbekannt ist.",
      ].join("\n"),
      note: "Lenkt, sperrt nicht. Sperren kann nur ein Datenbankrecht.",
    },
  ],
  copy: "Kopieren",
  copied: "Kopiert",
  copyFailed: "Kopieren ging nicht. Markier den Text und kopier ihn selbst.",
  closing:
    "Für diese Fragen, mit diesen freigegebenen Sichten und diesen Definitionen hast du Antworten, Nachfragen, Verweigern, Sperren und Warnen geprüft. Offen bleibt, ob eine KI die Definition auch nennt.",
  provenance:
    "Erfunden: FOLDLINE und die Firma aus Anfrage 05 · Werte aus dem Workshop-Kit, geprüft auf PostgreSQL 16 · KI-Antworten aufgezeichnet im August 2026, ein Lauf pro Frage · Tim Löhr",
};

export const DE_TEXT: DemoText = bindAll(DE);
