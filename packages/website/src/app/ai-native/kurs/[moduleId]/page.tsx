import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import {
  ClipHeading,
  VoiceAnchor,
  TierChip,
} from "@/components/ai-native/primitives";
import { getModule, getModuleLessons } from "@/lib/ai-native/data";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import { SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export async function generateStaticParams() {
  return MODULE_IDS.map((moduleId) => ({ moduleId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const mod = getModule(moduleId as ModuleId, locale);
  if (!mod)
    return {
      title: locale === "en" ? "Module not found" : "Modul nicht gefunden",
      robots: { index: false, follow: false },
    };
  const moduleUrl = `${SITE_URL}${localizeHref(`/ai-native/kurs/${moduleId}`, locale)}`;
  const courseTitle =
    locale === "en" ? "AI-Native Workflow Course" : "AI-Native Arbeitskurs";
  return {
    title: `${mod.title}: ${courseTitle}`,
    description: mod.description,
    robots: { index: false, follow: true },
    alternates: { canonical: moduleUrl },
    openGraph: {
      title: `${mod.title}: ${courseTitle}`,
      description: mod.description,
      url: moduleUrl,
      type: "article",
    },
  };
}

export default async function AiNativeModulePage({ params }: PageProps) {
  const { moduleId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const mod = getModule(moduleId as ModuleId, locale);
  if (!mod) notFound();

  const lessons = await getModuleLessons(moduleId as ModuleId, locale);
  const allModules = MODULE_IDS;
  const idx = allModules.indexOf(moduleId as ModuleId);
  const prev = idx > 0 ? getModule(allModules[idx - 1], locale) : null;
  const next =
    idx < allModules.length - 1 ? getModule(allModules[idx + 1], locale) : null;
  const isEnglish = locale === "en";

  return (
    <>
      {/* Module hero */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label={isEnglish ? "Breadcrumb" : "Brotkrümelnavigation"}
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
          >
            <Link
              href={localizeHref("/ai-native", locale)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isEnglish ? "Course" : "Kurs"}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">
              {isEnglish ? "Module" : "Modul"} {mod.number}
            </span>
          </nav>

          <div className="mt-8 flex flex-wrap items-baseline gap-6">
            <span
              className="font-mono font-bold leading-[0.85] tracking-[-0.04em] text-brand-orange"
              style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}
            >
              {mod.number}
            </span>
            <div className="min-w-0 flex-[1_1_260px]">
              <div className="mb-2.5 flex flex-wrap items-center gap-3.5">
                <TierChip tier="FREE" locale={locale} />
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {mod.subtitle} · {lessons.length}{" "}
                  {isEnglish ? "lessons" : "Lektionen"} · {mod.durationMinutes}{" "}
                  {isEnglish ? "min" : "Min."}
                </span>
              </div>
              <ClipHeading
                as="h1"
                className="font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
                style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
              >
                {mod.title}
              </ClipHeading>
            </div>
          </div>

          {mod.voiceAnchor && (
            <div className="mt-12">
              <VoiceAnchor
                author={
                  isEnglish
                    ? `Voice anchor · Module ${mod.number}`
                    : `Voice-Anchor · Modul ${mod.number}`
                }
                className="text-foreground"
              >
                {mod.voiceAnchor}
              </VoiceAnchor>
            </div>
          )}

          <p className="mt-10 max-w-[640px] text-[17px] leading-[1.65] text-muted-foreground">
            {mod.description}
          </p>
        </div>
      </section>

      {/* Lesson list */}
      <section className="py-12">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <div className="flex flex-wrap items-baseline justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange">
                {isEnglish ? "Contents" : "Inhalt"}
              </p>
              <h2
                className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
              >
                {isEnglish ? "Lessons" : "Lektionen"}
              </h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {lessons.length} {isEnglish ? "entries" : "Einträge"}
            </span>
          </div>

          <ol className="mt-8 border-t border-foreground">
            {lessons.map((lesson) => {
              return (
                <li key={lesson.id}>
                  <Link
                    href={localizeHref(
                      `/ai-native/kurs/${mod.id}/${lesson.id}`,
                      locale,
                    )}
                    className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 border-b border-border px-3 py-4 transition-colors hover:bg-card/40 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-5"
                  >
                    <span className="font-mono text-[12px] tracking-[0.05em] text-muted-foreground">
                      {lesson.number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="min-w-0 break-words text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                          {lesson.title}
                        </h3>
                        <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                          · {isEnglish ? "free" : "frei"}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-[13.5px] text-muted-foreground">
                        {lesson.subtitle}
                      </p>
                    </div>
                    <div className="col-start-2 flex min-w-0 items-center gap-3.5 sm:col-auto">
                      <span className="font-mono text-[12px] tracking-[0.05em] text-muted-foreground">
                        <Clock size={11} className="mr-1 inline" />
                        {lesson.durationMinutes} min
                      </span>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* Prev / Next module navigation */}
          <div className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
            {prev ? (
              <Link
                href={localizeHref(`/ai-native/kurs/${prev.id}`, locale)}
                className="group flex min-h-11 flex-col justify-center focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  ← {isEnglish ? "Previous" : "Vorher"}
                </p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
                  {isEnglish ? "Module" : "Modul"} {prev.number}: {prev.title}
                </p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={localizeHref(`/ai-native/kurs/${next.id}`, locale)}
                className="group flex min-h-11 flex-col justify-center text-right focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-orange">
                  {isEnglish ? "Next" : "Nächstes"} →
                </p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
                  {isEnglish ? "Module" : "Modul"} {next.number}: {next.title}
                </p>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
