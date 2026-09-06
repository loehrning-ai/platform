import { describe, expect, it } from "vitest";
import {
  assertOpenSourceArtifacts,
  OPEN_SOURCE_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  SOFTWARE_ARTIFACT_DELIVERY_MODES,
  type OpenSourceArtifact,
  type ToolArtifact,
} from "./artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_PAGE_COPY,
} from "./display-copy";

const CV_ENGINE = OPEN_SOURCE_TOOL_ARTIFACTS.find(
  (artifact) => artifact.id === "tool:cv-engine",
);

/**
 * The registry has no hosted entry yet, so the mode is exercised against a
 * synthetic artifact rather than a published one: the published entry stays
 * source-only until `cv.loehrning.ai` actually answers. `hostedVariant` takes
 * the real cv-engine record and swaps only the delivery pair, so every other
 * field the validator inspects is a field the registry really ships.
 */
function hostedVariant(
  launchHref: unknown,
  guideOverrides: Record<string, unknown> = {},
): OpenSourceArtifact {
  const base = CV_ENGINE as ToolArtifact;
  return {
    ...base,
    delivery: "hosted-service",
    launchHref,
    guide: { ...base.guide, ...guideOverrides },
  } as unknown as OpenSourceArtifact;
}

/**
 * A hosted instance receives whatever the reader types into it, so naming the
 * host is the one disclosure the guide owes them. Every published
 * `hosted-service` artifact has to satisfy this, and it is checked in both
 * directions below so the rule cannot pass by being vacuous.
 */
function disclosesItsHost(artifact: OpenSourceArtifact): boolean {
  if (artifact.kind === "video" || artifact.delivery !== "hosted-service") {
    return true;
  }
  return artifact.guide.dataFlow.includes(
    new URL(artifact.launchHref).hostname,
  );
}

describe("hosted-service delivery", () => {
  it("registers the mode once and labels it in both locales", () => {
    expect(SOFTWARE_ARTIFACT_DELIVERY_MODES).toEqual([
      "source-only",
      "internal-route",
      "external-service",
      "hosted-service",
    ]);

    // A mode without a label renders `undefined` in the ledger's fact rail, so
    // the union and both label maps are pinned to each other here.
    for (const locale of ["de", "en"] as const) {
      expect(
        Object.keys(OPEN_SOURCE_PAGE_COPY[locale].showcase.delivery).sort(),
      ).toEqual([...SOFTWARE_ARTIFACT_DELIVERY_MODES].sort());
    }

    expect(OPEN_SOURCE_PAGE_COPY.de.showcase.delivery["hosted-service"]).toBe(
      "Gehostet von loehrning.ai · Hetzner EU",
    );
    expect(OPEN_SOURCE_PAGE_COPY.en.showcase.delivery["hosted-service"]).toBe(
      "Hosted by loehrning.ai · Hetzner EU",
    );
  });

  it("keeps the hub premise honest about how the listed tools are run", () => {
    // The eyebrow is the hub's premise, and the registry is what makes it true
    // or false. Self-run is the constant claim; hosting may only appear in the
    // premise once a published artifact is actually hosted.
    const hostedIsPublished = OPEN_SOURCE_ARTIFACTS.some(
      (artifact) =>
        artifact.kind !== "video" && artifact.delivery === "hosted-service",
    );

    expect(OPEN_SOURCE_PAGE_COPY.de.eyebrow).toMatch(/selbst betreib/);
    expect(OPEN_SOURCE_PAGE_COPY.en.eyebrow.toLowerCase()).toContain("self");
    if (!hostedIsPublished) {
      expect(OPEN_SOURCE_PAGE_COPY.de.eyebrow).not.toMatch(/gehostet/i);
      expect(OPEN_SOURCE_PAGE_COPY.en.eyebrow).not.toMatch(/hosted by/i);
      expect(OPEN_SOURCE_PAGE_COPY.de.introduction).not.toMatch(/gehostet/i);
      expect(OPEN_SOURCE_PAGE_COPY.en.introduction).not.toMatch(/hosted/i);
    }
  });

  it("validates a hosted artifact built from the published registry entry", () => {
    expect(CV_ENGINE).toBeDefined();
    if (!CV_ENGINE) return;

    const hosted = hostedVariant("https://cv.loehrning.ai", {
      dataFlow: `Der Editor läuft auf cv.loehrning.ai. ${CV_ENGINE.guide.dataFlow}`,
    });
    expect(() => assertOpenSourceArtifacts([hosted])).not.toThrow();
    expect(disclosesItsHost(hosted)).toBe(true);
  });

  it("keeps cv-engine source-only while no host answers for it", () => {
    if (!CV_ENGINE) return;
    const english = localizeOpenSourceArtifact(CV_ENGINE, "en");

    // The regression this pins: a `hosted-service` entry publishes an absolute
    // launch URL to the detail page, the hub card and the knowledge-graph
    // endpoint. `cv.loehrning.ai` has no DNS record, so the registry may not
    // name it anywhere until it does.
    expect(CV_ENGINE.delivery).toBe("source-only");
    expect(CV_ENGINE.launchHref).toBeUndefined();

    for (const artifact of [CV_ENGINE, english]) {
      for (const field of [
        artifact.guide.statusNote,
        artifact.guide.dataFlow,
        artifact.guide.installation.summary,
      ]) {
        expect(field).not.toContain("cv.loehrning.ai");
      }
    }

    // And the guide still says who runs it, rather than going quiet.
    expect(CV_ENGINE.guide.statusNote).toContain(
      "Du betreibst das Werkzeug selbst",
    );
    expect(english.guide.statusNote).toContain(
      "You run the tool yourself on your own computer",
    );
  });

  it("requires a hosted artifact to name its host in the guide", () => {
    if (!CV_ENGINE) return;

    // Both directions, so the rule discriminates instead of always passing.
    expect(
      disclosesItsHost(
        hostedVariant("https://cv.loehrning.ai", {
          dataFlow: "Der Editor läuft auf cv.loehrning.ai, in der EU.",
        }),
      ),
    ).toBe(true);
    expect(
      disclosesItsHost(
        hostedVariant("https://cv.loehrning.ai", {
          dataFlow: "Der Editor läuft irgendwo.",
        }),
      ),
    ).toBe(false);

    // Vacuous while the registry has no hosted entry, and the gate on the
    // commit that adds one.
    for (const artifact of OPEN_SOURCE_ARTIFACTS) {
      for (const locale of ["de", "en"] as const) {
        expect(
          disclosesItsHost(localizeOpenSourceArtifact(artifact, locale)),
          `${artifact.id} (${locale}) must name its hosted host`,
        ).toBe(true);
      }
    }
  });

  it("accepts only an HTTPS loehrning.ai subdomain as the launch target", () => {
    if (!CV_ENGINE) return;

    expect(() =>
      assertOpenSourceArtifacts([
        hostedVariant("https://werkbank.loehrning.ai"),
      ]),
    ).not.toThrow();

    for (const launchHref of [
      undefined,
      "",
      "/demos/cv-engine",
      "http://cv.loehrning.ai",
      "https://cv.loehrning.ai.example.com",
      "https://notloehrning.ai",
      "https://loehrning.ai",
      "https://cv.example.com",
      "https://user:pass@cv.loehrning.ai",
    ]) {
      expect(
        () => assertOpenSourceArtifacts([hostedVariant(launchHref)]),
        `hosted-service must reject ${String(launchHref)}`,
      ).toThrow(/launchHref/);
    }
  });
});
