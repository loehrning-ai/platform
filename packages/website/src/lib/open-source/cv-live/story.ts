import { CV_LIVE_DENSITIES, type CvLiveChoice } from "./compose";
import type { CvLiveCopy } from "./copy";
import { cvLiveState, type CvLiveState } from "./live-data";
import { CV_LIVE_STATIONS } from "./stations";

/** What the visitor changed last; the cv.yaml pane marks it. */
export type CvLiveChange = "template" | "density" | "lang" | "more" | "less" | null;

/** A state that fits while another density of the same content does not. */
export function cvLiveIsRescue(state: CvLiveState): boolean {
  return (
    state.exitCode === 0 &&
    CV_LIVE_DENSITIES.some((density) => cvLiveState({ ...state, density }).exitCode === 1)
  );
}

/** What to do next, in one or two sentences; null when the page simply fits. */
export function cvLiveAdvice(state: CvLiveState, copy: CvLiveCopy): string | null {
  if (state.exitCode === 1) {
    const tight = cvLiveState({ ...state, density: "tight" });
    const fix = state.density !== "tight" && tight.exitCode === 0 ? copy.tryTight : copy.tryCut;
    return `${copy.noPdf} ${fix}`;
  }
  return cvLiveIsRescue(state) ? copy.rescued : null;
}

/** Lines of cv.yaml (0-based, inclusive) that the last change touched. */
export function cvLiveChangedLines(
  yaml: string,
  choice: CvLiveChoice,
  change: CvLiveChange,
): [number, number] | null {
  const lines = yaml.split("\n");
  const line = (text: string) => {
    const at = lines.indexOf(text);
    return at < 0 ? null : ([at, at] as [number, number]);
  };
  switch (change) {
    case "template":
      return line(`template: ${choice.template}`);
    case "density":
      return line(`density: ${choice.density}`);
    case "lang":
      return line(`lang: ${choice.lang}`);
    case "more": {
      const block = CV_LIVE_STATIONS[choice.lang][choice.stations - 1];
      const at = block ? yaml.indexOf(block) : -1;
      if (at < 0) return null;
      const first = yaml.slice(0, at).split("\n").length - 1;
      return [first, first + block.trimEnd().split("\n").length - 1];
    }
    case "less":
      return line("education:");
    default:
      return null;
  }
}

