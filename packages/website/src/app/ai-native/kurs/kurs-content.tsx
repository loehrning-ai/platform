"use client";

import {
  ModuleOverview,
  type ModuleOverviewModule,
} from "@/components/lesson-engine/module-overview";
import type { Locale } from "@/lib/i18n/locale";

// Client half of the course hub: the shared ModuleOverview (progress rings
// per module, one continue action, the shared final-assessment pathway).

const HUB_COPY: Readonly<
  Record<Locale, { readonly tagline: string; readonly notice: string }>
> = {
  de: {
    tagline:
      "Messen, ob sich KI lohnt, Kontext und Rechte begrenzen, Quellen prüfen und einen Ablauf mit Freigabe testen. Unabhängig vom Werkzeug.",
    notice:
      "Übungen mit erfundenen Daten. Die Live-Übung nutzt ein echtes Modell, wenn verfügbar, sonst aufgezeichnete Beispiele. Kein Ersatz für Datenschutzberatung oder die Regeln deiner Organisation.",
  },
  en: {
    tagline:
      "Measure whether AI pays off, limit context and permissions, check sources and test a workflow with approval. Whatever the tool.",
    notice:
      "Exercises use invented data. The live exercise uses a real model when available, otherwise recorded examples. It does not replace data protection advice or your organization's rules.",
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
      courseSlug="ai-native"
      modules={modules}
      locale={locale}
      tagline={copy.tagline}
      notice={copy.notice}
      lessonLinks="segment"
    />
  );
}
