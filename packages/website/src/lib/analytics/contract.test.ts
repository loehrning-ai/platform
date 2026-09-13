/**
 * Product-event contract. Iterates the whole registry, proves the dispatcher
 * drops everything outside it, pins the mirrored vocabularies to their real
 * modules, and scans sources for what ESLint cannot see (test files are not
 * linted).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { ESLint } from "eslint";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { track as sdkTrack } from "@vercel/analytics";
import type { DemoCtaTarget } from "@/lib/analytics";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { demos } from "@/lib/demos";
import type { ProgressSyncFailure } from "@/lib/progress/sync-status";
import { WORKSHOPS_BY_LOCALE, type WorkshopMaterial } from "@/lib/workshops";
import { dispatchTrackedEvent } from "./dispatch";
import {
  ANALYTICS_BLOCK_COURSE_SLUGS,
  ANALYTICS_COURSE_SLUGS,
  ANALYTICS_DEMO_CTA_TARGETS,
  ANALYTICS_DEMO_SLUGS,
  ANALYTICS_EVENTS,
  ANALYTICS_LESSON_ORDINALS,
  ANALYTICS_MATERIAL_KINDS,
  ANALYTICS_PROGRESS_SYNC_FAILURES,
  ANALYTICS_PROP_KEYS,
  ANALYTICS_WORKSHOP_SLUGS,
  SAFE_VALUE,
  type AnalyticsCourseSlug,
  type AnalyticsDemoCtaTarget,
  type AnalyticsMaterialKind,
  type AnalyticsProgressSyncFailure,
} from "./registry";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

const sdkTrackMock = vi.mocked(sdkTrack);

const PACKAGE_ROOT = process.cwd();
const SRC_ROOT = join(PACKAGE_ROOT, "src");

const EVENT_NAME = /^[a-z][a-z0-9_]{2,63}$/;
const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DENIED_PROP_KEYS = [
  "user_id",
  "owner_id",
  "expected_owner_id",
  "email",
  "session_id",
  "ip",
  "token",
  "name",
  "title",
  "message",
  "query",
  "answer",
  "text",
  "note",
];

interface Vocabulary {
  readonly subject: readonly string[];
  readonly facet?: readonly string[];
}

const registryEntries = Object.entries(ANALYTICS_EVENTS) as readonly (readonly [
  string,
  Vocabulary,
])[];

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function listSourceFiles(dir: string): readonly string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [toPosix(relative(PACKAGE_ROOT, full))] : [];
  });
}

const SOURCE_FILES = listSourceFiles(SRC_ROOT);

function filesContaining(needle: string | RegExp): readonly string[] {
  return SOURCE_FILES.filter((file) => {
    const source = readFileSync(join(PACKAGE_ROOT, file), "utf8");
    return typeof needle === "string" ? source.includes(needle) : needle.test(source);
  });
}

describe("analytics registry", () => {
  it("declares exactly the eleven product events", () => {
    expect(Object.keys(ANALYTICS_EVENTS).sort()).toEqual(
      [
        "advanced_surface",
        "course_completion",
        "course_started",
        "demo_cta_clicked",
        "ki_check",
        "lesson_completed",
        "lesson_reached",
        "login_flow",
        "login_gate",
        "material_opened",
        "platform_failure",
      ].sort(),
    );
  });

  it("is frozen down to every vocabulary", () => {
    expect(Object.isFrozen(ANALYTICS_EVENTS)).toBe(true);
    for (const [, vocabulary] of registryEntries) {
      expect(Object.isFrozen(vocabulary)).toBe(true);
      expect(Object.isFrozen(vocabulary.subject)).toBe(true);
      if (vocabulary.facet) expect(Object.isFrozen(vocabulary.facet)).toBe(true);
    }
  });

  it.each(registryEntries)("%s has a valid name, keys and values", (name, vocabulary) => {
    expect(name).toMatch(EVENT_NAME);
    const keys = Object.keys(vocabulary);
    expect(keys.length).toBeLessThanOrEqual(2);
    for (const key of keys) {
      expect(ANALYTICS_PROP_KEYS).toContain(key);
      expect(DENIED_PROP_KEYS).not.toContain(key);
    }
    for (const values of [vocabulary.subject, vocabulary.facet ?? []]) {
      expect(values.length).toBeLessThanOrEqual(48);
      expect(new Set(values).size).toBe(values.length);
      for (const value of values) {
        expect(typeof value).toBe("string");
        expect(value).toMatch(SAFE_VALUE);
        expect(value).not.toMatch(UUID_SHAPE);
      }
    }
    expect(vocabulary.subject.length).toBeGreaterThan(0);
  });

  it("uses only the two fixed property keys", () => {
    expect(ANALYTICS_PROP_KEYS).toEqual(["subject", "facet"]);
  });
});

describe("dispatchTrackedEvent", () => {
  beforeEach(() => {
    sdkTrackMock.mockReset();
  });

  function sentProps(): Record<string, unknown> | undefined {
    expect(sdkTrackMock).toHaveBeenCalledTimes(1);
    return sdkTrackMock.mock.calls[0]?.[1] as Record<string, unknown> | undefined;
  }

  it("sends a declared event with declared values", () => {
    dispatchTrackedEvent("demo_cta_clicked", { subject: "excel", facet: "kurs" });
    expect(sdkTrackMock).toHaveBeenCalledWith("demo_cta_clicked", {
      subject: "excel",
      facet: "kurs",
    });
  });

  it("does not send an undeclared event name", () => {
    dispatchTrackedEvent("demo_opened", { slug: "excel", source: "gallery" });
    dispatchTrackedEvent("__proto__", { subject: "excel" });
    dispatchTrackedEvent("toString");
    expect(sdkTrackMock).not.toHaveBeenCalled();
  });

  it("drops a slug-shaped value that is not in the event's vocabulary", () => {
    dispatchTrackedEvent("demo_cta_clicked", { subject: "unknown-demo", facet: "claude" });
    expect(sentProps()).toEqual({});
  });

  it("drops a value declared for another key or another event", () => {
    dispatchTrackedEvent("lesson_reached", { subject: "claude", facet: "exam_passed" });
    expect(sentProps()).toEqual({});
  });

  const lowercaseUuid = ["0".repeat(8), "0".repeat(4), "0".repeat(4), "0".repeat(4), "0".repeat(12)].join("-");
  const syntheticJwt = [
    Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: "synthetic" })).toString("base64url"),
    "signature",
  ].join(".");

  it.each([
    ["an e-mail address", "person@example.org"],
    ["a lowercase UUID", lowercaseUuid],
    ["a JWT", syntheticJwt],
    ["German free text", "Mein Name ist Jörg Müller"],
    ["a nested object", { subject: "excel" }],
    ["an array", ["excel"]],
    ["a bare number", 42],
    ["a boolean", true],
    ["null", null],
    ["a 49-character slug", "a".repeat(49)],
  ])("drops %s", (_label, value) => {
    dispatchTrackedEvent("demo_cta_clicked", { subject: value, facet: value });
    const props = sentProps();
    expect(props).toEqual({});
    expect(JSON.stringify(props)).not.toContain(String(value));
  });

  it("drops a third property key and every undeclared key", () => {
    dispatchTrackedEvent("demo_cta_clicked", {
      subject: "excel",
      facet: "kurs",
      target: "kurs",
      email: "person@example.org",
    });
    expect(sentProps()).toEqual({ subject: "excel", facet: "kurs" });
  });

  it("drops keys inherited through the prototype", () => {
    const props = Object.create({ subject: "excel", facet: "kurs" }) as Record<string, unknown>;
    dispatchTrackedEvent("demo_cta_clicked", props);
    expect(sentProps()).toEqual({});
  });

  it("never mutates the caller's object", () => {
    const props = Object.freeze({ subject: "excel", facet: "kurs", extra: "x" });
    dispatchTrackedEvent("demo_cta_clicked", props);
    expect(props).toEqual({ subject: "excel", facet: "kurs", extra: "x" });
    expect(sdkTrackMock.mock.calls[0]?.[1]).not.toBe(props);
  });

  it("sends a declared event without properties", () => {
    dispatchTrackedEvent("ki_check");
    expect(sdkTrackMock).toHaveBeenCalledWith("ki_check", {});
  });

  it("swallows a throwing transport and a throwing property getter", () => {
    sdkTrackMock.mockImplementation(() => {
      throw new Error("transport failed");
    });
    expect(() =>
      dispatchTrackedEvent("demo_cta_clicked", { subject: "excel", facet: "kurs" }),
    ).not.toThrow();
    const hostile = Object.defineProperty({}, "subject", {
      enumerable: true,
      get() {
        throw new Error("getter failed");
      },
    });
    expect(() => dispatchTrackedEvent("demo_cta_clicked", hostile)).not.toThrow();
  });

  it("warns with key names only, and only in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      dispatchTrackedEvent("demo_cta_clicked", { subject: "person@example.org" });
      expect(warn).not.toHaveBeenCalled();
      vi.stubEnv("NODE_ENV", "development");
      dispatchTrackedEvent("demo_cta_clicked", { subject: "person@example.org" });
      expect(warn).toHaveBeenCalledWith("[analytics] dropped property", "demo_cta_clicked", "subject");
      expect(JSON.stringify(warn.mock.calls)).not.toContain("@");
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
    }
  });
});

describe("mirrored vocabularies do not drift", () => {
  it("course slugs equal COURSE_SLUGS", () => {
    expect([...ANALYTICS_COURSE_SLUGS]).toEqual([...COURSE_SLUGS]);
    expectTypeOf<AnalyticsCourseSlug>().toEqualTypeOf<CourseSlug>();
  });

  it("block courses are real courses", () => {
    for (const slug of ANALYTICS_BLOCK_COURSE_SLUGS) {
      expect(COURSE_SLUGS).toContain(slug);
    }
  });

  it("demo slugs equal the demo catalogue", () => {
    expect([...ANALYTICS_DEMO_SLUGS].sort()).toEqual(demos.map((demo) => demo.slug).sort());
  });

  it("workshop slugs equal the workshop catalogue in every locale", () => {
    for (const workshops of Object.values(WORKSHOPS_BY_LOCALE)) {
      expect([...ANALYTICS_WORKSHOP_SLUGS].sort()).toEqual(
        workshops.map((workshop) => workshop.slug).sort(),
      );
    }
  });

  it("material kinds cover every declared workshop material", () => {
    expectTypeOf<AnalyticsMaterialKind>().toEqualTypeOf<WorkshopMaterial["kind"]>();
    for (const workshops of Object.values(WORKSHOPS_BY_LOCALE)) {
      for (const material of workshops.flatMap((workshop) => workshop.materials)) {
        expect(ANALYTICS_MATERIAL_KINDS).toContain(material.kind);
      }
    }
  });

  it("lesson ordinals cover the longest canonical course in order", () => {
    const longest = Math.max(
      ...Object.values(CANONICAL_LESSON_IDS).map((lessonIds) => lessonIds.length),
    );
    expect(ANALYTICS_LESSON_ORDINALS.length).toBeGreaterThanOrEqual(longest);
    ANALYTICS_LESSON_ORDINALS.forEach((ordinal, index) => {
      expect(ordinal).toBe(`l${String(index + 1).padStart(2, "0")}`);
    });
  });

  it("demo CTA targets equal DemoCtaTarget", () => {
    expectTypeOf<AnalyticsDemoCtaTarget>().toEqualTypeOf<DemoCtaTarget>();
    expect(new Set(ANALYTICS_DEMO_CTA_TARGETS).size).toBe(6);
  });

  it("progress sync failures equal ProgressSyncFailure", () => {
    expectTypeOf<AnalyticsProgressSyncFailure>().toEqualTypeOf<ProgressSyncFailure>();
    expect(ANALYTICS_PROGRESS_SYNC_FAILURES).toHaveLength(3);
  });
});

const SELF = "src/lib/analytics/contract.test.ts";
const DISPATCH = "src/lib/analytics/dispatch.ts";
const WRAPPER = "src/components/analytics/vercel-telemetry.tsx";
const WRAPPER_TEST = "src/components/analytics/vercel-telemetry.test.tsx";

describe("analytics transport source boundaries", () => {

  it("only the dispatcher and the telemetry wrapper reference the analytics SDK", () => {
    expect(
      filesContaining("@vercel/analytics").filter((file) => file !== SELF && file !== WRAPPER_TEST),
    ).toEqual([DISPATCH, WRAPPER].sort());
  });

  it("only the telemetry wrapper references Speed Insights", () => {
    expect(
      filesContaining("@vercel/speed-insights").filter(
        (file) => file !== SELF && file !== WRAPPER_TEST,
      ),
    ).toEqual([WRAPPER]);
  });

  it("nothing references the server analytics entry point", () => {
    expect(
      filesContaining(["@vercel", "analytics", "server"].join("/")).filter((file) => file !== SELF),
    ).toEqual([]);
  });

  it("nothing touches the analytics runtime global", () => {
    const runtimeGlobal = new RegExp(
      ["\\b(?:window|globalThis|self)\\s*(?:\\.\\s*|\\[\\s*[\"'`])", "va[qim]?\\b"].join(""),
    );
    expect(filesContaining(runtimeGlobal).filter((file) => file !== SELF)).toEqual([]);
  });

  it.each([
    "src/lib/analytics/url-policy.ts",
    DISPATCH,
    WRAPPER,
  ])("%s never touches device storage", (file) => {
    const source = readFileSync(join(PACKAGE_ROOT, file), "utf8");
    for (const needle of ["localStorage", "sessionStorage", "document.cookie", "indexedDB"]) {
      expect(source).not.toContain(needle);
    }
  });
});

describe("analytics lint boundaries", () => {
  const eslint = new ESLint({ cwd: PACKAGE_ROOT });

  async function ruleIds(code: string, filePath: string): Promise<readonly string[]> {
    const [result] = await eslint.lintText(code, { filePath: join(PACKAGE_ROOT, filePath) });
    return (result?.messages ?? [])
      .filter((message) => message.severity === 2)
      .map((message) => message.ruleId ?? "");
  }

  const importAnalytics = 'import { track } from "@vercel/analytics";\nexport const t = track;\n';
  const importAnalyticsNext = 'import { Analytics } from "@vercel/analytics/next";\nexport const A = Analytics;\n';
  const importServer = 'import { track } from "@vercel/analytics/server";\nexport const t = track;\n';
  const importSpeed = 'import { SpeedInsights } from "@vercel/speed-insights/next";\nexport const S = SpeedInsights;\n';
  const runtimeRoot = ["win", "dow"].join("");
  const touchRuntime = [
    "export function f() {",
    `  return ${runtimeRoot}["v" + "a"] ?? ${runtimeRoot}.${["v", "aq"].join("")};`,
    "}",
    "",
  ].join("\n");
  const touchRuntimeComputed = `export const g = ${runtimeRoot}["${["v", "a"].join("")}"];\n`;

  it("rejects the SDK outside the two permitted files", async () => {
    const elsewhere = "src/components/demos/somewhere.ts";
    for (const code of [importAnalytics, importAnalyticsNext, importServer, importSpeed]) {
      expect(await ruleIds(code, elsewhere)).toContain("no-restricted-imports");
    }
  }, 60_000);

  it("permits the event API in the dispatcher but not the server entry or Speed Insights", async () => {
    expect(await ruleIds(importAnalytics, DISPATCH)).not.toContain("no-restricted-imports");
    expect(await ruleIds(importServer, DISPATCH)).toContain("no-restricted-imports");
    expect(await ruleIds(importSpeed, DISPATCH)).toContain("no-restricted-imports");
  }, 60_000);

  it("permits both SDK components in the wrapper but not the server entry", async () => {
    expect(await ruleIds(importAnalyticsNext, WRAPPER)).not.toContain("no-restricted-imports");
    expect(await ruleIds(importSpeed, WRAPPER)).not.toContain("no-restricted-imports");
    expect(await ruleIds(importServer, WRAPPER)).toContain("no-restricted-imports");
  }, 60_000);

  it("rejects access to the analytics runtime global", async () => {
    expect(await ruleIds(touchRuntime, "src/lib/somewhere.ts")).toContain("no-restricted-syntax");
    expect(await ruleIds(touchRuntimeComputed, "src/lib/somewhere.ts")).toContain("no-restricted-syntax");
  }, 60_000);
});
