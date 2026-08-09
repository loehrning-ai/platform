import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";

export default async function ModulNotFound() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          {isEnglish ? "Module not found" : "Modul nicht gefunden"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEnglish
            ? "The link is outdated or the module has moved. The course overview lists every current module."
            : "Der Link ist veraltet oder das Modul wurde verschoben. Die Kursübersicht enthält alle aktuellen Module."}
        </p>
        <Link
          href={localizeHref("/ai-native/kurs", locale)}
          className="mt-6 inline-flex items-center gap-2 text-sm text-brand-orange transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEnglish ? "Back to course overview" : "Zur Kursübersicht"}
        </Link>
      </div>
    </div>
  );
}
