"use client";

import type { RefObject } from "react";
import {
  useCanvasRAF,
  type UseCanvasRAFHandle,
} from "./use-canvas-raf";
import {
  useCanvasAutoSize,
  type CanvasAutoSizeOptions,
} from "./use-canvas-size";

/**
 * Keeps a settled canvas painted after its backing store changes size.
 *
 * Assigning canvas.width or canvas.height clears the bitmap. The resize hook
 * therefore wakes the RAF hook after every real size change, including when a
 * canvas first becomes measurable after being mounted in a closed disclosure.
 */
export function useAutoSizedCanvasRAF(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  wrapRef: RefObject<HTMLElement | null>,
  draw: (now: number) => boolean,
  options: CanvasAutoSizeOptions = {},
): UseCanvasRAFHandle {
  const raf = useCanvasRAF(draw);
  const onResize = options.onResize;

  useCanvasAutoSize(canvasRef, wrapRef, {
    ...options,
    onResize: () => {
      onResize?.();
      raf.wake();
    },
  });

  return raf;
}
