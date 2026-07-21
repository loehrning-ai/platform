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
import { DEF_CHAPTER_IDS } from "@/lib/data-engineering-fundamentals/types";
import { DS_NUMBERED_CHAPTER_IDS } from "@/lib/data-science/types";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("course catalog (shared course architecture)", () => {
  it("lists all ten native courses in the recommended learning order (plan 013 stage 12 adds ai-native-operator)", () => {
    expect(COURSE_CATALOG.map((c) => c.slug)).toEqual([
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
      "eu-ai-act-kurs",
      "ai-native",
      "claude",
      "codex",
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ]);
  });

  it("numbers the learning-path steps 1 through 10", () => {
    expect(COURSE_CATALOG.map((c) => c.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("only references slugs registered in the shared course engine", () => {
    for (const c of COURSE_CATALOG) {
      expect(COURSE_SLUGS).toContain(c.slug);
    }
  });

  it("IMPORTED_COURSE_CATALOG is empty: every ported course has now flipped to nativeStatus live (plan 013 stage 12)", () => {
    expect(IMPORTED_COURSE_CATALOG).toEqual([]);
  });

  it("ai-native-operator's flipped COURSE_CATALOG entry retains its provenance fields (plan 013 stage 12)", () => {
    const c = getCatalogCourse("ai-native-operator")!;
    expect(c.href).toBe("/kurse/open-source/ai-native-operator");
    expect(c.nativeStatus).toBe("live");
    expect(c.launchHref).toMatch(/^https:\/\/www\.timloehr\.me\/interactive-courses\//);
    // public-content contract: "Quelle" list links are commit-pinned so the
    // /open-source list and the detail pages agree on the same tree. The
    // upstream source folder is "ai-native" (never "ai-native-operator") —
    // the exact collision risk this migration guarded against throughout.
    expect(c.sourceHref).toBe(
      `https://github.com/Mavengence/interactive-courses/tree/${IMPORTED_COURSE_SOURCE_COMMIT}/ai-native`,
    );
    expect(c.sourceCommitHref).toMatch(
      new RegExp(
        `^https://github\\.com/Mavengence/interactive-courses/tree/${IMPORTED_COURSE_SOURCE_COMMIT}/`,
      ),
    );
    expect(c.licenseHref).toMatch(/^\/imported-courses\/licenses\//);
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

  it("keeps ai-native-operator's structure aligned with the source repository, now inside COURSE_CATALOG", () => {
    const c = getCatalogCourse("ai-native-operator")!;
    expect({
      unitCount: c.unitCount,
      unitLabel: c.unitLabel,
      totalLessons: c.totalLessons,
      lessonCountLabel: c.lessonCountLabel,
    }).toEqual({
      unitCount: 9,
      unitLabel: "Module",
      totalLessons: 39,
      lessonCountLabel: "39 Lektionen",
    });
  });

  it("exposes a combined display catalog without changing native course semantics", () => {
    expect(ALL_COURSE_CATALOG).toHaveLength(10);
    expect(COURSE_CATALOG).toHaveLength(10);
    expect(IMPORTED_COURSE_CATALOG).toHaveLength(0);
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

  it("reconciles data-engineering-fundamentals's totalLessons/unitCount to the real 12 chapters (plan 011 stage 12)", () => {
    const def = getCatalogCourse("data-engineering-fundamentals");
    expect(def?.totalLessons).toBe(DEF_CHAPTER_IDS.length);
    expect(def?.totalLessons).toBe(12);
    expect(def?.unitCount).toBe(12);
    expect(def?.lessonCountLabel).toBe("12 Kapitel");
    expect(def?.nativeStatus).toBe("live");
    expect(def?.startHref).toBe("/kurse/open-source/data-engineering-fundamentals/home");
  });

  it("retains data-engineering-fundamentals's open-source provenance fields after the plan 011 stage 12 flip to native", () => {
    const def = getCatalogCourse("data-engineering-fundamentals");
    expect(def?.imageSrc).toMatch(/^\/imported-courses\/screenshots\/.+\.jpg$/);
    expect(def?.sourceCommit).toBe(IMPORTED_COURSE_SOURCE_COMMIT);
    expect(def?.imageSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(def?.licenseSha256).toMatch(/^[a-f0-9]{64}$/);
    const imagePath = join(process.cwd(), "public", def!.imageSrc!);
    const licensePath = join(process.cwd(), "public", def!.licenseHref!);
    expect(existsSync(imagePath)).toBe(true);
    expect(existsSync(licensePath)).toBe(true);
    expect(sha256(imagePath)).toBe(def!.imageSha256);
    expect(sha256(licensePath)).toBe(def!.licenseSha256);
  });

  it("reconciles data-science's totalLessons/unitCount to the 12 numbered chapters (plan 012 stage 14)", () => {
    const ds = getCatalogCourse("data-science");
    expect(ds?.totalLessons).toBe(DS_NUMBERED_CHAPTER_IDS.length);
    expect(ds?.totalLessons).toBe(12);
    expect(ds?.unitCount).toBe(12);
    expect(ds?.lessonCountLabel).toBe("12 Kapitel");
    expect(ds?.nativeStatus).toBe("live");
    // Unlike data-engineering-fundamentals, the Overview lives at the bare
    // course root (not a "/home" chapter slug) — startHref points directly
    // there.
    expect(ds?.startHref).toBe("/kurse/open-source/data-science");
  });

  it("retains data-science's open-source provenance fields after the plan 012 stage 14 flip to native", () => {
    const ds = getCatalogCourse("data-science");
    expect(ds?.imageSrc).toMatch(/^\/imported-courses\/screenshots\/.+\.jpg$/);
    expect(ds?.sourceCommit).toBe(IMPORTED_COURSE_SOURCE_COMMIT);
    expect(ds?.imageSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(ds?.licenseSha256).toMatch(/^[a-f0-9]{64}$/);
    const imagePath = join(process.cwd(), "public", ds!.imageSrc!);
    const licensePath = join(process.cwd(), "public", ds!.licenseHref!);
    expect(existsSync(imagePath)).toBe(true);
    expect(existsSync(licensePath)).toBe(true);
    expect(sha256(imagePath)).toBe(ds!.imageSha256);
    expect(sha256(licensePath)).toBe(ds!.licenseSha256);
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
    // "claude"/"codex"/"data-infrastructure"/"data-engineering-fundamentals"/
    // "data-science"/"ai-native-operator" are deliberate exceptions (plan
    // 008 stage 10, plan 009 stage 7, plan 010 stage 13, plan 011 stage 12,
    // plan 012 stage 14, plan 013 stage 12): their URLs stay under
    // /kurse/open-source/<slug> across the imported-to-native flip instead
    // of moving to a top-level /<slug> path like the 4 German courses, so
    // their public URLs never break.
    const HREF_OVERRIDE: Partial<Record<string, string>> = {
      "ai-native": "ai-native",
      claude: "kurse/open-source/claude",
      codex: "kurse/open-source/codex",
      "data-infrastructure": "kurse/open-source/data-infrastructure",
      "data-engineering-fundamentals": "kurse/open-source/data-engineering-fundamentals",
      "data-science": "kurse/open-source/data-science",
      "ai-native-operator": "kurse/open-source/ai-native-operator",
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

  it("getImportedCourse resolves nothing: every imported course (including ai-native-operator, plan 013 stage 12) has moved to COURSE_CATALOG", () => {
    expect(getImportedCourse("ai-native-operator")).toBeUndefined();
    expect(getImportedCourse("ai-native")).toBeUndefined();
    expect(getImportedCourse("claude")).toBeUndefined();
    expect(getImportedCourse("codex")).toBeUndefined();
    expect(getImportedCourse("data-science")).toBeUndefined();
  });

  it("getCatalogCourse resolves ai-native-operator with its English-track facts", () => {
    expect(getCatalogCourse("ai-native-operator")?.language).toBe("Englisch");
    expect(getCatalogCourse("ai-native-operator")?.title).toBe("The AI-Native Operator");
  });
});
