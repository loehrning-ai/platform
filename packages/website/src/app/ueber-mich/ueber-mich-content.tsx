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

const FACT_WIDTHS = ["sm:flex-[0.8]", "sm:flex-[1.4]", "sm:flex-1"] as const;

const POLICY_STYLES = [
  "bg-brand-acid/35 md:mr-20",
  "bg-brand-sky/35 md:ml-12 md:mr-8",
  "bg-brand-pink/35 md:ml-24",
] as const;

const CONTACT_STYLES = [
  "bg-brand-acid/45",
  "bg-brand-lilac/55",
  "bg-brand-sky/50",
] as const;

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
      <header className="relative isolate overflow-hidden border-b border-border bg-paper py-10 sm:py-14">
        <span
          className="pointer-events-none absolute left-0 top-24 h-24 w-80 bg-brand-acid/65"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute right-0 bottom-10 h-32 w-72 bg-brand-sky/55"
          aria-hidden="true"
        />
        <div
          className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-10 lg:px-8"
          data-profile-editorial-spread
        >
          <div className="relative min-w-0 py-3 lg:col-span-7 lg:py-8">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              <span className="h-3 w-3 bg-brand-cobalt" aria-hidden="true" />
              {copy.hero.eyebrow}
            </p>
            <h1 className="relative mt-5 max-w-[15ch] break-words text-pretty text-[clamp(2.65rem,6vw,5.75rem)] font-bold leading-[0.9] tracking-[-0.06em] text-foreground [overflow-wrap:anywhere]">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base font-semibold leading-relaxed text-foreground sm:text-lg">
              {copy.hero.intro}
            </p>
            <p className="mt-6 max-w-2xl border-l-[3px] border-foreground bg-brand-acid/35 px-4 py-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.hero.detail}
            </p>
          </div>

          <figure className="group relative min-w-0 pb-3 pr-3 lg:col-span-5 lg:row-span-2 lg:rotate-1">
            <span
              className="absolute inset-0 translate-x-3 translate-y-3 bg-brand-pink/75"
              aria-hidden="true"
            />
            <div className="relative h-full min-h-[22rem] overflow-hidden bg-paper p-2 shadow-card ring-1 ring-foreground/40">
              <Image
                src={TIM_ENTITY.portraitPath}
                alt={copy.metadata.portraitAlt}
                width={800}
                height={800}
                priority
                sizes="(min-width: 1024px) 28rem, (min-width: 640px) 42vw, calc(100vw - 2.5rem)"
                className="h-full min-h-[22rem] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <figcaption className="absolute inset-x-4 bottom-4 flex min-w-0 items-end justify-between gap-4 bg-paper/95 p-3 text-foreground shadow-card">
                <span
                  translate="no"
                  className="min-w-0 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] [overflow-wrap:anywhere]"
                >
                  {copy.hero.portraitCaption}
                </span>
                <span
                  className="h-3 w-3 shrink-0 bg-brand-acid"
                  aria-hidden="true"
                />
              </figcaption>
            </div>
          </figure>

          <dl className="flex min-w-0 flex-col gap-4 border-y border-foreground py-5 sm:flex-row sm:gap-0 lg:col-span-7">
            {facts.map(([label, value], index) => (
              <div
                key={label}
                className={`min-w-0 sm:px-4 sm:first:pl-0 sm:last:pr-0 ${FACT_WIDTHS[index]} ${index > 0 ? "sm:border-l sm:border-border" : ""}`}
              >
                <dt className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <span className="mr-2 tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{label}</span>
                </dt>
                <dd className="mt-2 min-w-0 break-words text-sm font-semibold leading-relaxed text-foreground [overflow-wrap:anywhere]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <CredibilityLogos locale={locale} />
      <CareerTimeline locale={locale} />
      <Credentials locale={locale} />

      <section
        id="redaktion"
        className="border-t border-border bg-paper py-10"
        aria-labelledby="editorial-heading"
        data-editorial-manifesto
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

          <ol className="mt-8 grid gap-3">
            {copy.editorial.policies.map((policy, index) => (
              <li
                key={policy.title}
                className={`group relative grid min-w-0 gap-4 border-t border-foreground p-5 sm:grid-cols-[3rem_minmax(12rem,0.52fr)_minmax(0,1fr)] sm:items-start sm:p-6 ${POLICY_STYLES[index]}`}
              >
                <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="max-w-[18ch] break-words text-xl font-bold tracking-[-0.025em] text-foreground [overflow-wrap:anywhere]">
                  {policy.title}
                </h3>
                <p className="break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {policy.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-6 flex min-w-0 flex-wrap items-center justify-between gap-3 border-l-[3px] border-foreground bg-brand-lilac/45 px-4 py-3 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            <span>{copy.editorial.guidePrefix}</span>
            <a
              href={CONTENT_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 bg-paper px-3 font-mono text-xs font-bold text-foreground ring-1 ring-foreground/30 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
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
        className="relative isolate overflow-hidden border-t border-border bg-brand-acid/30 py-10"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(20rem,0.72fr)] lg:items-stretch lg:gap-8 lg:px-8">
          <div className="relative flex min-w-0 flex-col justify-between border-l-[3px] border-foreground pl-5">
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
            className="grid min-w-0 gap-3"
          >
            {contactLinks.map(
              ({ href, label, detail, Icon, external }, index) => (
                <a
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-label={external ? `${label}${newTabNotice}` : label}
                  className={`group grid min-h-24 min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-foreground shadow-card ring-1 ring-foreground/20 transition-[background-color,transform] hover:-rotate-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange motion-reduce:transform-none motion-reduce:transition-none ${CONTACT_STYLES[index]}`}
                  data-link-preview
                >
                  <span className="flex h-11 w-11 items-center justify-center bg-paper text-foreground ring-1 ring-foreground/30">
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
