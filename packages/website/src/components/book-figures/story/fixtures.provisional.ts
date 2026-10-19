/**
 * PROVISIONAL fixtures for the story islands (C1, C2, C4, C12, C13, C14).
 *
 * Until task T4 freezes the aggregates, the islands run on these. What is
 * marked "real" below comes from published sources or from the discovery
 * analysis (re-checked after the re-scan); what is marked "invented" is only
 * there so the component can be seen and tested. Every chapter that uses a
 * fixture passes `provisional` to the island, which prints a visible note.
 * Replace each fixture with the frozen figure JSON and drop the flag.
 */

import { wilson, type FigureSpecOf } from "@/lib/figures";

export const PROVISIONAL = true;

/* ------------------------------------------------------------------- C4 */

export interface StoryStep {
  readonly id: string;
  /** Heading of the step card. */
  readonly title: string;
  /** Big number on the pinned stage. */
  readonly readout: string;
  readonly readoutLabel: string;
  readonly body: string;
  /** Text alternative of the figure at this step (stacked and no-JS view). */
  readonly alt: string;
}

/** Real numbers from the discovery analysis; the re-scan on one method can change them. */
export const C4_HEADLINE: FigureSpecOf<"waterfall"> = {
  id: "c4-headline",
  kind: "waterfall",
  title: "Dieselbe Messung, vier Rechnungen",
  alt: "Waagerechte Balken. Roh steht das Wort KI auf 8,2 Prozent der erreichbaren Firmenwebsites. Nur mit eigener Domain sind es 4,3 Prozent, gewichtet 4,0 Prozent. Ein zweiter Scan derselben 840 Websites senkt den Wert von 10,6 auf 6,3 Prozent.",
  caption: "Wie oft das Wort KI auf Firmenwebsites steht, je nachdem, wie wir rechnen.",
  n: 37429,
  nNote: "37.429 / 25.581 / 24.944 / 840",
  source: "Eigene Auswertung, Scan März bis Mai 2026",
  asOf: "2026-10-18",
  limitation:
    "Gemessen wird, ob das Wort KI im HTML einer Firmenwebsite steht. Das sagt nichts darüber, ob die Firma KI nutzt. Die Zuordnung von Website zu Firma ist noch nicht geprüft. Der zweite Scan umfasst nur 840 Websites.",
  steps: [
    { id: "raw", label: "Roh", reveal: ["raw"], focus: ["raw"] },
    { id: "own", label: "Eigene Domain", reveal: ["own"], focus: ["own"] },
    { id: "weighted", label: "Gewichtet", reveal: ["weighted"], focus: ["weighted"] },
    { id: "rescan", label: "Zweiter Scan", reveal: ["scan1", "scan2"], focus: ["scan1", "scan2"] },
  ],
  data: {
    fmt: { style: "percent", digits: 1 },
    orientation: "horizontal",
    items: [
      { id: "raw", label: "Roh: alle erreichbaren Websites", kind: "total", value: 8.2, n: 37429 },
      { id: "own", label: "Nur Firmen mit eigener Domain", kind: "total", value: 4.3, n: 25581 },
      { id: "weighted", label: "Gewichtet nach Bundesland", kind: "total", value: 4.0, n: 24944 },
      { id: "scan1", label: "Erster Scan, 840 Websites", kind: "total", value: 10.6, n: 840, gapBefore: true },
      { id: "scan2", label: "Zweiter Scan, 16 Tage später", kind: "total", value: 6.3, n: 840 },
    ],
  },
};

