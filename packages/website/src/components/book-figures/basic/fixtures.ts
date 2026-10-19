/**
 * PROVISIONAL FIXTURES for the book figure islands (basic/).
 *
 * Every number here is an aggregate from the first analysis run of 2026-10-18
 * and is NOT the book's final data. The final figures come from the frozen
 * aggregates of the analysis step (T4) and replace these specs one to one.
 * k = 5: a count of 1 to 4 is null and prints "weniger als 5". No row stands
 * for a single firm. Use these for previews, tests and layout only.
 */

import type { FigureSpec, FigureSpecOf } from "@/lib/figures";
import type { TickerSpec, WaffleChip, RegionSummary } from "./types";

export const PROVISIONAL = true as const;

const AS_OF = "2026-10-18";
const SCAN = "Vorläufig: Auswertung von Firmenwebsites, Scan März bis Mai 2026";
const JOBS = "Vorläufig: Stellenanzeigen mit KI-Titel, Januar bis Juni 2026";

/* ---------------------------------------------------------------- ticker */

export const TICKER_HEADLINE: TickerSpec = {
  id: "p-ticker-headline",
  title: "Anteil der Firmen, die KI auf ihrer Website schreiben",
  value: 4.0,
  fmt: { style: "percent", digits: 1 },
  tail: "der Firmen mit auffindbarer Website schreiben KI auf diese Website.",
  interval: [3.7, 4.2],
  n: 24944,
  nNote: "nach Bundesland gewichtet; ohne Firmen, die ihre Website mit anderen teilen",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Gemessen wird, ob das Wort auf der Startseite steht. Das sagt nichts darüber, ob eine Firma KI nutzt, und die Stichprobe ist nicht Deutschland, sondern Firmen mit auffindbarer Website.",
};

/* ----------------------------------------------------------------- waffle */

export const WAFFLE_SAGEN_ZEIGEN: FigureSpecOf<"waffle"> = {
  id: "p-waffle-sagen-zeigen",
  kind: "waffle",
  title: "Sagen und zeigen",
  alt: "100 Punkte stehen für 100 Firmen, die KI auf ihre Website schreiben. 21 Punkte sind gefüllt: Diese Firmen zeigen dazu etwas Konkretes. 79 Punkte sind Ringe: Diese Firmen sagen es nur.",
  caption: "Von 100 Firmen, die KI auf die Website schreiben, zeigen 21 etwas dazu.",
  n: 1112,
  nNote: "von 25.581 Firmen mit eigener Domain; 95-%-Intervall 19 bis 24 von 100",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Als Beleg zählt ein Muster im Seitentext (Chatbot, ML-Hinweis, Stelle, Regeln). Die Muster sind nicht von Hand geprüft und zum Teil selbst KI-Wörter. Gemessen wird die Startseite, nicht das ganze Unternehmen.",
  data: {
    total: 100,
    columns: 10,
    headline: "21 von 100",
    groups: [
      { id: "zeigt", label: "zeigen etwas Konkretes", dots: 21, tone: "accent" },
      { id: "sagt", label: "sagen es nur", dots: 79, tone: "ring" },
    ],
  },
};

/** Evidence types overlap, so each chip is its own share of the 100 (Mehrfachnennung). */
export const WAFFLE_CHIPS: readonly WaffleChip[] = [
  { id: "chatbot", label: "Chatbot oder Tool", dots: 13, hits: 149 },
  { id: "ml", label: "ML-Hinweis", dots: 9, hits: 97 },
  { id: "stelle", label: "KI-Stelle", dots: 5, hits: 54 },
  { id: "regeln", label: "Regeln, AI Act", dots: 1, hits: 12 },
];

/* ------------------------------------------------------------------- bars */

