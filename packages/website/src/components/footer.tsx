import Link from "next/link";
import { Github, Linkedin } from "@/components/icons/brand";
import { STAND_DATE, LAST_UPDATED } from "@/lib/content-meta";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { GITHUB_ORG, TIM_ENTITY } from "@/lib/seo/entity";
import { cx as cn } from "@/components/werk/cx";

type FooterLinkKey =
  | "allCourses"
  | "foundationPath"
  | "technicalCourses"
  | "aiCheck"
  | "learningBooks"
  | "workshops"
  | "appliedExamples"
  | "openSource"
  | "blog"
  | "aboutTim"
  | "help"
  | "feedback"
  | "imprint"
  | "privacy"
  | "licensePolicy";

type FooterGroupKey = "learning" | "practice" | "contact";

interface FooterCopy {
  readonly sectionLabel: string;
  readonly navigationLabel: string;
  readonly disclosureLabel: string;
  readonly groups: Readonly<Record<FooterGroupKey, string>>;
  readonly links: Readonly<Record<FooterLinkKey, string>>;
  readonly legalNavigationLabel: string;
  readonly githubLabel: string;
  readonly linkedInLabel: string;
  readonly opensNewTab: string;
  readonly contentDate: string;
  readonly lastUpdated: string;
  readonly homeLabel: string;
}

const FOOTER_COPY: Readonly<Record<Locale, FooterCopy>> = {
  de: {
    sectionLabel: "Freie Lernplattform",
    navigationLabel: "Navigation in der Fußzeile",
    disclosureLabel: "Alle Bereiche",
    groups: {
      learning: "Lernen",
      practice: "Praxis",
      contact: "Blog und Kontakt",
    },
    links: {
      allCourses: "Alle Kurse",
      foundationPath: "Grundlagenpfad",
      technicalCourses: "Technikkurse",
      aiCheck: "KI-Check",
      learningBooks: "Lernbücher",
      workshops: "Workshops",
      appliedExamples: "Praxisbeispiele",
      openSource: "Open Source",
      blog: "Blog",
      aboutTim: "Über mich",
      help: "Hilfe",
      feedback: "Rückmeldung",
      imprint: "Impressum",
      privacy: "Datenschutz",
      licensePolicy: "Lizenzrichtlinie",
    },
    legalNavigationLabel: "Rechtliche Informationen",
    githubLabel: "GitHub",
    linkedInLabel: "LinkedIn",
    opensNewTab: "öffnet in einem neuen Tab",
    contentDate: "Datenstand",
    lastUpdated: "Aktualisiert",
    homeLabel: "Startseite",
  },
  en: {
    sectionLabel: "Free learning platform",
    navigationLabel: "Footer navigation",
    disclosureLabel: "All sections",
    groups: {
      learning: "Learning",
      practice: "Practice",
      contact: "Blog and contact",
    },
    links: {
      allCourses: "All courses",
      foundationPath: "Foundation path",
      technicalCourses: "Technical courses",
      aiCheck: "AI check",
      learningBooks: "Learning books",
      workshops: "Workshops",
      appliedExamples: "Applied examples",
      openSource: "Open Source",
      blog: "Blog",
      aboutTim: "About me",
      help: "Help",
      feedback: "Feedback",
      imprint: "Legal notice",
      privacy: "Privacy",
      licensePolicy: "Licence policy",
    },
    legalNavigationLabel: "Legal information",
    githubLabel: "GitHub",
    linkedInLabel: "LinkedIn",
    opensNewTab: "opens in a new tab",
    contentDate: "Content date",
    lastUpdated: "Updated",
    homeLabel: "Home",
  },
};

// The same task groups as the header: "Lernen" and "Praxis" hold exactly
// what the header's two menus hold, and the last group is the header's direct
// links plus where you ask or reach a person. No heading repeats its only
// link.
const FOOTER_GROUPS: readonly {
  readonly id: FooterGroupKey;
  readonly links: readonly {
    readonly href: string;
    readonly key: FooterLinkKey;
  }[];
}[] = [
  {
    id: "learning",
    links: [
      { href: "/kurse", key: "allCourses" },
      { href: "/kurse#lernpfad", key: "foundationPath" },
      { href: "/kurse#tiefer-gehen", key: "technicalCourses" },
      { href: "/ki-check", key: "aiCheck" },
      { href: "/buecher", key: "learningBooks" },
    ],
  },
  {
    id: "practice",
    links: [
      { href: "/workshops", key: "workshops" },
      { href: "/demos", key: "appliedExamples" },
      { href: "/open-source", key: "openSource" },
    ],
  },
  {
    id: "contact",
    links: [
      { href: "/blog", key: "blog" },
      { href: "/ueber-mich", key: "aboutTim" },
      { href: "/hilfe", key: "help" },
      { href: "/feedback", key: "feedback" },
    ],
  },
] as const;

