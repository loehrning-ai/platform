// KI-Check — map a result to the next German core course.
//
// Deterministic, no side effects. Foundation first: if the basics are not yet
// solid, the KI-Führerschein is the entry point regardless of the other axes.
// Otherwise the check routes to the course that closes the biggest remaining
// gap, breaking ties along the learning path order.

import { getCatalogCourse } from "@/lib/courses/catalog";
import { courseFacts, type CourseAccent } from "@/lib/courses/tracks";
import type { CourseSlug } from "@/lib/course/types";
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
    "Beim Verstehen der KI-Grundlagen ist noch Luft. Der {title} legt genau dieses Fundament, Schritt für Schritt.",
  urteil:
    "Beim kritischen Einordnen von KI ist noch Luft, etwa bei Deepfakes und Verzerrungen. Der {title} schärft genau diesen Blick.",
  recht:
    "Bei den Regeln rund um KI ist noch Luft. Der {title} macht aus dem AI Act konkrete, verständliche Schritte.",
  verantwortung:
    "Beim sicheren, verantwortungsvollen Einsatz ist noch Luft. Der {title} zeigt dir Datenschutz, Transparenz und saubere Nachweise.",
  praxis:
    "In der täglichen Arbeit mit KI ist noch Luft. Der {title} bringt dir Methode in Prompting, Werkzeuge und Prüfung.",
};

const FOUNDATION_REASONING =
  "Bevor die Details kommen, lohnt sich ein festes Fundament. Der {title} erklärt KI von Grund auf, ohne Vorwissen, und passt genau zu deinem Start.";

function build(
  focus: DimensionResult,
  kind: RecommendationKind,
): KiCheckRecommendation {
  const slug = DIMENSION_COURSE[focus.id];
  const course = getCatalogCourse(slug);
  const meta = courseFacts(slug);

  const title = course?.title ?? "Kernkurs";
  const template =
    kind === "foundation" ? FOUNDATION_REASONING : GAP_REASONING[focus.id];

  return {
    slug,
    courseTitle: title,
    courseHref: course?.href ?? "/kurse",
    startHref: course?.startHref ?? "/kurse",
    badge: meta.badge,
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
export function recommend(result: KiCheckResult): KiCheckRecommendation {
  const dimensions = result.dimensions;
  const grundlagen = dimensions.find((d) => d.id === "grundlagen");

  if (grundlagen && grundlagen.normalizedScore < FOUNDATION_THRESHOLD) {
    return build(grundlagen, "foundation");
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

  return build(weakest, "gap");
}
