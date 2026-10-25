import type { Locale } from "@/lib/i18n/locale";

/** Page words of the /demos hub, the demo pages, their error boundaries and share cards. */
export const DEMOS_PAGE_COPY = {
  de: {
    metadata: {
      title: "Demos zum Anfassen",
      description: (count: number) =>
        `${count} Demos, eine je Workshop: Zieh an einer Zahl und sieh, was kippt. Im Browser, ohne Konto, ohne KI, mit deinem eigenen Material.`,
      openGraphDescription: (count: number) =>
        `${count} Demos aus den loehrning.ai-Workshops: Zieh an einer Zahl und sieh, was kippt. Im Browser, ohne Konto, ohne KI.`,
      missingTitle: "Demo nicht gefunden",
      detailSuffix: "Demo",
    },
    catalog: {
      kicker: "Demos · im Browser",
      heading: "Zum Anfassen",
      introduction:
        "Je Workshop ein Ding, an dem du ziehst, einfügst oder rechnest. Es zeigt, was kippt, und gibt dir etwas mit, das du morgen benutzt.",
      listHeading: "Die Demos",
      workshopNumber: (number: string) => `Workshop ${number}`,
      takeLabel: "Mitnehmen",
      open: "Demo öffnen",
      toWorkshops: "Zu den Workshops",
      promiseZero: "0",
      promiseTitle: "Bytes von dir verlassen dein Gerät.",
      promiseBody:
        "Was du einfügst oder eintippst, wird hier nur im Browser gerechnet.",
      provenance:
        "Alle Firmen und Zahlen sind erfunden und bauen auf den Workshop-Fällen auf. Kein Konto, keine KI.",
    },
    detail: {
      home: "Start",
      catalog: "Demos",
      allDemos: "Alle Demos",
      navigation: "Demo",
      caps: (number: string) => `Workshop ${number} · Demo`,
      toWorkshop: (number: string, title: string) => `Workshop ${number}: ${title}`,
      demoRegion: "Die Demo",
    },
    errors: {
      indexKicker: "Demos nicht verfügbar",
      indexHeading: "Die Demos konnten nicht geladen werden.",
      indexBody: "Lade die Seite neu oder öffne die Kurse.",
      detailKicker: "Demo nicht verfügbar",
      detailHeading: "Diese Demo konnte nicht geladen werden.",
      detailBody: "Lade die Demo neu oder öffne die Übersicht.",
      retry: "Erneut laden",
      courses: "Zu den Kursen",
      gallery: "Zu den Demos",
    },
    og: {
      alt: "loehrning.ai Demo zum Workshop",
      fallbackTitle: "Zum Anfassen",
      fallbackSubtitle: "Eine Demo je Workshop, mit erfundenen Daten.",
    },
  },
  en: {
    metadata: {
      title: "Hands-on demos",
      description: (count: number) =>
        `${count} demos, one per workshop: pull on a number and watch what tips. In your browser, no account, no AI, with your own material.`,
      openGraphDescription: (count: number) =>
        `${count} demos from the loehrning.ai workshops: pull on a number and watch what tips. In your browser, no account, no AI.`,
      missingTitle: "Demo not found",
      detailSuffix: "Demo",
    },
    catalog: {
      kicker: "Demos · in your browser",
      heading: "Hands on",
      introduction:
        "One thing per workshop to drag, paste or work through. It shows what tips over and hands you something to use tomorrow.",
      listHeading: "The demos",
      workshopNumber: (number: string) => `Workshop ${number}`,
      takeLabel: "Take away",
      open: "Open the demo",
      toWorkshops: "To the workshops",
      promiseZero: "0",
      promiseTitle: "Bytes of yours leave your device.",
      promiseBody: "What you paste or type is only worked out here, in your browser.",
      provenance:
        "All companies and numbers are invented, built on the workshop cases. No account, no AI.",
    },
    detail: {
      home: "Home",
      catalog: "Demos",
      allDemos: "All demos",
      navigation: "Demo",
      caps: (number: string) => `Workshop ${number} · Demo`,
      toWorkshop: (number: string, title: string) => `Workshop ${number}: ${title}`,
      demoRegion: "The demo",
    },
    errors: {
      indexKicker: "Demos unavailable",
      indexHeading: "The demos could not be loaded.",
      indexBody: "Reload the page or open the courses.",
      detailKicker: "Demo unavailable",
      detailHeading: "This demo could not be loaded.",
      detailBody: "Reload the demo or open the overview.",
      retry: "Reload",
      courses: "View courses",
      gallery: "All demos",
    },
    og: {
      alt: "loehrning.ai workshop demo",
      fallbackTitle: "Hands on",
      fallbackSubtitle: "One demo per workshop, on invented data.",
    },
  },
} as const satisfies Record<Locale, unknown>;
