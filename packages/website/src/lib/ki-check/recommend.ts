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
    "„KI verstehen“ ist dein schwächstes Feld. Der Kurs „{title}“ behandelt Funktionsweise, Fehlertypen und Prüfung.",
  urteil:
    "„Kritisch einordnen“ ist dein schwächstes Feld. Der Kurs „{title}“ behandelt Deepfakes, Verzerrungen und Quellenprüfung.",
  recht:
    "„Regeln kennen“ ist dein schwächstes Feld. Der Kurs „{title}“ ordnet Rollen, Risikoklassen und Pflichten des AI Act ein.",
  verantwortung:
    "„Verantwortung tragen“ ist dein schwächstes Feld. Der Kurs „{title}“ behandelt Datenschutz, Transparenz und Nachweise.",
  praxis:
    "„In der Arbeit anwenden“ ist dein schwächstes Feld. Der Kurs „{title}“ zeigt eine Methode für Prompts, Werkzeuge und Prüfung.",
};

const FOUNDATION_REASONING =
  "Beginne mit den Grundlagen. Der Kurs „{title}“ setzt kein Vorwissen voraus und erklärt Funktionsweise, Fehlertypen, Datenschutz und das Prüfen von Ergebnissen.";

const GAP_REASONING_EN: Record<DimensionId, string> = {
  grundlagen:
    "“Understand AI” is your weakest field. {title} covers how AI works, typical errors and checks.",
  urteil:
    "“Judge outputs” is your weakest field. {title} covers deepfakes, bias and source checks.",
  recht:
    "“Know the rules” is your weakest field. {title} explains the AI Act's roles, risk classes and duties.",
  verantwortung:
    "“Work responsibly” is your weakest field. {title} covers data protection, transparency and records.",
  praxis:
    "“Apply AI at work” is your weakest field. {title} shows a method for prompts, tools and checks.",
};

const FOUNDATION_REASONING_EN =
  "Start with the basics. {title} needs no prior knowledge and covers how AI works, typical errors, data protection and checking output.";

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
