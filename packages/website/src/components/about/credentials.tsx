"use client";

import { m } from "framer-motion";
import { BookOpen, GraduationCap } from "lucide-react";
import { fadeUp } from "@/lib/animations";

const credentials = [
  {
    icon: GraduationCap,
    title: "M.Sc. Informatik",
    subtitle: "FAU Erlangen-Nürnberg",
    detail:
      "Abschluss mit Auszeichnung, Deutschlandstipendium. Schwerpunkt Daten, Machine Learning und Software Engineering",
  },
  {
    icon: GraduationCap,
    title: "Internationale Ausbildung",
    subtitle: "Oxford ML Summer School · EELISA Pisa",
    detail: "NLP × Finance (Oxford) · Innovation Management (SSSA)",
  },
  {
    icon: BookOpen,
    title: "KI-Forschung",
    subtitle: "",
    detail: "Machine Learning in klinischen Studien und angewandter Datenanalyse",
    journals: [
      "Publikation: Journal of Evolutionary Intelligence (Healthcare-Podcasts, MaD Lab)",
      "Best Paper Award: Machine Learning in klinischen Studien",
    ],
  },
] as const;

export function Credentials() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="js-reveal"
        >
          <m.h2
            custom={0}
            variants={fadeUp}
            className="js-reveal text-2xl font-bold tracking-[-0.04em]"
          >
            Akademischer Hintergrund
          </m.h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {credentials.map((c, i) => {
              const Icon = c.icon;
              return (
                <m.div
                  key={c.title}
                  custom={i + 1}
                  variants={fadeUp}
                  className="js-reveal rounded-none border border-border/30 bg-card/30 p-6"
                >
                  <Icon size={20} className="text-brand-sand" />
                  <h3 className="mt-3 font-semibold text-foreground">
                    {c.title}
                  </h3>
                  {c.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.subtitle}
                    </p>
                  )}
                  {c.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.detail}
                    </p>
                  )}
                  {"journals" in c && c.journals && (
                    <ul className="mt-2 space-y-1">
                      {(c.journals as readonly string[]).map((j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-orange" />
                          {j}
                        </li>
                      ))}
                    </ul>
                  )}
                </m.div>
              );
            })}
          </div>
        </m.div>
      </div>
    </section>
  );
}
