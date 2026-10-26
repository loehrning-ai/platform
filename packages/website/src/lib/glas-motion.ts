/**
 * Glas motion: Apple's springs, converted for the web (glass-spec 5).
 *
 *   stiffness = (2π / duration)²,  damping = 4π (1 - bounce) / duration,  mass 1
 *
 * from SwiftUI's smooth, snappy and bouncy defaults and interactiveSpring.
 * Every spring starts from the current value and velocity, so a drag can
 * interrupt it at any time. The same tokens drive the rAF integrator here
 * (useSpring in src/components/demos/glas/use-spring.ts) and, as CSS
 * linear() curves, every pure-CSS transition in glas.css.
 *
 * Rules: never animate backdrop-filter or a blur radius; nothing loops;
 * motion answers a touch or a state change; with reduced motion a spring
 * jumps to its target (or crossfades in 150ms where a jump would hide a
 * change).
 */

export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass?: number;
}

export type GlasSpringName = "follow" | "quick" | "smooth" | "bouncy";

export const GLAS_SPRINGS: Readonly<Record<GlasSpringName, SpringConfig>> = {
  /** interactiveSpring: anything glued to the finger (thumb, handle, pill, sheet drag). */
  follow: { stiffness: 1755, damping: 72 },
  /** snappy at 0.35s: selection pill, toggle knob, readout pop, press scale. */
  quick: { stiffness: 322, damping: 30.5 },
  /** smooth 0.5s: cards, sheets, the dock entrance, field pools, any number that must not pass its value. */
  smooth: { stiffness: 158, damping: 25.1 },
  /** bouncy 0.5s: the lens growing and shrinking, the pill's gel stretch. Never on numbers. */
  bouncy: { stiffness: 158, damping: 17.6 },
};

/** The duration of the crossfade that replaces every spring under reduced motion. */
export const GLAS_REDUCED_FADE_MS = 150;

/**
 * The CSS twins of the springs, sampled at 25 points (glass-spec 5): use
 * them with the duration next to them, for example
 * `transition: transform var(--glas-dur-quick) var(--glas-ease-quick)`.
 */
export const GLAS_EASE_CSS: Readonly<Record<Exclude<GlasSpringName, "follow">, { readonly ms: number; readonly curve: string }>> = {
  smooth: {
    ms: 734,
    curve:
      "linear(0, 0.057, 0.18, 0.32, 0.455, 0.572, 0.671, 0.75, 0.812, 0.86, 0.896, 0.924, 0.944, 0.959, 0.971, 0.979, 0.985, 0.989, 0.992, 0.994, 0.996, 0.997, 0.998, 0.999, 1)",
  },
  quick: {
    ms: 486,
    curve:
      "linear(0, 0.054, 0.175, 0.321, 0.466, 0.596, 0.705, 0.793, 0.861, 0.911, 0.946, 0.971, 0.987, 0.997, 1.002, 1.005, 1.006, 1.006, 1.006, 1.005, 1.004, 1.003, 1.002, 1.002, 1)",
  },
  bouncy: {
    ms: 818,
    curve:
      "linear(0, 0.075, 0.241, 0.436, 0.62, 0.772, 0.887, 0.965, 1.013, 1.037, 1.046, 1.044, 1.037, 1.028, 1.02, 1.012, 1.006, 1.002, 1, 0.999, 0.998, 0.998, 0.998, 0.999, 1)",
  },
};

export interface SpringState {
  readonly value: number;
  readonly velocity: number;
}

/** Within this distance and speed (as a share of the travel) a spring counts as settled. */
const SETTLE_SHARE = 0.001;

/**
 * Advances a damped spring by `dtMs` towards `target` (semi-implicit Euler
 * in 4ms sub-steps, stable for every token above). Pure.
 */
export function stepSpring(state: SpringState, target: number, config: SpringConfig, dtMs: number): SpringState {
  const mass = config.mass ?? 1;
  let { value, velocity } = state;
  let remaining = Math.max(0, dtMs) / 1000;
  const step = 0.004;
  while (remaining > 0) {
    const dt = Math.min(step, remaining);
    const force = -config.stiffness * (value - target) - config.damping * velocity;
    velocity += (force / mass) * dt;
    value += velocity * dt;
    remaining -= dt;
  }
  return { value, velocity };
}

/** True once the spring is within 0.1 % of the travel and nearly still. */
export function isSettled(state: SpringState, target: number, travel: number): boolean {
  const scale = Math.max(Math.abs(travel), 1e-6);
  return Math.abs(state.value - target) <= scale * SETTLE_SHARE && Math.abs(state.velocity) <= scale * SETTLE_SHARE * 10;
}

/** How long a spring takes from rest at 0 to settle at 1, and how far it overshoots (a share of the travel). */
export function springProfile(config: SpringConfig): { readonly settleMs: number; readonly overshoot: number } {
  let state: SpringState = { value: 0, velocity: 0 };
  let peak = 0;
  let settledAt = 0;
  for (let t = 4; t <= 4000; t += 4) {
    state = stepSpring(state, 1, config, 4);
    peak = Math.max(peak, state.value);
    if (Math.abs(state.value - 1) > SETTLE_SHARE) settledAt = t;
  }
  return { settleMs: settledAt, overshoot: Math.max(0, peak - 1) };
}
