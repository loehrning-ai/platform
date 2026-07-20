"use client";

import { m, useReducedMotion } from "framer-motion";
import {
  FileSearch,
  Gift,
  Languages,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { EASE_OUT_EXPO as EASE } from "@/lib/animations";
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
    body: "Kein Abo, keine Paywall, kein verstecktes Verkaufsgespräch. Ein Konto brauchst du nur, wenn dein Fortschritt erhalten bleiben soll.",
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="scroll-mt-24 border-t border-border py-16"
      data-testid="platform-principles"
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="overline mb-8">Was dich hier erwartet</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((item, i) => (
            <m.div
              key={item.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
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
            </m.div>
          ))}
        </div>

        <m.div
          className="mx-auto mt-12 h-[2px] w-10 bg-brand-orange"
          initial={prefersReducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          style={{ transformOrigin: "left" }}
        />

        <m.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground"
        >
          Alles zum Lernen ist offen zugänglich. Ein Login schützt nur deinen
          persönlichen Bereich: dein Konto und deinen Fortschritt.
        </m.p>
      </div>
    </section>
  );
}
