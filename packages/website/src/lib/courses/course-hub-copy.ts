import type { Locale } from "@/lib/i18n/locale";

export const COURSE_HUB_COPY = {
  de: {
    metadataTitle: "KI-Kurse: Grundlagen, Technik und Workshops",
    metadataDescription:
      "Zehn Kurse auf Deutsch und Englisch sowie Workshops und Lernbücher mit ausgewiesenem Umfang, Zugang und Quellstand.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und Technikkursen",
    kicker: "10 Kurse · DE + EN · klarer Umfang",
    headingLead: "KI verstehen,",
    headingAccent: "einsetzen und prüfen.",
    intro:
      "Zehn Kurse sind vollständig auf Deutsch und Englisch verfügbar. Vier Grundlagenkurse bilden einen festen Lernpfad; sechs Technikkurse behandeln Prompting, Coding Agents, Datenarbeit und Betriebsmodelle. Dauer, Voraussetzungen, Zugang und Nachweis stehen direkt am Kurs.",
    firstStep: "Dein erster Schritt:",
    checkLabel: "Der KI-Check in rund fünf Minuten",
    checkExplanation:
      "ordnet deinen Stand ein und verweist auf einen passenden Einstieg. Er ersetzt keine Prüfung und erzeugt keinen Nachweis.",
    offersLabel: "Lernangebote",
    foundations: "Grundlagenpfad",
    technical: "Technikkurse",
    workshops: "Workshops",
    books: "Lernbücher",
    differenceLabel: "Was ist der Unterschied zwischen den zwei Kursarten?",
    differenceHeading: "Was ist der Unterschied?",
    foundationDifference:
      "vier Kurse in fester Reihenfolge. Umfang, Zugang und selbst ausgestellter Nachweis stehen auf jeder Karte.",
    technicalDifference:
      "sechs einzeln wählbare Kurse zu Prompting, Coding Agents, Datenarbeit und Betriebsmodellen. Lizenz und übernommener Quellstand bleiben sichtbar.",
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
    kicker: "10 courses · DE + EN · explicit scope",
    headingLead: "Understand AI.",
    headingAccent: "Use it and check the result.",
    intro:
      "All ten courses are available in English and German. Four foundation courses form a fixed path; six technical courses cover prompting, coding agents, data work, and operating models. Duration, prerequisites, access, and completion record are stated on each course.",
    firstStep: "Starting point:",
    checkLabel: "The AI check, about five minutes",
    checkExplanation:
      "maps your current knowledge to a suitable entry point. It is not an exam and does not issue a completion record.",
    offersLabel: "Learning catalogue",
    foundations: "Foundation path",
    technical: "Technical courses",
    workshops: "Workshops",
    books: "Learning books",
    differenceLabel: "Difference between the two course collections",
    differenceHeading: "How the collections differ",
    foundationDifference:
      "four courses in a fixed order. Each card states scope, access, and the record issued by loehrning.ai.",
    technicalDifference:
      "six independently selectable courses on prompting, coding agents, data work, and operating models. The licence and imported source revision remain visible.",
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
