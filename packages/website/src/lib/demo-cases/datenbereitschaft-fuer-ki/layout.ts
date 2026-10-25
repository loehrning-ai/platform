/**
 * Where every mark of the scene sits at one value of p: the steps and the
 * ground under them, their labels, the two stamps and the label of the start
 * rung. Pure, so a test can prove that nothing lands on anything else.
 * Labels and stamps try their places in order of preference and take the
 * first one that is free; a stamp never sits on a bar.
 */
import { estimateEm, type Geo } from "./geometry";
import type { Scene } from "./scene";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Bar labels and the rung label: 14 px bold, shrinking to 12 where a bar is narrow. */
export const FONT = 14;
export const MIN_FONT = 12;

export const overlaps = (a: Rect, b: Rect, pad = 0): boolean =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** Two lines for a stamp: split at the space nearest the middle. */
export function stampLines(text: string): readonly string[] {
  const words = text.split(" ");
  if (words.length < 2 || text.length <= 8) return [text];
  let best = 1;
  let bestGap = Infinity;
  for (let cut = 1; cut < words.length; cut += 1) {
    const gap = Math.abs(words.slice(0, cut).join(" ").length - words.slice(cut).join(" ").length);
    if (gap < bestGap) {
      best = cut;
      bestGap = gap;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** Box of a stamp: about 9 units a letter, 18 a line, padded. */
export const stampSize = (lines: readonly string[], pad = 12): { readonly w: number; readonly h: number } => ({
  w: Math.max(...lines.map((line) => line.length)) * 9 + pad,
  h: lines.length * 18 + 10,
});

export interface BarLayout {
  readonly center: number;
  /** The solid ground under the step, if there is any. */
  readonly pillar: Rect | null;
  /** The step: exactly as tall as its change. */
  readonly step: Rect;
  /** A negative step hanging from the base line, with nothing under it. */
  readonly hanging: boolean;
  /** The y of the level line (the end of the step). */
  readonly levelY: number;
  /** The y of the highest point of the whole bar. */
  readonly topY: number;
  readonly bottomY: number;
}

export interface LabelLayout {
  readonly text: string;
  /** Centre x and baseline y of the text. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly inside: boolean;
  readonly rect: Rect;
}

export interface StampLayout {
  readonly lines: readonly string[];
  readonly rect: Rect;
}

export interface RungLabel {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  /** 14 px, or 12 where the bigger one would leave the stamp "passt" no free place. */
  readonly size: number;
  readonly rect: Rect;
}

/** The number of a downward step, set on the hatched block itself (a pill) or, where it is too thin, above the bar. */
export interface StepNote {
  readonly index: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** The pill behind the text when it stands on the block. */
  readonly pill: Rect | null;
  readonly rect: Rect;
}

/** The two tones named once, on one bar: the ground ("Stand davor") and the step ("Stufe"). */
export interface ToneLayout {
  readonly index: number;
  readonly ground: { readonly lines: readonly string[]; readonly x: number; readonly y: number; readonly size: number };
  readonly step: { readonly text: string; readonly x: number; readonly y: number; readonly size: number };
  /** The boxes of the two names, so a test can prove they touch no other text. */
  readonly rects: readonly Rect[];
}

export interface Layout {
  readonly y: (value: number) => number;
  readonly bars: readonly BarLayout[];
  readonly barWidth: number;
  readonly labels: readonly LabelLayout[];
  readonly stepNotes: readonly StepNote[];
  readonly tones: ToneLayout | null;
  readonly before: StampLayout;
  readonly after: StampLayout;
  readonly rungY: number | null;
  readonly rungLabel: RungLabel | null;
}

export interface LayoutInput {
  readonly geo: Geo;
  readonly scene: Scene;
  /** The number as the chart prints it: whole, or in the short "k" form where there is no room. */
  readonly label: (value: number, short: boolean) => string;
  /** What the unknown first change prints. */
  readonly unknown: string;
  /** The start level to mark with a dotted rung, or null where there is none to mark. */
  readonly startLevel: number | null;
  readonly startPrefix: string;
  readonly stampBefore: string;
  readonly stampAfter: string;
  /** The change of a downward step as it is printed on its block ("−19.960") or short ("−19,96k"). */
  readonly stepLabel: (value: number, short: boolean) => string;
  /** The names of the two tones, printed once on one bar. */
  readonly toneGround: string;
  readonly toneStep: string;
}

const textWidth = (text: string, size: number): number => Math.ceil(estimateEm(text) * size * 1.06);
const labelBox = (x: number, baseline: number, w: number, size: number): Rect => ({ x: x - w / 2, y: baseline - size, w, h: size + 3 });

export function layoutAt({ geo, scene, label, unknown, startLevel, startPrefix, stampBefore, stampAfter, stepLabel, toneGround, toneStep }: LayoutInput): Layout {
  const { X0, X1, Y0, Y1 } = geo;
  const { lo, hi, base, steps, pillars } = scene;
  const y = (value: number) => Y1 - ((value - lo) / (hi - lo || 1)) * (Y1 - Y0);
  const count = Math.max(1, steps.length);
  const slot = (X1 - X0) / count;
  const barWidth = Math.min(geo.maxBar, slot * 0.86);
  const center = (index: number) => X0 + slot * (index + 0.5);
  const yBase = y(base);

  const rawRung = scene.startRung > 0 && startLevel !== null ? y(startLevel) : null;
  // The rung only exists while it is inside the plot.
  const rungY = rawRung !== null && rawRung >= Y0 + 4 && rawRung <= Y1 - 4 ? rawRung : null;

  const bars: BarLayout[] = steps.map((step, index) => {
    const cx = center(index);
    const x = cx - barWidth / 2;
    const top = y(Math.max(step.from, step.to));
    const bottom = y(Math.min(step.from, step.to));
    const pillarTop = pillars[index];
    const pillar = pillarTop === null || pillarTop === undefined ? null : { x, y: y(pillarTop), w: barWidth, h: Math.max(0, yBase - y(pillarTop)) };
    return {
      center: cx,
      pillar,
      step: { x, y: top, w: barWidth, h: Math.max(0, bottom - top) },
      hanging: pillar === null && step.to < base - 1e-9,
      levelY: y(step.to),
      topY: top,
      bottomY: pillar ? pillar.y + pillar.h : bottom,
    };
  });

  const labels: LabelLayout[] = scene.labels.map((value, index) => {
    const bar = bars[index] as BarLayout;
    const x = bar.center;
    const unknownOne = scene.unknownFirst && index === 0 && scene.labelsOf === "change";
    const whole = unknownOne ? unknown : label(value, false);
    const em = estimateEm(whole) * 1.06;
    const sizeIn = Math.min(FONT, Math.floor((barWidth - 4) / em));
    const sizeOut = Math.max(MIN_FONT, Math.min(FONT, Math.floor((slot - 6) / em)));
    const wholeFits = textWidth(whole, sizeOut) <= slot - 4;
    const made = (text: string, size: number, baseline: number, inside: boolean): LabelLayout => ({
      text,
      x,
      y: baseline,
      size,
      inside,
      rect: labelBox(x, baseline, textWidth(text, size), size),
    });
    const stepDown = (steps[index]?.to ?? 0) < (steps[index]?.from ?? 0);
    if (scene.labelsOf === "level" && !unknownOne && stepDown && value >= 0 && sizeIn >= MIN_FONT && bar.pillar) {
      // After a step down the level line is the top of the ground: the number sits wholly inside the
      // Aubergine, right under the hatched step, in the sand of the page. A step up keeps it above the bar.
      if (bar.pillar.h >= sizeIn + 14) return made(whole, sizeIn, bar.step.y + bar.step.h + sizeIn + 6, true);
    }
    const text = wholeFits ? whole : label(value, true);
    const size = wholeFits ? sizeOut : MIN_FONT;
    if (bar.hanging && value < 0) return made(text, size, Math.min(bar.bottomY + size + 4, Y1 - 4), false);
    return made(text, size, Math.max(bar.topY - 7, Y0 + size), false);
  });

  // Two outside labels that would touch: the right one steps up by a line.
  for (let index = 1; index < labels.length; index += 1) {
    const here = labels[index] as LabelLayout;
    const before = labels[index - 1] as LabelLayout;
    if (here.inside || !overlaps(here.rect, before.rect, 1)) continue;
    const baseline = Math.max(here.y - here.size - 3, Y0 + here.size);
    labels[index] = { ...here, y: baseline, rect: labelBox(here.x, baseline, here.rect.w, here.size) };
  }

  // A downward step carries its own number: on the block when the block is tall enough, else above the bar.
  const stepNotes: StepNote[] = [];
  if (scene.labelsOf === "level") {
    steps.forEach((step, index) => {
      const bar = bars[index] as BarLayout;
      if (!(step.to < step.from) || (scene.unknownFirst && index === 0)) return;
      const change = step.to - step.from;
      const whole = stepLabel(change, false);
      const fits = textWidth(whole, MIN_FONT) <= barWidth - 6;
      const text = fits ? whole : stepLabel(change, true);
      const size = fits ? Math.min(FONT - 1, Math.max(MIN_FONT, Math.floor((barWidth - 8) / (estimateEm(text) * 1.06)))) : MIN_FONT;
      const w = textWidth(text, size);
      if (bar.step.h >= size + 8) {
        const cy = bar.step.y + bar.step.h / 2;
        const pill: Rect = { x: bar.center - (w + 8) / 2, y: cy - (size + 6) / 2, w: w + 8, h: size + 6 };
        stepNotes.push({ index, text, x: bar.center, y: cy + size * 0.36, size, pill, rect: pill });
      } else {
        const own = labels[index];
        const above = own && !own.inside ? own.rect.y : bar.topY;
        const baseline = Math.max(above - 6, Y0 + size);
        stepNotes.push({ index, text, x: bar.center, y: baseline, size, pill: null, rect: labelBox(bar.center, baseline, w, size) });
      }
    });
  }

  // The two tones, named once: on the bar with the longest step up that has room for both words.
  // All bars that could carry them, best first; the start rung's label may push them to the next one.
  const toneOptions: ToneLayout[] = [];
  if (scene.labelsOf === "level" && scene.lift === 1) {
    const lines = stampLines(toneGround);
    const size = Math.min(FONT - 1, Math.floor((barWidth - 8) / (Math.max(...lines.map((line) => estimateEm(line))) * 1.06)));
    const picks = bars
      .map((bar, index) => ({ bar, index }))
      .filter(({ bar, index }) => (steps[index]?.to ?? 0) > (steps[index]?.from ?? 0) && bar.pillar !== null && size >= 11)
      .filter(({ bar }) => bar.step.h >= size + 8 && (bar.pillar?.h ?? 0) >= lines.length * (size + 3) + 14 && textWidth(toneStep, size) <= barWidth - 6)
      .sort((a, b) => b.bar.step.h - a.bar.step.h);
    for (const pick of picks) {
      const pillarTop = (pick.bar.pillar as Rect).y;
      const cx = pick.bar.center;
      const groundY = pillarTop + size + 8;
      const stepY = pick.bar.step.y + pick.bar.step.h / 2 + size * 0.36;
      const groundW = Math.max(...lines.map((line) => textWidth(line, size)));
      const groundRect: Rect = { x: cx - groundW / 2, y: groundY - size, w: groundW, h: (lines.length - 1) * (size + 3) + size + 3 };
      const rects = [groundRect, labelBox(cx, stepY, textWidth(toneStep, size), size)];
      // A label held inside the frame can reach into a bar: the tones never sit on it.
      const taken = [...labels.map((entry) => entry.rect), ...stepNotes.map((note) => note.rect)];
      if (rects.some((rect) => taken.some((other) => overlaps(rect, other, 1)))) continue;
      toneOptions.push({ index: pick.index, ground: { lines, x: cx, y: groundY, size }, step: { text: toneStep, x: cx, y: stepY, size }, rects });
    }
  }
  let tones: ToneLayout | null = toneOptions[0] ?? null;

  const barRects = bars.flatMap((bar) => (bar.pillar ? [bar.pillar, bar.step] : [bar.step]));
  const obstacles: Rect[] = [...barRects, ...labels.map((entry) => entry.rect), ...stepNotes.filter((note) => note.pill === null).map((note) => note.rect)];
  // The grid lines are thin bands a stamp should not straddle (it may, as a last resort).
  const bands: Rect[] = scene.ticks.map((tick) => ({ x: X0, y: y(tick) - 3, w: X1 - X0, h: 6 }));
  const free = (rect: Rect, against: readonly Rect[]) =>
    rect.x >= X0 + 1 && rect.x + rect.w <= X1 + 2 && rect.y >= Y0 - 2 && rect.y + rect.h <= Y1 && !against.some((other) => overlaps(rect, other, 2));

  const boxAt = (x: number, bottom: number, size: { readonly w: number; readonly h: number }): Rect => ({ x, y: bottom - size.h, w: size.w, h: size.h });
  type Places = (size: { readonly w: number; readonly h: number }) => Rect[];
  const optionsOf = (text: string, places: Places) =>
    [stampLines(text), [text]]
      .filter((lines, i, all) => i === 0 || lines.length !== all[0]?.length)
      .map((lines) => ({ lines, candidates: places(stampSize(lines)) }));
  /** A stamp tries two lines first, then one; for each, its preferred places in order, clear of the grid first. Null where no place is free. */
  const placeFree = (text: string, places: Places, against: readonly Rect[]): StampLayout | null => {
    const options = optionsOf(text, places);
    for (const avoid of [[...against, ...bands], against]) {
      const hit = options.find((option) => option.candidates.some((rect) => free(rect, avoid)));
      if (hit) return { lines: hit.lines, rect: hit.candidates.find((rect) => free(rect, avoid)) as Rect };
    }
    return null;
  };
  const place = (text: string, places: Places, against: readonly Rect[]): StampLayout => {
    const found = placeFree(text, places, against);
    if (found) return found;
    const chosen = optionsOf(text, places)[0] as ReturnType<typeof optionsOf>[number];
    return { lines: chosen.lines, rect: chosen.candidates[0] as Rect };
  };

  // "Stand nie < 0": over the first column that really goes below zero, standing on the zero line.
  const negative = Math.max(0, steps.findIndex((step) => step.to < step.from));
  const column = bars[negative];
  const columnLabel = labels[negative];
  const before = place(
    stampBefore,
    (size) => {
      const bottom = column
        ? (column.hanging ? yBase : Math.min(column.topY, columnLabel && !columnLabel.inside ? columnLabel.rect.y : column.topY)) - 6
        : Y0 + size.h;
      const x = column ? Math.max(X0 + 3, Math.min(column.center - size.w / 2, X1 - size.w - 2)) : X0 + 3;
      return [boxAt(x, bottom, size), boxAt(X0 + 3, Y0 + size.h, size), boxAt(X1 - size.w - 2, Y0 + size.h, size)];
    },
    obstacles,
  );
  const beforeRect = before.rect;

  // "passt": in free air above the bars and the labels, else above the rung's label, clear of it and of the grid.
  const firstBar = bars[0];
  const afterPlaces =
    (rung: Rect | null): Places =>
    (size) => {
      const list: Rect[] = [];
      const xOver = (bar: BarLayout) => Math.max(X0 + 3, Math.min(bar.center - size.w / 2, X1 - size.w - 2));
      for (const index of [1, 0, 2]) {
        const bar = bars[index];
        if (!bar) continue;
        const own = labels[index];
        const above = Math.min(bar.topY, own && !own.inside ? own.rect.y : bar.topY) - 5;
        list.push(boxAt(xOver(bar), above, size));
      }
      if (rung) {
        for (const index of [1, 0, 2]) {
          const bar = bars[index];
          if (bar) list.push(boxAt(xOver(bar), rung.y - 4, size));
        }
      }
      list.push(boxAt(X0 + 4, Y0 + size.h + 1, size), boxAt(X1 - size.w - 2, Y0 + size.h + 1, size), boxAt(X0 + 4, (Y0 + Y1) / 2, size));
      return firstBar ? list : list.slice(-3);
    };

  // The rung's label stands on the rung: over the first bar (whose top is the start), else beside it.
  // It takes the nearest free place that still leaves "passt" a free place of its own; at 12 px if 14 cannot.
  let rungLabel: RungLabel | null = null;
  let after: StampLayout | null = null;
  if (rungY !== null && startLevel !== null) {
    const text = `${startPrefix} ${label(startLevel, false)}`;
    const against = [...obstacles, ...(scene.stampBefore > 0.5 ? [beforeRect] : [])];
    const near = [7, 9, 11, 13, 15, 17];
    const rowsAt = (size: number, far: boolean) =>
      far ? [rungY + size + 6, rungY - 7 - size - 4].map((baseline) => ({ baseline, size })) : near.map((lift) => ({ baseline: rungY - lift, size }));
    const rows = [...rowsAt(FONT, false), ...rowsAt(MIN_FONT, false), ...rowsAt(FONT, true)];
    const candidates = rows.flatMap(({ baseline, size }) => {
      const w = textWidth(text, size);
      const xs = [...bars.map((bar) => Math.max(X0 + 2, Math.min(bar.center - w / 2, X1 - w - 2))), X0 + 6, X1 - w - 2].filter((x) => x >= X0 + 1 && x + w <= X1 + 2);
      return xs.map((x) => ({ baseline, size, rect: { x, y: baseline - size, w, h: size + 3 } as Rect }));
    });
    const open = candidates.filter((entry) => free(entry.rect, against));
    // Where the rung runs through the bars there is no free air on it: then the label may stand on a
    // bar (its sand halo keeps it readable), but never on another text.
    const texts = [...labels.map((entry) => entry.rect), ...stepNotes.map((note) => note.rect), ...(scene.stampBefore > 0.5 ? [beforeRect] : [])];
    const onBars = [
      ...candidates.filter((entry) => !open.includes(entry) && free(entry.rect, [...texts, ...(tones ? tones.rects : [])])),
      // and only where no place keeps clear of the tones as well, they give way (to another bar, or out)
      ...candidates.filter((entry) => !open.includes(entry) && free(entry.rect, texts)),
    ];
    let picked = open[0] ?? onBars[0] ?? (candidates[0] as (typeof candidates)[number]);
    if (scene.canAfter) {
      for (const entry of [...open, ...onBars]) {
        const stamp = placeFree(stampAfter, afterPlaces(entry.rect), [...obstacles, entry.rect]);
        if (stamp) {
          picked = entry;
          after = stamp;
          break;
        }
      }
    }
    rungLabel = { text, x: picked.rect.x, y: picked.baseline, size: picked.size, rect: picked.rect };
    const rungRect = picked.rect;
    tones = toneOptions.find((option) => option.rects.every((rect) => !overlaps(rect, rungRect, 2))) ?? null;
  }
  after ??= place(stampAfter, afterPlaces(rungLabel?.rect ?? null), [...obstacles, ...(rungLabel ? [rungLabel.rect] : [])]);

  return {
    y,
    bars,
    barWidth,
    labels,
    stepNotes,
    tones,
    before,
    after,
    rungY,
    rungLabel,
  };
}
