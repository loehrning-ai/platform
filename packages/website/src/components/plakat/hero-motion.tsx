import type { ReactNode } from "react";
import { GateScene, type GateVariant } from "./hero-gate-scene";
import "./hero-motion.css";

/**
 * Hero motion: an animated scene in the poster band of one workshop, in place
 * of its poster motif. A server component with no script: SVG and CSS only
 * (hero-motion.css holds the still frame and the keyframes).
 *
 * Add a scene by writing its SVG next to `hero-gate-scene.tsx`, naming it in
 * `HERO_SCENES` and mapping the workshop slug in `HERO_MOTION`. Only the
 * workshops listed in `HERO_MOTION` get one; every other workshop keeps its
 * poster. The hub thumb, the social card and the deck cover always keep the
 * poster motif, so a scene never has to fit those.
 *
 * Rules every scene keeps (docs/experience-system.md, "Hero scenes"): the
 * title stays the h1 and is never animated, the scene is aria-hidden and
 * takes no focus, the base styles are the finished still frame, every
 * animation lives under `prefers-reduced-motion: no-preference`, and only
 * transform, opacity and stroke-dashoffset move.
 */

export type HeroMotionScene = "gate";

export type HeroMotionVariant = GateVariant;

const HERO_SCENES: Readonly<
  Record<HeroMotionScene, (variant: HeroMotionVariant, numeral: string | undefined) => ReactNode>
> = {
  gate: (variant, numeral) => <GateScene variant={variant} {...(numeral ? { numeral } : {})} />,
};

/** Workshop slug to scene. Workshop 05 tells the story of its own page: where a prompt goes. */
export const HERO_MOTION: Readonly<Record<string, HeroMotionScene>> = {
  "ki-im-unternehmen-sicher-nutzen": "gate",
};

/** The scene of a workshop, or undefined for a workshop that keeps its poster. */
export function heroMotionScene(slug: string): HeroMotionScene | undefined {
  return Object.hasOwn(HERO_MOTION, slug) ? HERO_MOTION[slug] : undefined;
}

export type HeroMotionProps = {
  readonly scene: HeroMotionScene;
  /** portrait: the lg band column (400 x 500). landscape: the phone row (16:9). */
  readonly variant: HeroMotionVariant;
  /** The workshop's sequence number ("05"), drawn as a pale figure behind the scene. */
  readonly numeral?: string;
};

export function HeroMotion({ scene, variant, numeral }: HeroMotionProps): ReactNode {
  return HERO_SCENES[scene](variant, numeral);
}

/**
 * The two art slots of a band for a workshop with a hero scene: `art` for the
 * lg column and `artPhone` for the row below lg. Undefined when the workshop
 * has none, so the caller falls back to its poster.
 */
export function heroMotionArt(
  slug: string,
  numeral?: string,
): { readonly art: ReactNode; readonly artPhone: ReactNode } | undefined {
  const scene = heroMotionScene(slug);
  if (!scene) return undefined;
  const figure = numeral ? { numeral } : {};
  return {
    art: <HeroMotion scene={scene} variant="portrait" {...figure} />,
    artPhone: <HeroMotion scene={scene} variant="landscape" {...figure} />,
  };
}
