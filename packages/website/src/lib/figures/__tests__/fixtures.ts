/**
 * Synthetic specs, one per kind. The numbers are invented for tests and carry
 * no meaning; they are not the book's data.
 */

import type { FigureSpec } from "../types.ts";

const base = (id: string, title: string) => ({
  id,
  title,
  alt: `Testabbildung ${title}: erfundene Werte, nur für Tests.`,
  caption: "Testdaten, keine Messung.",
  n: 1000,
  source: "Testdaten",
  asOf: "2026-10-18",
  limitation: "Nur für Tests erfunden.",
});

export const WAFFLE: FigureSpec = {
  ...base("t-waffle", "Punkte"),
  kind: "waffle",
  data: {
    total: 100,
    headline: "21 von 100",
    groups: [
      { id: "shows", label: "zeigt etwas Konkretes", dots: 21, tone: "accent" },
      { id: "says", label: "sagt nur KI", dots: 70, tone: "ring" },
    ],
    restLabel: "nicht eingeordnet",
  },
};

export const BARS_H: FigureSpec = {
  ...base("t-bars", "Balken"),
  kind: "bars",
  data: {
    fmt: { style: "percent", digits: 1 },
    items: [
      { id: "q1", label: "Kürzeste Texte", value: 0.4, lo: 0.1, hi: 0.9, n: 400 },
      { id: "q2", label: "Zweites Fünftel", value: 2.1, lo: 1.5, hi: 2.8, n: 400 },
      { id: "q3", label: "Mitte", value: null },
      { id: "q4", label: "Viertes Fünftel", value: 6.5, lo: 5.4, hi: 7.7, n: 400 },
      { id: "q5", label: "Längste Texte, besonders lange Beschriftung", value: 11.6, lo: 10, hi: 13.4, n: 400 },
    ],
  },
};

export const BARS_V: FigureSpec = {
  ...BARS_H,
  id: "t-bars-v",
  data: { ...(BARS_H.data as object), orientation: "vertical", baseline: 5, baselineLabel: "Mittel 5 %" } as never,
} as FigureSpec;

export const DOTPLOT: FigureSpec = {
  ...base("t-dotplot", "Branchen"),
  kind: "dotplot",
  data: {
    fmt: { style: "percent", digits: 1 },
    sort: "value",
    reference: { value: 4, label: "Alle: 4,0 %" },
    items: [
      { id: "a", label: "Informationstechnologie", value: 15.8, lo: 13.9, hi: 17.9, n: 520 },
      { id: "b", label: "Unternehmensberatung", value: 9.4, lo: 7.5, hi: 11.7, n: 310 },
      { id: "c", label: "Handel", value: 3.1, lo: 2.5, hi: 3.9, n: 900 },
      { id: "d", label: "Bau", value: 1.2, lo: 0.8, hi: 1.9, n: 700 },
      { id: "e", label: "Maschinenbau", value: null, n: 120 },
    ],
  },
};

export const TILEMAP: FigureSpec = {
  ...base("t-tilemap", "Länder"),
  kind: "tilemap",
  data: {
    fmt: { style: "percent", digits: 1 },
    emphasis: "ost",
    tiles: [
      ["BW", 4.8], ["BY", 4.5], ["BE", 9.1], ["BB", 2.9], ["HB", 4.1], ["HH", 6.7], ["HE", 5.2], ["MV", 2.5],
      ["NI", 3.7], ["NW", 4.3], ["RP", 3.6], ["SL", null], ["SN", 3.0], ["ST", null], ["SH", 3.9], ["TH", 2.7],
    ].map(([id, value]) => ({
      id: id as string,
      value: value as number | null,
      ...(value === null ? {} : { lo: (value as number) - 0.8, hi: (value as number) + 0.9, n: 500 }),
    })),
  },
};

export const FUNNEL: FigureSpec = {
  ...base("t-funnel", "Kreise"),
  kind: "funnel",
  data: {
    fmt: { style: "percent", digits: 1 },
    overall: 4,
    xLabel: "Firmen je Kreis",
    points: [
      { id: "k1", n: 35, value: 3 },
      { id: "k2", n: 60, value: 6.5 },
      { id: "k3", n: 90, value: 2.2 },
      { id: "k4", n: 140, value: 4.4 },
      { id: "k5", n: 220, value: 3.5 },
      { id: "k6", n: 400, value: 5.1 },
      { id: "k7", n: 650, value: 4.0 },
      { id: "k8", n: 1100, value: 9.8, label: "Stadt A" },
      { id: "k9", n: 1800, value: 2.1, label: "Kreis B" },
      { id: "k10", n: 3000, value: 4.3 },
    ],
  },
};

export const DUMBBELL: FigureSpec = {
  ...base("t-dumbbell", "Stellen und Webseiten"),
  kind: "dumbbell",
  data: {
    fmt: { style: "number", digits: 0 },
    scale: "log",
    aLabel: "Stellen je Million (Index)",
    bLabel: "KI auf Webseiten (Index)",
    reference: { value: 100, label: "Mittel = 100" },
    sort: "a",
    rows: [
      { id: "r1", label: "Land A", a: 380, b: 150 },
      { id: "r2", label: "Land B", a: 140, b: 110 },
      { id: "r3", label: "Land C", a: 90, b: 95 },
      { id: "r4", label: "Land D", a: 25, b: 80 },
      { id: "r5", label: "Land E", a: 9, b: 70 },
    ],
  },
};

