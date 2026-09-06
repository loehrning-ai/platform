import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

import { AiNativeOperatorLessonPage } from "@/components/ai-native-operator/lesson-page";
import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { TechnicalCourseHeader } from "@/components/course/technical-course-landing";
import { TechnicalCourseProgressBar } from "@/components/course/technical-course-progress";
import { VerificationPage } from "@/components/course/kurs/verification-page";
import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { MODULE_IDS, TOTAL_LESSON_COUNT } from "@/lib/ai-native-operator/types";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import LandingPage, {
  generateMetadata as generateLandingMetadata,
} from "./page";
import ModulePage, {
  dynamicParams as moduleDynamicParams,
  generateMetadata as generateModuleMetadata,
  generateStaticParams as generateModuleStaticParams,
} from "./[moduleId]/page";
import LessonPage, {
  dynamicParams as lessonDynamicParams,
  generateMetadata as generateLessonMetadata,
  generateStaticParams as generateLessonStaticParams,
} from "./[moduleId]/[lessonNum]/page";
import QuizPage from "./quiz/page";
import CertificateRoute from "./zertifikat/page";
import VerificationRoute from "./verifizierung/page";
import { generateMetadata as generateQuizMetadata } from "./quiz/layout";
import { generateMetadata as generateCertificateMetadata } from "./zertifikat/layout";
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

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  return textContent((node.props as { children?: ReactNode }).children);
}

function hrefs(node: ReactNode): readonly string[] {
  if (Array.isArray(node)) return node.flatMap(hrefs);
  if (!isValidElement(node)) return [];
  const props = node.props as { href?: unknown; children?: ReactNode };
  return [
    ...(typeof props.href === "string" ? [props.href] : []),
    ...hrefs(props.children),
  ];
}

