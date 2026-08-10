"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DemoOverline } from "./_shared";
import { useDemoLocale } from "@/components/demos/demo-locale";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * WordDemo — simulated Microsoft Word project-brief workflow.
 *
 * A four-field form produces a styled, reviewable sample brief from fictional
 * references. It does not connect to Word or internal documents.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface FormState {
  readonly kunde: string;
  readonly projekt: string;
  readonly budget: string;
  readonly zeitraum: string;
}

export function WordDemo(): JSX.Element {
  const { locale, text } = useDemoLocale();
  const [form, setForm] = useState<FormState>({
    kunde: text(
      "Fiktivwerk Beispiel GmbH (rein fiktiv)",
      "Fictitious Works Example Ltd (fictional)",
    ),
    projekt: text(
      "Wartungs-KI Produktionslinie",
      "Production-line maintenance AI",
    ),
    budget: "68000",
    zeitraum: text("Juli bis September 2026", "July to September 2026"),
  });
  const [generated, setGenerated] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  function generate() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setGenerated(false);
    setGenStep(1);
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.1 : 1;
    timers.current.push(setTimeout(() => setGenStep(2), 500 * scale));
    timers.current.push(setTimeout(() => setGenStep(3), 1000 * scale));
    timers.current.push(
      setTimeout(() => {
        setGenStep(0);
        setGenerated(true);
      }, 1500 * scale),
    );
  }

  const fields: readonly [keyof FormState, string, string][] = [
    [
      "kunde",
      text("Adressat", "Addressee"),
      text("Team oder Firma", "Team or company"),
    ],
    [
      "projekt",
      text("Projekttitel", "Project title"),
      text("Beschreibung…", "Description…"),
    ],
    ["budget", text("Rahmenwert", "Planning value"), "60000"],
    ["zeitraum", text("Zeitraum", "Period"), "Q3 2026"],
  ];
  const today = new Date().toLocaleDateString(
    locale === "en" ? "en-GB" : "de-DE",
  );
  const fileStub = form.kunde.split(" ")[0] || text("Kunde", "Customer");
  const iso = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label={text("Praxisbeispiel: Word", "Practice example: Word")}
    >
      <div>
        <DemoOverline>
          {text("Word-Dokumentenlabor", "Word document lab")}
        </DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          {text("Projektbriefe, die", "Project briefs that")}{" "}
          <span className="text-brand-orange">
            {text("prüfbar bleiben.", "remain reviewable.")}
          </span>
        </h3>
        <p className="mt-1.5 max-w-[620px] text-[13px] leading-[1.55] text-muted-foreground">
          {text(
            "Vier Eckdaten → Dokumententwurf mit Annahmen, Risiken, Datenquellen und Freigabevermerk. Nutzt Musterreferenzen, keine internen Dateien.",
            "Four inputs → a document draft with assumptions, risks, data sources, and approval status. It uses sample references, not internal files.",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Form */}
        <div className="flex flex-col gap-3">
          <DemoOverline>{text("Eckdaten", "Inputs")}</DemoOverline>
          {fields.map(([key, label, placeholder]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </span>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                maxLength={120}
                className="border border-border bg-card/60 px-3 py-2.5 text-[13px] text-foreground outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange"
              />
            </label>
          ))}
          <div className="flex items-center gap-2 border border-border bg-card/60 px-2.5 py-2">
            <div
              className="flex h-6 w-6 items-center justify-center text-[12px] font-black text-white"
              style={{ backgroundColor: "#2B579A" }}
            >
              W
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground">
                {text("Vorlage", "Template")}: Projektbrief_Standard.docx
              </div>
              <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                +{" "}
                {text(
                  "Musterreferenzen als Stilvorlage",
                  "sample references for style",
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={genStep > 0}
            className={cn(
              "border-2 border-foreground bg-brand-orange px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              genStep > 0
                ? "cursor-wait opacity-75"
                : "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]",
            )}
          >
            {genStep > 0
              ? text("◆ Entwurf wird erstellt…", "◆ Creating draft…")
              : generated
                ? text("↻ Neu erstellen", "↻ Create again")
                : text("▶ Projektbrief erstellen", "▶ Create project brief")}
          </button>
          {genStep > 0 && (
            <div className="font-mono text-[10px] leading-[1.8] tracking-[0.1em]">
              {[
                [1, text("Musterreferenzen lesen", "Read sample references")],
                [2, text("Modellaufruf · Entwurf", "Model call · draft")],
                [
                  3,
                  text("Word-Export mit Vorlage", "Word export with template"),
                ],
              ].map(([step, label]) => {
                const active = genStep >= (step as number);
                return (
                  <div
                    key={step}
                    className={cn(
                      active ? "text-brand-orange" : "text-muted-foreground",
                    )}
                  >
                    {active ? "✓" : "○"} {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Doc preview */}
        <div className="relative min-h-[440px] overflow-hidden border border-foreground bg-white">
          <div
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white"
            style={{ backgroundColor: "#2B579A" }}
          >
            <div
              className="flex h-4 w-4 items-center justify-center text-[11px] font-black"
              style={{ backgroundColor: "white", color: "#2B579A" }}
            >
              W
            </div>
            Projektbrief_{fileStub}_{iso}.docx
          </div>
          <div
            className="p-7 text-[11px] leading-[1.5] text-[#222]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <AnimatePresence mode="wait">
              {!generated ? (
                <m.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-20 text-center italic text-[#999]"
                >
                  {text(
                    "Wähle „Projektbrief erstellen“. Die Simulation fügt einen prüfbaren Entwurf ein.",
                    'Select "Create project brief". The simulation inserts a reviewable draft.',
                  )}
                </m.div>
              ) : (
                <m.div
                  key="doc"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                >
                  <div className="font-mono text-[9px] tracking-[0.08em] text-[#666]">
                    {text(
                      "MUSTERWERK GMBH · INTERNE PROJEKTNOTIZ",
                      "SAMPLE WORKS LTD · INTERNAL PROJECT NOTE",
                    )}
                  </div>
                  <hr className="my-2.5 border-t border-black" />
                  <div className="mt-3.5 text-[10px] text-[#555]">
                    {form.kunde}
                    <br />
                    {text(
                      "z. Hd. Einkaufsleitung",
                      "For the attention of procurement",
                    )}
                    <br />
                    <br />
                  </div>
                  <div className="text-right text-[10px] text-[#777]">
                    Berlin, {today}
                  </div>
                  <h4 className="mb-2.5 mt-4 text-[15px] font-bold">
                    {text("Projektbrief", "Project brief")}: {form.projekt}
                  </h4>
                  <p className="mb-2.5">
                    {text("Sehr geehrte Damen und Herren,", "Dear team,")}
                  </p>
                  <p className="mb-2.5">
                    {text(
                      "Dieser Entwurf sammelt die relevanten Annahmen zu",
                      "This draft records the relevant assumptions for",
                    )}{" "}
                    <strong>{form.projekt}</strong>,{" "}
                    {text("geplant für", "planned for")}{" "}
                    <strong>{form.zeitraum}</strong>.
                  </p>
                  <p className="mb-2.5">
                    {text(
                      "Der Beispielplan hat drei zu prüfende Phasen: (1) begrenzte Datenaufnahme, (2) Pilot mit Anomaliehinweisen und menschlicher Prüfung, (3) Entscheidung über eine mögliche MES-Integration. Der interne Rahmenwert ist mit",
                      "The sample plan has three phases to review: (1) bounded data collection, (2) a pilot with anomaly flags and human review, and (3) a decision on possible MES integration. The internal planning value is",
                    )}{" "}
                    <strong>
                      {Number(form.budget || 0).toLocaleString(
                        locale === "en" ? "en-GB" : "de-DE",
                      )}{" "}
                      €
                    </strong>{" "}
                    {text(
                      "als Annahme markiert. Keine Freigabe ohne Datenschutz-, Sicherheits- und Fachreview.",
                      "and is marked as an assumption. No approval without data-protection, security, and subject-matter review.",
                    )}
                  </p>
                  <p className="mb-2.5 text-[10px] italic text-[#555]">
                    {text(
                      "[…] weitere Abschnitte: Annahmen, Risiken, Datenquellen, Freigaben.",
                      "[…] further sections: assumptions, risks, data sources, approvals.",
                    )}
                  </p>
                  <div className="mt-4 flex gap-5 text-[10px] text-[#555]">
                    <div className="flex-1">
                      {text("Interne Notiz", "Internal note")}
                      <br />
                      <br />
                      <strong className="text-black">
                        {text("Freigabe ausstehend", "Approval pending")}
                      </strong>
                      <br />
                      {text(
                        "Review durch Fachbereich, Sicherheit und Datenschutz",
                        "Review by subject matter, security, and data protection",
                      )}
                    </div>
                    <div className="border-l border-[#ddd] pl-4 text-right">
                      <div className="text-[9px] text-[#888]">
                        {text("SEITE 1 VON 2", "PAGE 1 OF 2")}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
          {generated && (
            <m.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="absolute right-2 top-7 bg-brand-orange px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] text-white"
            >
              ◆ {text("SIMULATION", "SIMULATION")}
            </m.div>
          )}
        </div>
      </div>

      {generated && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-2 gap-2 md:grid-cols-4"
        >
          {[
            [
              text("Simulationsstatus", "Simulation status"),
              text("abgeschlossen", "complete"),
            ],
            [text("Quellenstatus", "Source status"), text("Muster", "samples")],
            [
              text("Behauptungsstatus", "Claim status"),
              text("ungeprüft", "unverified"),
            ],
            [text("Review", "Review"), text("erforderlich", "required")],
          ].map(([label, val]) => (
            <div
              key={label}
              className="border border-l-[3px] border-border border-l-brand-orange bg-background p-3"
            >
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </div>
              <div className="mt-1 font-mono text-[18px] font-bold tracking-[-0.02em] text-foreground md:text-[22px]">
                {val}
              </div>
            </div>
          ))}
        </m.div>
      )}
    </div>
  );
}

export default WordDemo;
