import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

/**
 * modules-overview.test.tsx (regression coverage)
 *
 * AiNativeModulesOverview derives per-module completion from a flat set of
 * completed lesson ids: it counts ids that start with `${mod.id}_lesson`,
 * computes the percentage, decides `fullyComplete`, and only paints a progress
 * bar once at least one lesson is done. It also re-reads progress on a
 * cross-tab `storage` event keyed to the unified store. We mock the module
 * index + progress reader with controlled fixtures and assert those real
 * derivations; framer-motion, next/link and SectionHeader are stubbed.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
    "whileInView",
    "viewport",
  ]);
  const clean = (p: Record<string, unknown>) => {
    const o: Record<string, unknown> = {};
    for (const k in p) if (!DROP.has(k)) o[k] = p[k];
    return o;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
              createElement(tag, { ...clean(props), ref }),
            ),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return { __esModule: true, m, motion: m };
});

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    default: ({
      children,
      href,
      className,
      prefetch,
    }: {
      children: unknown;
      href: string;
      className?: string;
      prefetch?: boolean;
    }) =>
      createElement(
        "a",
        { href, className, "data-prefetch": String(prefetch) },
        children as never,
      ),
  };
});

vi.mock("@/components/ui/section-header", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    SectionHeader: ({
      eyebrow,
      heading,
      description,
    }: {
      eyebrow?: string;
      heading: string;
      description?: string;
    }) =>
      createElement(
        "div",
        null,
        createElement("p", null, eyebrow),
        createElement("h2", null, heading),
        createElement("p", null, description),
      ),
  };
});

vi.mock("@/lib/ai-native/data", () => ({
  __esModule: true,
  getModules: vi.fn(),
}));

vi.mock("@/lib/ai-native/progress", () => ({
  __esModule: true,
  getCompletedLessonIds: vi.fn(),
}));

import { AiNativeModulesOverview } from "./modules-overview";
import { getModules } from "@/lib/ai-native/data";
import { getCompletedLessonIds } from "@/lib/ai-native/progress";
import { __resetCacheForTests } from "@/lib/progress/store";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";

const MODULES = [
  {
    id: "modul_1",
    number: 1,
    title: "Prompt-Architektur",
    subtitle: "Fundament",
    durationMinutes: 120,
    lessonCount: 2,
    topics: ["T1", "T2", "T3", "T4", "T5"], // 5 -> "+1 weitere"
  },
  {
    id: "modul_2",
    number: 2,
    title: "Tool-Orchestrierung",
    subtitle: "Werkzeuge",
    durationMinutes: 150,
    lessonCount: 3,
    topics: ["X", "Y"],
  },
  {
    id: "modul_3",
    number: 3,
    title: "Workflow-Integration",
    subtitle: "Praxis",
    durationMinutes: 150,
    lessonCount: 4,
    topics: ["a", "b", "c", "d", "e", "f"], // 6 -> "+2 weitere"
  },
];

beforeEach(() => {
  __resetCacheForTests();
  vi.mocked(getModules).mockReturnValue(MODULES as never);
  vi.mocked(getCompletedLessonIds).mockReturnValue(
    new Set(["modul_1_lesson_1", "modul_1_lesson_2", "modul_3_lesson_1"]),
  );
});

describe("<AiNativeModulesOverview>", () => {
  it("renders the curriculum header and all module titles", () => {
    render(<AiNativeModulesOverview />);
    expect(screen.getByText("4 Module, 1 Denkweise")).toBeInTheDocument();
    expect(screen.getByText("Prompt-Architektur")).toBeInTheDocument();
    expect(screen.getByText("Tool-Orchestrierung")).toBeInTheDocument();
    expect(screen.getByText("Workflow-Integration")).toBeInTheDocument();
    // One "Kostenlos" chip per module.
    expect(screen.getAllByText("Kostenlos")).toHaveLength(3);
  });

  it("marks a fully-completed module 100% and a partial module by its rounded percent", () => {
    render(<AiNativeModulesOverview />);
    // modul_1: 2 of 2 -> 100%.
    expect(screen.getByText("2/2 · 100%")).toBeInTheDocument();
    // modul_3: 1 of 4 -> 25%.
    expect(screen.getByText("1/4 · 25%")).toBeInTheDocument();
  });

  it("omits the progress bar for a module with zero completed lessons", () => {
    render(<AiNativeModulesOverview />);
    // modul_2 has 0 done -> no "Fortschritt" row, no "0/3".
    expect(screen.queryByText(/0\/3/)).toBeNull();
    // Only the two modules with progress render the "Fortschritt" label.
    expect(screen.getAllByText("Fortschritt")).toHaveLength(2);
  });

  it("truncates the topic list to four and counts the remainder", () => {
    render(<AiNativeModulesOverview />);
    // modul_1 (5 topics) -> +1, modul_3 (6 topics) -> +2.
    expect(screen.getByText("+ 1 weitere Themen")).toBeInTheDocument();
    expect(screen.getByText("+ 2 weitere Themen")).toBeInTheDocument();
  });

  it("links each module card to its course route", () => {
    render(<AiNativeModulesOverview />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/ai-native/kurs/modul_1");
    for (const link of links) {
      expect(link).toHaveAttribute("data-prefetch", "false");
      expect(link.firstElementChild).toHaveClass("js-reveal");
    }
  });

  it("re-reads completions on a cross-tab storage event keyed to the unified store", () => {
    render(<AiNativeModulesOverview />);
    // Before: modul_2 has no progress bar.
    expect(screen.queryByText("3/3 · 100%")).toBeNull();

    // Simulate another tab completing all of modul_2.
    vi.mocked(getCompletedLessonIds).mockReturnValue(
      new Set([
        "modul_1_lesson_1",
        "modul_1_lesson_2",
        "modul_3_lesson_1",
        "modul_2_lesson_1",
        "modul_2_lesson_2",
        "modul_2_lesson_3",
      ]),
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: UNIFIED_STORAGE_KEY }),
      );
    });
    expect(screen.getByText("3/3 · 100%")).toBeInTheDocument();
  });

  it("ignores storage events for unrelated keys", () => {
    render(<AiNativeModulesOverview />);
    vi.mocked(getCompletedLessonIds).mockReturnValue(
      new Set(["modul_2_lesson_1", "modul_2_lesson_2", "modul_2_lesson_3"]),
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "some-other-key" }),
      );
    });
    // No re-read -> modul_2 still shows no completion.
    expect(screen.queryByText("3/3 · 100%")).toBeNull();
  });
});
