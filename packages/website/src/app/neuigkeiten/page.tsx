import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { NEWS_COPY } from "@/lib/i18n/public-info-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/neuigkeiten";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = NEWS_COPY[locale].metadata;
  const localizedPath = localizeHref(PATH, locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

function readChangelog(locale: Locale): string {
  const filename = locale === "de" ? "changelog.md" : "changelog.en.md";
  return readFileSync(join(process.cwd(), "content", filename), "utf-8");
}

function countChangelogEntries(changelog: string): number {
  return [...changelog.matchAll(/^##\s+\d{4}-\d{2}-\d{2}:/gm)].length;
}

function NeuigkeitenContent({ locale }: { readonly locale: Locale }) {
  const copy = NEWS_COPY[locale];
  const changelog = readChangelog(locale);
  const entryCount = countChangelogEntries(changelog);

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
        <div className="min-w-0">
          <div className="h-[3px] w-16 bg-brand-orange" />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-pretty text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-[68ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {copy.intro}
          </p>
        </div>

        <dl className="border-y border-border">
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3 lg:grid-cols-1 lg:px-4">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.statusLabel}
            </dt>
            <dd className="min-w-0 break-words text-sm font-semibold text-foreground">
              {copy.statusValue.replace("{count}", String(entryCount))}
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t border-border py-3 lg:grid-cols-1 lg:px-4">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.sourceLabel}
            </dt>
            <dd className="min-w-0 break-words text-sm font-semibold text-foreground">
              {copy.sourceValue}
            </dd>
          </div>
        </dl>
      </header>

      <section aria-label={copy.eyebrow} className="py-8">
        <div className="min-w-0 border-l border-border pl-4 sm:pl-6 [&_.prose-kupfer>h2]:scroll-mt-24 [&_.prose-kupfer>h2]:border-t [&_.prose-kupfer>h2]:border-border [&_.prose-kupfer>h2]:pt-6 [&_.prose-kupfer>h2]:text-pretty [&_.prose-kupfer>h3]:font-mono [&_.prose-kupfer>h3]:text-xs [&_.prose-kupfer>h3]:font-bold [&_.prose-kupfer>h3]:uppercase [&_.prose-kupfer>h3]:tracking-[0.12em] [&_.prose-kupfer>h3]:text-brand-orange [&_.prose-kupfer_ul]:ml-5 [&_.prose-kupfer_li]:break-words">
          <MarkdownRenderer content={changelog} />
        </div>
      </section>

      <footer className="border-y border-border py-6">
        <Link
          href={localizeHref("/kurse", locale)}
          className="inline-flex min-h-11 items-center gap-3 font-mono text-xs font-bold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          {copy.catalogLink}
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}

export default async function NeuigkeitenPage() {
  const locale = await getRequestLocale();
  return <NeuigkeitenContent locale={locale} />;
}
