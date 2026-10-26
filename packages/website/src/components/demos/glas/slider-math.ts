/** Pure value math of the Glas slider (unit-tested). */

/** Snaps a value to the step grid inside [min, max]. */
export function snapValue(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(value)) return min;
  const clamped = Math.min(max, Math.max(min, value));
  if (step <= 0) return clamped;
  const snapped = min + Math.round((clamped - min) / step) * step;
  // Remove float noise (0.1 + 0.2) by rounding to the step's decimals.
  const decimals = Math.max(0, (String(step).split(".")[1] ?? "").length);
  return Math.min(max, Number(snapped.toFixed(decimals)));
}

/** The share of the track a value sits at, 0 to 1. */
export function valueToShare(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** The value under a pointer at `x` px on a track that starts at `left` and is `width` px wide. */
export function pointerToValue(x: number, left: number, width: number, min: number, max: number, step: number): number {
  const share = width <= 0 ? 0 : (x - left) / width;
  return snapValue(min + share * (max - min), min, max, step);
}

/** The value after a key press, or null when the key is not the slider's. */
export function keyToValue(key: string, value: number, min: number, max: number, step: number, bigStep = step * 10): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return snapValue(value + step, min, max, step);
    case "ArrowLeft":
    case "ArrowDown":
      return snapValue(value - step, min, max, step);
    case "PageUp":
      return snapValue(value + bigStep, min, max, step);
    case "PageDown":
      return snapValue(value - bigStep, min, max, step);
    case "Home":
      return min;
    case "End":
      return max;
    default:
      return null;
  }
}

/** The lens content transform: the point under the thumb lands in the lens centre at `scale`. */
export function lensTransform(thumbX: number, lensWidth: number, lensHeight: number, trackCentreY: number, scale = 1.25): string {
  const tx = lensWidth / 2 - thumbX * scale;
  const ty = lensHeight / 2 - trackCentreY * scale;
  return `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale})`;
}
