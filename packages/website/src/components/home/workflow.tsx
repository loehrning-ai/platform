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
    "sm:col-span-1 lg:col-span-7",
    "sm:col-span-1 lg:col-span-5",
    "sm:col-span-1 lg:col-span-5",
    "sm:col-span-1 lg:col-span-7",
    "sm:col-span-2 lg:col-span-12",
  ] as const;
  const resourceTones = [
    "bg-brand-sky/55",
    "bg-brand-pink/45",
    "bg-brand-acid/50",
    "bg-brand-teal/15",
    "bg-brand-peach/45",
  ] as const;
  const iconTones = [
    "bg-brand-cobalt text-white",
    "bg-brand-orange text-white",
    "bg-brand-teal text-white",
    "bg-brand-cobalt text-white",
    "bg-brand-orange text-white",
  ] as const;

  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-peach/20 py-12 md:py-20 lg:py-24"
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

          <p className="rounded-2xl border border-foreground/10 bg-brand-acid/65 px-5 py-4 font-ui-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-foreground shadow-card lg:text-right">
            {copy.boardLabel}
          </p>
        </div>

        <ul
          className="mt-8 grid auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-10 lg:grid-cols-12"
          aria-label={copy.boardAriaLabel}
        >
          {copy.resources.map((resource, index) => {
            const Icon = resourceIcons[index];
            return (
              <li key={resource.label} className={resourceSpans[index]}>
                <Link
                  href={localizeHref(resource.href, locale)}
                  className={`group relative grid h-full min-h-[10.5rem] min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${resourceTones[index] ?? resourceTones[0]} p-4 shadow-card outline-none transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:border-brand-cobalt focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-4 focus-visible:ring-offset-card motion-reduce:transform-none motion-reduce:transition-none md:p-5 lg:min-h-52 lg:rounded-[1.6rem] lg:p-6`}
                  data-home-resource-card
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 hidden size-36 rotate-6 rounded-[2.5rem] border border-foreground/10 bg-paper/30 opacity-75 transition-transform duration-300 group-hover:rotate-12 group-focus-visible:rotate-12 motion-reduce:transform-none motion-reduce:transition-none lg:block"
                  />
                  <span className="relative flex items-start justify-between gap-6">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl border border-foreground/15 shadow-card ${iconTones[index] ?? iconTones[0]}`}
                    >
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <span
                      className={`font-ui-mono text-xs font-bold tabular-nums ${index === 3 ? "text-foreground" : "text-brand-orange"}`}
                    >
                      R{String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="relative mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 self-end lg:mt-8 lg:gap-5">
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

        <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-brand-cobalt bg-brand-cobalt p-4 shadow-card-hover sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-6 md:py-5 lg:mt-7 lg:rounded-[1.6rem]">
          <p className="max-w-2xl text-sm leading-relaxed text-white">
            {copy.accountBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 justify-self-start rounded-xl border border-brand-acid bg-brand-acid px-4 font-semibold text-foreground outline-none transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-acid focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cobalt motion-reduce:transform-none motion-reduce:transition-none sm:justify-self-end"
          >
            {copy.accountCta}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
