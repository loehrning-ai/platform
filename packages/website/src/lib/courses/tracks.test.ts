import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
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

  it("keeps the spine to exactly the 4 native German certified courses, everything else deeper", () => {
    // group is independent of nativeStatus/catalog membership (plan 007
    // stage 6 unified CatalogCourse/ImportedCourse behind nativeStatus,
    // which is orthogonal to which learner-facing shelf a course sits in).
    // A ported course can flip to nativeStatus "live" and join
    // COURSE_CATALOG while staying "deeper" — claude did exactly this in
    // plan 008. Do NOT derive spine membership from COURSE_CATALOG
    // membership; assert against the explicit, confirmed spine slug set.
    const SPINE_SLUGS: readonly CourseSlug[] = [
      "ki-fuehrerschein",
      "eu-ai-act-kurs",
      "ai-native",
      "ki-und-gesellschaft",
    ];
    for (const slug of ALL_SLUGS) {
      const expected = SPINE_SLUGS.includes(slug as CourseSlug) ? "spine" : "deeper";
      expect(courseGroupFor(slug), `${slug} should be group:"${expected}"`).toBe(expected);
    }
    // Every spine slug must also be a live, native COURSE_CATALOG entry —
    // spine implies native, but native does not imply spine.
    for (const slug of SPINE_SLUGS) {
      expect(COURSE_CATALOG.some((c) => c.slug === slug), `${slug} must be in COURSE_CATALOG`).toBe(true);
    }
  });

  it("keeps the record badge honest against lib/course/config.ts", () => {
    // The native courses' record kind must match what the engine actually
    // issues: a "Lernnachweis"-titled record is a Lernnachweis, an English
    // config (plan 008: claude) issues a "certificate", otherwise a
    // Teilnahmebestätigung (Zertifikat).
    for (const course of COURSE_CATALOG) {
      const config = getCourseConfig(course.slug as CourseSlug);
      const expected =
        config.language === "en"
          ? "certificate"
          : /lernnachweis/i.test(config.certificateTitle)
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

    // data-engineering-fundamentals flipped to a certified native course in
    // plan 011 stage 12, data-science in plan 012 stage 14 —
    // ai-native-operator is now the only "extern · GitHub" example left.
    const certifiedLab = courseBadges("data-engineering-fundamentals");
    expect(certifiedLab).toEqual([
      { label: "Englisch", tone: "language" },
      { label: "mit Certificate", tone: "record" },
    ]);

    const certifiedDs = courseBadges("data-science");
    expect(certifiedDs).toEqual([
      { label: "Englisch", tone: "language" },
      { label: "mit Certificate", tone: "record" },
    ]);

    const lab = courseBadges("ai-native-operator");
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
      "Certificate · Englisch",
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

  it("RECORD_LABEL is a closed set of exactly the 3 non-'none' RecordKind values (plan 007 stage 12)", () => {
    expect(Object.keys(RECORD_LABEL).sort()).toEqual(
      ["certificate", "lernnachweis", "zertifikat"].sort(),
    );
  });
});

// ─── Dead-code regression guard (plan 007 stage 12) ────────────────────────
//
// TRACK_META/TrackMeta/CourseTrack/TrackAccent/trackMetaFor were removed in
// plan 007 stage 3, replaced by CourseFacts.accent/.badge. This grep-based
// check fails CI the moment any of those five identifiers is reintroduced as
// CODE anywhere in src/ — comments that merely document the historical
// removal (this file included) are intentionally excluded, since banning the
// word itself in prose would make it impossible to explain the migration.

const FORBIDDEN_IDENTIFIERS = [
  "TRACK_META",
  "TrackMeta",
  "trackMetaFor",
  "CourseTrack",
  "TrackAccent",
] as const;

/** This file's own path, relative to src/ — excluded since it necessarily
 * names the forbidden identifiers as string literals to check for them. */
const SELF_PATH = "lib/courses/tracks.test.ts";

function walkSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkSourceFiles(full));
    } else if ([".ts", ".tsx"].includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

/** Strips // line comments and /* block comments *\/ so only real code is scanned. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

describe("dead-code regression guard: TRACK_META removal", () => {
  it("finds no TRACK_META/TrackMeta/trackMetaFor/CourseTrack/TrackAccent as real code anywhere in src/", () => {
    const srcDir = resolve(process.cwd(), "src");
    const files = walkSourceFiles(srcDir).filter(
      (file) => relative(srcDir, file) !== SELF_PATH,
    );

    const hits: string[] = [];
    for (const file of files) {
      const code = stripComments(readFileSync(file, "utf-8"));
      for (const identifier of FORBIDDEN_IDENTIFIERS) {
        if (new RegExp(`\\b${identifier}\\b`).test(code)) {
          hits.push(`${relative(srcDir, file)}: ${identifier}`);
        }
      }
    }

    expect(
      hits,
      `Forbidden dead-code identifiers found (plan 007 stage 3 removed these): ${hits.join(", ")}`,
    ).toEqual([]);
  });
});
