import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TocHeading } from "@/lib/book-reader-content";

vi.mock("./chapter-reader-client", () => ({
  ChapterTocLinks: ({
    headings,
  }: {
    readonly headings: readonly { id: string; text: string }[];
  }) => (
    <ul data-testid="toc-links">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`}>{heading.text}</a>
        </li>
      ))}
    </ul>
  ),
}));

import { ChapterTocSheet } from "./chapter-toc-sheet";

const HEADINGS: TocHeading[] = [
  { id: "eisberg", text: "Der Eisberg", level: 2 },
  { id: "methodik", text: "Methodik", level: 3 },
];

function renderSheet() {
  return render(
    <div data-reader-focus-bar>
      <ChapterTocSheet
        summaryLabel="Inhalt"
        heading="In diesem Kapitel"
        navLabel="Kapitelinhalt"
        headings={HEADINGS}
      >
        <a href="/buecher/ki-landschaft">Alle Kapitel</a>
      </ChapterTocSheet>
    </div>,
  );
}

function details(): HTMLDetailsElement {
  const element = document.querySelector<HTMLDetailsElement>(
    "[data-chapter-toc-sheet]",
  );
  if (!element) throw new Error("sheet not rendered");
  return element;
}

/** Open the disclosure the way a summary activation would, toggle event included. */
function openSheet() {
  act(() => {
    details().open = true;
    fireEvent(details(), new Event("toggle"));
  });
}

afterEach(() => {
  cleanup();
});

describe("<ChapterTocSheet>", () => {
  it("is a closed native disclosure with a 44px trigger and the contents navigation inside", () => {
    renderSheet();

    const sheet = details();
    expect(sheet.open).toBe(false);
    expect(sheet.tagName).toBe("DETAILS");

    const summary = sheet.querySelector("summary");
    expect(summary).toHaveTextContent("Inhalt");
    expect(summary).toHaveClass("min-h-11", "min-w-11", "list-none");

    const panel = sheet.querySelector("[data-chapter-toc-sheet-panel]");
    expect(panel).toHaveClass(
      "absolute",
      "bottom-full",
      "inset-x-0",
      "overflow-y-auto",
      "[&_a]:min-h-11",
    );
    expect(within(sheet).getByText("In diesem Kapitel")).toBeInTheDocument();
    const nav = within(sheet).getByRole("navigation", { name: "Kapitelinhalt" });
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(
      within(sheet).getByRole("link", { name: "Alle Kapitel" }),
    ).toHaveAttribute("href", "/buecher/ki-landschaft");
  });

  it("closes when a heading link is chosen", () => {
    renderSheet();
    openSheet();
    expect(details().open).toBe(true);

    fireEvent.click(screen.getByRole("link", { name: "Methodik" }));
    expect(details().open).toBe(false);
  });

  it("closes on Escape and hands focus back to the trigger", () => {
    renderSheet();
    openSheet();
    const link = screen.getByRole("link", { name: "Methodik" });
    link.focus();

    fireEvent.keyDown(link, { key: "Escape" });

    expect(details().open).toBe(false);
    expect(details().querySelector("summary")).toHaveFocus();
  });

  it("closes on a tap outside and stays open on a tap inside", () => {
    renderSheet();
    openSheet();

    fireEvent.pointerDown(screen.getByText("In diesem Kapitel"));
    expect(details().open).toBe(true);

    fireEvent.pointerDown(document.body);
    expect(details().open).toBe(false);
  });

  it("does nothing on Escape or outside taps while closed", () => {
    renderSheet();
    const summary = details().querySelector("summary");
    if (!summary) throw new Error("summary not rendered");

    fireEvent.keyDown(summary, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(details().open).toBe(false);
  });

  it("keeps the sheet flat, bounded and free of hard-coded shell geometry", () => {
    const source = readFileSync(join(__dirname, "chapter-toc-sheet.tsx"), "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("<details");
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/shadow-|animate-|hover:-translate/);
    expect(source).not.toMatch(/\b100vh\b/);
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
  });
});
