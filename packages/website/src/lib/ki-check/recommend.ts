// KI-Check — map a result to the next German core course.
//
// Deterministic, no side effects. Foundation first: if the basics are not yet
// solid, the KI-Führerschein is the entry point regardless of the other axes.
// Otherwise the check routes to the course that closes the biggest remaining
// gap, breaking ties along the learning path order.

import { getCatalogCourse } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import {
  courseBadges,
  courseFacts,
  type CourseAccent,
} from "@/lib/courses/tracks";
import type { CourseSlug } from "@/lib/course/types";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { DimensionId, DimensionResult, KiCheckResult } from "./types";

/** Below this composite/dimension score the basics count as "not yet solid". */
export const FOUNDATION_THRESHOLD = 50;

/** Which German core course each dimension points at. */
export const DIMENSION_COURSE: Record<DimensionId, CourseSlug> = {
  grundlagen: "ki-fuehrerschein",
  urteil: "ki-und-gesellschaft",
  recht: "eu-ai-act-kurs",
  verantwortung: "eu-ai-act-kurs",
  praxis: "ai-native",
};

/** Learning-path order used to break score ties (earliest stage wins). */
const PATH_ORDER: Record<DimensionId, number> = {
  grundlagen: 0,
  urteil: 1,
  recht: 2,
  verantwortung: 3,
  praxis: 4,
};

export type RecommendationKind = "foundation" | "gap";

export interface KiCheckRecommendation {
  readonly slug: CourseSlug;
  readonly courseTitle: string;
  readonly courseHref: string;
  readonly startHref: string;
  readonly badge: string;
  readonly iconName: string;
  readonly accent: CourseAccent;
  readonly focusDimensionId: DimensionId;
  readonly focusDimensionName: string;
  readonly reasoning: string;
  readonly kind: RecommendationKind;
}

/** Reason lines per focus dimension for the gap case (du-form, warm). */
const GAP_REASONING: Record<DimensionId, string> = {
  grundlagen:
    "Beim Verstehen der KI-Grundlagen liegt der niedrigste Wert. Der {title} behandelt Funktionsweise, Fehlertypen und Prüfung.",
  urteil:
    "Beim kritischen Einordnen liegt der niedrigste Wert. Der {title} behandelt Deepfakes, Verzerrungen und Quellenprüfung.",
  recht:
    "Beim Anwenden von KI-Regeln liegt der niedrigste Wert. Der {title} ordnet Rollen, Risikoklassen und Pflichten des AI Act ein.",
  verantwortung:
    "Beim verantwortungsvollen Einsatz liegt der niedrigste Wert. Der {title} behandelt Datenschutz, Transparenz und nachvollziehbare Nachweise.",
  praxis:
    "Bei der Anwendung im Arbeitsalltag liegt der niedrigste Wert. Der {title} vermittelt eine Methode für Prompts, Werkzeuge und Prüfung.",
};

const FOUNDATION_REASONING =
  "Beginne mit den Grundbegriffen, bevor du Spezialthemen vertiefst. Der {title} erklärt Funktionsweise, Fehlertypen, Datenschutz und Prüfung ohne vorausgesetztes Vorwissen.";

const GAP_REASONING_EN: Record<DimensionId, string> = {
  grundlagen:
    "Your basics score is the main gap. {title} explains how AI works, where it fails, and how to check its output.",
  urteil:
    "Judging model output is the main gap, including synthetic media and bias. {title} addresses those cases directly.",
  recht:
    "Applying AI rules is the main gap. {title} turns the AI Act's roles and risk classes into concrete decisions.",
  verantwortung:
    "Responsible use is the main gap. {title} covers data protection, transparency, and traceable records.",
  praxis:
    "Applying AI in daily work is the main gap. {title} provides a method for prompts, tools, and review steps.",
};

const FOUNDATION_REASONING_EN =
  "Build the basic model before adding specialist detail. {title} explains how AI works, common failures, data protection, and verification without assuming prior knowledge.";

function build(
  focus: DimensionResult,
  kind: RecommendationKind,
  locale: Locale,
): KiCheckRecommendation {
  const slug = DIMENSION_COURSE[focus.id];
  const baseCourse = getCatalogCourse(slug);
  const course = baseCourse
    ? localizeCatalogCourse(baseCourse, locale)
    : undefined;
  const meta = courseFacts(slug);

  const title =
    course?.title ?? (locale === "de" ? "Kernkurs" : "Foundation course");
  const template =
    locale === "de"
      ? kind === "foundation"
        ? FOUNDATION_REASONING
        : GAP_REASONING[focus.id]
      : kind === "foundation"
        ? FOUNDATION_REASONING_EN
        : GAP_REASONING_EN[focus.id];

  return {
    slug,
    courseTitle: title,
    courseHref: localizeHref(course?.href ?? "/kurse", locale),
    startHref: localizeHref(course?.startHref ?? "/kurse", locale),
    badge:
      locale === "de"
        ? meta.badge
        : courseBadges(slug, locale)
            .map(({ label }) => label)
            .join(" · "),
    iconName: meta.iconName,
    accent: meta.accent,
    focusDimensionId: focus.id,
    focusDimensionName: focus.name,
    reasoning: template.replace("{title}", title),
    kind,
  };
}

/**
 * Pick the next course. If the learner's grundlagen score is below the
 * foundation threshold, always start with the KI-Führerschein. Otherwise route
 * to the weakest remaining dimension's course.
 */
export function recommend(
  result: KiCheckResult,
  locale: Locale = "de",
): KiCheckRecommendation {
  const dimensions = result.dimensions;
  const grundlagen = dimensions.find((d) => d.id === "grundlagen");

  if (grundlagen && grundlagen.normalizedScore < FOUNDATION_THRESHOLD) {
    return build(grundlagen, "foundation", locale);
  }

  // Grundlagen is solid enough: close the biggest remaining gap.
  const candidates = dimensions.filter((d) => d.id !== "grundlagen");
  const pool = candidates.length > 0 ? candidates : dimensions;
  const weakest = [...pool].sort((a, b) => {
    if (a.normalizedScore !== b.normalizedScore) {
      return a.normalizedScore - b.normalizedScore;
    }
    return PATH_ORDER[a.id] - PATH_ORDER[b.id];
  })[0];

  return build(weakest, "gap", locale);
}
