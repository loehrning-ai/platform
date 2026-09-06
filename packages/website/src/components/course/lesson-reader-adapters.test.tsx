import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { courseLessonHref } from "@/lib/courses/resume";
import { localizeHref } from "@/lib/i18n/locale";
import { DS_CHAPTERS, type DsChapterId } from "@/lib/data-science/types";
import { DEF_CHAPTERS } from "@/lib/data-engineering-fundamentals/types";
import type { ModuleId as OperatorModuleId } from "@/lib/ai-native-operator/types";
import type { ModuleId } from "@/lib/ai-native/types";

type ReaderOptions = Parameters<typeof import("./use-lesson-reader-bar").useLessonReaderBar>[0];
const observed = vi.hoisted(() => ({ options: null as ReaderOptions | null, chapterId: "home" }));
vi.mock("./use-lesson-reader-bar", () => ({
  useLessonReaderBar: (options: ReaderOptions) => {
    observed.options = options;
    return { bar: { position: `${options.ordinal} / ${options.total}`, next: options.next }, contentRef: { current: null } };
  },
}));
vi.mock("./lesson-shell", () => ({
  LessonShell: ({ readerBar }: { readerBar?: { position: string } }) =>
    <output>{readerBar?.position ?? "navigation only"}</output>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ chapterId: observed.chapterId }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

import { ClaudeLessonPage } from "@/components/imported-courses/claude/claude-lesson-page";
import { CodexLessonPage } from "@/components/codex/codex-lesson-page";
import { DataInfraLessonPage } from "@/components/data-infrastructure/data-infra-lesson-page";
import { AiNativeOperatorLessonPage } from "@/components/ai-native-operator/lesson-page";
import { AiNativeLessonPageShell } from "@/components/ai-native/kurs/lesson-page-shell";
import { DsReaderShell } from "@/components/data-science/reader-shell";
import { DefChapterLayoutClient } from "@/components/data-engineering-fundamentals/def-chapter-layout-client";
import { LessonLayout } from "./kurs/lesson-layout";

afterEach(cleanup);

describe.each(["de", "en"] as const)("reader adapters: %s", (locale) => {
  const prefix = locale === "en" ? "/en" : "";
  const positions = ["first", "middle", "final"] as const;
  const indexFor = (position: typeof positions[number], length: number) =>
    position === "first" ? 0 : position === "middle" ? Math.floor(length / 2) : length - 1;

  for (const slug of ["claude", "codex", "data-infrastructure"] as const) {
    it.each(positions)(`${slug} supplies honest position and real %s destination`, (position) => {
      const ids = CANONICAL_LESSON_IDS[slug];
      const index = indexFor(position, ids.length);
      const nextHref = ids[index + 1] ? localizeHref(courseLessonHref(slug, ids[index + 1]), locale) : null;
      const lesson = { id: ids[index], number: index + 1, title: "Fixture", subtitle: "", durationMinutes: 1, hook: "", trackId: slug === "codex" ? "fundamentals" : "foundations", sections: [], quiz: [], keyConcepts: [] };
      const shared = { locale, totalLessons: ids.length, prevHref: null, nextHref, navItems: [], tracks: [] };
      if (slug === "claude") render(<ClaudeLessonPage {...shared} lesson={lesson as ComponentProps<typeof ClaudeLessonPage>["lesson"]} />);
      else if (slug === "codex") render(<CodexLessonPage {...shared} lesson={lesson as ComponentProps<typeof CodexLessonPage>["lesson"]} />);
      else render(<DataInfraLessonPage {...shared} lesson={lesson as ComponentProps<typeof DataInfraLessonPage>["lesson"]} />);
      expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
      expect(observed.options).toMatchObject({ courseSlug: slug, lessonId: ids[index], locale });
      expect(observed.options?.next).toMatchObject({ kind: "link", href: nextHref ?? `${prefix}/kurse/open-source/${slug}/kurs${slug === "claude" ? "/quiz" : ""}` });
    });
  }

  it.each(positions)("Data Science excludes the overview from its %s lesson count", (position) => {
    const ids = CANONICAL_LESSON_IDS["data-science"];
    const index = indexFor(position, ids.length);
    render(<DsReaderShell activeId={ids[index] as DsChapterId} locale={locale} chapters={DS_CHAPTERS}>Fixture</DsReaderShell>);
    expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
    expect(observed.options?.next).toMatchObject({ href: ids[index + 1]
      ? `${prefix}/kurse/open-source/data-science/${ids[index + 1]}` : `${prefix}/kurse/open-source/data-science` });
  });

  it("Data Science overview keeps the honest navigation-only fallback", () => {
    render(<DsReaderShell activeId="home" locale={locale} chapters={DS_CHAPTERS}>Fixture</DsReaderShell>);
    expect(screen.getByRole("status")).toHaveTextContent("navigation only");
  });

  it.each(positions)("DEF includes canonical home and a real %s destination", (position) => {
    const ids = CANONICAL_LESSON_IDS["data-engineering-fundamentals"];
    const index = indexFor(position, ids.length);
    observed.chapterId = ids[index];
    render(<DefChapterLayoutClient locale={locale} chapters={DEF_CHAPTERS}>Fixture</DefChapterLayoutClient>);
    expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
    expect(observed.options?.next).toMatchObject({ href: ids[index + 1]
      ? `${prefix}/kurse/open-source/data-engineering-fundamentals/${ids[index + 1]}` : `${prefix}/kurse/open-source/data-engineering-fundamentals` });
  });

  it.each(positions)("AI-Native crosses modules and finishes at assessment (%s)", (position) => {
    const ids = CANONICAL_LESSON_IDS["ai-native"];
    const index = indexFor(position, ids.length);
    const lessons = ids.map((id) => ({
      lessonId: id, moduleId: /^(modul_\d+)_/.exec(id)![1] as ModuleId,
      moduleNumber: Number(id.split("_")[1]), moduleTitle: "Fixture",
      lessonNumber: Number(id.split("_")[3]), title: "Fixture",
    }));
    render(<AiNativeLessonPageShell locale={locale} lessonId={ids[index]} lessons={lessons}>Fixture</AiNativeLessonPageShell>);
    expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
    expect(observed.options?.next).toMatchObject({ href: ids[index + 1]
      ? localizeHref(courseLessonHref("ai-native", ids[index + 1]), locale) : `${prefix}/ai-native/kurs/quiz` });
  });

  it("AI-Native's final lesson of a module points into the next module", () => {
    const ids = CANONICAL_LESSON_IDS["ai-native"];
    const index = ids.findIndex((id, current) => ids[current + 1] && id.split("_")[1] !== ids[current + 1].split("_")[1]);
    expect(index).toBeGreaterThanOrEqual(0);
    const lessons = ids.map((id) => ({
      lessonId: id, moduleId: /^(modul_\d+)_/.exec(id)![1] as ModuleId,
      moduleNumber: Number(id.split("_")[1]), moduleTitle: "Fixture",
      lessonNumber: Number(id.split("_")[3]), title: "Fixture",
    }));
    render(<AiNativeLessonPageShell locale={locale} lessonId={ids[index]} lessons={lessons}>Fixture</AiNativeLessonPageShell>);
    expect(observed.options?.next).toMatchObject({ href: localizeHref(courseLessonHref("ai-native", ids[index + 1]), locale) });
  });

  it.each(positions)("Operator preserves its existing %s lesson/module/assessment target", (position) => {
    const ids = CANONICAL_LESSON_IDS["ai-native-operator"];
    const index = indexFor(position, ids.length);
    const [moduleId, number] = ids[index].split("/");
    const lesson = { id: ids[index], moduleId, lessonNumber: Number(number), number: index + 1, kind: "reading", objective: "", title: "Fixture", subtitle: "", durationMinutes: 1, sections: [], quiz: [], keyConcepts: [] };
    const next = { href: `${prefix}/existing-next`, label: "Fixture next", kind: position === "final" ? "final-assessment" as const : "lesson" as const };
    render(<AiNativeOperatorLessonPage locale={locale}
      lesson={lesson as ComponentProps<typeof AiNativeOperatorLessonPage>["lesson"]}
      navItems={ids.map((id) => ({ moduleId: id.split("/")[0] as OperatorModuleId, lessonNumber: Number(id.split("/")[1]), title: "Fixture" }))}
      prevHref={null} prevTitle={null} next={next} />);
    expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
    expect(observed.options?.next).toMatchObject({ href: next.href });
  });

  for (const slug of ["ki-fuehrerschein", "eu-ai-act-kurs", "ki-und-gesellschaft"] as const) {
    it.each(positions)(`${slug} block adapter carries course-wide %s position and terminal metadata`, (position) => {
      const ids = CANONICAL_LESSON_IDS[slug];
      const index = indexFor(position, ids.length);
      const lesson = { id: ids[index], blockId: "block_1", number: index + 1, title: "Fixture", subtitle: "", durationMinutes: 1, sections: [], quiz: [], keyConcepts: [] };
      const followingHref = ids[index + 1] ? localizeHref(courseLessonHref(slug, ids[index + 1]), locale) : `${prefix}/${slug}/kurs/quiz`;
      render(<LessonLayout courseSlug={slug} locale={locale} blockTitle="Fixture"
        lessons={[lesson as ComponentProps<typeof LessonLayout>["lessons"][number]]}
        lessonOffset={index} courseLessonCount={ids.length} followingHref={followingHref} />);
      expect(screen.getByRole("status")).toHaveTextContent(`${index + 1} / ${ids.length}`);
      expect(observed.options?.next).toMatchObject({ kind: "link", href: followingHref });
    });
  }
});
