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
      "Ten courses in English and German, plus workshops and learning books with explicit scope, access requirements, and source revisions.",
    metadataImageAlt:
      "loehrning.ai course catalogue with a foundation path and technical courses",
    headingLead: "Understand AI.",
    headingAccent: "Use it and check the result.",
    intro:
      "Four foundation courses form the learning path; six technical courses deepen individual tools. Every card states duration, access, and outcome.",
    firstStep: "Unsure where to start?",
    checkLabel: "Map it in five minutes",
    accessKicker: "§ Access model",
    accessHeading:
      "Access, progress, and completion records are stated separately.",
    accessBody:
      "Course landing pages are public. The four foundation-path readers require a learning account because progress and completion status are synchronized. Technical courses, workshops, and book readers remain available without an account. Download access is stated on each resource; the published learning book's PDF requires an account. Completion documents are issued by loehrning.ai and are not accredited certificates.",
    aboutMe: "About me",
    aiCheck: "AI check",
  },
} as const satisfies Readonly<Record<Locale, Record<string, string>>>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];
