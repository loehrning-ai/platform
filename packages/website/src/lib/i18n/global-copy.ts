import type { Locale } from "./locale";

export interface GlobalNavigationCopy {
  readonly skipToContent: string;
  readonly mainNavigation: string;
  /** Accessible name of the mobile companion tab bar, the second nav landmark. */
  readonly quickNavigation: string;
  readonly openMenu: string;
  readonly closeMenu: string;
  readonly home: string;
  readonly language: string;
  readonly german: string;
  readonly english: string;
  readonly switchToGerman: string;
  readonly switchToEnglish: string;
  readonly learning: string;
  readonly practice: string;
  readonly allCourses: string;
  readonly foundations: string;
  readonly technicalCourses: string;
  readonly aiCheck: string;
  readonly learningBooks: string;
  readonly workshops: string;
  readonly appliedExamples: string;
  readonly blog: string;
  readonly aboutTim: string;
  readonly openSource: string;
  /**
   * Tab-bar labels. Short by contract: each one has a quarter of a 320px
   * viewport, which `home` ("Startseite") does not fit. The two middle tabs
   * reuse the group labels `learning` and `practice`, so the bar names the
   * same groups as the header; `account` is the fourth tab label and is
   * shared.
   */
  readonly start: string;
  readonly account: string;
  readonly login: string;
  readonly githubOrganisation: string;
}

export const GLOBAL_NAVIGATION_COPY: Readonly<
  Record<Locale, GlobalNavigationCopy>
> = {
  de: {
    skipToContent: "Zum Inhalt springen",
    mainNavigation: "Hauptnavigation",
    quickNavigation: "Schnellnavigation",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    home: "Startseite",
    language: "Sprache",
    german: "Deutsch",
    english: "Englisch",
    switchToGerman: "DE, Deutsche Oberfläche öffnen",
    switchToEnglish: "EN, Englische Oberfläche öffnen",
    learning: "Lernen",
    practice: "Praxis",
    allCourses: "Alle Kurse",
    foundations: "Grundlagenpfad",
    technicalCourses: "Technikkurse",
    aiCheck: "KI-Check",
    learningBooks: "Lernbücher",
    workshops: "Workshops",
    appliedExamples: "Praxisbeispiele",
    blog: "Blog",
    aboutTim: "Über mich",
    openSource: "Open Source",
    start: "Start",
    account: "Konto",
    login: "Anmelden",
    githubOrganisation: "loehrning-ai auf GitHub",
  },
  en: {
    skipToContent: "Skip to content",
    mainNavigation: "Primary navigation",
    quickNavigation: "Quick navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "Home",
    language: "Language",
    german: "German",
    english: "English",
    switchToGerman: "DE, open the German interface",
    switchToEnglish: "EN, open the English interface",
    learning: "Learning",
    practice: "Practice",
    allCourses: "All courses",
    foundations: "Foundations",
    technicalCourses: "Technical courses",
    aiCheck: "AI check",
    learningBooks: "Learning books",
    workshops: "Workshops",
    appliedExamples: "Applied examples",
    blog: "Blog",
    aboutTim: "About me",
    openSource: "Open Source",
    start: "Home",
    account: "Account",
    login: "Login",
    githubOrganisation: "loehrning-ai on GitHub",
  },
};