const LEGAL_LINKS: readonly {
  readonly href: string;
  readonly key: FooterLinkKey;
}[] = [
  { href: "/impressum", key: "imprint" },
  { href: "/datenschutz", key: "privacy" },
  { href: "/open-source/lizenzrichtlinie", key: "licensePolicy" },
] as const;

const INTERNAL_LINK_CLASS =
  "inline-flex min-h-11 min-w-11 max-w-full items-center break-words py-2 text-sm leading-snug text-muted-foreground underline decoration-transparent underline-offset-4 outline-none transition-colors duration-[120ms] hover:text-foreground hover:decoration-current focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

// Square outline controls on graphit. The dark-section border token (about
// 3.52:1) is a valid control edge; the hover is a tone step, never a lift.
// Below sm they are 44px icon squares on the wordmark's row; the accessible
// name comes from aria-label, and the word returns from sm.
const EXTERNAL_LINK_CLASS =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-border py-2 text-sm font-medium text-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:px-3";

// Below lg the three link columns are twelve 44px targets stacked two abreast,
// roughly 450px of footer before the legal row even starts, so they live
// inside a native <details>. On a phone the closed footer is then four rows:
// wordmark with the two profile squares, the disclosure, the legal links and
// one caption. The element owns its open state, which means the
// disclosure works with scripting disabled and nothing flips at hydration.
//
// From lg the same markup has to render as the plain column grid it was
// before, down to the pixel. ::details-content is the only handle CSS has on a
// closed <details> (the old `details:not([open]) > *` override reveals nothing
// in any current engine), so the desktop rule lifts the user-agent
// content-visibility on that pseudo-element and lets the grid lay out
// normally. The summary is hidden only where that pseudo-element is actually
// supported: an engine without it keeps a working summary at every width
// instead of a column grid nothing can open.
const GROUP_DISCLOSURE_CLASS =
  "group min-w-0 lg:[&::details-content]:[block-size:auto] lg:[&::details-content]:[content-visibility:visible]";

const GROUP_SUMMARY_CLASS =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-t border-hairline py-2 text-label text-foreground outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none [&::-webkit-details-marker]:hidden lg:supports-[selector(::details-content)]:hidden";