export const C4_STEPS: readonly StoryStep[] = [
  {
    id: "raw",
    title: "Roh gerechnet",
    readout: "8,2 %",
    readoutLabel: "alle erreichbaren Websites, n = 37.429",
    body: "Die einfachste Rechnung: Auf 3.059 von 37.429 erreichbaren Firmenwebsites steht das Wort KI oder künstliche Intelligenz. Das sind 8,2 Prozent.",
    alt: "Ein Balken: roh 8,2 Prozent.",
  },
  {
    id: "own",
    title: "Nur eigene Domains",
    readout: "4,3 %",
    readoutLabel: "Firmen mit eigener Domain, n = 25.581",
    body: "Auf 11.848 Websites teilen sich mehrere Firmen eine Adresse. Dort steht KI fast viermal so oft. Möglich, dass dahinter Portale stecken, die der falschen Firma zugeordnet wurden. Das prüfen wir noch an 300 Stichproben. Ohne diese Websites bleiben 4,3 Prozent.",
    alt: "Zwei Balken: roh 8,2 Prozent, nur eigene Domains 4,3 Prozent.",
  },
  {
    id: "weighted",
    title: "Gewichtet",
    readout: "4,0 %",
    readoutLabel: "gewichtet, Intervall 3,7 bis 4,2 %, n = 24.944",
    body: "Unsere Stichprobe ist keine Zufallsauswahl: Bayern stellt 41 Prozent der Stichprobe, aber nur 14 Prozent der Firmen im Pool. Gewichten wir jedes Bundesland nach seinem Anteil im Pool, bleiben 4,0 Prozent.",
    alt: "Drei Balken: roh 8,2, eigene Domains 4,3, gewichtet 4,0 Prozent.",
  },
  {
    id: "rescan",
    title: "Derselbe Blick, zweimal",
    readout: "10,6 % und 6,3 %",
    readoutLabel: "dieselben 840 Websites, 16 Tage später",
    body: "840 Websites haben wir ein zweites Mal gelesen, im Mittel 16 Tage später. Beim ersten Scan stand KI auf 10,6 Prozent, beim zweiten auf 6,3 Prozent. 41 von 89 Treffern waren weg. Schon die Messmethode verschiebt die Zahl um den Faktor 1,7.",
    alt: "Fünf Balken: 8,2, 4,3 und 4,0 Prozent aus der ersten Rechnung. Daneben dieselben 840 Websites: erster Scan 10,6 Prozent, zweiter Scan 6,3 Prozent.",
  },
];

/* ------------------------------------------------------------------- C2 */

/** Real figures from the cited paper (abstract, read 2026-10-19); US labour market, modelled. */
export const C2_ICEBERG: FigureSpecOf<"iceberg"> = {
  id: "c2-iceberg",
  kind: "iceberg",
  title: "Der Eisberg der KI-Exposition",
  alt: "Ein Eisberg. Über der Wasserlinie steht 2,2 Prozent der Lohnsumme, der sichtbare KI-Einsatz in Technikberufen. Der gesamte modellierte Wert liegt bei 11,7 Prozent. Der größte Teil liegt unter der Wasserlinie.",
  caption: "Sichtbar ist wenig. Was Modelle technisch könnten, ist fünfmal so groß. Beides ist eine Modellrechnung für die USA.",
  n: 151000000,
  nNote: "151 Mio. simulierte Beschäftigte, keine Stichprobe",
  source: "Chopra et al., The Iceberg Index, arXiv:2510.25137",
  asOf: "2026-10-18",
  limitation:
    "Modellierte technische Exposition für den US-Arbeitsmarkt, gemessen als Anteil an der Lohnsumme. Das Modell sagt nichts über Deutschland, nichts über Entlassungen und nichts über den Zeitpunkt.",
  data: {
    fmt: { style: "percent", digits: 1 },
    visible: { value: 2.2, label: "Sichtbar: Technikberufe" },
    total: { value: 11.7, label: "Modelliert, auch Verwaltung und Finanzen" },
    waterlineLabel: "Wasserlinie",
    hiddenLabel: "Noch nicht sichtbar (Differenz)",
  },
};

/* ------------------------------------------------------------------- C1 */

export interface SurveyDetail {
  readonly id: string;
  readonly title: string;
  readonly wording: string;
  readonly base: string;
  readonly sample: string;
  readonly limits: string;
}

