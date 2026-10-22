import type { Locale } from "@/lib/i18n/locale";

const GERMAN_COUNT_WORDS: Readonly<Record<number, string>> = {
  1: "Eine", 2: "Zwei", 3: "Drei", 4: "Vier", 5: "Fünf", 6: "Sechs", 7: "Sieben", 8: "Acht",
};
const ENGLISH_COUNT_WORDS: Readonly<Record<number, string>> = {
  1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight",
};

/** Page words of the /demos hub, the demo pages, their error boundaries and share cards. */
export const DEMOS_PAGE_COPY = {
  de: {
    metadata: {
      title: "Üben am Fall",
      description: (count: number) =>
        `${count} Übungen, eine je Workshop: Du entscheidest am erfundenen Fall, im Browser, ohne Konto und ohne KI.`,
      openGraphDescription: (count: number) =>
        `${count} Übungen aus den loehrning.ai-Workshops, im Browser, ohne Konto und ohne KI.`,
      missingTitle: "Übung nicht gefunden",
      detailSuffix: "Übung",
    },
    catalog: {
      kicker: "Übungen · im Browser",
      heading: "Üben am Fall",
      introduction: (count: number) =>
        `${GERMAN_COUNT_WORDS[count] ?? count} Übungen, eine je Workshop. Jede stellt eine Frage, und du entscheidest am erfundenen Fall.`,
      listHeading: "Die Übungen",
      workshopNumber: (number: string) => `Workshop ${number}`,
      minutes: (minutes: number) => `ca. ${minutes} Min.`,
      open: "Übung öffnen",
      provenance:
        "Alle Firmen und Zahlen erfunden, aufgebaut auf den Workshop-Fällen. Läuft im Browser, ohne Konto, ohne KI.",
    },
    detail: {
      home: "Start",
      catalog: "Übungen",
      allDemos: "Alle Übungen",
      navigation: "Übung",
      caps: (number: string) => `Workshop ${number} · Übung`,
      toWorkshop: (number: string, title: string) => `Workshop ${number}: ${title}`,
      demoRegion: "Die Übung",
    },
    errors: {
      indexKicker: "Übungen nicht verfügbar",
      indexHeading: "Die Übungen konnten nicht geladen werden.",
      indexBody: "Lade die Seite neu oder öffne die Kurse.",
      detailKicker: "Übung nicht verfügbar",
      detailHeading: "Diese Übung konnte nicht geladen werden.",
      detailBody: "Lade die Übung neu oder öffne die Übersicht.",
      retry: "Erneut laden",
      courses: "Zu den Kursen",
      gallery: "Zu den Übungen",
    },
    og: {
      alt: "loehrning.ai Übung zum Workshop",
      fallbackTitle: "Üben am Fall",
      fallbackSubtitle: "Eine Übung je Workshop, mit erfundenen Daten.",
    },
  },
  en: {
    metadata: {
      title: "Practice on the case",
      description: (count: number) =>
        `${count} exercises, one per workshop: you decide on an invented case, in your browser, with no account and no AI.`,
      openGraphDescription: (count: number) =>
        `${count} exercises from the loehrning.ai workshops, in your browser, with no account and no AI.`,
      missingTitle: "Exercise not found",
      detailSuffix: "Exercise",
    },
    catalog: {
      kicker: "Exercises · in your browser",
      heading: "Practice on the case",
      introduction: (count: number) =>
        `${ENGLISH_COUNT_WORDS[count] ?? count} exercises, one per workshop. Each asks one question, and you decide on the invented case.`,
      listHeading: "The exercises",
      workshopNumber: (number: string) => `Workshop ${number}`,
      minutes: (minutes: number) => `about ${minutes} min`,
      open: "Open the exercise",
      provenance:
        "Every company and figure is invented, built on the workshop cases. Runs in your browser, no account, no AI.",
    },
    detail: {
      home: "Home",
      catalog: "Exercises",
      allDemos: "All exercises",
      navigation: "Exercise",
      caps: (number: string) => `Workshop ${number} · Practice`,
      toWorkshop: (number: string, title: string) => `Workshop ${number}: ${title}`,
      demoRegion: "The exercise",
    },
    errors: {
      indexKicker: "Exercises unavailable",
      indexHeading: "The exercises could not be loaded.",
      indexBody: "Reload the page or open the courses.",
      detailKicker: "Exercise unavailable",
      detailHeading: "This exercise could not be loaded.",
      detailBody: "Reload the exercise or open the overview.",
      retry: "Reload",
      courses: "View courses",
      gallery: "All exercises",
    },
    og: {
      alt: "loehrning.ai workshop exercise",
      fallbackTitle: "Practice on the case",
      fallbackSubtitle: "One exercise per workshop, on invented data.",
    },
  },
} as const satisfies Record<Locale, unknown>;
