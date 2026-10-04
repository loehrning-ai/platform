import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BlockSummary } from "@/lib/course/types";
import { KursContent as EuAiActHub } from "./eu-ai-act-kurs/kurs/kurs-content";

const BLOCKS: readonly BlockSummary[] = [
  {
    id: "block_1",
    title: "Input boundaries",
    description: "A first bounded learning task.",
    durationMinutes: 12,
    orderIndex: 0,
    lessonIds: ["p2-input-boundaries"],
  },
  {
    id: "block_2",
    title: "Output review",
    description: "A second bounded learning task.",
    durationMinutes: 14,
    orderIndex: 1,
    lessonIds: ["p2-output-review"],
  },
];

// The lesson-engine hubs (KI-Führerschein, KI und Gesellschaft) link
// lessons, not blocks; their accessible lesson links are covered in
// components/lesson-engine/module-overview.test.tsx.
const COURSE_HUBS = [
  {
    label: "EU AI Act",
    slug: "eu-ai-act-kurs",
    Component: EuAiActHub,
  },
] as const;

afterEach(cleanup);

describe.each(COURSE_HUBS)(
  "$label course-hub block actions",
  ({ slug, Component }) => {
    it.each([
      ["de", "Block starten", ""],
      ["en", "Start block", "/en"],
    ] as const)(
      "includes each mapped block title in the %s accessible name",
      (locale, action, localePrefix) => {
        render(
          <Component
            blocks={BLOCKS}
            totalLessons={BLOCKS.length}
            locale={locale}
          />,
        );

        const links = BLOCKS.map((block) => {
          const link = screen.getByRole("link", {
            name: `${action}: ${block.title}`,
          });
          expect(link).toHaveAttribute(
            "href",
            `${localePrefix}/${slug}/kurs/${block.id}`,
          );
          expect(link).toHaveTextContent(action);
          expect(link).toHaveClass("min-h-11");
          return link;
        });

        expect(
          new Set(links.map((link) => link.getAttribute("aria-label"))).size,
        ).toBe(BLOCKS.length);
      },
    );
  },
);
