import type { Locale } from "@/lib/i18n/locale";

const group = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: 0,
  }).format(value);

export const CV_LIVE_COPY = {
  de: {
    title: "Eine Seite oder exit 1",
    metaTitle: "CV Engine live: Eine Seite oder exit 1",
    description:
      "Echte Seiten aus der CV Engine für eine erfundene Person: Vorlage, Dichte und Sprache wechseln, Stationen anhängen, bis der Build abbricht.",
    back: "CV Engine",
    kicker: "Live-Beispiel · echte Engine-Ausgabe",
    lead: "Mira Kessler gibt es nicht, ihre Seiten sind echte Ausgabe der CV Engine. Häng Stationen an, bis die Seite überläuft. Dann holst du sie mit der Dichte zurück, ohne ein Wort zu streichen.",
    privacy:
      "Alle Zustände sind vorab gebaut. Diese Seite schickt nichts weg, dein eigener Lebenslauf entsteht nur auf deinem Rechner.",
    controls: {
      template: "Vorlage",
      density: "Dichte",
      lang: "Sprache",
    },
    langNames: { de: "DE", en: "EN" },
    langLabels: { de: "Deutsch", en: "Englisch" },
    more: "Noch eine Station",
    stationsCount: (n: number, max: number) => `${n} von ${max}`,
    full: "Alle Stationen drin",
    restart: "Von vorn",
    sheetLabel: (template: string, density: string) =>
      `A4-Seite, Vorlage ${template}, Dichte ${density}`,
    edge: "A4-Kante",
    page2: "Seite 2",
    loading: "Lädt die Seite",
    pages: (n: number) => (n === 1 ? "1 Seite" : `${n} Seiten`),
    textEnds: (px: number, page: number, locale: Locale = "de") =>
      `Text endet bei ${group(px, locale)} von ${group(page, locale)} px`,
    overflowAt: (section: string) => `Seite 2 beginnt bei „${section}“`,
    overflowUnknown: "Seite 2 beginnt mitten im Text",
    clipped: (px: number) => `Text ragt ${px} px über die Kante`,
    noPdf: "Kein PDF. Bei exit 1 schreibt der Build keins.",
    rescued: "Dieselben Wörter, enger gesetzt: wieder eine Seite.",
    provenance: (short: string, count: number) =>
      `Jeder der ${count} Zustände ist ein echter Lauf von engine/build.py mit cv-engine ${short}. Die Höhen misst WeasyPrint.`,
    pending: (pr: number) =>
      `Der Stand stammt aus Pull Request #${pr} und ist noch nicht in main.`,
    takeHome: "Mitnehmen",
    takeHomeLead: "Alles für deinen eigenen Lebenslauf, passend zum Stand oben.",
    pdfTitle: "Das PDF zu diesem Stand",
    pdfFile: (file: string, kb: number) => `${file} · ${kb} KB · gesetzt von WeasyPrint`,
    pdfMissing:
      "Dieses PDF liegt nicht bei. Mit der cv.yaml und dem Befehl unten baust du genau diesen Stand selbst.",
    pdfButton: "PDF laden",
    yamlTitle: "cv.yaml",
    yamlDetail:
      "Genau die Datei, die die Engine für diesen Stand bekommen hat. Ersetz Miras Angaben durch deine.",
    yamlButton: "cv.yaml laden",
    cliTitle: "Der Build auf deinem Rechner",
    cliDetail:
      "Im Ordner mit deiner cv.yaml ausführen. Vorher unter macOS brew install pango, unter Debian oder Ubuntu die Pakete aus der Installationsanleitung.",
    cliLabel: "Befehl für den Build",
    promptTitle: "Für deinen Claude",
    promptDetail:
      "Häng die cv.yaml und deinen bisherigen Lebenslauf an und schick diesen Text dazu.",
    promptLabel: "Text für Claude",
    prompt:
      "Im Anhang liegen eine cv.yaml als Muster und mein bisheriger Lebenslauf. Schreib meinen Lebenslauf in genau dieses YAML-Format, mit lang: de. Erfinde nichts: Was in meinem Lebenslauf nicht steht, lässt du weg und stellst es am Ende als Frage an mich. Jeder Stichpunkt beginnt mit dem, was ich getan habe, und nennt eine Zahl, wenn mein Text eine hergibt. Gib nur die YAML-Datei aus.",
    keyHint: "Taste R: von vorn",
  },
  en: {
    title: "One page or exit 1",
    metaTitle: "CV Engine live: One page or exit 1",
    description:
      "Real pages from the CV Engine for an invented person: switch template, density and language, add jobs until the build stops.",
    back: "CV Engine",
    kicker: "Live example · real engine output",
    lead: "Mira Kessler does not exist; her pages are real CV Engine output. Add jobs until the page overflows. Then bring it back with the density, without cutting a word.",
    privacy:
      "Every state is built in advance. This page sends nothing anywhere; your own CV is only ever built on your machine.",
    controls: {
      template: "Template",
      density: "Density",
      lang: "Language",
    },
    langNames: { de: "DE", en: "EN" },
    langLabels: { de: "German", en: "English" },
    more: "One more job",
    stationsCount: (n: number, max: number) => `${n} of ${max}`,
    full: "All jobs added",
    restart: "Start over",
    sheetLabel: (template: string, density: string) =>
      `A4 page, template ${template}, density ${density}`,
    edge: "A4 edge",
    page2: "Page 2",
    loading: "Loading the page",
    pages: (n: number) => (n === 1 ? "1 page" : `${n} pages`),
    textEnds: (px: number, page: number, locale: Locale = "en") =>
      `Text ends at ${group(px, locale)} of ${group(page, locale)} px`,
    overflowAt: (section: string) => `Page 2 starts at “${section}”`,
    overflowUnknown: "Page 2 starts mid-text",
    clipped: (px: number) => `Text runs ${px} px past the edge`,
    noPdf: "No PDF. On exit 1 the build writes none.",
    rescued: "The same words, set tighter: one page again.",
    provenance: (short: string, count: number) =>
      `Each of the ${count} states is a real run of engine/build.py with cv-engine ${short}. WeasyPrint measures the heights.`,
    pending: (pr: number) =>
      `This revision comes from pull request #${pr} and is not on main yet.`,
    takeHome: "Take home",
    takeHomeLead: "Everything for your own CV, matching the state above.",
    pdfTitle: "The PDF for this state",
    pdfFile: (file: string, kb: number) => `${file} · ${kb} KB · set by WeasyPrint`,
    pdfMissing:
      "This PDF is not included. With the cv.yaml and the command below you build exactly this state yourself.",
    pdfButton: "Download PDF",
    yamlTitle: "cv.yaml",
    yamlDetail:
      "Exactly the file the engine received for this state. Replace Mira's details with yours.",
    yamlButton: "Download cv.yaml",
    cliTitle: "The build on your machine",
    cliDetail:
      "Run it in the folder with your cv.yaml. First, on macOS, brew install pango; on Debian or Ubuntu, the packages from the installation guide.",
    cliLabel: "Build command",
    promptTitle: "For your Claude",
    promptDetail: "Attach the cv.yaml and your current CV and send this text with them.",
    promptLabel: "Text for Claude",
    prompt:
      "Attached are a cv.yaml as a template and my current CV. Rewrite my CV in exactly this YAML format, with lang: en. Do not invent anything: whatever my CV does not say, leave out and ask me about at the end. Every bullet starts with what I did and states a number when my text gives one. Output only the YAML file.",
    keyHint: "Key R: start over",
  },
} as const;

export type CvLiveCopy = (typeof CV_LIVE_COPY)[Locale];
