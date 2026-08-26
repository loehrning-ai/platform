import Link from "next/link";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

export default async function ClaudeCourseNotFound() {
  const locale = await getRequestLocale();
  return (
    <div lang={locale} className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground">
        {locale === "de" ? "Lektion nicht gefunden" : "Lesson not found"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {locale === "de"
          ? "Diese Lektionsadresse gehört nicht zum Claude-Kurs."
          : "This lesson address does not belong to the Claude course."}
      </p>
      <Link
        href={technicalCourseHref("claude", locale, { kind: "reader" })}
        className="mt-6 inline-flex min-h-11 items-center border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange/90"
      >
        {locale === "de" ? "Zum Kursplan" : "Open course map"}
      </Link>
    </div>
  );
}
