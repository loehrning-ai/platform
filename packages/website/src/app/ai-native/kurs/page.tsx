import type { Metadata } from "next";
import { getModuleLessons, getModules } from "@/lib/ai-native/data";
import type { ModuleOverviewModule } from "@/components/lesson-engine/module-overview";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { SITE_URL } from "@/lib/seo/json-ld";
import { KursContent } from "./kurs-content";

// Server half of the course hub: slim module summaries (ids, titles,
// durations) for the shared ModuleOverview, so lesson bodies stay out of the
// client bundle. Lessons link to /ai-native/kurs/<moduleId>/<lessonId>.

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const title =
    locale === "en"
      ? "Course hub: Working with AI"
      : "Kursübersicht: Mit KI arbeiten";
  const description =
    locale === "en"
      ? "Four modules, nine lessons, each with an exercise. A free learning account stores progress. Includes a final quiz and a locally generated completion record."
      : "Vier Module, neun Lektionen mit je einer Übung. Ein kostenloses Lernkonto speichert den Fortschritt. Mit Abschlussquiz und lokal erzeugter Teilnahmebestätigung.";
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
  const modules: ModuleOverviewModule[] = await Promise.all(
    getModules(locale).map(async (module, index) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      durationMinutes: module.durationMinutes,
      orderIndex: index,
      lessons: (await getModuleLessons(module.id, locale)).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
      })),
    })),
  );
  return <KursContent modules={modules} locale={locale} />;
}