export async function Footer() {
  const locale = await getRequestLocale();
  const copy = FOOTER_COPY[locale];
  // Static output stays reproducible. The reviewed content date, not the wall
  // clock, determines the public copyright year.
  const year = LAST_UPDATED.slice(0, 4);

  return (
    // A graphit band in normal flow, set in Butter (plakat-footer, 15.78:1):
    // no decoration, no wash, no shapes. The solid #141414 keeps every text
    // token resolvable for axe; structure comes from hairlines only. The ring
    // stays the graphit #e07050 (5.79:1).
    <footer className="dark-section plakat-footer">
      {/* The 75rem page container: with sm:px-6 the content runs 144..1296 at
          1440, the same column as the header's wordmark and Login edge. */}
      <div className="mx-auto w-full max-w-[75rem] px-4 py-6 sm:px-6 sm:py-12">
        <div className="grid min-w-0 gap-2 border-b border-hairline sm:gap-6 sm:pb-8 lg:grid-cols-[minmax(13rem,0.55fr)_minmax(0,2fr)] lg:gap-8">
          {/* From lg the brand column starts on the same hairline as the link
              groups, so the whole row hangs from one continuous rule. Below
              sm it is a single row: the wordmark, then the profile squares
              at the right edge, and the kicker stays for wider screens. */}
          <div className="flex min-w-0 items-center justify-between gap-3 sm:block lg:border-t lg:border-hairline lg:pt-3">
            <p className="hidden text-label text-muted-foreground sm:block">
              {copy.sectionLabel}
            </p>
            <Link
              href={localizeHref("/", locale)}
              prefetch={false}
              className="inline-flex min-h-11 max-w-full items-center py-1 text-xl font-bold leading-none tracking-[-0.015em] text-foreground underline decoration-transparent underline-offset-4 outline-none transition-colors duration-[120ms] hover:decoration-current focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none sm:mt-1 sm:text-[2rem]"
              aria-label={`loehrning.ai - ${copy.homeLabel}`}
              translate="no"
            >
              loehrning.ai
            </Link>

            <div className="flex shrink-0 gap-2 sm:mt-3 sm:flex-wrap">
              <a
                href={GITHUB_ORG.url}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL_LINK_CLASS}
                aria-label={`${copy.githubLabel} (${copy.opensNewTab})`}
                translate="no"
              >
                <Github size={17} aria-hidden="true" />
                <span className="hidden sm:inline">{copy.githubLabel}</span>
                <span className="sr-only"> ({copy.opensNewTab})</span>
              </a>
              <a
                href={TIM_ENTITY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL_LINK_CLASS}
                aria-label={`${copy.linkedInLabel} (${copy.opensNewTab})`}
                translate="no"
              >
                <Linkedin size={17} aria-hidden="true" />
                <span className="hidden sm:inline">{copy.linkedInLabel}</span>
                <span className="sr-only"> ({copy.opensNewTab})</span>
              </a>
            </div>
          </div>

          <nav aria-label={copy.navigationLabel} className="min-w-0">
            <details
              data-testid="footer-group-disclosure"
              className={GROUP_DISCLOSURE_CLASS}
            >
              <summary className={GROUP_SUMMARY_CLASS}>
                <span>{copy.disclosureLabel}</span>
                {/* The glyph swaps with the native open state: + closed,
                    − open. No rotation, no script. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none group-open:hidden"
                >
                  +
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-lg leading-none group-open:inline"
                >
                  {"\u2212"}
                </span>
              </summary>
              {/* Open on a phone: Lernen and Praxis side by side, and the
                  three contact links as one row under them, so the open
                  footer stays near one screen. From sm the columns are the
                  ones they always were. */}
              <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 pb-2 sm:gap-y-6 sm:pb-0 sm:pt-4 md:grid-cols-3 md:gap-x-6 lg:pt-0">
                {FOOTER_GROUPS.map((group) => (
                  <section
                    key={group.id}
                    className={cn(
                      "min-w-0 border-t border-hairline pt-2 sm:pt-3",
                      group.id === "contact" && "col-span-2 sm:col-span-1",
                    )}
                  >
                    <h2 className="text-label text-foreground">
                      {copy.groups[group.id]}
                    </h2>
                    <ul
                      className={cn(
                        "sm:mt-1",
                        group.id === "contact" &&
                          "flex flex-wrap gap-x-4 sm:block",
                      )}
                    >
                      {group.links.map((link, index) => (
                        <li key={link.href} className="min-w-0">
                          <Link
                            href={localizeHref(link.href, locale)}
                            prefetch={false}
                            className={cn(
                              INTERNAL_LINK_CLASS,
                              // In the phone row a short word ("Hilfe") sits
                              // in the middle of its 44px box, so the gaps
                              // read even; the first word and every word in
                              // a column start on the edge.
                              group.id === "contact" &&
                                index > 0 &&
                                "justify-center sm:justify-start",
                            )}
                          >
                            {copy.links[link.key]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </details>
          </nav>
        </div>

        <div className="pt-1 sm:pt-4">
          <nav
            aria-label={copy.legalNavigationLabel}
            className="flex min-w-0 flex-wrap gap-x-5 gap-y-1"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={localizeHref(link.href, locale)}
                prefetch={false}
                className={INTERNAL_LINK_CLASS}
              >
                {copy.links[link.key]}
              </Link>
            ))}
          </nav>

          {/* One caption line on a phone: the copyright holder and the
              content date. The domain (the wordmark says it two rows up) and
              the second date return from sm, where the caption is two lines
              again, and from md the two ends of one row. */}
          <div className="mt-1 flex min-w-0 flex-wrap gap-x-5 gap-y-1 border-t border-hairline pt-3 text-caption text-muted-foreground sm:mt-3 sm:flex-col sm:flex-nowrap sm:gap-2 md:flex-row md:items-end md:justify-between">
            <span data-testid="footer-copyright" className="break-words">
              &copy; {year}{" "}
              <span className="hidden sm:inline">
                <span translate="no">loehrning.ai</span> ·{" "}
              </span>
              Tim Löhr
            </span>
            <span
              data-testid="footer-data-pill"
              className="contents sm:flex sm:min-w-0 sm:flex-wrap sm:gap-x-5 sm:gap-y-1"
            >
              {/* Sentence-case labels. "Q3 2026" is a label and stays in the
                  site face; mono is only for the ISO date, which is data. */}
              <span className="whitespace-nowrap">
                {`${copy.contentDate}: `}
                <span className="tabular-nums">{STAND_DATE}</span>
              </span>
              <span className="hidden whitespace-nowrap sm:inline">
                {`${copy.lastUpdated}: `}
                <time dateTime={LAST_UPDATED} className="font-ui-mono tabular-nums">
                  {LAST_UPDATED}
                </time>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
