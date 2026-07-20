import type { Variants } from "framer-motion";

// Cubic bezier matching Apple/Linear easing — fast start, graceful finish
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Clip-path reveals ─────────────────────────────────────────────────────
// These feel like type "printing" onto the page — not fading in.
// Use for headlines, section titles, key statements.

export const revealUp: Variants = {
  hidden: {
    clipPath: "inset(0 0 100% 0)",
    y: 8,
  },
  // End-state uses a negative bottom inset so descenders (g, y, p, j, q)
  // never get clipped by the animation's end frame. `-0.3em` matches the
  // convention already used by home/credibility-strip, services-preview,
  // differentiator, final-cta — readable, scales with font-size.
  visible: (i: number = 0) => ({
    clipPath: "inset(0 0 -0.3em 0)",
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.7,
      ease: EASE_OUT_EXPO,
    },
  }),
};

// ─── Standard fade variants ────────────────────────────────────────────────
// Kept for subtler elements (body copy, supporting info, pills)

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: EASE_OUT_EXPO,
    },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_EXPO,
    },
  },
};

// ─── Table row reveal ──────────────────────────────────────────────────────
// For comparison tables — rows stagger in cleanly

export const tableRowReveal: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: EASE_OUT_EXPO,
    },
  }),
};

// ─── Line drawing ──────────────────────────────────────────────────────────
// ScaleX from 0 to 1 — for section rules and Kupfer accent lines.
// Requires style={{ transformOrigin: "left" }} on the element.

export const drawLine: Variants = {
  hidden: { scaleX: 0 },
  visible: (i: number = 0) => ({
    scaleX: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: EASE_OUT_EXPO,
    },
  }),
};

// ─── SVG path draw-on ──────────────────────────────────────────────────────
// pathLength 0→1 for SVG stroke animation. Use with m.path.

export const svgDrawOn: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: i * 0.2,
      duration: 1.2,
      ease: EASE_OUT_EXPO,
    },
  }),
};

// ─── Node appearance ───────────────────────────────────────────────────────
// Scale + opacity entrance for SVG node boxes.

export const nodeAppear: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: EASE_OUT_EXPO,
    },
  }),
};
