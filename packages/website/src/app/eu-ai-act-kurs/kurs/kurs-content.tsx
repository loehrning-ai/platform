"use client";

import {
  ModuleOverview,
  type ModuleOverviewModule,
} from "@/components/lesson-engine/module-overview";
import type { Locale } from "@/lib/i18n/locale";

// Client half of the course hub (performance hardening): receives slim module
// summaries (ids, titles, durations) from the server page instead of
// importing `@/lib/course/data`, which would bundle the lesson JSON graph.
// The EU AI Act course runs on the lesson engine, so the hub is the shared
// ModuleOverview (progress rings per module, one continue action, the shared
// final-assessment pathway).

const COURSE_SLUG = "eu-ai-act-kurs" as const;

const HUB_COPY: Readonly<
  Record<Locale, { readonly tagline: string; readonly notice: string }>
> = {
  de: {
    tagline:
      "Rolle bestimmen, Risikoklasse einordnen, Pflichtenliste erzeugen, Bußgeldrahmen rechnen und mit einem Inventareintrag starten.",
    notice:
      "Rechtsstand: Verordnung (EU) 2024/1689 in der durch die Verordnung (EU) 2026/1744 geänderten Fassung, zuletzt geprüft am 4. Oktober 2026. Kein Ersatz für Rechtsberatung oder eine fallbezogene Compliance-Prüfung.",
  },
  en: {
    tagline:
      "Determine your role, classify the use case, generate your obligation list, work out the fine range and start with an inventory entry.",
    notice:
      "Legal basis: Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744, last reviewed on 4 October 2026. Not legal advice or a case-specific compliance assessment.",
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
