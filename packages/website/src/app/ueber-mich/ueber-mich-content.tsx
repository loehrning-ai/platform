import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { Github, Linkedin } from "@/components/icons/brand";
import { CareerTimeline } from "@/components/about/career-timeline";
import { CredibilityLogos } from "@/components/about/credibility-logos";
import { Credentials } from "@/components/about/credentials";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { TIM_ENTITY } from "@/lib/seo/entity";

const CONTENT_GUIDE_URL =
  "https://github.com/loehrning-ai/platform/blob/main/CONTENT_GUIDE.md";

export function UeberMichContent({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale];
  const facts = [
    [copy.hero.roleLabel, copy.hero.roleValue],
    [copy.hero.focusLabel, copy.hero.focusValue],
    [copy.hero.accessLabel, copy.hero.accessValue],
  ] as const;

  return (
    <article className="w-full overflow-x-clip">
      <header className="border-b border-border py-8 sm:py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)] lg:items-start lg:gap-8 lg:px-8">
          <div className="min-w-0">
            <div className="h-[3px] w-16 bg-brand-orange" />
            <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl break-words text-pretty text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere]">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-base font-medium leading-relaxed text-foreground sm:text-lg">
              {copy.hero.intro}
            </p>
            <p className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.hero.detail}
            </p>
          </div>

          <div className="min-w-0 lg:justify-self-end">
            <figure className="mx-auto w-full max-w-sm border border-border border-t-[3px] border-t-brand-orange bg-background p-2 lg:mx-0">
              <div>
                <Image
                  src={TIM_ENTITY.portraitPath}
                  alt={copy.metadata.portraitAlt}
                  width={800}
                  height={800}
                  priority
                  sizes="(min-width: 1024px) 28rem, (min-width: 640px) 28rem, calc(100vw - 2.5rem)"
                  className="aspect-square h-auto w-full object-cover"
                />
                <figcaption className="flex min-w-0 items-center justify-between gap-4 border-t border-border px-2 pb-1 pt-3">
                  <span
                    translate="no"
                    className="min-w-0 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground [overflow-wrap:anywhere]"
                  >
                    {copy.hero.portraitCaption}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 bg-brand-orange"
                    aria-hidden="true"
                  />
                </figcaption>
              </div>
            </figure>

            <dl className="mt-4 divide-y divide-border border-y border-border bg-background">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="grid min-w-0 gap-1 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="min-w-0 break-words text-sm font-semibold leading-relaxed text-foreground [overflow-wrap:anywhere]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <div className="[&>section]:!py-8 [&>section>div]:!gap-6 [&_.font-mono]:!text-xs [&_li]:!min-h-24 [&_li]:!py-4">
        <CredibilityLogos locale={locale} />
      </div>
      <div className="[&>section]:!py-12 [&>section>div]:!gap-6 [&_.font-mono]:!text-xs [&_ol>li]:!p-4 [&_ol>li>p]:!mt-2">
        <CareerTimeline locale={locale} />
      </div>
      <div className="[&>section]:!py-12 [&_article]:!p-4 [&_article]:!shadow-none [&_article>h3]:!mt-4 [&_article>p]:!mt-2 [&_header]:!pb-6 [&_.font-mono]:!text-xs">
        <Credentials locale={locale} />
      </div>

      <section
        id="redaktion"
        className="border-t border-border py-12"
        aria-labelledby="editorial-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="grid gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(18rem,0.5fr)] md:items-end md:gap-10">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.editorial.eyebrow}
              </p>
              <h2
                id="editorial-heading"
                className="mt-4 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl"
              >
                {copy.editorial.title}
              </h2>
            </div>
            <p className="min-w-0 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.editorial.intro}
            </p>
          </header>

          <ol className="mt-6 divide-y divide-border border-y border-border">
            {copy.editorial.policies.map((policy, index) => (
              <li
                key={policy.title}
                className="grid min-w-0 gap-2 py-4 sm:grid-cols-[2.5rem_15rem_minmax(0,1fr)] sm:gap-4"
              >
                <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="break-words text-lg font-bold tracking-[-0.025em] text-foreground [overflow-wrap:anywhere]">
                  {policy.title}
                </h3>
                <p className="break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {policy.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-6 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {copy.editorial.guidePrefix}{" "}
            <a
              href={CONTENT_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-bold text-foreground underline decoration-brand-orange/60 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <span translate="no">{copy.editorial.guideLabel}</span>
              <span className="sr-only"> ↗</span>
            </a>
            .
          </p>
        </div>
      </section>

      <section
        id="kontakt"
        className="border-t border-border bg-card py-12"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.46fr)] lg:items-end lg:gap-8 lg:px-8">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.contact.eyebrow}
            </p>
            <h2
              id="contact-heading"
              className="mt-4 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl"
            >
              {copy.contact.title}
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              {copy.contact.intro}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {copy.contact.feedbackPrefix}{" "}
              <Link
                href={localizeHref("/feedback", locale)}
                className="font-semibold text-foreground underline decoration-brand-orange/60 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                {copy.contact.feedbackLabel}
              </Link>
              .
            </p>
          </div>

          <nav
            aria-label={copy.contact.linksLabel}
            className="grid min-w-0 gap-px overflow-hidden border border-border bg-border"
          >
            <a
              href={`mailto:${TIM_ENTITY.email}`}
              className="group flex min-h-12 min-w-0 items-center justify-between gap-4 border-l-[3px] border-l-brand-orange bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Mail
                  size={17}
                  className="shrink-0 text-brand-orange"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {copy.contact.email}
                </span>
              </span>
              <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
            <a
              href={TIM_ENTITY.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-12 min-w-0 items-center justify-between gap-4 bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Linkedin
                  size={17}
                  className="shrink-0 text-brand-orange"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {copy.contact.linkedIn}
                </span>
              </span>
              <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
            <a
              href={TIM_ENTITY.personalGithubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-12 min-w-0 items-center justify-between gap-4 bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Github
                  size={17}
                  className="shrink-0 text-brand-orange"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {copy.contact.github}
                </span>
              </span>
              <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </section>
    </article>
  );
}
