/**
 * Das Feld: the unit-square engine behind the hero figures and the cover reel.
 *
 *   const model = compileFeld(fieldData, { width, height });
 *   const buffer = createFrameBuffer(model);
 *   const info = frame(model, progress, buffer);   // pure, allocation-free
 *
 * Painters live next to the consumer: the SVG painter (kinds/field.ts) for
 * print, reduced motion and no JS, the canvas painter (components/book-figures/hero).
 */

export {
  compileFeld,
  sceneAt,
  sceneSettled,
  FELD_CAPACITY,
  STRIDE,
  F,
  INK_CLASS,
  MIN_SIDE,
  TRANSITION,
} from "./model.ts";
export type { FeldModel, FeldViewport, SceneLabel, SceneModel } from "./model.ts";
export { frame, createFrameBuffer, frameLength } from "./frame.ts";
export type { FrameInfo } from "./frame.ts";
