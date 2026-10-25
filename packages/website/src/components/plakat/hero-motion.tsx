import type { ReactNode } from "react";
import { ConeScene } from "./hero-cone-scene";
import { GateScene } from "./hero-gate-scene";
import { MendScene } from "./hero-mend-scene";
import { TraceScene } from "./hero-trace-scene";
import { WeaveScene } from "./hero-weave-scene";

/**
 * The scene registry of the workshop stage: one animated scene per workshop,
 * shown beside the two action cards under the band
 * (src/components/workshops/workshop-stage.tsx). A server component tree with
 * no script: SVG and CSS only. The band itself always keeps the poster motif;
 * the hub thumb, the social card and the deck cover too, so a scene never has
 * to fit those.
 *
 * Add a scene (docs/workshop-standard.md, "Adding a workshop"):
 * 1. Write `hero-<key>-scene.tsx` (a named export `<Key>Scene(): ReactNode`
 *    with no props) and `hero-<key>.css` (imported by the component) next to
 *    `hero-gate-scene.tsx`.
 * 2. Add the key to `HeroSceneKey`, import the component and add one line to
 *    `HERO_SCENES`.
 * 3. Map the workshop slug to the key in `HERO_MOTION`.
 * Until step 2 is done, the stage of that workshop shows its cards across the
 * full width, so the page is never broken in between.
 *
 * Rules every scene keeps (docs/experience-system.md, "Workshop stage and
 * scenes"): one 600 x 500 viewBox, aria-hidden and no focus, no text, the base
 * styles are the finished still frame, every animation lives under
 * `prefers-reduced-motion: no-preference`, and only transform, opacity and
 * stroke-dashoffset move.
 */

export type HeroSceneKey = "cone" | "trace" | "mend" | "weave" | "gate";

/**
 * Scene key to component. A new workshop adds one import and one line here.
 */
const HERO_SCENES: Readonly<Partial<Record<HeroSceneKey, () => ReactNode>>> = {
  cone: ConeScene,
  trace: TraceScene,
  mend: MendScene,
  weave: WeaveScene,
  gate: GateScene,
};

/** Workshop slug to scene key. All five workshops have one; unwired keys render nothing yet. */
export const HERO_MOTION: Readonly<Record<string, HeroSceneKey>> = {
  "ki-prognosen-einschaetzen": "cone",
  "geschaeftsberichte-mit-ki-lesen": "trace",
  "datenbereitschaft-fuer-ki": "mend",
  "esg-berichte-mit-ki": "weave",
  // Workshop 05 tells the story of its own page: where a prompt goes.
  "audit-vorbereitung-mit-ki": "gate",
};

/** The scene key of a workshop, or undefined for a slug without one. */
export function heroMotionScene(slug: string): HeroSceneKey | undefined {
  return Object.hasOwn(HERO_MOTION, slug) ? HERO_MOTION[slug] : undefined;
}

/** True once the scene of this key is wired into `HERO_SCENES`. */
export function isHeroSceneWired(scene: HeroSceneKey): boolean {
  return Object.hasOwn(HERO_SCENES, scene);
}

export type HeroMotionProps = {
  readonly scene: HeroSceneKey;
};

/** One scene by key, or null while it is not wired yet. */
export function HeroMotion({ scene }: HeroMotionProps): ReactNode {
  const component = HERO_SCENES[scene];
  return component ? component() : null;
}

/** The scene of a workshop, ready to render, or null (no scene, or not wired yet). */
export function renderHeroScene(slug: string): ReactNode {
  const scene = heroMotionScene(slug);
  return scene && isHeroSceneWired(scene) ? <HeroMotion scene={scene} /> : null;
}
