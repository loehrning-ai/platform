import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  ALL_COURSE_CATALOG,
  COURSE_CATALOG,
  IMPORTED_COURSE_CATALOG,
  IMPORTED_COURSE_SOURCE_COMMIT,
  getCatalogCourse,
  getImportedCourse,
} from "./catalog";
import {
  getBlocks,
  getTotalLessonCount,
} from "@/lib/course/data";
import {
  getAllLessons as getAllAiNativeLessons,
  getModules as getAiNativeModules,
} from "@/lib/ai-native/data";
import { getClaudeTotalLessons, getClaudeTracks } from "@/lib/claude-course/data";
import { getCodexTotalLessons, getCodexTracks } from "@/lib/codex/data";
import { COURSE_SLUGS } from "@/lib/course/types";
import { getRegisteredCourseSlugs } from "@/lib/course/config";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("course catalog (shared course architecture)", () => {
  it("lists all seven native courses in the recommended learning order (plan 010 stage 13 adds data-infrastructure)", () => {
    expect(COURSE_CATALOG.map((c) => c.slug)).toEqual([
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
      "eu-ai-act-kurs",
      "ai-native",
      "claude",
      "codex",
      "data-infrastructure",
    ]);
  });

  it("numbers the learning-path steps 1 through 7", () => {
    expect(COURSE_CATALOG.map((c) => c.step)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("only references slugs registered in the shared course engine", () => {
    for (const c of COURSE_CATALOG) {
      expect(COURSE_SLUGS).toContain(c.slug);
    }
  });

  it("keeps imported open-source courses outside the native progress engine", () => {
    expect(IMPORTED_COURSE_CATALOG.map((c) => c.slug)).toEqual([
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ]);
    for (const c of IMPORTED_COURSE_CATALOG) {
      // CourseSlug (plan 007 stage 1) now spans both native and imported
      // courses by design, so the meaningful invariant is that imported
      // courses stay unregistered in the shared progress engine, not that
      // their slug is absent from the wider CourseSlug union. "claude" left
      // this array entirely in plan 008 stage 10, "codex" in plan 009 stage
      // 7, "data-infrastructure" in plan 010 stage 13 (all three flipped to
      // nativeStatus "live", moved into COURSE_CATALOG).
      expect(getRegisteredCourseSlugs()).not.toContain(c.slug);
      expect(c.href).toBe(`/kurse/open-source/${c.slug}`);
      expect(c.launchHref).toMatch(/^https:\/\/www\.timloehr\.me\/interactive-courses\//);
      // public-content contract: "Quelle" list links are commit-pinned so the
      // /open-source list and the detail pages agree on the same tree.
      expect(c.sourceHref).toBe(
        `https://github.com/Mavengence/interactive-courses/tree/${IMPORTED_COURSE_SOURCE_COMMIT}/${c.slug === "ai-native-operator" ? "ai-native" : c.slug}`,
      );
      expect(c.sourceCommitHref).toMatch(
        new RegExp(
          `^https://github\\.com/Mavengence/interactive-courses/tree/${IMPORTED_COURSE_SOURCE_COMMIT}/`,
        ),
      );
      expect(c.licenseHref).toMatch(/^\/imported-courses\/licenses\//);
    }
  });

  it("keeps every launchHref host on the external-dependency allowlist", () => {
    // public-content contract (DECISION recorded there): the live courses run on
    // timloehr.me while that domain is live. When publishing and domain-retirement gates retires or
    // migrates timloehr.me, every launchHref must be repointed in the SAME
    // commit that retires it, and this allowlist must be extended to the
    // loehrning-ai org pages host in that commit. This test exists to force
    // that coordination; never delete it, update the allowlist instead.
    const LAUNCH_HREF_HOST_ALLOWLIST: readonly string[] = [
      "www.timloehr.me",
      "timloehr.me",
    ];
    for (const c of IMPORTED_COURSE_CATALOG) {
      const host = new URL(c.launchHref).host;
      expect(
        LAUNCH_HREF_HOST_ALLOWLIST,
        `${c.slug}: launchHref host ${host} is not on the allowlist`,
      ).toContain(host);
    }
  });

  it("keeps imported course structure aligned with the source repository", () => {
    expect(
      IMPORTED_COURSE_CATALOG.map((c) => ({
        slug: c.slug,
        unitCount: c.unitCount,
        unitLabel: c.unitLabel,
        totalLessons: c.totalLessons,
        lessonCountLabel: c.lessonCountLabel,
      })),
    ).toEqual([
      {
        slug: "data-engineering-fundamentals",
        unitCount: 10,
        unitLabel: "Kapitel",
        totalLessons: 10,
        lessonCountLabel: "10 Kapitel",
      },
      {
        slug: "data-science",
        unitCount: 12,
        unitLabel: "Kapitel",
        totalLessons: 12,
        lessonCountLabel: "12 Kapitel",
      },
      {
        slug: "ai-native-operator",
        unitCount: 9,
        unitLabel: "Module",
        totalLessons: 39,
        lessonCountLabel: "39 Lektionen",
      },
    ]);
  });

  it("exposes a combined display catalog without changing native course semantics", () => {
    expect(ALL_COURSE_CATALOG).toHaveLength(10);
    expect(COURSE_CATALOG).toHaveLength(7);
    expect(IMPORTED_COURSE_CATALOG).toHaveLength(3);
  });

  // plan 007 stage 10: the structural split is asserted via nativeStatus,
  // not array identity — catches an entry silently drifting out of sync
  // (e.g. landing in COURSE_CATALOG without nativeStatus: "live").
  it("partitions ALL_COURSE_CATALOG by nativeStatus exactly onto COURSE_CATALOG/IMPORTED_COURSE_CATALOG", () => {
    const liveSlugs = ALL_COURSE_CATALOG.filter((c) => c.nativeStatus === "live").map(
      (c) => c.slug,
    );
    const pendingSlugs = ALL_COURSE_CATALOG.filter((c) => c.nativeStatus === "pending").map(
      (c) => c.slug,
    );
    expect(liveSlugs).toEqual(COURSE_CATALOG.map((c) => c.slug));
    expect(pendingSlugs).toEqual(IMPORTED_COURSE_CATALOG.map((c) => c.slug));
    expect(liveSlugs.length + pendingSlugs.length).toBe(ALL_COURSE_CATALOG.length);
  });

  it("carries nativeStatus: the 6 native courses are 'live', the 4 imported courses are 'pending' (plan 007 stage 6, plan 008 stage 10, plan 009 stage 7)", () => {
    for (const c of COURSE_CATALOG) {
      expect(c.nativeStatus, c.slug).toBe("live");
    }
    for (const c of IMPORTED_COURSE_CATALOG) {
      expect(c.nativeStatus, c.slug).toBe("pending");
    }
    // Every ALL_COURSE_CATALOG entry exposes nativeStatus uniformly,
    // regardless of which underlying array it came from.
    for (const c of ALL_COURSE_CATALOG) {
      expect(["live", "pending"]).toContain(c.nativeStatus);
    }
  });

  it("has positive native course counts for progress-bearing courses", () => {
    for (const c of COURSE_CATALOG) {
      expect(c.totalLessons).toBeGreaterThan(0);
      expect(c.unitCount).toBeGreaterThan(0);
    }
  });

  it("derives native catalog counts from the current course content", async () => {
    const ki = getCatalogCourse("ki-fuehrerschein");
    expect(ki?.totalLessons).toBe(getTotalLessonCount("ki-fuehrerschein"));
    expect(ki?.unitCount).toBe(getBlocks("ki-fuehrerschein").length);

    const eu = getCatalogCourse("eu-ai-act-kurs");
    expect(eu?.totalLessons).toBe(getTotalLessonCount("eu-ai-act-kurs"));
    expect(eu?.unitCount).toBe(getBlocks("eu-ai-act-kurs").length);

    const society = getCatalogCourse("ki-und-gesellschaft");
    expect(society?.totalLessons).toBe(getTotalLessonCount("ki-und-gesellschaft"));
    expect(society?.unitCount).toBe(getBlocks("ki-und-gesellschaft").length);

    const aiNative = getCatalogCourse("ai-native");
    expect(aiNative?.totalLessons).toBe((await getAllAiNativeLessons()).length);
    expect(aiNative?.unitCount).toBe(getAiNativeModules().length);

    const claude = getCatalogCourse("claude");
    expect(claude?.totalLessons).toBe(getClaudeTotalLessons());
    expect(claude?.unitCount).toBe(getClaudeTracks().length);

    // codex's catalog unit is lessons (unitLabel "Lektionen"), not tracks
    // (unlike claude, which uses unitLabel "Tracks") — matches its
    // original ImportedCourse entry's own convention, preserved across the
    // nativeStatus flip.
    const codex = getCatalogCourse("codex");
    expect(codex?.totalLessons).toBe(getCodexTotalLessons());
    expect(codex?.unitCount).toBe(getCodexTotalLessons());
    expect(getCodexTracks().length).toBe(4);
  });

  it("retains claude's open-source provenance fields after the plan 008 stage 10 flip to native", () => {
    const claude = getCatalogCourse("claude");
    expect(claude?.imageSrc).toMatch(/^\/imported-courses\/screenshots\/.+\.jpg$/);
    expect(claude?.sourceCommit).toBe(IMPORTED_COURSE_SOURCE_COMMIT);
    expect(claude?.imageSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(claude?.licenseSha256).toMatch(/^[a-f0-9]{64}$/);
    const imagePath = join(process.cwd(), "public", claude!.imageSrc!);
    const licensePath = join(process.cwd(), "public", claude!.licenseHref!);
    expect(existsSync(imagePath)).toBe(true);
    expect(existsSync(licensePath)).toBe(true);
    expect(sha256(imagePath)).toBe(claude!.imageSha256);
    expect(sha256(licensePath)).toBe(claude!.licenseSha256);
  });

  it("retains codex's open-source provenance fields after the plan 009 stage 7 flip to native", () => {
    const codex = getCatalogCourse("codex");
    expect(codex?.imageSrc).toMatch(/^\/imported-courses\/screenshots\/.+\.jpg$/);
    expect(codex?.sourceCommit).toBe(IMPORTED_COURSE_SOURCE_COMMIT);
    expect(codex?.imageSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(codex?.licenseSha256).toMatch(/^[a-f0-9]{64}$/);
    const imagePath = join(process.cwd(), "public", codex!.imageSrc!);
    const licensePath = join(process.cwd(), "public", codex!.licenseHref!);
    expect(existsSync(imagePath)).toBe(true);
    expect(existsSync(licensePath)).toBe(true);
    expect(sha256(imagePath)).toBe(codex!.imageSha256);
    expect(sha256(licensePath)).toBe(codex!.licenseSha256);
  });

  it("has local screenshot and license files for imported courses", () => {
    for (const c of IMPORTED_COURSE_CATALOG) {
      expect(c.totalLessons).toBeGreaterThan(0);
      expect(c.unitCount).toBeGreaterThan(0);
      expect(c.imageSrc).toMatch(/^\/imported-courses\/screenshots\/.+\.jpg$/);
      expect(c.lessonCountLabel).toContain(String(c.totalLessons));
      expect(c.sourceFacts.length).toBeGreaterThanOrEqual(4);
      expect(c.sourceCommit).toBe(IMPORTED_COURSE_SOURCE_COMMIT);
      expect(c.sourceImagePath).toMatch(/^docs\/screenshots\/.+\.jpg$/);
      expect(c.sourceLicensePath).toMatch(/(^LICENSE$|LICENSE\.txt$|\/LICENSE$)/);
      expect(c.imageSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(c.licenseSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(c.licenseSizeBytes).toBeGreaterThan(0);
      const imagePath = join(process.cwd(), "public", c.imageSrc);
      const licensePath = join(process.cwd(), "public", c.licenseHref);
      expect(existsSync(imagePath)).toBe(true);
      expect(existsSync(licensePath)).toBe(true);
      expect(sha256(imagePath)).toBe(c.imageSha256);
      expect(sha256(licensePath)).toBe(c.licenseSha256);
      expect(statSync(licensePath).size).toBe(c.licenseSizeBytes);
    }
  });

  it("uses internal landing + start hrefs that begin with the course base path", () => {
    // "claude"/"codex"/"data-infrastructure" are deliberate exceptions
    // (plan 008 stage 10, plan 009 stage 7, plan 010 stage 13): their URLs
    // stay under /kurse/open-source/<slug> across the imported-to-native
    // flip instead of moving to a top-level /<slug> path like the 4 German
    // courses, so their public URLs never break.
    const HREF_OVERRIDE: Partial<Record<string, string>> = {
      "ai-native": "ai-native",
      claude: "kurse/open-source/claude",
      codex: "kurse/open-source/codex",
      "data-infrastructure": "kurse/open-source/data-infrastructure",
    };
    for (const c of COURSE_CATALOG) {
      expect(c.href).toBe(`/${HREF_OVERRIDE[c.slug] ?? c.slug}`);
      expect(c.startHref.startsWith(c.href)).toBe(true);
      expect(c.continueHref.startsWith(c.href)).toBe(true);
    }
  });

  it("getCatalogCourse resolves by slug and returns undefined for unknown", () => {
    expect(getCatalogCourse("ai-native")?.title).toBe("AI-Native Arbeitskurs");
    expect(getCatalogCourse("claude")?.title).toBe("Claude Course");
    expect(getCatalogCourse("codex")?.title).toBe("Codex Course");
    // @ts-expect-error — exercising the not-found branch with an invalid slug
    expect(getCatalogCourse("does-not-exist")).toBeUndefined();
  });

  it("getImportedCourse resolves imported course slugs only, not claude or codex (both moved to COURSE_CATALOG)", () => {
    expect(getImportedCourse("ai-native-operator")?.language).toBe("Englisch");
    expect(getImportedCourse("ai-native")).toBeUndefined();
    expect(getImportedCourse("claude")).toBeUndefined();
    expect(getImportedCourse("codex")).toBeUndefined();
  });
});
