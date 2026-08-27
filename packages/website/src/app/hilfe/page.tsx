import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { HELP_COPY, HELP_LIMITATIONS_COPY } from "@/lib/i18n/public-info-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  getRuntimeFeatures,
  type RuntimeFeatures,
} from "@/lib/runtime-features";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/hilfe";
const ARTICLE_4_SOURCE =
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = HELP_COPY[locale].metadata;
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

type FaqItem = {
  readonly question: string;
  readonly id: string;
  readonly answer: ReactNode;
};

type Limitation = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly mitigation: ReactNode;
};

function formatCount(
  template: string,
  token: "courseCount" | "bookCount",
  count: number,
): string {
  return template.replace(`{${token}}`, String(count));
}

function withMailto(text: string): ReactNode {
  const [before, after = ""] = text.split("tim@loehrning.ai");
  return (
    <>
      {before}
      <a href="mailto:tim@loehrning.ai">tim@loehrning.ai</a>
      {after}
    </>
  );
}

function signInAnswer(
  answers: (typeof HELP_COPY)[Locale]["answers"],
  features: RuntimeFeatures,
): string {
  if (features.magicLink && features.google) return answers.signInBoth;
  if (features.google) return answers.signInGoogle;
  if (features.magicLink) return answers.signInMagic;
  return answers.signInUnavailable;
}

function withLocalizedNewsLink(text: string, locale: Locale): ReactNode {
  const marker = locale === "de" ? "/neuigkeiten" : "/en/neuigkeiten";
  const [before, after = ""] = text.split(marker);
  return (
    <>
      {before}
      <Link href={localizeHref("/neuigkeiten", locale)}>{marker}</Link>
      {after}
    </>
  );
}

function getLimitations(
  locale: Locale,
  features: RuntimeFeatures,
): readonly Limitation[] {
  const copy = HELP_LIMITATIONS_COPY[locale].limitations;
  const accountAvailable =
    features.account && (features.magicLink || features.google);

  return [
    {
      id: "abschlussdokumente",
      title: copy.record.title,
      description: copy.record.description,
      mitigation: copy.record.mitigation,
    },
    {
      id: "praxisbeispiele",
      title: copy.simulations.title,
      description: copy.simulations.description,
      mitigation: copy.simulations.mitigation,
    },
    {
      id: "aktualitaet",
      title: copy.freshness.title,
      description: copy.freshness.description,
      mitigation: withLocalizedNewsLink(copy.freshness.mitigation, locale),
    },
    {
      id: "fortschritt-lokal",
      title: copy.progress.title,
      description: copy.progress.description,
      mitigation: accountAvailable
        ? copy.progress.mitigationAvailable
        : copy.progress.mitigationUnavailable,
    },
    {
      id: "buecher-rechtlich",
      title: copy.books.title,
      description:
        books.length === 1
          ? copy.books.descriptionOne
          : copy.books.descriptionMany.replace(
              "{bookCount}",
              String(books.length),
            ),
      mitigation: copy.books.mitigation,
    },
  ];
}

