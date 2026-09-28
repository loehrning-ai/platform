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
  readonly continueHeading: string;
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
  readonly recordsHeading: string;
  readonly recordsIntro: string;
  readonly recordsEmpty: string;
  readonly recordOpen: (record: string) => string;
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
  readonly ownerStatisticsEyebrow: string;
  readonly ownerStatisticsTitle: string;
  readonly ownerStatisticsBody: string;
  readonly ownerStatisticsAction: string;
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
      `Angemeldet als ${identity}. Dein Fortschritt wird geräteübergreifend synchronisiert.`,
    localIdentity: "lokaler Zugriff ohne Konto",
    logout: "Abmelden",
    unavailableTitle: "Dein Lernstand ist gerade nicht erreichbar.",
    unavailableBody:
      "Dein lokaler Lernstand bleibt erhalten. Lade die Seite später neu.",
    authUnavailableIdentity:
      "Der Anmeldedienst antwortet gerade nicht.",
    authUnavailableTitle: "Anmeldestatus ist gerade nicht abrufbar.",
    authUnavailableBody:
      "Du wurdest nicht abgemeldet. Lade die Seite in einigen Minuten neu.",
    coursesCompleted: "Kurse abgeschlossen",
    outcomesCovered: "Lernergebnisse behandelt",
    lastSynchronized: "Zuletzt synchronisiert",
    noSavedProgress: "noch kein gespeicherter Lernstand",
    continueHeading: "Weiterlernen",
    continueLabel: "Weiter lernen",
    resume: "Weiterlernen",
    start: "Starten",
    statusLabel: "Kursstatus",
    allComplete:
      "Du hast alle Kursnachweise erreicht. Zum Vertiefen gibt es die Lernbücher.",
    booksLink: "Zu den Büchern",
    coursesHeading: "Meine Kurse",
    availableCoursesHeading: "Weitere Kurse",
    accountRequiredNote:
      "Bei den vier Grundlagenkursen synchronisiert ein Konto Fortschritt und Abschluss geräteübergreifend. Die sechs Technikkurse gehen auch ohne Konto.",
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
    recordsHeading: "Teilnahmebestätigungen",
    recordsIntro:
      "Jeder abgeschlossene Kurs ergibt eine Teilnahmebestätigung mit Prüfcode. Sie ist keine akkreditierte Qualifikation.",
    recordsEmpty:
      "Noch kein Kurs abgeschlossen. Deine erste Bestätigung erscheint hier.",
    recordOpen: (record) => `${record} öffnen`,
    outcomesHeading: "Behandelte Lernergebnisse",
    outcomeCount: (covered, total) => `${covered} von ${total} behandelt`,
    outcomeSource: (course) => `behandelt in ${course}`,
    noOutcomes:
      "Lernergebnisse erscheinen hier, sobald du einen Kursnachweis erreichst.",
    outcomeBoundary:
      "Die Einträge zeigen, was deine abgeschlossenen Kurse behandelt haben. Sie belegen nicht, dass du es beherrschst, und sind keine akkreditierte Qualifikation.",
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
        body: "Arbeitsabläufe zum Durchklicken.",
        href: "/demos",
      },
    ],
    localDataHeading: "Gespeicherter Lernstand",
    localDataBody:
      "Ohne Anmeldung bleiben Kursfortschritt, Checkpoints und Arbeitsbelege in diesem Browser. Ein Lernkonto synchronisiert sie. Historische Aktivitätsdaten bleiben aus Kompatibilitätsgründen im Export und gelten nicht als Nachweis.",
    sectionNavigationLabel: "Kontobereiche",
    sectionSettings: "Konto verwalten",
    privacyNavigationLabel: "Kontodatenschutz",
    privacyLink: "Datenschutz und Datenverwaltung",
    privacySummary: "Export, Kursfortschritt zurücksetzen und Konto löschen.",
    ownerStatisticsEyebrow: "Nur für das Betreiberkonto",
    ownerStatisticsTitle: "Betriebsstatistik",
    ownerStatisticsBody:
      "Reichweite, Nutzungsereignisse und Kursverlauf der Plattform.",
    ownerStatisticsAction: "Statistik öffnen",
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
      `Signed in as ${identity}. Your progress syncs across devices.`,
    localIdentity: "local access without an account",
    logout: "Sign out",
    unavailableTitle: "Your learning record is temporarily unavailable.",
    unavailableBody:
      "Progress in this browser is unchanged. Reload the page later.",
    authUnavailableIdentity:
      "The sign-in service is not responding.",
    authUnavailableTitle: "Sign-in status is temporarily unavailable.",
    authUnavailableBody:
      "You have not been signed out. Reload in a few minutes.",
    coursesCompleted: "Courses completed",
    outcomesCovered: "Course outcomes covered",
    lastSynchronized: "Last synchronised",
    noSavedProgress: "no saved learning record",
    continueHeading: "Keep learning",
    continueLabel: "Continue learning",
    resume: "Continue",
    start: "Start",
    statusLabel: "Course status",
    allComplete:
      "You have earned every course record. The learning books go deeper.",
    booksLink: "Open books",
    coursesHeading: "My courses",
    availableCoursesHeading: "Available courses",
    accountRequiredNote:
      "For the four foundation courses, an account syncs progress and completion across devices. The six technical courses work without one.",
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
    recordsHeading: "Certificates of participation",
    recordsIntro:
      "Each completed course gives a certificate of participation with a verification code. It is not an accredited qualification.",
    recordsEmpty:
      "No completed course yet. Your first certificate of participation appears here.",
    recordOpen: (record) => `Open ${record.toLowerCase()}`,
    outcomesHeading: "Covered course outcomes",
    outcomeCount: (covered, total) => `${covered} of ${total} covered`,
    outcomeSource: (course) => `covered in ${course}`,
    noOutcomes:
      "Outcomes appear here once you earn a course record.",
    outcomeBoundary:
      "The entries show what your completed courses covered. They do not prove you master it and are not an accredited qualification.",
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
        body: "Workflows to click through.",
        href: "/demos",
      },
    ],
    localDataHeading: "Saved learning state",
    localDataBody:
      "Without sign-in, course progress, checkpoints and work artifacts stay in this browser. A learning account syncs them. Historical activity data remains in exports for compatibility and does not count as a record.",
    sectionNavigationLabel: "Account sections",
    sectionSettings: "Manage account",
    privacyNavigationLabel: "Account privacy",
    privacyLink: "Privacy and data controls",
    privacySummary:
      "Export data, reset course progress, and delete the account.",
    ownerStatisticsEyebrow: "Operator account only",
    ownerStatisticsTitle: "Operating statistics",
    ownerStatisticsBody:
      "Reach, usage events and course progression across the platform.",
    ownerStatisticsAction: "Open statistics",
  },
} as const satisfies Readonly<Record<Locale, AccountPageCopy>>;
