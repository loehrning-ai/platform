import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { Github, Linkedin } from "@/components/icons/brand";
import { CareerTimeline } from "@/components/about/career-timeline";
import { CredibilityLogos } from "@/components/about/credibility-logos";
import { Credentials } from "@/components/about/credentials";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { GITHUB_ORG, TIM_ENTITY } from "@/lib/seo/entity";

const CONTENT_GUIDE_URL =
  "https://github.com/loehrning-ai/platform/blob/main/CONTENT_GUIDE.md";

const externalLinkClass =
  "inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-[background-color,text-decoration-color] hover:bg-card hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";

export function UeberMichContent({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale];
  const facts = [
    [copy.hero.roleLabel, copy.hero.roleValue],
    [copy.hero.focusLabel, copy.hero.focusValue],
    [copy.hero.accessLabel, copy.hero.accessValue],
  ] as const;

  return (
    <article className="w-full overflow-x-clip">
      <header className="relative border-b border-border py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-grid opacity-35"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.43fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="min-w-0">
            <div className="h-[3px] w-24 bg-brand-orange" />
            <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-5 max-w-5xl break-words text-pretty text-[clamp(2.7rem,6.4vw,6.2rem)] font-bold leading-[0.91] tracking-[-0.06em] text-foreground [overflow-wrap:anywhere]">
              {copy.hero.title}
            </h1>
            <p className="mt-7 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-foreground sm:text-xl">
              {copy.hero.intro}
            </p>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.hero.detail}
            </p>

            <nav
              aria-label={copy.hero.linksLabel}
              className="mt-8 flex min-w-0 flex-wrap gap-3"
            >
              <a
                href={TIM_ENTITY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass}
              >
                <Linkedin size={16} aria-hidden="true" />
                <span className="break-words [overflow-wrap:anywhere]">
                  {copy.hero.linkedIn}
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a
                href={TIM_ENTITY.personalGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass}
              >
                <Github size={16} aria-hidden="true" />
                <span className="break-words [overflow-wrap:anywhere]">
                  {copy.hero.personalGithub}
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a
                href={GITHUB_ORG.url}
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass}
              >
                <Github size={16} aria-hidden="true" />
                <span className="break-words [overflow-wrap:anywhere]">
                  {copy.hero.organizationGithub}
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </nav>
          </div>

          <div className="min-w-0 lg:justify-self-end">
            <figure className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="absolute -inset-2 translate-x-3 translate-y-3 border-2 border-foreground bg-brand-orange sm:translate-x-4 sm:translate-y-4" />
              <div className="relative border-2 border-foreground bg-background p-2">
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
                    className="min-w-0 break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground [overflow-wrap:anywhere]"
                  >
                    {copy.hero.portraitCaption}
                  </span>
                  <span className="h-2.5 w-2.5 shrink-0 bg-brand-orange" aria-hidden="true" />
                </figcaption>
              </div>
            </figure>

            <dl className="relative mt-8 divide-y divide-border border-y border-border bg-background/90">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="grid min-w-0 gap-2 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
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

      <CredibilityLogos locale={locale} />
      <CareerTimeline locale={locale} />
      <Credentials locale={locale} />

      <section
        id="redaktion"
        className="border-t border-border py-20 sm:py-24"
        aria-labelledby="editorial-heading"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <header className="grid gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(18rem,0.5fr)] md:items-end md:gap-10">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
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

          <div className="mt-10 grid min-w-0 gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
            {copy.editorial.policies.map((policy, index) => (
              <article key={policy.title} className="min-w-0 bg-background p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="h-2.5 w-2.5 bg-brand-orange" aria-hidden="true" />
                  <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-8 break-words text-pretty text-xl font-bold tracking-[-0.025em] text-foreground [overflow-wrap:anywhere]">
                  {policy.title}
                </h3>
                <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {policy.body}
                </p>
              </article>
            ))}
          </div>

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
        className="border-t border-border bg-card/40 py-20 sm:py-24"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.46fr)] lg:items-end lg:gap-16 lg:px-10">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.contact.eyebrow}
            </p>
            <h2
              id="contact-heading"
              className="mt-4 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl"
            >
              {copy.contact.title}
            </h2>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.contact.intro}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
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
              className="group flex min-h-16 min-w-0 items-center justify-between gap-4 bg-background px-5 py-4 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Mail size={17} className="shrink-0 text-brand-orange" aria-hidden="true" />
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
              className="group flex min-h-16 min-w-0 items-center justify-between gap-4 bg-background px-5 py-4 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Linkedin size={17} className="shrink-0 text-brand-orange" aria-hidden="true" />
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
              className="group flex min-h-16 min-w-0 items-center justify-between gap-4 bg-background px-5 py-4 text-sm font-semibold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Github size={17} className="shrink-0 text-brand-orange" aria-hidden="true" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {copy.contact.github}
                </span>
              </span>
              <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </section>

      <section className="dark-section border-t border-border py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16 lg:px-10">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.cta.eyebrow}
            </p>
            <h2 className="mt-4 max-w-4xl break-words text-pretty text-3xl font-bold tracking-[-0.045em] text-foreground [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
              {copy.cta.title}
            </h2>
            <p className="mt-5 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.cta.body}
            </p>
          </div>
          <nav
            aria-label={copy.cta.linksLabel}
            className="flex min-w-0 flex-col gap-3 sm:flex-row lg:flex-col"
          >
            <Link
              href={localizeHref("/kurse", locale)}
              className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-between gap-4 bg-brand-orange px-5 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <span className="break-words [overflow-wrap:anywhere]">{copy.cta.courses}</span>
              <ArrowRight size={17} className="shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href={localizeHref("/open-source", locale)}
              className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-between gap-4 border border-border bg-background px-5 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <span className="break-words [overflow-wrap:anywhere]">
                {copy.cta.openSource}
              </span>
              <ArrowRight size={17} className="shrink-0" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </section>
    </article>
  );
}
