import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The words of "Die Fehlerliste" / "The Error List", both languages. Server
 * only: index.tsx picks one pack and passes it to the client demo, so the
 * browser bundle carries a single language. A pack is plain data.
 *
 * No number is written here: every number on screen is computed from the
 * kit CSV (check.ts) and filled into a `{slot}` (format.ts `fill`). The only
 * digits are in `product` (the article's name) and in the blank rule
 * template, which is the kit file itself (content/vorlagen, byte-identical
 * to the one in the zip).
 */
export interface DemoPack {
  readonly locale: Locale;
  readonly product: string;
  readonly stageLabel: string;
  readonly dataLine: string;
  /** The kit files a stage reads, on one line under its cards: "aus {files}". */
  readonly filesLine: string;
  readonly replay: string;
  readonly files: {
    readonly export: string;
    readonly csv: string;
    readonly costs: string;
    readonly rule: string;
    readonly template: string;
    readonly exercise: string;
    readonly solutions: string;
    readonly skill: string;
  };
  readonly chart: {
    readonly label: string;
    readonly actual: string;
    readonly forecast: string;
    readonly rule: string;
    readonly soldOut: string;
    readonly noForecast: string;
    readonly planWeek: string;
    readonly baseline: string;
  };
  readonly ruleNames: Readonly<Record<"wie letzte Woche" | "wie Vorjahreswoche" | "Schnitt 4 Wochen", string>>;
  readonly guess: {
    readonly caption: string;
    readonly accuracyLabel: string;
    readonly chip: string;
    readonly chipsLabel: string;
    readonly skip: string;
    /** Under the two cards: what the percentages are and where the formula is. */
    readonly formulaLine: string;
  };
  readonly messlatte: {
    readonly captionShift: string;
    readonly captionEnd: string;
    readonly toolCard: string;
    readonly ruleCard: string;
    readonly guessLine: string;
    readonly noGuessLine: string;
    readonly tally: string;
    readonly unit: string;
    readonly pin: string;
    readonly notes: readonly string[];
    /** Shown when another simple rule comes closer than "same as last week". */
    readonly betterNote: string;
    readonly skipped: Readonly<Record<"ist" | "ausverkauft" | "prognose" | "messlatte", string>>;
  };
  readonly spanne: {
    readonly captionTip: string;
    readonly captionEnd: string;
    readonly tips: Readonly<Record<"more" | "about" | "fewer", string>>;
    readonly tipsLabel: string;
    readonly skipTip: string;
    readonly tipLine: string;
    readonly noTipLine: string;
    readonly counter: string;
    readonly promised: string;
    readonly errorsLabel: string;
    readonly pin: string;
    readonly notes: readonly string[];
    readonly hitsOf: string;
  };
  readonly planzahl: {
    readonly caption: string;
    readonly captionSame: string;
    readonly planLabel: string;
    readonly forecastLabel: string;
    readonly jarsLabel: string;
    readonly short: string;
    readonly left: string;
    readonly ledgerTitle: string;
    readonly ledger: Readonly<Record<"Messlatte" | "Prognose" | "Planzahl", string>>;
    readonly withCanteen: string;
    readonly withoutCanteen: string;
    readonly presetsLabel: string;
    readonly costShort: string;
    readonly costLeft: string;
    readonly costsHeading: string;
    readonly noCosts: string;
    readonly notNumber: string;
    readonly even: string;
    readonly notes: readonly string[];
  };
  readonly regel: {
    readonly caption: string;
    readonly lamps: Readonly<Record<"daten" | "messlatte" | "bias" | "spanne", string>>;
    readonly lampValues: Readonly<Record<"daten" | "messlatte" | "bias" | "spanne", string>>;
    readonly lampState: Readonly<Record<"green" | "red" | "none", string>>;
    readonly weekHead: string;
    readonly free: string;
    readonly person: string;
    readonly noLamps: string;
    readonly stripLabel: string;
    readonly stripValue: string;
    /** Short lamp names for the run lines: "Bias und Spanne rot". */
    readonly lampsShort: Readonly<Record<"daten" | "messlatte" | "bias" | "spanne", string>>;
    readonly and: string;
    readonly weeks: { readonly one: string; readonly many: string };
    readonly lampCount: { readonly one: string; readonly many: string };
    readonly runLine: string;
    readonly singleLine: string;
    readonly extraLine: string;
    readonly gap: Readonly<Record<"prognose" | "ist", string>>;
    readonly legend: Readonly<Record<"free" | "person" | "none", string>>;
    readonly lagLine: string;
    readonly planLineFree: string;
    readonly planLineRed: string;
    readonly owner: string;
    readonly ownerPlaceholder: string;
    readonly download: string;
    readonly chance: string;
  };
  readonly own: {
    readonly caption: string;
    readonly heading: string;
    readonly kitTry: string;
    readonly kitTryNote: string;
    readonly exampleLabel: string;
    readonly privacy: string;
    readonly paste: string;
    readonly pastePlaceholder: string;
    readonly check: string;
    readonly file: string;
    readonly excel: string;
    readonly templateLink: string;
    readonly series: string;
    readonly seriesFallback: string;
    readonly baseline: string;
    readonly clear: string;
    readonly empty: string;
    readonly ignored: string;
    readonly notices: Readonly<Record<"duplicate" | "gap", string>>;
    readonly zeros: string;
    readonly errors: Readonly<Record<"empty" | "tooBig" | "tooManyRows" | "header" | "date" | "number" | "negative" | "conflict" | "daily" | "tooFew" | "fileType" | "zeroSales", string>>;
    readonly summary: string;
    readonly noForecast: string;
    readonly needMore: string;
    readonly betterRule: string;
    readonly checks: readonly string[];
    readonly lineBaseline: string;
    readonly lineBaselineWorse: string;
    readonly lineRange: string;
    readonly linePlan: string;
    readonly linePlanMissing: string;
    readonly lineRule: string;
    readonly downloadRule: string;
    readonly downloadCsv: string;
    readonly csvWords: { readonly yes: string; readonly no: string; readonly allGreen: string };
  };
  readonly takeHome: {
    readonly caption: string;
    readonly lever: string;
    readonly treeLabel: string;
    readonly tree: readonly { readonly file: string; readonly beat: string }[];
    readonly line: string;
    readonly lineRed: string;
    readonly lineNoOwner: string;
  };
  readonly ruleFile: {
    readonly name: string;
    readonly system: string;
    readonly longestRed: { readonly one: string; readonly many: string };
    readonly lampSummary: string;
    readonly template: string;
  };
}

function vorlage(file: string): string {
  return readFileSync(path.join(process.cwd(), "content/vorlagen", file), "utf8");
}

const DE: DemoPack = {
  locale: "de",
  product: "Linsensuppe 500 ml",
  stageLabel: "Die Fehlerliste: Wochenabsatz und Prognose der Linsensuppe",
  dataLine: "Erfunden: Suppenwerk Feldmark, {product}, {weeks} Wochen",
  filesLine: "aus {files}",
  replay: "Nochmal abspielen",
  files: {
    export: "tool-export.txt",
    csv: "linsensuppe-woechentlich.csv",
    costs: "kosten.md",
    rule: "pruefregel.md",
    template: "meine-daten.csv",
    exercise: "uebung.md",
    solutions: "loesungen.md",
    skill: "prognose-pruefen.zip",
  },
  chart: {
    label: "Wochenabsatz {from} bis {to}, Balken je Woche",
    actual: "Ist",
    forecast: "Prognose",
    rule: "wie letzte Woche",
    soldOut: "ausverkauft",
    noForecast: "keine Prognose",
    planWeek: "Planwoche",
    baseline: "Achse ab {value}",
  },
  ruleNames: {
    "wie letzte Woche": "wie letzte Woche",
    "wie Vorjahreswoche": "wie Vorjahreswoche",
    "Schnitt 4 Wochen": "Schnitt 4 Wochen",
  },
  guess: {
    caption: "Ohne Tool plant Feldmark den Absatz der Vorwoche. Wie genau ist das?",
    accuracyLabel: "Prognosegenauigkeit {year}",
    chip: "um {value} %",
    chipsLabel: "Deine Schätzung für „wie letzte Woche“",
    skip: "Ohne Schätzung weiter",
    formulaLine: "Genauigkeit {year}, beide mit der Formel aus {file}",
  },
  messlatte: {
    captionShift: "„Wie letzte Woche“ kommt auf {accuracy}. Ohne Modell, ohne Tool.",
    captionEnd: "{lead} kleinere Fehler. Näher dran in {closer} von {weeks} Wochen.",
    toolCard: "Tool",
    ruleCard: "wie letzte Woche",
    guessLine: "Deine Schätzung: um {guess} %. Gerechnet: {accuracy}.",
    noGuessLine: "Ohne Schätzung. Gerechnet: {accuracy}.",
    tally: "Ø Fehler",
    unit: "Gläser",
    pin: "{date}: „{note}“. „Wie letzte Woche“ liegt {rule} daneben, die Prognose {forecast}.",
    notes: [
      "Die gestrichelte Linie „wie letzte Woche“ ist der Absatz, um eine Woche verschoben. Die {tool} des Tools liegen {points} Prozentpunkte darüber.",
      "Die Fehlerliste: je Woche Ist minus Prognose, nur Wochen, die die Prognose nicht kannte. Ø Fehler Prognose {mae} Gläser, „wie letzte Woche“ {maeRule} Gläser.",
      "{points} Prozentpunkte sind hier {lead} kleinere Fehler. Nicht bewertet: {skipped}. Eine einzelne Woche beweist nichts.",
    ],
    betterNote: "„{best}“ läge näher ({bestMae} statt {maeRule}). Gegen diese Regel sind die Fehler {leadBest} kleiner, nicht {lead}.",
    skipped: {
      ist: "{date} (Ist fehlt)",
      ausverkauft: "{date} (ausverkauft)",
      prognose: "{date} (keine Prognose gespeichert)",
      messlatte: "{date} (Vorwoche fehlt)",
    },
  },
  spanne: {
    captionTip: "Die {share}-Spanne sollte {promised} der {weeks} Wochen fassen. Schätze: Wie viele waren es?",
    captionEnd: "{hits} von {weeks} in der Spanne. Bei einer ehrlichen Spanne wären es um {promised}.",
    tips: { more: "mehr als {promised}", about: "etwa {promised}", fewer: "weniger als {promised}" },
    tipsLabel: "Deine Schätzung: Wochen in der Spanne",
    skipTip: "Ohne Schätzung zeigen",
    tipLine: "Deine Schätzung: {tip}. Gezählt: {hits}.",
    noTipLine: "Ohne Schätzung. Gezählt: {hits}.",
    counter: "in der Spanne",
    promised: "Soll {promised}",
    errorsLabel: "Die {count} Fehler davor, sortiert: 10-%- und 90-%-Wert",
    pin: "{date}: „{note}“",
    notes: [
      "Je Woche: die Fehler (Ist minus Prognose) der {window} gültigen Wochen davor, ihr 10-%- und 90-%-Wert zur Prognose addiert. Gefüllt: Ist in der Spanne. Rot umrandet: daneben.",
      "Vor dem {date}: {before}. Ab dem {date}: {after}. {missesAfter} der {misses} Fehltreffer liegen ab dem {date}.",
      "Auch eine ehrliche Spanne liegt durch Zufall in {chance} der Jahre bei {hits} oder weniger. Dass die Fehltreffer nach einem Datum gehäuft liegen, zeigt die Ursache.",
    ],
    hitsOf: "{hits} von {weeks}",
  },
  planzahl: {
    caption: "Plane {plan}, nicht {forecast}: Ein fehlendes Glas kostet {cu}, ein übriges {co}.",
    captionSame: "Planzahl {plan}: bei diesen Kosten die Prognose selbst.",
    planLabel: "Planzahl {date}",
    forecastLabel: "Prognose {forecast}",
    jarsLabel: "Die letzten {count} Fehler, sortiert",
    short: "hätte nicht gereicht",
    left: "übrig",
    ledgerTitle: "Kosten der Fehler {year}",
    ledger: { Messlatte: "wie letzte Woche", Prognose: "Prognose", Planzahl: "Prognose + Puffer" },
    withCanteen: "Mit Kantine, Rest {rest}",
    withoutCanteen: "Ohne Kantine, Rest {rest}",
    presetsLabel: "Kosten eines übrigen Glases aus kosten.md",
    costShort: "Fehlt ein Glas (€)",
    costLeft: "Bleibt eins übrig (€)",
    costsHeading: "Eigene Kosten je Stück",
    noCosts: "Ohne Kosten keine Planzahl.",
    notNumber: "„{value}“ ist keine Zahl. Zum Beispiel: 1,50",
    even: "genau gereicht",
    notes: [
      "Anteil, den du abdecken willst: {cu} ÷ ({cu} + {co}) = {tau}. Die Planzahl ist die Prognose plus der Fehler an dieser Stelle der sortierten Liste.",
      "In {short} der letzten {of} Wochen hätte {plan} nicht gereicht, in {left} wäre etwas übrig geblieben.",
      "Kosten der Fehler {year}, rückwirkend auf denselben Wochen: „wie letzte Woche“ {costRule}, Prognose {costForecast}, Prognose + Puffer {costPlan}.",
    ],
  },
  regel: {
    caption: "{free} Wochen frei, {red} Wochen entscheidet eine Person.",
    lamps: {
      daten: "Daten vollständig",
      messlatte: "Fehler kleiner als die Messlatte",
      bias: "Bias höchstens {max}",
      spanne: "mindestens {min} von {of} in der Spanne",
    },
    lampValues: {
      daten: "Ist und Prognose da",
      messlatte: "Verhältnis {ratio}",
      bias: "Bias {bias}",
      spanne: "{hits} von {of}",
    },
    lampState: { green: "grün", red: "rot", none: "offen" },
    weekHead: "Woche ab {date}",
    free: "frei",
    person: "Person entscheidet",
    noLamps: "noch keine Lampen",
    stripLabel: "Woche im Streifen wählen",
    stripValue: "{date}: {state}",
    lampsShort: { daten: "Daten", messlatte: "Messlatte", bias: "Bias", spanne: "Spanne" },
    and: "und",
    weeks: { one: "1 Woche", many: "{count} Wochen" },
    lampCount: { one: "1 Lampe", many: "{count} Lampen" },
    runLine: "{from} bis {to}: {lamps} rot ({weeks}).",
    singleLine: "{from}: {lamps} rot.",
    extraLine: "{dates} zusätzlich {lamps}.",
    gap: { prognose: "{from}: keine Prognose gespeichert.", ist: "{from}: Ist der Vorwoche fehlt." },
    legend: { free: "frei", person: "Person entscheidet", none: "keine Lampen" },
    lagLine: "{date}: {note}. {lag} später ist die erste Lampe rot. Rot bleibt es {length}.",
    planLineFree: "Woche ab {date}: alle vier Lampen grün. Planzahl {plan} frei.",
    planLineRed: "Woche ab {date}: {lamps} rot. Eine Person entscheidet.",
    owner: "Wer entscheidet in roten Wochen (Rolle oder Name)",
    ownerPlaceholder: "zum Beispiel Leitung Disposition",
    download: "Prüfregel laden",
    chance: "Auch eine ehrliche Spanne fällt in {chance} der {window}-Wochen-Fenster zufällig unter {min}. Ein einzelnes Rot ist ein Anlass nachzusehen, kein Beweis.",
  },
  own: {
    caption: "Dieselben vier Prüfungen mit deiner eigenen Reihe.",
    heading: "Deine Datei",
    kitTry: "Mit der Kit-Datei ausprobieren",
    kitTryNote: "Füllt {file} und die Kosten aus {costs} ein. Danach ersetzt du sie durch deine Reihe.",
    exampleLabel: "So sieht sie aus, die letzten Wochen aus {file}:",
    privacy: "Deine Zahlen bleiben in diesem Browser-Tab. Kein Upload, kein Server, keine KI. Schließt du den Tab, sind sie weg.",
    paste: "Aus Excel oder Sheets kopieren und hier einfügen",
    pastePlaceholder: "woche;ist;prognose;hinweis",
    check: "Prüfen",
    file: "CSV-Datei wählen",
    excel: "Excel: Spalten markieren, kopieren, hier einfügen. Erste Zeile: Spaltennamen.",
    templateLink: "Leere Vorlage im Kit: {file}",
    series: "Reihe (für Prüfregel und Dateinamen)",
    seriesFallback: "meine-reihe",
    baseline: "Was plant ihr ohne Tool",
    clear: "Eigene Eingaben löschen",
    empty: "Noch keine Datei. Mindestens {min} Wochen Ist und die damals gespeicherte Prognose.",
    ignored: "Ignoriert: {columns}",
    notices: {
      duplicate: "{date} steht doppelt mit gleichen Werten, einmal gezählt.",
      gap: "{date} fehlt in der Datei, bleibt leer und zählt nicht.",
    },
    zeros: "Viele Nullwochen. Prozentwerte sagen hier wenig; schau auf den mittleren Fehler in Stück.",
    errors: {
      empty: "Die Eingabe ist leer. Erste Zeile zum Beispiel: woche;ist;prognose",
      tooBig: "Die Datei ist größer als 1 MB. Bitte nur die Spalten woche, ist, prognose, hinweis.",
      tooManyRows: "{rows} Zeilen. Mehr als {max} Wochen braucht die Prüfung nicht; die letzten zwei Jahre reichen.",
      header: "Ich finde keine Spalten für Woche und Ist. Erste Zeile zum Beispiel: woche;ist;prognose",
      date: "Zeile {line}: „{value}“ ist kein Datum. Erlaubt: 2025-10-27, 27.10.2025, KW 44/2025.",
      number: "Zeile {line}, Spalte {column}: „{value}“ ist keine Zahl.",
      negative: "Zeile {line}, Spalte {column}: {value} ist negativ. Retouren vorher abziehen.",
      conflict: "{date} steht in Zeile {first} und {line} mit verschiedenen Werten. Eine Zeile löschen.",
      daily: "Tageswerte bitte vorher zu Wochen (Montag bis Sonntag) summieren.",
      tooFew: "Nur {weeks} vergleichbare Wochen. Die Prüfung braucht mindestens {min}.",
      fileType: "Bitte eine CSV- oder Textdatei. Excel: Spalten markieren, kopieren, hier einfügen.",
      zeroSales: "Kein Absatz im Prüffenster. Bias nicht berechenbar.",
    },
    summary: "Geprüft: {from} bis {to}, {weeks} Wochen.",
    noForecast:
      "Ohne gespeicherte alte Prognosen gibt es keine Prüfung 1. Eine heute nachgerechnete Prognose für vergangene Wochen kennt das Ergebnis schon. Leg ab dieser Woche jede Prognose mit Datum ab; nach {min} Wochen laufen die Lampen. Bis dahin ist deine Messlatte: „{rule}“, mittlerer Fehler {mae}. Ein Tool muss darunter bleiben.",
    needMore: "Spanne und Lampen brauchen {min} geprüfte Wochen mit gespeicherter Prognose, hier sind es {weeks}.",
    betterRule: "„{best}“ liegt näher ({bestMae} statt {chosenMae}). Plant ihr ohne Tool so, nimm sie als Messlatte.",
    checks: ["Prüfung 1: Messlatte", "Prüfung 2: Spanne", "Prüfung 3: Planzahl", "Prüfung 4: Regel"],
    lineBaseline: "Ø Fehler Prognose {mae}, „{rule}“ {maeRule}: {lead} kleiner. Näher dran in {closer} von {weeks} Wochen. Bias {bias}.",
    lineBaselineWorse: "Ø Fehler Prognose {mae}, „{rule}“ {maeRule}: Die Prognose liegt {lead} weiter daneben als die einfache Regel. Bias {bias}.",
    lineRange: "{hits} von {weeks} Wochen in der 80-%-Spanne, Soll {promised}.",
    linePlan: "Woche ab {date}: Prognose {forecast}, Spanne {p10} bis {p90}, Anteil {tau}, Planzahl {plan}.",
    linePlanMissing: "Für eine Planzahl braucht es die Prognose der nächsten Woche und beide Kosten.",
    lineRule: "{free} von {total} Wochen frei, {red} mit einer roten Lampe.",
    downloadRule: "Prüfregel laden",
    downloadCsv: "Ergebnis als CSV",
    csvWords: { yes: "ja", no: "nein", allGreen: "alle grün" },
  },
  takeHome: {
    caption: "Das Kit ist die Demo: dieselben Dateien, dieselben Zahlen.",
    lever: "Zum Mitnehmen",
    treeLabel: "Die Dateien des Kits und wo sie oben vorkamen",
    tree: [
      { file: "START-HIER.md", beat: "Reihenfolge" },
      { file: "daten/tool-export.txt", beat: "Schätzen" },
      { file: "daten/linsensuppe-woechentlich.csv", beat: "alle vier" },
      { file: "daten/kosten.md", beat: "Planzahl" },
      { file: "uebung.md", beat: "Messlatte bis Regel" },
      { file: "loesungen.md", beat: "die Zahlen oben" },
      { file: "pruefregel.md", beat: "Regel" },
      { file: "vorlage/meine-daten.csv", beat: "Meine Daten" },
      { file: "claude/prognose-pruefen/SKILL.md", beat: "alle vier, im Chat" },
      { file: "pruefen.py", beat: "alle vier, ohne Chat" },
    ],
    line: "{series}: Prognose {forecast}, Planzahl {plan}, alle vier Lampen grün. In roten Wochen entscheidet {owner}.",
    lineRed: "{series}: Prognose {forecast}, {lamps} rot. Es entscheidet {owner}.",
    lineNoOwner: "noch offen",
  },
  ruleFile: {
    name: "pruefregel-{series}.md",
    system: "Warenwirtschaft, Prognosemodul",
    longestRed: {
      one: "Bei dieser Reihe war die längste rote Strecke 1 Woche lang.",
      many: "Bei dieser Reihe war die längste rote Strecke {count} Wochen lang.",
    },
    lampSummary: "{green} grün, {red} rot",
    template: "",
  },
};

const EN: DemoPack = {
  locale: "en",
  product: "lentil soup 500 ml",
  stageLabel: "The error list: weekly sales and forecast of the lentil soup",
  dataLine: "Invented: Suppenwerk Feldmark, {product}, {weeks} weeks",
  filesLine: "from {files}",
  replay: "Play again",
  files: {
    export: "tool-export.txt",
    csv: "lentil-soup-weekly.csv",
    costs: "costs.md",
    rule: "release-rule.md",
    template: "my-data.csv",
    exercise: "exercise.md",
    solutions: "solutions.md",
    skill: "prognose-pruefen.zip",
  },
  chart: {
    label: "Weekly sales {from} to {to}, one bar per week",
    actual: "actual",
    forecast: "forecast",
    rule: "same as last week",
    soldOut: "sold out",
    noForecast: "no forecast",
    planWeek: "plan week",
    baseline: "axis from {value}",
  },
  ruleNames: {
    "wie letzte Woche": "same as last week",
    "wie Vorjahreswoche": "same week last year",
    "Schnitt 4 Wochen": "average of 4 weeks",
  },
  guess: {
    caption: "Without a tool, Feldmark plans last week's sales. How accurate is that?",
    accuracyLabel: "Forecast accuracy {year}",
    chip: "about {value} %",
    chipsLabel: "Your guess for \"same as last week\"",
    skip: "Continue without a guess",
    formulaLine: "Accuracy {year}, both by the formula in {file}",
  },
  messlatte: {
    captionShift: "\"Same as last week\" reaches {accuracy}. No model, no tool.",
    captionEnd: "{lead} smaller errors. Closer in {closer} of {weeks} weeks.",
    toolCard: "Tool",
    ruleCard: "same as last week",
    guessLine: "Your guess: about {guess} %. Computed: {accuracy}.",
    noGuessLine: "No guess. Computed: {accuracy}.",
    tally: "mean error",
    unit: "jars",
    pin: "{date}: \"{note}\". \"Same as last week\" misses by {rule}, the forecast by {forecast}.",
    notes: [
      "The dashed \"same as last week\" line is the sales line moved one week to the right. The tool's {tool} sits {points} percentage points above it.",
      "The error list: actual minus forecast for every week, only weeks the forecast did not know. Mean error forecast {mae} jars, \"same as last week\" {maeRule} jars.",
      "Here {points} percentage points mean {lead} smaller errors. Not scored: {skipped}. A single week proves nothing.",
    ],
    betterNote: "\"{best}\" would come closer ({bestMae} instead of {maeRule}). Against that rule the errors are {leadBest} smaller, not {lead}.",
    skipped: {
      ist: "{date} (no actual)",
      ausverkauft: "{date} (sold out)",
      prognose: "{date} (no forecast stored)",
      messlatte: "{date} (week before missing)",
    },
  },
  spanne: {
    captionTip: "The {share} range should hold {promised} of the {weeks} weeks. Guess: how many did it?",
    captionEnd: "{hits} of {weeks} inside the range. An honest range would hold about {promised}.",
    tips: { more: "more than {promised}", about: "about {promised}", fewer: "fewer than {promised}" },
    tipsLabel: "Your guess: weeks inside the range",
    skipTip: "Show without a guess",
    tipLine: "Your guess: {tip}. Counted: {hits}.",
    noTipLine: "No guess. Counted: {hits}.",
    counter: "inside the range",
    promised: "target {promised}",
    errorsLabel: "The {count} errors before, sorted: 10 % and 90 % values",
    pin: "{date}: \"{note}\"",
    notes: [
      "For each week: the errors (actual minus forecast) of the {window} valid weeks before it, their 10 % and 90 % values added to the forecast. Filled: actual inside the range. Red outline: outside.",
      "Before {date}: {before}. From {date}: {after}. {missesAfter} of the {misses} misses fall from {date} on.",
      "Even an honest range lands at {hits} or fewer by chance in {chance} of years. That the misses cluster after one date points to the cause.",
    ],
    hitsOf: "{hits} of {weeks}",
  },
  planzahl: {
    caption: "Plan {plan}, not {forecast}: a missing jar costs {cu}, a leftover one {co}.",
    captionSame: "Planning number {plan}: at these costs, the forecast itself.",
    planLabel: "Planning number {date}",
    forecastLabel: "Forecast {forecast}",
    jarsLabel: "The last {count} errors, sorted",
    short: "would not have been enough",
    left: "left over",
    ledgerTitle: "Cost of the errors {year}",
    ledger: { Messlatte: "same as last week", Prognose: "forecast", Planzahl: "forecast + buffer" },
    withCanteen: "With canteen, leftover {rest}",
    withoutCanteen: "Without canteen, leftover {rest}",
    presetsLabel: "Cost of a leftover jar from costs.md",
    costShort: "A missing jar (€)",
    costLeft: "A leftover jar (€)",
    costsHeading: "Your own costs per unit",
    noCosts: "No costs, no planning number.",
    notNumber: "\"{value}\" is not a number. For example: 1.50",
    even: "exactly enough",
    notes: [
      "The share you want to cover: {cu} ÷ ({cu} + {co}) = {tau}. The planning number is the forecast plus the error at that point of the sorted list.",
      "In {short} of the last {of} weeks {plan} would not have been enough, in {left} something would have been left over.",
      "Cost of the errors in {year}, looking back over the same weeks: \"same as last week\" {costRule}, forecast {costForecast}, forecast + buffer {costPlan}.",
    ],
  },
  regel: {
    caption: "{free} weeks free, in {red} weeks a person decides.",
    lamps: {
      daten: "Data complete",
      messlatte: "Errors smaller than the baseline",
      bias: "Bias at most {max}",
      spanne: "at least {min} of {of} inside the range",
    },
    lampValues: {
      daten: "actual and forecast present",
      messlatte: "ratio {ratio}",
      bias: "bias {bias}",
      spanne: "{hits} of {of}",
    },
    lampState: { green: "green", red: "red", none: "open" },
    weekHead: "Week from {date}",
    free: "free",
    person: "a person decides",
    noLamps: "no lamps yet",
    stripLabel: "Pick a week in the strip",
    stripValue: "{date}: {state}",
    lampsShort: { daten: "data", messlatte: "baseline", bias: "bias", spanne: "range" },
    and: "and",
    weeks: { one: "1 week", many: "{count} weeks" },
    lampCount: { one: "1 lamp", many: "{count} lamps" },
    runLine: "{from} to {to}: {lamps} red ({weeks}).",
    singleLine: "{from}: {lamps} red.",
    extraLine: "{dates} also {lamps}.",
    gap: { prognose: "{from}: no forecast stored.", ist: "{from}: last week's actual is missing." },
    legend: { free: "free", person: "a person decides", none: "no lamps" },
    lagLine: "{date}: {note}. {lag} later the first lamp is red. It stays red for {length}.",
    planLineFree: "Week from {date}: all four lamps green. Planning number {plan} free.",
    planLineRed: "Week from {date}: {lamps} red. A person decides.",
    owner: "Who decides in red weeks (role or name)",
    ownerPlaceholder: "for example head of planning",
    download: "Download the release rule",
    chance: "Even an honest range falls below {min} by chance in {chance} of {window}-week windows. A single red is a reason to look, not a proof.",
  },
  own: {
    caption: "The same four checks on your own series.",
    heading: "Your file",
    kitTry: "Try it with the kit file",
    kitTryNote: "Fills in {file} and the costs from {costs}. Then replace it with your series.",
    exampleLabel: "This is what it looks like, the last weeks of {file}:",
    privacy: "Your numbers stay in this browser tab. No upload, no server, no AI. Close the tab and they are gone.",
    paste: "Copy from Excel or Sheets and paste here",
    pastePlaceholder: "week;actual;forecast;note",
    check: "Check",
    file: "Choose a CSV file",
    excel: "Excel: select the columns, copy, paste here. First row: column names.",
    templateLink: "Blank template in the kit: {file}",
    series: "Series (for the rule and file names)",
    seriesFallback: "my-series",
    baseline: "What do you plan without a tool",
    clear: "Clear my input",
    empty: "No file yet. At least {min} weeks of actuals and the forecast stored at the time.",
    ignored: "Ignored: {columns}",
    notices: {
      duplicate: "{date} appears twice with the same values, counted once.",
      gap: "{date} is missing from the file, stays empty and does not count.",
    },
    zeros: "Many zero weeks. Percentages say little here; look at the mean error in units.",
    errors: {
      empty: "The input is empty. First row for example: week;actual;forecast",
      tooBig: "The file is larger than 1 MB. Please only the columns week, actual, forecast, note.",
      tooManyRows: "{rows} rows. The check needs no more than {max} weeks; the last two years are enough.",
      header: "I find no columns for week and actual. First row for example: week;actual;forecast",
      date: "Row {line}: \"{value}\" is not a date. Allowed: 2025-10-27, 27.10.2025, KW 44/2025.",
      number: "Row {line}, column {column}: \"{value}\" is not a number.",
      negative: "Row {line}, column {column}: {value} is negative. Subtract returns first.",
      conflict: "{date} is in row {first} and row {line} with different values. Delete one row.",
      daily: "Please sum daily values to weeks (Monday to Sunday) first.",
      tooFew: "Only {weeks} comparable weeks. The check needs at least {min}.",
      fileType: "Please a CSV or text file. Excel: select the columns, copy, paste here.",
      zeroSales: "No sales in the check window. Bias cannot be computed.",
    },
    summary: "Checked: {from} to {to}, {weeks} weeks.",
    noForecast:
      "Without stored past forecasts there is no check 1. A forecast recomputed today for past weeks already knows the result. From this week on, store every forecast with its date; after {min} weeks the lamps run. Until then your baseline is \"{rule}\", mean error {mae}. A tool has to stay below it.",
    needMore: "Range and lamps need {min} checked weeks with a stored forecast; this file has {weeks}.",
    betterRule: "\"{best}\" comes closer ({bestMae} instead of {chosenMae}). If that is how you plan without a tool, use it as the baseline.",
    checks: ["Check 1: baseline", "Check 2: range", "Check 3: planning number", "Check 4: rule"],
    lineBaseline: "Mean error forecast {mae}, \"{rule}\" {maeRule}: {lead} smaller. Closer in {closer} of {weeks} weeks. Bias {bias}.",
    lineBaselineWorse: "Mean error forecast {mae}, \"{rule}\" {maeRule}: the forecast misses by {lead} more than the simple rule. Bias {bias}.",
    lineRange: "{hits} of {weeks} weeks inside the 80 % range, target {promised}.",
    linePlan: "Week from {date}: forecast {forecast}, range {p10} to {p90}, share {tau}, planning number {plan}.",
    linePlanMissing: "A planning number needs next week's forecast and both costs.",
    lineRule: "{free} of {total} weeks free, {red} with a red lamp.",
    downloadRule: "Download the release rule",
    downloadCsv: "Result as CSV",
    csvWords: { yes: "yes", no: "no", allGreen: "all green" },
  },
  takeHome: {
    caption: "The kit is the demo: the same files, the same numbers.",
    lever: "To take home",
    treeLabel: "The kit's files and where they appeared above",
    tree: [
      { file: "START-HERE.md", beat: "order" },
      { file: "data/tool-export.txt", beat: "Guess" },
      { file: "data/lentil-soup-weekly.csv", beat: "all four" },
      { file: "data/costs.md", beat: "Plan number" },
      { file: "exercise.md", beat: "Baseline to Rule" },
      { file: "solutions.md", beat: "the numbers above" },
      { file: "release-rule.md", beat: "Rule" },
      { file: "template/my-data.csv", beat: "My data" },
      { file: "claude/prognose-pruefen/SKILL.md", beat: "all four, in chat" },
      { file: "pruefen.py", beat: "all four, without chat" },
    ],
    line: "{series}: forecast {forecast}, planning number {plan}, all four lamps green. In red weeks {owner} decides.",
    lineRed: "{series}: forecast {forecast}, {lamps} red. {owner} decides.",
    lineNoOwner: "still open",
  },
  ruleFile: {
    name: "release-rule-{series}.md",
    system: "ERP, forecasting module",
    longestRed: {
      one: "For this series the longest red stretch lasted 1 week.",
      many: "For this series the longest red stretch lasted {count} weeks.",
    },
    lampSummary: "{green} green, {red} red",
    template: "",
  },
};

export const COPY: Readonly<Record<Locale, DemoPack>> = {
  de: { ...DE, ruleFile: { ...DE.ruleFile, template: vorlage("pruefregel.md") } },
  en: { ...EN, ruleFile: { ...EN.ruleFile, template: vorlage("en/release-rule.md") } },
};
