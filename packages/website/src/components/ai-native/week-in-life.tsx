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
import type { Locale } from "@/lib/i18n/locale";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

/* A worked dashboard example. It compares process structure, not speed. */

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

const BEFORE_DE: Flow = {
  label: "Ad-hoc-Ablauf",
  total: "Nicht dokumentiert",
  subtotal: "Entscheidungen liegen in Dateien, Nachrichten und Einzelschritten",
  accent: "muted",
  steps: [
    { t: "01", title: "Anforderungen zusammentragen", desc: "Metriken, Screenshots und Gesprächsnotizen werden aus mehreren Quellen gesammelt." },
    { t: "02", title: "Abfragen einzeln erstellen", desc: "Jede Kennzahl wird separat umgesetzt; Annahmen und Join-Entscheidungen bleiben häufig implizit." },
    { t: "03", title: "Visualisierungen aufbauen", desc: "Filter, Achsen und Beschriftungen werden pro Diagramm konfiguriert." },
    { t: "04", title: "Änderungen nachziehen", desc: "Eine neue Anforderung muss in mehreren Abfragen und Diagrammen konsistent umgesetzt werden." },
  ],
};

const AFTER_DE: Flow = {
  label: "Dokumentierter Ablauf mit Claude",
  total: "Vier Prüfschritte",
  subtotal: "Briefing, Entwurf, fachliche Prüfung und freigegebene Änderung",
  accent: "orange",
  steps: [
    { t: "01", title: "Briefing und Kriterien festhalten", desc: "Kennzahlen, Datenquellen, Zielgruppe, Ausgabeformat und Prüfkriterien stehen im Notebook." },
    { t: "02", title: "Abfrageentwürfe erzeugen", desc: "Claude erstellt kommentierte Entwürfe. Schema, Filter und Annahmen bleiben neben dem Code sichtbar." },
    { t: "03", title: "Ergebnisse verifizieren", desc: "Stichproben, Kontrollsummen und bekannte Referenzwerte prüfen, ob Join und Aggregation stimmen." },
    { t: "04", title: "Freigegebenen Stand dokumentieren", desc: "Nur geprüfte Abfragen speisen das Dashboard. Spätere Änderungen laufen erneut durch dieselben Kontrollen." },
  ],
};

const BEFORE_EN: Flow = {
  label: "Ad hoc process",
  total: "Undocumented",
  subtotal: "Decisions are spread across files, messages and isolated steps",
  accent: "muted",
  steps: [
    { t: "01", title: "Collect requirements", desc: "Metrics, screenshots and meeting notes are gathered from several sources." },
    { t: "02", title: "Write queries separately", desc: "Each metric is implemented on its own; assumptions and join decisions often remain implicit." },
    { t: "03", title: "Build visualisations", desc: "Filters, axes and labels are configured for each chart." },
    { t: "04", title: "Propagate changes", desc: "A new requirement must be applied consistently across several queries and charts." },
  ],
};

const AFTER_EN: Flow = {
  label: "Documented Claude-assisted process",
  total: "Four review steps",
  subtotal: "Brief, draft, domain review and an approved change",
  accent: "orange",
  steps: [
    { t: "01", title: "Record the brief and criteria", desc: "Metrics, sources, audience, output format and review criteria are written in the notebook." },
    { t: "02", title: "Generate query drafts", desc: "Claude produces commented drafts. Schema choices, filters and assumptions remain visible beside the code." },
    { t: "03", title: "Verify the results", desc: "Samples, control totals and known reference values test whether joins and aggregations are correct." },
    { t: "04", title: "Document the approved state", desc: "Only reviewed queries feed the dashboard. Later changes pass through the same controls." },
  ],
};

function AiNativeWeekInLifeContent({ locale = "de" }: { readonly locale?: Locale }) {
  const [mode, setMode] = useState<Mode>("after");
  const isEnglish = locale === "en";
  const before = isEnglish ? BEFORE_EN : BEFORE_DE;
  const after = isEnglish ? AFTER_EN : AFTER_DE;
  const active = mode === "before" ? before : after;

  return (
    <SectionShell num="VI" label={isEnglish ? "Worked example" : "Arbeitsbeispiel"}>
      <Eyebrow>{isEnglish ? "A dashboard workflow" : "Ein Dashboard-Ablauf"}</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        {isEnglish ? "Same output. Different controls." : "Gleiches Ergebnis. Andere Kontrollen."}
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[720px] text-[17px] leading-[1.6] text-muted-foreground">
          {isEnglish
            ? "The example compares an ad hoc process with a documented, Claude-assisted process. It makes no speed or quality claim; the result depends on the data, task and review work."
            : "Das Beispiel vergleicht einen Ad-hoc-Ablauf mit einem dokumentierten, Claude-gestützten Ablauf. Es behauptet keinen Zeit- oder Qualitätsgewinn; das Ergebnis hängt von Daten, Aufgabe und Prüfung ab."}
        </p>
      </FadeBlock>

      {/* Toggle */}
      <FadeBlock delay={2}>
        <div className="mt-10 grid w-full grid-cols-2 border border-border sm:inline-grid sm:w-auto">
          {(["before", "after"] as const).map((m) => {
            const isActive = mode === m;
            const flow = m === "before" ? before : after;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex min-w-0 flex-col items-start px-3 py-3 text-left transition-colors sm:min-w-[180px] sm:px-5",
                  isActive
                    ? m === "after"
                      ? "bg-brand-orange text-white"
                      : "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={isActive}
              >
                <span className="break-words font-mono text-[10px] uppercase tracking-[0.1em] sm:text-[10.5px] sm:tracking-[0.14em]">
                  {m === "before"
                    ? isEnglish ? "Ad hoc" : "Ad hoc"
                    : isEnglish ? "Claude-assisted" : "Mit Claude"}
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
              {isEnglish ? "Steps" : "Schritte"}
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
            {
              n: "1",
              label: isEnglish ? "written brief" : "schriftliches Briefing",
              sub: isEnglish ? "scope, sources and acceptance criteria" : "Umfang, Quellen und Prüfkriterien",
            },
            {
              n: "2",
              label: isEnglish ? "review gates" : "Prüfpunkte",
              sub: isEnglish ? "technical checks and domain review" : "technische Prüfung und Fachprüfung",
            },
            {
              n: "1",
              label: isEnglish ? "reviewable notebook" : "prüfbares Notebook",
              sub: isEnglish ? "drafts, assumptions and results together" : "Entwürfe, Annahmen und Ergebnisse zusammen",
            },
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

export const AiNativeWeekInLife = withMotionProvider(AiNativeWeekInLifeContent);
