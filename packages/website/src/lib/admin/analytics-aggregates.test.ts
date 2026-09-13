import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_CATALOG } from "@/lib/courses/catalog";

const mockRequireAdminUser = vi.fn();
const mockIsAdminAnalyticsReady = vi.fn();
const mockReportApiError = vi.fn();

interface QueryCall {
  readonly table: string;
  readonly ops: { readonly name: string; readonly args: readonly unknown[] }[];
}

type CountResult = { count: number | null; error: unknown };
let resolveCount: (table: string, courseSlug: string | undefined) => CountResult;
let calls: QueryCall[] = [];
let serviceClientAvailable = true;

function builderFor(call: QueryCall): Record<string, unknown> {
  const builder: Record<string, unknown> = {};
  for (const name of ["select", "eq"]) {
    builder[name] = (...args: unknown[]) => {
      call.ops.push({ name, args });
      return builder;
    };
  }
  builder.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => {
    const slugOp = call.ops.find((op) => op.name === "eq");
    return Promise.resolve(
      resolveCount(call.table, slugOp ? String(slugOp.args[1]) : undefined),
    ).then(resolve, reject);
  };
  return builder;
}

vi.mock("@/lib/auth/admin-identity", () => ({
  requireAdminUser: () => mockRequireAdminUser(),
}));
vi.mock("@/lib/provider-readiness", () => ({
  isAdminAnalyticsReady: () => mockIsAdminAnalyticsReady(),
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () =>
    serviceClientAvailable
      ? {
          from: (table: string) => {
            const call: QueryCall = { table, ops: [] };
            calls.push(call);
            return builderFor(call);
          },
        }
      : null,
}));

import {
  GLOBAL_ACTIVITY_FLOOR,
  MIN_REPORTABLE_COUNT,
  readAdminAggregates,
  type AdminAggregateSnapshot,
} from "./analytics-aggregates";

const COUNTED_TABLES = new Set([
  "user_course_progress",
  "assessment_runs",
  "assessment_answers",
  "beta_feedback",
  "agent_access_events",
  "agent_access_tokens",
  "account_llm_keys",
]);

function uniform(total: number, perCourse: number) {
  return (_table: string, slug: string | undefined): CountResult => ({
    count: slug === undefined ? total : perCourse,
    error: null,
  });
}

async function readySnapshot(): Promise<AdminAggregateSnapshot> {
  const result = await readAdminAggregates();
  if (!result || result.state !== "ready") {
    throw new Error(`expected a ready snapshot, got ${JSON.stringify(result)}`);
  }
  return result;
}

