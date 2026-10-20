/**
 * Synthetic specs of the hero kinds, one or more per kind. The numbers are
 * invented for tests (a few mirror the shape of the real findings so the
 * layouts meet realistic label lengths); they carry no meaning and never ship.
 */

import { mulberry32 } from "../math.ts";
import type { FieldData, FieldScene, FigureSpec, NetworkEdge, NetworkNode } from "../types.ts";

const base = (id: string, title: string) => ({
  id,
  title,
  alt: `Testabbildung ${title}: erfundene Werte, nur für Tests.`,
  caption: "Testdaten, keine Messung.",
  n: 1000,
  source: "Testdaten",
  asOf: "2026-10-19",
  limitation: "Nur für Tests erfunden.",
});

/* --------------------------------------------------------------- network */

function networkFixture(): FigureSpec {
  const rand = mulberry32(7);
  const modules = [
    { id: "m0", label: "Konzern" },
    { id: "m1", label: "Social" },
    { id: "m2", label: "Technik" },
    { id: "m3", label: "Shop" },
  ];
  const centres: ReadonlyArray<readonly [number, number]> = [[28, 30], [72, 28], [30, 72], [72, 72]];
  const names = [
    "Wort KI", "Digitalisierung", "Cyber", "NIS2/ESG", "LinkedIn", "Facebook", "Karte", "Newsletter",
    "Kontakt", "Termin", "Cookie", "Hosting", "Shop", "Warenkorb", "Blog", "Karriere",
    "Presse", "Partner", "Preis", "Chat", "Video", "Zahlung", "Formular", "Galerie",
  ];
  const nodes: NetworkNode[] = names.map((label, i) => {
    const m = i === 0 ? 0 : (i % 4);
    const [cx, cy] = centres[m] as readonly [number, number];
    return {
      id: `n${i}`,
      label,
      x: Math.round((cx + (rand() - 0.5) * 34) * 10) / 10,
      y: Math.round((cy + (rand() - 0.5) * 34) * 10) / 10,
      module: `m${m}`,
      ki: i === 0,
    };
  });
  const raw: NetworkEdge[] = [];
  for (let a = 0; a < nodes.length; a += 1) {
    for (let b = a + 1; b < nodes.length; b += 1) {
      if (rand() < 0.22) raw.push(a === 0 || b === 0 ? [a, b, Math.round((2 + rand() * 5) * 10) / 10] : [a, b]);
    }
  }
  const kept = raw.filter((_e, i) => i % 2 === 0 || _e[0] === 0);
  return {
    ...base("t-network", "Netz"),
    kind: "network",
    data: {
      claim: "Rechne die Textmenge heraus, und das Netz halbiert sich",
      nodes,
      modules,
      variants: [
        { id: "roh", label: "roh", edges: raw },
        { id: "gleich", label: "gleiche Textmenge", edges: kept },
      ],
      defaultVariant: "gleich",
      baseline: "roh",
      neighbours: [
        { node: "n1", odds: 4.1, lo: 3.2, hi: 5.3 },
        { node: "n2", odds: 4.2, lo: 3.1, hi: 5.6 },
        { node: "n3", odds: 2.7, lo: 2.1, hi: 3.4 },
      ],
    },
  };
}

export const NETWORK: FigureSpec = networkFixture();

/* ---------------------------------------------------------------- blocks */

export const BLOCKS: FigureSpec = {
  ...base("t-blocks", "Blöcke"),
  n: 10088,
  kind: "blocks",
  data: {
    claim: "Von 100 KI-Anzeigen sind 35 bis 49 echte Stellen",
    total: 10088,
    blocks: 100,
    unit: "Anzeige|Anzeigen",
    bins: [
      { id: "dup", label: "Dubletten", tone: "grey" },
      { id: "gig", label: "Gig", tone: "grey" },
      { id: "stud", label: "Studierende" },
      { id: "inter", label: "Vermittler" },
      { id: "biz", label: "Business" },
      { id: "tech", label: "Technik" },
    ],
    finding: "tech",
    variants: [
      { id: "a", label: "Firma und Titel", counts: { dup: 4384, gig: 118, stud: 910, inter: 100, biz: 1018, tech: 3558 } },
      { id: "b", label: "Kopien am selben Ort", counts: { dup: 2272, gig: 310, stud: 1013, inter: 111, biz: 1390, tech: 4992 } },
    ],
    defaultVariant: "a",
  },
};

