import type { EaseId, Key, TileMotion, Track, TrackProp } from "./types";

/**
 * Sampling and CSS compilation of tile tracks (types.ts). `sample` is the one
 * definition of the motion; `compileSceneCss` writes the same curves as
 * keyframes. The last key of every track is also emitted as the base style, so
 * the still frame IS the end frame by construction.
 *
 * Import-free apart from types, so scripts/demo-tiles/build-css.mjs runs it
 * under Node type stripping.
 */

/** CSS easing per id. "snap" is the cone scene's overshoot (--hc-snap). */
export const EASE_CSS: Readonly<Record<EaseId, string>> = {
  linear: "linear",
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  snap: "cubic-bezier(0.2, 0.9, 0.25, 1.15)",
};

const BEZIER: Readonly<Record<EaseId, readonly [number, number, number, number] | null>> = {
  linear: null,
  ease: [0.2, 0.8, 0.2, 1],
  snap: [0.2, 0.9, 0.25, 1.15],
};

/** Value of a cubic-bezier easing at x in 0..1 (Newton steps, then bisection). */
function bezierAt([x1, y1, x2, y2]: readonly [number, number, number, number], x: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xAt = (t: number) => ((ax * t + bx) * t + cx) * t;
  const yAt = (t: number) => ((ay * t + by) * t + cy) * t;
  let low = 0;
  let high = 1;
  let t = x;
  for (let step = 0; step < 24; step += 1) {
    const error = xAt(t) - x;
    if (Math.abs(error) < 1e-6) break;
    if (error > 0) high = t;
    else low = t;
    t = (low + high) / 2;
  }
  return yAt(t);
}

export function easeAt(ease: EaseId | undefined, x: number): number {
  const curve = BEZIER[ease ?? "linear"];
  return curve ? bezierAt(curve, x) : x;
}

/** The value of a track at progress p (clamped to 0..1). */
export function sample(track: Track, p: number): number {
  const keys = track.keys;
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) throw new Error(`track ${track.id}/${track.prop} has no keys`);
  const at = Math.min(1, Math.max(0, p));
  if (at <= first[0]) return first[1];
  if (at >= last[0]) return last[1];
  for (let index = 1; index < keys.length; index += 1) {
    const to = keys[index] as Key;
    if (at <= to[0]) {
      const from = keys[index - 1] as Key;
      const span = to[0] - from[0];
      const local = span === 0 ? 1 : (at - from[0]) / span;
      return from[1] + (to[1] - from[1]) * easeAt(to[2], local);
    }
  }
  return last[1];
}

type Group = "translate" | "scale" | "opacity" | "dash";

const GROUP_OF: Readonly<Record<TrackProp, Group>> = {
  tx: "translate",
  ty: "translate",
  sx: "scale",
  sy: "scale",
  o: "opacity",
  dash: "dash",
};

const DEFAULT_OF: Readonly<Record<TrackProp, number>> = {
  tx: 0,
  ty: 0,
  sx: 1,
  sy: 1,
  o: 1,
  dash: 0,
};

const round = (value: number) => String(Math.round(value * 1000) / 1000);

function cssValue(group: Group, values: Readonly<Partial<Record<TrackProp, number>>>): string {
  const get = (prop: TrackProp) => values[prop] ?? DEFAULT_OF[prop];
  switch (group) {
    case "translate":
      return `${round(get("tx"))}px ${round(get("ty"))}px`;
    case "scale":
      return `${round(get("sx"))} ${round(get("sy"))}`;
    case "opacity":
      return round(get("o"));
    case "dash":
      return round(get("dash"));
  }
}

const PROPERTY: Readonly<Record<Group, string>> = {
  translate: "translate",
  scale: "scale",
  opacity: "opacity",
  dash: "stroke-dashoffset",
};

interface Target {
  readonly id: string;
  readonly groups: Map<Group, Track[]>;
  origin?: string;
}

/** Tracks grouped per element id, validated: no duplicates, equal times within a group. */
function targets(motion: TileMotion): readonly Target[] {
  const byId = new Map<string, Target>();
  for (const track of motion.tracks) {
    if (track.keys.length < 2) throw new Error(`track ${track.id}/${track.prop} needs two keys`);
    const target = byId.get(track.id) ?? { id: track.id, groups: new Map<Group, Track[]>() };
    byId.set(track.id, target);
    const group = GROUP_OF[track.prop];
    const list = target.groups.get(group) ?? [];
    if (list.some((other) => other.prop === track.prop)) {
      throw new Error(`track ${track.id}/${track.prop} is declared twice`);
    }
    const reference = list[0];
    if (
      reference &&
      reference.keys.map((key) => key[0]).join() !== track.keys.map((key) => key[0]).join()
    ) {
      throw new Error(`tracks ${track.id}/${reference.prop} and /${track.prop} need the same key times`);
    }
    list.push(track);
    target.groups.set(group, list);
    if (track.origin) target.origin = track.origin;
  }
  return [...byId.values()];
}

