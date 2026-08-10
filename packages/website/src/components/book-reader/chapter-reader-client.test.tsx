import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  BookChapterMeta,
  ChapterNeighbours,
} from "@/lib/book-reader-content";

const readerMocks = vi.hoisted(() => ({
  getOwnedLocalLearningItem: vi.fn<() => string | null>(),
  ownerListener: null as
    | ((owner: {
        readonly kind: "anonymous";
        readonly generation: number;
      }) => void)
    | null,
  push: vi.fn(),
  scrollIntoView: vi.fn(),
  scrollTo: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: readerMocks.push }),
}));

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => ({
    kind: "anonymous" as const,
    generation: 1,
  }),
  getOwnedLocalLearningItem: readerMocks.getOwnedLocalLearningItem,
  setOwnedLocalLearningItem: vi.fn(() => true),
  subscribeLearningOwner: (
    listener: (owner: {
      readonly kind: "anonymous";
      readonly generation: number;
    }) => void,
  ) => {
    readerMocks.ownerListener = listener;
    return () => {
      readerMocks.ownerListener = null;
    };
  },
}));

import {
  ChapterReaderClient,
  ChapterTocLinks,
} from "./chapter-reader-client";

const CHAPTER: BookChapterMeta = {
  slug: "test-chapter",
  title: "Testkapitel",
  sourceFile: "test.md",
};

const NEIGHBOURS: ChapterNeighbours = {
  prev: null,
  next: null,
};

function renderReader({
  locale = "de",
  neighbours = NEIGHBOURS,
}: {
  readonly locale?: "de" | "en";
  readonly neighbours?: ChapterNeighbours;
} = {}) {
  const headings = [
    { id: "late-anchor", text: "Late anchor", level: 2 as const },
  ];
  return render(
    <>
      <h2 id="late-anchor">Late anchor</h2>
      <ChapterReaderClient
        bookId="test-book"
        chapterSlug={CHAPTER.slug}
        neighbours={neighbours}
        locale={locale}
      />
      <ChapterTocLinks headings={headings} />
    </>,
  );
}

describe("ChapterReaderClient fragment restoration", () => {
  beforeEach(() => {
    readerMocks.getOwnedLocalLearningItem.mockReset();
    readerMocks.getOwnedLocalLearningItem.mockReturnValue(null);
    readerMocks.ownerListener = null;
    readerMocks.push.mockReset();
    readerMocks.scrollIntoView.mockReset();
    readerMocks.scrollTo.mockReset();
    window.history.replaceState({}, "", "/buecher/test-book/test-chapter");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: readerMocks.scrollIntoView,
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: readerMocks.scrollTo,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps a resolvable deep link when the learning owner changes", () => {
    window.history.replaceState(
      {},
      "",
      "/buecher/test-book/test-chapter#late-anchor",
    );

    renderReader();

    expect(readerMocks.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(readerMocks.scrollTo).not.toHaveBeenCalled();
    expect(readerMocks.ownerListener).not.toBeNull();

    act(() => {
      readerMocks.ownerListener?.({
        kind: "anonymous",
        generation: 2,
      });
    });

    expect(readerMocks.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(readerMocks.scrollTo).not.toHaveBeenCalled();
  });

  it("handles malformed percent encoding and falls back to stored progress", () => {
    window.history.replaceState(
      {},
      "",
      "/buecher/test-book/test-chapter#%E0%A4%A",
    );

    expect(() => renderReader()).not.toThrow();
    expect(readerMocks.scrollIntoView).not.toHaveBeenCalled();
    expect(readerMocks.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "instant",
    });
  });

  it("hydrates a plain-data TOC leaf and marks runtime readiness", () => {
    renderReader({ locale: "en" });

    expect(screen.getByRole("link", { name: "Late anchor" })).toHaveAttribute(
      "href",
      "#late-anchor",
    );
    expect(screen.getByRole("link", { name: "Late anchor" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(
      document.querySelector(
        '[data-book-reader-runtime="test-book:test-chapter"]',
      ),
    ).toHaveAttribute("data-book-reader-ready", "test-book:test-chapter");
    expect(document.documentElement).not.toHaveAttribute(
      "data-book-reader-ready",
    );
  });

  it("keeps keyboard navigation and progress identity locale-independent", () => {
    const next: BookChapterMeta = {
      slug: "next-chapter",
      title: "Next chapter",
      sourceFile: "next.md",
    };
    renderReader({
      locale: "en",
      neighbours: { prev: null, next },
    });

    expect(readerMocks.getOwnedLocalLearningItem).toHaveBeenCalledWith(
      "reader:progress:test-book:test-chapter",
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(readerMocks.push).toHaveBeenCalledWith(
      "/en/buecher/test-book/next-chapter",
    );
  });
});
