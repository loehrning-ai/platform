import Link from "next/link";
import { Github, Linkedin } from "@/components/icons/brand";
import { STAND_DATE, LAST_UPDATED } from "@/lib/content-meta";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { GITHUB_ORG, TIM_ENTITY } from "@/lib/seo/entity";

type FooterLinkKey =
  | "allCourses"
  | "foundationPath"
  | "technicalCourses"
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

type FooterGroupKey = "courses" | "practice" | "blog" | "about";

interface FooterCopy {
  readonly sectionLabel: string;
  readonly navigationLabel: string;
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
    groups: {
      courses: "Kurse",
      practice: "Praxis",
      blog: "Blog",
      about: "Über mich",
    },
    links: {
      allCourses: "Alle Kurse",
      foundationPath: "Grundlagenpfad",
      technicalCourses: "Technikkurse",
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
    groups: {
      courses: "Courses",
      practice: "Practice",
      blog: "Blog",
      about: "About me",
    },
    links: {
      allCourses: "All courses",
      foundationPath: "Foundation path",
      technicalCourses: "Technical courses",
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

const FOOTER_GROUPS: readonly {
  readonly id: FooterGroupKey;
  readonly links: readonly {
    readonly href: string;
    readonly key: FooterLinkKey;
  }[];
}[] = [
  {
    id: "courses",
    links: [
      { href: "/kurse", key: "allCourses" },
      { href: "/kurse#lernpfad", key: "foundationPath" },
      { href: "/kurse#tiefer-gehen", key: "technicalCourses" },
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
    id: "blog",
    links: [{ href: "/blog", key: "blog" }],
  },
  {
    id: "about",
    links: [
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
  "inline-flex min-h-11 min-w-11 max-w-full items-center break-words py-2 text-sm leading-snug text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

const EXTERNAL_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-2 border border-border px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-[border-color,color] duration-150 hover:border-brand-orange hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

export async function Footer() {
  const locale = await getRequestLocale();
  const copy = FOOTER_COPY[locale];
  // Static output stays reproducible. The reviewed content date, not the wall
  // clock, determines the public copyright year.
  const year = LAST_UPDATED.slice(0, 4);

  return (
    <footer className="dark-section border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid min-w-0 gap-6 border-b border-border pb-6 lg:grid-cols-[minmax(13rem,0.55fr)_minmax(0,2fr)] lg:gap-8">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
              {copy.sectionLabel}
            </p>
            <Link
              href={localizeHref("/", locale)}
              prefetch={false}
              className="mt-1 inline-flex min-h-11 max-w-full items-center py-1 text-[1.75rem] font-bold leading-none tracking-[-0.04em] text-foreground outline-none transition-colors duration-150 hover:text-brand-orange focus-visible:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none sm:text-[2rem]"
              aria-label={`loehrning.ai - ${copy.homeLabel}`}
              translate="no"
            >
              loehrning<span className="text-brand-orange">.ai</span>
            </Link>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={GITHUB_ORG.url}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL_LINK_CLASS}
                aria-label={`${copy.githubLabel} (${copy.opensNewTab})`}
                translate="no"
              >
                <Github size={17} aria-hidden="true" />
                <span>{copy.githubLabel}</span>
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
                <span>{copy.linkedInLabel}</span>
                <span className="sr-only"> ({copy.opensNewTab})</span>
              </a>
            </div>
          </div>

          <nav aria-label={copy.navigationLabel} className="min-w-0">
            <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6">
              {FOOTER_GROUPS.map((group) => (
                <section
                  key={group.id}
                  className="min-w-0 border-t border-border pt-3"
                >
                  <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                    {copy.groups[group.id]}
                  </h2>
                  <ul className="mt-1">
                    {group.links.map((link) => (
                      <li key={link.href} className="min-w-0">
                        <Link
                          href={localizeHref(link.href, locale)}
                          prefetch={false}
                          className={INTERNAL_LINK_CLASS}
                        >
                          {copy.links[link.key]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
        </div>

        <div className="pt-4">
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

          <div className="mt-3 flex min-w-0 flex-col gap-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-end md:justify-between">
            <span data-testid="footer-copyright" className="break-words">
              &copy; {year} <span translate="no">loehrning.ai</span> · Tim Löhr
            </span>
            <span
              data-testid="footer-data-pill"
              className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.08em]"
            >
              <span className="whitespace-nowrap">
                {copy.contentDate}: {STAND_DATE}
              </span>
              <span className="whitespace-nowrap">
                {`${copy.lastUpdated}: `}
                <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
