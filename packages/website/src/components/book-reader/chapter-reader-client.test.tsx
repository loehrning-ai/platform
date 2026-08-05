import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "@/lib/books";
import type {
  BookChapterMeta,
  ChapterNeighbours,
} from "@/lib/book-reader-content";

const readerMocks = vi.hoisted(() => ({
  getOwnedLocalLearningItem: vi.fn<() => string | null>(),
  ownerListener: null as
    | ((owner: { readonly kind: "anonymous"; readonly generation: number }) => void)
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

import { ChapterReaderClient } from "./chapter-reader-client";

const BOOK = {
  id: "test-book",
  title: "Testbuch",
  relatedResourceHref: "/test-kurs",
  relatedResourceLabel: "Testkurs",
  pdfPath: null,
} as Book;

const CHAPTER: BookChapterMeta = {
  slug: "test-chapter",
  title: "Testkapitel",
  sourceFile: "test.md",
};

const NEIGHBOURS: ChapterNeighbours = {
  prev: null,
  next: null,
};

function renderReader() {
  return render(
    <ChapterReaderClient
      book={BOOK}
      chapterMeta={CHAPTER}
      headings={[{ id: "late-anchor", text: "Late anchor", level: 2 }]}
      readingTimeMinutes={3}
      neighbours={NEIGHBOURS}
      allChapters={[CHAPTER]}
      content={<h2 id="late-anchor">Late anchor</h2>}
    />,
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
});
