"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Check, CheckCircle2, Clock } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { getModules } from "@/lib/ai-native/data";
import { getCompletedLessonIds } from "@/lib/ai-native/progress";
import { subscribe } from "@/lib/progress/store";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function AiNativeModulesOverview() {
  const modules = getModules();
  const [completedLessonIds, setCompletedLessonIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    return subscribe(() => {
      setCompletedLessonIds(getCompletedLessonIds());
    });
  }, []);

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader
          eyebrow="Curriculum"
          heading="4 Module, 1 Denkweise"
          description="Alle vier Module kostenlos mit Lernkonto. Quiz und Teilnahmebestätigung gehören zum Kurs. Selbst-paced in 4-8 Wochen."
        />

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="js-reveal grid gap-6 sm:grid-cols-2"
        >
          {modules.map((mod, i) => {
            // Count via the lightweight module index + completed-ID prefix
            // match, so this client component no longer pulls the heavy
            // per-module lesson JSON into the bundle (shared course architecture).
            const totalLessons = mod.lessonCount;
            const completedCount = Array.from(completedLessonIds).filter((id) =>
              id.startsWith(`${mod.id}_lesson`),
            ).length;
            const pct =
              totalLessons === 0
                ? 0
                : Math.round((completedCount / totalLessons) * 100);
            const fullyComplete = totalLessons > 0 && completedCount === totalLessons;
            return (
              <Link
                key={mod.id}
                href={`/ai-native/kurs/${mod.id}`}
                prefetch={false}
                className="group"
              >
                <m.div
                  custom={i}
                  variants={fadeUp}
                  className={cn(
                    "js-reveal h-full rounded-none border p-6 transition-colors",
                    fullyComplete
                      ? "border-brand-orange/70 bg-brand-orange/5 group-hover:border-brand-orange"
                      : "border-border/50 bg-card/30 group-hover:border-brand-orange/40",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-none font-mono text-lg font-bold text-white",
                        fullyComplete ? "bg-risk-green" : "bg-brand-orange",
                      )}
                    >
                      {fullyComplete ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        mod.number
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {mod.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-none bg-card/60 px-2 py-0.5 text-xs text-muted-foreground">
                          {mod.subtitle}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {mod.durationMinutes} Min.
                        </span>
                        <span className="rounded-none bg-brand-sand/15 px-2 py-0.5 text-xs font-medium text-brand-sand">
                          Kostenlos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {completedCount > 0 && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
                        <span className="text-muted-foreground">Fortschritt</span>
                        <span className={cn(fullyComplete ? "text-risk-green" : "text-brand-orange")}>
                          {completedCount}/{totalLessons} · {pct}%
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden bg-border">
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "h-full",
                            fullyComplete ? "bg-risk-green" : "bg-brand-orange",
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <ul className="mt-4 space-y-2">
                    {mod.topics.slice(0, 4).map((topic) => (
                      <li
                        key={topic}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-brand-sand"
                        />
                        {topic}
                      </li>
                    ))}
                    {mod.topics.length > 4 && (
                      <li className="pl-6 text-xs italic text-muted">
                        + {mod.topics.length - 4} weitere Themen
                      </li>
                    )}
                  </ul>
                </m.div>
              </Link>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
