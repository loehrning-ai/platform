"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/* WeekInLife — "Dashboard in 30 Minuten". Toggles between manual workflow
 * and Claude-assisted, showing a staggered timeline of steps. */

type Mode = "before" | "after";

interface Step {
  readonly t: string;
  readonly title: string;
  readonly desc: string;
}

interface Flow {
  readonly label: string;
  readonly total: string;
  readonly subtotal: string;
  readonly accent: "muted" | "orange";
  readonly steps: readonly Step[];
}

const BEFORE: Flow = {
  label: "Der alte Weg",
  total: "≈ 8 Stunden",
  subtotal: "ein ganzer Arbeitstag",
  accent: "muted",
  steps: [
    { t: "09:00", title: "Anforderungen sammeln", desc: "Excel-Skizze, Screenshot vom alten Dashboard, 3 Slack-Threads durchgehen." },
    { t: "09:40", title: "Erste Query schreiben", desc: "SQL gegen das Data Warehouse. Schema-Doku rauskramen. Join findet nicht das richtige Feld." },
    { t: "10:30", title: "Widget bauen", desc: "Query in das BI-Tool kopieren. Chart-Typ wählen. Achsen beschriften. Farben setzen." },
    { t: "11:15", title: "Nächste Query …", desc: "Der Prozess wiederholt sich. Jede Query braucht ein eigenes Widget, eigenen Titel, eigene Filter." },
    { t: "13:30", title: "Copy-paste-copy-paste", desc: "Acht, zehn, zwölf Widgets. Titel-Tippfehler. Filter, die auf manchen Widgets greifen, auf anderen nicht." },
    { t: "15:45", title: "Layout aufräumen", desc: "Widgets in ein Raster ziehen. Eines ist zu groß, eines zu klein. Mobile-Ansicht ist zerschossen." },
    { t: "17:30", title: "Feedback-Runde", desc: "Manager sagt: »Kannst du noch Quartals-Vergleich dazu?« Drei Widgets müssen neu gebaut werden." },
  ],
};

const AFTER: Flow = {
  label: "Mit Claude + Notebook",
  total: "≈ 30 Minuten",
  subtotal: "vor dem ersten Kaffee-Refill",
  accent: "orange",
  steps: [
    { t: "09:00", title: "Briefing an Claude", desc: "»Ich brauche ein Dashboard für Supplier-Performance: Lead-Time, On-Time-Rate, Defect-Rate, nach Region.« 4 Sätze, kein SQL." },
    { t: "09:06", title: "Notebook entsteht", desc: "Claude generiert alle sechs Queries. Sauber dokumentiert, mit Kommentaren, als Notebook-Zellen. Du prüfst, nicht du schreibst." },
    { t: "09:14", title: "Queries verifizieren", desc: "Eine Zelle pro Query, Ergebnis direkt darunter. Zwei Zahlen wirken falsch. Eine Nachfrage, Claude korrigiert den Join." },
    { t: "09:22", title: "Dashboard generiert sich", desc: "Aus dem Notebook heraus baut Claude die App. Widget-Titel, Filter, Layout, alles konsistent. Ein Artefakt, keine Klick-Orgie." },
    { t: "09:28", title: "Feinschliff", desc: "»Mach den Regions-Filter global, nicht pro Widget.« 40 Sekunden später ist es gemacht. Im selben Notebook, reproduzierbar." },
    { t: "09:32", title: "Fertig. Share-Link raus.", desc: "Manager fragt nach Quartals-Vergleich. Du antwortest: »Moment.« Zwei Minuten später liegt es drin." },
  ],
};

export function AiNativeWeekInLife() {
  const [mode, setMode] = useState<Mode>("after");
  const active = mode === "before" ? BEFORE : AFTER;

  return (
    <SectionShell num="VI" label="Dashboard in 30 Minuten">
      <Eyebrow>Ein konkretes Beispiel</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Ein Dashboard. Zwei Welten.
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[720px] text-[17px] leading-[1.6] text-muted-foreground">
          Früher: ein ganzer Arbeitstag. Eine Query, ein Widget, ein Titel.
          Dann nochmal. Und nochmal. Heute: ein Briefing, ein Notebook, ein
          generiertes Dashboard. Vor dem Mittagessen fertig.
        </p>
      </FadeBlock>

      {/* Toggle */}
      <FadeBlock delay={2}>
        <div className="mt-10 inline-flex border border-border">
          {(["before", "after"] as const).map((m) => {
            const isActive = mode === m;
            const flow = m === "before" ? BEFORE : AFTER;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex min-w-[180px] flex-col items-start px-5 py-3 transition-colors",
                  isActive
                    ? m === "after"
                      ? "bg-brand-orange text-white"
                      : "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={isActive}
              >
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em]">
                  {m === "before" ? "Manuell" : "Mit Claude + Notebook"}
                </span>
                <span className="mt-1 font-mono text-[13px] font-bold tracking-[-0.01em]">
                  {flow.total}
                </span>
              </button>
            );
          })}
        </div>
      </FadeBlock>

      {/* Timeline */}
      <div className="mt-10">
        <div className="grid gap-6 border-t border-border py-6 md:grid-cols-[1fr_auto]">
          <div>
            <p
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.14em]",
                active.accent === "orange" ? "text-brand-orange" : "text-muted-foreground",
              )}
            >
              {active.label}
            </p>
            <p
              className={cn(
                "mt-2 font-mono font-bold tracking-[-0.02em]",
                active.accent === "orange" ? "text-brand-orange" : "text-foreground",
              )}
              style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}
            >
              {active.total}
            </p>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {active.subtotal}
            </p>
          </div>
          <div className="flex items-baseline gap-2 md:flex-col md:items-end">
            <span
              className={cn(
                "font-bold tracking-[-0.03em]",
                active.accent === "orange" ? "text-brand-orange" : "text-foreground",
              )}
              style={{ fontSize: "clamp(2.75rem, 5vw, 3.5rem)" }}
            >
              {active.steps.length}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              Schritte
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <m.ol
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative mt-6 border-l border-border pl-0"
          >
            {active.steps.map((step, i) => (
              <m.li
                key={`${mode}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_OUT_EXPO }}
                className="relative grid gap-2 pb-7 pl-8 md:grid-cols-[80px_1fr] md:gap-6"
              >
                {/* Dot on rail */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -left-[5px] top-1 block h-2.5 w-2.5 rounded-full border-2",
                    active.accent === "orange"
                      ? "border-brand-orange bg-background"
                      : "border-muted-foreground bg-background",
                  )}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {step.t}
                </span>
                <div>
                  <p className="text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </m.li>
            ))}
          </m.ol>
        </AnimatePresence>
      </div>

      {/* Diff footer */}
      <FadeBlock delay={3}>
        <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-3">
          {[
            { n: "16×", label: "schneller", sub: "vom Briefing bis zum Dashboard" },
            { n: "1", label: "Notebook", sub: "statt Copy-paste durch sechs Tabs" },
            { n: "0", label: "handgeschriebene Queries", sub: "Claude schreibt, du verifizierst" },
          ].map((item) => (
            <div key={item.label}>
              <span
                className="font-bold tracking-[-0.03em] text-brand-orange"
                style={{ fontSize: "clamp(2.25rem, 4vw, 3rem)" }}
              >
                {item.n}
              </span>
              <p className="mt-1 text-[15px] font-semibold text-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </FadeBlock>
    </SectionShell>
  );
}
