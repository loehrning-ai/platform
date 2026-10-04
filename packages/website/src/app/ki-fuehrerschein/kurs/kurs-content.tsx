"use client";

import {
  ModuleOverview,
  type ModuleOverviewModule,
} from "@/components/lesson-engine/module-overview";
import type { Locale } from "@/lib/i18n/locale";

// Client half of the course hub (performance hardening): receives slim module
// summaries (ids, titles, durations) from the server page instead of
// importing `@/lib/course/data`, which would bundle the lesson JSON graph.
// KI-Führerschein runs on the lesson engine, so the hub is the shared
// ModuleOverview (progress rings per module, one continue action, the shared
// final-assessment pathway).

const COURSE_SLUG = "ki-fuehrerschein" as const;

const HUB_COPY: Readonly<
  Record<Locale, { readonly tagline: string; readonly notice: string }>
> = {
  de: {
    tagline:
      "Was ins KI-Tool darf, wie du so briefst, dass du prüfen kannst, und wie du Fehler findest, bevor sie rausgehen.",
    notice:
      "Lerninhalt zur KI-Kompetenz nach Artikel 4 der EU-KI-Verordnung. Kein Ersatz für Rechtsberatung oder die Regeln deiner Organisation.",
  },
  en: {
    tagline:
      "What may go into an AI tool, how to brief so you can check the result, and how to catch errors before they leave your desk.",
    notice:
      "Learning content on AI literacy under Article 4 of the EU AI Act. It does not replace legal advice or your organization's rules.",
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
