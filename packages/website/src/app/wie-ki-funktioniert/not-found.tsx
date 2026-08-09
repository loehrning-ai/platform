import Link from "next/link";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { WIE_KI_ERROR_COPY } from "@/lib/wie-ki-funktioniert-copy";

export default async function WieKiFunktioniertNotFound() {
  const locale = await getRequestLocale();
  const copy = WIE_KI_ERROR_COPY[locale];

  return (
    <main className="flex min-h-[70svh] min-w-0 items-center justify-center bg-background px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg min-w-0 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] sm:p-8">
        <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground [overflow-wrap:anywhere]">
          {copy.notFoundHeading}
        </h1>
        <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {copy.notFoundBody}
        </p>
        <Link
          href={localizeHref("/wie-ki-funktioniert", locale)}
          className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center break-words bg-brand-orange px-5 py-3 text-left font-mono text-xs font-bold text-white hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          {copy.back}
        </Link>
      </div>
    </main>
  );
}
