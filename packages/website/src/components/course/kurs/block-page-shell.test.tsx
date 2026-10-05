import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { getBlocks, getCourseConfig } from "@/lib/course/data";
import { localizeHref } from "@/lib/i18n/locale";
import { isLessonEngineCourse } from "@/lib/courses/completion";

const observed = vi.hoisted(() => ({
  props: null as ComponentProps<typeof import("./lesson-layout").LessonLayout> | null,
}));

vi.mock("@/components/course/kurs/lesson-layout", () => ({
  LessonLayout: (props: NonNullable<typeof observed.props>) => {
    observed.props = props;
    return <div data-testid="lesson-layout" />;
  },
}));

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: navigation.redirect,
  notFound: navigation.notFound,
}));

import { BlockPageShell } from "./block-page-shell";

afterEach(cleanup);

describe("<BlockPageShell>", () => {
  it("renders the course-app reader: no poster subheader, the whole course as an outline", () => {
    const { container } = render(
      <BlockPageShell courseSlug="ki-fuehrerschein" blockId="block_1" />,
    );

    // The sticky course header lives inside the lesson shell (LessonLayout);
    // the block route renders no second banner or block heading of its own.
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(container.querySelector("[data-course-reader]")).toHaveClass("course-app-ground");
    expect(screen.getByTestId("lesson-layout")).toBeInTheDocument();

    const blocks = getBlocks("ki-fuehrerschein", "de");
    const courseApp = observed.props?.courseApp;
    expect(courseApp?.courseTitle).toBe(getCourseConfig("ki-fuehrerschein", "de").title);
    expect(courseApp?.hubHref).toBe("/ki-fuehrerschein/kurs");
    expect(courseApp?.moduleNumber).toBe(1);
    expect(courseApp?.outline.map((module) => module.id)).toEqual(blocks.map((block) => block.id));
    // Lessons of this route switch in place; other modules link by fragment.
    expect(courseApp?.outline[0].lessons.every((lesson) => lesson.href === undefined)).toBe(true);
    expect(courseApp?.outline[1].lessons[0].href).toBe(
      `/ki-fuehrerschein/kurs/${blocks[1].id}#lesson=${encodeURIComponent(blocks[1].lessons[0].id)}`,
    );
    expect(
      courseApp?.outline.flatMap((module) => module.lessons.map((lesson) => lesson.number)),
    ).toEqual(blocks.flatMap((block) => block.lessons).map((_, index) => index + 1));
  });

  it("renders English course-app chrome without changing the course path", () => {
    render(
      <BlockPageShell
        courseSlug="ki-fuehrerschein"
        blockId="block_1"
        locale="en"
      />,
    );

    // KI-Führerschein runs on the lesson engine and calls its units modules.
    expect(observed.props?.courseApp?.hubHref).toBe("/en/ki-fuehrerschein/kurs");
    expect(observed.props?.courseApp?.outline[0].title).toBe("What may go in?");
    expect(observed.props?.moduleLabel).toBe("Module 1 · What may go in?");
  });

  it("sends retired lesson-engine block bookmarks to the hub and 404s unknown legacy blocks", () => {
    expect(() =>
      render(<BlockPageShell courseSlug="ki-fuehrerschein" blockId="block_5" locale="en" />),
    ).toThrow("NEXT_REDIRECT:/en/ki-fuehrerschein/kurs");
    expect(() =>
      render(<BlockPageShell courseSlug="ki-und-gesellschaft" blockId="block_9" />),
    ).toThrow("NEXT_REDIRECT:/ki-und-gesellschaft/kurs");
    expect(() =>
      render(<BlockPageShell courseSlug="ki-fuehrerschein" blockId="not-a-block" />),
    ).toThrow("NEXT_NOT_FOUND");
  });

  it("labels the ported EU AI Act course in modules and retires its block_6 bookmark", () => {
    render(
      <BlockPageShell courseSlug="eu-ai-act-kurs" blockId="block_1" locale="en" />,
    );
    expect(observed.props?.courseApp?.outline).toHaveLength(5);
    expect(observed.props?.moduleLabel).toBe("Module 1 · Does it apply to me?");
    cleanup();
    expect(() =>
      render(<BlockPageShell courseSlug="eu-ai-act-kurs" blockId="block_6" />),
    ).toThrow("NEXT_REDIRECT:/eu-ai-act-kurs/kurs");
  });

  for (const locale of ["de", "en"] as const) {
    for (const courseSlug of ["ki-fuehrerschein", "eu-ai-act-kurs", "ki-und-gesellschaft"] as const) {
      it.each(["first", "middle", "final"] as const)(`${locale} ${courseSlug} provides bounded block/terminal metadata (%s)`, (position) => {
        const blocks = getBlocks(courseSlug, locale);
        const index = position === "first" ? 0 : position === "middle" ? Math.floor(blocks.length / 2) : blocks.length - 1;
        const block = blocks[index];
        const next = blocks[index + 1];
        const coursePath = getCourseConfig(courseSlug, locale).coursePath;
        render(<BlockPageShell courseSlug={courseSlug} blockId={block.id} locale={locale} />);
        expect(observed.props).toMatchObject({
          lessonOffset: blocks.slice(0, index).reduce((sum, item) => sum + item.lessons.length, 0),
          courseLessonCount: blocks.reduce((sum, item) => sum + item.lessons.length, 0),
          followingHref: localizeHref(next
            ? `${coursePath}/${next.id}#lesson=${encodeURIComponent(next.lessons[0].id)}`
            : `${coursePath}/quiz`, locale),
          followingLabel: next
            ? isLessonEngineCourse(courseSlug)
              ? locale === "de"
                ? `Weiter mit Modul ${index + 2}: ${next.title}`
                : `Continue with module ${index + 2}: ${next.title}`
              : (locale === "de" ? "Nächster Block" : "Next block")
            : (locale === "de" ? "Zur Prüfung" : "Assessment"),
        });
      });
    }
  }
});
