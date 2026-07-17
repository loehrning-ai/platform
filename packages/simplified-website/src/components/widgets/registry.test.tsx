import { describe, it, expect, vi } from "vitest";
import { resolveWidgetsForSlot } from "./registry";
import type { Widget } from "@/lib/widgets/types";

/**
 * Registry render-path tests intentionally omit React Testing Library to
 * avoid adding a new dependency (project uses vitest only for units today).
 * Render behavior is verified via Playwright smokes in AI-native demo gallery implementation.
 */

describe("resolveWidgetsForSlot", () => {
  const widgets: Widget[] = [
    { kind: "demo-chat-rag", placement: "after-intro" },
    { kind: "exercise-fix-prompt", placement: "before-quiz" },
    { kind: "demo-compliance", placement: "end" },
  ];

  it("returns widgets for a matching slot", () => {
    expect(resolveWidgetsForSlot(widgets, "after-intro")).toEqual([widgets[0]]);
    expect(resolveWidgetsForSlot(widgets, "before-quiz")).toEqual([widgets[1]]);
    expect(resolveWidgetsForSlot(widgets, "end")).toEqual([widgets[2]]);
  });

  it("returns an empty array when widgets is undefined", () => {
    expect(resolveWidgetsForSlot(undefined, "end")).toEqual([]);
  });

  it("returns an empty array when no widgets match a slot", () => {
    const subset: Widget[] = [{ kind: "demo-chat-rag", placement: "after-intro" }];
    expect(resolveWidgetsForSlot(subset, "before-quiz")).toEqual([]);
    expect(resolveWidgetsForSlot(subset, "end")).toEqual([]);
  });

  it("falls back invalid placements to 'end' with a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad: Widget[] = [
      {
        kind: "demo-chat-rag",
        // Intentionally broken — simulating an authoring typo after JSON edit.
        placement: "after_intro" as unknown as Widget["placement"],
      },
    ];
    // Not in the 'after-intro' slot:
    expect(resolveWidgetsForSlot(bad, "after-intro")).toEqual([]);
    // Falls back to 'end':
    expect(resolveWidgetsForSlot(bad, "end")).toEqual(bad);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid widget placement"),
    );
    warnSpy.mockRestore();
  });

  it("multiple widgets in the same slot are all returned", () => {
    const multi: Widget[] = [
      { kind: "demo-chat-rag", placement: "after-intro" },
      { kind: "exercise-fix-prompt", placement: "after-intro" },
      { kind: "demo-compliance", placement: "end" },
    ];
    const inSlot = resolveWidgetsForSlot(multi, "after-intro");
    expect(inSlot).toHaveLength(2);
    expect(inSlot.map((w) => w.kind)).toEqual([
      "demo-chat-rag",
      "exercise-fix-prompt",
    ]);
  });
});