function limitationsAnswer(
  locale: Locale,
  features: RuntimeFeatures,
): ReactNode {
  const copy = HELP_LIMITATIONS_COPY[locale];
  const limitations = getLimitations(locale, features);

  return (
    <div className="min-w-0" data-limitations-ledger>
      <p className="max-w-[68ch] leading-6">{copy.intro}</p>
      <dl className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2">
        <div className="min-w-0 bg-background p-3">
          <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {copy.reviewedLabel}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            <time dateTime="2026-08-08">{copy.reviewedDate}</time>
          </dd>
        </div>
        <div className="min-w-0 bg-background p-3">
          <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {copy.sourceLabel}
          </dt>
          <dd className="mt-1">
            <a href={ARTICLE_4_SOURCE}>EUR-Lex</a>
          </dd>
        </div>
      </dl>
      <ol className="mt-4 grid min-w-0 gap-2">
        {limitations.map((item, index) => (
          <li
            key={item.id}
            className="min-w-0 border border-border bg-background p-4"
          >
            <div className="flex min-w-0 items-baseline justify-between gap-4">
              <h3 className="min-w-0 break-words text-base font-bold text-foreground">
                {item.title}
              </h3>
              <span className="shrink-0 font-mono text-xs tabular-nums text-brand-orange">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-2 leading-6">{item.description}</p>
            <p className="mt-3 border-l-[3px] border-brand-orange pl-3 leading-6">
              <strong className="text-foreground">
                {copy.consequenceLabel}{" "}
              </strong>
              {item.mitigation}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function getFaqItems(
  locale: Locale,
  features: RuntimeFeatures,
): readonly FaqItem[] {
  const copy = HELP_COPY[locale];
  const q = copy.questions;
  const a = copy.answers;
  const accountAvailable =
    features.account && (features.magicLink || features.google);

  return [
    {
      id: "anfang",
      question: q.start,
      answer: (
        <>
          {a.startBeforeCheck}
          <Link href={localizeHref("/ki-check", locale)}>
            {a.startCheckLink}
          </Link>
          {formatCount(a.startBetween, "courseCount", COURSE_CATALOG.length)}
          <Link href={localizeHref("/kurse", locale)}>
            {a.startCatalogLink}
          </Link>
          {a.startAfterCatalog}
        </>
      ),
    },
    {
      id: "konto",
      question: q.account,
      answer: accountAvailable ? a.accountAvailable : a.accountUnavailable,
    },
    {
      id: "fortschritt-weg",
      question: q.progress,
      answer: accountAvailable ? a.progressSynced : a.progressLocal,
    },
    {
      id: "anmeldung",
      question: q.signIn,
      answer: signInAnswer(a, features),
    },
    {
      id: "mehrere-geraete",
      question: q.devices,
      answer: accountAvailable ? a.devicesSynced : a.devicesLocal,
    },
    {
      id: "quiz",
      question: q.quiz,
      answer: a.quiz,
    },
    {
      id: "abschlussdokumente",
      question: q.records,
      answer: (
        <>
          {a.recordsBeforeLimits}
          {a.recordsLimitsLink}
          {a.recordsAfterLimits}
        </>
      ),
    },
    {
      id: "praxisbeispiel",
      question: q.simulations,
      answer: a.simulations,
    },
    {
      id: "buecher",
      question: q.books,
      answer:
        books.length === 1
          ? accountAvailable
            ? a.oneBookAvailable
            : a.oneBookUnavailable
          : formatCount(a.manyBooks, "bookCount", books.length),
    },
    {
      id: "konto-loeschen",
      question: q.data,
      answer: accountAvailable ? (
        <>
          {a.dataAvailableBeforeLink}
          <Link
            href={localizeHref("/konto/datenschutz", locale)}
            prefetch={false}
          >
            {a.dataLink}
          </Link>
          {withMailto(a.dataAvailableAfterLink)}
        </>
      ) : (
        withMailto(a.dataUnavailable)
      ),
    },
    {
      id: "rueckmeldung",
      question: q.feedback,
      answer: features.feedback ? (
        <>
          {a.feedbackAvailableBeforeLink}
          <Link href={localizeHref("/feedback", locale)}>{a.feedbackLink}</Link>
          {a.feedbackAvailableAfterLink}
        </>
      ) : (
        withMailto(a.feedbackUnavailable)
      ),
    },
    {
      id: "grenzen",
      question: q.limits,
      answer: limitationsAnswer(locale, features),
    },
  ];
}

function HilfeContent({
  locale,
  features,
}: {
  readonly locale: Locale;
  readonly features: RuntimeFeatures;
}) {
  const copy = HELP_COPY[locale];
  const faqItems = getFaqItems(locale, features);

  return (
    <article
      className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8"
      data-help-reference-board
    >
      <header className="overflow-hidden border border-foreground bg-card">
        <div className="h-1 bg-brand-orange" aria-hidden="true" />
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {copy.intro}
            </p>
          </div>

          <nav
            aria-label={copy.indexLabel}
            className="min-w-0 border-t border-foreground bg-kupfer-mist p-4 lg:border-l lg:border-t-0"
            data-help-topic-index
          >
            <div className="flex min-h-11 items-center justify-between gap-3 border border-foreground bg-background px-3">
              <span
                className="font-mono text-lg font-bold text-brand-orange"
                aria-hidden="true"
              >
                /
              </span>
              <h2 className="min-w-0 flex-1 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                {copy.indexLabel}
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {String(faqItems.length).padStart(2, "0")}
              </span>
            </div>
            <ol className="mt-2 grid grid-cols-2 gap-px bg-border">
              {faqItems.map((item, index) => (
                <li key={item.id} className="min-w-0 bg-background">
                  <Link
                    href={localizeHref(`${PATH}#${item.id}`, locale)}
                    aria-label={item.question}
                    className="grid min-h-11 min-w-0 grid-cols-[1.6rem_minmax(0,1fr)] items-center gap-1.5 px-2 py-2 text-xs leading-4 text-muted-foreground outline-none transition-colors duration-150 hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none"
                  >
                    <span className="font-mono tabular-nums text-brand-orange">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 break-words">
                      {copy.topics[index]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <section aria-labelledby="faq-heading" className="mt-7 min-w-0">
        <div className="grid gap-3 border-b border-foreground pb-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-end">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {String(faqItems.length).padStart(2, "0")} / FAQ
          </p>
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl"
          >
            {copy.faqHeading}
          </h2>
        </div>

        <div
          className="mt-4 grid min-w-0 items-start gap-2 lg:grid-cols-2"
          data-help-accordion-board
        >
          {faqItems.map((item, index) => (
            <details
              key={item.id}
              id={item.id}
              open={item.id === "grenzen"}
              className="group min-w-0 scroll-mt-24 border border-border bg-background open:border-foreground open:bg-card"
              data-limit-anchor={item.id === "grenzen" ? "true" : undefined}
            >
              <summary className="grid min-h-14 cursor-pointer list-none grid-cols-[2rem_minmax(0,1fr)_1.5rem] items-center gap-2 p-3 font-semibold text-foreground outline-none transition-colors duration-150 hover:bg-kupfer-mist hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center border border-border bg-card font-mono text-xs tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-words">{item.question}</span>
                <span
                  className="shrink-0 text-right font-mono text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-border p-4 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] [&_a]:text-foreground [&_a]:underline [&_a]:decoration-brand-orange/50 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:hover:decoration-brand-orange [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-brand-orange">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <aside className="mt-6 grid min-w-0 border border-foreground bg-kupfer-mist sm:grid-cols-[10rem_minmax(0,1fr)]">
          <p className="border-b border-foreground p-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange sm:border-b-0 sm:border-r">
            {copy.updatesEyebrow}
          </p>
          <div className="min-w-0 p-4">
            <h3 className="text-lg font-bold text-foreground">
              {copy.updatesHeading}
            </h3>
            <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
              {copy.updatesBody}{" "}
              <Link
                href={localizeHref("/neuigkeiten", locale)}
                className="text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                {copy.updatesLink}
              </Link>
              .
            </p>
          </div>
        </aside>
      </section>
    </article>
  );
}

export default async function HilfePage() {
  const locale = await getRequestLocale();
  return <HilfeContent locale={locale} features={getRuntimeFeatures()} />;
}
