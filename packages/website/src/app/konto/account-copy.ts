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
  readonly authUnavailableIdentity: string;
  readonly authUnavailableTitle: string;
  readonly authUnavailableBody: string;
  readonly coursesCompleted: string;
  readonly outcomesCovered: string;
  readonly lastSynchronized: string;
  readonly noSavedProgress: string;
  readonly continueLabel: string;
  readonly resume: string;
  readonly start: string;
  readonly statusLabel: string;
  readonly allComplete: string;
  readonly booksLink: string;
  readonly coursesHeading: string;
  readonly availableCoursesHeading: string;
  readonly accountRequiredNote: string;
  readonly levelFilterLabel: string;
  readonly allLevels: string;
  readonly sortLabel: string;
  readonly sortByStep: string;
  readonly sortByDuration: string;
  readonly sortByProgress: string;
  readonly noCoursesMatchFilter: string;
  readonly recordEarned: string;
  readonly lessonProgress: (
    done: number,
    total: number,
    percent: number,
  ) => string;
  readonly progressAria: (title: string) => string;
  readonly viewRecord: string;
  readonly outcomesHeading: string;
  readonly outcomeCount: (covered: number, total: number) => string;
  readonly outcomeSource: (course: string) => string;
  readonly noOutcomes: string;
  readonly outcomeBoundary: string;
  readonly deepenHeading: string;
  readonly resources: readonly {
    readonly key: "books" | "demos";
    readonly title: string;
    readonly body: string;
    readonly href: string;
  }[];
  readonly localDataHeading: string;
  readonly localDataBody: string;
  readonly sectionNavigationLabel: string;
  readonly sectionSettings: string;
  readonly privacyNavigationLabel: string;
  readonly privacyLink: string;
  readonly privacySummary: string;
}

