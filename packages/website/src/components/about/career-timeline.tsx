"use client";

import { m } from "framer-motion";
import { fadeUp } from "@/lib/animations";

// Frühere Arbeitgeber werden namentlich genannt; die rechtliche Einordnung
// übernimmt TIM_ENTITY.noEndorsementNotice auf der /ueber-mich-Seite.
const milestones = [
  {
    period: "2019-2022",
    role: "Data Scientist",
    company: "Apple",
    description: "Analytics, Datenmodelle und operative Auswertung",
    color: "text-muted-foreground",
  },
  {
    period: "2022-2024",
    role: "Data Scientist",
    company: "Red Bull",
    description: "KI-Tools für Fachbereiche, MLOps und Supply-Chain-Analytics",
    color: "text-muted-foreground",
  },
  {
    period: "2024-heute",
    role: "Data Engineer",
    company: "Meta",
    description: "Datenqualität, Pipelines und Analytics-Systeme",
    color: "text-muted-foreground",
  },
  {
    period: "2026-heute",
    role: "Kurator",
    company: "loehrning.ai",
    description: "Freie KI-Kurse, Bücher, Demos und Arbeitsnotizen",
    color: "text-brand-orange",
  },
] as const;

export function CareerTimeline() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
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
            Karriere
          </m.h2>

          {/* Desktop: horizontal 5-col — only at lg+ where 5 columns have room;
              tablet keeps the legible vertical list below (was cramped at md) */}
          <div className="mt-10 hidden lg:block">
            <div className="relative">
              {/* Line */}
              <div className="absolute left-0 right-0 top-4 h-px bg-border/50" />

              <div className="grid grid-cols-4 gap-4">
                {milestones.map((mil, i) => (
                  <m.div
                    key={mil.period}
                    custom={i + 1}
                    variants={fadeUp}
                    className="relative pt-10"
                  >
                    {/* Dot */}
                    <div className={`absolute top-2 left-0 h-4 w-4 rounded-full border-2 border-background ${
                      mil.company === "loehrning.ai" ? "bg-brand-orange" : "bg-border"
                    }`} />

                    <span className="text-xs font-medium text-muted-foreground">
                      {mil.period}
                    </span>
                    <h3 className={`mt-1 font-semibold ${mil.color}`}>
                      {mil.company}
                    </h3>
                    <p className="text-sm text-brand-orange">{mil.role}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {mil.description}
                    </p>
                  </m.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: vertical */}
          <div className="mt-8 space-y-6 lg:hidden">
            {milestones.map((mil, i) => (
              <m.div
                key={mil.period}
                custom={i + 1}
                variants={fadeUp}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${
                    mil.company === "loehrning.ai" ? "bg-brand-orange" : "bg-border"
                  }`} />
                  {i < milestones.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border/50" />
                  )}
                </div>
                <div className="pb-4">
                  <span className="text-xs text-muted-foreground">
                    {mil.period}
                  </span>
                  <h3 className={`font-semibold ${mil.color}`}>{mil.company}</h3>
                  <p className="text-sm text-brand-orange">{mil.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mil.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