/** Real: wording and bases verified at source on 2026-10-18 (survey_ladder_c1.json). */
export const C1_LADDER: FigureSpecOf<"ladder"> = {
  id: "c1-ladder",
  kind: "ladder",
  title: "Wie viele Firmen nutzen KI? Es kommt darauf an, wer fragt",
  alt: "Vier Umfragen auf einer Skala von 0 bis 100 Prozent: KfW 20, Destatis 26, ifo 54,5 und Bitkom 57 Prozent. Darunter, auf einer eigenen Achse, unser Maß: auf rund 4 Prozent der Firmenwebsites steht das Wort KI.",
  caption: "Vier Umfragen, vier Fragen, vier Antworten. Unser eigenes Maß liegt auf einer anderen Achse, weil es etwas anderes misst.",
  n: 5200,
  nNote: "KfW gut 5.200, Destatis 20.000, ifo rund 6.000, Bitkom 603 Antworten; unser Maß 24.944 Websites",
  source: "KfW Fokus 554, Destatis IKT-Erhebung 2025, ifo Konjunkturumfrage Mai 2026, Bitkom Research 2026; eigene Auswertung",
  asOf: "2026-10-18",
  limitation:
    "Die Umfragen unterscheiden sich in Frage, Zeitraum, Größenschwelle und Befragten. Die Werte sind nicht miteinander vergleichbar. Unser Maß zählt Websites mit dem Wort KI, nicht Firmen mit KI im Einsatz.",
  data: {
    fmt: { style: "percent", digits: 0 },
    axisMax: 100,
    rungs: [
      {
        id: "kfw",
        label: "KfW",
        year: "2022 bis 2024",
        value: 20,
        from: 4,
        definition: "Hat deine Firma KI-Anwendungen genutzt? Dreijahresfenster, auch Firmen unter 5 Beschäftigte.",
      },
      {
        id: "destatis",
        label: "Destatis",
        year: "2025",
        value: 26,
        definition: "Nutzt deine Firma eine von acht KI-Technologien? Firmen ab 10 Beschäftigten.",
      },
      {
        id: "ifo",
        label: "ifo",
        year: "Mai 2026",
        value: 54.5,
        from: 40.9,
        definition: "Ist KI im Einsatz, geplant, diskutiert oder kein Thema? Keine Definition von KI.",
      },
      {
        id: "bitkom",
        label: "Bitkom",
        year: "2026",
        value: 57,
        from: 36,
        definition: "Setzt deine Firma KI ein oder plant oder diskutiert sie den Einsatz? Firmen ab 20 Beschäftigten.",
      },
    ],
    // Provisional: the weighted 4.0 % is re-computed after the re-scan (T2) and frozen in T4.
    ours: {
      id: "ours",
      label: "KI steht auf der Firmenwebsite",
      value: 4.0,
      lo: 3.7,
      hi: 4.2,
      axisMax: 10,
      fmt: { style: "percent", digits: 1 },
      note: "Anderes Maß: Wir zählen Websites mit dem Wort KI. Das ist kein Anteil von Firmen, die KI nutzen.",
    },
  },
};