export const ACCOUNT_COPY = {
  de: {
    metadata: {
      title: "Konto | Freie Lernplattform",
      description:
        "Konto, Kursfortschritt und behandelte Lernergebnisse der freien KI-Lernplattform.",
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
    authUnavailableIdentity:
      "Der Anmeldedienst antwortet gerade nicht, daher lässt sich dein Anmeldestatus nicht prüfen.",
    authUnavailableTitle: "Anmeldestatus ist gerade nicht abrufbar.",
    authUnavailableBody:
      "Du wurdest nicht abgemeldet. Die Seite meldet dich deshalb bewusst nicht ab und zeigt keinen leeren Lernstand. Lade die Seite in einigen Minuten neu.",
    coursesCompleted: "Kurse abgeschlossen",
    outcomesCovered: "Lernergebnisse behandelt",
    lastSynchronized: "Zuletzt synchronisiert",
    noSavedProgress: "noch kein gespeicherter Lernstand",
    continueLabel: "Weiter lernen",
    resume: "Weiterlernen",
    start: "Starten",
    statusLabel: "Kursstatus",
    allComplete:
      "Alle verfügbaren Kursnachweise sind erreicht. Die Lernbücher dienen zur Vertiefung und zum Nachschlagen.",
    booksLink: "Zu den Büchern",
    coursesHeading: "Meine Kurse",
    availableCoursesHeading: "Weitere Kurse",
    accountRequiredNote:
      "Bei den vier grundlegenden Kursen synchronisiert ein Konto Fortschritt und Abschlussstatus geräteübergreifend. Die sechs technischen Kurse funktionieren auch ohne Konto.",
    levelFilterLabel: "Niveau",
    allLevels: "Alle",
    sortLabel: "Sortierung",
    sortByStep: "Empfohlene Reihenfolge",
    sortByDuration: "Dauer",
    sortByProgress: "Fortschritt",
    noCoursesMatchFilter: "Kein Kurs entspricht diesem Filter.",
    recordEarned: "Nachweis erreicht",
    lessonProgress: (done, total, percent) =>
      `${done}/${total} Lektionen · ${percent}%`,
    progressAria: (title) => `Fortschritt ${title}`,
    viewRecord: "Nachweis ansehen",
    outcomesHeading: "Behandelte Lernergebnisse",
    outcomeCount: (covered, total) => `${covered} von ${total} behandelt`,
    outcomeSource: (course) => `behandelt in ${course}`,
    noOutcomes:
      "Noch keine Lernergebnisse aus abgeschlossenen Kursen. Sie erscheinen nach dem zugehörigen Kursnachweis.",
    outcomeBoundary:
      "Diese Einträge beschreiben Inhalte abgeschlossener Kurse. Sie belegen weder individuelle Beherrschung noch eine akkreditierte Qualifikation.",
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
    localDataHeading: "Gespeicherter Lernstand",
    localDataBody:
      "Ohne Anmeldung bleiben Kursfortschritt, Checkpoints und Arbeitsbelege in diesem Browser. Ein Lernkonto synchronisiert sie geräteübergreifend. Historische Aktivitätsdaten bleiben aus Kompatibilitätsgründen im Export erhalten und haben keinen offiziellen Nachweiswert.",
    sectionNavigationLabel: "Kontobereiche",
    sectionSettings: "Konto verwalten",
    privacyNavigationLabel: "Kontodatenschutz",
    privacyLink: "Datenschutz und Datenverwaltung",
    privacySummary: "Export, Kursfortschritt zurücksetzen und Konto löschen.",
  },
  en: {
    metadata: {
      title: "Account | Free learning platform",
      description:
        "Account, course progress, and covered course outcomes on the open AI learning platform.",
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
    authUnavailableIdentity:
      "The sign-in service is not responding, so your sign-in status cannot be checked.",
    authUnavailableTitle: "Sign-in status is temporarily unavailable.",
    authUnavailableBody:
      "You have not been signed out. The page deliberately does not sign you out or substitute an empty record. Reload in a few minutes.",
    coursesCompleted: "Courses completed",
    outcomesCovered: "Course outcomes covered",
    lastSynchronized: "Last synchronised",
    noSavedProgress: "no saved learning record",
    continueLabel: "Continue learning",
    resume: "Continue",
    start: "Start",
    statusLabel: "Course status",
    allComplete:
      "Every available course record has been earned. The learning books provide reference material for further study.",
    booksLink: "Open books",
    coursesHeading: "My courses",
    availableCoursesHeading: "Available courses",
    accountRequiredNote:
      "For the four foundation courses, an account synchronises progress and completion status across devices. The six technical courses also work without an account.",
    levelFilterLabel: "Level",
    allLevels: "All",
    sortLabel: "Sort",
    sortByStep: "Recommended order",
    sortByDuration: "Duration",
    sortByProgress: "Progress",
    noCoursesMatchFilter: "No course matches this filter.",
    recordEarned: "Record earned",
    lessonProgress: (done, total, percent) =>
      `${done}/${total} lessons · ${percent}%`,
    progressAria: (title) => `Progress in ${title}`,
    viewRecord: "View record",
    outcomesHeading: "Covered course outcomes",
    outcomeCount: (covered, total) => `${covered} of ${total} covered`,
    outcomeSource: (course) => `covered in ${course}`,
    noOutcomes:
      "No outcomes from completed courses yet. They appear after the corresponding course record is earned.",
    outcomeBoundary:
      "These entries describe content covered by completed courses. They prove neither individual mastery nor an accredited qualification.",
    deepenHeading: "Go deeper",
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
    localDataHeading: "Saved learning state",
    localDataBody:
      "Without sign-in, course progress, checkpoints, and work artifacts remain in this browser. A learning account synchronises them across devices. Historical activity data remains in exports for compatibility and has no official qualification value.",
    sectionNavigationLabel: "Account sections",
    sectionSettings: "Manage account",
    privacyNavigationLabel: "Account privacy",
    privacyLink: "Privacy and data controls",
    privacySummary:
      "Export data, reset course progress, and delete the account.",
  },
} as const satisfies Readonly<Record<Locale, AccountPageCopy>>;