/* ----------------------------------------------------------------- strip */

export const STRIP: FigureSpec = {
  ...base("t-strip", "Namen"),
  kind: "strip",
  data: {
    claim: "Berater führen ChatGPT, Firmenseiten fast nie",
    fmt: { style: "percent", digits: 2 },
    scale: "log",
    min: 0.05,
    max: 50,
    finding: "firm",
    layers: [
      { id: "con", label: "Berater", shape: "diamond", tone: "ink" },
      { id: "emp", label: "Stellen", shape: "square", tone: "ink" },
      { id: "firm", label: "Firmenseiten", shape: "square", tone: "accent" },
    ],
    variants: [
      { id: "all", label: "alle Seiten" },
      { id: "ki", label: "nur Seiten mit KI-Wort" },
    ],
    defaultVariant: "all",
    rows: [
      {
        id: "chatgpt", label: "ChatGPT",
        marks: [
          { layer: "con", value: 27.8, lo: 25, hi: 30.6, n: 980, by: { ki: { value: 28.1, lo: 25.4, hi: 31, n: 968 } } },
          { layer: "emp", value: 4.5, lo: 3.7, hi: 5.4, n: 2474 },
          { layer: "firm", value: 0.37, lo: 0.3, hi: 0.46, n: 21402, by: { ki: { value: 3.8, lo: 2.7, hi: 5.2, n: 950 } } },
        ],
      },
      {
        id: "claude", label: "Claude",
        marks: [
          { layer: "con", value: 2.1, lo: 1.4, hi: 3.2, n: 980 },
          { layer: "emp", value: 16.3, lo: 14.9, hi: 17.8, n: 2474 },
          { layer: "firm", value: 0.12, lo: 0.08, hi: 0.18, n: 21402 },
        ],
      },
    ],
  },
};

export const STRIP_LINEAR: FigureSpec = {
  ...base("t-strip-lin", "Verhältnis"),
  kind: "strip",
  data: {
    fmt: { style: "decimal", digits: 1 },
    scale: "linear",
    reference: { value: 1, label: "gleich" },
    layers: [{ id: "r", label: "beobachtet gegen erwartet", shape: "ring", tone: "ink" }],
    rows: [
      { id: "ki", label: "KI", marks: [{ layer: "r", value: 1.8, lo: 1.2, hi: 2.6 }] },
      { id: "cloud", label: "Cloud", marks: [{ layer: "r", value: 1.9, lo: 1.1, hi: 3 }] },
      { id: "x", label: "Weniger", marks: [{ layer: "r", value: null }] },
    ],
  },
};

/* ----------------------------------------------------------------- curve */

export const CURVE: FigureSpec = {
  ...base("t-curve", "Uhr"),
  kind: "curve",
  data: {
    claim: "Je neuer das jüngste Datum, desto öfter steht KI da",
    fmt: { style: "percent", digits: 1 },
    min: 0,
    max: 14,
    frozenLabel: "jede vierte Seite",
    defaultVariant: "y2023",
    points: [
      { id: "y2022", label: "bis 2022", value: 2, lo: 1, hi: 3.2, n: 917, frozen: true },
      { id: "y2023", label: "2023", value: 3.2, lo: 2, hi: 4.6, n: 800, frozen: true },
      { id: "y2024", label: "2024", value: 4.6, lo: 3.5, hi: 5.9, n: 900 },
      { id: "y2025", label: "2025", value: 7.3, lo: 6, hi: 8.7, n: 1000 },
      { id: "y2026", label: "2026", value: 10.8, lo: 9.7, hi: 12, n: 957 },
    ],
    panel: {
      title: "zum Vergleich",
      fmt: { style: "decimal", digits: 1, unit: "x" },
      rows: [
        { id: "ki", label: "KI", value: 6.3 },
        { id: "dig", label: "Digitalisierung", value: 2.2 },
        { id: "nach", label: "nachhaltig", value: 1.7 },
      ],
    },
  },
};

