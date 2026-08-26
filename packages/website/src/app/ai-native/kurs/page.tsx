import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { getModules } from "@/lib/ai-native/data";
import { AiNativeQuizCertCta } from "@/components/ai-native/kurs/quiz-cert-cta";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { SITE_URL } from "@/lib/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const title =
    locale === "en"
      ? "Course hub: AI-Native Workflow Course"
      : "Kursübersicht: AI-Native Arbeitskurs";
  const description =
    locale === "en"
      ? "Four modules and 27 lessons. A free learning account stores progress. Includes a final quiz and a locally generated completion record."
      : "Vier Module und 27 Lektionen. Ein kostenloses Lernkonto speichert den Fortschritt. Mit Abschlussquiz und lokal erzeugter Teilnahmebestätigung.";
  const url = `${SITE_URL}${localizeHref("/ai-native/kurs", locale)}`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function AiNativeCourseIndexPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const modules = getModules(locale);
  const isEnglish = locale === "en";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-12">
        <Link
          href={localizeHref("/ai-native", locale)}
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          ← loehrning.ai/ai-native
        </Link>
        <h1
          className="mt-4 font-bold tracking-[-0.03em] text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          {isEnglish ? "AI-Native Workflow Course" : "AI-Native Arbeitskurs"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {isEnglish
            ? "Four modules and 27 lessons. Work at your own pace. Start with module 1."
            : "Vier Module und 27 Lektionen. Bearbeitung im eigenen Tempo. Beginne mit Modul 1."}
        </p>
      </header>

      <ol className="space-y-4">
        {modules.map((mod) => (
          <li key={mod.id}>
            <Link
              href={localizeHref(`/ai-native/kurs/${mod.id}`, locale)}
              className="group block rounded-none border border-border/50 bg-card/30 p-6 transition-colors hover:border-brand-orange/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-brand-orange font-mono text-xl font-bold text-white">
                  {mod.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {mod.title}
                    </h2>
                    <span className="rounded-none bg-brand-sand/15 px-2 py-0.5 text-xs font-medium text-brand-sand">
                      {isEnglish ? "Free" : "Kostenlos"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mod.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {mod.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {mod.durationMinutes} {isEnglish ? "min" : "Min."}
                    </span>
                    <span>•</span>
                    <span>
                      {mod.lessonCount} {isEnglish ? "lessons" : "Lektionen"}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="mt-2 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-orange"
                />
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <AiNativeQuizCertCta locale={locale} />
    </div>
  );
}
