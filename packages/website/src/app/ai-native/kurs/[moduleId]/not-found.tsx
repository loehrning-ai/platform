import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";

export default async function ModulNotFound() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  return (
    <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
      <div className="max-w-md rounded-[28px] border border-lab-line/80 bg-card p-6 text-center shadow-lab sm:p-8">
        <p className="text-sm font-semibold text-lab-accent">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          {isEnglish ? "Module not found" : "Modul nicht gefunden"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEnglish
            ? "The link is outdated or the module has moved."
            : "Der Link ist veraltet oder das Modul wurde verschoben."}
        </p>
        <Link
          href={localizeHref("/ai-native/kurs", locale)}
          className="mt-6 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-lab-accent px-5 text-sm font-semibold text-paper transition-colors hover:bg-[#1f3a99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEnglish ? "Back to course overview" : "Zur Kursübersicht"}
        </Link>
      </div>
    </div>
  );
}
