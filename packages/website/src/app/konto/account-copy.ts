import type { Locale } from "@/lib/i18n/locale";

export interface AccountPageCopy {
  readonly metadata: { readonly title: string; readonly description: string };
  readonly eyebrow: string;
  readonly title: string;
  readonly signedIn: (identity: string) => string;
  readonly localIdentity: string;
  readonly logout: string;
  readonly unavailableTitle: string;
  readonly unavailableBody: string;
  readonly coursesCompleted: string;
  readonly competenciesEarned: string;
  readonly lastSynchronized: string;
  readonly noSavedProgress: string;
  readonly continueLabel: string;
  readonly resume: string;
  readonly start: string;
  readonly statusLabel: string;
  readonly allComplete: string;
  readonly booksLink: string;
  readonly coursesHeading: string;
  readonly recordEarned: string;
  readonly lessonProgress: (
    done: number,
    total: number,
    percent: number,
  ) => string;
  readonly progressAria: (title: string) => string;
  readonly viewRecord: string;
  readonly competenciesHeading: string;
  readonly competencyCount: (earned: number, total: number) => string;
  readonly competencySource: (course: string) => string;
  readonly noCompetencies: string;
  readonly competencyBoundary: string;
  readonly deepenHeading: string;
  readonly resources: readonly {
    readonly key: "books" | "demos";
    readonly title: string;
    readonly body: string;
    readonly href: string;
  }[];
  readonly localDataHeading: string;
  readonly localDataBody: string;
  readonly privacyLink: string;
  readonly privacySummary: string;
}

export const ACCOUNT_COPY = {
  de: {
    metadata: {
      title: "Konto | Freie Lernplattform",
      description:
        "Konto, Kursfortschritt und Kompetenzen der freien KI-Lernplattform.",
    },
    eyebrow: "Freie Lernplattform · Konto",
    title: "Dein Lernstand.",
    signedIn: (identity) =>
      `Angemeldet als ${identity}. Dein Fortschritt wird lokal gespeichert und nach der Anmeldung geräteübergreifend synchronisiert.`,
    localIdentity: "lokaler Zugriff ohne Konto",
    logout: "Abmelden",
    unavailableTitle: "Dein Lernstand ist gerade nicht erreichbar.",
    unavailableBody:
      "Die Seite zeigt deshalb keinen vermeintlich leeren Fortschritt. Dein lokaler Lernstand bleibt im Browser erhalten.",
    coursesCompleted: "Kurse abgeschlossen",
    competenciesEarned: "Kompetenzen erreicht",
    lastSynchronized: "Zuletzt synchronisiert",
    noSavedProgress: "noch kein gespeicherter Lernstand",
    continueLabel: "Weiter lernen",
    resume: "Weiterlernen",
    start: "Starten",
    statusLabel: "Kursstatus",
    allComplete:
      "Alle verfügbaren Kursnachweise sind erreicht. Die Lernbücher dienen zur Vertiefung und zum Nachschlagen.",
    booksLink: "Zu den Büchern",
    coursesHeading: "Deine Kurse",
    recordEarned: "Nachweis erreicht",
    lessonProgress: (done, total, percent) =>
      `${done}/${total} Lektionen · ${percent}%`,
    progressAria: (title) => `Fortschritt ${title}`,
    viewRecord: "Nachweis ansehen",
    competenciesHeading: "Deine Kompetenzen",
    competencyCount: (earned, total) => `${earned} von ${total} erreicht`,
    competencySource: (course) => `aus ${course}`,
    noCompetencies:
      "Noch keine Kompetenzen erreicht. Sie erscheinen hier, sobald der zugehörige Kursnachweis erreicht ist.",
    competencyBoundary:
      "Diese Einträge beruhen auf abgeschlossenen Kursen. Sie dokumentieren den Lernweg und sind keine akkreditierten Qualifikationen.",
    deepenHeading: "Weiter vertiefen",
    resources: [
      {
        key: "books",
        title: "Lernbücher",
        body: "Lesefassungen zum Nachschlagen.",
        href: "/buecher",
      },
      {
        key: "demos",
        title: "Praxisbeispiele",
        body: "Interaktive Beispiele zum Prüfen einzelner Abläufe.",
        href: "/demos",
      },
    ],
    localDataHeading: "XP, Abzeichen und Lernserien",
    localDataBody:
      "Ohne Anmeldung bleiben Kursfortschritt, XP, Abzeichen, Lernserien und Checkpoints in diesem Browser. Mit Lernkonto werden sie dem verifizierten Konto zugeordnet und geräteübergreifend synchronisiert. Diese Werte haben keinen offiziellen Nachweiswert.",
    privacyLink: "Datenschutz und Datenverwaltung",
    privacySummary: "Export, Kursfortschritt zurücksetzen und Konto löschen.",
  },
  en: {
    metadata: {
      title: "Account | Free learning platform",
      description:
        "Account, course progress, and earned competencies on the open AI learning platform.",
    },
    eyebrow: "Free learning platform · Account",
    title: "Your learning record.",
    signedIn: (identity) =>
      `Signed in as ${identity}. Progress is stored locally and synchronised across devices after sign-in.`,
    localIdentity: "local access without an account",
    logout: "Sign out",
    unavailableTitle: "Your learning record is temporarily unavailable.",
    unavailableBody:
      "The page does not substitute an empty record. Progress stored in this browser remains unchanged.",
    coursesCompleted: "Courses completed",
    competenciesEarned: "Competencies earned",
    lastSynchronized: "Last synchronised",
    noSavedProgress: "no saved learning record",
    continueLabel: "Continue learning",
    resume: "Continue",
    start: "Start",
    statusLabel: "Course status",
    allComplete:
      "Every available course record has been earned. The learning books provide reference material for further study.",
    booksLink: "Open books",
    coursesHeading: "Your courses",
    recordEarned: "Record earned",
    lessonProgress: (done, total, percent) =>
      `${done}/${total} lessons · ${percent}%`,
    progressAria: (title) => `Progress in ${title}`,
    viewRecord: "View record",
    competenciesHeading: "Your competencies",
    competencyCount: (earned, total) => `${earned} of ${total} earned`,
    competencySource: (course) => `from ${course}`,
    noCompetencies:
      "No competencies earned yet. An entry appears after the corresponding course record has been earned.",
    competencyBoundary:
      "These entries are based on completed courses. They document a learning path and are not accredited qualifications.",
    deepenHeading: "Reference material",
    resources: [
      {
        key: "books",
        title: "Learning books",
        body: "Long-form reference material.",
        href: "/buecher",
      },
      {
        key: "demos",
        title: "Applied examples",
        body: "Interactive examples for examining individual workflows.",
        href: "/demos",
      },
    ],
    localDataHeading: "XP, badges, and learning streaks",
    localDataBody:
      "Without sign-in, course progress, XP, badges, learning streaks, and checkpoints remain in this browser. With a learning account, they are assigned to the verified account and synchronised across devices. These values are not an official qualification.",
    privacyLink: "Privacy and data controls",
    privacySummary:
      "Export data, reset course progress, and delete the account.",
  },
} as const satisfies Readonly<Record<Locale, AccountPageCopy>>;
