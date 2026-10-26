import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OPEN_SOURCE_TOOL_ARTIFACTS } from "../artifacts";
import {
  CV_LIVE_DENSITIES,
  CV_LIVE_LANGUAGES,
  CV_LIVE_TEMPLATES,
  composeCvYaml,
  cvLiveStateKey,
} from "./compose";
import { CV_LIVE_COPY } from "./copy";
import {
  CV_LIVE_DATA,
  CV_LIVE_MAX_STATIONS,
  cvLiveChoiceFromSearch,
  cvLiveDefaultChoice,
  cvLiveState,
  type CvLiveFile,
} from "./live-data";
import { CV_LIVE_COMMAND, CV_LIVE_ENGINE } from "./pin";
import { CV_LIVE_STATIONS } from "./stations";

const PUBLIC = join(process.cwd(), "public");
const MANIFEST = JSON.parse(
  readFileSync(join(process.cwd(), "../../ASSET_MANIFEST.json"), "utf8"),
) as { assets: { path: string; sha256: string; sizeBytes: number; license: string }[] };
const manifestRow = new Map(MANIFEST.assets.map((row) => [row.path, row]));
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

function files(): CvLiveFile[] {
  return [
    CV_LIVE_DATA.css,
    ...CV_LIVE_DATA.fonts,
    ...Object.values(CV_LIVE_DATA.bodies),
    ...CV_LIVE_DATA.states.flatMap((state) => (state.pdf ? [state.pdf] : [])),
  ];
}

