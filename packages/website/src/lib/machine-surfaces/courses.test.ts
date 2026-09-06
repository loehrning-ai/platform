import { describe, expect, it } from "vitest";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { STAND_DATE } from "@/lib/content-meta";
import { COURSE_CATALOG, PORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import {
  buildMachineCourseCatalog,
  getMachineCourse,
  listMachineCourseSlugs,
  listMachineCourses,
} from "./courses";

/** Typographic dashes are banned in every user-facing string, machine or page. */
const DASH_PATTERN = /[\u2014\u2013]/;

/**
 * The four certified courses gate their reader (policy D1 exception); every
 * other course reads without an account. Stated here structurally so a silent
 * flip of the crawl contract fails this surface too.
 */
const LOGIN_REQUIRED_SLUGS = [
  "ki-fuehrerschein",
  "ki-und-gesellschaft",
  "eu-ai-act-kurs",
  "ai-native",
];

describe("machine course records", () => {
  it("lists every catalog course once, in learning-path order", () => {
    const slugs = listMachineCourseSlugs();
    expect(slugs).toEqual(COURSE_CATALOG.map((course) => course.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("lists every course in the requested locale", () => {
    const german = listMachineCourses("de");
    const english = listMachineCourses("en");

    expect(german.map((course) => course.slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
    expect(german.every((course) => course.locale === "de")).toBe(true);
    expect(english.every((course) => course.locale === "en")).toBe(true);
  });

  it("derives structure and counts from the catalog without restating them", () => {
    for (const course of COURSE_CATALOG) {
      const record = getMachineCourse(course.slug, "de");
      expect(record, course.slug).not.toBeNull();
      expect(record?.step).toBe(course.step);
      expect(record?.level).toBe(course.level);
      expect(record?.duration_minutes).toBe(course.durationMinutes);
      expect(record?.lesson_count).toBe(course.totalLessons);
      expect(record?.unit_count).toBe(course.unitCount);
      expect(record?.lesson_count).toBeGreaterThan(0);
    }
  });

  it("serves absolute canonical and English URLs for every course", () => {
    for (const course of COURSE_CATALOG) {
      const german = getMachineCourse(course.slug, "de");
      const english = getMachineCourse(course.slug, "en");

      expect(german?.url).toBe(`https://loehrning.ai${course.href}`);
      expect(german?.start_url).toBe(`https://loehrning.ai${course.startHref}`);
      expect(english?.url).toBe(`https://loehrning.ai/en${course.href}`);
      expect(english?.start_url).toBe(
        `https://loehrning.ai/en${course.startHref}`,
      );
      expect(german?.available_locales).toEqual(["de", "en"]);
    }
  });

  it("returns the reviewed English copy, not the German record", () => {
    const german = getMachineCourse("ki-fuehrerschein", "de");
    const english = getMachineCourse("ki-fuehrerschein", "en");

    expect(german?.title).toBe("KI-Führerschein");
    expect(english?.title).toBe("AI Fundamentals");
    expect(english?.level_label).toBe("Entry");
    expect(german?.level_label).toBe("Einstieg");
    expect(english?.description).not.toBe(german?.description);
  });

  it("reports the login requirement of each course reader", () => {
    for (const course of COURSE_CATALOG) {
      const record = getMachineCourse(course.slug, "de");
      expect(record?.requires_login, course.slug).toBe(
        LOGIN_REQUIRED_SLUGS.includes(course.slug),
      );
    }
  });

  it("carries pinned provenance for exactly the ported courses", () => {
    const portedSlugs = new Set<string>(
      PORTED_COURSE_CATALOG.map((course) => course.slug),
    );
    expect(portedSlugs.size).toBeGreaterThan(0);

    for (const course of COURSE_CATALOG) {
      const record = getMachineCourse(course.slug, "de");
      if (!portedSlugs.has(course.slug)) {
        expect(record?.source, course.slug).toBeNull();
        continue;
      }
      const source = record?.source;
      expect(source, course.slug).not.toBeNull();
      expect(source?.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(source?.repository_url).toMatch(/^https:\/\//);
      expect(source?.commit_url).toContain(source?.commit ?? "");
      expect(source?.license_url).toMatch(/^https:\/\/loehrning\.ai\//);
      expect(source?.license_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(source?.launch_url).toMatch(/^https:\/\//);
    }
  });

  it("points every course at its learning-graph node", () => {
    for (const course of COURSE_CATALOG) {
      const record = getMachineCourse(course.slug, "de");
      expect(record?.graph?.node_id, course.slug).toBe(`course:${course.slug}`);
      expect(record?.graph?.stage.length).toBeGreaterThan(0);
      expect(record?.graph?.evidence_mode.length).toBeGreaterThan(0);
    }
  });

  it("returns null for a slug that is not in the catalog", () => {
    expect(getMachineCourse("gibt-es-nicht", "de")).toBeNull();
    expect(getMachineCourse("", "en")).toBeNull();
  });
});

describe("machine course catalog payload", () => {
  const payload = buildMachineCourseCatalog();

  it("carries the shared envelope and derives freshness from one source", () => {
    expect(payload.schema).toBe("https://loehrning.ai/schema/courses/v1");
    expect(payload.stand).toBe(STAND_DATE);
    expect(payload.last_updated).toBe(SITE_CONTENT_DATE);
    expect(payload.count).toBe(COURSE_CATALOG.length);
    expect(payload.page_url).toBe("https://loehrning.ai/api/courses.json");
    expect(payload.catalog_url).toBe("https://loehrning.ai/kurse");
    expect(payload.locales).toEqual(["de", "en"]);
  });

  it("serves the same record the agent tools return", () => {
    for (const entry of payload.courses) {
      expect(entry.localized.de).toEqual(getMachineCourse(entry.slug, "de"));
      expect(entry.localized.en).toEqual(getMachineCourse(entry.slug, "en"));
      expect(entry.available_locales).toEqual(Object.keys(entry.localized));
    }
  });

  it("keeps typographic dashes out of the payload", () => {
    expect(JSON.stringify(payload)).not.toMatch(DASH_PATTERN);
  });
});
