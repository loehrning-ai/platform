import type { Locale } from "@/lib/i18n/locale";

const NUMBER_WORDS: Readonly<Record<Locale, readonly string[]>> = {
  de: ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"],
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"],
};

/**
 * Spells a count from 2 to 12 as a word, so running text reads "drei
 * Workshops" instead of a template numeral. Larger counts stay digits.
 */
export function numberWord(locale: Locale, count: number): string {
  return count >= 2 && count <= 12
    ? (NUMBER_WORDS[locale][count] ?? String(count))
    : String(count);
}

export const COURSE_HUB_COPY = {
  de: {
    metadataTitle: "KI-Kurse: Grundlagen, Technik und Workshops",
    metadataDescription:
      "Zehn Kurse auf Deutsch und Englisch, alle kostenlos, dazu Workshops und Lernbücher mit Material zum Herunterladen. Jeder Kurs nennt Dauer, Stufe und ob du ein Konto brauchst, die Technikkurse auch ihren Quellstand auf GitHub.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und Technikkursen",
    kicker: (count: number) => `${count} Kurse · Deutsch und Englisch`,
    heading: "Kostenlose KI-Kurse für den Arbeitsalltag.",
    intro:
      "Vier Grundlagenkurse für alle, die KI im Job nutzen, und sechs Technikkurse zu Prompting, Coding-Agenten und Daten.",
    firstStep: "Unsicher, wo du stehst?",
    /** The same question on a phone under 430px, so it and the link share one line. */
    firstStepShort: "Unsicher?",
    checkLabel: "In fünf Minuten einordnen",
    workshopsHeading: "Lieber an einem Fall arbeiten?",
    workshopsBody: (count: number) =>
      `In jedem der ${numberWord("de", count)} Workshops arbeitest du mit einer erfundenen Firma, ihren Zahlen und Dateien zum Herunterladen.`,
    workshopsNote: "Material ohne Konto.",
    workshopsAction: "Workshops ansehen",
    accessHeading: "Kosten und Konto",
    accessBody:
      "Alle Kurse sind kostenlos. Für die vier Grundlagenkurse legst du ein Lernkonto an, damit dein Fortschritt auf jedem Gerät gleich ist. Technikkurse, Workshops und Bücher öffnest du ohne Konto; nur das PDF des Lernbuchs braucht eins. Die Teilnahmebestätigung stellt loehrning.ai selbst aus, sie ist nicht akkreditiert.",
    /** The phone version of `accessBody`: the same three facts in two sentences. */
    accessBodyShort:
      "Alle Kurse sind kostenlos. Ein Lernkonto brauchst du nur für die vier Grundlagenkurse und das PDF des Lernbuchs; die Teilnahmebestätigung ist nicht akkreditiert.",
    accessAction: "Lernkonto anlegen",
  },
  en: {
    metadataTitle: "AI courses: foundations, technical practice, and workshops",
    metadataDescription:
      "Ten free AI courses in English and German, plus workshops and learning books with downloadable material. Each course lists duration, level and whether you need an account.",
    metadataImageAlt:
      "loehrning.ai course catalogue with a foundation path and technical courses",
    kicker: (count: number) => `${count} courses · English and German`,
    heading: "Free AI courses for everyday work.",
    intro:
      "Four foundation courses for anyone using AI at work, plus six technical courses on prompting, coding agents and data.",
    firstStep: "Unsure where you stand?",
    firstStepShort: "Unsure?",
    checkLabel: "Find out in five minutes",
    workshopsHeading: "Rather work through a case?",
    workshopsBody: (count: number) =>
      `Each of the ${numberWord("en", count)} workshops gives you a made-up company, its numbers and files to download.`,
    workshopsNote: "No account needed.",
    workshopsAction: "See the workshops",
    accessHeading: "Cost and account",
    accessBody:
      "All courses are free. For the four foundation courses you create a learning account so your progress is the same on every device. Technical courses, workshops and books open without an account; only the learning book's PDF needs one. loehrning.ai issues the certificate of participation itself; it is not accredited.",
    accessBodyShort:
      "All courses are free. You only need a learning account for the four foundation courses and the learning book's PDF; the certificate of participation is not accredited.",
    accessAction: "Create a learning account",
  },
} as const satisfies Readonly<
  Record<Locale, Record<string, string | ((count: number) => string)>>
>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];

/**
 * One down-to-earth promise per course for the /kurse hub: what you can do
 * after the course, opening with the concrete action. The ledger intro says
 * the frame ("what you can do afterwards") once, so the rows do not repeat
 * it. Taken from the course-surface review. The catalog tagline
 * stays the short card label used by other surfaces; the hub shows this line.
 */
export const COURSE_PROMISES: Readonly<
  Record<Locale, Readonly<Record<string, string>>>
