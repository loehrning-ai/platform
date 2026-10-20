/**
 * Everything the reel writes: numerals, claims, direct labels, unit lines and
 * source lines, with the second each one comes and goes. Words are German,
 * du-form, no dashes. Numbers only ever enter through `{{path:kind}}` slots
 * of the frozen JSON (see data.ts), so the truth check can trace each one.
 */

import {
  type BinId,
  type LoggedToken,
  type ReelData,
  binCounts,
  largestRemainder,
  render,
} from "./data.ts";
import { type ReelLayout, toStage } from "./layout.ts";
import { FIF_Y_BOTTOM, H06_GRID_P, H06_XB, H06_Y0, fifthOrigin, h06Y, binX } from "./states.ts";
import { DURATION } from "./motion.ts";

export type Role = "numeral" | "claim" | "label" | "unit" | "source" | "take" | "title" | "sub" | "brand";
export type World = "paper" | "ink";
export type Tone = "text" | "muted" | "accent";
export type EnterKind = "slam" | "slat" | "snap";

export interface Word {
  readonly s: string;
  /** Second at which a take word appears (take items only). */
  readonly at?: number;
}

export interface TextItem {
  readonly key: string;
  readonly role: Role;
  readonly world: World;
  readonly tone: Tone;
  readonly lines: readonly (readonly Word[])[];
  readonly x: number;
  readonly y: number;
  readonly fs: number;
  readonly lh: number;
  readonly weight: number;
  readonly enter: EnterKind;
  /** Second the item starts and how long it stays before it is wiped out. */
  readonly tIn: number;
  readonly dur: number;
  /** [line, word, second]: the word that flips to Mennige and when. */
  readonly accent?: readonly [number, number, number];
  /** Paper knock-out behind the text where it sits over squares. */
  readonly knockout?: boolean;
  readonly tokens: readonly LoggedToken[];
}

const words = (line: string): Word[] => line.split(" ").map((s) => ({ s }));

/** Rough advance of a string in em for Figtree ExtraBold, to place numeral parts. */
export function advanceEm(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") w += 0.6;
    else if (ch === "," || ch === ".") w += 0.29;
    else if (ch === "%") w += 0.9;
    else if (ch === "×") w += 0.62;
    else if (ch === " " || ch === " ") w += 0.27;
    else w += 0.56;
  }
  return w;
}

