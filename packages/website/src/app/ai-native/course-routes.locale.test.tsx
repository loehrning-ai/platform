import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { render } from "@testing-library/react";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (href: string) => {
    throw new Error(`NEXT_REDIRECT ${href}`);
  },
}));

import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getModules } from "@/lib/ai-native/data";
import { TechnicalCourseFrame } from "@/components/course/technical-course-landing";
import { LessonFlow } from "@/components/lesson-engine/lesson-flow";
import { KursContent } from "./kurs/kurs-content";
import LandingPage, {
  generateMetadata as generateLandingMetadata,
} from "./page";
import CourseHubPage from "./kurs/page";
import ModulePage from "./kurs/[moduleId]/page";
import LessonPage, {
  generateMetadata as generateLessonMetadata,
} from "./kurs/[moduleId]/[lessonId]/page";
import QuizPage from "./kurs/quiz/page";
import CertificateRoute from "./kurs/zertifikat/page";
import VerificationRoute from "./verifizierung/page";
import { generateMetadata as generateCourseMetadata } from "./kurs/layout";
import { generateMetadata as generateQuizMetadata } from "./kurs/quiz/layout";
import { generateMetadata as generateCertificateMetadata } from "./kurs/zertifikat/layout";
import { generateMetadata as generateVerificationMetadata } from "./verifizierung/layout";

function findElement(node: ReactNode, type: unknown): ReactElement | null {
  if (!isValidElement(node)) return null;
  if (node.type === type) return node;
  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const match = findElement(child, type);
    if (match) return match;
  }
  return null;
}

function findElements(node: ReactNode, type: unknown): ReactElement[] {
  if (!isValidElement(node)) {
    return Array.isArray(node)
      ? node.flatMap((child) => findElements(child, type))
      : [];
  }
  const matches = node.type === type ? [node] : [];
  const children = (node.props as { children?: ReactNode }).children;
  return [
    ...matches,
    ...findElements(Array.isArray(children) ? children : [children], type),
  ];
}

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  return textContent((node.props as { children?: ReactNode }).children);
}

describe("AI-Native locale propagation across the complete course lifecycle", () => {
  beforeEach(() => {
    vi.mocked(getRequestLocale).mockResolvedValue("en");
  });

  it("passes the audited English bundle through landing, reader, quiz, record, and verification routes", async () => {
    const landing = await LandingPage();
    expect(findElement(landing, TechnicalCourseFrame)?.props).toMatchObject({
      courseId: "ai-native",
      lang: "en",
    });
    const rendered = render(landing);
    const moduleDisclosureNames = Array.from(
      rendered.container.querySelectorAll("summary[aria-label]"),
    ).map((summary) => summary.getAttribute("aria-label") ?? "");
    rendered.unmount();
    expect(moduleDisclosureNames).toEqual(
      getModules("en").map((module) => `Lessons in this module: ${module.title}`),
    );
    expect(new Set(moduleDisclosureNames).size).toBe(
      moduleDisclosureNames.length,
    );

    const hub = await CourseHubPage();
    expect(findElement(hub, KursContent)?.props).toMatchObject({ locale: "en" });
    const hubModules = (hub.props as { modules: { id: string; title: string; lessons: { id: string }[] }[] }).modules;
    expect(hubModules.map((module) => module.id)).toEqual(["modul_1", "modul_2", "modul_3", "modul_4"]);
    expect(hubModules[0].title).toBe("Measure, don't guess");
    expect(hubModules.flatMap((module) => module.lessons.map((lesson) => lesson.id))).toHaveLength(9);

    // Module URLs resolve to the hub; unknown modules stay 404.
    await expect(
      ModulePage({ params: Promise.resolve({ moduleId: "modul_1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT /en/ai-native/kurs");
    await expect(
      ModulePage({ params: Promise.resolve({ moduleId: "modul_9" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    const lesson = await LessonPage({
      params: Promise.resolve({
        moduleId: "modul_1",
        lessonId: "messen-1-1",
      }),
    });
    expect(findElement(lesson, LessonFlow)?.props).toMatchObject({
      courseSlug: "ai-native",
      locale: "en",
      position: { index: 1, total: 9 },
      moduleLabel: "Module 1 · Measure, don't guess",
      lesson: { id: "messen-1-1", title: "Is AI actually worth it here?" },
      next: {
        kind: "link",
        href: "/en/ai-native/kurs/modul_1/messen-1-2",
      },
    });
    // Retired pre-engine lesson bookmarks land on the hub.
    await expect(
      LessonPage({
        params: Promise.resolve({ moduleId: "modul_1", lessonId: "modul_1_lesson_1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT /en/ai-native/kurs");
    const last = await LessonPage({
      params: Promise.resolve({ moduleId: "modul_4", lessonId: "workflow-4-3" }),
    });
    expect(findElement(last, LessonFlow)?.props).toMatchObject({
      next: { kind: "link", href: "/en/ai-native/kurs/quiz" },
    });

    expect((await QuizPage()).props).toMatchObject({
      courseSlug: "ai-native",
      locale: "en",
    });
    expect((await CertificateRoute()).props).toMatchObject({
      courseSlug: "ai-native",
      locale: "en",
    });
    expect((await VerificationRoute()).props).toMatchObject({
      courseSlug: "ai-native",
      locale: "en",
    });
  });

  it("emits English public metadata and noindex reader metadata with locale-safe URLs", async () => {
    expect(await generateLandingMetadata()).toMatchObject({
      title: "Working with AI: measure, safeguard, cite",
      robots: { index: true, follow: true },
      alternates: {
        canonical: "/en/ai-native",
        languages: { de: "/ai-native", en: "/en/ai-native" },
      },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native",
        locale: "en_GB",
        alternateLocale: ["de_DE"],
      },
    });
    // No page image: the route's opengraph-image.tsx (the Lemons card) is the
    // share image, and an explicit one here would replace it (SPEC §3.15).
    expect((await generateLandingMetadata()).openGraph).not.toHaveProperty("images");

    expect(await generateCourseMetadata()).toMatchObject({
      title: "Working with AI: measure, safeguard, cite",
      robots: { index: false, follow: true },
      alternates: { canonical: "/en/ai-native/kurs" },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native/kurs",
        locale: "en_GB",
      },
    });

    expect(
      await generateLessonMetadata({
        params: Promise.resolve({
          moduleId: "modul_1",
          lessonId: "messen-1-1",
        }),
      }),
    ).toMatchObject({
      title: "Is AI actually worth it here? · Working with AI",
      robots: { index: false, follow: true },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native/kurs/modul_1/messen-1-1",
      },
    });
  });

  it("localizes quiz, completion-record, and public record-reader metadata", async () => {
    expect(await generateQuizMetadata()).toMatchObject({
      title: "Final quiz: Working with AI",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateCertificateMetadata()).toMatchObject({
      // Copy lock updated: the English completion document is named a "certificate of participation" platform-wide.
      title: "Certificate of participation: Working with AI",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateVerificationMetadata()).toMatchObject({
      title: "Read course-record data: Working with AI",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
  });
});