export const BARS_TEXTMENGE: FigureSpecOf<"bars"> = {
  id: "p-bars-textmenge",
  kind: "bars",
  title: "KI-Anteil nach Textmenge der Website",
  alt: "Fünf Balken nach Textmenge der Website, vom kürzesten zum längsten Fünftel. Der Anteil der Firmen, die KI schreiben, steigt von 0,2 über 1,0, 1,9 und 4,3 auf 11,6 Prozent.",
  caption: "Wer viel schreibt, schreibt irgendwann auch KI: Das längste Fünftel sagt es etwa 62-mal so oft wie das kürzeste.",
  n: 21404,
  nNote: "je Fünftel etwa 4.280 Firmen mit eigener Domain und Seitentext",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Eine größere Website hat mehr Platz für das Wort. Mehr Text heißt nicht mehr KI. Das Verhältnis 62 hat ein 95-%-Intervall von 35 bis 165.",
  data: {
    orientation: "horizontal",
    fmt: { style: "percent", digits: 1 },
    max: 14,
    items: [
      {"id": "q1", "label": "Kürzestes Fünftel, Median 921 Zeichen", "value": 0.2, "lo": 0.1, "hi": 0.4, "n": 4281},
      {"id": "q2", "label": "Zweites Fünftel, Median 3.206 Zeichen", "value": 1.0, "lo": 0.8, "hi": 1.4, "n": 4283},
      {"id": "q3", "label": "Mittleres Fünftel, Median 5.779 Zeichen", "value": 1.9, "lo": 1.6, "hi": 2.4, "n": 4278},
      {"id": "q4", "label": "Viertes Fünftel, Median 9.865 Zeichen", "value": 4.3, "lo": 3.7, "hi": 4.9, "n": 4281},
      {"id": "q5", "label": "Längstes Fünftel, Median 20.610 Zeichen", "value": 11.6, "lo": 10.6, "hi": 12.6, "n": 4281},
    ],
  },
};

export const BARS_VORHERSAGE: FigureSpecOf<"bars"> = {
  id: "p-bars-vorhersage",
  kind: "bars",
  title: "Was KI-Reden vorhersagt",
  alt: "Sieben Balken zeigen, wie gut jedes Merkmal vorhersagt, ob eine Website KI schreibt (AUC, 0,5 ist Münzwurf): Textmenge 0,81, Technik 0,68, Branche 0,66, Größe 0,58, Bundesland 0,57, Rechtsform 0,52, alles zusammen 0,83.",
  caption: "Die Textmenge sagt mehr voraus als Größe, Branche oder Bundesland.",
  n: 21404,
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Vorhersage ist keine Ursache. Fünffach kreuzvalidiert, dreimal wiederholt. Das Modell erklärt nur etwa 5 Prozent der Streuung (Pseudo-R²).",
  data: {
    orientation: "horizontal",
    fmt: { style: "decimal", digits: 2 },
    max: 1,
    baseline: 0.5,
    baselineLabel: "Münzwurf 0,5",
    items: [
      { id: "text", label: "Textmenge der Website", value: 0.81 },
      { id: "technik", label: "Technik der Website", value: 0.68 },
      { id: "branche", label: "Branche (abgeleitet)", value: 0.66 },
      { id: "groesse", label: "Größe (Vertretungsberechtigte)", value: 0.58 },
      { id: "land", label: "Bundesland", value: 0.57 },
      { id: "form", label: "Rechtsform", value: 0.52 },
      { id: "alles", label: "Alles zusammen", value: 0.83 },
    ],
  },
};

/* ---------------------------------------------------------------- dotplot */

