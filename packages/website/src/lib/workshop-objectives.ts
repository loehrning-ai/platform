/**
 * The "Lernziel" block of each workshop page: the one sentence the workshop
 * teaches and the three-line card that carries it into your own Claude.
 * Workshops 03 to 05 take both from their demo's copy, so the page, the demo
 * and the skill say the same words (workshop-objectives.test.ts holds them in
 * lockstep); Workshops 01 and 02 take them from their kit's start file and
 * their skill.
 */
import type { Locale } from "@/lib/i18n/locale";
import { COPY as AUDIT } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { TEST_ORDER } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { COPY as ESG } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { DE as READINESS_DE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { EN as READINESS_EN } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-en";

export interface WorkshopObjective {
  readonly label: string;
  readonly objective: string;
  /** The card, as three lines, in the order the workshop teaches them. */
  readonly card: readonly [string, string, string];
  /** Where the card lives in the kit or the demo. */
  readonly cardSource: string;
}

const LABEL: Record<Locale, string> = { de: "Lernziel", en: "Objective" };

function audit(locale: Locale): WorkshopObjective {
  const copy = AUDIT[locale];
  return {
    label: LABEL[locale],
    objective: copy.objective,
    card: [TEST_ORDER.map((test) => copy.test[test]).join(" · "), copy.tool.status, copy.tool.rule],
    cardSource: copy.toolSource,
  };
}

function esg(locale: Locale): WorkshopObjective {
  const copy = ESG[locale];
  const statuses = copy.regel.statuses.map(([key, text]) => `${copy.statuses[key as keyof typeof copy.statuses]}: ${text}`).join(". ");
  return {
    label: LABEL[locale],
    objective: copy.regel.objective,
    card: [copy.regel.checks.map(([word]) => word).join(" · "), `${statuses}.`, copy.regel.weakest],
    cardSource: copy.regel.caption,
  };
}

const READINESS = { de: READINESS_DE, en: READINESS_EN } as const;

const OBJECTIVES: Readonly<Record<string, Readonly<Record<Locale, WorkshopObjective>>>> = {
  "ki-prognosen-einschaetzen": {
    de: {
      label: LABEL.de,
      objective: "Du prüfst eine Wochenprognose an ihren eigenen alten Fehlern, bevor danach geplant wird.",
      card: [
        "Messlatte: Sind die Fehler kleiner als die von „wie letzte Woche“?",
        "Spanne und Planzahl: Lag das Ist so oft in der 80-%-Spanne, wie sie verspricht, und welche Menge folgt aus den Kosten?",
        "Regel: Welche Woche läuft die Prognose allein, welche entscheidet eine Person?",
      ],
      cardSource: "Im Kit: pruefregel.md",
    },
    en: {
      label: LABEL.en,
      objective: "You check a weekly forecast against its own past errors before anyone plans with it.",
      card: [
        "Baseline: are the errors smaller than those of “same as last week”?",
        "Range and planning number: did the actual land inside the 80 % range as often as it promises, and what quantity follows from the costs?",
        "Rule: in which week does the forecast run alone, and in which does a person decide?",
      ],
      cardSource: "In the kit: release-rule.md",
    },
  },
  "geschaeftsberichte-mit-ki-lesen": {
    de: {
      label: LABEL.de,
      objective:
        "Eine Kennzahl bedeutet nur, was ihr Steckbrief sagt. Du legst Zähler, Nenner und Zeitraum fest, verfolgst eine Zahl bis zu ihren Zeilen und entscheidest erst dann.",
      card: [
        "Zitieren, dann rechnen: jede Zahl mit ihrer Stelle im Material.",
        "Steckbrief je Kennzahl: Zähler, Nenner, Zeitraum, Quelle, Grenze.",
        "Gegenprobe: Dreht eine andere Definition die Richtung, stehen beide nebeneinander.",
      ],
      cardSource: "Im Kit: der Skill kennzahlen-steckbrief",
    },
    en: {
      label: LABEL.en,
      objective:
        "A metric means only what its card says. You pin down numerator, denominator and period, trace one figure to its rows, and only then decide.",
      card: [
        "Quote, then compute: every figure with its place in the material.",
        "A card per metric: numerator, denominator, period, source, limit.",
        "Cross-check: if another definition flips the direction, both stand side by side.",
      ],
      cardSource: "In the kit: the kennzahlen-steckbrief skill",
    },
  },
  "datenbereitschaft-fuer-ki": {
    de: {
      label: LABEL.de,
      objective: READINESS.de.takehome.objective,
      card: [
        "Frage und Sicht: Zeitraum, Art der Zahl und Einheit stehen fest, gerechnet wird nur aus der freigegebenen Sicht.",
        "Art und wer zählt: einen Stand nie über die Zeit addieren, eine Quote aus Zähler und Nenner neu rechnen.",
        "Sperre und Test: Was unter „Nie zeigen“ steht, wird abgelehnt; jede Zahl endet mit ihrer Herkunft.",
      ],
      cardSource: "Im Kit: der Skill kennzahl-fragekarte",
    },
    en: {
      label: LABEL.en,
      objective: READINESS.en.takehome.objective,
      card: [
        "Question and view: period, kind of number and unit are fixed, and only the approved view is used.",
        "Kind and who counts: never add a level over time; recompute a rate from numerator and denominator.",
        "Never show and test: what is listed under never show is refused; every number ends with its trace.",
      ],
      cardSource: "In the kit: the kennzahl-fragekarte skill",
    },
  },
  "esg-berichte-mit-ki": { de: esg("de"), en: esg("en") },
  "audit-vorbereitung-mit-ki": { de: audit("de"), en: audit("en") },
};

export function workshopObjective(slug: string, locale: Locale): WorkshopObjective | undefined {
  return OBJECTIVES[slug]?.[locale];
}

export const WORKSHOP_OBJECTIVE_SLUGS: readonly string[] = Object.keys(OBJECTIVES);
