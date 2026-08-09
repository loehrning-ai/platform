/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { getModules } from "@/lib/ai-native/data";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";

/**
 * skill-graph.test.tsx (regression coverage)
 *
 * The "Lernstruktur" columns are hand-written prose that restates numbers held
 * in content/ai-native/modules.json. Nothing tied the two together, and the
 * German column set drifted: it described a curriculum summing to 26 lessons
 * and 9h directly beneath a stat row reading 27, while the English set stayed
 * correct. The lesson-time stat claimed 12h against a real 303 minutes.
 *
 * These tests drive the REAL exported <AiNativeSkillGraph /> per locale and
 * assert every printed count against the real module data, so prose and data
 * cannot separate again.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const cache = new Map<string, React.ElementType>();
  const make = (tag: any): React.ElementType => {
    const cacheable = typeof tag === "string";
    if (cacheable && cache.has(tag)) return cache.get(tag)!;
    const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        whileDrag,
        drag,
        layout,
        layoutId,
        custom,
        viewport,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        children,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    if (cacheable) cache.set(tag, Comp);
    return Comp;
  };
  const m: any = new Proxy(
    { create: (tag: any) => make(tag) },
    {
      get(target, prop) {
        if (prop === "create") return (target as any).create;
        if (typeof prop === "symbol") return undefined;
        return make(prop as string);
      },
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
    useInView: () => true,
    useMotionValue: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useSpring: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useTransform: () => ({ set: () => {}, get: () => 0, on: () => () => {} }),
  };
});

import { AiNativeSkillGraph } from "./skill-graph";

/** "5 Lektionen · 50 Min." and "5 lessons · 50 min" both yield [5, 50]. */
function printedPairs(container: HTMLElement): Array<[number, number]> {
  const text = container.textContent ?? "";
  return [
    ...text.matchAll(/(\d+)\s+(?:Lektionen|lessons)\s*·\s*(\d+)\s*(?:Min\.|min)/g),
  ].map((match) => [Number(match[1]), Number(match[2])] as [number, number]);
}

afterEach(cleanup);

describe("AI-native learning structure", () => {
  it.each(SUPPORTED_LOCALES)(
    "prints each module's real lesson count and duration (%s)",
    (locale: Locale) => {
      const modules = getModules(locale);
      const { container } = render(<AiNativeSkillGraph locale={locale} />);

      expect(printedPairs(container)).toEqual(
        modules.map((module) => [module.lessonCount, module.durationMinutes]),
      );
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "keeps the stat row consistent with the columns (%s)",
    (locale: Locale) => {
      const modules = getModules(locale);
      const { container } = render(<AiNativeSkillGraph locale={locale} />);
      const pairs = printedPairs(container);

      const lessons = pairs.reduce((sum, [count]) => sum + count, 0);
      const minutes = pairs.reduce((sum, [, duration]) => sum + duration, 0);

      expect(lessons).toBe(
        modules.reduce((sum, module) => sum + module.lessonCount, 0),
      );
      // The stat row rounds lesson time to whole hours; it must round the real
      // total rather than carry a number of its own.
      expect(Math.round(minutes / 60)).toBe(
        Math.round(
          modules.reduce((sum, module) => sum + module.durationMinutes, 0) / 60,
        ),
      );
    },
  );

  it("describes the same four modules in both locales", () => {
    const de = getModules("de");
    const en = getModules("en");
    expect(de).toHaveLength(en.length);
    expect(de.map((module) => module.lessonCount)).toEqual(
      en.map((module) => module.lessonCount),
    );
    expect(de.map((module) => module.durationMinutes)).toEqual(
      en.map((module) => module.durationMinutes),
    );
  });
});
