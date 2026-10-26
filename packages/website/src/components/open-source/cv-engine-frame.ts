import {
  piecewise,
  smoothstep,
  type PiecewiseKeys,
} from "@/lib/open-source/specimen-clock";

/**
 * CV Engine's specimen, drawn. The build reads cv.yaml and inks one A4
 * sheet, exit 0. One more station pushes the last section off the page: the
 * view pulls back, a second sheet appears, the section jumps onto it and the
 * build stops with exit 1. A tighter layout pulls every line up, the section
 * jumps home, the view closes in again, exit 0. Every moving element is a
 * pure function of progress p in [0, 1]; the server renders p = 1. Values are
 * bars, never text, so no CV data shows. Geometry is in cqw of the square
 * stage, so one unit is the same distance across and down.
 */
export const CV_ENGINE_DURATION_S = 7;
/**
 * Clock progress to story progress, piecewise linear: data in runs quick, so
 * ink reaches the sheet within half a second and the overflow lands at
 * 2.8 s. Every key below is in story progress.
 */
const PACE = [[0, 0], [0.12, 0.15], [0.4, 0.47], [1, 1]] as const;
function story(p: number): number {
  for (let i = 1; i < PACE.length; i += 1) {
    const [c1, s1] = PACE[i];
    if (p <= c1) {
      const [c0, s0] = PACE[i - 1];
      return s0 + ((Math.max(p, c0) - c0) / (c1 - c0)) * (s1 - s0);
    }
  }
  return 1;
}
/** Chapter starts in clock progress: data in, page fills, overflow, layout. */
export const CHAPTER_P = [0, 0.12, 0.4, 0.728] as const;
/** Where "Noch eine Station" holds: two pages, the build has stopped. */
export const CV_ENGINE_TOY_P = 0.683;

export type Look = { transform?: string; opacity?: number; clipPath?: string };
export type CvEngineFrame = Readonly<Record<string, Look>>;

/** Page one (A4, 1 : 1.414), filling the stage right of the yaml column. */
export const PAGE = { x: 39.5, y: 8.5, w: 48, h: 67.9 } as const;
/** Page two sits right of page one, outside the stage until the view pulls back. */
export const TRAY_X = PAGE.x + PAGE.w + 4;
export const CV_ENGINE_JUMP_CQW = TRAY_X - PAGE.x;
/** The pulled-back view: both sheets fit beside the yaml column. */
const ZOOM = 0.67;
const ZOOM_X = 31 - ZOOM * PAGE.x;
const ZOOM_Y = (PAGE.y + PAGE.h / 2) * (1 - ZOOM);
/** How high a section arcs when it jumps between the sheets. */
const LIFT_CQW = 7;
/** The tight layout: every advance shrinks to 78 %. */
const TIGHT = 0.78;
/** Progress one jump between the sheets takes. */
const JUMP_P = 0.05;

/**
 * cv.yaml rows: key and value bar widths in cqw. Row EXTRA_ROW is the new
 * station; it is inserted mid-file, like the lines it adds mid-sheet.
 */
export const YAML_ROWS = [
  [7.5, 12], [9.5, 9], [7, 12.5], [10, 7.5], [7.5, 11], [9, 9.5], [9, 12.5],
  [7, 12], [9.5, 10], [7.5, 9], [9, 11],
] as const;
export const EXTRA_ROW = 6;
/** One row step in cqw; rows sit at their rest place, ROW_TOP. */
export const ROW_STEP = 6;
export const ROW_TOP = (i: number) => 10.5 + i * ROW_STEP;
/** A row the build has not read yet: there, but dim. */
const ROW_DIM = 0.28;

/**
 * Ink on page one, top to bottom: the name, sections of a heading and lines,
 * the five lines the new station inserts, and the last section, the one that
 * spills. Second value: bar width as a share of the sheet.
 */
