/**
 * The published skills collection.
 *
 * Skills are instructions other people's agents follow, so the invariants here
 * are identity and safety, not formatting taste: which skills exist, that the
 * served bytes are the authored bytes, and that no document smuggles in a key
 * or a command to run.
 */

import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  isSkillName,
  listSkillNames,
  readSkillDocument,
  skillsContentRoot,
  SKILL_DOCUMENT_FILENAME,
} from "@/app/skills/_lib/registry";
import {
  GET,
  dynamic,
  dynamicParams,
  generateStaticParams,
} from "@/app/skills/[name]/SKILL.md/route";

/**
 * The collection is a public promise: an agent installs it by name. Adding a
 * skill is a deliberate act that updates this list, never a side effect.
 */
const PUBLISHED_SKILLS = [
  "cv-engine",
  "loehrning-plattform",
  "workshop-arbeiten",
] as const;

const EM_DASH = "—";
const EN_DASH = "–";

function requestFor(name: string): Request {
  return new Request(`https://loehrning.ai/skills/${name}/SKILL.md`);
}

function paramsFor(name: string) {
  return { params: Promise.resolve({ name }) };
}

async function readAuthored(name: string): Promise<string> {
  return readFile(
    path.join(skillsContentRoot(), name, SKILL_DOCUMENT_FILENAME),
    "utf8",
  );
}

describe("skill names", () => {
  it.each(PUBLISHED_SKILLS)("accepts the published name %s", (name) => {
    expect(isSkillName(name)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["../secrets", "parent traversal"],
    ["skills/nested", "path separator"],
    ["Loehrning", "upper case"],
    ["trailing-", "trailing hyphen"],
    ["-leading", "leading hyphen"],
    ["double--hyphen", "doubled hyphen"],
    ["with space", "whitespace"],
    ["a".repeat(65), "over the length ceiling"],
  ])("rejects %s (%s)", (candidate) => {
    expect(isSkillName(candidate)).toBe(false);
  });
});

describe("the authored collection", () => {
  it("publishes exactly the named skills", async () => {
    await expect(listSkillNames()).resolves.toEqual([...PUBLISHED_SKILLS]);
  });

  it.each(PUBLISHED_SKILLS)(
    "%s declares its own name and a description in frontmatter",
    async (name) => {
      const document = await readAuthored(name);
      expect(document.startsWith("---\n")).toBe(true);
      const frontmatter = document.slice(4, document.indexOf("\n---\n", 3));
      expect(frontmatter).toContain(`name: ${name}\n`);
      const description = /^description: (.+)$/m.exec(frontmatter)?.[1] ?? "";
      expect(description.length).toBeGreaterThan(40);
    },
  );

  it.each(PUBLISHED_SKILLS)("%s carries a German body and an English section", async (name) => {
    const document = await readAuthored(name);
    expect(document).toContain("\n## English\n");
    // German is the platform's first language; the English section mirrors it.
    expect(document).toMatch(/\b(?:du|dir|dich|deine[nmrs]?)\b/i);
  });

  it.each(PUBLISHED_SKILLS)("%s uses no em dash and no en dash", async (name) => {
    const document = await readAuthored(name);
    expect(document.includes(EM_DASH)).toBe(false);
    expect(document.includes(EN_DASH)).toBe(false);
  });

  it.each(PUBLISHED_SKILLS)("%s contains nothing executable and no key", async (name) => {
    const document = await readAuthored(name);
    expect(document).not.toMatch(/\b(?:curl|wget)\b[^\n]{0,200}\|/);
    expect(document).not.toMatch(/\b[A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET)\s*=/);
    expect(document).not.toMatch(/(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/);
  });

  it("tells an agent where the endpoint is and that it may not write", async () => {
    const document = await readAuthored("loehrning-plattform");
    expect(document).toContain("https://loehrning.ai/api/mcp");
    expect(document).toContain("Alle Werkzeuge sind lesend.");
  });

  it("keeps the person in control of every key and token", async () => {
    for (const name of PUBLISHED_SKILLS) {
      const document = await readAuthored(name);
      expect(
        /Schlüssel|Token/.test(document),
        `${name} says nothing about keys or tokens`,
      ).toBe(true);
    }
  });
});

describe("reading a skill document", () => {
  it("returns the authored bytes", async () => {
    await expect(readSkillDocument("cv-engine")).resolves.toBe(
      await readAuthored("cv-engine"),
    );
  });

  it("returns null for an unpublished name", async () => {
    await expect(readSkillDocument("does-not-exist")).resolves.toBeNull();
  });

  it.each(["../../../etc/passwd", "cv-engine/../loehrning-plattform", "."])(
    "refuses %s instead of resolving it",
    async (candidate) => {
      await expect(readSkillDocument(candidate)).resolves.toBeNull();
    },
  );
});

describe("GET /skills/[name]/SKILL.md", () => {
  it("is prerendered for exactly the published skills", async () => {
    expect(dynamic).toBe("force-static");
    expect(dynamicParams).toBe(false);
    await expect(generateStaticParams()).resolves.toEqual(
      PUBLISHED_SKILLS.map((name) => ({ name })),
    );
  });

  it.each(PUBLISHED_SKILLS)("serves %s as unmodified markdown", async (name) => {
    const response = await GET(requestFor(name), paramsFor(name));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=3600",
    );
    await expect(response.text()).resolves.toBe(await readAuthored(name));
  });

  it("answers 404 as plain text for an unknown skill", async () => {
    const response = await GET(
      requestFor("no-such-skill"),
      paramsFor("no-such-skill"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    await expect(response.text()).resolves.toContain("Unknown skill.");
  });

  it("answers 404 rather than resolving a traversal attempt", async () => {
    const response = await GET(
      requestFor("traversal"),
      paramsFor("../../../package.json"),
    );

    expect(response.status).toBe(404);
  });
});
