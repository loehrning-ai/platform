import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { STAND_DATE } from "@/lib/content-meta";
import { WORKSHOPS, getWorkshopBySlug } from "@/lib/workshops";
import {
  buildMachineWorkshopCatalog,
  getMachineWorkshop,
  listMachineWorkshopSlugs,
  listMachineWorkshops,
} from "./workshops";

/** Typographic dashes are banned in every user-facing string, machine or page. */
const DASH_PATTERN = /[\u2014\u2013]/;

/** Static workshop files ship from public/, so the file is the 200. */
function publicFileFor(path: string): string {
  return resolve(process.cwd(), "public", path.replace(/^\//, ""));
}

describe("machine workshop records", () => {
  it("lists every workshop once, in catalog order", () => {
    const slugs = listMachineWorkshopSlugs();
    expect(slugs).toEqual(WORKSHOPS.map((workshop) => workshop.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("lists every workshop in the requested locale", () => {
    const german = listMachineWorkshops("de");
    const english = listMachineWorkshops("en");

    expect(german.map((workshop) => workshop.slug)).toEqual(
      WORKSHOPS.map((workshop) => workshop.slug),
    );
    expect(german.every((workshop) => workshop.locale === "de")).toBe(true);
    expect(english.every((workshop) => workshop.locale === "en")).toBe(true);
  });

  it("returns the reviewed copy of the requested locale", () => {
    for (const workshop of WORKSHOPS) {
      const german = getMachineWorkshop(workshop.slug, "de");
      const english = getMachineWorkshop(workshop.slug, "en");

      expect(german?.title).toBe(workshop.title);
      expect(english?.title).toBe(
        getWorkshopBySlug(workshop.slug, "en")?.title,
      );
      expect(english?.title).not.toBe(german?.title);
      expect(english?.format).not.toBe(german?.format);
      expect(german?.url).toBe(
        `https://loehrning.ai/workshops/${workshop.slug}`,
      );
      expect(english?.url).toBe(
        `https://loehrning.ai/en/workshops/${workshop.slug}`,
      );
      expect(german?.requires_login).toBe(false);
      expect(german?.available_locales).toEqual(["de", "en"]);
    }
  });

  it("ships a materials manifest whose every file exists at its absolute URL", () => {
    for (const workshop of WORKSHOPS) {
      const record = getMachineWorkshop(workshop.slug, "de");
      expect(record?.material_count, workshop.slug).toBe(
        workshop.materials.length,
      );
      expect(record?.materials.length).toBeGreaterThan(0);

      for (const material of record?.materials ?? []) {
        expect(material.path, material.label).toMatch(
          new RegExp(`^/workshops/${workshop.slug}/`),
        );
        expect(material.url).toBe(`https://loehrning.ai${material.path}`);
        expect(["html", "zip"]).toContain(material.kind);
        expect(["de", "en"]).toContain(material.language);
        expect(material.description.trim().length).toBeGreaterThan(0);
        expect(
          existsSync(publicFileFor(material.path)),
          `${material.label} is missing from public/`,
        ).toBe(true);
      }

      expect(record?.material_languages.length).toBeGreaterThan(0);
    }
  });

  it("keeps the workshop steps in their taught order", () => {
    for (const workshop of WORKSHOPS) {
      const record = getMachineWorkshop(workshop.slug, "de");
      expect(record?.steps.map((step) => step.number)).toEqual(
        workshop.steps.map((step) => step.n),
      );
      for (const step of record?.steps ?? []) {
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.description.trim().length).toBeGreaterThan(0);
        expect(step.tool.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("states what the practice data is and what it cannot answer", () => {
    for (const workshop of WORKSHOPS) {
      const record = getMachineWorkshop(workshop.slug, "de");
      expect(record?.case_study.is_fictional).toBe(
        workshop.caseStudy.isFictional,
      );
      expect(record?.case_study.company_name).toBe(
        workshop.caseStudy.companyName,
      );
      expect(record?.case_study.data_limitations.length).toBeGreaterThan(0);
      expect(record?.case_study.metrics.length).toBeGreaterThan(0);
      expect(record?.case_study.decision_question.trim().length).toBeGreaterThan(
        0,
      );
    }
  });

  it("carries the real-world second case only where the catalog has one", () => {
    for (const workshop of WORKSHOPS) {
      const record = getMachineWorkshop(workshop.slug, "de");
      if (!workshop.realWorldCase) {
        expect(record?.real_world_case, workshop.slug).toBeNull();
        continue;
      }
      expect(record?.real_world_case?.company_name).toBe(
        workshop.realWorldCase.companyName,
      );
      expect(record?.real_world_case?.source_url).toMatch(/^https?:\/\//);
      expect(record?.real_world_case?.source_reviewed_at).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(
        record?.real_world_case?.source_limitation.trim().length,
      ).toBeGreaterThan(0);
    }
  });

  it("points every workshop at its learning-graph node", () => {
    for (const workshop of WORKSHOPS) {
      const record = getMachineWorkshop(workshop.slug, "de");
      expect(record?.graph?.node_id, workshop.slug).toBe(
        `workshop:${workshop.slug}`,
      );
      expect(record?.graph?.access).toBe("public");
    }
  });

  it("returns null for a slug that is not in the catalog", () => {
    expect(getMachineWorkshop("gibt-es-nicht", "de")).toBeNull();
    expect(getMachineWorkshop("", "en")).toBeNull();
  });
});

describe("machine workshop catalog payload", () => {
  const payload = buildMachineWorkshopCatalog();

  it("carries the shared envelope and derives freshness from one source", () => {
    expect(payload.schema).toBe("https://loehrning.ai/schema/workshops/v1");
    expect(payload.stand).toBe(STAND_DATE);
    expect(payload.last_updated).toBe(SITE_CONTENT_DATE);
    expect(payload.count).toBe(WORKSHOPS.length);
    expect(payload.page_url).toBe("https://loehrning.ai/api/workshops.json");
    expect(payload.index_url).toBe("https://loehrning.ai/workshops");
    expect(payload.locales).toEqual(["de", "en"]);
  });

  it("serves the same record the agent tools return", () => {
    for (const entry of payload.workshops) {
      expect(entry.localized.de).toEqual(getMachineWorkshop(entry.slug, "de"));
      expect(entry.localized.en).toEqual(getMachineWorkshop(entry.slug, "en"));
      expect(entry.available_locales).toEqual(Object.keys(entry.localized));
      expect(entry.material_count).toBe(entry.localized.de?.material_count);
    }
  });

  it("keeps typographic dashes out of the payload", () => {
    expect(JSON.stringify(payload)).not.toMatch(DASH_PATTERN);
  });
});