export const DOTPLOT_BRANCHEN: FigureSpecOf<"dotplot"> = {
  id: "p-dotplot-branchen",
  kind: "dotplot",
  title: "KI-Anteil nach Branche",
  alt: "Punktdiagramm von 39 Branchen mit 95-%-Intervall. IT-Dienstleister liegen bei 15,9 Prozent, Unternehmensberatung bei 11,7 und Verlage bei 11,6. Viele Gewerke liegen unter 2 Prozent. Zwölf Branchen mit weniger als 5 Treffern sind schraffiert.",
  caption: "Die KI verkaufen, reden darüber. Viele Gewerke schweigen.",
  n: 16859,
  nNote: "39 Branchen mit mindestens 60 Firmen; Branche aus Stichwörtern abgeleitet",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Die Branche ist geraten (Stichwörter), nicht gemeldet. Kleine Branchen haben breite Intervalle. Zwölf Branchen mit weniger als 5 Treffern sind unterdrückt. Reden über KI ist Angebot, nicht Einsatz.",
  data: {
    fmt: { style: "percent", digits: 1 },
    sort: "value",
    min: 0,
    max: 30,
    reference: { value: 4.3, label: "alle: 4,3 %" },
    items: [
    {"id": "wz01", "label": "Landwirtschaft", "value": 2.9, "n": 173, "lo": 1.2, "hi": 6.6, "hits": 5},
    {"id": "wz10", "label": "Nahrungsmittel", "value": null, "n": 164, "hits": null},
    {"id": "wz11", "label": "Getränke", "value": 0.0, "n": 68, "lo": 0, "hi": 5.3, "hits": 0},
    {"id": "wz14", "label": "Bekleidung", "value": null, "n": 141, "hits": null},
    {"id": "wz18", "label": "Druck", "value": 2.0, "n": 357, "lo": 1.0, "hi": 4.0, "hits": 7},
    {"id": "wz20", "label": "Chemie", "value": null, "n": 119, "hits": null},
    {"id": "wz21", "label": "Pharma", "value": 4.3, "n": 184, "lo": 2.2, "hi": 8.3, "hits": 8},
    {"id": "wz22", "label": "Kunststoff", "value": null, "n": 165, "hits": null},
    {"id": "wz25", "label": "Metallerzeugnisse", "value": null, "n": 154, "hits": null},
    {"id": "wz26", "label": "Elektronik", "value": 3.7, "n": 190, "lo": 1.8, "hi": 7.4, "hits": 7},
    {"id": "wz28", "label": "Maschinenbau", "value": null, "n": 103, "hits": null},
    {"id": "wz35", "label": "Energie", "value": null, "n": 139, "hits": null},
    {"id": "wz38", "label": "Abfallwirtschaft", "value": 2.8, "n": 286, "lo": 1.4, "hi": 5.4, "hits": 8},
    {"id": "wz41", "label": "Hochbau", "value": 1.7, "n": 2419, "lo": 1.2, "hi": 2.2, "hits": 40},
    {"id": "wz42", "label": "Tiefbau", "value": null, "n": 170, "hits": null},
    {"id": "wz43", "label": "Bauinstallation", "value": 1.2, "n": 1295, "lo": 0.8, "hi": 2.0, "hits": 16},
    {"id": "wz45", "label": "Kfz-Handel", "value": null, "n": 354, "hits": null},
    {"id": "wz46", "label": "Großhandel", "value": 3.4, "n": 884, "lo": 2.4, "hi": 4.8, "hits": 30},
    {"id": "wz47", "label": "Einzelhandel", "value": 4.2, "n": 519, "lo": 2.8, "hi": 6.3, "hits": 22},
    {"id": "wz49", "label": "Landverkehr", "value": 2.7, "n": 1316, "lo": 1.9, "hi": 3.7, "hits": 35},
    {"id": "wz55", "label": "Beherbergung", "value": 3.3, "n": 547, "lo": 2.1, "hi": 5.1, "hits": 18},
    {"id": "wz56", "label": "Gastronomie", "value": 1.7, "n": 594, "lo": 0.9, "hi": 3.1, "hits": 10},
    {"id": "wz58", "label": "Verlagswesen", "value": 11.6, "n": 284, "lo": 8.4, "hi": 15.9, "hits": 33},
    {"id": "wz62", "label": "IT-Dienstleistung", "value": 15.9, "n": 88, "lo": 9.7, "hi": 25.0, "hits": 14},
    {"id": "wz64", "label": "Banken", "value": 7.2, "n": 139, "lo": 4.0, "hi": 12.7, "hits": 10},
    {"id": "wz65", "label": "Versicherungen", "value": 4.5, "n": 134, "lo": 2.1, "hi": 9.4, "hits": 6},
    {"id": "wz66", "label": "Fondsmanagement u. Ä.", "value": 6.3, "n": 711, "lo": 4.8, "hi": 8.4, "hits": 45},
    {"id": "wz68", "label": "Immobilien", "value": 3.2, "n": 2380, "lo": 2.6, "hi": 4.0, "hits": 76},
    {"id": "wz69", "label": "Rechts-/Steuerberatung", "value": 4.2, "n": 360, "lo": 2.5, "hi": 6.8, "hits": 15},
    {"id": "wz70", "label": "Unternehmensberatung/PR", "value": 11.7, "n": 205, "lo": 8.0, "hi": 16.8, "hits": 24},
    {"id": "wz71", "label": "Architektur/Ingenieure", "value": 3.1, "n": 290, "lo": 1.6, "hi": 5.8, "hits": 9},
    {"id": "wz73", "label": "Werbung/Marktforschung", "value": 9.1, "n": 231, "lo": 6.0, "hi": 13.5, "hits": 21},
    {"id": "wz80", "label": "Wach-/Sicherheitsdienste", "value": null, "n": 65, "hits": null},
    {"id": "wz81", "label": "Gebäudebetreuung", "value": null, "n": 233, "hits": null},
    {"id": "wz82", "label": "Büro-/Veranstaltungsdienste", "value": 5.6, "n": 90, "lo": 2.4, "hi": 12.4, "hits": 5},
    {"id": "wz85", "label": "Erziehung/Unterricht", "value": 3.3, "n": 243, "lo": 1.7, "hi": 6.4, "hits": 8},
    {"id": "wz86", "label": "Gesundheitswesen", "value": 4.6, "n": 720, "lo": 3.3, "hi": 6.4, "hits": 33},
    {"id": "wz87", "label": "Heime", "value": null, "n": 220, "hits": null},
    {"id": "wz93", "label": "Sport/Freizeit", "value": 5.6, "n": 125, "lo": 2.7, "hi": 11.1, "hits": 7},
    ],
  },
};

