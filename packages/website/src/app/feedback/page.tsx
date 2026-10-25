import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { FEEDBACK_COPY } from "@/lib/i18n/public-info-copy";
import type { Locale } from "@/lib/i18n/locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { LEGAL_IDENTITY } from "@/lib/legal-identity";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { FeedbackForm } from "./feedback-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = FEEDBACK_COPY[locale];
  return createNoindexPageMetadata(
    getRuntimeFeatures().feedback ? copy.metadata : copy.contact.metadata,
  );
}

const LINK_CLASS =
  "break-words text-lg font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";

/** Without stored feedback the route is a plain contact page. */
function ContactContent({ locale }: { readonly locale: Locale }) {
  const copy = FEEDBACK_COPY[locale].contact;

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="border-b border-border pb-6">
        <div className="h-[3px] w-16 bg-brand-orange" />
        <h1 className="mt-4 max-w-4xl text-pretty text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {copy.intro}
        </p>
      </header>

      <ul className="grid gap-4 pt-6 sm:grid-cols-2 lg:max-w-4xl">
        <li className="min-w-0 border border-border border-l-[3px] border-l-brand-orange bg-card p-5 sm:p-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.emailLabel}
          </p>
          <p className="mt-3">
            <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LINK_CLASS}>
              {LEGAL_IDENTITY.email}
            </a>
          </p>
        </li>
        <li className="min-w-0 border border-border border-l-[3px] border-l-brand-orange bg-card p-5 sm:p-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.linkedInLabel}
          </p>
          <p className="mt-3">
            <a
              href={LEGAL_IDENTITY.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {copy.linkedInText}
              <span className="sr-only"> ({copy.opensNewTab})</span>
            </a>
          </p>
        </li>
      </ul>

      <p className="mt-6 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
        {copy.errorHint}
      </p>
    </article>
  );
}

function FeedbackContent({ locale }: { readonly locale: Locale }) {
  const copy = FEEDBACK_COPY[locale];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="border-b border-border pb-6">
        <div className="h-[3px] w-16 bg-brand-orange" />
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {copy.introAvailable}
        </p>
        <p className="mt-4 break-words text-sm text-muted-foreground">
          {copy.emailBefore}
          <a
            href={`mailto:${LEGAL_IDENTITY.email}`}
            className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            tim@loehrning.ai
          </a>
        </p>
      </header>

      <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
        <section aria-label={copy.title} className="min-w-0">
          <FeedbackForm locale={locale} />
        </section>

        <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.boundaryEyebrow}
          </p>
          <h2 className="mt-4 text-xl font-bold tracking-[-0.025em] text-foreground">
            {copy.boundaryHeading}
          </h2>
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {copy.boundaryItems.map((item, index) => (
              <li
                key={item}
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-2 py-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="font-mono text-xs text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}

export default async function FeedbackPage() {
  const locale = await getRequestLocale();
  return getRuntimeFeatures().feedback ? (
    <FeedbackContent locale={locale} />
  ) : (
    <ContactContent locale={locale} />
  );
}