type Role = "name" | "head" | "line" | "new" | "spillHead" | "spill" | "gap";
const ITEMS: readonly (readonly [Role, number])[] = [
  ["name", 0.55], ["head", 0.3], ["line", 0.86], ["line", 0.8], ["line", 0.72],
  ["gap", 0], ["head", 0.28], ["line", 0.84], ["line", 0.64],
  ["new", 0.78], ["new", 0.7], ["new", 0.74], ["new", 0.66], ["new", 0.52],
  ["gap", 0], ["head", 0.22], ["line", 0.82], ["line", 0.74],
  ["gap", 0], ["spillHead", 0.3], ["spill", 0.8], ["spill", 0.66],
];
const ADVANCE: Record<Role, number> = {
  name: 0.08, head: 0.055, spillHead: 0.055, line: 0.042, new: 0.042,
  spill: 0.042, gap: 0.03,
};
export const HEIGHT: Record<Role, number> = {
  name: 0.045, head: 0.032, spillHead: 0.032, line: 0.024, new: 0.024,
  spill: 0.024, gap: 0,
};
export const INK_COLOUR: Record<Role, string> = {
  name: "bg-[#121212]", head: "bg-[#121212]", line: "bg-[#827970]",
  new: "bg-[#827970]", spillHead: "bg-[#b73a15]", spill: "bg-[#b73a15]",
  gap: "",
};
const TOP = 0.07;

interface Bar {
  readonly role: Role;
  readonly width: number;
  /** Sheet fractions: before the insert, after it, after it laid out tight. */
  readonly full: number;
  readonly pushed: number;
  readonly tight: number;
  /** Position on page two (spilled bars only). */
  readonly page2: number;
  /** Fill order: page bars and inserted bars count separately. */
  readonly order: number;
  /** Place inside the spilled section, for the staggered jump. */
  readonly spillIndex: number;
}

function layout(withInsert: boolean, scale: number): number[] {
  const ys: number[] = [];
  let y = TOP;
  for (const [role] of ITEMS) {
    ys.push(y);
    if (role === "new" && !withInsert) continue;
    y += ADVANCE[role] * scale;
  }
  return ys;
}

export const CV_ENGINE_BARS: readonly Bar[] = (() => {
  const full = layout(false, 1);
  const pushed = layout(true, 1);
  const tight = layout(true, TIGHT);
  const spillStart = ITEMS.findIndex(([role]) => role === "spillHead");
  const counts = { page: 0, new: 0 };
  const bars: Bar[] = [];
  ITEMS.forEach(([role, width], i) => {
    if (role === "gap") return;
    bars.push({
      role,
      width,
      full: full[i],
      pushed: pushed[i],
      tight: tight[i],
      page2: TOP + full[i] - full[spillStart],
      order: role === "new" ? counts.new++ : counts.page++,
      spillIndex: i - spillStart,
    });
  });
  return bars;
})();

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const spills = (bar: Bar) => bar.role === "spill" || bar.role === "spillHead";

/** Where one bar of the page is at progress p, as a CSS transform. */
function barTransform(bar: Bar, p: number): string {
  const isNew = bar.role === "new";
  // Page ink starts while the rows are still being read.
  const fill = isNew ? 0.52 + bar.order * 0.012 : 0.06 + bar.order * 0.018;
  const scale = piecewise([[fill, 0], [fill + 0.03, 1]], p);
  const base = isNew ? bar.pushed : bar.full;
  let x = 0;
  let y: number;
  let lift = 0;
  if (spills(bar)) {
    const t1 = clamp01((p - (0.585 + bar.spillIndex * 0.012)) / JUMP_P);
    const t2 = clamp01((p - (0.87 + bar.spillIndex * 0.012)) / JUMP_P);
    const e1 = smoothstep(t1);
    const e2 = smoothstep(t2);
    x = CV_ENGINE_JUMP_CQW * (e1 - e2);
    lift = LIFT_CQW * 4 * (t1 * (1 - t1) + t2 * (1 - t2));
    y =
      t2 > 0
        ? lerp(bar.page2, bar.tight, e2)
        : t1 > 0
          ? lerp(bar.pushed, bar.page2, e1)
          : piecewise([[0.52, bar.full], [0.57, bar.pushed]], p);
  } else {
    y = piecewise(
      [[0.52, base], [0.57, bar.pushed], [0.83, bar.pushed], [0.89, bar.tight]],
      p,
    );
  }
  const dy = (y - base) * PAGE.h - lift;
  return `translate(${x.toFixed(3)}cqw,${dy.toFixed(3)}cqw) scaleX(${scale.toFixed(4)})`;
}