const percent = (p: number) => `${round(p * 100)}%`;
const selector = (scene: string, id: string, state = "") =>
  `.dt-item${state}[data-scene="${scene}"] [data-t="${id}"]`;

/**
 * The CSS of one scene: the end frame as base style, the story clock
 * (--tile-t), keyframes and the armed/playing/seeking rules. Keyframes and
 * animation rules sit in `screen and (prefers-reduced-motion: no-preference)`:
 * reduced motion, print and no script all show the base style.
 */
export function compileSceneCss(scene: string, motion: TileMotion): string {
  const base: string[] = [
    `.dt-item[data-scene="${scene}"] { --tile-t: ${motion.storyMs}ms; }`,
  ];
  const armed: string[] = [];
  const playing: string[] = [];
  const frames: string[] = [];

  for (const target of targets(motion)) {
    const declarations: string[] = [];
    const names: string[] = [];
    let needsBox = false;
    for (const [group, tracks] of target.groups) {
      const end: Partial<Record<TrackProp, number>> = {};
      for (const track of tracks) end[track.prop] = sample(track, 1);
      declarations.push(`${PROPERTY[group]}: ${cssValue(group, end)};`);
      if (group === "scale") needsBox = true;

      const name = `dt-${scene}-${target.id}-${group}`;
      names.push(name);
      const keys = (tracks[0] as Track).keys;
      const times = keys.map((key) => key[0]);
      if ((times[times.length - 1] as number) < 1) times.push(1);
      const stops = times.map((time, index) => {
        const values: Partial<Record<TrackProp, number>> = {};
        for (const track of tracks) values[track.prop] = sample(track, time);
        const next = keys[index + 1];
        const easing = next ? `animation-timing-function: ${EASE_CSS[next[2] ?? "linear"]}; ` : "";
        return `  ${percent(time)} { ${PROPERTY[group]}: ${cssValue(group, values)}; ${easing}}`;
      });
      frames.push(`@keyframes ${name} {\n${stops.join("\n")}\n}`);
    }
    if (needsBox) {
      declarations.push("transform-box: fill-box;");
      declarations.push(`transform-origin: ${target.origin ?? "50% 50%"};`);
    }
    base.push(`${selector(scene, target.id)} { ${declarations.join(" ")} }`);
    armed.push(
      `${selector(scene, target.id, ".is-armed")} { animation-name: ${names.join(", ")}; }`,
    );
    playing.push(selector(scene, target.id, ".is-playing"));
  }

  return [
    `/* ${scene} */`,
    ...base,
    "@media screen and (prefers-reduced-motion: no-preference) {",
    ...frames.map((frame) => frame.replace(/^/gm, "  ")),
    ...armed.map((rule) => `  ${rule}`),
    `  ${playing.join(",\n  ")} { animation-play-state: running; }`,
    "}",
  ].join("\n");
}

/** The generic armed/seek rules shared by every scene. */
export const SHARED_CSS = `@media screen and (prefers-reduced-motion: no-preference) {
  .dt-item.is-armed [data-t] {
    animation-duration: var(--tile-t, 3200ms);
    animation-timing-function: linear;
    animation-fill-mode: both;
    animation-play-state: paused;
    animation-delay: var(--dt-delay, 0ms);
  }
  .dt-item.is-armed.is-seeking [data-t] {
    animation-delay: calc(var(--p, 0) * var(--tile-t, 3200ms) * -1);
    animation-play-state: paused;
  }
}`;

/** Every scene's CSS in registry order, with the generated-file banner. */
export function compileAllCss(scenes: readonly { readonly scene: string; readonly motion: TileMotion }[]): string {
  return [
    "/* GENERATED by scripts/demo-tiles/build-css.mjs from src/components/demos/<slug>/tile-motion.ts.",
    "   Do not edit. Run `bun run demo-tiles:generate` after changing a scene's tracks. */",
    SHARED_CSS,
    ...scenes.map(({ scene, motion }) => compileSceneCss(scene, motion)),
    "",
  ].join("\n");
}
