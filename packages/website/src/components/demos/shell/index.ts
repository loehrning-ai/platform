/**
 * The demo shell, the one import a demo needs.
 *
 * v3 (the default):
 *   import { DemoStage, DemoLever, useBeatClock, useOnRestart } from "@/components/demos/shell";
 *
 * v4 (Glas; SHELL = "v4" in src/lib/demo-cases/<slug>/intro.ts):
 *   import { DemoGlasStage, DemoDock, useBeatClock, useOnRestart } from "@/components/demos/shell";
 *   import { GlasSlider, feldFor, ... } from "@/components/demos/glas";
 *
 * The page around the demo is DemoPageV3 or DemoPageV4, mounted by the route;
 * the demo renders only its stage, caption and controls, as a pure function
 * of the clock (beat, progress and, on v4, phase).
 */
export {
  BeatClockProvider,
  REWIND_MS,
  revealIfOffscreen,
  useBeatClock,
  useBeatGate,
  useOnEscape,
  useOnRestart,
  type BeatCause,
  type BeatClock,
  type BeatGate,
  type DemoPhase,
  type DemoShellVersion,
} from "./beat-clock";
export { DemoDock, DemoGlasStage } from "./glas-demo-stage";
export { TAKEHOME_TARGET_ID } from "@/lib/demo-beats";
export { BeatRail } from "./beat-rail";
export { DemoLever, DemoStage, NextButton, PrivacyLine, RestartButton } from "./stage-parts";
export { setTakeHomeLine, useTakeHomeLine } from "../take-home/take-home-store";
export { FILE_CHIP } from "../take-home/styles";