> = {
  de: {
    "ki-fuehrerschein":
      "Du weißt, welche Daten in welches KI-Tool dürfen, und prüfst eine KI-Antwort, bevor sie in eine Mail oder ein Protokoll geht.",
    "ki-und-gesellschaft":
      "Eine Schlagzeile wie „KI ersetzt 40 % der Jobs“ führst du auf ihre Datenbasis zurück, und bei einem verdächtigen Video weißt du, was zu tun ist.",
    "eu-ai-act-kurs":
      "Für ein KI-Tool in deinem Unternehmen bestimmst du Risikoklasse und eure Rolle und listest, welche Pflichten bis wann anstehen.",
    "ai-native":
      "Claude ist für ein festes Projekt eingerichtet, und eine wiederkehrende Aufgabe läuft als n8n-Ablauf mit Freigabeschritt.",
    claude:
      "Du schreibst Prompts mit Kontext, Beispielen und festem Ausgabeformat und legst eine CLAUDE.md für dein Projekt an.",
    codex:
      "Codex bekommt von dir eine Aufgabe mit AGENTS.md und Akzeptanzkriterien, und du prüfst den Pull Request, bevor du ihn mergst.",
    "data-infrastructure":
      "Tabellenformat, Partitionierung und Streaming-Garantie einer Datenplattform begründest du so, dass sie im Design-Review halten.",
    "data-engineering-fundamentals":
      "Du zeichnest eine Pipeline von der Quelle bis zum Dashboard auf und sagst für jede Station, wo sie typischerweise bricht.",
    "data-science":
      "Du hinterfragst eine Kennzahl wie „92 % Accuracy“ und erkennst einen A/B-Test, der zu früh gestoppt wurde.",
    "ai-native-operator":
      "Für dein Team legst du fest, welche Aufgaben KI übernimmt, wer freigibt und woran ihr nach drei Monaten den Nutzen messt.",
  },
  en: {
    "ki-fuehrerschein":
      "You know which data may go into which AI tool, and you check an AI answer before it ends up in an email or minutes.",
    "ki-und-gesellschaft":
      "You trace a headline like 'AI will replace 40% of jobs' back to its data, and you know what to do with a suspicious video.",
    "eu-ai-act-kurs":
      "For one AI tool your company uses, you name its risk class and your role and list the duties and deadlines that follow.",
    "ai-native":
      "Claude is set up for one real project, and a recurring task runs as an n8n workflow with an approval step.",
    claude:
      "You write prompts with context, examples and a fixed output format, and you set up a CLAUDE.md for your project.",
    codex:
      "You hand Codex a task with an AGENTS.md and acceptance criteria, and you review the pull request before you merge it.",
    "data-infrastructure":
      "You can justify the table format, partitioning and streaming guarantees of a data platform in a design review.",
    "data-engineering-fundamentals":
      "You sketch a pipeline from source to dashboard and say, for each stage, where it usually breaks.",
    "data-science":
      "You question a metric like '92% accuracy' and spot an A/B test that was stopped too early.",
    "ai-native-operator":
      "You decide which tasks your team hands to AI, who signs off, and how you measure after three months whether it paid off.",
  },
};

export function coursePromise(
  slug: string,
  locale: Locale,
): string | undefined {
  return COURSE_PROMISES[locale][slug];
}

/**
 * The phone preview of each promise: one clause of at most 45 characters,
 * so a ledger row states what the course is about without an ellipsis. The
 * full promise stays in the accessibility tree and prints from sm.
 */
export const COURSE_PROMISES_SHORT: Readonly<
  Record<Locale, Readonly<Record<string, string>>>
> = {
  de: {
    "ki-fuehrerschein": "Daten richtig einsetzen, KI-Antworten prüfen",
    "ki-und-gesellschaft": "KI-Schlagzeilen und Deepfakes einordnen",
    "eu-ai-act-kurs": "Risikoklasse, Rolle und Pflichten bestimmen",
    "ai-native": "Claude-Projekt und n8n-Ablauf einrichten",
    claude: "Prompts mit festem Format und CLAUDE.md",
    codex: "Codex beauftragen, Pull Requests prüfen",
    "data-infrastructure": "Design einer Datenplattform begründen",
    "data-engineering-fundamentals": "Pipelines zeichnen, Bruchstellen kennen",
    "data-science": "Kennzahlen und A/B-Tests hinterfragen",
    "ai-native-operator": "KI-Aufgaben, Freigaben und Nutzen festlegen",
  },
  en: {
    "ki-fuehrerschein": "Share data safely, check AI answers",
    "ki-und-gesellschaft": "Read AI headlines and deepfakes critically",
    "eu-ai-act-kurs": "Name risk class, role and duties",
    "ai-native": "Set up a Claude project and an n8n workflow",
    claude: "Prompts with a fixed format, plus CLAUDE.md",
    codex: "Brief Codex, review its pull requests",
    "data-infrastructure": "Justify a data platform's design choices",
    "data-engineering-fundamentals": "Sketch pipelines, know where they break",
    "data-science": "Question metrics and A/B tests",
    "ai-native-operator": "Decide what AI does and who signs off",
  },
};

export function coursePromiseShort(
  slug: string,
  locale: Locale,
): string | undefined {
  return COURSE_PROMISES_SHORT[locale][slug];
}

/**
 * A phone-length duration where the catalog label would wrap the facts
 * caption. Only courses listed here differ; the rest print their catalog
 * duration at every width.
 */
export const COURSE_DURATIONS_SHORT: Readonly<
  Record<Locale, Readonly<Record<string, string>>>
> = {
  de: { "ai-native": "ca. 5 bis 12 Std." },
  en: { "ai-native": "about 5 to 12 hrs" },
};

export function courseDurationShort(
  slug: string,
  locale: Locale,
): string | undefined {
  return COURSE_DURATIONS_SHORT[locale][slug];
}
