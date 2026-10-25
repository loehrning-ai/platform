import type { Locale } from "./i18n/locale";
import type { WorkshopKit } from "./workshop-kit";

/**
 * The kit block of workshop 01 (the page /workshops/ki-prognosen-einschaetzen/kit).
 * The zip is built by scripts/workshop01/build-kit.mjs from scripts/workshop01/kit/;
 * every number below is printed in loesungen.md / solutions.md of that kit and
 * recomputed by the demo's check (workshops-forecasting.test.ts holds them together).
 * The German page offers the German edition prognose-pruefen.zip, the English page
 * forecast-check.zip; both have the same tree and the same numbers, each with its
 * own file names.
 */
export const FORECASTING_KIT: Readonly<Record<Locale, WorkshopKit>> = {
  de: {
    fileName: "prognose-pruefen.zip",
    title: "Prognose prüfen",
    lead: "Eine Spalte, Ist minus Prognose, beantwortet vier Fragen. Am Ende steht eine Prüfregel für jede Woche.",
    stats: [
      { value: "50", label: "Wochen" },
      { value: "4", label: "Lampen" },
      { value: "1", label: "Planzahl" },
    ],
    rulesHeading: "Die vier Lampen",
    rules: [
      "Daten vollständig: das Ist der Vorwoche und die Prognose dieser Woche sind da.",
      "Messlatte: In den letzten 13 Wochen sind die Fehler kleiner als die von „wie letzte Woche“.",
      "Bias: höchstens 5 % zu hoch oder zu niedrig.",
      "Spanne: mindestens 9 von 13 Wochen lag das Ist in der 80-%-Spanne.",
    ],
    rulesShort: [
      "Daten vollständig.",
      "Kleinere Fehler als „wie letzte Woche“.",
      "Bias höchstens 5 %.",
      "Mindestens 9 von 13 in der Spanne.",
    ],
    stepsHeading: "Vier Prüfungen an einer Fehlerliste",
    steps: [
      {
        tag: "Prüfung 1",
        title: "Messlatte",
        input: "Die 50 bewerteten Wochen 2025.",
        action: "Du vergleichst die Fehler der Prognose mit „wie letzte Woche“ auf denselben Wochen.",
        output: "Mittlerer Fehler je Verfahren und der Vorsprung.",
        line: { text: "33,3 statt 42,2 Gläser", result: "21 % kleiner" },
        note: "Die 94,2 % des Tools liegen nur 1,6 Prozentpunkte über der einfachen Regel.",
      },
      {
        tag: "Prüfung 2",
        title: "Spanne",
        input: "Die 26 Fehler vor jeder Woche.",
        action: "Du nimmst ihren 10-%- und 90-%-Wert als Spanne und zählst, wie oft das Ist darin lag.",
        output: "Treffer gegen das Versprechen von 80 %.",
        segments: [
          { tone: "ink", label: "in der Spanne", value: 36 },
          { tone: "accent", label: "daneben", value: 14 },
        ],
        note: "11 der 14 Fehltreffer liegen ab dem 07.04., der Auslistung.",
      },
      {
        tag: "Prüfung 3",
        title: "Planzahl",
        input: "daten/kosten.md: 1,50 € je fehlendes, 0,40 € je übriges Glas.",
        action: "Du nimmst den Fehler an der Stelle 1,50 ÷ 1,90 = 0,79 der sortierten Liste.",
        output: "Die Menge für die Woche ab 29.12.2025.",
        line: { text: "729 + 19", result: "748" },
        note: "Ohne Kantine kostet ein übriges Glas 1,60 €: Dann ist 729 selbst die Planzahl.",
      },
      {
        tag: "Prüfung 4",
        title: "Regel",
        input: "Die vier Lampen, jede Woche 2025.",
        action: "Du rechnest sie für alle 52 Wochen und trägst die Person für rote Wochen ein.",
        output: "pruefregel.md, ausgefüllt.",
        file: "pruefregel.md",
        segments: [
          { tone: "ink", label: "frei", value: 37 },
          { tone: "accent", label: "Person entscheidet", value: 15 },
        ],
      },
    ],
    howTo:
      "Im Browser oder mit Python 3 ohne Konto, etwa 55 Minuten. Mit dem Claude-Skill können die Dateien an Anthropic übertragen werden.",
    fictionalNote:
      "Suppenwerk Feldmark und alle Zahlen sind erfunden. Die Fehler in der Datei sind die echter Exporte.",
    contents: [
      { name: "START-HIER.md", description: "Reihenfolge, drei Wege, die Spalten." },
      { name: "daten/", description: "104 Wochen Linsensuppe, Tool-Export, Kosten." },
      { name: "uebung.md", description: "Vier Aufgaben, 30 Minuten." },
      { name: "loesungen.md", description: "Alle Zahlen zum Vergleichen." },
      { name: "pruefregel.md", description: "Die Prüfregel zum Ausfüllen." },
      { name: "vorlage/meine-daten.csv", description: "Leere Vorlage für deine Reihe." },
      { name: "pruefen.py", description: "Rechnet alles nach, nur Python 3." },
      { name: "claude/", description: "Skill und Projekt-Anweisung." },
    ],
    labels: {
      stepper: "Die vier Prüfungen des Kits",
      action: "Rechnen (Demo, Skill oder pruefen.py)",
      result: "Lösung (loesungen.md)",
    },
  },
  en: {
    fileName: "forecast-check.zip",
    title: "Forecast check",
    lead: "One column, actual minus forecast, answers four questions. At the end you have a release rule for every week.",
    stats: [
      { value: "50", label: "weeks" },
      { value: "4", label: "lamps" },
      { value: "1", label: "planning number" },
    ],
    rulesHeading: "The four lamps",
    rules: [
      "Data complete: last week's actual and this week's forecast are there.",
      "Baseline: over the last 13 weeks the errors are smaller than those of \"same as last week\".",
      "Bias: at most 5 % too high or too low.",
      "Range: in at least 9 of 13 weeks the actual landed inside the 80 % range.",
    ],
    rulesShort: [
      "Data complete.",
      "Smaller errors than \"same as last week\".",
      "Bias at most 5 %.",
      "At least 9 of 13 inside the range.",
    ],
    stepsHeading: "Four checks on one error list",
    steps: [
      {
        tag: "Check 1",
        title: "Baseline",
        input: "The 50 scored weeks of 2025.",
        action: "You compare the forecast's errors with \"same as last week\" on the same weeks.",
        output: "Mean error per method and the lead.",
        line: { text: "33.3 instead of 42.2 jars", result: "21 % smaller" },
        note: "The tool's 94.2 % sits only 1.6 percentage points above the simple rule.",
      },
      {
        tag: "Check 2",
        title: "Range",
        input: "The 26 errors before each week.",
        action: "You take their 10 % and 90 % values as the range and count how often the actual landed inside.",
        output: "Hits against the promised 80 %.",
        segments: [
          { tone: "ink", label: "inside the range", value: 36 },
          { tone: "accent", label: "outside", value: 14 },
        ],
        note: "11 of the 14 misses fall from 7 April on, the delisting.",
      },
      {
        tag: "Check 3",
        title: "Planning number",
        input: "data/costs.md: €1.50 per missing jar, €0.40 per leftover jar.",
        action: "You take the error at the point 1.50 ÷ 1.90 = 0.79 of the sorted list.",
        output: "The quantity for the week of 29 December 2025.",
        line: { text: "729 + 19", result: "748" },
        note: "Without the canteen a leftover jar costs €1.60: then 729 itself is the planning number.",
      },
      {
        tag: "Check 4",
        title: "Rule",
        input: "The four lamps, every week of 2025.",
        action: "You compute them for all 52 weeks and name the person for red weeks.",
        output: "release-rule.md, filled in.",
        file: "release-rule.md",
        segments: [
          { tone: "ink", label: "free", value: 37 },
          { tone: "accent", label: "a person decides", value: 15 },
        ],
      },
    ],
    howTo:
      "In the browser or with Python 3, no account, about 55 minutes. With the Claude skill the files may be transferred to Anthropic.",
    fictionalNote:
      "Suppenwerk Feldmark and all numbers are invented. The flaws in the file are those of real exports.",
    contents: [
      { name: "START-HERE.md", description: "Order, three ways, the columns." },
      { name: "data/", description: "104 weeks of lentil soup, tool export, costs." },
      { name: "exercise.md", description: "Four tasks, 30 minutes." },
      { name: "solutions.md", description: "Every number to compare." },
      { name: "release-rule.md", description: "The release rule to fill in." },
      { name: "template/my-data.csv", description: "Blank template for your series." },
      { name: "pruefen.py", description: "Recomputes everything, Python 3 only." },
      { name: "claude/", description: "Skill and project instructions." },
    ],
    labels: {
      stepper: "The four checks of the kit",
      action: "Compute (demo, skill or pruefen.py)",
      result: "Solution (solutions.md)",
    },
  },
};
