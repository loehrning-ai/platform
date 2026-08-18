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
  | "howAiWorks"
  | "blog"
  | "knownLimits"
  | "aboutPlatform"
  | "aboutTim"
  | "help"
  | "feedback"
  | "imprint"
  | "privacy"
  | "licensePolicy";

type FooterGroupKey = "courses" | "practice" | "knowledge" | "platform";

interface FooterCopy {
  readonly sectionLabel: string;
  readonly description: string;
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
    description:
      "Freie Kurse, Workshops und quelloffene Materialien zu KI und Datenarbeit. Kursseiten nennen Umfang, Zugang und Quellen.",
    navigationLabel: "Navigation in der Fußzeile",
    groups: {
      courses: "Kurse",
      practice: "Praxis",
      knowledge: "Wissen",
      platform: "Plattform",
    },
    links: {
      allCourses: "Alle Kurse",
      foundationPath: "Grundlagenpfad",
      technicalCourses: "Technikkurse",
      learningBooks: "Lernbücher",
      workshops: "Workshops",
      appliedExamples: "Praxisbeispiele",
      openSource: "Open Source",
      howAiWorks: "Wie KI funktioniert",
      blog: "Blog",
      knownLimits: "Bekannte Grenzen",
      aboutPlatform: "Über die Plattform",
      aboutTim: "Über Tim Löhr",
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
    description:
      "Free courses, workshops, and open-source materials for AI and data work. Course pages state scope, access requirements, and sources.",
    navigationLabel: "Footer navigation",
    groups: {
      courses: "Courses",
      practice: "Practice",
      knowledge: "Knowledge",
      platform: "Platform",
    },
    links: {
      allCourses: "All courses",
      foundationPath: "Foundation path",
      technicalCourses: "Technical courses",
      learningBooks: "Learning books",
      workshops: "Workshops",
      appliedExamples: "Applied examples",
      openSource: "Open Source",
      howAiWorks: "How AI works",
      blog: "Blog",
      knownLimits: "Known limits",
      aboutPlatform: "About the platform",
      aboutTim: "About Tim Löhr",
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
  readonly links: readonly { readonly href: string; readonly key: FooterLinkKey }[];
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
    id: "knowledge",
    links: [
      { href: "/wie-ki-funktioniert", key: "howAiWorks" },
      { href: "/blog", key: "blog" },
      { href: "/bekannte-grenzen", key: "knownLimits" },
    ],
  },
  {
    id: "platform",
    links: [
      { href: "/ueber-die-plattform", key: "aboutPlatform" },
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
  "inline-flex min-h-11 max-w-full items-center break-words py-2 text-sm leading-snug text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EXTERNAL_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-2 border border-border px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:border-brand-orange hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export async function Footer() {
  const locale = await getRequestLocale();
  const copy = FOOTER_COPY[locale];
  // Static output stays reproducible. The reviewed content date, not the wall
  // clock, determines the public copyright year.
  const year = LAST_UPDATED.slice(0, 4);

  return (
    <footer className="dark-section relative isolate overflow-hidden border-t border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-dark opacity-40"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,2fr)] lg:gap-16">
          <div className="min-w-0 lg:border-r lg:border-border lg:pr-12">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.sectionLabel}
            </p>
            <Link
              href={localizeHref("/", locale)}
              prefetch={false}
              className="mt-4 inline-flex min-h-11 max-w-full items-center py-1 text-[2rem] font-bold leading-none tracking-[-0.04em] text-foreground outline-none transition-colors hover:text-brand-orange focus-visible:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-[2.5rem]"
              aria-label={`loehrning.ai - ${copy.homeLabel}`}
              translate="no"
            >
              loehrning<span className="text-brand-orange">.ai</span>
            </Link>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {copy.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
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
            <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-8">
              {FOOTER_GROUPS.map((group, index) => (
                <section key={group.id} className="min-w-0">
                  <p
                    aria-hidden="true"
                    className="font-mono text-[10px] font-bold tabular-nums tracking-[0.12em] text-brand-orange"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-sm font-semibold text-foreground">
                    {copy.groups[group.id]}
                  </h2>
                  <ul className="mt-3">
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

        <div className="mt-12 border-t border-border pt-6 sm:mt-16">
          <nav
            aria-label={copy.legalNavigationLabel}
            className="flex min-w-0 flex-wrap gap-x-6 gap-y-1"
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

          <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-end md:justify-between">
            <span data-testid="footer-copyright" className="break-words">
              &copy; {year} <span translate="no">loehrning.ai</span> · Tim Löhr
            </span>
            <span
              data-testid="footer-data-pill"
              className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em]"
            >
              <span className="whitespace-nowrap">
                {copy.contentDate}: {STAND_DATE}
              </span>
              <span className="whitespace-nowrap">
                {`${copy.lastUpdated}: `}<time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