describe("CV Engine live data", () => {
  it("was rendered with the pinned revision, marked as not yet merged", () => {
    expect(CV_LIVE_DATA.renderedWith).toBe(CV_LIVE_ENGINE.revision);
    expect(CV_LIVE_ENGINE.revision).toMatch(/^[0-9a-f]{40}$/);
    // Honest about the admission path: the pin is not the admitted one.
    const registry = OPEN_SOURCE_TOOL_ARTIFACTS.find((tool) => tool.id === "tool:cv-engine");
    expect(registry?.source.revision).not.toBe(CV_LIVE_ENGINE.revision);
    expect(CV_LIVE_ENGINE.status).toBe("pending-upstream-merge");
    expect(CV_LIVE_ENGINE.pullRequestHref).toBe(
      `${CV_LIVE_ENGINE.repository}/pull/${CV_LIVE_ENGINE.pullRequest}`,
    );
    expect(CV_LIVE_COMMAND).toContain(`git checkout ${CV_LIVE_ENGINE.revision}`);
  });

  it("covers every choice exactly once", () => {
    const keys = new Set(CV_LIVE_DATA.states.map((state) => state.key));
    expect(keys.size).toBe(CV_LIVE_DATA.states.length);
    let count = 0;
    for (const lang of CV_LIVE_LANGUAGES)
      for (const template of CV_LIVE_TEMPLATES)
        for (const density of CV_LIVE_DENSITIES)
          for (let stations = 0; stations <= CV_LIVE_STATIONS[lang].length; stations++) {
            expect(keys.has(cvLiveStateKey({ lang, template, density, stations }))).toBe(true);
            count++;
          }
    expect(count).toBe(CV_LIVE_DATA.states.length);
    expect(CV_LIVE_MAX_STATIONS).toBe(CV_LIVE_STATIONS.de.length);
    expect(CV_LIVE_STATIONS.de.length).toBe(CV_LIVE_STATIONS.en.length);
  });

  it("lets a visitor download the exact cv.yaml the engine rendered", () => {
    for (const state of CV_LIVE_DATA.states) {
      const yaml = composeCvYaml(CV_LIVE_DATA.base[state.lang], state);
      expect(sha256(yaml), state.key).toBe(state.yamlSha256);
      expect(yaml).toContain(`template: ${state.template}\n`);
      expect(yaml).toContain(`density: ${state.density}\n`);
      expect(yaml).toContain(`lang: ${state.lang}\n`);
    }
  });

  it("tells the story it promises: the fourth job overflows, tight brings it back", () => {
    for (const lang of CV_LIVE_LANGUAGES) {
      for (let stations = 0; stations < CV_LIVE_MAX_STATIONS; stations++) {
        expect(cvLiveState({ lang, template: "classic", density: "normal", stations }).exitCode).toBe(0);
      }
      const full = { lang, template: "classic", density: "normal", stations: CV_LIVE_MAX_STATIONS } as const;
      const overflow = cvLiveState(full);
      expect(overflow.exitCode).toBe(1);
      expect(overflow.pdf).toBeNull();
      expect(overflow.naturalPx).toBeGreaterThan(CV_LIVE_DATA.pagePx + CV_LIVE_DATA.slackPx);
      const rescued = cvLiveState({ ...full, density: "tight" });
      expect(rescued.exitCode).toBe(0);
      expect(rescued.pdf).not.toBeNull();
    }
  });

  it("records a consistent verdict for every state", () => {
    for (const state of CV_LIVE_DATA.states) {
      if (state.exitCode === 0) {
        expect(state.gate, state.key).toBe("fits");
        expect(state.pages, state.key).toBe(1);
        expect(state.naturalPx, state.key).toBeLessThanOrEqual(CV_LIVE_DATA.pagePx + CV_LIVE_DATA.slackPx);
      } else {
        expect(["pages", "clipped"], state.key).toContain(state.gate);
        expect(state.pdf, state.key).toBeNull();
      }
      expect(state.mainPx, state.key).toBeLessThanOrEqual(state.naturalPx + 0.01);
      if (state.stations === 0 && state.exitCode === 0) expect(state.pdf, state.key).not.toBeNull();
    }
  });

  it("serves every file byte-exact and records it in ASSET_MANIFEST.json", () => {
    for (const file of files()) {
      expect(file.href.startsWith("/artifacts/tools/cv-engine/live/"), file.href).toBe(true);
      const bytes = readFileSync(join(PUBLIC, file.href));
      expect(sha256(bytes), file.href).toBe(file.sha256);
      expect(bytes.length, file.href).toBe(file.sizeBytes);
      // The stylesheet is text; the manifest takes no .css rows.
      if (file.href.endsWith(".css")) {
        expect(manifestRow.has(`packages/website/public${file.href}`)).toBe(false);
        continue;
      }
      const row = manifestRow.get(`packages/website/public${file.href}`);
      expect(row, file.href).toBeDefined();
      expect(row?.sha256).toBe(file.sha256);
      expect(row?.sizeBytes).toBe(file.sizeBytes);
    }
    const listed = new Set(
      files()
        .filter((file) => !file.href.endsWith(".css"))
        .map((file) => `packages/website/public${file.href}`),
    );
    for (const row of MANIFEST.assets) {
      if (row.path.startsWith("packages/website/public/artifacts/tools/cv-engine/live/")) {
        expect(listed.has(row.path), row.path).toBe(true);
      }
    }
  });

  it("keeps every station bullet a plain YAML string", () => {
    // "durchlaufen: Einkauf" would parse as a mapping and print as a tuple.
    for (const block of Object.values(CV_LIVE_STATIONS).flat()) {
      for (const line of block.split("\n").filter((row) => row.startsWith("      - "))) {
        expect(line, line).not.toMatch(/: /);
      }
    }
    for (const file of Object.values(CV_LIVE_DATA.bodies)) {
      expect(readFileSync(join(PUBLIC, file.href), "utf8")).not.toMatch(/\(&#x27;|\('|\{'/);
    }
  });

  it("serves bodies without active or foreign content", () => {
    for (const file of Object.values(CV_LIVE_DATA.bodies)) {
      const body = readFileSync(join(PUBLIC, file.href), "utf8");
      expect(body).not.toMatch(/<script|<iframe|<link|<style|<img|\son\w+\s*=|javascript:/i);
      for (const [, href] of body.matchAll(/href="([^"]*)"/g)) {
        expect(href).toMatch(/^(mailto:|https:\/\/)/);
      }
      // The invented person only: example.com addresses, no phone number.
      expect(body).toContain("Mira Kessler");
      expect(body).not.toMatch(/tel:|\+49/);
    }
  });

  it("rewrites the engine stylesheet for a shadow root", () => {
    const css = readFileSync(join(PUBLIC, CV_LIVE_DATA.css.href), "utf8");
    expect(css).toContain(":host {");
    expect(css).toContain(".cv-body {");
    expect(css).not.toMatch(/@font-face|:root \{|html, body \{|url\(/);
  });

  it("reads deep links defensively", () => {
    const fallback = cvLiveDefaultChoice("de");
    expect(cvLiveChoiceFromSearch("?vorlage=sidebar&dichte=tight&sprache=en&stationen=4", fallback)).toEqual({
      lang: "en",
      template: "sidebar",
      density: "tight",
      stations: 4,
    });
    expect(cvLiveChoiceFromSearch("?vorlage=x&dichte=&stationen=99", fallback)).toEqual(fallback);
  });

  it("writes its copy without em or en dashes", () => {
    const texts = [
      ...Object.values(CV_LIVE_STATIONS).flat(),
      ...CV_LIVE_LANGUAGES.map((lang) => CV_LIVE_DATA.base[lang]),
      JSON.stringify(CV_LIVE_COPY, (_key, value) =>
        typeof value === "function" ? String(value) : value,
      ),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(/[–—]/);
    }
    expect(CV_LIVE_STATIONS.de.join("")).toMatch(/ä|ö|ü|ß/);
  });
});