export const C1_DETAILS: readonly SurveyDetail[] = [
  {
    id: "overview",
    title: "20 bis 57 Prozent, je nachdem, wer fragt",
    wording:
      "Derselbe Verband, dieselbe Größenschwelle, zwei Fragen: Bitkom meldet 41 Prozent, wenn es nach genutzten Technologien fragt (Januar bis Februar 2026, n = 604), und 57 Prozent, wenn es zwischen Einsatz, Plan und Diskussion unterscheidet (Juli bis August 2026, n = 603).",
    base: "Tippe oder wähle eine Quelle, um Wortlaut und Basis zu sehen.",
    sample: "Alle vier Umfragen sind Befragungen, keine Messung auf der Website.",
    limits: "Wer eine einzelne Zahl nennt, sollte dazu sagen, gemessen womit.",
  },
  {
    id: "kfw",
    title: "KfW: 20 Prozent",
    wording:
      "Haben Sie in Ihrem Unternehmen in den Jahren 2022 bis 2024 Anwendungen von Künstlicher Intelligenz genutzt? Vorher steht eine Definition mit Beispielen wie Texterkennung und Bots.",
    base: "Mittelstand, auch Firmen unter 5 Beschäftigten. Hochgerechnet auf knapp 780.000 Firmen. Der Fünfjahresvergleich (2016 bis 2018: 4 Prozent) misst ein anderes Zeitfenster.",
    sample: "Gut 5.200 Antworten aus dem KfW-Mittelstandspanel.",
    limits: "Das Dreijahresfenster zählt jeden, der irgendwann KI genutzt hat. Wie der Mittelstand abgegrenzt ist, nennen die beiden Papiere nicht.",
  },
  {
    id: "destatis",
    title: "Destatis: 26 Prozent",
    wording:
      "Nutzt Ihr Unternehmen eine der folgenden Technologien der künstlichen Intelligenz? Acht Technologien, jeweils ja oder nein. Der Wert zählt Firmen mit mindestens einem Ja.",
    base: "Firmen ab 10 Beschäftigten, ohne Finanzsektor und ohne Landwirtschaft. Nach Größe: 10 bis 49 Beschäftigte 23 Prozent, ab 250 Beschäftigte 57 Prozent.",
    sample: "Geplante Stichprobe 20.000 Firmen, Rücklauf 24,6 Prozent, freiwillig, online.",
    limits: "2025 wechselte die Zähleinheit. Der Anstieg von 20 auf 26 Prozent ist deshalb kein sauberer Trend.",
  },
  {
    id: "ifo",
    title: "ifo: 54,5 Prozent",
    wording:
      "Gefragt wird, ob KI im Unternehmen bereits genutzt wird, ihre Nutzung geplant ist, diskutiert wird oder kein Thema ist. Eine Definition von KI gibt es nicht. Wortlaut von 2024; ob 2026 identisch gefragt wurde, ist nicht veröffentlicht.",
    base: "Firmen der ifo Konjunkturumfrage aus Industrie, Dienstleistungen, Handel und Bauhauptgewerbe. Mai 2025: 40,9 Prozent.",
    sample: "Für 2026 nicht veröffentlicht. 2024 haben rund 6.000 Firmen geantwortet.",
    limits: "Wer KI selbst definiert, zählt auch ChatGPT mit. Stichprobe und Gewichtung stehen nicht auf der Ergebnisseite.",
  },
  {
    id: "bitkom",
    title: "Bitkom: 57 Prozent",
    wording:
      "Inwieweit setzt Ihr Unternehmen KI ein bzw. plant oder diskutiert den Einsatz? Antworten: Einsatz, geplant oder diskutiert, kein Thema.",
    base: "Firmen ab 20 Beschäftigten, gewichtet nach der Umsatzsteuerstatistik. 2025: 36 Prozent, 2024: 20 Prozent.",
    sample: "n = 603, Telefoninterviews, befragt wurde die Person, die für KI oder Digitalisierung zuständig ist. Fehlerspanne rund 4 Prozentpunkte.",
    limits: "Im Auftrag eines Branchenverbands. Wer Pläne und Diskussion auf derselben Skala sieht, liest Einsatz weiter oder enger.",
  },
  {
    id: "ours",
    title: "Unser Maß: rund 4 Prozent",
    wording:
      "Keine Frage an Menschen: Wir lesen die Startseite und zählen, ob das Wort KI oder künstliche Intelligenz im HTML steht.",
    base: "Firmen mit auffindbarer Website und eigener Domain, gewichtet nach Bundesland (vorläufig, vor dem zweiten Scan).",
    sample: "24.944 Websites, Intervall 3,7 bis 4,2 Prozent. Scan März bis Mai 2026.",
    limits: "Ein Wort auf der Website ist kein Einsatz. Firmen ohne Website fehlen, kleine Firmen sind kaum sichtbar.",
  },
];

/* ------------------------------------------------------------------ C12 */

