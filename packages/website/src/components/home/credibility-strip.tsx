import {
  FileSearch,
  Gift,
  Languages,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, IconTile, type CardAccent } from "@/components/ui/card";

const principles: ReadonlyArray<{
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly icon: LucideIcon;
  readonly accent: CardAccent;
}> = [
  {
    label: "Gratis",
    title: "Wirklich kostenlos",
    body: "Kein Abo, keine Paywall, kein verstecktes Verkaufsgespräch. Die vier deutschen Lernpfad-Kurse brauchen ein kostenloses Konto.",
    icon: Gift,
    accent: "kupfer",
  },
  {
    label: "Deutsch",
    title: "Für den Arbeitsalltag hier",
    body: "Geschrieben für Menschen im DACH-Raum, mit Beispielen aus echten Büros statt aus dem Silicon Valley.",
    icon: Languages,
    accent: "sand",
  },
  {
    label: "Belegt",
    title: "Jede Zahl hat eine Quelle",
    body: "Gesetzestexte, Studien, Primärquellen. Wo etwas nur eine Annahme ist, steht das auch dabei.",
    icon: FileSearch,
    accent: "amber",
  },
  {
    label: "Ehrlich",
    title: "Kein Marketing-Team",
    body: "Gebaut von Tim Löhr, Data Engineer. Findest du einen Fehler, schreib mir, dann wird er korrigiert.",
    icon: UserCheck,
    accent: "kupfer",
  },
];

export function CredibilityStrip() {
  return (
    <section
      className="scroll-mt-24 border-t border-border py-16"
      data-testid="platform-principles"
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="overline mb-8">Was dich hier erwartet</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((item) => (
            <div
              key={item.label}
              className="h-full"
            >
              <Card accent={item.accent} className="h-full gap-4">
                <div className="flex items-center gap-3">
                  <IconTile icon={item.icon} accent={item.accent} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                    {item.label}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {item.title}
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 h-[2px] w-10 bg-brand-orange" />

        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          Bücher, Demos, KI-Check und technische Vertiefungen sind öffentlich.
          Für die vier deutschen Lernpfad-Kurse brauchst du ein kostenloses Konto.
        </p>
      </div>
    </section>
  );
}