describe("AI-Native Operator locale propagation across the course lifecycle", () => {
  beforeEach(() => {
    vi.mocked(getRequestLocale).mockResolvedValue("de");
  });

  it("derives the complete static route inventory from stable machine identities", () => {
    expect(moduleDynamicParams).toBe(false);
    expect(lessonDynamicParams).toBe(false);
    expect(generateModuleStaticParams()).toEqual(
      MODULE_IDS.map((moduleId) => ({ moduleId })),
    );
    expect(generateLessonStaticParams()).toHaveLength(TOTAL_LESSON_COUNT);
    expect(generateLessonStaticParams()[0]).toEqual({
      moduleId: "mindset",
      lessonNum: "1",
    });
    expect(generateLessonStaticParams().at(-1)).toEqual({
      moduleId: "measurement",
      lessonNum: "4",
    });
  });

  it.each([
    {
      locale: "de" as const,
      prefix: "",
      landingMarker: "Neun Module · linear oder selbstgesteuert",
      moduleMarker: "Aufgaben anhand von Fehlerkosten",
      lessonTitle: "Erst die Aufgabe wählen, dann das Werkzeug",
    },
    {
      locale: "en" as const,
      prefix: "/en",
      landingMarker: "Nine modules · linear or self-directed",
      moduleMarker: "Select tasks by error cost",
      lessonTitle: "Choose tasks before choosing tools",
    },
  ])(
    "renders reviewed $locale content and preserves locale-safe navigation",
    async ({ locale, prefix, landingMarker, moduleMarker, lessonTitle }) => {
      vi.mocked(getRequestLocale).mockResolvedValue(locale);
      const landing = await LandingPage();
      expect(textContent(landing)).toContain(landingMarker);
      const header = findElement(landing, TechnicalCourseHeader);
      const headerProps = header?.props as
        { progress?: ReactNode; primaryAction?: ReactNode } | undefined;
      const progress = headerProps?.progress;
      expect(isValidElement(progress)).toBe(true);
      expect(isValidElement(progress) && progress.type).toBe(
        TechnicalCourseProgressBar,
      );
      expect(isValidElement(progress) && progress.props).toMatchObject({
        courseSlug: "ai-native-operator",
        totalLessons: TOTAL_LESSON_COUNT,
      });
      const primaryAction = headerProps?.primaryAction;
      expect(
        isValidElement(primaryAction) && primaryAction.props,
      ).toMatchObject({
        href: `${prefix}/kurse/open-source/ai-native-operator/mindset/1`,
      });
      expect(findElement(landing, CourseAssessmentCta)?.props).toMatchObject({
        courseSlug: "ai-native-operator",
        locale,
      });
      expect(hrefs(landing)).toContain(
        `${prefix}/kurse/open-source/ai-native-operator/measurement`,
      );

      const module = await ModulePage({
        params: Promise.resolve({ moduleId: "mindset" }),
      });
      expect(textContent(module)).toContain(moduleMarker);
      expect(hrefs(module)).toContain(
        `${prefix}/kurse/open-source/ai-native-operator/mindset/1`,
      );

      const lesson = await LessonPage({
        params: Promise.resolve({ moduleId: "mindset", lessonNum: "1" }),
      });
      expect(
        findElement(lesson, AiNativeOperatorLessonPage)?.props,
      ).toMatchObject({
        locale,
        lesson: {
          id: "mindset/1",
          moduleId: "mindset",
          lessonNumber: 1,
          title: lessonTitle,
        },
        next: {
          href: `${prefix}/kurse/open-source/ai-native-operator/mindset/2`,
          kind: "lesson",
        },
      });

      expect((await QuizPage()).props).toMatchObject({
        courseSlug: "ai-native-operator",
        locale,
      });
      expect((await CertificateRoute()).props).toMatchObject({
        courseSlug: "ai-native-operator",
        locale,
      });
      expect((await VerificationRoute()).props).toMatchObject({
        courseSlug: "ai-native-operator",
        locale,
      });
    },
  );

  it.each([
    {
      locale: "de" as const,
      prefix: "",
      landingTitle: "AI-Native Operator: kontrollierte modellgestützte Arbeit",
      moduleTitle: "Mindset und Arbeitskultur: AI-Native Operator Praxiskurs",
      lessonTitle:
        "Erst die Aufgabe wählen, dann das Werkzeug: AI-Native Operator Praxiskurs",
    },
    {
      locale: "en" as const,
      prefix: "/en",
      landingTitle: "AI-Native Operator: controlled model-assisted work",
      moduleTitle: "Mindset & Culture: AI-Native Operator",
      lessonTitle: "Choose tasks before choosing tools: AI-Native Operator",
    },
  ])(
    "emits precise $locale metadata with locale-safe canonical URLs",
    async ({ locale, prefix, landingTitle, moduleTitle, lessonTitle }) => {
      vi.mocked(getRequestLocale).mockResolvedValue(locale);
      const landingPath = `${prefix}/kurse/open-source/ai-native-operator`;
      expect(await generateLandingMetadata()).toMatchObject({
        title: landingTitle,
        alternates: { canonical: landingPath },
        openGraph: { url: `https://loehrning.ai${landingPath}` },
      });
      expect(
        await generateModuleMetadata({
          params: Promise.resolve({ moduleId: "mindset" }),
        }),
      ).toMatchObject({
        title: moduleTitle,
        robots: { index: false, follow: true },
        alternates: { canonical: `${landingPath}/mindset` },
        openGraph: { url: `https://loehrning.ai${landingPath}/mindset` },
      });
      expect(
        await generateLessonMetadata({
          params: Promise.resolve({ moduleId: "mindset", lessonNum: "1" }),
        }),
      ).toMatchObject({
        title: lessonTitle,
        robots: { index: false, follow: true },
        alternates: { canonical: `${landingPath}/mindset/1` },
        openGraph: { url: `https://loehrning.ai${landingPath}/mindset/1` },
      });
    },
  );

  it.each([
    [
      "de",
      "Abschlussquiz: AI-Native Operator",
      "Teilnahmebestätigung: AI-Native Operator",
      "Teilnahmedaten lesen: AI-Native Operator",
    ],
    [
      "en",
      "Workshop quiz: AI-Native Operator",
      // Copy lock updated: the English completion document is named a "certificate of participation"; the German row already reads "Teilnahmebestätigung".
      "Certificate of participation: AI-Native Operator",
      "Read course-record data: AI-Native Operator",
    ],
  ] as const)(
    "localizes private utility metadata in %s",
    async (locale, quizTitle, certificateTitle, verificationTitle) => {
      vi.mocked(getRequestLocale).mockResolvedValue(locale);
      expect(await generateQuizMetadata()).toMatchObject({
        title: quizTitle,
        robots: { index: false, follow: false },
        alternates: { canonical: null },
      });
      expect(await generateCertificateMetadata()).toMatchObject({
        title: certificateTitle,
        robots: { index: false, follow: false },
        alternates: { canonical: null },
      });
      expect(await generateVerificationMetadata()).toMatchObject({
        title: verificationTitle,
        robots: { index: false, follow: false },
        alternates: { canonical: null },
      });
    },
  );
});
