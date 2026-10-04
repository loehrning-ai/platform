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
    metadataTitle: "KI-Kurse: Grundlagen, visuelles Lernen und Workshops",
    metadataDescription:
      "Acht Kurse auf Deutsch und Englisch, alle kostenlos, dazu Workshops und Lernbücher. Jeder Kurs nennt Dauer, Stufe und Kontopflicht, die Kurse zum visuellen Lernen ihren Quellstand auf GitHub.",
    metadataImageAlt:
      "loehrning.ai Kursübersicht mit Grundlagenpfad und visuellem Lernen",
    kicker: (count: number) => `${count} Kurse · Deutsch und Englisch`,
    heading: "Kostenlose KI-Kurse für den Arbeitsalltag.",
    intro:
      "Vier Grundlagenkurse für alle, die KI im Job nutzen, und vier Kurse zum visuellen Lernen über Daten und KI-Betrieb.",
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
    /** One cost note at every width: price, the two reasons for an account, the certificate status. */
    accessBody:
      "Alle Kurse sind kostenlos und nicht akkreditiert. Ein Konto brauchst du nur für die vier Grundlagenkurse, damit dein Fortschritt bleibt, und für das Buch-PDF.",
    accessAction: "Lernkonto anlegen",
  },
  en: {
    metadataTitle: "AI courses: foundations, visual learning, and workshops",
    metadataDescription:
      "Eight free AI courses in English and German, plus workshops and learning books. Each course lists duration, level and whether you need an account.",
    metadataImageAlt:
      "loehrning.ai course catalogue with a foundation path and visual learning",
    kicker: (count: number) => `${count} courses · English and German`,
    heading: "Free AI courses for everyday work.",
    intro:
      "Four foundation courses for anyone using AI at work, plus four visual-learning courses on data and AI operations.",
    firstStep: "Unsure where you stand?",
    firstStepShort: "Unsure?",
    checkLabel: "Find out in five minutes",
    workshopsHeading: "Rather work through a case?",
    workshopsBody: (count: number) =>
      `Each of the ${numberWord("en", count)} workshops gives you a made-up company, its numbers and files to download.`,
    workshopsNote: "Materials open without an account.",
    workshopsAction: "See the workshops",
    accessHeading: "Cost and account",
    accessBody:
      "All courses are free and not accredited. You need an account only for the four foundation courses, to keep your progress, and the book PDF.",
    accessAction: "Create a learning account",
  },
} as const satisfies Readonly<
  Record<Locale, Record<string, string | ((count: number) => string)>>
>;

export type CourseHubCopy = (typeof COURSE_HUB_COPY)[Locale];

/**
 * One promise per course for the /kurse hub, at most 12 words: what you can
 * do after the course, opening with the concrete action. The catalog tagline
 * stays the short card label used by other surfaces; the hub shows this line.
 */
export const COURSE_PROMISES: Readonly<
  Record<Locale, Readonly<Record<string, string>>>
> = {
  de: {
    "ki-fuehrerschein":
      "Du weißt, welche Daten ins KI-Tool dürfen, und prüfst Antworten vorm Weitergeben.",
    "ki-und-gesellschaft":
      "Du prüfst die Daten hinter KI-Schlagzeilen und weißt, was bei Deepfake-Verdacht hilft.",
    "eu-ai-act-kurs":
      "Risikoklasse, Rolle, Pflichten und Fristen eines KI-Tools bestimmen.",
    "ai-native":
      "Du misst, ob KI sich lohnt, und testest einen Ablauf mit Freigabe.",
    "data-infrastructure":
      "Du begründest Tabellenformat, Partitionierung und Streaming-Garantien im Design-Review.",
    "data-engineering-fundamentals":
      "Du zeichnest eine Pipeline von der Quelle bis zum Dashboard samt Bruchstellen.",
    "data-science":
      "Du prüfst Kennzahlen wie „92 % Accuracy“ und zu früh gestoppte A/B-Tests.",
    "ai-native-operator":
      "Du legst KI-Aufgaben und Freigaben fest und misst den Nutzen.",
  },
  en: {
    "ki-fuehrerschein":
      "You know what data AI may see and check answers before sharing.",
    "ki-und-gesellschaft":
      "You trace AI headlines to their data and handle suspected deepfakes.",
    "eu-ai-act-kurs":
      "Determine an AI tool's risk class, role, duties and deadlines.",
    "ai-native":
      "You measure whether AI pays off and test a workflow with sign-off.",
    "data-infrastructure":
      "You justify table format, partitioning and streaming guarantees in a design review.",
    "data-engineering-fundamentals":
      "You sketch a pipeline from source to dashboard, including where it breaks.",
    "data-science":
      "You question metrics like '92% accuracy' and A/B tests stopped early.",
    "ai-native-operator":
      "You set your team's AI tasks and sign-offs and measure the payoff.",
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
    "ai-native": "Nutzen messen, Abläufe absichern",
    "data-infrastructure": "Design einer Datenplattform begründen",
    "data-engineering-fundamentals": "Pipelines zeichnen, Bruchstellen kennen",
    "data-science": "Kennzahlen und A/B-Tests hinterfragen",
    "ai-native-operator": "KI-Aufgaben, Freigaben und Nutzen festlegen",
  },
  en: {
    "ki-fuehrerschein": "Share data safely, check AI answers",
    "ki-und-gesellschaft": "Read AI headlines and deepfakes critically",
    "eu-ai-act-kurs": "Name risk class, role and duties",
    "ai-native": "Measure the payoff, safeguard workflows",
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
  de: {},
  en: {},
};

export function courseDurationShort(
  slug: string,
  locale: Locale,
): string | undefined {
  return COURSE_DURATIONS_SHORT[locale][slug];
}
