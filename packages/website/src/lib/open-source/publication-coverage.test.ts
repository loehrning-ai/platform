import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPEN_SOURCE_ARTIFACT_KINDS,
  OPEN_SOURCE_ARTIFACT_REGISTRY,
  type OpenSourceArtifactKind,
} from "./artifacts";

type LighthouseConfig = {
  readonly ci?: {
    readonly collect?: {
      readonly url?: unknown;
    };
  };
};

type ArtifactRouteRegistry = Readonly<
  Record<OpenSourceArtifactKind, readonly { readonly href: string }[]>
>;

function lighthouseConfig(): LighthouseConfig {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "..", "..", "lighthouserc.json"),
      "utf8",
    ),
  ) as LighthouseConfig;
}

function configuredPaths(config: LighthouseConfig): readonly string[] {
  const urls = config.ci?.collect?.url;
  if (!Array.isArray(urls)) return [];
  return urls.flatMap((value) => {
    if (typeof value !== "string") return [];
    try {
      return [new URL(value).pathname];
    } catch {
      return [];
    }
  });
}

function missingArtifactKindRepresentatives(
  registry: ArtifactRouteRegistry,
  paths: readonly string[],
): readonly OpenSourceArtifactKind[] {
  const configured = new Set(paths);
  return OPEN_SOURCE_ARTIFACT_KINDS.filter(
    (kind) =>
      registry[kind].length > 0 &&
      !registry[kind].some((artifact) => configured.has(artifact.href)),
  );
}

describe("open-source publication coverage", () => {
  it("includes the public license policy in the Lighthouse route set", () => {
    const config = lighthouseConfig();

    expect(config.ci?.collect?.url).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/open-source/lizenzrichtlinie",
      ]),
    );
  });

  it("requires a Lighthouse representative for every non-empty artifact kind", () => {
    const paths = configuredPaths(lighthouseConfig());

    expect(
      missingArtifactKindRepresentatives(
        OPEN_SOURCE_ARTIFACT_REGISTRY,
        paths,
      ),
    ).toEqual([]);

    for (const kind of OPEN_SOURCE_ARTIFACT_KINDS) {
      const published = OPEN_SOURCE_ARTIFACT_REGISTRY[kind];
      const representatives = published.filter((artifact) =>
        paths.includes(artifact.href),
      );
      if (published.length === 0) {
        expect(representatives, `${kind} is currently an empty lane`).toEqual(
          [],
        );
      } else {
        expect(
          representatives.length,
          `${kind} needs at least one configured Lighthouse route`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("detects a missing representative independently for each populated kind", () => {
    const syntheticRegistry: ArtifactRouteRegistry = {
      tool: [{ href: "/open-source/tools/tool-a" }],
      project: [{ href: "/open-source/projects/project-a" }],
      video: [{ href: "/open-source/videos/video-a" }],
    };

    expect(
      missingArtifactKindRepresentatives(syntheticRegistry, [
        "/open-source/tools/tool-a",
        "/open-source/videos/video-a",
      ]),
    ).toEqual(["project"]);
  });
});
