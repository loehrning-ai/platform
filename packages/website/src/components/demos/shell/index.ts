/**
 * The v3 demo shell, the one import a demo needs:
 *
 *   import { DemoStage, DemoLever, useBeatClock, useOnRestart } from "@/components/demos/shell";
 *
 * The page around the demo (bar, rail, desktop column, closing band, take-home
 * block) is DemoPageV3, mounted by the route; the demo renders only its stage,
 * caption and lever, as a pure function of the clock.
 */
export {
  BeatClockProvider,
  REWIND_MS,
  revealIfOffscreen,
  useBeatClock,
  useOnEscape,
  useOnRestart,
  type BeatCause,
  type BeatClock,
} from "./beat-clock";
export { TAKEHOME_TARGET_ID } from "@/lib/demo-beats";
export { BeatRail } from "./beat-rail";
export { DemoLever, DemoStage, NextButton, PrivacyLine, RestartButton } from "./stage-parts";
export { setTakeHomeLine, useTakeHomeLine } from "../take-home/take-home-store";
export { FILE_CHIP } from "../take-home/styles";
