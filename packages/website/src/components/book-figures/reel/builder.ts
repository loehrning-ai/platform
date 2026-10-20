/**
 * Target state of the 1.000 squares at one keyframe. A state says where each
 * active square sits, how big it is and which class and partial fill it
 * carries; the engine in field.ts turns consecutive states into motion.
 */

import type { Mover } from "./motion.ts";

export const N = 1000;
export const CLS_LEINEN = 0;
export const CLS_INK = 1;
export const CLS_ACCENT = 2;

export interface StateDef {
  readonly id: string;
  /** Second at which the move into this state starts (the first state loops). */
  readonly t: number;
  readonly mover: Mover;
  /** Share of the move after which a square takes its new class. */
  readonly clsAt?: number;
  /** Fills the builder; squares not placed are inactive and fall out. */
  readonly build: (b: Builder) => void;
}

export class Builder {
  readonly act = new Uint8Array(N);
  readonly x = new Float32Array(N);
  readonly y = new Float32Array(N);
  readonly w = new Float32Array(N);
  readonly h = new Float32Array(N);
  readonly cls = new Uint8Array(N);
  readonly fill = new Float32Array(N);
  readonly delay = new Float32Array(N);
  /** Previous state's x per square, set by the engine before `build` (for drain waves). */
  readonly px = new Float32Array(N);

  place(
    i: number,
    x: number,
    y: number,
    w: number,
    h: number,
    cls: number,
    fill = 0,
    delay = 0,
  ): void {
    this.act[i] = 1;
    this.x[i] = x;
    this.y[i] = y;
    this.w[i] = w;
    this.h[i] = h;
    this.cls[i] = cls;
    this.fill[i] = fill;
    this.delay[i] = delay;
  }

  /** Mark an inactive square's departure delay (it falls out of the field). */
  leave(i: number, delay: number): void {
    this.act[i] = 0;
    this.delay[i] = delay;
  }

  activeCount(): number {
    let n = 0;
    for (let i = 0; i < N; i += 1) n += this.act[i] ?? 0;
    return n;
  }
}
