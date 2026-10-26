import { describe, expect, it } from "vitest";
import { composeCvYaml, type CvLiveChoice } from "./compose";
import { CV_LIVE_COPY } from "./copy";
import { CV_LIVE_DATA, cvLiveState } from "./live-data";
import { CV_LIVE_STATIONS } from "./stations";
import { cvLiveAdvice, cvLiveChangedLines } from "./story";

const copy = CV_LIVE_COPY.de;
const choice = (patch: Partial<CvLiveChoice>): CvLiveChoice => ({
  lang: "de",
  template: "classic",
  density: "normal",
  stations: 0,
  ...patch,
});

/** The first number of jobs that overflows at normal density. */
function firstOverflow(template: CvLiveChoice["template"]): number {
  for (let stations = 0; ; stations++) {
    if (cvLiveState(choice({ template, stations })).exitCode === 1) return stations;
  }
}

describe("CV live story", () => {
  it("says what to do next: tight when it helps, cut when it does not", () => {
    const n = firstOverflow("classic");
    expect(cvLiveAdvice(cvLiveState(choice({ stations: n })), copy)).toBe(
      `${copy.noPdf} ${copy.tryTight}`,
    );
    expect(cvLiveAdvice(cvLiveState(choice({ stations: n, density: "tight" })), copy)).toBe(
      copy.rescued,
    );
    expect(cvLiveAdvice(cvLiveState(choice({})), copy)).toBeNull();
    // Already tight and still over the edge: only cutting helps.
    let tightOver = n;
    while (cvLiveState(choice({ stations: tightOver, density: "tight" })).exitCode === 0) tightOver++;
    expect(
      cvLiveAdvice(cvLiveState(choice({ stations: tightOver, density: "tight" })), copy),
    ).toBe(`${copy.noPdf} ${copy.tryCut}`);
  });

  it("marks exactly the lines the last change touched", () => {
    const base = CV_LIVE_DATA.base.de;
    const tight = choice({ density: "tight" });
    const yaml = composeCvYaml(base, tight);
    const [at] = cvLiveChangedLines(yaml, tight, "density") ?? [-1];
    expect(yaml.split("\n")[at]).toBe("density: tight");

    const sidebar = choice({ template: "sidebar" });
    const sidebarYaml = composeCvYaml(base, sidebar);
    const [line] = cvLiveChangedLines(sidebarYaml, sidebar, "template") ?? [-1];
    expect(sidebarYaml.split("\n")[line]).toBe("template: sidebar");

    const three = choice({ stations: 3 });
    const threeYaml = composeCvYaml(base, three);
    const range = cvLiveChangedLines(threeYaml, three, "more");
    expect(range).not.toBeNull();
    const [first, last] = range ?? [0, 0];
    const marked = `${threeYaml.split("\n").slice(first, last + 1).join("\n")}\n`;
    expect(marked).toBe(CV_LIVE_STATIONS.de[2]);

    expect(cvLiveChangedLines(yaml, tight, null)).toBeNull();
  });
});
