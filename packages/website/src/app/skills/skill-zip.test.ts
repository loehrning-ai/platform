/**
 * /skills/<name>.zip: the upload-ready archive of every authored skill, and the
 * claude.ai upload limits every skill must meet (description at most 200
 * characters, name at most 64, no reserved word).
 */

import { describe, expect, it } from "vitest";
import { GET, dynamicParams, generateStaticParams } from "@/app/skills/[name]/route";
import { listSkillNames, readSkillDocument } from "@/app/skills/_lib/registry";
import { skillNameFromZipSegment } from "@/app/skills/_lib/skill-zip";
import { listZipEntries, readZipText } from "@/lib/zip/read";
import {
  checkUploadLimits,
  MAX_DESCRIPTION_CHARACTERS,
  parseFrontmatter,
  storedZipText,
} from "../../../scripts/skills-mirror-check.mjs";

const call = (segment: string) =>
  GET(new Request(`https://loehrning.ai/skills/${segment}`), {
    params: Promise.resolve({ name: segment }),
  });

describe("/skills/<name>.zip", () => {
  it("prebuilds one zip per authored skill and nothing else", async () => {
    const names = await listSkillNames();
    expect(dynamicParams).toBe(false);
    await expect(generateStaticParams()).resolves.toEqual(names.map((name) => ({ name: `${name}.zip` })));
  });

  it("maps only .zip segments to a skill name", () => {
    expect(skillNameFromZipSegment("probe.zip")).toBe("probe");
    expect(skillNameFromZipSegment("probe")).toBeNull();
    expect(skillNameFromZipSegment("probe.zip.md")).toBeNull();
  });

  it.each(["unknown.zip", "workshop-arbeiten", "../x.zip"])("answers 404 for %s", async (segment) => {
    const response = await call(segment);
    expect(response.status).toBe(404);
  });

  it("serves <name>/SKILL.md alone, byte for byte, deterministic, as an attachment", async () => {
    for (const name of await listSkillNames()) {
      const response = await call(`${name}.zip`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/zip");
      expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${name}.zip"`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(listZipEntries(bytes).map((entry) => entry.path)).toEqual([`${name}/SKILL.md`]);
      const authored = await readSkillDocument(name);
      expect(readZipText(bytes, `${name}/SKILL.md`)).toBe(authored);
      // the mirror check's own reader agrees
      expect(storedZipText(bytes, `${name}/SKILL.md`)).toBe(authored);
      const again = new Uint8Array(await (await call(`${name}.zip`)).arrayBuffer());
      expect(Buffer.from(again).equals(Buffer.from(bytes))).toBe(true);
    }
  });
});

describe("claude.ai upload limits", () => {
  it("every authored skill has a description of at most 200 characters and a name of at most 64", async () => {
    for (const name of await listSkillNames()) {
      const document = (await readSkillDocument(name)) as string;
      const { fields, error } = parseFrontmatter(document);
      expect(error, name).toBeNull();
      const description = fields.get("description") ?? "";
      expect(description.length, name).toBeGreaterThan(0);
      expect([...description].length, `${name} description`).toBeLessThanOrEqual(MAX_DESCRIPTION_CHARACTERS);
      expect(name.length).toBeLessThanOrEqual(64);
      expect(checkUploadLimits(name, fields), name).toEqual([]);
    }
  });

  it("flags a long description, an XML tag and a reserved word", () => {
    const fields = new Map([
      ["name", "fuer-deinen-claude"],
      ["description", `<b>${"x".repeat(201)}</b>`],
    ]);
    const errors = checkUploadLimits("fuer-deinen-claude", fields);
    expect(errors.some((line) => /at most 200/.test(line))).toBe(true);
    expect(errors.some((line) => /XML tag/.test(line))).toBe(true);
    expect(errors.some((line) => /"claude"/.test(line))).toBe(true);
  });
});
