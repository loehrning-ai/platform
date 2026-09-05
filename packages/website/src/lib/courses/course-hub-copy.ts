import type { Locale } from "@/lib/i18n/locale";

export const COURSE_HUB_COPY = {
  de: {
    metadataTitle: "KI-Kurse: Grundlagen, Technik und Workshops",
    metadataDescription:
      "Zehn Kurse auf Deutsch und Englisch, dazu Workshops und Lernbücher. Jede Karte nennt Umfang, Zugang und Quellstand.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und Technikkursen",
    headingLead: "KI verstehen,",
    headingAccent: "einsetzen und prüfen.",
    intro:
      "Vier Grundlagenkurse in fester Reihenfolge. Sechs Technikkurse, wenn du tiefer willst.",
    firstStep: "Unsicher, wo du stehst?",
    checkLabel: "In fünf Minuten einordnen",
    accessKicker: "§ Warum kostenlos",
    accessHeading: "Alles kostenlos. Vier Reader brauchen trotzdem ein Konto.",
    accessBody:
      "Die Kursseiten sind öffentlich, kein Kurs kostet Geld. Die vier Reader des Grundlagenpfads brauchen ein Lernkonto, weil Fortschritt und Abschlussstatus zwischen deinen Geräten synchronisiert werden; Technikkurse, Workshops und Buch-Reader laufen ohne Konto. Downloads regelt jede Ressource selbst, das PDF des veröffentlichten Lernbuchs benötigt ein Konto. Die Teilnahmebestätigung stellt loehrning.ai selbst aus. Akkreditiert ist sie nicht.",
    aboutMe: "Über mich",
    aiCheck: "KI-Check",
  },
  en: {
    metadataTitle: "AI courses: foundations, technical practice, and workshops",
    metadataDescription:
      "Ten courses in English and German, plus workshops and learning books. Every card states scope, access, and source revision.",
    metadataImageAlt:
      "loehrning.ai course catalogue with a foundation path and technical courses",
    headingLead: "Understand AI.",
    headingAccent: "Use it and check the result.",
    intro:
      "Four foundation courses in a fixed order. Six technical courses when you want to go deeper.",
    firstStep: "Unsure where you stand?",
    checkLabel: "Map it in five minutes",
    accessKicker: "§ Why it is free",
    accessHeading: "Everything is free. Four readers still need an account.",
    accessBody:
      "Course pages are public. The four foundation-path readers need a learning account, which syncs progress and completion status across your devices; technical courses, workshops, and book readers run without one. Each resource states its own download rule, and the published learning book's PDF requires an account. loehrning.ai issues the certificate of participation itself. It is not accredited.",
    aboutMe: "About me",
    aiCheck: "AI check",
  },
} as const satisfies Readonly<Record<Locale, Record<string, string>>>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];
