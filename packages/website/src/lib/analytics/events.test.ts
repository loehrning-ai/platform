/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "@/lib/analytics";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  lessonOrdinal,
  loginGateReasonFromParam,
  trackAgentTokenSurface,
  trackAiGradingFailure,
  trackCourseCompletion,
  trackCourseStarted,
  trackKiCheck,
  trackLessonCompleted,
  trackLessonReached,
  trackLoginFlow,
  trackLoginGate,
  trackMaterialOpened,
  trackProgressSyncFailure,
} from "./events";
import { ANALYTICS_EVENTS, isAnalyticsEventName } from "./registry";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const trackMock = vi.mocked(track);

function lastCall(): readonly [string, Record<string, unknown> | undefined] {
  const call = trackMock.mock.calls.at(-1);
  if (!call) throw new Error("track was not called");
  return [call[0], call[1] as Record<string, unknown> | undefined];
}

/** Every emitted call must be a declared event with declared values only. */
function expectDeclared(): void {
  for (const [event, props] of trackMock.mock.calls) {
    expect(isAnalyticsEventName(event)).toBe(true);
    if (!isAnalyticsEventName(event)) continue;
    const vocabulary: {
      readonly subject: readonly string[];
      readonly facet?: readonly string[];
    } = ANALYTICS_EVENTS[event];
    const entries = Object.entries(props ?? {});
    expect(entries.length).toBeLessThanOrEqual(2);
    for (const [key, value] of entries) {
      expect(["subject", "facet"]).toContain(key);
      const allowed = key === "subject" ? vocabulary.subject : vocabulary.facet;
      expect(allowed).toContain(value);
    }
  }
}

describe("analytics event helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  afterEach(() => {
    expectDeclared();
    vi.restoreAllMocks();
  });

  it("course_started carries the course and an explicit source", () => {
    trackCourseStarted("ki-fuehrerschein", "katalog");
    expect(lastCall()).toEqual([
      "course_started",
      { subject: "ki-fuehrerschein", facet: "katalog" },
    ]);
  });

  it("course_started classifies the referrer when no source is given", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue("");
    trackCourseStarted("codex");
    expect(lastCall()).toEqual([
      "course_started",
      { subject: "codex", facet: "direct" },
    ]);
  });

  it("lesson_reached and lesson_completed carry course and ordinal", () => {
    trackLessonReached("eu-ai-act-kurs", "l05");
    expect(lastCall()).toEqual([
      "lesson_reached",
      { subject: "eu-ai-act-kurs", facet: "l05" },
    ]);
    trackLessonCompleted("data-science", "l02");
    expect(lastCall()).toEqual([
      "lesson_completed",
      { subject: "data-science", facet: "l02" },
    ]);
  });

  it("course_completion carries the outcome label only", () => {
    trackCourseCompletion("claude", "exam_timeout");
    expect(lastCall()).toEqual([
      "course_completion",
      { subject: "claude", facet: "exam_timeout" },
    ]);
  });

  it("login_flow and login_gate carry enums only", () => {
    trackLoginFlow("magic_link", "link_sent");
    expect(lastCall()).toEqual([
      "login_flow",
      { subject: "magic_link", facet: "link_sent" },
    ]);
    trackLoginGate("abgelaufen", "oauth_only");
    expect(lastCall()).toEqual([
      "login_gate",
      { subject: "abgelaufen", facet: "oauth_only" },
    ]);
  });

  it.each([
    ["progress-save", "progress_save"],
    ["kurs-login", "kurs_login"],
    ["anderes-geraet", "anderes_geraet"],
    ["abgelaufen", "abgelaufen"],
    ["ungueltig", "ungueltig"],
    ["auth-not-configured", "auth_not_configured"],
    ["auth-unavailable", "auth_unavailable"],
    ["missing-code", "missing_code"],
    ["invalid-link", "invalid_link"],
    ["untrusted-origin", "untrusted_origin"],
    ["invalid-code-format", "invalid_code_format"],
  ])("maps the login reason %s to %s", (param, reason) => {
    expect(loginGateReasonFromParam(param)).toBe(reason);
  });

  it.each([undefined, "", "person@example.org", "progress_save", "__proto__", 7])(
    "maps the unknown login reason %s to fallback",
    (param) => {
      expect(loginGateReasonFromParam(param)).toBe("fallback");
    },
  );

  it("ki_check sends the recommended course only with a CTA", () => {
    trackKiCheck("started");
    expect(lastCall()).toEqual(["ki_check", { subject: "started" }]);
    trackKiCheck("cta_course", "eu-ai-act-kurs");
    expect(lastCall()).toEqual([
      "ki_check",
      { subject: "cta_course", facet: "eu-ai-act-kurs" },
    ]);
  });

  it("material_opened carries workshop and kind", () => {
    trackMaterialOpened("geschaeftsberichte-mit-ki-lesen", "zip");
    expect(lastCall()).toEqual([
      "material_opened",
      { subject: "geschaeftsberichte-mit-ki-lesen", facet: "zip" },
    ]);
  });

  it.each(["permanent", "retry_exhausted", "startup"] as const)(
    "platform_failure carries the progress sync failure %s",
    (failure) => {
      trackProgressSyncFailure(failure);
      expect(lastCall()).toEqual([
        "platform_failure",
        { subject: "progress_sync", facet: failure },
      ]);
    },
  );

  it.each([
    ["provider-not-ready", "provider_not_ready"],
    ["quota-unavailable", "quota_unavailable"],
    ["budget-exhausted", "budget_exhausted"],
    ["rate-limited", "rate_limited"],
    ["network", "network"],
    ["parse-error", "parse_error"],
    ["timeout", "timeout"],
    ["bad-request", "bad_request"],
  ] as const)("platform_failure snake_cases the grading reason %s", (reason, facet) => {
    trackAiGradingFailure(reason);
    expect(lastCall()).toEqual([
      "platform_failure",
      { subject: "ai_grading", facet },
    ]);
  });

  it("does not emit for an undeclared grading reason", () => {
    trackAiGradingFailure("anything" as never);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it.each(["available", "minted", "revoked", "failed"] as const)(
    "advanced_surface carries the agent token step %s",
    (step) => {
      trackAgentTokenSurface(step);
      expect(lastCall()).toEqual([
        "advanced_surface",
        { subject: "agent_token", facet: step },
      ]);
    },
  );
});

describe("lessonOrdinal", () => {
  it("returns the one-based canonical position", () => {
    const [first, second] = CANONICAL_LESSON_IDS["ki-fuehrerschein"];
    expect(lessonOrdinal("ki-fuehrerschein", first ?? "")).toBe("l01");
    expect(lessonOrdinal("ki-fuehrerschein", second ?? "")).toBe("l02");
  });

  it("reaches the last lesson of the longest course", () => {
    const ids = CANONICAL_LESSON_IDS["ai-native-operator"];
    const last = ids[ids.length - 1] ?? "";
    expect(lessonOrdinal("ai-native-operator", last)).toBe(
      `l${String(ids.length).padStart(2, "0")}`,
    );
  });

  it("returns null for an id that is not canonical for that course", () => {
    const [kiId] = CANONICAL_LESSON_IDS["ki-fuehrerschein"];
    expect(lessonOrdinal("ki-fuehrerschein", "not-a-lesson")).toBeNull();
    expect(lessonOrdinal("ki-fuehrerschein", "")).toBeNull();
    expect(lessonOrdinal("claude", kiId ?? "")).toBeNull();
  });
});