describe("readAdminAggregates", () => {
  beforeEach(() => {
    calls = [];
    serviceClientAvailable = true;
    resolveCount = uniform(100, 40);
    mockRequireAdminUser.mockResolvedValue("admin");
    mockIsAdminAnalyticsReady.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the privacy thresholds exact", () => {
    expect(GLOBAL_ACTIVITY_FLOOR).toBe(20);
    expect(MIN_REPORTABLE_COUNT).toBe(5);
  });

  it.each(["reauth", "denied", "signed-out", "unavailable", "disabled"])(
    "returns null for the %s gate state even when the runtime is ready",
    async (state) => {
      mockRequireAdminUser.mockResolvedValue(state);
      await expect(readAdminAggregates()).resolves.toBeNull();
      expect(calls).toHaveLength(0);
    },
  );

  it("is unavailable, not zero, when the runtime is not ready", async () => {
    mockIsAdminAnalyticsReady.mockReturnValue(false);
    await expect(readAdminAggregates()).resolves.toEqual({ state: "unavailable" });
    expect(calls).toHaveLength(0);
  });

  it("is unavailable, not zero, without a service client", async () => {
    serviceClientAvailable = false;
    await expect(readAdminAggregates()).resolves.toEqual({ state: "unavailable" });
  });

  it("is unavailable when the floor count itself cannot be read", async () => {
    resolveCount = () => ({ count: null, error: { code: "PGRST000" } });
    await expect(readAdminAggregates()).resolves.toEqual({ state: "unavailable" });
    expect(calls).toHaveLength(1);
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/konto/statistik", step: "supabase-read" }),
    );
  });

  it("stops after exactly one query below the global activity floor", async () => {
    resolveCount = uniform(GLOBAL_ACTIVITY_FLOOR - 1, 40);
    await expect(readAdminAggregates()).resolves.toEqual({
      state: "insufficient-data",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("user_course_progress");
  });

  it("issues only head-counts over the closed table list", async () => {
    await readySnapshot();
    expect(calls.length).toBe(COUNTED_TABLES.size + COURSE_CATALOG.length);
    for (const call of calls) {
      expect(COUNTED_TABLES.has(call.table)).toBe(true);
      expect(call.ops[0]).toEqual({
        name: "select",
        args: ["*", { count: "exact", head: true }],
      });
      const [, ...filters] = call.ops;
      for (const op of filters) {
        expect(op.name).toBe("eq");
        expect(op.args[0]).toBe("course_slug");
        expect(call.table).toBe("user_course_progress");
      }
    }
    const dimensioned = calls.filter((call) => call.ops.length > 1);
    expect(dimensioned.map((call) => call.ops[1]!.args[1]).sort()).toEqual(
      COURSE_CATALOG.map((course) => course.slug).sort(),
    );
  });

  it("omits a course below the minimum and keeps one at the minimum", async () => {
    const [small, exact] = COURSE_CATALOG;
    resolveCount = (_table, slug) => ({
      count:
        slug === undefined ? 50 : slug === small!.slug ? 3 : slug === exact!.slug ? 5 : 40,
      error: null,
    });
    const snapshot = await readySnapshot();
    expect(snapshot.courses.find((course) => course.slug === small!.slug)).toBeUndefined();
    expect(snapshot.courses.find((course) => course.slug === exact!.slug)).toEqual({
      slug: exact!.slug,
      count: 5,
    });
    expect(snapshot.coursesIncomplete).toBe(false);
  });

  it("marks a small total as suppressed instead of showing its number", async () => {
    resolveCount = (table, slug) => ({
      count: slug !== undefined ? 40 : table === "beta_feedback" ? 3 : 60,
      error: null,
    });
    const snapshot = await readySnapshot();
    expect(snapshot.totals.betaFeedback).toBe("suppressed");
    expect(snapshot.totals.courseProgress).toBe(60);
  });

  it("omits a total whose table is missing and lists it as unavailable, never zero", async () => {
    resolveCount = (table, slug) =>
      ["agent_access_events", "agent_access_tokens", "account_llm_keys"].includes(table)
        ? { count: null, error: { code: "42P01" } }
        : { count: slug === undefined ? 80 : 30, error: null };
    const snapshot = await readySnapshot();
    expect(snapshot.unavailableTotals).toEqual([
      "agentAccessEvents",
      "agentAccessTokens",
      "accountLlmKeys",
    ]);
    expect(snapshot.totals).not.toHaveProperty("agentAccessEvents");
    expect(snapshot.totals).not.toHaveProperty("agentAccessTokens");
    expect(snapshot.totals).not.toHaveProperty("accountLlmKeys");
    expect(snapshot.totals.assessmentRuns).toBe(80);
  });

  it("flags incomplete course figures when one course count fails", async () => {
    const [failing] = COURSE_CATALOG;
    resolveCount = (_table, slug) =>
      slug === failing!.slug
        ? { count: null, error: new Error("timeout") }
        : { count: slug === undefined ? 80 : 30, error: null };
    const snapshot = await readySnapshot();
    expect(snapshot.coursesIncomplete).toBe(true);
    expect(snapshot.courses.some((course) => course.slug === failing!.slug)).toBe(false);
  });

  it("treats a thrown query as an unavailable metric", async () => {
    resolveCount = (table, slug) => {
      if (table === "assessment_answers") throw new Error("socket");
      return { count: slug === undefined ? 80 : 30, error: null };
    };
    const snapshot = await readySnapshot();
    expect(snapshot.unavailableTotals).toEqual(["assessmentAnswers"]);
  });

  it("returns no leaf string other than the suppression marker", async () => {
    resolveCount = (table, slug) => ({
      count: slug !== undefined ? 7 : table === "account_llm_keys" ? 2 : 90,
      error: null,
    });
    const snapshot = await readySnapshot();
    for (const value of Object.values(snapshot.totals)) {
      expect(typeof value === "number" || value === "suppressed").toBe(true);
    }
    for (const course of snapshot.courses) {
      expect(typeof course.count).toBe("number");
    }
  });

  it("never names identity, profile or auth-administration data", () => {
    const source = readFileSync(
      path.resolve(__dirname, "analytics-aggregates.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /identity_data|raw_user_meta_data|user_metadata|avatar_url|full_name|picture|auth\.admin/,
    );
    expect(source).not.toMatch(/@\/lib\/supabase\/admin/);
  });
});
