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
import { HELP_COPY } from "@/lib/i18n/public-info-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  getRuntimeFeatures,
  type RuntimeFeatures,
} from "@/lib/runtime-features";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/hilfe";

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

function withInternalLink(
  text: string,
  label: string,
  href: string,
): ReactNode {
  const [before, after = ""] = text.split(label);
  return (
    <>
      {before}
      <Link href={href}>{label}</Link>
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
          <Link href={localizeHref("/ki-check", locale)}>{a.startCheckLink}</Link>
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
          <Link href={localizeHref("/bekannte-grenzen", locale)}>
            {a.recordsLimitsLink}
          </Link>
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
      ) : withMailto(a.dataUnavailable),
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
      ) : withMailto(a.feedbackUnavailable),
    },
    {
      id: "grenzen",
      question: q.limits,
      answer: (
        <>
          {a.limitsBeforeLink}
          <Link href={localizeHref("/bekannte-grenzen", locale)}>
            {a.limitsLink}
          </Link>
          {a.limitsAfterLink}
        </>
      ),
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
    <article className="mx-auto w-full max-w-6xl px-5 pb-28 pt-16 sm:px-8 sm:pt-20 lg:px-10">
      <header className="border-b border-border pb-12">
        <div className="h-[3px] w-24 bg-brand-orange" />
        <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-pretty text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.94] tracking-[-0.04em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {copy.intro}
        </p>
      </header>

      <div className="grid gap-12 pt-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {copy.indexLabel}
          </h2>
          <nav aria-label={copy.indexLabel} className="mt-5">
            <ol className="divide-y divide-border border-y border-border">
              {faqItems.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={localizeHref(`${PATH}#${item.id}`, locale)}
                    aria-label={item.question}
                    className="grid min-h-11 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 py-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    <span className="font-mono text-[10px] text-brand-orange">
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
        </aside>

        <section aria-labelledby="faq-heading" className="min-w-0">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl"
          >
            {copy.faqHeading}
          </h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqItems.map((item, index) => (
              <details
                key={item.id}
                id={item.id}
                className="group scroll-mt-24 py-1"
              >
                <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[2.5rem_minmax(0,1fr)_1.5rem] items-center gap-3 py-4 font-semibold text-foreground outline-none hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[10px] text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 text-pretty">{item.question}</span>
                  <span
                    className="shrink-0 text-right font-mono text-muted-foreground group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div className="pb-6 pl-[3.25rem] pr-5 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere] [&_a]:text-foreground [&_a]:underline [&_a]:decoration-brand-orange/50 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:hover:decoration-brand-orange [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-brand-orange">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2">
            <section className="min-w-0 bg-card/50 p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                {copy.actionEyebrow}
              </p>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {copy.actionHeading}
              </h3>
              <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
                {features.feedback ? (
                  <span className="[&_a]:text-foreground [&_a]:underline [&_a]:decoration-brand-orange/50 [&_a]:underline-offset-4 [&_a]:hover:decoration-brand-orange [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-brand-orange">
                    {withInternalLink(
                      copy.contactAvailable,
                      copy.contactLink,
                      localizeHref("/feedback", locale),
                    )}
                  </span>
                ) : (
                  <span className="[&_a]:text-foreground [&_a]:underline [&_a]:decoration-brand-orange/50 [&_a]:underline-offset-4 [&_a]:hover:decoration-brand-orange [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-brand-orange">
                    {withMailto(copy.contactUnavailable)}
                  </span>
                )}
              </p>
            </section>

            <section className="min-w-0 bg-card/50 p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                {copy.updatesEyebrow}
              </p>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {copy.updatesHeading}
              </h3>
              <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
                {copy.updatesBody}{" "}
                <Link
                  href={localizeHref("/neuigkeiten", locale)}
                  className="text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {copy.updatesLink}
                </Link>
                .
              </p>
            </section>
          </div>
        </section>
      </div>
    </article>
  );
}

export default async function HilfePage() {
  const locale = await getRequestLocale();
  return <HilfeContent locale={locale} features={getRuntimeFeatures()} />;
}