export interface TimelineStepText {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

/**
 * PROVISIONAL dates. Re-verify every date and the status of the Digital Omnibus
 * at the source (Regulation (EU) 2024/1689, EUR-Lex) on build day.
 */
export const C12_TIMELINE: FigureSpecOf<"timeline"> = {
  id: "c12-ai-act",
  kind: "timeline",
  title: "Was seit Februar 2025 gilt: die KI-Verordnung in Stufen",
  alt: "Zeitleiste der KI-Verordnung. 1. August 2024 Inkrafttreten. 2. Februar 2025 Verbote und KI-Kompetenz. 2. August 2025 Regeln für KI-Modelle mit allgemeinem Verwendungszweck. 2. August 2026 die meisten übrigen Pflichten, Stand offen. 2. August 2027 Hochrisiko-Systeme in regulierten Produkten.",
  caption: "Die Pflicht zur KI-Kompetenz (Artikel 4) gilt seit Februar 2025. Die späteren Stufen betreffen vor allem Anbieter von Hochrisiko-Systemen.",
  n: 0,
  source: "Verordnung (EU) 2024/1689, Artikel 113",
  asOf: "2026-10-18",
  limitation:
    "Vorläufige Daten, vor der Veröffentlichung am Originaltext geprüft. Ob einzelne Fristen durch den Digital Omnibus verschoben werden, ist offen. Das ist keine Rechtsberatung.",
  steps: [
    { id: "s1", label: "2024", reveal: ["e1"], focus: ["e1"] },
    { id: "s2", label: "Feb. 2025", reveal: ["e2"], focus: ["e2"] },
    { id: "s3", label: "Aug. 2025", reveal: ["e3"], focus: ["e3"] },
    { id: "s4", label: "ab Aug. 2026", reveal: ["e4", "e5"], focus: ["e4", "e5"] },
  ],
  data: {
    events: [
      { id: "e1", date: "2024-08-01", label: "Die KI-Verordnung tritt in Kraft", tag: "Start", status: "gilt" },
      {
        id: "e2",
        date: "2025-02-02",
        label: "Verbote und KI-Kompetenz",
        detail: "Wer KI-Systeme einsetzt, sorgt dafür, dass seine Leute genug KI-Kompetenz haben.",
        tag: "Artikel 4",
        status: "gilt",
      },
      {
        id: "e3",
        date: "2025-08-02",
        label: "Regeln für KI-Modelle mit allgemeinem Verwendungszweck",
        detail: "Dazu Aufsichtsbehörden und Sanktionsregeln.",
        tag: "Modelle",
        status: "gilt",
      },
      {
        id: "e4",
        date: "2026-08-02",
        label: "Die meisten übrigen Pflichten, auch für Hochrisiko-Systeme nach Anhang III",
        detail: "Termin laut Verordnung. Eine Verschiebung für Hochrisiko-Systeme wird diskutiert. Wir prüfen den Stand am Originaltext.",
        tag: "Hochrisiko",
        status: "offen",
      },
      {
        id: "e5",
        date: "2027-08-02",
        label: "Hochrisiko-Systeme in regulierten Produkten",
        tag: "Anhang I",
        status: "kommt",
      },
    ],
  },
};

export const C12_STEP_TEXTS: readonly TimelineStepText[] = [
  { id: "s1", label: "2024", text: "Am 1. August 2024 trat die Verordnung in Kraft. Die meisten Pflichten kamen erst später." },
  { id: "s2", label: "Feb. 2025", text: "Seit dem 2. Februar 2025 gelten die Verbote und die Pflicht zur KI-Kompetenz. Sie trifft jede Firma, die KI-Systeme einsetzt, auch kleine." },
  { id: "s3", label: "Aug. 2025", text: "Seit dem 2. August 2025 gelten die Regeln für KI-Modelle mit allgemeinem Verwendungszweck. Sie richten sich vor allem an deren Anbieter." },
  { id: "s4", label: "ab Aug. 2026", text: "Für den 2. August 2026 sieht die Verordnung die meisten übrigen Pflichten vor, für Produkte ein Jahr später. Ob und wie sich Fristen verschieben, ist noch offen." },
];

/* ------------------------------------------------------------------ C14 */

export interface PlacementCell {
  /** Websites read in the group; null when the group is too small to show. */
  readonly n: number | null;
  /** Websites that show KI; null for 1 to 4 (suppressed, "weniger als 5"). */
  readonly hits: number | null;
  readonly value: number | null;
  readonly lo: number | null;
  readonly hi: number | null;
}

export interface PlacementData {
  readonly industries: readonly { readonly id: string; readonly label: string }[];
  readonly regions: readonly { readonly id: string; readonly label: string; readonly note: string }[];
  /** Keyed `${industryId}|${regionId}`, and `${industryId}|all`. */
  readonly cells: Readonly<Record<string, PlacementCell>>;
  readonly overall: { readonly value: number; readonly lo: number; readonly hi: number; readonly n: number };
  readonly asOf: string;
  readonly source: string;
}

const INDUSTRIES = [
  { id: "it", label: "IT und Information" },
  { id: "beratung", label: "Beratung, Werbung, freie Berufe" },
  { id: "finanzen", label: "Finanzen und Immobilien" },
  { id: "handel", label: "Handel" },
  { id: "industrie", label: "Industrie und Produktion" },
  { id: "bau", label: "Bau und Handwerk" },
  { id: "gesundheit", label: "Gesundheit, Soziales, Bildung" },
  { id: "verkehr", label: "Gastgewerbe und Verkehr" },
] as const;

const REGIONS = [
  { id: "nord", label: "Nord", note: "SH, HH, HB, NI" },
  { id: "ost", label: "Ost", note: "BE, BB, MV, SN, ST, TH" },
  { id: "west", label: "West", note: "NW, RP, SL, HE" },
  { id: "sued", label: "Süd", note: "BW, BY" },
] as const;

/** INVENTED test counts: [n, hits] per industry (rows) and region (nord, ost, west, sued). Not data. */
const RAW: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  it: [[310, 41], [180, 19], [520, 71], [940, 128]],
  beratung: [[690, 62], [420, 31], [1150, 98], [1930, 190]],
  finanzen: [[560, 25], [300, 9], [880, 38], [1210, 61]],
  handel: [[1340, 40], [760, 15], [2250, 74], [2860, 99]],
  industrie: [[690, 24], [520, 12], [1540, 55], [2210, 88]],
  bau: [[1480, 14], [1020, 4], [2610, 29], [3560, 41]],
  gesundheit: [[720, 18], [410, 7], [1280, 30], [1640, 47]],
  verkehr: [[430, 3], [260, 2], [690, 12], [880, 15]],
};

