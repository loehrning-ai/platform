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
import { BOOK_RAIL_SHOWN } from "@/components/home/mobile-rails";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
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
    "col-span-2 max-lg:col-span-1 lg:col-span-12",
  ] as const;
  const resourceTones = [
    "bg-brand-sky/55",
    "bg-brand-pink/45",
    "bg-brand-acid/50",
    "bg-brand-teal/15",
    "bg-brand-peach/45",
  ] as const;
  // Below lg a rail above this board already carries these subjects, so
  // their rows step out there: one path per destination on a phone.
  const railOwned = new Set<string>(
    BOOK_RAIL_SHOWN ? ["/demos", "/buecher"] : ["/demos"],
  );
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
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-peach/20 py-12 max-lg:border-b-0 max-lg:bg-background max-lg:py-5 md:py-20 lg:py-24"
      data-testid="ressourcen-section"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-16">
          <header className="max-w-xl max-lg:border-t-2 max-lg:border-foreground max-lg:pt-3">
            <p className="overline border-l-[3px] border-brand-orange pl-3 max-lg:sr-only">
              {copy.overline}
            </p>
            <h2 className="mt-4 text-fluid-h2 font-bold tracking-[-0.035em] text-foreground max-lg:mt-0 max-lg:text-2xl max-lg:tracking-[-0.03em]">
              {copy.headline}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground max-lg:hidden">
              {copy.introduction}
            </p>
          </header>

          <p className="rounded-2xl border border-foreground/10 bg-brand-acid/65 px-5 py-4 font-ui-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-foreground shadow-card max-lg:hidden lg:text-right">
            {copy.boardLabel}
          </p>
        </div>

        <ul
          className="mt-8 grid auto-rows-fr gap-3 max-lg:mt-4 max-lg:auto-rows-auto max-lg:grid-cols-1 max-lg:gap-0 max-lg:border-t max-lg:border-hairline sm:grid-cols-2 sm:gap-4 max-lg:sm:grid-cols-1 max-lg:sm:gap-0 lg:mt-10 lg:grid-cols-12"
          aria-label={copy.boardAriaLabel}
        >
          {copy.resources.map((resource, index) => {
            const Icon = resourceIcons[index];
            return (
              <li
                key={resource.label}
                className={`${resourceSpans[index]}${railOwned.has(resource.href) ? " max-lg:hidden" : ""}`}
              >
                <Link
                  href={localizeHref(resource.href, locale)}
                  className={`group relative grid h-full min-h-[10.5rem] min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${resourceTones[index] ?? resourceTones[0]} p-4 shadow-card outline-none transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:border-brand-cobalt focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-4 focus-visible:ring-offset-card motion-reduce:transform-none motion-reduce:transition-none max-lg:min-h-14 max-lg:grid-cols-[2rem_minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-3 max-lg:rounded-none max-lg:border-0 max-lg:border-b max-lg:border-hairline max-lg:bg-transparent max-lg:px-0 max-lg:py-2 max-lg:shadow-none max-lg:hover:translate-y-0 max-lg:hover:bg-card-hover max-lg:focus-visible:translate-y-0 max-lg:focus-visible:ring-offset-0 md:p-5 max-lg:md:px-0 max-lg:md:py-2 lg:min-h-52 lg:rounded-[1.6rem] lg:p-6`}
                  data-home-resource-card
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 hidden size-36 rotate-6 rounded-[2.5rem] border border-foreground/10 bg-paper/30 opacity-75 transition-transform duration-300 group-hover:rotate-12 group-focus-visible:rotate-12 motion-reduce:transform-none motion-reduce:transition-none lg:block"
                  />
                  <span className="relative flex items-start justify-between gap-6">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl border border-foreground/15 shadow-card max-lg:size-8 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:text-foreground max-lg:shadow-none ${iconTones[index] ?? iconTones[0]}`}
                    >
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <span
                      className={`font-ui-mono text-xs font-bold tabular-nums max-lg:hidden ${index === 3 ? "text-foreground" : "text-kupfer-dark"}`}
                    >
                      R{String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="relative mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 self-end max-lg:mt-0 max-lg:self-center lg:mt-8 lg:gap-5">
                    <span className="min-w-0">
                      <span className="block text-xl font-bold tracking-[-0.025em] text-foreground transition-colors duration-150 group-hover:text-brand-orange group-focus-visible:text-brand-orange max-lg:text-base max-lg:tracking-normal">
                        {resource.label}
                      </span>
                      <span className="mt-2 block max-w-xl text-sm leading-relaxed text-muted-foreground max-lg:hidden">
                        {resource.body}
                      </span>
                      <span className="block text-[0.8125rem] leading-snug text-muted-foreground lg:hidden">
                        {resource.short}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 text-brand-orange transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none max-lg:hidden"
                    />
                  </span>
                  <ArrowGlyph className="mr-1 text-foreground lg:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-brand-cobalt bg-brand-cobalt p-4 shadow-card-hover max-lg:mt-3 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-4 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-6 md:py-5 max-lg:md:p-0 lg:mt-7 lg:rounded-[1.6rem]">
          <p className="max-w-2xl text-sm leading-relaxed text-white max-lg:text-[0.8125rem] max-lg:leading-snug max-lg:text-muted-foreground">
            {copy.accountBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 justify-self-start rounded-xl border border-brand-acid bg-brand-acid px-4 font-semibold text-foreground outline-none transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-acid focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cobalt motion-reduce:transform-none motion-reduce:transition-none max-lg:rounded-none max-lg:border-foreground max-lg:bg-transparent max-lg:px-3 max-lg:text-sm max-lg:hover:translate-y-0 max-lg:hover:border-foreground max-lg:hover:bg-card-hover max-lg:focus-visible:ring-brand-orange max-lg:focus-visible:ring-offset-background sm:justify-self-end"
          >
            {copy.accountCta}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
