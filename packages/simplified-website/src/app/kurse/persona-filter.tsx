import Link from "next/link";

/**
 * Direct course recommendations by learning goal. Lists all four native
 * Zertifikatskurse with their exact catalog titles so a learner can jump
 * straight to the course that matches what they want to do.
 */
const PERSONAS = [
  {
    href: "/ki-fuehrerschein",
    label: "Alltag und sicherer Einsatz",
    course: "KI-Führerschein",
  },
  {
    href: "/ki-und-gesellschaft",
    label: "Gesellschaft und Ethik verstehen",
    course: "KI und Gesellschaft",
  },
  {
    href: "/eu-ai-act-kurs",
    label: "Regeln und Einordnen",
    course: "EU AI Act Kurs",
  },
  {
    href: "/ai-native",
    label: "Aktiv mit KI arbeiten",
    course: "AI-Native Arbeitskurs",
  },
] as const;

export function PersonaCourseLinks() {
  return (
    <nav
      aria-label="Direkte Kursempfehlungen nach Lernziel"
      data-testid="persona-filter"
      className="mt-8 flex flex-wrap gap-3"
    >
      <span className="self-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Ich möchte:
      </span>
      {PERSONAS.map((persona) => (
        <Link
          key={persona.href}
          href={persona.href}
          aria-label={`${persona.label}: direkt zum Kurs ${persona.course}`}
          className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-tile transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-orange/40 hover:text-foreground focus-visible:border-brand-orange/40 focus-visible:text-foreground"
        >
          {persona.label}
          <span aria-hidden="true"> →</span>
        </Link>
      ))}
    </nav>
  );
}
