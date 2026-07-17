// No "use client": zero hooks/interactivity — plain static markup, rendered as
// a Server Component from the homepage (keeps it out of the client JS bundle).
// Card + IconTile are server-safe (no hooks).
//
// This is the ONE place the supporting resources live on the homepage. They
// used to be duplicated (once under the courses, once in the closing chips);
// now they sit here as a single compact set, lighter than the course cards so
// the courses stay the main event.
import {
  BookOpen,
  FileText,
  Github,
  GraduationCap,
  LayoutDashboard,
  Pencil,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, IconTile, type CardAccent } from "@/components/ui/card";

const resources: ReadonlyArray<{
  readonly label: string;
  readonly body: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly accent: CardAccent;
}> = [
  {
    label: "Blog",
    body: "Einordnungen zu KI und Recht, jede Aussage mit Primärquelle.",
    href: "/blog",
    icon: Pencil,
    accent: "kupfer",
  },
  {
    label: "Lernbücher",
    body: "Lesefassungen zum Nachschlagen, wenn ein Thema tiefer sitzen soll.",
    href: "/buecher",
    icon: BookOpen,
    accent: "amber",
  },
  {
    label: "Praxisbeispiele",
    body: "Interaktive Beispiele zum Durchklicken, statt Theorie auf Folien.",
    href: "/demos",
    icon: LayoutDashboard,
    accent: "sand",
  },
  {
    label: "Arbeitsvorlagen",
    body: "Fertige Vorlagen für Inventar, Richtlinien und Risikoeinschätzung.",
    href: "/vorlagen",
    icon: FileText,
    accent: "kupfer",
  },
  {
    label: "Workshops",
    body: "Live gebaute Arbeitsbeispiele mit Material zum Mitnehmen.",
    href: "/workshops",
    icon: Presentation,
    accent: "amber",
  },
  {
    label: "Open Source",
    body: "Werkzeuge und Projekte, offen auf GitHub. Wächst über die Zeit.",
    href: "/open-source",
    icon: Github,
    accent: "sand",
  },
];

export function Workflow() {
  return (
    <section
      id="ressourcen"
      className="relative scroll-mt-24 bg-background pt-16 pb-10 md:pt-20 md:pb-12"
      data-testid="ressourcen-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="overline mb-4">Ressourcen</p>
        <h2
          className="text-balance font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          Material zum Anwenden.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Neben den Kursen: zum Nachlesen, Ausprobieren und Übertragen ins eigene
          Team. Alles offen zugänglich, ohne Konto.
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((row) => (
            <Card
              key={row.label}
              href={row.href}
              accent={row.accent}
              className="h-full gap-3"
            >
              <div className="flex items-start gap-3">
                <IconTile icon={row.icon} accent={row.accent} />
                <div className="min-w-0">
                  <span className="text-base font-bold tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                    {row.label}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {row.body}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Honest progress/login note — showcases the account feature once. */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-kupfer-mist p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 md:items-center">
            <IconTile icon={GraduationCap} accent="kupfer" />
            <p className="text-sm leading-relaxed text-foreground">
              Mit einem kostenlosen Konto bleiben dein Fortschritt, deine
              Zertifikate und deine Kompetenzen erhalten, auch geräteübergreifend.
            </p>
          </div>
          <Link
            href="/konto"
            className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
          >
            Zum Konto &#8594;
          </Link>
        </div>
      </div>
    </section>
  );
}