/* ----------------------------------------------------------------- slope */

function permutation(items: number, seed: number): number[] {
  const rand = mulberry32(seed);
  // Mostly shuffled, with a weak pull to the original order, like a split-half rank correlation of 0,3.
  const keyed = Array.from({ length: items }, (_v, i) => ({ i, k: (i / items) * 0.35 + rand() * 0.65 }));
  const order = [...keyed].sort((a, b) => a.k - b.k);
  const rank = new Array<number>(items).fill(0);
  order.forEach((q, pos) => {
    rank[q.i] = pos + 1;
  });
  return rank;
}

export const SLOPE: FigureSpec = {
  ...base("t-slope", "Rangliste"),
  kind: "slope",
  data: {
    claim: "Jede Regionsrangliste ist zur Hälfte Zufall",
    items: 60,
    top: 6,
    aLabel: "Hälfte A",
    bLabel: "Hälfte B",
    fmt: { style: "number", digits: 2, unit: "x" },
    pooled: { a: 2.07, b: 1.01, lo: 0.67, hi: 1.32 },
    chance: { mean: 30.5, lo: 24, hi: 37 },
    defaultVariant: "s1",
    splits: [
      { id: "s1", label: "Teilung 1", rankB: permutation(60, 11), top: { a: 2.1, b: 1.1, lo: 0.7, hi: 1.5 } },
      { id: "s2", label: "Teilung 2", rankB: permutation(60, 12), top: { a: 1.9, b: 0.9, lo: 0.6, hi: 1.3 } },
    ],
  },
};

/* -------------------------------------------------------------- nulldist */

function bins(centre: number, spread: number, draws: number, count = 14): Array<{ lo: number; hi: number; draws: number }> {
  const raw = Array.from({ length: count }, (_v, i) => {
    const x = (i - (count - 1) / 2) / ((count - 1) / 2);
    return Math.exp(-(x * x) / (2 * spread * spread));
  });
  const sum = raw.reduce((s, v) => s + v, 0);
  const out = raw.map((v) => Math.floor((v / sum) * draws));
  out[Math.floor(count / 2)] = (out[Math.floor(count / 2)] ?? 0) + draws - out.reduce((s, v) => s + v, 0);
  return out.map((d, i) => ({ lo: Math.round((centre - 4 + (i * 8) / count) * 10) / 10, hi: Math.round((centre - 4 + ((i + 1) * 8) / count) * 10) / 10, draws: d }));
}

export const NULLDIST: FigureSpec = {
  ...base("t-nulldist", "Zufall"),
  kind: "nulldist",
  data: {
    claim: "Wer in Berlin mitredet, schreibt über alles Neue mehr",
    fmt: { style: "percent", digits: 1 },
    draws: 5000,
    observed: { value: 15.6, lo: 11.3, hi: 21.2, label: "beobachtet" },
    focusWord: "ki",
    defaultVariant: "n205",
    variants: [
      { id: "n205", label: "205 Firmen", n: 205, bins: bins(8.7, 0.55, 5000), band: { lo: 4.9, hi: 12.7 } },
      { id: "n100", label: "100 Firmen", n: 100, bins: bins(8.7, 0.8, 5000), band: { lo: 3.1, hi: 15.2 } },
    ],
    words: [
      { id: "ki", label: "KI", ratio: 1.8, lo: 1.3, hi: 2.4 },
      { id: "dig", label: "Digitalisierung", ratio: 1.6, lo: 1.2, hi: 2.1 },
      { id: "cloud", label: "Cloud", ratio: 1.9, lo: 1.3, hi: 2.7 },
      { id: "cyber", label: "Cyber", ratio: 3.2, lo: 1.9, hi: 5 },
    ],
  },
};

