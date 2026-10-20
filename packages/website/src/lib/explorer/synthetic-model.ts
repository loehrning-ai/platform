/**
 * A SYNTHETIC placement model for tests and the component tests only. The
 * numbers are made up and must never reach a page: the real model is
 * content/books/<slug>/explorer.json. Deterministic (seeded), 80 draws.
 */

import { mulberry32 } from "@/lib/figures";
import type { ExplorerModel } from "./model";

const DRAWS = 80;

function level(rand: () => number, id: string, label: string, n: number, coef: number, extra: object = {}) {
  const spread = 0.35 / Math.sqrt(Math.max(n, 5) / 50);
  return {
    id,
    label,
    n,
    coef,
    boot: Array.from({ length: DRAWS }, () => (coef + (rand() - 0.5) * 2 * spread)),
    ...extra,
  };
}

export function syntheticModel(): ExplorerModel {
  const rand = mulberry32(20261019);
  const branchen = [
    ["it", "IT und Medien", 450, 0.9],
    ["beratung", "Beratung und Marketing", 620, 0.5],
    ["finanz", "Finanzen und Immobilien", 380, 0.1],
    ["handel", "Handel", 700, -0.2],
    ["bau", "Bau", 520, -0.8],
    ["industrie", "Industrie und Herstellung", 640, -0.1],
    ["ingenieure", "Ingenieure und Forschung", 300, 0.2],
    ["uebrige", "Übrige Dienste", 900, 0],
  ] as const;
  const laender = [
    ["bw", "Baden-Württemberg", 1400, 0.1],
    ["by", "Bayern", 6100, 0],
    ["be", "Berlin", 700, 0.3],
    ["nw", "Nordrhein-Westfalen", 2800, 0.05],
    ["pool", "Saarland, Sachsen-Anhalt", 120, -0.4, { pooled: true, pooledNote: "zu wenige Daten für ein eigenes Land" }],
  ] as const;
  const sizes = [
    ["1", "1 Vertretungsberechtigte(r)", 5200, -0.4],
    ["2-4", "2 bis 4", 7800, 0],
    ["5-9", "5 bis 9", 2600, 0.3],
    ["10+", "10 und mehr", 900, 0.6],
  ] as const;
  const texte = [
    ["q1", "kurz", "kurz wie eine Visitenkarte", -2.2],
    ["q2", "knapp", "ein kurzer Absatz", -1.1],
    ["q3", "mittel", "ein Bildschirm", 0],
    ["q4", "lang", "zwei Bildschirme", 1.0],
    ["q5", "sehr lang", "mehrere Bildschirme", 1.9],
  ] as const;
  return {
    version: "v1-synthetic",
    asOf: "2026-10-19",
    methodVersion: "v1-synthetic",
    n: 17034,
    outcome: "das Wort KI auf der Startseite",
    sourceLine: "n = 17.034 Startseiten (SYNTHETISCH, nur Test) · Grenze: Sichtbarkeit, nicht Einsatz",
    rescanNote: "Wird mit geprüften Websites neu gerechnet.",
    intercept: { coef: -2.6, boot: Array.from({ length: DRAWS }, () => -2.6 + (rand() - 0.5) * 0.2) },
    factors: [
      { id: "branche", label: "Branche", levels: branchen.map(([id, label, n, coef]) => level(rand, id, label, n, coef)) },
      {
        id: "bundesland",
        label: "Bundesland",
        levels: laender.map(([id, label, n, coef, extra]) => level(rand, id, label, n, coef, extra ?? {})),
      },
      {
        id: "size",
        label: "Größe",
        hint: "Vertretungsberechtigte, nicht Beschäftigte",
        levels: sizes.map(([id, label, n, coef]) => level(rand, id, label, n, coef)),
      },
      {
        id: "textmenge",
        label: "Textmenge deiner Startseite",
        levels: texte.map(([id, label, example, coef]) => level(rand, id, label, 3400, coef, { example })),
      },
    ],
    default: { branche: "beratung", bundesland: "by", size: "5-9", textmenge: "q3" },
  };
}
