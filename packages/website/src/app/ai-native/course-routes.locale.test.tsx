import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getModules } from "@/lib/ai-native/data";
import { TechnicalCourseFrame } from "@/components/course/technical-course-landing";
import { AiNativeLessonReader } from "@/components/ai-native/kurs/lesson-reader";
import { LessonReference } from "@/components/course/lesson-reference";
import { VoiceAnchor } from "@/components/ai-native/primitives";
import LandingPage, {
  generateMetadata as generateLandingMetadata,
} from "./page";
import CourseHubPage from "./kurs/page";
import ModulePage, {
  generateMetadata as generateModuleMetadata,
} from "./kurs/[moduleId]/page";
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
    const moduleDisclosureNames = findElements(landing, "summary")
      .map(
        (summary) =>
          (summary.props as { readonly "aria-label"?: unknown })["aria-label"],
      )
      .filter((label): label is string => typeof label === "string");
    expect(moduleDisclosureNames).toEqual(
      getModules("en").map(
        (module) => `Decisions and exercises: ${module.title}`,
      ),
    );
    expect(new Set(moduleDisclosureNames).size).toBe(
      moduleDisclosureNames.length,
    );

    const hub = await CourseHubPage();
    expect(textContent(hub)).toContain("AI-Native Workflow Course");
    expect(textContent(hub)).toContain("From task to workflow");

    const modulePage = await ModulePage({
      params: Promise.resolve({ moduleId: "modul_1" }),
    });
    expect(textContent(modulePage)).toContain("From task to workflow");
    expect(textContent(modulePage)).toContain(
      "When you stop drafting from scratch",
    );
    expect(findElement(modulePage, VoiceAnchor)?.props).toMatchObject({
      author: "Voice anchor · Module 1",
    });

    const lesson = await LessonPage({
      params: Promise.resolve({
        moduleId: "modul_1",
        lessonId: "modul_1_lesson_1",
      }),
    });
    expect(findElement(lesson, AiNativeLessonReader)?.props).toMatchObject({
      locale: "en",
      lesson: {
        id: "modul_1_lesson_1",
        title: "When you stop drafting from scratch",
      },
    });
    const lessonReference = findElement(lesson, LessonReference);
    expect(lessonReference?.props).toMatchObject({
      locale: "en",
      title: "When you stop drafting from scratch",
    });
    const lessonReferenceText = textContent(
      (lessonReference?.props as { children?: ReactNode }).children,
    );
    expect(lessonReferenceText).toContain(
      "Start with the tools you already use. Connect them through explicit instructions, review points and repeatable handoffs.",
    );
    expect(lessonReferenceText).toContain(
      "You already have tools. The relevant question is how to combine them.",
    );

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
      title: "AI-Native Workflow Course: structured work with Claude",
      robots: { index: true, follow: true },
      alternates: {
        canonical: "/en/ai-native",
        languages: { de: "/ai-native", en: "/en/ai-native" },
      },
      openGraph: { url: "https://loehrning.ai/en/ai-native", locale: "en_GB" },
    });

    expect(await generateCourseMetadata()).toMatchObject({
      title: "AI-Native Workflow Course: tasks, knowledge and automation",
      robots: { index: false, follow: true },
      alternates: { canonical: "/en/ai-native/kurs" },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native/kurs",
        locale: "en_GB",
      },
    });

    expect(
      await generateModuleMetadata({
        params: Promise.resolve({ moduleId: "modul_1" }),
      }),
    ).toMatchObject({
      title: "From task to workflow: AI-Native Workflow Course",
      robots: { index: false, follow: true },
      openGraph: { url: "https://loehrning.ai/en/ai-native/kurs/modul_1" },
    });

    expect(
      await generateLessonMetadata({
        params: Promise.resolve({
          moduleId: "modul_1",
          lessonId: "modul_1_lesson_1",
        }),
      }),
    ).toMatchObject({
      title: "When you stop drafting from scratch: AI-Native Workflow Course",
      robots: { index: false, follow: true },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native/kurs/modul_1/modul_1_lesson_1",
      },
    });
  });

  it("localizes quiz, completion-record, and public record-reader metadata", async () => {
    expect(await generateQuizMetadata()).toMatchObject({
      title: "Workshop quiz: AI-Native Workflow Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateCertificateMetadata()).toMatchObject({
      title: "Course completion record: AI-Native Workflow Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
    expect(await generateVerificationMetadata()).toMatchObject({
      title: "Read course-record data: AI-Native Workflow Course",
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    });
  });
});
