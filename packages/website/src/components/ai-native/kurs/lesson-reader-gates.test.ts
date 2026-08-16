import { describe, expect, it } from "vitest";

import {
  areLessonSectionsReady,
  canAdvanceLessonSection,
  resolveAiNativeProjectStatus,
} from "./lesson-reader";

describe("AI-Native lesson reader gates", () => {
  it("does not let keyboard navigation advance past an unread section", () => {
    expect(canAdvanceLessonSection(new Set(), "section-1")).toBe(false);
    expect(
      canAdvanceLessonSection(new Set(["section-1"]), "section-1"),
    ).toBe(true);
    expect(canAdvanceLessonSection(new Set(["section-1"]), undefined)).toBe(
      false,
    );
  });

  it("does not finalize a lesson until every canonical section is persisted", () => {
    const sectionIds = ["section-1", "section-2", "section-3"];

    expect(
      areLessonSectionsReady(
        sectionIds,
        new Set(["section-1", "section-3"]),
      ),
    ).toBe(false);
    expect(
      areLessonSectionsReady(sectionIds, new Set(sectionIds)),
    ).toBe(true);
  });
});

describe("AI-Native applied-project migration status", () => {
  it("keeps historical capstone state distinct from verified project evidence", () => {
    expect(resolveAiNativeProjectStatus(false, true)).toBe("legacy-capstone");
    expect(resolveAiNativeProjectStatus(false, false)).toBe("pending");
  });

  it("gives exact project evidence precedence when both signals exist", () => {
    expect(resolveAiNativeProjectStatus(true, true)).toBe("verified-project");
    expect(resolveAiNativeProjectStatus(true, false)).toBe("verified-project");
  });
});
