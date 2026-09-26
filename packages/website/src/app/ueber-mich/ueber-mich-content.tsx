import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Github, Linkedin } from "@/components/icons/brand";
import { CareerTimeline } from "@/components/about/career-timeline";
import { CredibilityLogos } from "@/components/about/credibility-logos";
import { Credentials } from "@/components/about/credentials";
import { PROFILE_CONTAINER } from "@/components/about/profile-container";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { Kicker } from "@/components/werk/kicker";
import { SectionHead } from "@/components/werk/section-head";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { LOEHRNING_LINKEDIN_URL, TIM_ENTITY } from "@/lib/seo/entity";


/**
 * /ueber-mich in the Werkzeichnung grammar: one paper page, the portrait as
 * the only framed object, and every following section headed by a 2px ink
 * Kopflinie. Rows are separated by Leinen hairlines; nothing is tinted,
 * rotated, shadowed or boxed inside a box.
 */
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
      href: LOEHRNING_LINKEDIN_URL,
      label: copy.contact.linkedInCompany,
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
      <header className="pt-10 pb-10 sm:pt-14 lg:pb-14">
        <div
          className={`${PROFILE_CONTAINER} grid gap-8 lg:grid-cols-12 lg:gap-x-12`}
          data-profile-editorial-spread
        >
          <div className="min-w-0 lg:col-span-7">
            <Kicker>{copy.hero.eyebrow}</Kicker>
            <h1 className="mt-4 max-w-[18ch] break-words text-fluid-h1 font-bold text-foreground text-pretty [overflow-wrap:anywhere]">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-[56ch] text-lead text-foreground text-pretty max-sm:text-[1.0625rem] max-sm:leading-relaxed">
              {copy.hero.intro}
            </p>
            <p className="mt-4 max-w-[64ch] text-body text-muted-foreground text-pretty max-sm:text-[0.9375rem]">
              {copy.hero.detail}
            </p>

            <dl className="mt-8 grid border-y border-hairline sm:grid-cols-[0.8fr_1.4fr_1fr]">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 border-b border-hairline py-3 last:border-b-0 sm:border-b-0 sm:border-l sm:px-4 sm:py-4 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                >
                  <dt className="text-label text-muted-foreground">{label}</dt>
                  <dd className="mt-1 min-w-0 break-words text-[0.9375rem] font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="min-w-0 max-lg:max-w-[26rem] lg:col-span-5 lg:pt-2">
            <div className="relative aspect-square overflow-hidden border border-foreground bg-card max-lg:aspect-[4/3]">
              <Image
                src={TIM_ENTITY.portraitPath}
                alt={copy.metadata.portraitAlt}
                width={800}
                height={800}
                priority
                sizes="(min-width: 1024px) 28rem, (min-width: 640px) 26rem, calc(100vw - 2rem)"
                className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
              />
            </div>
            <figcaption
              translate="no"
              className="mt-2 text-caption text-muted-foreground"
            >
              {copy.hero.portraitCaption}
            </figcaption>
          </figure>
        </div>
      </header>

      <CredibilityLogos locale={locale} />
      <CareerTimeline locale={locale} />
      <Credentials locale={locale} />

      <section
        id="kontakt"
        className="pt-10 pb-16 lg:pt-14 lg:pb-24"
        aria-labelledby="contact-heading"
      >
        <div className={PROFILE_CONTAINER}>
          <SectionHead
            id="contact-heading"
            title={copy.contact.title}
            caption={copy.contact.eyebrow}
            description={copy.contact.intro}
            size="compact"
          />

          <nav
            aria-label={copy.contact.linksLabel}
            className="mt-6 grid min-w-0 border-t border-hairline sm:grid-cols-2 sm:gap-x-8"
          >
            {contactLinks.map(({ href, label, detail, Icon, external }) => (
              <a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={external ? `${label}${newTabNotice}` : label}
                className="group grid min-h-16 min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline py-3 text-foreground transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none"
                data-link-preview
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-caption text-muted-foreground">
                    {detail}
                  </span>
                  <span className="block min-w-0 break-words text-[0.9375rem] font-semibold leading-snug underline decoration-transparent underline-offset-4 group-hover:decoration-current [overflow-wrap:anywhere]">
                    {label}
                  </span>
                </span>
                <ArrowGlyph
                  direction={external ? "external" : "right"}
                  className="mr-1"
                />
              </a>
            ))}
          </nav>

          <p className="mt-6 max-w-[64ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
            {copy.contact.feedbackPrefix}{" "}
            <Link
              href={localizeHref("/feedback", locale)}
              className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              {copy.contact.feedbackLabel}
            </Link>
            .
          </p>
        </div>
      </section>
    </article>
  );
}
