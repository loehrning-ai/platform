import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import {
  getAiNativeOperatorLocaleRegistry,
  getModuleLessons,
} from "@/lib/ai-native-operator/data";
import { courseHref, lessonHref } from "@/lib/ai-native-operator/routes";
import {
  MODULE_IDS,
  getModuleMeta,
  isModuleId,
  type ModuleId,
} from "@/lib/ai-native-operator/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

interface PageProps {
  readonly params: Promise<{ moduleId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULE_IDS.map((moduleId) => ({ moduleId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ moduleId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const copy = getAiNativeOperatorCourseCopy(locale);
  if (!isModuleId(moduleId)) {
    return {
      title: copy.module.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  const meta = getModuleMeta(moduleId, locale);
  return buildTechnicalCourseMetadata({
    courseSlug: "ai-native-operator",
    locale,
    target: { kind: "module", moduleId },
    title: `${meta.name}: ${
      locale === "de" ? "AI-Native Operator Praxiskurs" : "AI-Native Operator"
    }`,
    description: meta.tagline,
    availableContentLocales: contentLocalesForPath(
      `/kurse/open-source/ai-native-operator/${moduleId}`,
    ),
  });
}

function kindGlyph(kind: "reading" | "quiz"): string {
  return kind === "quiz" ? "Q" : "R";
}

export default async function AiNativeOperatorModulePage({
  params,
}: PageProps) {
  const [{ moduleId: rawModuleId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  if (!isModuleId(rawModuleId)) notFound();
  const moduleId: ModuleId = rawModuleId;
  (await getAiNativeOperatorLocaleRegistry()).get(locale);

  const copy = getAiNativeOperatorCourseCopy(locale).module;
  const meta = getModuleMeta(moduleId, locale);
  const lessons = await getModuleLessons(moduleId, locale);
  const objectives = lessons.filter((lesson) => lesson.kind !== "quiz");
  const displayModuleNumber = meta.code.replace("M0", "");

  return (
    <section className="mx-auto w-full max-w-[900px] overflow-x-clip px-4 py-12 sm:px-6 sm:py-16">
      <div className="break-words font-mono text-[11px] text-muted-foreground">
        <Link href={courseHref(locale)} className="hover:text-foreground">
          {copy.breadcrumb}
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        {meta.code}
      </div>

      <p className="mt-4 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-brand-orange">
        {copy.moduleLabel(displayModuleNumber)}
      </p>
      <h1 className="mt-2 break-words text-[30px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px] md:text-[40px]">
        {meta.name}
      </h1>
      <p className="mt-3 max-w-[660px] break-words text-[16px] leading-[1.55] text-muted-foreground">
        {meta.tagline}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[12px] text-muted-foreground">
        <span className="font-bold text-foreground">
          {copy.lessonUnit(lessons.length)}
        </span>
        <span aria-hidden="true">·</span>
        <span>{meta.duration}</span>
        <span aria-hidden="true">·</span>
        <span>{meta.difficulty}</span>
      </div>

      {objectives.length > 0 && (
        <div className="mt-10 min-w-0 border-l-2 border-brand-orange bg-card/40 p-5 sm:p-6">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.objectives}
          </p>
          <ul className="mt-3 flex min-w-0 flex-col gap-2.5">
            {objectives.map((lesson, index) => (
              <li
                key={lesson.id}
                className="flex min-w-0 gap-3 text-[14px] leading-[1.55] text-foreground"
              >
                <span className="shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-words">{lesson.objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          {copy.lessons}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {lessons.length} · {meta.duration}
        </p>
      </div>
      <div className="mt-4 flex min-w-0 flex-col divide-y divide-border border-t border-border">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={lessonHref(moduleId, lesson.lessonNumber, locale)}
            className="group grid min-w-0 grid-cols-[34px_28px_minmax(0,1fr)] items-center gap-2 py-4 transition-colors hover:bg-card sm:grid-cols-[56px_28px_minmax(0,1fr)_auto] sm:gap-4"
          >
            <div className="font-mono text-[11px] text-muted-foreground sm:text-[12px]">
              {displayModuleNumber}.{lesson.lessonNumber}
            </div>
            <div
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center border border-border font-mono text-[11px] font-bold text-muted-foreground"
            >
              {kindGlyph(lesson.kind)}
            </div>
            <div className="min-w-0 break-words text-[14px] font-medium text-foreground sm:text-[14.5px]">
              {lesson.title}
            </div>
            <div className="col-start-3 font-mono text-[11px] text-muted-foreground sm:col-start-auto">
              {locale === "de"
                ? `${lesson.durationMinutes} Min.`
                : `${lesson.durationMinutes} min`}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-end border-t border-border pt-6">
        {lessons[0] && (
          <Link
            href={lessonHref(moduleId, lessons[0].lessonNumber, locale)}
            className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
          >
            {copy.begin}
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