/* ---------------------------------------------------------------- tilemap */

export const TILEMAP_LAENDER: FigureSpecOf<"tilemap"> = {
  id: "p-tilemap-laender",
  kind: "tilemap",
  title: "KI-Anteil nach Bundesland",
  alt: "Kachelkarte der 16 Bundesländer, nur die Werte nach Branche, Größe und Rechtsform bereinigt. Hamburg 5,4 Prozent, Bayern 5,0, Berlin und Hessen 4,8; Sachsen 1,2 Prozent. Sachsen-Anhalt und Saarland haben weniger als 5 Treffer und sind schraffiert.",
  caption: "Die Intervalle überlappen fast überall. Nur die Ränder trennen sich klar.",
  n: 24944,
  nNote: "Firmen mit eigener Domain und Bundesland",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Quotenstichprobe: Bayern stellt 41 Prozent der Stichprobe. Bereinigt um Branche, Größe und Rechtsform, Intervalle aus 150 Wiederholungen. Sachsen-Anhalt und Saarland sind unterdrückt. Sichtbarkeit auf der Website, nicht Einsatz.",
  data: {
    fmt: { style: "percent", digits: 1 },
    max: 6,
    tiles: [
    {"id": "BW", "value": 3.6, "lo": 2.9, "hi": 4.4, "n": 2487},
    {"id": "BY", "value": 5.0, "lo": 4.5, "hi": 5.4, "n": 10168},
    {"id": "BE", "value": 4.8, "lo": 3.6, "hi": 6.0, "n": 869},
    {"id": "BB", "value": 4.5, "lo": 3.3, "hi": 6.0, "n": 736},
    {"id": "HB", "value": 3.7, "lo": 1.4, "hi": 6.6, "n": 201},
    {"id": "HH", "value": 5.4, "lo": 4.1, "hi": 6.8, "n": 831},
    {"id": "HE", "value": 4.8, "lo": 3.8, "hi": 5.9, "n": 1481},
    {"id": "MV", "value": 2.2, "lo": 0.5, "hi": 4.2, "n": 278},
    {"id": "NI", "value": 3.0, "lo": 2.1, "hi": 4.2, "n": 1133},
    {"id": "NW", "value": 3.8, "lo": 3.1, "hi": 4.5, "n": 3821},
    {"id": "RP", "value": 2.9, "lo": 1.8, "hi": 4.1, "n": 886},
    {"id": "SL", "value": null, "n": 233},
    {"id": "SN", "value": 1.2, "lo": 0.4, "hi": 2.4, "n": 547},
    {"id": "ST", "value": null, "n": 287},
    {"id": "SH", "value": 3.7, "lo": 2.1, "hi": 5.6, "n": 569},
    {"id": "TH", "value": 2.9, "lo": 1.3, "hi": 5.0, "n": 417},
    ],
  },
};

export const TILEMAP_REGIONS: readonly RegionSummary[] = [
  { id: "ost", label: "Osten (5 Länder)", value: 2.3, lo: 1.8, hi: 3.0, n: 2265 },
  { id: "west", label: "Westen (10 Länder)", value: 4.4, lo: 4.2, hi: 4.7, n: 21810 },
];