export const LORENZ: FigureSpec = {
  ...base("t-lorenz", "Konzentration"),
  kind: "lorenz",
  data: {
    xLabel: "Anteil der Arbeitgeber",
    yLabel: "Anteil der Stellen",
    gini: 0.41,
    points: [[0, 0], [20, 5], [40, 13], [60, 26], [80, 48], [90, 66], [100, 100]],
    marks: [
      { x: 80, label: "Die 20 % mit den meisten Stellen bieten 52 % aller Stellen." },
      { x: 40, label: "Die schwächere Hälfte kommt auf 13 %." },
    ],
  },
};

export const WATERFALL: FigureSpec = {
  ...base("t-waterfall", "Messungen"),
  kind: "waterfall",
  steps: [
    { id: "s1", label: "Rohwert", reveal: ["raw"] },
    { id: "s2", label: "Geteilte Adressen", reveal: ["shared"], focus: ["shared"] },
    { id: "s3", label: "Gewichtet", reveal: ["own", "weighted"], focus: ["weighted"] },
    { id: "s4", label: "Zweite Messung", reveal: ["scan1", "scan2", "scan3"] },
  ],
  data: {
    fmt: { style: "percent", digits: 1 },
    items: [
      { id: "raw", label: "Alle Seiten roh", kind: "total", value: 8.2, n: 37000 },
      { id: "shared", label: "Geteilte Adressen entfernt", kind: "delta", value: -3.9 },
      { id: "own", label: "Eigene Adressen", kind: "total", value: 4.3, n: 25000 },
      { id: "weighted", label: "Nach Gewicht", kind: "delta", value: -0.3 },
      { id: "scan1", label: "Erste Messung", kind: "total", value: 10.6, gapBefore: true, n: 840 },
      { id: "scan2", label: "Zweite Messung", kind: "delta", value: -4.3 },
      { id: "scan3", label: "Danach", kind: "total", value: 6.3 },
    ],
  },
};

export const LADDER: FigureSpec = {
  ...base("t-ladder", "Umfragen"),
  kind: "ladder",
  data: {
    fmt: { style: "percent", digits: 0 },
    axisMax: 60,
    rungs: [
      { id: "u1", label: "Erhebung A", year: "2025", value: 20, from: 12, definition: "Unternehmen mit mindestens 10 Beschäftigten, die KI-Technologien einsetzen." },
      { id: "u2", label: "Umfrage B", value: 54, definition: "Befragte Firmen sagen, dass sie KI in mindestens einem Bereich nutzen, auch testweise." },
      { id: "u3", label: "Umfrage C", value: 57, definition: "Firmen aller Größen, Selbstauskunft, ab 20 Beschäftigten, mit Mehrfachantworten und einer sehr langen Frage." },
    ],
    ours: {
      id: "ours",
      label: "KI steht auf der Website",
      value: 4,
      lo: 3.7,
      hi: 4.2,
      axisMax: 10,
      fmt: { style: "percent", digits: 1 },
      note: "Gemessen wird, was eine Firma öffentlich schreibt, nicht, was sie einsetzt.",
    },
  },
};

export const TIMELINE: FigureSpec = {
  ...base("t-timeline", "Fristen"),
  kind: "timeline",
  data: {
    events: [
      { id: "e1", date: "2025-02-02", tag: "Art. 4", label: "KI-Kompetenz ist Pflicht", detail: "Wer KI einsetzt, sorgt für ausreichende Kenntnisse im Team.", status: "gilt" },
      { id: "e2", date: "2027-08-02", tag: "Hochrisiko", label: "Weitere Pflichten beginnen", status: "kommt" },
      { id: "e3", date: "2027-12-02", tag: "Anhang III", label: "Frist wird verhandelt", detail: "Der Stand ist offen.", status: "offen" },
    ],
  },
};

export const ICEBERG: FigureSpec = {
  ...base("t-iceberg", "Eisberg"),
  kind: "iceberg",
  data: {
    fmt: { style: "percent", digits: 1 },
    visible: { value: 2.2, label: "heute sichtbar in Technikfirmen" },
    total: { value: 11.7, label: "modellierte Betroffenheit" },
    waterlineLabel: "Wasserlinie",
    hiddenLabel: "darunter: modellierte Exposition in anderen Branchen",
  },
};

export const ALL_FIXTURES: readonly FigureSpec[] = [
  WAFFLE, BARS_H, BARS_V, DOTPLOT, TILEMAP, FUNNEL, DUMBBELL, LORENZ, WATERFALL, LADDER, TIMELINE, ICEBERG,
];

/** A copy of a fixture with some data fields replaced; for tests that bend one input. */
export const withData = (spec: FigureSpec, data: object): FigureSpec =>
  ({ ...spec, data: { ...(spec.data as object), ...data } }) as unknown as FigureSpec;
