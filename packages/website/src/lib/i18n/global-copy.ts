import type { Locale } from "./locale";

export interface GlobalNavigationCopy {
  readonly skipToContent: string;
  readonly mainNavigation: string;
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
  readonly knowledge: string;
  readonly allCourses: string;
  readonly foundations: string;
  readonly technicalCourses: string;
  readonly aiCheck: string;
  readonly learningBooks: string;
  readonly workshops: string;
  readonly appliedExamples: string;
  readonly howAiWorks: string;
  readonly blog: string;
  readonly knownLimits: string;
  readonly aboutPlatform: string;
  readonly aboutTim: string;
  readonly openSource: string;
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
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    home: "Startseite",
    language: "Sprache",
    german: "Deutsch",
    english: "Englisch",
    switchToGerman: "Deutsche Oberfläche öffnen",
    switchToEnglish: "Englische Oberfläche öffnen",
    learning: "Lernen",
    practice: "Praxis",
    knowledge: "Wissen",
    allCourses: "Alle Kurse",
    foundations: "Grundlagenpfad",
    technicalCourses: "Technikkurse",
    aiCheck: "KI-Check",
    learningBooks: "Lernbücher",
    workshops: "Workshops",
    appliedExamples: "Praxisbeispiele",
    howAiWorks: "Wie KI funktioniert",
    blog: "Blog",
    knownLimits: "Bekannte Grenzen",
    aboutPlatform: "Über die Plattform",
    aboutTim: "Über Tim Löhr",
    openSource: "Open Source",
    account: "Konto",
    login: "Login",
    githubOrganisation: "loehrning-ai auf GitHub",
  },
  en: {
    skipToContent: "Skip to content",
    mainNavigation: "Primary navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "Home",
    language: "Language",
    german: "German",
    english: "English",
    switchToGerman: "Open the German interface",
    switchToEnglish: "Open the English interface",
    learning: "Learning",
    practice: "Practice",
    knowledge: "Knowledge",
    allCourses: "All courses",
    foundations: "Foundations",
    technicalCourses: "Technical courses",
    aiCheck: "AI check",
    learningBooks: "Learning books",
    workshops: "Workshops",
    appliedExamples: "Applied examples",
    howAiWorks: "How AI works",
    blog: "Blog",
    knownLimits: "Known limits",
    aboutPlatform: "About the platform",
    aboutTim: "About Tim Löhr",
    openSource: "Open Source",
    account: "Account",
    login: "Login",
    githubOrganisation: "loehrning-ai on GitHub",
  },
};