export function buildCopy(data: ReelData, layout: ReelLayout): TextItem[] {
  const items: TextItem[] = [];
  const L = layout;
  const wide = L.format === "wide";

  const numeral = (
    key: string,
    template: string,
    tIn: number,
    dur: number,
    tone: Tone,
    world: World = "paper",
  ): TextItem => {
    const { text, tokens } = render(data, template);
    const fs = Math.min(L.numeral.fs, (L.numeral.maxW * 0.97) / advanceEm(text));
    return {
      key, role: "numeral", world, tone, lines: [[{ s: text }]],
      x: L.numeral.x, y: L.numeral.y + (L.numeral.fs - fs) * 0.62, fs, lh: L.numeral.lh * (fs / L.numeral.fs),
      weight: 800, enter: "slam", tIn, dur, tokens,
    };
  };

  const claim = (
    key: string,
    templates: readonly string[],
    tIn: number,
    dur: number,
    accent: readonly [number, number, number],
    world: World = "paper",
  ): TextItem => {
    const tokens: LoggedToken[] = [];
    const lines = templates.map((tpl) => {
      const r = render(data, tpl);
      tokens.push(...r.tokens);
      return words(r.text);
    });
    return {
      key, role: "claim", world, tone: "text", lines, x: L.claim.x, y: L.claim.y, fs: L.claim.fs,
      lh: L.claim.lh, weight: 700, enter: "slat", tIn, dur, accent, tokens,
    };
  };

  const small = (
    key: string,
    role: "unit" | "source",
    templates: readonly string[],
    tIn: number,
    dur: number,
    world: World = "paper",
  ): TextItem => {
    const box = role === "unit" ? L.unit : L.source;
    const tokens: LoggedToken[] = [];
    const lines = templates.map((tpl) => {
      const r = render(data, tpl);
      tokens.push(...r.tokens);
      return words(r.text);
    });
    return {
      key, role, world, tone: "muted", lines, x: box.x, y: box.y, fs: box.fs, lh: box.lh,
      weight: role === "unit" ? 600 : 500, enter: "slat", tIn, dur, tokens,
    };
  };

  /** Direct label at a point of the virtual field region. */
  const label = (
    key: string,
    template: string,
    vx: number,
    vy: number,
    tIn: number,
    dur: number,
    opts: { world?: World; tone?: Tone; knockout?: boolean } = {},
  ): TextItem => {
    const r = render(data, template);
    const [x, y] = toStage(L, vx, vy);
    return {
      key, role: "label", world: opts.world ?? "paper", tone: opts.tone ?? "text",
      lines: [words(r.text)], x, y, fs: L.label.fs, lh: L.label.fs * 1.2, weight: 700,
      enter: "snap", tIn, dur, knockout: opts.knockout, tokens: r.tokens,
    };
  };

  /* ---- numerals */
  items.push(
    numeral("n-lost", "{{h05.sharePct:pct0}}", 1.0, 4.7, "accent"),
    numeral("n-ratio", "{{h01.ratio:x0}}", 6.45, 1.8, "accent"),
    numeral("n-edges-raw", "{{h01.network.edgesRaw:int}}", 8.8, 1.0, "text"),
    numeral("n-edges-equal", "{{h01.network.edgesEqual:int}}", 10.25, 0.7, "accent"),
    numeral("n-tech-a", "{{h02.techAPct:num0}}", 13.95, 2.0, "accent"),
    numeral("n-consult", "{{h03.consult.pct:pct1}}", 16.6, 1.3, "text"),
    numeral("n-firm", "{{h03.firm.pct:pct2}}", 18.5, 1.05, "accent"),
    numeral("n-cond", "{{h03.cond.ratio:x0}}", 20.0, 1.0, "accent"),
    numeral("n-top-a", "{{h06.topA:x2}}", 21.7, 1.45, "accent"),
    numeral("n-top-b", "{{h06.topB:x2}}", 23.6, 0.8, "accent"),
  );
  {
    // "35 bis 49": the 49 slams in beside the 35 at the definition switch.
    const a = items.find((i) => i.key === "n-tech-a") as TextItem;
    const aw = advanceEm(a.lines[0]?.[0]?.s ?? "") * a.fs;
    const bisFs = Math.round(a.fs * 0.2);
    const bisX = a.x + aw + a.fs * 0.1;
    const b = render(data, "{{h02.techBPct:num0}}");
    const bisW = advanceEm("bis") * bisFs;
    items.push(
      {
        key: "n-bis", role: "numeral", world: "paper", tone: "text", lines: [[{ s: "bis" }]],
        x: bisX, y: a.y + a.fs * 0.5, fs: bisFs, lh: bisFs * 1.1, weight: 700, enter: "snap",
        tIn: 15.2, dur: 0.8, tokens: [],
      },
      {
        key: "n-tech-b", role: "numeral", world: "paper", tone: "accent", lines: [[{ s: b.text }]],
        x: bisX + bisW + a.fs * 0.1, y: a.y, fs: a.fs, lh: a.lh, weight: 800, enter: "slam",
        tIn: 15.2, dur: 0.8, tokens: b.tokens,
      },
    );
  }

  /* ---- claims */
  items.push(
    claim("c-twice", ["Zweimal", "gemessen."], 29.75, 2.5, [0, 0, 1.45]),
    claim("c-lost", ["Fast jeder zweite", "KI-Treffer fehlt im", "zweiten Scan."], 3.05, 2.65, [1, 2, 5.2]),
    claim("c-text", ["Wer viel schreibt,", "schreibt KI."], 6.5, 1.8, [1, 1, 7.3]),
    claim("c-half", ["Bei gleicher Textmenge", "bleibt knapp die Hälfte", "der Zusammenhänge."], 8.75, 2.1, [1, 3, 9.9]),
    claim("c-jobs", ["Von {{h02.blocks:int}} Anzeigen", "sind {{h02.techAPct:num0}} bis {{h02.techBPct:num0}}", "technische Stellen."], 11.45, 4.4, [2, 0, 14.95]),
    claim("c-names-a", ["Berater nennen", "ChatGPT."], 16.6, 1.3, [1, 0, 17.3]),
    claim("c-names-b", ["Firmen", "fast nie."], 18.5, 1.05, [1, 1, 19.1]),
    claim("c-base", ["Gleiche Basis:", "etwa {{h03.cond.ratio:num0}}-fach."], 20.0, 1.0, [1, 1, 20.45]),
    claim("c-lottery", ["Jede Regionsrangliste", "ist halb Zufall."], 21.55, 1.79, [1, 2, 22.95]),
  );

  /* ---- unit lines (the field's unit, always visible under it) and sources */
  items.push(
    small("u-hook", "unit", ["1 Quadrat = 1 Website"], 29.85, 2.4),
    small("u-bar", "unit", ["Balken = {{h05.of:int}} Websites mit KI-Wort"], 3.1, 2.6, "ink"),
    small("u-pages", "unit", ["1 Quadrat = {{h01.perSquare:int}} Startseiten"], 6.4, 1.95),
    small("u-net", "unit", ["1 Quadrat = 1 Merkmal der Startseite"], 8.7, 2.15),
    small("u-ads", "unit", ["1 Quadrat = rund {{h02.perBlock:int}} Anzeigen"], 11.4, 4.5),
    small("u-consult", "unit", ["1 Quadrat = 1 Berater-Startseite"], 16.55, 1.5),
    small("u-firms", "unit", ["1 Quadrat = {{h03.firm.perSquare:int}} Startseiten"], 18.5, 1.05),
    small("u-cond", "unit", ["1 Quadrat = 1 Startseite mit KI-Wort"], 20.0, 1.0),
    small("u-kreise", "unit", ["1 Quadrat = 1 Kreis"], 21.45, 2.9),
    small("s-hook", "source", ["{{h05.pairs:int}} Websites, zweimal gescannt.", "{{h05.days:int}} Tage Abstand. {{h05.of:int}} mit KI-Wort", "im ersten Scan."], 29.85, 2.4),
    small("s-lost", "source", ["{{h05.lost:int}} von {{h05.of:int}} fehlen im zweiten Scan.", "Unsicherheit: {{h05.ciLoPct:int}} bis {{h05.ciHiPct:pct0}}."], 3.1, 2.6),
    small("s-text", "source", ["{{h01.n:int}} Startseiten mit eigener Domain,", "Scan {{h01.window:ymRange}}. Zusammenhang,", "keine Ursache. Haupttext der Startseite."], 6.4, 1.95),
    small("s-net", "source", ["{{h01.network.features:int}} Merkmale, {{h01.n:int}} Seiten.", "Linie = mindestens doppelt so oft zusammen.", "Textmenge kann selbst Ursache sein."], 8.7, 2.15),
    small("s-ads", "source", ["{{h02.raw:int}} Anzeigen mit KI-Wort oder Data", "Scientist im Titel, {{h02.window:ymRange}}.", "Gleiche Stelle = gleiche Firma und Titel."], 11.4, 4.5),
    small("s-consult", "source", ["{{h03.consult.n:int}} Berater-Startseiten, {{h03.consult.window:ymRange}}.", "Berater sind auf KI ausgewählt."], 16.55, 1.5),
    small("s-firms", "source", ["{{h03.firm.n:int}} Firmen-Startseiten, {{h03.firm.window:ymRange}}.", "Andere Auswahl: Quote nicht direkt", "vergleichbar."], 18.5, 1.05),
    small("s-cond", "source", ["Nur mit KI-Wort: {{h03.cond.consult.k:int}} von {{h03.cond.consult.n:int}} Beratern,", "{{h03.cond.firm.k:int}} von {{h03.cond.firm.n:int}} Firmen.", "Firmenebene: wird vom Rescan geprüft."], 20.0, 1.0),
    small("s-kreise", "source", ["{{h06.kreise:int}} Kreise mit mindestens {{h06.minFirms:int}} Firmen,", "{{h06.firms:int}} Firmen, zufällig halbiert.", "Wird mit geprüften Websites neu gerechnet."], 21.45, 2.9),
    small("s-take", "source", ["{{book.heroes:int}} Befunde zu {{book.firms:int}} Firmen", "mit eigener Domain."], 25.2, 1.95, "ink"),
    small("s-end", "source", ["Etwa {{book.urlMatchPct:pct0}} der Firma-Website-Paare stimmen", "({{book.urlMatchLoPct:int}} bis {{book.urlMatchHiPct:pct0}}). Stand {{book.asOf:ym}}, Rescan geplant."], 28.3, 0.95),
  );

  /* ---- direct labels (positions in the virtual field region) */
  const net = data.h01.network;
  const ki = net.nodes.findIndex((n) => n.ki);
  const kiNode = net.nodes[ki] as (typeof net.nodes)[number];
  const sx = (540 - 72) / net.space[0];
  const sy = (292 - 28) / net.space[1];
  const a = largestRemainder(binCounts(data.h02.a), 100);
  const b = largestRemainder(binCounts(data.h02.b), 100);
  const binLabel = (bi: number, id: BinId, word: string, vy: number, tIn: number, dur: number, dx = 0): void => {
    const first = a[bi] as number;
    const second = b[bi] as number;
    const flip = 15.5;
    const mk = (n: number, start: number, len: number, key: string): TextItem => ({
      key, role: "label", world: "paper", tone: "text",
      lines: [[{ s: word }, { s: String(n) }]], x: toStage(L, binX(bi) + dx, vy)[0], y: toStage(L, binX(bi) + dx, vy)[1],
      fs: L.label.fs, lh: L.label.fs * 1.2, weight: 700, enter: "snap", tIn: start, dur: len,
      tokens: [{ path: `h02.${id}#squares`, kind: "int", s: String(n) }],
    });
    items.push(mk(first, tIn, flip - 0.25 - tIn, `l-${id}-a`), mk(second, flip, tIn + dur - flip, `l-${id}-b`));
  };
  binLabel(0, "dup", "doppelt", 84, 13.25, 2.75);
  binLabel(5, "tech", "Technik", 48, 14.5, 1.5, -34);

  items.push(
    label("l-lost", "{{h05.lost:int}} von {{h05.of:int}}", 36, SLAT_LABEL_Y, 3.3, 2.3),
    label("l-ci", "{{h05.ciLoPct:int}} bis {{h05.ciHiPct:pct0}}", 36 + (540 - 72) * (data.h05.ciLoPct / 100), SLAT_CI_Y, 4.6, 1.1),
    label("l-fifth-lo", "{{h01.fifths.0.pct:pct2}}", fifthOrigin(0), -22, 7.95, 0.4),
    label("l-fifth-hi", "{{h01.fifths.4.pct:pct2}}", fifthOrigin(4) - 10, -22, 7.95, 0.4),
    label("l-ki", "KI-Wort", 36 + kiNode.x * sx + 12, 12 + kiNode.y * sy - 20, 9.3, 1.6, { knockout: true }),
    label("l-consult", "Berater {{h03.consult.k:int}}", 36, 176, 17.7, 0.35, { knockout: true }),
    label("l-firms", "Firmen {{h03.firm.squares:dec1}}", 36, 176, 18.9, 0.65, { knockout: true }),
    label("l-cond", "Firmen mit KI-Wort {{h03.cond.firm.k:int}}", 36, 176, 20.35, 0.65, { knockout: true }),
    label("l-half-a", "Hälfte A", 36, H06_Y0 - 10 * H06_GRID_P - 30, 21.9, 2.4, { knockout: false }),
    label("l-half-b", "Hälfte B", H06_XB, H06_Y0 - 10 * H06_GRID_P - 30, 21.9, 2.4),
    label("l-top", "zehn Spitzenkreise", 36 + 10 * H06_GRID_P + 12, h06Y(data.h06.topA) - 14, 22.0, 2.2),
    label("l-mean", "Durchschnitt", H06_XB, h06Y(data.h06.bandLo) + 8, 22.35, 2.05),
  );
  void FIF_Y_BOTTOM;

  /* ---- takeaway on ink, word by word */
  const takeWords = ["Frag", "immer:", "gemessen", "womit?"];
  const at = [25.25, 25.6, 25.95, 26.3];
  const takeLines: Word[][] = wide
    ? [
        [{ s: "Frag", at: at[0] }, { s: "immer:", at: at[1] }],
        [{ s: "gemessen", at: at[2] }, { s: "womit?", at: at[3] }],
      ]
    : takeWords.map((s, i) => [{ s, at: at[i] }]);
  L.take.forEach((box, li) => {
    items.push({
      key: `take-${li}`, role: "take", world: "ink", tone: "text", lines: [takeLines[li] as Word[]],
      x: box.x, y: box.y, fs: box.fs, lh: box.lh, weight: 800, enter: "snap", tIn: 25.2, dur: 1.95,
      accent: li === L.take.length - 1 ? [0, (takeLines[li] as Word[]).length - 1, 26.7] : undefined,
      tokens: [],
    });
  });

  /* ---- end card */
  const e = L.end;
  items.push(
    {
      key: "end-title", role: "title", world: "paper", tone: "text", lines: [words("Von außen"), words("gesehen")],
      x: e.title.x, y: e.title.y, fs: e.title.fs, lh: e.title.lh, weight: 800, enter: "slam", tIn: 27.95, dur: 1.3,
      tokens: [],
    },
    {
      key: "end-sub", role: "sub", world: "paper", tone: "muted", lines: [words("Quellen und Grenzen im Buch")],
      x: e.sub.x, y: e.sub.y, fs: e.sub.fs, lh: e.sub.lh, weight: 600, enter: "slat", tIn: 28.4, dur: 0.85,
      tokens: [],
    },
    {
      key: "end-brand", role: "brand", world: "paper", tone: "accent", lines: [words("loehrning.ai")],
      x: e.brand.x, y: e.brand.y, fs: e.brand.fs, lh: e.brand.lh, weight: 800, enter: "snap", tIn: 28.75, dur: 0.5,
      tokens: [],
    },
  );

  void DURATION;
  return separateMain(capEmptyBeats(items));
}

