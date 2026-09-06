import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The offer is only useful where a learner is actually reading, so the three
 * reading surfaces have to carry it: the course block page, the book chapter
 * page, and the workshop detail page. A refactor that drops one of the mounts
 * would otherwise be invisible until someone noticed the button was gone.
 *
 * Each mount is asserted together with the URI builder it must use, because a
 * hand-written address string is exactly the drift the shared builders exist
 * to prevent.
 */

const SRC = join(__dirname, "..", "..");

const MOUNTS = [
  {
    file: "components/course/kurs/block-page-shell.tsx",
    kind: "lesson",
    builder: "lessonUri(",
  },
  {
    file: "app/buecher/[slug]/[chapter]/page.tsx",
    kind: "chapter",
    builder: "bookUri(",
  },
  {
    file: "app/workshops/[slug]/page.tsx",
    kind: "workshop",
    builder: "workshopUri(",
  },
] as const;

describe("open-with-your-ai mounts", () => {
  it.each(MOUNTS)(
    "mounts the gated region on $file with the $kind resource builder",
    ({ file, kind, builder }) => {
      const source = readFileSync(join(SRC, file), "utf8");

      expect(source).toContain(
        'from "@/components/course/open-with-your-ai-region"',
      );
      expect(source).toContain("<OpenWithYourAiRegion");
      expect(source).toContain(`kind="${kind}"`);
      expect(source).toContain(builder);
      expect(source).toContain('from "@/lib/mcp/uris"');
    },
  );

  it.each(MOUNTS)(
    "never lets $file decide the readiness of the surface itself",
    ({ file }) => {
      const source = readFileSync(join(SRC, file), "utf8");

      expect(source).not.toContain("isAgentAccessReady");
      expect(source).not.toContain("MCP_SERVER_ENABLED");
    },
  );

  it("keeps the island out of a client bundle decision", () => {
    const region = readFileSync(
      join(SRC, "components/course/open-with-your-ai-region.tsx"),
      "utf8",
    );
    const island = readFileSync(
      join(SRC, "components/course/open-with-your-ai.tsx"),
      "utf8",
    );

    expect(region).not.toContain('"use client"');
    expect(region).toContain("getAgentRuntimeFeatures");
    expect(island.startsWith('"use client"')).toBe(true);
    expect(island).not.toContain("getAgentRuntimeFeatures");
    expect(island).not.toContain("process.env");
  });
});
