import type { Locale } from "@/lib/i18n/locale";

export const COURSE_HUB_COPY = {
  de: {
    metadataTitle: "KI-Kurse: Grundlagen, Technik und Workshops",
    metadataDescription:
      "Zehn Kurse auf Deutsch und Englisch sowie Workshops und Lernbücher mit ausgewiesenem Umfang, Zugang und Quellstand.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und Technikkursen",
    headingLead: "KI verstehen,",
    headingAccent: "einsetzen und prüfen.",
    intro:
      "Vier Grundlagenkurse bilden den Lernpfad; sechs Technikkurse vertiefen einzelne Werkzeuge. Jede Karte nennt Dauer, Zugang und Ergebnis.",
    firstStep: "Unsicher beim Einstieg?",
    checkLabel: "In fünf Minuten einordnen",
    accessKicker: "§ Warum kostenlos",
    accessHeading:
      "Zugang, Fortschritt und Nachweise sind getrennt ausgewiesen.",
    accessBody:
      "Die Kursseiten sind öffentlich. Die vier Reader des Grundlagenpfads benötigen ein Lernkonto, weil Fortschritt und Abschlussstatus synchronisiert werden. Technikkurse, Workshops und Buch-Reader bleiben ohne Konto erreichbar. Der Zugang zu Downloads steht an der jeweiligen Ressource; das PDF des veröffentlichten Lernbuchs benötigt ein Konto. Die Abschlussdokumente sind selbst ausgestellt und keine akkreditierten Zertifikate.",
    aboutPlatform: "Über die Plattform",
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
    aboutPlatform: "About the platform",
    aiCheck: "AI check",
  },
} as const satisfies Readonly<Record<Locale, Record<string, string>>>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];