/**
 * No beat is ever empty for long: between two main texts (numeral, claim, take,
 * title) at most 0.4 s of bare squares, so the film has no dead frame. The
 * three longer gaps of the first cut are closed by starting the next text a
 * little earlier or holding the last one a little longer.
 */
const EARLIER: ReadonlySet<string> = new Set(["n-ratio", "c-text", "u-pages", "s-text"]);
const LATER_START: ReadonlySet<string> = new Set(["end-title", "end-sub", "end-brand"]);

function capEmptyBeats(items: TextItem[]): TextItem[] {
  return items.map((it) => {
    if (EARLIER.has(it.key)) return { ...it, tIn: it.tIn - 0.15, dur: it.dur + 0.15 };
    if (LATER_START.has(it.key)) return { ...it, tIn: it.tIn - 0.2, dur: it.key === "end-title" ? it.dur + 0.45 : it.dur };
    if (it.key === "n-top-b") return { ...it, dur: it.dur + 0.25 };
    return it;
  });
}

/** Virtual positions below the slat for its labels. */
const SLAT_LABEL_Y = 118 + 28 + 10;
const SLAT_CI_Y = 118 - 70;

/** Seconds of clear paper between an exiting numeral or claim and the next one in the same place. */
export const MAIN_GAP = 0.06;
/** A text fades out for this long after its hold (mirrors text.ts). */
const EXIT_FADE = 0.2;

/**
 * No two numerals (or two claims) of the same place overlap in time: a text leaves completely
 * (opacity 0) MAIN_GAP before the next one in its place enters, so no ghost of the previous
 * claim sits under the new numeral. Items that enter together (a numeral and its claim) are untouched.
 */
export function separateMain(items: TextItem[]): TextItem[] {
  const out = items.map((it) => ({ ...it }) as { -readonly [K in keyof TextItem]: TextItem[K] });
  for (const role of ["numeral", "claim"] as const) {
    const same = out.filter((i) => i.role === role).sort((a, b) => a.tIn - b.tIn);
    for (let a = 0; a < same.length; a += 1) {
      const first = same[a] as (typeof out)[number];
      for (let b = a + 1; b < same.length; b += 1) {
        const next = same[b] as (typeof out)[number];
        const here = Math.abs(next.x - first.x) < 1 && Math.abs(next.y - first.y) < 1;
        if (!here || next.tIn - first.tIn < 0.3) continue;
        const room = next.tIn - MAIN_GAP - EXIT_FADE - first.tIn;
        if (first.dur > room) first.dur = Math.max(0.5, room);
        break;
      }
    }
  }
  return out;
}