function cell(n: number, hits: number): PlacementCell {
  if (hits >= 1 && hits <= 4) return { n, hits: null, value: null, lo: null, hi: null };
  const ci = wilson(hits, n);
  return {
    n,
    hits,
    value: (hits / n) * 100,
    lo: ci ? ci.lo * 100 : null,
    hi: ci ? ci.hi * 100 : null,
  };
}

function buildCells(): Record<string, PlacementCell> {
  const out: Record<string, PlacementCell> = {};
  for (const [industry, rows] of Object.entries(RAW)) {
    let totalN = 0;
    let totalHits = 0;
    rows.forEach((row, i) => {
      const region = REGIONS[i];
      if (!region) return;
      out[`${industry}|${region.id}`] = cell(row[0], row[1]);
      totalN += row[0];
      totalHits += row[1];
    });
    out[`${industry}|all`] = cell(totalN, totalHits);
  }
  return out;
}

/** PROVISIONAL (invented counts, real structure): replaced by the frozen aggregate from T4. */
export const C14_PLACEMENT: PlacementData = {
  industries: INDUSTRIES,
  regions: REGIONS,
  cells: buildCells(),
  overall: { value: 4.0, lo: 3.7, hi: 4.2, n: 24944 },
  asOf: "2026-10-18",
  source: "Eigene Auswertung, Scan März bis Mai 2026",
};
