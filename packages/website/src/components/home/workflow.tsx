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
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const RESOURCE_ICONS: readonly LucideIcon[] = [
  FileText,
  BookOpen,
  FlaskConical,
  UsersRound,
  GitFork,
];
/* The board's bento from lg: rows of 7 + 5 and 5 + 7 columns and one full
   row; below lg two columns, so the four phone cards make a square. */
const RESOURCE_SPANS = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-12",
] as const;
const RESOURCE_TONES = [
  "bg-brand-sky/55",
  "bg-brand-pink/45",
  "bg-brand-acid/50",
  "bg-brand-teal/15",
  "bg-brand-peach/45",
] as const;
const ICON_TONES = [
  "bg-brand-cobalt text-white",
  "bg-brand-orange text-white",
  "bg-brand-teal text-white",
  "bg-brand-cobalt text-white",
  "bg-brand-orange text-white",
] as const;

/**
 * Ressourcen: the supporting areas as one pastel board. Every destination
 * is a tinted card with its icon tile, name and one short line, and a paper
 * block tilted into its corner from lg; the cobalt account band closes the
 * board. Below lg a rail above this board already carries the demos (and
 * the books while that rail is shown), so their cards step out there: one
 * path per destination on a phone.
 */
export function Workflow({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].workflow;
  const railOwned = new Set<string>(
    BOOK_RAIL_SHOWN ? ["/demos", "/buecher"] : ["/demos"],
  );

  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-peach/20 py-12 max-lg:py-6 md:py-20 lg:py-24"
      data-testid="ressourcen-section"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 top-16 hidden size-40 rotate-12 rounded-[2.5rem] border border-foreground/10 bg-brand-sky/35 lg:block"
      />
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <h2 className="max-w-xl text-fluid-h2 font-bold tracking-[-0.035em] text-foreground max-lg:text-2xl max-lg:tracking-[-0.03em]">
            {copy.headline}
          </h2>
          <p className="justify-self-start rounded-2xl border border-foreground/10 bg-brand-acid/65 px-5 py-3 font-ui-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-foreground shadow-card max-lg:hidden lg:justify-self-end">
            {copy.boardLabel(copy.resources.length)}
          </p>
        </div>

        <ul
          className="mt-8 grid auto-rows-fr grid-cols-2 gap-3 max-lg:mt-5 max-lg:gap-2 sm:gap-4 lg:mt-10 lg:grid-cols-12"
          aria-label={copy.boardAriaLabel}
        >
          {copy.resources.map((resource, index) => {
            const Icon = RESOURCE_ICONS[index] ?? FileText;
            const hiddenOnPhone = railOwned.has(resource.href);
            return (
              <li
                key={resource.label}
                className={`${RESOURCE_SPANS[index] ?? ""}${hiddenOnPhone ? " max-lg:hidden" : ""}`}
              >
                <Link
                  href={localizeHref(resource.href, locale)}
                  className={`group relative grid h-full min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${RESOURCE_TONES[index] ?? RESOURCE_TONES[0]} p-4 shadow-card outline-none transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:border-brand-cobalt focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none max-lg:min-h-[6.5rem] max-lg:rounded-2xl max-lg:p-3 md:p-5 lg:min-h-48 lg:rounded-[1.6rem] lg:p-6`}
                  data-home-resource-card
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 hidden size-36 rotate-6 rounded-[2.5rem] border border-foreground/10 bg-paper/30 opacity-75 transition-transform duration-300 group-hover:rotate-12 group-focus-visible:rotate-12 motion-reduce:transform-none motion-reduce:transition-none lg:block"
                  />
                  <span className="relative flex items-start justify-between gap-6">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl border border-foreground/15 shadow-card max-lg:size-8 max-lg:rounded-lg ${ICON_TONES[index] ?? ICON_TONES[0]}`}
                    >
                      <Icon
                        aria-hidden="true"
                        className="size-[22px] max-lg:size-4"
                        strokeWidth={1.6}
                      />
                    </span>
                    <span
                      aria-hidden="true"
                      className={`font-ui-mono text-xs font-bold tabular-nums max-lg:hidden ${index === 3 ? "text-foreground" : "text-brand-orange"}`}
                    >
                      R{String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="relative mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 self-end max-lg:mt-2 max-lg:gap-2 lg:mt-8 lg:gap-5">
                    <span className="min-w-0">
                      <span className="block text-xl font-bold tracking-[-0.025em] text-foreground transition-colors duration-150 group-hover:text-brand-orange group-focus-visible:text-brand-orange max-lg:text-base">
                        {resource.label}
                      </span>
                      <span className="mt-1 block max-w-xl text-sm leading-snug text-muted-foreground lg:mt-2 lg:leading-relaxed">
                        {resource.short}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 text-brand-orange transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none max-lg:hidden"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Below 22.5rem (360px) the button takes its own row under the
            sentence; a rem query, so it outranks max-lg in the cascade and
            follows the browser's font size. */}
        <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-brand-cobalt bg-brand-cobalt p-4 shadow-card-hover max-lg:mt-4 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:items-center max-lg:rounded-2xl max-lg:p-3 max-[22.5rem]:grid-cols-1 max-[22.5rem]:gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-6 md:py-5 lg:mt-7 lg:rounded-[1.6rem]">
          <p className="max-w-2xl text-sm leading-relaxed text-white max-lg:text-xs">
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
