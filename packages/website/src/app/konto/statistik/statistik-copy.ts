import type { AdminTotalMetric } from "@/lib/admin/analytics-aggregates";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Copy for the owner-only operating statistics at /konto/statistik.
 *
 * Every figure on that page is an aggregate. The copy never names a person,
 * an account or an address, and the threshold sentences receive the numeric
 * constants from the aggregate reader so the text cannot drift from the rule
 * the reader enforces.
 */
export interface StatistikPageCopy {
  readonly metadata: { readonly title: string; readonly description: string };
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly unavailableTitle: string;
  readonly unavailableBody: string;
  readonly reauthTitle: string;
  readonly reauthBody: string;
  readonly reauthSignOutStep: string;
  readonly reauthSignOut: string;
  readonly reauthSignInStep: string;
  readonly reauthSignIn: string;
  readonly platformHeading: string;
  readonly platformUnavailable: string;
  readonly insufficientData: string;
  readonly totalsLabel: string;
  readonly totalLabels: Readonly<Record<AdminTotalMetric, string>>;
  readonly suppressed: string;
  readonly metricUnavailable: string;
  readonly coursesHeading: string;
  readonly courseColumn: string;
  readonly countColumn: string;
  readonly coursesNone: string;
  readonly coursesIncomplete: string;
  readonly accountTotalsNote: string;
  readonly ownerRowsNote: string;
  readonly thresholdNote: (floor: number, minimum: number) => string;
  readonly reachHeading: string;
  readonly reachIntro: (days: number) => string;
  readonly reachDisabled: string;
  readonly reachNotEnabled: string;
  readonly reachTotalsLabel: string;
  readonly pageviews: string;
  readonly visitors: string;
  readonly sectionUnavailable: string;
  readonly sectionEmpty: string;
  readonly routesHeading: string;
  readonly routeColumn: string;
  readonly eventsHeading: string;
  readonly eventColumn: string;
  readonly courseStartsHeading: string;
  readonly lessonCompletionsHeading: string;
  readonly courseCompletionStepsHeading: string;
  readonly stepColumn: string;
  readonly reachThresholdNote: (minimum: number) => string;
}

