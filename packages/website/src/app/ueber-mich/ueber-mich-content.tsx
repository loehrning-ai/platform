import Image from "next/image";
import Link from "next/link";
import { CareerTimeline } from "@/components/about/career-timeline";
import { Credentials } from "@/components/about/credentials";
import { PROFILE_CONTAINER } from "@/components/about/profile-container";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { Kicker } from "@/components/werk/kicker";
import { SectionHead } from "@/components/werk/section-head";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { LOEHRNING_LINKEDIN_URL, TIM_ENTITY } from "@/lib/seo/entity";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";

/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x": the row's destination as text. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(?:www\.)?/u, "").replace(/\/$/u, "");
}

/**
 * /ueber-mich in the Werkzeichnung grammar: one paper page, the portrait as
 * the only framed object, and every following section headed by a 2px ink
 * Kopflinie. Rows are separated by Leinen hairlines; nothing is tinted,
 * rotated, shadowed or boxed inside a box.
 *
 * Former employers are named in the lead and marked in the career ledger;
 * there is no separate logo band. Contact rows carry no icons: each row's
 * second line is its real destination, which is what tells them apart.
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
  // Labels name the channel and whose it is; brand names do not translate.
  const contactLinks = [
    {
      href: `mailto:${TIM_ENTITY.email}`,
      label: copy.contact.email,
      detail: TIM_ENTITY.email,
      external: false,
    },
    {
      href: TIM_ENTITY.linkedInUrl,
      label: "LinkedIn · Tim Löhr",
      detail: displayUrl(TIM_ENTITY.linkedInUrl),
      external: true,
    },
    {
      href: LOEHRNING_LINKEDIN_URL,
      label: "LinkedIn · loehrning.ai",
      detail: displayUrl(LOEHRNING_LINKEDIN_URL),
      external: true,
    },
    {
      href: TIM_ENTITY.personalGithubUrl,
      label: "GitHub · Tim Löhr",
      detail: displayUrl(TIM_ENTITY.personalGithubUrl),
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
          <div className="@container min-w-0 lg:col-span-7">
            <Kicker>{copy.hero.eyebrow}</Kicker>
            {/* The site's one display step for top-level H1s (SPEC §4):
                the poster title on paper, fit to its longest word, as /kurse. */}
            <h1
              className="poster-title mt-4 max-w-[16ch] text-foreground"
              style={posterTitleFallbackStyle(copy.hero.title)}
            >
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-[56ch] text-lead text-foreground text-pretty max-sm:text-[1.0625rem] max-sm:leading-relaxed">
              {copy.hero.intro}
            </p>
            {/* The platform facts are the home page's job; on a phone the
                header stops after the lead. */}
            <p className="mt-4 max-w-[64ch] text-body text-muted-foreground text-pretty max-sm:hidden">
              {copy.hero.detail}
            </p>

            <dl className="mt-8 grid border-y border-hairline sm:grid-cols-3">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 border-b border-hairline py-3 last:border-b-0 sm:border-b-0 sm:border-l sm:px-4 sm:py-4 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                >
                  <dt className="text-label text-muted-foreground">{label}</dt>
                  <dd className="mt-1 min-w-0 break-words text-body leading-snug text-foreground [overflow-wrap:anywhere]">
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
                className="absolute inset-0 h-full w-full object-cover object-[50%_30%] saturate-[0.4]"
              />
            </div>
          </figure>
        </div>
      </header>

      <CareerTimeline locale={locale} />
      <Credentials locale={locale} />

      <section
        id="kontakt"
        className="pt-8 pb-16 lg:pt-10 lg:pb-24"
        aria-labelledby="contact-heading"
      >
        <div className={PROFILE_CONTAINER}>
          <SectionHead
            id="contact-heading"
            title={copy.contact.title}
            description={copy.contact.intro}
            size="compact"
          />

          <nav
            aria-label={copy.contact.linksLabel}
            className="mt-6 grid min-w-0 border-t border-hairline sm:grid-cols-2 sm:gap-x-8"
          >
            {contactLinks.map(({ href, label, detail, external }) => (
              <a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={external ? `${label}${newTabNotice}` : label}
                className="group grid min-h-16 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline py-3 text-foreground transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none"
                data-link-preview
              >
                <span className="min-w-0">
                  <span className="block min-w-0 break-words text-[0.9375rem] font-semibold leading-snug underline decoration-transparent underline-offset-4 group-hover:decoration-current [overflow-wrap:anywhere]">
                    {label}
                  </span>
                  <span
                    translate="no"
                    className="block min-w-0 break-words text-caption text-muted-foreground [overflow-wrap:anywhere]"
                  >
                    {detail}
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