export function cvEngineFrame(clock: number): CvEngineFrame {
  const p = story(clock);
  const look: Record<string, Look> = {};
  // The new station: the rows below it make room, it slides into the gap on
  // a Mennige band and stays Mennige while the sheet runs to two pages.
  const room = piecewise([[0.47, 0], [0.5, 1]], p);
  const hot = piecewise([[0.49, 0], [0.51, 1], [0.9, 1], [0.93, 0]], p);
  YAML_ROWS.forEach((_, i) => {
    const extra = i === EXTRA_ROW;
    const read = i < EXTRA_ROW ? i : i - 1;
    const start = extra ? 0.49 : 0.01 + read * 0.012;
    const end = start + 0.04;
    const x = piecewise([[start, extra ? -9 : 1.6], [end, 0]], p);
    const y = i > EXTRA_ROW ? -ROW_STEP * (1 - room) : 0;
    look[`row${i}`] = {
      opacity: piecewise([[start, extra ? 0 : ROW_DIM], [end, 1]], p),
      transform: `translate(${x.toFixed(3)}cqw,${y.toFixed(3)}cqw)`,
    };
  });
  look.band = {
    opacity: hot,
    transform: `scaleX(${piecewise([[0.47, 0], [0.5, 1]], p).toFixed(4)})`,
  };
  look.hotValue = { opacity: hot };
  CV_ENGINE_BARS.forEach((bar, j) => {
    look[`bar${j}`] = { transform: barTransform(bar, p) };
  });
  // The view pulls back while the insert pushes the last section off the
  // sheet, and closes in again once the section is home.
  const zoom = piecewise([[0.5, 0], [0.555, 1], [0.935, 1], [0.985, 0]], p);
  look.paper = {
    transform: `translate(${(ZOOM_X * zoom).toFixed(3)}cqw,${(ZOOM_Y * zoom).toFixed(3)}cqw) scale(${(1 - (1 - ZOOM) * zoom).toFixed(4)})`,
  };
  // Page two exists only in the overflow and layout chapters: at rest there
  // is no empty outline that could read as a missing page.
  look.tray = { opacity: piecewise([[0.52, 0], [0.545, 1], [0.92, 1], [0.945, 0]], p) };
  const sheet2 = piecewise([[0.555, 0], [0.58, 1], [0.92, 1], [0.945, 0]], p);
  look.sheet2 = {
    opacity: sheet2,
    transform: `translateY(${((1 - sheet2) * 3).toFixed(3)}cqw)`,
  };
  // "1 Seite" waits for the first ink: an empty sheet has no page count.
  // The count is a hard cut, never a crossfade of two numbers.
  const twoPages = p >= 0.625 && p < 0.93;
  look.badge1 = {
    opacity: twoPages ? 0 : piecewise([[0.06, 0], [0.075, 1]], p),
  };
  look.badge2 = { opacity: twoPages ? 1 : 0 };
  const typed = (keys: PiecewiseKeys) =>
    `inset(0 ${piecewise(keys, p).toFixed(2)}% 0 0)`;
  // The build runs from the first frame and again for the new station;
  // between the runs the line is cleared. Two pages and exit 1 hold for a
  // full second before the fix is typed.
  const firstRun = p < 0.465;
  const gone = piecewise([[0.76, 1], [0.765, 0]], p);
  look.cmd1 = {
    clipPath: typed(firstRun ? [[0, 100], [0.04, 0]] : [[0.48, 100], [0.55, 0]]),
    opacity: gone,
  };
  look.exit1 = { opacity: Math.min(piecewise([[0.625, 0], [0.635, 1]], p), gone) };
  look.msg = { clipPath: typed([[0.64, 100], [0.7, 0]]), opacity: gone };
  look.cmd2 = { clipPath: typed([[0.77, 100], [0.83, 0]]) };
  look.exit0 = {
    opacity: firstRun
      ? piecewise([[0.345, 0], [0.355, 1]], p)
      : piecewise([[0.935, 0], [0.95, 1]], p),
  };
  return look;
}

export const CV_ENGINE_REST_FRAME = cvEngineFrame(1);
