import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  FlaskConical,
  GitFork,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { HOME_COPY } from "@/components/home/home-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export function Workflow({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].workflow;
  const resourceIcons: readonly LucideIcon[] = [
    FileText,
    BookOpen,
    FlaskConical,
    UsersRound,
    GitFork,
  ];
  const resourceSpans = [
    "lg:col-span-7",
    "lg:col-span-5",
    "lg:col-span-5",
    "lg:col-span-7",
    "lg:col-span-12",
  ] as const;

  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 border-b border-border bg-card py-16 md:py-20"
      data-testid="ressourcen-section"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-16">
          <header className="max-w-xl">
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

          <p className="border-y border-border py-4 font-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-muted-foreground lg:text-right">
            {copy.boardLabel}
          </p>
        </div>

        <ul
          className="mt-10 grid auto-rows-fr gap-4 lg:grid-cols-12"
          aria-label={copy.boardAriaLabel}
        >
          {copy.resources.map((resource, index) => {
            const Icon = resourceIcons[index];
            return (
              <li key={resource.label} className={resourceSpans[index]}>
                <Link
                  href={localizeHref(resource.href, locale)}
                  className="group relative grid h-full min-h-52 min-w-0 overflow-hidden border border-border bg-background p-5 outline-none transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-brand-orange focus-visible:-translate-y-1 focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transform-none motion-reduce:transition-none md:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-6 -top-6 size-36 rotate-6 border border-border/60 bg-[linear-gradient(90deg,transparent_24px,var(--color-track)_25px,transparent_26px),linear-gradient(transparent_24px,var(--color-track)_25px,transparent_26px)] bg-[size:26px_26px] opacity-70 transition-transform duration-300 group-hover:rotate-0 group-focus-visible:rotate-0 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <span className="relative flex items-start justify-between gap-6">
                    <span className="flex size-12 items-center justify-center border border-foreground bg-foreground text-background">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
                      R{String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="relative mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-5 self-end">
                    <span className="min-w-0">
                      <span className="block text-xl font-bold tracking-[-0.025em] text-foreground transition-colors duration-150 group-hover:text-brand-orange group-focus-visible:text-brand-orange">
                        {resource.label}
                      </span>
                      <span className="mt-2 block max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {resource.body}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 text-brand-orange transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="dark-section mt-6 grid gap-4 border border-border px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-6">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground">
            {copy.accountBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 justify-self-start border-b border-brand-orange font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange outline-none transition-[border-color,color] duration-150 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:justify-self-end"
          >
            {copy.accountCta}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