export const LAND_NAMES: Readonly<Record<string, string>> = {"BW": "Baden-Württemberg", "BY": "Bayern", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen", "HH": "Hamburg", "HE": "Hessen", "MV": "Mecklenburg-Vorpommern", "NI": "Niedersachsen", "NW": "Nordrhein-Westfalen", "RP": "Rheinland-Pfalz", "SL": "Saarland", "SN": "Sachsen", "ST": "Sachsen-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thüringen"};

/* ----------------------------------------------------------------- funnel */

export const FUNNEL_KREISE: FigureSpecOf<"funnel"> = {
  id: "p-funnel-kreise",
  kind: "funnel",
  title: "KI-Anteil der Kreise gegen Zufall",
  alt: "Trichterdiagramm: Jeder Punkt ist ein Kreis, waagerecht die Zahl der Firmen, senkrecht der KI-Anteil. Fast alle Punkte liegen im Zufallsband um 4,6 Prozent. Sechs Kreise liegen darüber, darunter München, Würzburg, Augsburg und Frankfurt am Main.",
  caption: "Die Kreiskarte ist fast Rauschen. Nur wenige Städte stehen klar über dem Zufall.",
  n: 21120,
  nNote: "230 Kreise mit mindestens 30 Firmen; 126 Kreise mit 1 bis 4 Treffern sind nicht eingezeichnet",
  source: SCAN,
  asOf: AS_OF,
  limitation:
    "Kreise mit 1 bis 4 Treffern fehlen wegen der Mindestzahl von 5; sie liegen alle im Zufallsband. Das Band ist eine Näherung und bei 230 Kreisen ist ein Ausreißer von selbst zu erwarten. Explorativ, keine Rangliste.",
  data: {
    overall: 4.63,
    fmt: { style: "percent", digits: 1 },
    limits: [95, 99.8],
    xLabel: "Firmen im Kreis (logarithmische Achse)",
    points: [
    {"id": "k001", "n": 225, "value": 7.11},
    {"id": "k002", "n": 103, "value": 4.85},
    {"id": "k003", "n": 99, "value": 5.05},
    {"id": "k004", "n": 96, "value": 5.21},
    {"id": "k005", "n": 99, "value": 5.05},
    {"id": "k006", "n": 32, "value": 0.0},
    {"id": "k007", "n": 41, "value": 0.0},
    {"id": "k008", "n": 35, "value": 0.0},
    {"id": "k009", "n": 30, "value": 0.0},
    {"id": "k010", "n": 41, "value": 0.0},
    {"id": "k011", "n": 140, "value": 4.29},
    {"id": "k012", "n": 1444, "value": 8.03, "label": "München"},
    {"id": "k013", "n": 39, "value": 0.0},
    {"id": "k014", "n": 89, "value": 5.62},
    {"id": "k015", "n": 107, "value": 6.54},
    {"id": "k016", "n": 110, "value": 6.36},
    {"id": "k017", "n": 584, "value": 7.88, "label": "München Land"},
    {"id": "k018", "n": 75, "value": 9.33},
    {"id": "k019", "n": 133, "value": 3.76},
    {"id": "k020", "n": 79, "value": 8.86},
    {"id": "k021", "n": 68, "value": 8.82},
    {"id": "k022", "n": 96, "value": 7.29},
    {"id": "k023", "n": 146, "value": 4.79},
    {"id": "k024", "n": 220, "value": 3.64},
    {"id": "k025", "n": 104, "value": 4.81},
    {"id": "k026", "n": 280, "value": 5.36},
    {"id": "k027", "n": 144, "value": 4.86},
    {"id": "k028", "n": 67, "value": 0.0},
    {"id": "k029", "n": 157, "value": 3.18},
    {"id": "k030", "n": 68, "value": 0.0},
    {"id": "k031", "n": 36, "value": 0.0},
    {"id": "k032", "n": 82, "value": 12.2, "label": "Bamberg"},
    {"id": "k033", "n": 99, "value": 5.05},
    {"id": "k034", "n": 30, "value": 0.0},
    {"id": "k035", "n": 134, "value": 7.46},
    {"id": "k036", "n": 125, "value": 7.2},
    {"id": "k037", "n": 212, "value": 6.6},
    {"id": "k038", "n": 72, "value": 0.0},
    {"id": "k039", "n": 115, "value": 6.09},
    {"id": "k040", "n": 88, "value": 6.82},
    {"id": "k041", "n": 52, "value": 0.0},
    {"id": "k042", "n": 32, "value": 0.0},
    {"id": "k043", "n": 233, "value": 9.01, "label": "Würzburg"},
    {"id": "k044", "n": 79, "value": 6.33},
    {"id": "k045", "n": 155, "value": 4.52},
    {"id": "k046", "n": 197, "value": 7.61},
    {"id": "k047", "n": 332, "value": 8.43, "label": "Augsburg"},
    {"id": "k048", "n": 142, "value": 3.52},
    {"id": "k049", "n": 183, "value": 3.83},
    {"id": "k050", "n": 170, "value": 5.88},
    {"id": "k051", "n": 869, "value": 4.72},
    {"id": "k052", "n": 34, "value": 0.0},
    {"id": "k053", "n": 89, "value": 7.87},
    {"id": "k054", "n": 160, "value": 3.75},
    {"id": "k055", "n": 791, "value": 6.07},
    {"id": "k056", "n": 56, "value": 10.71},
    {"id": "k057", "n": 384, "value": 8.33, "label": "Frankfurt"},
    {"id": "k058", "n": 75, "value": 8.0},
    {"id": "k059", "n": 54, "value": 0.0},
    {"id": "k060", "n": 138, "value": 4.35},
    {"id": "k061", "n": 39, "value": 0.0},
    {"id": "k062", "n": 38, "value": 0.0},
    {"id": "k063", "n": 49, "value": 0.0},
    {"id": "k064", "n": 31, "value": 0.0},
    {"id": "k065", "n": 137, "value": 5.11},
    {"id": "k066", "n": 42, "value": 0.0},
    {"id": "k067", "n": 31, "value": 0.0},
    {"id": "k068", "n": 49, "value": 0.0},
    {"id": "k069", "n": 420, "value": 5.48},
    {"id": "k070", "n": 68, "value": 0.0},
    {"id": "k071", "n": 146, "value": 5.48},
    {"id": "k072", "n": 61, "value": 0.0},
    {"id": "k073", "n": 43, "value": 0.0},
    {"id": "k074", "n": 38, "value": 0.0},
    {"id": "k075", "n": 148, "value": 7.43},
    {"id": "k076", "n": 488, "value": 5.74},
    {"id": "k077", "n": 31, "value": 0.0},
    {"id": "k078", "n": 147, "value": 4.76},
    {"id": "k079", "n": 49, "value": 0.0},
    {"id": "k080", "n": 114, "value": 6.14},
    {"id": "k081", "n": 87, "value": 8.05},
    {"id": "k082", "n": 61, "value": 0.0},
    {"id": "k083", "n": 40, "value": 0.0},
    {"id": "k084", "n": 82, "value": 0.0},
    {"id": "k085", "n": 36, "value": 0.0},
    {"id": "k086", "n": 43, "value": 0.0},
    {"id": "k087", "n": 99, "value": 5.05},
    {"id": "k088", "n": 35, "value": 0.0},
    {"id": "k089", "n": 35, "value": 0.0},
    {"id": "k090", "n": 50, "value": 0.0},
    {"id": "k091", "n": 50, "value": 0.0},
    {"id": "k092", "n": 40, "value": 0.0},
    {"id": "k093", "n": 36, "value": 0.0},
    {"id": "k094", "n": 32, "value": 0.0},
    {"id": "k095", "n": 30, "value": 0.0},
    {"id": "k096", "n": 34, "value": 0.0},
    {"id": "k097", "n": 63, "value": 0.0},
    {"id": "k098", "n": 40, "value": 0.0},
    {"id": "k099", "n": 33, "value": 0.0},
    {"id": "k100", "n": 41, "value": 0.0},
    {"id": "k101", "n": 39, "value": 0.0},
    {"id": "k102", "n": 33, "value": 0.0},
    {"id": "k103", "n": 62, "value": 0.0},
    {"id": "k104", "n": 32, "value": 0.0},
    ],
  },
};

/* --------------------------------------------------------------- dumbbell */

export const DUMBBELL_LAENDER: FigureSpecOf<"dumbbell"> = {
  id: "p-dumbbell-laender",
  kind: "dumbbell",
  title: "KI-Stellen und KI-Reden je Bundesland",
  alt: "Pro Bundesland zwei Marken auf einer logarithmischen Achse, beide auf den Bundesschnitt gleich 100 gesetzt: KI-Stellen je Million Einwohner (Kreis) und KI-Anteil auf Firmenwebsites (Raute). Die Stellen streuen von 12 in Mecklenburg-Vorpommern bis 541 in Berlin, das Reden von 30 in Sachsen bis 136 in Hamburg.",
  caption: "Eingestellt wird sehr ungleich, geredet viel gleichmäßiger.",
  n: 6521,
  nNote: "KI-Stellenanzeigen ohne Bereinigung von Doppelungen; 16 Länder, 24.944 Firmen",
  source: "Vorläufig: Stellenanzeigen mit KI-Titel (Januar bis Juni 2026) und Firmenwebsites (Scan März bis Mai 2026)",
  asOf: AS_OF,
  limitation:
    "Ökologische Daten mit nur 14 Ländern: sagt nichts über einzelne Firmen. Beide Maße sind auf ihren Bundesschnitt gleich 100 gesetzt, weil sie verschiedene Einheiten haben. Die Stellen sind ein Suchbegriff-Ausschnitt, gezählt werden Anzeigen, nicht Einstellungen. Sachsen-Anhalt und Saarland haben beim Reden weniger als 5 Treffer.",
  data: {
    fmt: { style: "number", digits: 0 },
    scale: "log",
    aLabel: "KI-Stellen je Million Einwohner",
    bLabel: "Firmen mit KI-Wort auf der Website",
    reference: { value: 100, label: "Bundesschnitt = 100" },
    sort: "a",
    rows: [
    {"id": "BW", "label": "Baden-Württemberg", "a": 77, "b": 91},
    {"id": "BY", "label": "Bayern", "a": 165, "b": 126},
    {"id": "BE", "label": "Berlin", "a": 541, "b": 121},
    {"id": "BB", "label": "Brandenburg", "a": 21, "b": 114},
    {"id": "HB", "label": "Bremen", "a": 80, "b": 93},
    {"id": "HH", "label": "Hamburg", "a": 333, "b": 136},
    {"id": "HE", "label": "Hessen", "a": 137, "b": 121},
    {"id": "MV", "label": "Mecklenburg-Vorpommern", "a": 12, "b": 56},
    {"id": "NI", "label": "Niedersachsen", "a": 29, "b": 76},
    {"id": "NW", "label": "Nordrhein-Westfalen", "a": 60, "b": 96},
    {"id": "RP", "label": "Rheinland-Pfalz", "a": 21, "b": 73},
    {"id": "SL", "label": "Saarland", "a": 18, "b": null},
    {"id": "SN", "label": "Sachsen", "a": 43, "b": 30},
    {"id": "ST", "label": "Sachsen-Anhalt", "a": 17, "b": null},
    {"id": "SH", "label": "Schleswig-Holstein", "a": 16, "b": 93},
    {"id": "TH", "label": "Thüringen", "a": 19, "b": 73},
    ],
  },
};

export const DUMBBELL_DETAILS: Readonly<Record<string, string>> = {
  "BW": "Baden-Württemberg: 60,0 KI-Stellenanzeigen je Million Einwohner (Index 77). 3,6 % der Firmen schreiben KI auf die Website, bereinigt (Index 91).",
  "BY": "Bayern: 129,1 KI-Stellenanzeigen je Million Einwohner (Index 165). 5,0 % der Firmen schreiben KI auf die Website, bereinigt (Index 126).",
  "BE": "Berlin: 422,4 KI-Stellenanzeigen je Million Einwohner (Index 541). 4,8 % der Firmen schreiben KI auf die Website, bereinigt (Index 121).",
  "BB": "Brandenburg: 16,1 KI-Stellenanzeigen je Million Einwohner (Index 21). 4,5 % der Firmen schreiben KI auf die Website, bereinigt (Index 114).",
  "HB": "Bremen: 62,6 KI-Stellenanzeigen je Million Einwohner (Index 80). 3,7 % der Firmen schreiben KI auf die Website, bereinigt (Index 93).",
  "HH": "Hamburg: 260,3 KI-Stellenanzeigen je Million Einwohner (Index 333). 5,4 % der Firmen schreiben KI auf die Website, bereinigt (Index 136).",
  "HE": "Hessen: 107,4 KI-Stellenanzeigen je Million Einwohner (Index 137). 4,8 % der Firmen schreiben KI auf die Website, bereinigt (Index 121).",
  "MV": "Mecklenburg-Vorpommern: 9,5 KI-Stellenanzeigen je Million Einwohner (Index 12). 2,2 % der Firmen schreiben KI auf die Website, bereinigt (Index 56).",
  "NI": "Niedersachsen: 22,9 KI-Stellenanzeigen je Million Einwohner (Index 29). 3,0 % der Firmen schreiben KI auf die Website, bereinigt (Index 76).",
  "NW": "Nordrhein-Westfalen: 47,0 KI-Stellenanzeigen je Million Einwohner (Index 60). 3,8 % der Firmen schreiben KI auf die Website, bereinigt (Index 96).",
  "RP": "Rheinland-Pfalz: 16,5 KI-Stellenanzeigen je Million Einwohner (Index 21). 2,9 % der Firmen schreiben KI auf die Website, bereinigt (Index 73).",
  "SL": "Saarland: 13,8 KI-Stellenanzeigen je Million Einwohner (Index 18). Beim KI-Wort auf Websites weniger als 5 Treffer, deshalb ohne Wert.",
  "SN": "Sachsen: 33,3 KI-Stellenanzeigen je Million Einwohner (Index 43). 1,2 % der Firmen schreiben KI auf die Website, bereinigt (Index 30).",
  "ST": "Sachsen-Anhalt: 13,5 KI-Stellenanzeigen je Million Einwohner (Index 17). Beim KI-Wort auf Websites weniger als 5 Treffer, deshalb ohne Wert.",
  "SH": "Schleswig-Holstein: 12,5 KI-Stellenanzeigen je Million Einwohner (Index 16). 3,7 % der Firmen schreiben KI auf die Website, bereinigt (Index 93).",
  "TH": "Thüringen: 14,7 KI-Stellenanzeigen je Million Einwohner (Index 19). 2,9 % der Firmen schreiben KI auf die Website, bereinigt (Index 73).",
};

/* ----------------------------------------------------------------- lorenz */

export const LORENZ_STELLEN: FigureSpecOf<"lorenz"> = {
  id: "p-lorenz-stellen",
  kind: "lorenz",
  title: "Wie sich KI-Stellen auf Arbeitgeber verteilen",
  alt: "Lorenzkurve: Arbeitgeber aufsteigend nach Zahl ihrer KI-Stellen, waagerecht ihr Anteil, senkrecht der Anteil der Stellen. Zwei Drittel der Arbeitgeber haben genau eine Stelle und zusammen etwa 31 Prozent der Stellen. Die größten 10 Prozent der Arbeitgeber halten 44 Prozent.",
  caption: "Zwei von drei Firmen mit einer KI-Stelle haben genau eine.",
  n: 5614,
  nNote: "doppelte Anzeigen zusammengefasst; 2.561 Arbeitgeber",
  source: JOBS,
  asOf: AS_OF,
  limitation:
    "Die Kurve ist zwischen den Messpunkten (67, 90, 95, 99 Prozent) geradlinig verbunden. Wer in 18 Suchbegriffen auftaucht, steht drin: Gezählt werden Anzeigen, nicht Einstellungen. Große Arbeitgeber sind auf den Portalen überrepräsentiert.",
  data: {
    xLabel: "Arbeitgeber, aufsteigend nach Stellen",
    yLabel: "Anteil der Stellen",
    points: [[0, 0], [67.04, 30.58], [90, 55.85], [95, 66.63], [99, 83.48], [100, 100]],
  },
};

export const BARS_SPITZENANTEILE: FigureSpecOf<"bars"> = {
  id: "p-bars-spitzenanteile",
  kind: "bars",
  title: "Anteil der Stellen bei den größten Arbeitgebern",
  alt: "Vier Balken: die größten 1 Prozent der Arbeitgeber halten 17 Prozent der KI-Stellen, die größten 5 Prozent 33, die größten 10 Prozent 44. Die zwei Drittel der Arbeitgeber mit genau einer Stelle halten zusammen 31 Prozent.",
  caption: "Die größten 10 Prozent halten 44 Prozent der Stellen.",
  n: 5614,
  nNote: "2.561 Arbeitgeber; Intervalle aus 2.000 Wiederholungen",
  source: JOBS,
  asOf: AS_OF,
  limitation:
    "Ohne Zusammenfassen doppelter Anzeigen wären die obersten 10 Prozent bei 59 Prozent. Gezählt werden Anzeigen, nicht Einstellungen.",
  data: {
    orientation: "horizontal",
    fmt: { style: "percent", digits: 0 },
    max: 60,
    items: [
      { id: "top1", label: "Größte 1 % der Arbeitgeber", value: 17 },
      { id: "top5", label: "Größte 5 % der Arbeitgeber", value: 33, lo: 29, hi: 37 },
      { id: "top10", label: "Größte 10 % der Arbeitgeber", value: 44, lo: 40, hi: 48 },
      { id: "single", label: "Die 67 % mit genau einer Stelle", value: 31 },
    ],
  },
};

export const ALL_FIGURE_FIXTURES: readonly FigureSpec[] = [
  WAFFLE_SAGEN_ZEIGEN,
  BARS_TEXTMENGE,
  BARS_VORHERSAGE,
  DOTPLOT_BRANCHEN,
  TILEMAP_LAENDER,
  FUNNEL_KREISE,
  DUMBBELL_LAENDER,
  LORENZ_STELLEN,
  BARS_SPITZENANTEILE,
];
