import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import {
  trackEvent,
  recordForDebug,
  getRecentEvents,
  type AiNativeEvent,
} from "./analytics";

describe("ai-native analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not throw when called in SSR-like context", () => {
    // Simulate SSR by spying on window
    const originalWindow = global.window;
    // @ts-expect-error — intentional SSR simulation
    delete global.window;
    try {
      expect(() =>
        trackEvent({
          name: "ai_native_section_read",
          props: {
            moduleId: "m",
            lessonId: "l",
            sectionId: "s",
            sectionIndex: 0,
          },
        }),
      ).not.toThrow();
    } finally {
      global.window = originalWindow;
    }
  });

  it("logs to console.info in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const props = {
      moduleId: "modul_1",
      lessonId: "modul_1_lesson_1",
      sectionId: "sec_1",
      sectionIndex: 0,
    };
    trackEvent({ name: "ai_native_section_read", props });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "[ai-native.analytics]",
      "ai_native_section_read",
      props,
    );
  });

  it.each(["production", "test"])("does not log when NODE_ENV is %s", (env) => {
    vi.stubEnv("NODE_ENV", env);
    const spies = (["info", "debug", "log", "warn"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    trackEvent({
      name: "ai_native_module_complete",
      props: {
        moduleId: "modul_1",
        completedLessonCount: 1,
        totalLessonCount: 2,
      },
    });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it("carries no free-text field and no removed event in the union", () => {
    type EventName = AiNativeEvent["name"];
    type PropKey = AiNativeEvent extends infer E
      ? E extends { readonly props: infer P }
        ? keyof P
        : never
      : never;
    expectTypeOf<Extract<PropKey, "errorMessage">>().toBeNever();
    expectTypeOf<
      Extract<
        EventName,
        | "ai_native_exercise_error_boundary"
        | "ai_native_challenge_reveal"
        | "ai_native_demo_interaction_start"
      >
    >().toBeNever();

    const source = readFileSync(
      join(process.cwd(), "src/lib/ai-native/analytics.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/errorMessage|posthog|plausible/i);
    expect(source).not.toMatch(/ai_native_exercise_error_boundary/);
    expect(source).not.toMatch(/ai_native_challenge_reveal/);
    expect(source).not.toMatch(/ai_native_demo_interaction_start/);
  });

  it("records events for debug panel up to the ring limit", () => {
    // Push 60 events; expect only the last 50 to remain.
    for (let i = 0; i < 60; i++) {
      recordForDebug({
        name: "ai_native_section_read",
        props: {
          moduleId: "modul_1",
          lessonId: "modul_1_lesson_1",
          sectionId: `sec_${i}`,
          sectionIndex: i,
        },
      });
    }
    const events = getRecentEvents();
    expect(events.length).toBeLessThanOrEqual(50);
    // Last event should be the most recently pushed
    const last = events[events.length - 1];
    expect(last?.event.name).toBe("ai_native_section_read");
    if (last && last.event.name === "ai_native_section_read") {
      expect(last.event.props.sectionIndex).toBe(59);
    }
  });

  it("getRecentEvents returns an independent array (not a live reference)", () => {
    const snap1 = getRecentEvents();
    recordForDebug({
      name: "ai_native_section_read",
      props: {
        moduleId: "modul_1",
        lessonId: "modul_1_lesson_1",
        sectionId: "snap_unique",
        sectionIndex: 999,
      },
    });
    const snap2 = getRecentEvents();
    // snap1 must NOT be mutated by a subsequent record — it's a slice.
    expect(snap1).not.toBe(snap2);
    // Last entry in snap2 must reflect the new push
    const last = snap2[snap2.length - 1];
    if (last && last.event.name === "ai_native_section_read") {
      expect(last.event.props.sectionId).toBe("snap_unique");
    }
  });
});
