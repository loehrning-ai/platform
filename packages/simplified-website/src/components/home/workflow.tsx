// No "use client": zero hooks/interactivity — plain static markup. Rendered
// as a Server Component from the (server) homepage page.tsx (performance
// hardening: keeps this out of the client JS bundle). Card + IconTile are
// server-safe (no hooks), so the warm styling adds no client JS here.
import { BookOpen, FileCheck2, Newspaper, Save } from "lucide-react";
import { Card, IconTile, type CardAccent } from "@/components/ui/card";

const steps: ReadonlyArray<{
  readonly num: string;
  readonly title: string;
  readonly body: string;
  readonly icon: typeof BookOpen;
  readonly accent: CardAccent;
}> = [
  {
    num: "01",
    title: "Kurs wählen",
    body: "Beginne mit KI-Führerschein, EU AI Act oder AI-Native Arbeit.",
    icon: BookOpen,
    accent: "kupfer",
  },
  {
    num: "02",
    title: "Fortschritt speichern",
    body: "Lektionen, Quiz, XP und Zertifikate hängen am Login.",
    icon: Save,
    accent: "sand",
  },
  {
    num: "03",
    title: "Material anwenden",
    body: "Lernbücher, Praxisbeispiele und Arbeitsvorlagen begleiten die Kursblöcke.",
    icon: FileCheck2,
    accent: "amber",
  },
];

export function Workflow() {
  return (
    <section
      className="relative scroll-mt-24 bg-background pt-16 pb-10 md:pt-20 md:pb-12"
      data-testid="workflow-section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end">
          <div>
            <p className="overline mb-4">Arbeitsweise</p>
            <h2
              className="text-balance font-bold leading-[1.02] tracking-[-0.035em] text-foreground"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              Ein Lernpfad.
              <br />
              <span className="text-muted-foreground">
                Kurs, Übung, Ressource.
              </span>
            </h2>
          </div>

          <p className="max-w-xl border-l-2 border-brand-orange/40 pl-4 text-sm leading-relaxed text-muted-foreground md:ml-auto">
            Die Plattform ist kein loses Archiv. Jeder Bereich hat eine Rolle:
            erst die Begriffe im Kurs, dann die Übung in der Demo, am Ende die
            Vorlage fürs eigene Team.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.num} accent={step.accent} className="min-h-[172px]">
              <div className="flex items-center justify-between">
                <IconTile icon={step.icon} accent={step.accent} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {step.num}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-[-0.02em] text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-kupfer-mist p-6 md:flex-row md:items-center">
          <IconTile icon={Newspaper} accent="kupfer" />
          <div className="md:flex md:flex-1 md:items-center md:justify-between md:gap-8">
            <span className="text-base font-bold tracking-[-0.02em] text-foreground">
              Im Blog: Der EU AI Act, erklärt für Nicht-Juristen
            </span>
            <span className="mt-2 block font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground md:mt-0 md:shrink-0">
              Risikoklassen · Zeitplan · deine Rechte · Primärquellen
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
