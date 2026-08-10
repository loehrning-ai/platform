"use client";

import Link from "next/link";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const PERSONA_COPY = {
  de: {
    label: "Direkte Kursempfehlungen nach Lernziel",
    prefix: "Ich möchte:",
    direct: "direkt zum Kurs",
    items: [
      { href: "/ki-fuehrerschein", label: "Alltag und sicherer Einsatz", course: "KI-Führerschein" },
      { href: "/ki-und-gesellschaft", label: "Deepfakes und Bias prüfen", course: "KI und Gesellschaft" },
      { href: "/eu-ai-act-kurs", label: "Pflichten und Risiken einordnen", course: "EU AI Act Kurs" },
      { href: "/ai-native", label: "KI-Arbeit strukturieren", course: "AI-Native Arbeitskurs" },
    ],
  },
  en: {
    label: "Direct course recommendations by learning objective",
    prefix: "I want to:",
    direct: "open course",
    items: [
      { href: "/ki-fuehrerschein", label: "Use AI safely at work", course: "AI Fundamentals" },
      { href: "/ki-und-gesellschaft", label: "Examine deepfakes and bias", course: "AI and Society" },
      { href: "/eu-ai-act-kurs", label: "Map obligations and risks", course: "EU AI Act Course" },
      { href: "/ai-native", label: "Structure AI-supported work", course: "AI-Native Work Course" },
    ],
  },
} as const;

export function PersonaCourseLinks({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = PERSONA_COPY[locale];

  return (
    <nav
      aria-label={copy.label}
      data-testid="persona-filter"
      className="mt-8 flex flex-wrap gap-3"
    >
      <span className="self-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {copy.prefix}
      </span>
      {copy.items.map((persona) => (
        <Link
          key={persona.href}
          href={localizeHref(persona.href, locale)}
          aria-label={`${persona.label}: ${copy.direct} ${persona.course}`}
          className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-tile transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-orange/40 hover:text-foreground focus-visible:border-brand-orange/40 focus-visible:text-foreground"
        >
          {persona.label}
          <span aria-hidden="true"> →</span>
        </Link>
      ))}
    </nav>
  );
}