export const STATISTIK_COPY = {
  de: {
    metadata: {
      title: "Betriebsstatistik | Freie Lernplattform",
      description: "Interne, zusammengefasste Betriebsstatistik.",
    },
    eyebrow: "Konto",
    title: "Betriebsstatistik",
    intro:
      "Zusammengefasste Nutzungszahlen, bei jedem Aufruf neu berechnet und nicht gespeichert.",
    unavailableTitle: "Statistik vorübergehend nicht verfügbar",
    unavailableBody:
      "Die Anmeldung ließ sich gerade nicht prüfen, deshalb erscheinen keine Zahlen. Versuche es später erneut.",
    reauthTitle: "Erneute Anmeldung erforderlich",
    reauthBody:
      "Die Statistik öffnet sich nur bis 24 Stunden nach einer echten Anmeldung, eine ältere Sitzung reicht nicht.",
    reauthSignOutStep: "1. Zuerst abmelden.",
    reauthSignOut: "Abmelden",
    reauthSignInStep: "2. Danach erneut anmelden.",
    reauthSignIn: "Erneut anmelden",
    platformHeading: "Lernplattform",
    platformUnavailable:
      "Die Anzahlen der Lernplattform ließen sich gerade nicht lesen.",
    insufficientData:
      "Es gibt noch zu wenige Lernstände, deshalb erscheinen keine Einzelwerte.",
    totalsLabel: "Gesamtanzahlen",
    totalLabels: {
      courseProgress: "Gespeicherte Kurs-Lernstände",
      assessmentRuns: "Durchgeführte KI-Checks",
      assessmentAnswers: "Gespeicherte KI-Check-Antworten",
      betaFeedback: "Eingegangene Rückmeldungen",
      agentAccessEvents: "Protokollierte Agentenzugriffe",
      agentAccessTokens: "Ausgestellte Zugriffstoken",
      accountLlmKeys: "Hinterlegte eigene KI-Schlüssel",
    },
    suppressed: "zu klein zum Anzeigen",
    metricUnavailable: "nicht verfügbar",
    coursesHeading: "Lernstände je Kurs",
    courseColumn: "Kurs",
    countColumn: "Anzahl",
    coursesNone: "Kein Kurs erreicht derzeit die Mindestgröße.",
    coursesIncomplete:
      "Mindestens ein Kurs fehlt, weil seine Anzahl nicht lesbar war.",
    accountTotalsNote:
      "Die Zahl der Konten fehlt, weil ihre Zählung Nutzerdatensätze lesen müsste.",
    ownerRowsNote:
      "Die eigenen Einträge des Betreibers sind in jeder Anzahl enthalten.",
    thresholdNote: (floor: number, minimum: number) =>
      `Unter ${floor} gespeicherten Lernständen wird keine Anzahl angezeigt. Einzelwerte unter ${minimum} werden nie als Zahl angezeigt.`,
    reachHeading: "Reichweite und Nutzungsereignisse",
    reachIntro: (days: number) =>
      `Werte aus Vercel Web Analytics der letzten ${days} Tage, bei jedem Aufruf abgefragt und nicht gespeichert.`,
    reachDisabled:
      "Die Abfrage von Vercel Web Analytics ist hier nicht eingerichtet.",
    reachNotEnabled:
      "Vercel Web Analytics ist für dieses Projekt nicht aktiviert.",
    reachTotalsLabel: "Gesamtwerte",
    pageviews: "Seitenaufrufe",
    visitors: "Besuchende",
    sectionUnavailable: "Dieser Abschnitt konnte gerade nicht gelesen werden.",
    sectionEmpty: "Kein Wert erreicht derzeit die Mindestgröße.",
    routesHeading: "Meistbesuchte Seiten",
    routeColumn: "Seite",
    eventsHeading: "Nutzungsereignisse",
    eventColumn: "Ereignis",
    courseStartsHeading: "Kursstarts je Kurs",
    lessonCompletionsHeading: "Abgeschlossene Lektionen je Kurs",
    courseCompletionStepsHeading: "Kursabschluss nach Schritt",
    stepColumn: "Schritt",
    reachThresholdNote: (minimum: number) =>
      `Aufschlüsselungen zeigen nur Einträge ab ${minimum}; die Gesamtwerte werden vollständig angezeigt.`,
  },
  en: {
    metadata: {
      title: "Operating statistics | Open Learning Platform",
      description: "Internal, aggregated operating statistics.",
    },
    eyebrow: "Account",
    title: "Operating statistics",
    intro:
      "Aggregated usage counts, recalculated on each request and not stored.",
    unavailableTitle: "Statistics temporarily unavailable",
    unavailableBody:
      "Your sign-in could not be verified just now, so no figures are shown. Try again later.",
    reauthTitle: "Sign in again",
    reauthBody:
      "The statistics open only within 24 hours of an actual sign-in; an older session is not enough.",
    reauthSignOutStep: "1. Sign out first.",
    reauthSignOut: "Sign out",
    reauthSignInStep: "2. Then sign in again.",
    reauthSignIn: "Sign in again",
    platformHeading: "Learning platform",
    platformUnavailable:
      "The learning platform counts could not be read just now.",
    insufficientData:
      "There are still too few progress records, so no individual figures are shown.",
    totalsLabel: "Totals",
    totalLabels: {
      courseProgress: "Stored course progress records",
      assessmentRuns: "Completed AI checks",
      assessmentAnswers: "Stored AI check answers",
      betaFeedback: "Feedback received",
      agentAccessEvents: "Logged agent access events",
      agentAccessTokens: "Issued access tokens",
      accountLlmKeys: "Stored personal AI keys",
    },
    suppressed: "too small to show",
    metricUnavailable: "not available",
    coursesHeading: "Progress records per course",
    courseColumn: "Course",
    countColumn: "Count",
    coursesNone: "No course currently reaches the minimum size.",
    coursesIncomplete:
      "At least one course is missing because its count could not be read.",
    accountTotalsNote:
      "The number of accounts is missing because counting them would mean reading user records.",
    ownerRowsNote: "The operator's own records are included in every figure.",
    thresholdNote: (floor: number, minimum: number) =>
      `Below ${floor} stored progress records no figure is shown. Individual figures below ${minimum} are never shown as a number.`,
    reachHeading: "Reach and usage events",
    reachIntro: (days: number) =>
      `Figures from Vercel Web Analytics for the last ${days} days, fetched on each request and not stored.`,
    reachDisabled:
      "Vercel Web Analytics retrieval is not set up here.",
    reachNotEnabled:
      "Vercel Web Analytics is not enabled for this project.",
    reachTotalsLabel: "Totals",
    pageviews: "Page views",
    visitors: "Visitors",
    sectionUnavailable: "This section could not be read just now.",
    sectionEmpty: "No entry currently reaches the minimum size.",
    routesHeading: "Most visited pages",
    routeColumn: "Page",
    eventsHeading: "Usage events",
    eventColumn: "Event",
    courseStartsHeading: "Course starts per course",
    lessonCompletionsHeading: "Completed lessons per course",
    courseCompletionStepsHeading: "Course completion by step",
    stepColumn: "Step",
    reachThresholdNote: (minimum: number) =>
      `Breakdowns show only entries of ${minimum} or more; totals are shown in full.`,
  },
} as const satisfies Readonly<Record<Locale, StatistikPageCopy>>;
