import { describe, expect, it } from "vitest";
import {
  COURSE_FACTS,
  COURSE_SECTIONS,
  RECORD_LABEL,
  courseBadges,
  courseFactsFor,
  courseGroupFor,
  courseIconName,
} from "./tracks";
import {
  COURSE_CATALOG,
  IMPORTED_COURSE_CATALOG,
} from "./catalog";
import { BRAINSTER_COURSE_CATALOG } from "./tracks";
import { getCourseConfig } from "@/lib/course/config";
import type { CourseSlug } from "@/lib/course/types";

/**
 * tracks.test.ts — guards the learner-first course model against drift.
 *
 * The model in tracks.ts hand-classifies every course into a group + honest
 * facts. These tests make "add a course but forget to classify it" and
 * "badge says Zertifikat but the engine issues a Lernnachweis" both fail CI.
 */

const ALL_SLUGS = [
  ...COURSE_CATALOG.map((c) => c.slug),
  ...IMPORTED_COURSE_CATALOG.map((c) => c.slug),
  ...BRAINSTER_COURSE_CATALOG.map((c) => c.slug),
];

describe("learner-first course model", () => {
  it("classifies every catalog course exactly once (no missing, no orphan)", () => {
    for (const slug of ALL_SLUGS) {
      expect(courseFactsFor(slug), `missing facts for ${slug}`).toBeDefined();
    }
    // No orphan facts pointing at a slug that no catalog defines.
    for (const slug of Object.keys(COURSE_FACTS)) {
      expect(ALL_SLUGS, `orphan facts entry ${slug}`).toContain(slug);
    }
  });

  it("puts the four certified German courses on the spine, everything else deeper", () => {
    for (const course of COURSE_CATALOG) {
      expect(courseGroupFor(course.slug)).toBe("spine");
    }
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(courseGroupFor(course.slug)).toBe("deeper");
    }
    for (const course of BRAINSTER_COURSE_CATALOG) {
      expect(courseGroupFor(course.slug)).toBe("deeper");
    }
  });

  it("keeps the record badge honest against lib/course/config.ts", () => {
    // The native courses' record kind must match what the engine actually
    // issues: a "Lernnachweis"-titled record is a Lernnachweis, otherwise a
    // Teilnahmebestätigung (Zertifikat).
    for (const course of COURSE_CATALOG) {
      const config = getCourseConfig(course.slug as CourseSlug);
      const expected = /lernnachweis/i.test(config.certificateTitle)
        ? "lernnachweis"
        : "zertifikat";
      expect(COURSE_FACTS[course.slug].record, course.slug).toBe(expected);
    }
  });

  it("never badges an external lab or applied course with a native record", () => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(COURSE_FACTS[course.slug].record).toBe("none");
      expect(COURSE_FACTS[course.slug].external).toBe(true);
    }
    for (const course of BRAINSTER_COURSE_CATALOG) {
      expect(COURSE_FACTS[course.slug].record).toBe("none");
    }
  });

  it("builds honest badge chips: language always, record only when issued, extern only for labs", () => {
    const fuehrerschein = courseBadges("ki-fuehrerschein");
    expect(fuehrerschein).toEqual([
      { label: "Deutsch", tone: "language" },
      { label: "mit Zertifikat", tone: "record" },
    ]);

    const gesellschaft = courseBadges("ki-und-gesellschaft");
    expect(gesellschaft).toContainEqual({ label: "mit Lernnachweis", tone: "record" });

    const lab = courseBadges("data-engineering-fundamentals");
    expect(lab).toEqual([
      { label: "Englisch", tone: "language" },
      { label: "extern · GitHub", tone: "external" },
    ]);
    expect(lab.some((b) => b.tone === "record")).toBe(false);

    expect(courseBadges("does-not-exist")).toEqual([]);
  });

  it("resolves an icon name for every course and a safe fallback otherwise", () => {
    for (const slug of ALL_SLUGS) {
      expect(courseIconName(slug)).not.toBe("");
    }
    expect(courseIconName("unknown-slug")).toBe("BookOpen");
  });

  it("exposes both learner-facing sections", () => {
    expect(COURSE_SECTIONS.spine.title).toBe("Der Lernpfad");
    expect(COURSE_SECTIONS.deeper.title).toBe("Tiefer gehen");
  });

  it("carries an accent + badge for every course (plan 007 stage 3: migrated from TRACK_META)", () => {
    for (const slug of ALL_SLUGS) {
      const facts = COURSE_FACTS[slug];
      expect(facts.accent, slug).toMatch(/^(kupfer|sand|amber)$/);
      expect(facts.badge.length, slug).toBeGreaterThan(0);
    }
    expect(COURSE_FACTS["ki-fuehrerschein"].accent).toBe("kupfer");
    expect(COURSE_FACTS["ki-fuehrerschein"].badge).toBe("Zertifikat · Deutsch");
    expect(COURSE_FACTS["data-engineering-fundamentals"].accent).toBe("sand");
    expect(COURSE_FACTS["data-engineering-fundamentals"].badge).toBe(
      "GitHub · MIT · Englisch",
    );
  });

  it("RecordKind gains a 'certificate' value with a matching RECORD_LABEL entry (plan 007 stage 4)", () => {
    expect(RECORD_LABEL.certificate).toBe("mit Certificate");
    // No course flips to this record kind in this plan — verified fact, not
    // assumption: every imported course still reads "none".
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(COURSE_FACTS[course.slug].record).toBe("none");
    }
  });
});