/* ----------------------------------------------------------------- field */

const FIELD_DATA: FieldData = {
    classes: [
      { id: "plain", label: "ohne KI-Wort", tone: "leinen" },
      { id: "ki", label: "mit KI-Wort", tone: "accent" },
      { id: "other", label: "andere", tone: "ink" },
      { id: "lost", label: "beim zweiten Mal weg", tone: "ghost" },
    ],
    scenes: [
      {
        id: "fifths", population: "pages", base: 21404, squares: 1000, unit: "Startseite|Startseiten", layout: "bins", joint: true,
        numeral: { value: 62, fmt: { style: "number" }, suffix: "x" },
        claim: "Wer viel schreibt, schreibt KI",
        labelClasses: ["plain", "ki"],
        bins: [
          { id: "f1", label: "kurz", segments: [{ cls: "plain", count: 4273 }, { cls: "ki", count: 8, partial: true }] },
          { id: "f2", label: "2", segments: [{ cls: "plain", count: 4249 }, { cls: "ki", count: 32 }] },
          { id: "f3", label: "3", segments: [{ cls: "plain", count: 4225 }, { cls: "ki", count: 57 }] },
          { id: "f4", label: "4", segments: [{ cls: "plain", count: 4149 }, { cls: "ki", count: 133 }] },
          { id: "f5", label: "lang", segments: [{ cls: "plain", count: 3784 }, { cls: "ki", count: 494 }] },
        ],
      },
      {
        id: "twice", population: "pairs", base: 89, squares: 89, unit: "Seite|Seiten", layout: "grid", cols: 10,
        numeral: { value: 46, fmt: { style: "percent", digits: 0 } },
        claim: "Zweimal gemessen",
        labelClasses: ["other", "lost"],
        bins: [{ id: "all", segments: [{ cls: "other", count: 48 }, { cls: "lost", count: 41 }] }],
      },
      {
        id: "jobs", population: "ads", base: 10088, squares: 100, unit: "Anzeige|Anzeigen", layout: "bins", perRow: 3,
        numeral: { value: 35, fmt: { style: "number" } },
        claim: "Von 100 KI-Anzeigen sind 35 echte Stellen",
        bins: [
          { id: "dup", label: "Dubletten", segments: [{ cls: "plain", count: 4384 }] },
          { id: "stud", label: "Studierende", segments: [{ cls: "other", count: 3028 }] },
          { id: "tech", label: "Technik", segments: [{ cls: "ki", count: 2676 }] },
        ],
      },
    ],
};

export const FIELD: FigureSpec = { ...base("t-field", "Feld"), n: 21404, kind: "field", data: FIELD_DATA };

/** A reel that starts and ends on the same settled scene, to test the designed loop seam. */
const SCENES: readonly FieldScene[] = FIELD_DATA.scenes;
export const FIELD_LOOP: FigureSpec = {
  ...base("t-field-loop", "Feldschleife"),
  kind: "field",
  data: {
    classes: FIELD_DATA.classes,
    scenes: [
      { ...(SCENES[1] as FieldScene), id: "cover", enter: "none" },
      { ...(SCENES[0] as FieldScene), id: "mid" },
      { ...(SCENES[1] as FieldScene), id: "cover2" },
    ],
  },
};

export const HERO_FIXTURES: readonly FigureSpec[] = [NETWORK, BLOCKS, STRIP, STRIP_LINEAR, CURVE, SLOPE, NULLDIST, FIELD];
