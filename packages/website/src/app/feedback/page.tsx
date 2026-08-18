import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { FEEDBACK_COPY } from "@/lib/i18n/public-info-copy";
import type { Locale } from "@/lib/i18n/locale";
import {
  getRuntimeFeatures,
  type RuntimeFeatures,
} from "@/lib/runtime-features";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { FeedbackForm } from "./feedback-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(FEEDBACK_COPY[locale].metadata);
}

function FeedbackContent({
  locale,
  features,
}: {
  readonly locale: Locale;
  readonly features: RuntimeFeatures;
}) {
  const copy = FEEDBACK_COPY[locale];

  return (
    <article className="mx-auto w-full max-w-6xl px-5 pb-28 pt-16 sm:px-8 sm:pt-20 lg:px-10">
      <header className="border-b border-border pb-12">
        <div className="h-[3px] w-24 bg-brand-orange" />
        <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-5 max-w-5xl text-pretty text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.94] tracking-[-0.04em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {features.feedback ? copy.introAvailable : copy.introUnavailable}
        </p>
        <p className="mt-4 break-words text-sm text-muted-foreground">
          {copy.emailBefore}
          <a
            href="mailto:tim@loehrning.ai"
            className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            tim@loehrning.ai
          </a>
        </p>
      </header>

      <div className="grid gap-10 pt-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <section aria-label={copy.title} className="min-w-0">
          {features.feedback ? (
            <FeedbackForm locale={locale} />
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="border border-border bg-card/50 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                {copy.disabledCodeLabel}
              </p>
              <p className="mt-4 max-w-xl break-words">{copy.disabledStatus}</p>
            </div>
          )}
        </section>

        <aside className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
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
                <span className="font-mono text-[10px] text-brand-orange">
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
  return <FeedbackContent locale={locale} features={getRuntimeFeatures()} />;
}
