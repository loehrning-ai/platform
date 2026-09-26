import type { Locale } from "@/lib/i18n/locale";

export const COURSE_HUB_COPY = {
  de: {
    metadataTitle: "KI-Kurse: Grundlagen, Technik und Workshops",
    metadataDescription:
      "Zehn Kurse auf Deutsch und Englisch, dazu Workshops und Lernbücher. Jede Karte nennt Umfang, Zugang und Quellstand.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und Technikkursen",
    kicker: (count: number) => `${count} Kurse · kostenlos · Deutsch und Englisch`,
    heading: "Kostenlose KI-Kurse für den Arbeitsalltag.",
    intro:
      "Vier Grundlagenkurse für alle, die KI im Job nutzen, und sechs Technikkurse zu Prompting, Coding-Agenten und Daten.",
    firstStep: "Unsicher, wo du stehst?",
    checkLabel: "In fünf Minuten einordnen",
    workshopsHeading: "Lieber an einem Fall arbeiten?",
    workshopsBody: (count: number) =>
      `In jedem der ${count} Workshops arbeitest du mit einer erfundenen Firma, ihren Zahlen und Dateien zum Herunterladen.`,
    workshopsNote: "Material kostenlos und ohne Konto.",
    workshopsAction: "Workshops ansehen",
    accessHeading: "Kosten und Konto",
    accessBody:
      "Alle Kurse sind kostenlos. Für die vier Grundlagenkurse legst du ein Lernkonto an, damit dein Fortschritt auf jedem Gerät gleich ist. Technikkurse, Workshops und Bücher öffnest du ohne Konto; nur das PDF des Lernbuchs braucht eins. Die Teilnahmebestätigung stellt loehrning.ai selbst aus, sie ist nicht akkreditiert.",
    aboutMe: "Über mich",
    aiCheck: "KI-Check",
  },
  en: {
    metadataTitle: "AI courses: foundations, technical practice, and workshops",
    metadataDescription:
      "Ten courses in English and German, plus workshops and learning books. Every card states scope, access, and source revision.",
    metadataImageAlt:
      "loehrning.ai course catalogue with a foundation path and technical courses",
    kicker: (count: number) => `${count} courses · free · English and German`,
    heading: "Free AI courses for everyday work.",
    intro:
      "Four foundation courses for anyone using AI at work, plus six technical courses on prompting, coding agents and data.",
    firstStep: "Unsure where you stand?",
    checkLabel: "Map it in five minutes",
    workshopsHeading: "Rather work through a case?",
    workshopsBody: (count: number) =>
      `Each of the ${count} workshops gives you a made-up company, its numbers and files to download.`,
    workshopsNote: "Materials are free, no account needed.",
    workshopsAction: "See the workshops",
    accessHeading: "Cost and account",
    accessBody:
      "All courses are free. For the four foundation courses you create a learning account so your progress is the same on every device. Technical courses, workshops and books open without an account; only the learning book's PDF needs one. loehrning.ai issues the certificate of participation itself; it is not accredited.",
    aboutMe: "About me",
    aiCheck: "AI check",
  },
} as const satisfies Readonly<
  Record<Locale, Record<string, string | ((count: number) => string)>>
>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];

/**
 * One down-to-earth promise per course for the /kurse hub ("Nach dem Kurs
 * kannst du ..."), taken from the course-surface review. The catalog tagline
 * stays the short card label used by other surfaces; the hub shows this line.
 */
export const COURSE_PROMISES: Readonly<
  Record<Locale, Readonly<Record<string, string>>>
> = {
  de: {
    "ki-fuehrerschein":
      "Nach dem Kurs weißt du, welche Daten in welches KI-Tool dürfen, und du prüfst eine KI-Antwort, bevor sie in eine Mail oder ein Protokoll geht.",
    "ki-und-gesellschaft":
      "Nach dem Kurs kannst du eine Schlagzeile wie „KI ersetzt 40 % der Jobs“ auf ihre Datenbasis zurückführen und weißt, was du mit einem verdächtigen Video tust.",
    "eu-ai-act-kurs":
      "Nach dem Kurs kannst du für ein KI-Tool in deinem Unternehmen sagen, in welche Risikoklasse es fällt, welche Rolle ihr habt und welche Pflichten bis wann anstehen.",
    "ai-native":
      "Nach dem Kurs hast du Claude für ein festes Projekt eingerichtet und eine wiederkehrende Aufgabe als n8n-Ablauf mit Freigabeschritt gebaut.",
    claude:
      "Nach dem Kurs schreibst du Prompts mit Kontext, Beispielen und festem Ausgabeformat und legst für dein Projekt eine CLAUDE.md an.",
    codex:
      "Nach dem Kurs gibst du Codex eine Aufgabe mit AGENTS.md und Akzeptanzkriterien und prüfst den Pull Request, bevor du ihn mergst.",
    "data-infrastructure":
      "Nach dem Kurs kannst du Tabellenformat, Partitionierung und Streaming-Garantie einer Datenplattform begründen und im Design-Review vertreten.",
    "data-engineering-fundamentals":
      "Nach dem Kurs kannst du eine Pipeline von der Quelle bis zum Dashboard aufzeichnen und für jede Station sagen, wo sie typischerweise bricht.",
    "data-science":
      "Nach dem Kurs kannst du eine Kennzahl wie „92 % Accuracy“ hinterfragen und erkennst, wann ein A/B-Test zu früh gestoppt wurde.",
    "ai-native-operator":
      "Nach dem Kurs kannst du für dein Team festlegen, welche Aufgaben KI übernimmt, wer freigibt und woran ihr nach drei Monaten den Nutzen messt.",
  },
  en: {
    "ki-fuehrerschein":
      "After this you know which data may go into which AI tool, and you check an AI answer before it ends up in an email or minutes.",
    "ki-und-gesellschaft":
      "After this you can trace a headline like 'AI will replace 40% of jobs' back to its data, and you know what to do with a suspicious video.",
    "eu-ai-act-kurs":
      "After this you can take one AI tool your company uses, name its risk class and your role, and list the duties and deadlines that follow.",
    "ai-native":
      "After this you have set Claude up for one real project and turned a recurring task into an n8n workflow with an approval step.",
    claude:
      "After this you write prompts with context, examples and a fixed output format, and you set up a CLAUDE.md for your project.",
    codex:
      "After this you hand Codex a task with an AGENTS.md and acceptance criteria, and you review the pull request before you merge it.",
    "data-infrastructure":
      "After this you can justify the table format, partitioning and streaming guarantees of a data platform and defend them in a design review.",
    "data-engineering-fundamentals":
      "After this you can sketch a pipeline from source to dashboard and say, for each stage, where it usually breaks.",
    "data-science":
      "After this you can question a metric like '92% accuracy' and spot an A/B test that was stopped too early.",
    "ai-native-operator":
      "After this you can decide which tasks your team hands to AI, who signs off, and how you will measure after three months whether it paid off.",
  },
};

export function coursePromise(
  slug: string,
  locale: Locale,
): string | undefined {
  return COURSE_PROMISES[locale][slug];
}
