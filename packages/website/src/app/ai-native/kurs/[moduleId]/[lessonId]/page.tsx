import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import {
  ClipHeading,
  VoiceAnchor,
  TierChip,
} from "@/components/ai-native/primitives";
import { AiNativeLessonReader } from "@/components/ai-native/kurs/lesson-reader";
import { LessonProgressRing } from "@/components/ai-native/kurs/lesson-progress-ring";
import { getModule, getModuleLessons, getLesson } from "@/lib/ai-native/data";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import { SITE_URL } from "@/lib/seo/json-ld";

interface PageProps {
  params: Promise<{ moduleId: string; lessonId: string }>;
}

export async function generateStaticParams() {
  const perModule = await Promise.all(
    MODULE_IDS.map(async (moduleId) => {
      const lessons = await getModuleLessons(moduleId);
      return lessons.map((lesson) => ({ moduleId, lessonId: lesson.id }));
    }),
  );
  return perModule.flat();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId, lessonId } = await params;
  const lesson = await getLesson(moduleId as ModuleId, lessonId);
  if (!lesson) return { title: "Lektion nicht gefunden" };
  const lessonUrl = `${SITE_URL}/ai-native/kurs/${moduleId}/${lessonId}`;
  return {
    title: `${lesson.title}: AI-Native Arbeitskurs`,
    description: lesson.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: lessonUrl },
    openGraph: {
      title: `${lesson.title}: AI-Native Arbeitskurs`,
      description: lesson.subtitle,
      url: lessonUrl,
      type: "article",
    },
  };
}

export default async function AiNativeLessonPage({ params }: PageProps) {
  const { moduleId, lessonId } = await params;
  const mod = getModule(moduleId as ModuleId);
  const lesson = await getLesson(moduleId as ModuleId, lessonId);
  if (!mod || !lesson) notFound();

  const lessons = await getModuleLessons(moduleId as ModuleId);
  const currentIdx = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 md:py-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
      >
        <Link href="/ai-native" className="hover:text-brand-orange">
          Kurs
        </Link>
        <span className="mx-2 opacity-40">/</span>
        <Link href={`/ai-native/kurs/${mod.id}`} className="hover:text-brand-orange">
          Modul {mod.number}
        </Link>
        <span className="mx-2 opacity-40">/</span>
        <span className="text-brand-orange">Lektion {lesson.number}</span>
      </nav>

      {/* Header */}
      <header className="mt-10 border-b border-border pb-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-wrap items-baseline gap-5">
            <span
              className="font-mono font-bold leading-none tracking-[-0.02em] text-brand-orange"
              style={{ fontSize: "clamp(2.25rem, 4vw, 2.75rem)" }}
            >
              § {lesson.number}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <TierChip tier="FREE" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Clock size={11} className="mr-1 inline" />
                {lesson.durationMinutes} Min.
              </span>
            </div>
          </div>
          <LessonProgressRing
            lessonId={lesson.id}
            totalSections={lesson.sections.length}
          />
        </div>
        <ClipHeading
          as="h1"
          className="mt-5 font-bold leading-[0.95] tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
        >
          {lesson.title}.
        </ClipHeading>
        <p className="mt-4 max-w-[640px] text-[18px] leading-[1.55] text-muted-foreground">
          {lesson.subtitle}
        </p>
      </header>

      {/* Voice anchor (module-level, printed on the lesson) */}
      {mod.voiceAnchor && (
        <div className="mt-12">
          <VoiceAnchor author={`Modul ${mod.number} Voice-Anchor`}>
            {mod.voiceAnchor}
          </VoiceAnchor>
        </div>
      )}

      {/* Lesson-level voice anchor (if different from module's) */}
      {lesson.voiceAnchor && lesson.voiceAnchor !== mod.voiceAnchor && (
        <div className="mt-8">
          <VoiceAnchor author={`Lektion ${lesson.number}`}>
            {lesson.voiceAnchor}
          </VoiceAnchor>
        </div>
      )}

      {/* Progressive-disclosure reader (client — sections + quiz + prev/next inside) */}
      <AiNativeLessonReader
        module={mod}
        lesson={lesson}
        prevLesson={prevLesson ?? null}
        nextLesson={nextLesson ?? null}
        allModuleLessonIds={lessons.map((l) => l.id)}
      />
    </div>
  );
}
