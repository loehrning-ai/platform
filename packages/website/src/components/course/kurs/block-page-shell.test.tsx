import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { getBlocks, getCourseConfig } from "@/lib/course/data";
import { localizeHref } from "@/lib/i18n/locale";

const observed = vi.hoisted(() => ({
  props: null as ComponentProps<typeof import("./lesson-layout").LessonLayout> | null,
}));

vi.mock("@/components/course/kurs/lesson-layout", () => ({
  LessonLayout: (props: NonNullable<typeof observed.props>) => {
    observed.props = props;
    return <div data-testid="lesson-layout" />;
  },
}));

import { BlockPageShell } from "./block-page-shell";

afterEach(cleanup);

describe("<BlockPageShell>", () => {
  it("uses a two-row phone header and restores the compact desktop row", () => {
    render(
      <BlockPageShell courseSlug="ki-fuehrerschein" blockId="block_1" />,
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("relative", "lg:sticky", "lg:top-[var(--nav-h)]");
    expect(header).not.toHaveClass("sticky");
    expect(header.firstElementChild).toHaveClass(
      "grid",
      "grid-cols-[minmax(0,1fr)_auto]",
      "sm:flex",
    );
    expect(within(header).getByRole("heading", { level: 1 })).toHaveClass(
      "break-words",
      "sm:inline",
    );
    expect(screen.getByTestId("lesson-layout")).toBeInTheDocument();
  });

  it("renders English block chrome without changing the course path", () => {
    render(
      <BlockPageShell
        courseSlug="ki-fuehrerschein"
        blockId="block_1"
        locale="en"
      />,
    );

    expect(screen.getByRole("link", { name: "All blocks" })).toHaveAttribute(
      "href",
      "/en/ki-fuehrerschein/kurs",
    );
    expect(screen.getByText("Block 1 / 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AI is already here",
    );
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
            ? (locale === "de" ? "Nächster Block" : "Next block")
            : (locale === "de" ? "Zur Prüfung" : "Assessment"),
        });
      });
    }
  }
});
