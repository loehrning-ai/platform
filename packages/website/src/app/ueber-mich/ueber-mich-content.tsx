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
  const newTabNotice =
    locale === "de" ? ", öffnet in neuem Tab" : ", opens in a new tab";
  const facts = [
    [copy.hero.roleLabel, copy.hero.roleValue],
    [copy.hero.focusLabel, copy.hero.focusValue],
    [copy.hero.accessLabel, copy.hero.accessValue],
  ] as const;
  const contactLinks = [
    {
      href: `mailto:${TIM_ENTITY.email}`,
      label: copy.contact.email,
      detail: "E-Mail",
      Icon: Mail,
      external: false,
    },
    {
      href: TIM_ENTITY.linkedInUrl,
      label: copy.contact.linkedIn,
      detail: "linkedin.com",
      Icon: Linkedin,
      external: true,
    },
    {
      href: TIM_ENTITY.personalGithubUrl,
      label: copy.contact.github,
      detail: "github.com",
      Icon: Github,
      external: true,
    },
  ] as const;

  return (
    <article className="w-full overflow-x-clip bg-background">
      <header className="border-b border-border py-8 sm:py-10">
        <div
          className="mx-auto grid w-full max-w-6xl gap-3 px-4 sm:px-6 lg:grid-cols-12 lg:px-8"
          data-profile-bento
        >
          <div className="dark-section relative min-w-0 overflow-hidden border border-foreground bg-background p-5 text-foreground sm:p-7 lg:col-span-7">
            <span
              className="absolute right-5 top-5 h-24 w-24 rotate-45 border border-border"
              aria-hidden="true"
            />
            <div className="h-[3px] w-16 bg-brand-orange" />
            <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.hero.eyebrow}
            </p>
            <h1 className="relative mt-4 max-w-[16ch] break-words text-pretty text-[clamp(2.35rem,5vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.05em] text-foreground [overflow-wrap:anywhere]">
              {copy.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base font-semibold leading-relaxed text-foreground sm:text-lg">
              {copy.hero.intro}
            </p>
          </div>

          <figure className="group relative min-w-0 overflow-hidden border border-foreground bg-foreground p-2 lg:col-span-5 lg:row-span-2">
            <div className="relative h-full min-h-[22rem] overflow-hidden">
              <Image
                src={TIM_ENTITY.portraitPath}
                alt={copy.metadata.portraitAlt}
                width={800}
                height={800}
                priority
                sizes="(min-width: 1024px) 28rem, (min-width: 640px) 42vw, calc(100vw - 2.5rem)"
                className="h-full min-h-[22rem] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-foreground/90 to-transparent"
                aria-hidden="true"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex min-w-0 items-end justify-between gap-4 p-4 text-background">
                <span
                  translate="no"
                  className="min-w-0 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] [overflow-wrap:anywhere]"
                >
                  {copy.hero.portraitCaption}
                </span>
                <span
                  className="h-3 w-3 shrink-0 bg-kupfer-light"
                  aria-hidden="true"
                />
              </figcaption>
            </div>
          </figure>

          <dl className="grid min-w-0 gap-px border border-border bg-border sm:grid-cols-3 lg:col-span-7">
            {facts.map(([label, value], index) => (
              <div
                key={label}
                className="group relative min-w-0 bg-background p-4 transition-colors hover:bg-card"
              >
                <dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <span className="block tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-5 block">{label}</span>
                </dt>
                <dd className="mt-2 min-w-0 break-words text-sm font-semibold leading-relaxed text-foreground [overflow-wrap:anywhere]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="min-w-0 border border-border bg-card p-5 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base lg:col-span-12">
            {copy.hero.detail}
          </p>
        </div>
      </header>

      <CredibilityLogos locale={locale} />
      <CareerTimeline locale={locale} />
      <Credentials locale={locale} />

      <section
        id="redaktion"
        className="border-t border-border py-10"
        aria-labelledby="editorial-heading"
        data-editorial-bento
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(18rem,0.5fr)] md:items-end md:gap-8">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.editorial.eyebrow}
              </p>
              <h2
                id="editorial-heading"
                className="mt-3 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground"
              >
                {copy.editorial.title}
              </h2>
            </div>
            <p className="min-w-0 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.editorial.intro}
            </p>
          </header>

          <ol className="mt-6 grid gap-px border border-border bg-border md:grid-cols-2">
            {copy.editorial.policies.map((policy, index) => (
              <li
                key={policy.title}
                className={`group relative min-w-0 overflow-hidden bg-background p-5 transition-colors hover:bg-card ${
                  index === 0 ? "md:row-span-2" : ""
                }`}
              >
                <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="absolute right-3 top-3 h-14 w-14 rotate-45 border border-border transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
                  aria-hidden="true"
                />
                <h3 className="mt-8 max-w-[16ch] break-words text-xl font-bold tracking-[-0.025em] text-foreground [overflow-wrap:anywhere]">
                  {policy.title}
                </h3>
                <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {policy.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            <span>{copy.editorial.guidePrefix}</span>
            <a
              href={CONTENT_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-background px-3 font-mono text-xs font-bold text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              data-link-preview
            >
              <span translate="no">{copy.editorial.guideLabel}</span>
              <span className="sr-only">{newTabNotice}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>

      <section
        id="kontakt"
        className="dark-section border-t border-border bg-background py-10"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(20rem,0.72fr)] lg:items-stretch lg:gap-8 lg:px-8">
          <div className="flex min-w-0 flex-col justify-between border-l-[3px] border-brand-orange pl-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.contact.eyebrow}
            </p>
            <h2
              id="contact-heading"
              className="mt-4 text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl"
            >
              {copy.contact.title}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              {copy.contact.intro}
            </p>
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
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
            {contactLinks.map(
              ({ href, label, detail, Icon, external }, index) => (
                <a
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-label={external ? `${label}${newTabNotice}` : label}
                  className="group grid min-h-24 min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 bg-background px-4 py-4 text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                  data-link-preview
                >
                  <span className="flex h-11 w-11 items-center justify-center border border-border text-brand-orange">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")} · {detail}
                    </span>
                    <span className="mt-1 block min-w-0 break-words text-sm font-semibold [overflow-wrap:anywhere]">
                      {label}
                    </span>
                  </span>
                  {external ? (
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  )}
                </a>
              ),
            )}
          </nav>
        </div>
      </section>
    </article>
  );
}
