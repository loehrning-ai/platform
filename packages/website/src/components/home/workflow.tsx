import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_COPY } from "@/components/home/home-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export function Workflow({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].workflow;

  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 border-b border-border bg-background py-12"
      data-testid="ressourcen-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
          <header>
            <p className="overline border-l-[3px] border-brand-orange pl-3">
              {copy.overline}
            </p>
            <h2 className="mt-4 text-fluid-h2 font-bold tracking-[-0.035em] text-foreground">
              {copy.headline}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              {copy.introduction}
            </p>
          </header>

          <ul className="border-t border-border">
            {copy.resources.map((resource, index) => (
              <li key={resource.label} className="border-b border-border">
                <Link
                  href={localizeHref(resource.href, locale)}
                  className="group grid min-h-20 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:gap-5"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs font-bold tabular-nums text-brand-orange"
                  >
                    R{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-foreground transition-colors group-hover:text-brand-orange">
                      {resource.label}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                      {resource.body}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    size={18}
                    className="text-brand-orange transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-l-[3px] border-brand-orange bg-kupfer-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-foreground">
            {copy.accountBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange"
          >
            {copy.accountCta}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
