import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { SoftwareArtifactLiveExample } from "@/lib/open-source/artifacts";

const CELL =
  "group flex h-full min-h-11 flex-col gap-2 p-4 transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background sm:p-5";

/**
 * Finished work made with the tool, as links to the real output on this
 * site. A static file (a deck) opens as itself in the same tab, like a
 * workshop material; a page route goes through the locale.
 */
export function LiveExample({
  example,
  locale,
  headingId = "live-example",
}: {
  readonly example: SoftwareArtifactLiveExample;
  readonly locale: Locale;
  readonly headingId?: string;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xl font-bold tracking-[-0.03em] sm:text-2xl"
      >
        {example.title}
      </h2>
      <p className="mt-3 max-w-[68ch] text-pretty leading-relaxed text-muted-foreground">
        {example.summary}
      </p>
      <ol className="mt-6 grid border-l border-t border-foreground sm:grid-cols-2 lg:grid-cols-4">
        {example.links.map((link, index) => {
          const body = (
            <>
              <span
                aria-hidden="true"
                className="font-mono text-xs font-bold tracking-[0.12em] text-brand-orange group-hover:text-background group-focus-visible:text-background group-active:text-background"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex items-baseline justify-between gap-3 text-lg font-semibold leading-snug">
                {link.label}
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 self-center transition-transform duration-100 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-background group-focus-visible:text-background group-active:text-background">
                {link.detail}
              </span>
            </>
          );
          return (
            <li
              key={link.href}
              className="min-w-0 border-b border-r border-foreground"
            >
              {/\.html?$/.test(link.href) ? (
                <a href={link.href} className={CELL}>
                  {body}
                </a>
              ) : (
                <Link href={localizeHref(link.href, locale)} className={CELL}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
