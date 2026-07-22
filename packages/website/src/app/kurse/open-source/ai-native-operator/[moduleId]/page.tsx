import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getModuleLessons } from "@/lib/ai-native-operator/data";
import { MODULE_IDS, MODULE_META, isModuleId, type ModuleId } from "@/lib/ai-native-operator/types";
import { courseHref, lessonHref, moduleHref } from "@/lib/ai-native-operator/routes";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  readonly params: Promise<{ moduleId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULE_IDS.map((moduleId) => ({ moduleId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId } = await params;
  if (!isModuleId(moduleId)) return { title: "Module not found" };
  const meta = MODULE_META[moduleId];
  const url = `${SITE_URL}${moduleHref(moduleId)}`;
  return {
    title: `${meta.name}: The AI-Native Operator`,
    description: meta.tagline,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.name}: The AI-Native Operator`,
      description: meta.tagline,
      url,
      type: "article",
    },
  };
}

function kindGlyph(kind: "reading" | "quiz"): string {
  return kind === "quiz" ? "Q" : "R";
}

export default async function AiNativeOperatorModulePage({ params }: PageProps) {
  const { moduleId: rawModuleId } = await params;
  if (!isModuleId(rawModuleId)) notFound();
  const moduleId: ModuleId = rawModuleId;

  const meta = MODULE_META[moduleId];
  const lessons = await getModuleLessons(moduleId);
  const objectives = lessons.filter((l) => l.kind !== "quiz").map((l) => l.objective);

  return (
    <section className="mx-auto max-w-[900px] px-6 py-16">
      <div className="font-mono text-[11px] text-muted-foreground">
        <Link href={courseHref()} className="hover:text-foreground">
          Course
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        {meta.code}
      </div>

      <p className="mt-4 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        Module {meta.code.replace("M0", "")}
      </p>
      <h1 className="mt-2 text-[32px] font-bold tracking-[-0.03em] text-foreground md:text-[40px]">
        {meta.name}
      </h1>
      <p className="mt-3 max-w-[600px] text-[16px] leading-[1.5] text-muted-foreground">
        {meta.tagline}
      </p>
      <div className="mt-4 flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
        <span>
          <span className="font-bold text-foreground">{lessons.length}</span> lessons
        </span>
        <span aria-hidden="true">·</span>
        <span>{meta.duration}</span>
        <span aria-hidden="true">·</span>
        <span>{meta.difficulty}</span>
      </div>

      {objectives.length > 0 && (
        <div className="mt-10 border-l-2 border-brand-orange bg-card/40 p-6">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            Learning objectives
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {objectives.map((objective, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-[1.5] text-foreground">
                <span className="shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Lessons
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {lessons.length} · {meta.duration}
        </p>
      </div>
      <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={lessonHref(moduleId, lesson.lessonNumber)}
            className="group flex items-center gap-4 py-4 transition-colors hover:bg-card"
          >
            <div className="w-14 shrink-0 font-mono text-[12px] text-muted-foreground">
              {meta.code.replace("M0", "")}.{lesson.lessonNumber}
            </div>
            <div
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center border border-border font-mono text-[11px] font-bold text-muted-foreground"
            >
              {kindGlyph(lesson.kind)}
            </div>
            <div className="min-w-0 flex-1 text-[14.5px] font-medium text-foreground">
              {lesson.title}
            </div>
            <div className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {lesson.durationMinutes} min
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <div />
        {lessons[0] && (
          <Link
            href={lessonHref(moduleId, lessons[0].lessonNumber)}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
          >
            Begin
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
