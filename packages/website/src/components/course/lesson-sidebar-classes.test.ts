import { describe, expect, it } from "vitest";
import {
  LESSON_SIDEBAR_GROUP_LABEL_CLASS,
  LESSON_SIDEBAR_ITEM_CLASS,
  lessonSidebarIndexClass,
  lessonSidebarLinkClass,
} from "./lesson-sidebar-classes";

const OLD_LOOK =
  /border-l-2|border-brand-orange|bg-brand-orange|text-brand-orange|font-mono|uppercase|tracking-\[0\./;

describe("lesson sidebar recipe", () => {
  it.each([true, false])(
    "keeps a 44px row with visible focus and no orange rail (active=%s)",
    (active) => {
      for (const className of [
        lessonSidebarLinkClass(active),
        active ? LESSON_SIDEBAR_ITEM_CLASS.active : LESSON_SIDEBAR_ITEM_CLASS.idle,
      ]) {
        expect(className).toContain("min-h-11");
        expect(className).toContain("focus-visible:outline-2");
        expect(className).toContain("motion-reduce:transition-none");
        expect(className).not.toMatch(OLD_LOOK);
      }
    },
  );

  it("marks the current numbered row by tone, weight and an ink square", () => {
    const active = lessonSidebarLinkClass(true);
    expect(active).toContain("bg-card-hover");
    expect(active).toContain("font-semibold");
    expect(active).toContain("relative");
    expect(active).toContain("before:bg-foreground");
    expect(lessonSidebarLinkClass(false)).not.toContain("before:bg-foreground");
  });

  it("sets numbers in ink or Schiefer, never Mennige or mono", () => {
    expect(lessonSidebarIndexClass(true)).toContain("text-foreground");
    expect(lessonSidebarIndexClass(false)).toContain("text-muted-foreground");
    for (const className of [
      lessonSidebarIndexClass(true),
      lessonSidebarIndexClass(false),
      LESSON_SIDEBAR_GROUP_LABEL_CLASS,
    ]) {
      expect(className).not.toMatch(OLD_LOOK);
    }
    expect(lessonSidebarIndexClass(true)).toContain("tabular-nums");
  });
});
