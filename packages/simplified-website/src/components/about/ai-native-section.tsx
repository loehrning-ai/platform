"use client";

import { m } from "framer-motion";
import { Bot, Eye, Zap } from "lucide-react";
import { fadeUp } from "@/lib/animations";

const principles = [
  {
    icon: Bot,
    title: "KI als Arbeitsumgebung",
    description:
      "KI beschleunigt Recherche, Analyse und Entwürfe. Entscheidend bleiben Prüfung, Quellenarbeit und nachvollziehbare Dokumentation.",
  },
  {
    icon: Eye,
    title: "Volle Transparenz",
    description:
      "Kein versteckter KI-Einsatz. Kurse, Demos und Vorlagen zeigen offen, wie KI-native Arbeit funktioniert.",
  },
  {
    icon: Zap,
    title: "Zeitgewinn fließt in Qualität",
    description:
      "Die durch KI gesparte Zeit geht in Dokumentation, Quellenprüfung und bessere Beispiele.",
  },
] as const;

export function AiNativeSection() {
  return (
    <section className="bg-card/20 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <m.h2
            custom={0}
            variants={fadeUp}
            className="text-2xl font-bold tracking-[-0.04em]"
          >
            KI-native Arbeit
          </m.h2>
          <m.p
            custom={1}
            variants={fadeUp}
            className="mt-2 text-muted-foreground"
          >
            Ich nutze KI, um Arbeit zu strukturieren, zu prüfen und
            verständlich zu dokumentieren.
          </m.p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {principles.map((p, i) => {
              const Icon = p.icon;
              return (
                <m.div
                  key={p.title}
                  custom={i + 2}
                  variants={fadeUp}
                  className="rounded-none bg-card/30 p-6"
                >
                  <Icon size={20} className="text-brand-orange" />
                  <h3 className="mt-3 font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                </m.div>
              );
            })}
          </div>
        </m.div>
      </div>
    </section>
  );
}
