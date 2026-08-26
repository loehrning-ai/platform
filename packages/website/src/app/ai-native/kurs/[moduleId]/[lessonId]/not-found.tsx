import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";

export default async function LektionNotFound() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          {isEnglish ? "Lesson not found" : "Lektion nicht gefunden"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEnglish
            ? "The link is outdated or the lesson has moved. The course overview lists every current lesson."
            : "Der Link ist veraltet oder die Lektion wurde verschoben. Die Kursübersicht enthält alle aktuellen Lektionen."}
        </p>
        <Link
          href={localizeHref("/ai-native/kurs", locale)}
          className="mt-6 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm text-brand-orange transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEnglish ? "Back to course overview" : "Zur Kursübersicht"}
        </Link>
      </div>
    </div>
  );
}
