"use client";

import {
  ModuleOverview,
  type ModuleOverviewModule,
} from "@/components/lesson-engine/module-overview";
import type { Locale } from "@/lib/i18n/locale";

// Client half of the course hub (performance hardening): receives slim module
// summaries (ids, titles, durations) from the server page instead of
// importing `@/lib/course/data`, which would bundle the lesson JSON graph.
// KI und Gesellschaft runs on the lesson engine, so the hub is the shared
// ModuleOverview (progress rings per module, one continue action, the shared
// final-assessment pathway).

const COURSE_SLUG = "ki-und-gesellschaft" as const;

const HUB_COPY: Readonly<
  Record<Locale, { readonly tagline: string; readonly notice: string }>
> = {
  de: {
    tagline:
      "Jobschlagzeilen entschlüsseln, virale Videos prüfen, Detektoralarme nachrechnen und Fairness-Maße vergleichen. Jede Lektion hat eine Übung.",
    notice:
      "Lerninhalt mit erfundenen Fällen und synthetischen Daten. Kein Ersatz für Rechtsberatung oder die Prüfung eines konkreten Beschäftigungs- oder Diskriminierungsfalls.",
  },
  en: {
    tagline:
      "Decode jobs headlines, verify viral videos, work out detector alerts and compare fairness measures. Every lesson has an exercise.",
    notice:
      "Learning content with invented cases and synthetic data. It is not legal advice and does not assess a specific employment or discrimination case.",
  },
};

interface KursContentProps {
  readonly modules: readonly ModuleOverviewModule[];
  readonly locale?: Locale;
}

export function KursContent({ modules, locale = "de" }: KursContentProps) {
  const copy = HUB_COPY[locale];
  return (
    <ModuleOverview
      courseSlug={COURSE_SLUG}
      modules={modules}
      locale={locale}
      tagline={copy.tagline}
      notice={copy.notice}
    />
  );
}
