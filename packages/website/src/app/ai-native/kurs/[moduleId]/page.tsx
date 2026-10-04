import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getModule } from "@/lib/ai-native/data";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

// Module URLs stay valid for bookmarks, but the course hub (ModuleOverview
// with progress rings per module) is the single overview. A module URL
// resolves to the hub; unknown modules stay 404.

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export async function generateStaticParams() {
  return MODULE_IDS.map((moduleId) => ({ moduleId }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: true } };
}

export default async function AiNativeModulePage({ params }: PageProps) {
  const { moduleId } = await params;
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  if (!getModule(moduleId as ModuleId, locale)) notFound();
  redirect(localizeHref("/ai-native/kurs", locale));
}
