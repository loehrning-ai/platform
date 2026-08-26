"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface FormState {
  kunde: string;
  projekt: string;
  budget: string;
  zeitraum: string;
}

const INITIAL: FormState = {
  kunde: "Fiktivwerk Beispiel GmbH (rein fiktiv)",
  projekt: "Wartungs-KI Produktionslinie",
  budget: "68000",
  zeitraum: "Juli-September 2026",
};

type StepState = "idle" | "running" | "done";

export default function WordDemo() {
  const { locale } = useDemoLocale();
  return locale === "en" ? <WordDemoEnglish /> : <WordDemoGerman />;
}

function WordDemoGerman() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [genStep, setGenStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormState | null>(
    null,
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsGenerating(true);
    setGenStep(0);

    if (reducedMotion) {
      setGenStep(4);
      setIsGenerating(false);
      return;
    }

    timersRef.current.push(setTimeout(() => setGenStep(1), 600));
    timersRef.current.push(setTimeout(() => setGenStep(2), 1200));
    timersRef.current.push(setTimeout(() => setGenStep(3), 1800));
    timersRef.current.push(
      setTimeout(() => {
        setGenStep(4);
        setIsGenerating(false);
      }, 2400),
    );
  }, [isGenerating, reducedMotion]);

  const fileName = useMemo(
    () =>
      `Projektbrief_${form.kunde.split(" ")[0]}_${new Date().toISOString().slice(0, 10)}.docx`,
    [form.kunde],
  );
  const generated = genStep === 4;

  const stepState = (threshold: number): StepState => {
    if (genStep >= threshold) return "done";
    if (isGenerating && genStep === threshold - 1) return "running";
    return "idle";
  };

  return (
    <div
      data-demo-id="word"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
      }}
    >
      <Overline>Word-Lab mit KI-Assistent</Overline>
      <h2
        style={{
          fontSize: "clamp(18px, 3.5vw, 22px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginTop: 4,
          lineHeight: 1.2,
        }}
      >
        Projektbriefe, die{" "}
        <span style={{ color: "var(--color-brand-orange)" }}>
          prüfbar bleiben.
        </span>
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* FORM PANEL — flex 1 1 260px, stacks above preview on narrow screens */}
        <div
          style={{
            flex: "1 1 260px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Overline>Eckdaten</Overline>
          {(
            [
              ["kunde", "Adressat"],
              ["projekt", "Projekt-Titel"],
              ["budget", "Rahmenwert"],
              ["zeitraum", "Zeitraum"],
            ] as const
          ).map(([k, l]) => {
            const focused = focusedField === k;
            return (
              <label
                key={k}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color: focused
                      ? "var(--color-brand-orange)"
                      : DEMO.schiefer,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    transition: reducedMotion ? "none" : "color 0.15s",
                  }}
                >
                  {l}
                </span>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  onFocus={() => setFocusedField(k)}
                  onBlur={() => setFocusedField(null)}
                  inputMode={k === "budget" ? "numeric" : undefined}
                  style={{
                    minHeight: 44,
                    background: DEMO.birke,
                    border: `1px solid ${focused ? DEMO.ink : DEMO.leinen}`,
                    boxShadow: focused ? `2px 2px 0 0 ${DEMO.ink}` : "none",
                    padding: "9px 11px",
                    fontFamily: k === "budget" ? DEMO.font.mono : "inherit",
                    fontSize: 12,
                    outline: "none",
                    color: DEMO.ink,
                    transition: reducedMotion
                      ? "none"
                      : "border-color 120ms, box-shadow 120ms",
                    width: "100%",
                    minWidth: 0,
                  }}
                />
              </label>
            );
          })}

          {/* Template card */}
          <div
            style={{
              padding: "8px 10px",
              background: DEMO.birke,
              border: `1px solid ${DEMO.leinen}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                background: "#2B579A",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              W
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: DEMO.ink,
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Projektbrief_Standard.docx
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: DEMO.schiefer,
                  marginTop: 1,
                }}
              >
                + 40 interne Dokumente als Stilreferenz
              </div>
            </div>
          </div>

          {/* Craftsman-style step indicators — vertical marks on a shared rail */}
          <div style={{ paddingTop: 6, paddingBottom: 2 }}>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Werkbank
            </div>
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
              }}
            >
              <Step
                state={stepState(1)}
                label="Stil-Abgleich mit 40 internen Dokumenten"
                reducedMotion={reducedMotion}
              />
              <Step
                state={stepState(2)}
                label="Claude Sonnet 4.6 · Entwurf"
                reducedMotion={reducedMotion}
              />
              <Step
                state={stepState(3)}
                label="Word-Export mit Vorlage"
                reducedMotion={reducedMotion}
                isLast
              />
            </ol>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              marginTop: 4,
              minHeight: 44,
              padding: "10px 14px",
              background: isGenerating
                ? DEMO.leinen
                : "var(--color-brand-orange)",
              color: isGenerating ? DEMO.schiefer : "#fff",
              border: `2px solid ${DEMO.ink}`,
              boxShadow: isGenerating ? "none" : `3px 3px 0 0 ${DEMO.ink}`,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: isGenerating ? "not-allowed" : "pointer",
              transition: reducedMotion
                ? "none"
                : "transform 0.12s, box-shadow 0.12s",
              width: "100%",
            }}
            onMouseDown={(e) => {
              if (reducedMotion || isGenerating) return;
              e.currentTarget.style.transform = "translate(2px, 2px)";
              e.currentTarget.style.boxShadow = `1px 1px 0 0 ${DEMO.ink}`;
            }}
            onMouseUp={(e) => {
              if (reducedMotion || isGenerating) return;
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = `3px 3px 0 0 ${DEMO.ink}`;
            }}
            onMouseLeave={(e) => {
              if (reducedMotion || isGenerating) return;
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = `3px 3px 0 0 ${DEMO.ink}`;
            }}
          >
            {isGenerating
              ? "Wird erstellt…"
              : generated
                ? "Neu erstellen"
                : "Projektbrief erstellen"}
          </button>
        </div>

        {/* WORD PREVIEW — flex 2 2 340px, takes more room on wide screens */}
        <div
          style={{
            flex: "2 2 340px",
            minWidth: 0,
            background: "white",
            border: `1px solid ${DEMO.ink}`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minHeight: 380,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              background: "#2B579A",
              color: "white",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              letterSpacing: "0.1em",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                background: "white",
                color: "#2B579A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              W
            </div>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {fileName}
            </span>
          </div>
          <div
            style={{
              padding: "22px clamp(18px, 4vw, 30px)",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              lineHeight: 1.5,
              color: "#222",
              flex: 1,
            }}
          >
            {!generated ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "40px 20px",
                  minHeight: 280,
                  color: "#999",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">
                  ↑
                </div>
                Eckdaten ausfüllen und{" "}
                <em
                  style={{
                    color: "var(--color-brand-orange)",
                    fontStyle: "normal",
                    fontWeight: 700,
                  }}
                >
                  Projektbrief erstellen
                </em>{" "}
                klicken.
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    fontFamily: DEMO.font.mono,
                    letterSpacing: "0.08em",
                  }}
                >
                  BEISPIELWERK GMBH · MUSTERSTRASSE 1 · 12345 MUSTERSTADT
                </div>
                <hr
                  style={{
                    margin: "10px 0",
                    borderTop: "1px solid #000",
                    borderRight: "none",
                    borderBottom: "none",
                    borderLeft: "none",
                  }}
                />
                <div style={{ marginTop: 14, fontSize: 12, color: "#555" }}>
                  {form.kunde}
                  <br />
                  z.Hd. Einkaufsleitung
                  <br />
                  <br />
                </div>
                <div
                  style={{ fontSize: 12, color: "#777", textAlign: "right" }}
                >
                  Berlin, {new Date().toLocaleDateString("de-DE")}
                </div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 16,
                    marginBottom: 10,
                  }}
                >
                  Projektbrief: {form.projekt}
                </h3>
                <p style={{ marginBottom: 10 }}>
                  Sehr geehrte Damen und Herren,
                </p>
                <p style={{ marginBottom: 10 }}>
                  anbei der neutrale Prüfstand zur{" "}
                  <strong>{form.projekt}</strong>, konzipiert für den Zeitraum{" "}
                  <strong>{form.zeitraum}</strong>.
                </p>
                <p style={{ marginBottom: 10 }}>
                  Unser Vorgehen folgt drei Phasen: Datenaufnahme, Pilotbetrieb,
                  Integration. Der grobe interne Rahmenwert liegt bei{" "}
                  <strong
                    style={{
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                    }}
                  >
                    {Number(form.budget || 0).toLocaleString("de-DE")} €
                  </strong>{" "}
                  als Planungsannahme. Keine Freigabe ohne Datenschutz- und
                  Fachreview.
                </p>
                <p
                  style={{
                    marginBottom: 10,
                    color: "#555",
                    fontSize: 12,
                    fontStyle: "italic",
                  }}
                >
                  […] weitere Abschnitte: Annahmen, Risiken, Datenquellen,
                  Freigaben.
                </p>
                <div style={{ marginTop: 14, fontSize: 12, color: "#555" }}>
                  Interne Notiz
                  <br />
                  <br />
                  <strong style={{ color: "#000" }}>Freigabe ausstehend</strong>
                  <br />
                  Review durch Fachbereich und Datenschutz
                </div>
              </div>
            )}
          </div>
          {generated && (
            <div
              style={{
                position: "absolute",
                top: 30,
                right: 8,
                background: "var(--color-brand-orange)",
                color: DEMO.kalk,
                padding: "3px 8px",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                letterSpacing: "0.12em",
                fontWeight: 700,
              }}
            >
              ◆ SIMULIERT
            </div>
          )}
        </div>
      </div>

      {/* Metric row — auto-fit keeps it 4-up on wide, 2-up on mid, 1-up on narrow */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {(
          [
            ["Erstellzeit", "4,2 s"],
            ["Manuell sonst", "≈ 3 h"],
            ["Stil-Treffer (Beispiel)", "96 %"],
            ["Review-Hinweis", "Pflicht"],
          ] as const
        ).map(([l, v]) => (
          <div
            key={l}
            style={{
              background: DEMO.kalk,
              borderTop: `1px solid ${DEMO.leinen}`,
              borderRight: `1px solid ${DEMO.leinen}`,
              borderBottom: `1px solid ${DEMO.leinen}`,
              borderLeft: `3px solid var(--color-brand-orange)`,
              padding: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {l}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 18,
                fontWeight: 700,
                color: DEMO.ink,
                marginTop: 3,
                letterSpacing: "-0.02em",
                visibility: generated ? "visible" : "hidden",
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const INITIAL_EN: FormState = {
  kunde: "Fictional Works Ltd (sample only)",
  projekt: "Maintenance assistant for production line",
  budget: "68000",
  zeitraum: "July to September 2026",
};

function WordDemoEnglish() {
  const [form, setForm] = useState<FormState>(INITIAL_EN);
  const [generated, setGenerated] = useState(false);
  const fileName = useMemo(
    () => `project-brief_${form.kunde.split(" ")[0].toLowerCase()}_sample.docx`,
    [form.kunde],
  );
  const fields = [
    ["kunde", "Recipient"],
    ["projekt", "Project title"],
    ["budget", "Planning amount"],
    ["zeitraum", "Period"],
  ] as const;

  return (
    <div
      data-demo-id="word"
      role="region"
      aria-label="Document drafting example"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: DEMO_HEIGHT,
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        <Overline>Document lab · editable sample</Overline>
        <h2
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(20px, 4vw, 28px)",
            lineHeight: 1.08,
          }}
        >
          Draft a project brief.{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            Keep the approval visible.
          </span>
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            maxWidth: 720,
            color: DEMO.schiefer,
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          The output is assembled from fixed browser templates. No Word file,
          Microsoft 365 tenant, or AI provider is contacted.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <section
          aria-label="Brief inputs"
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Overline>Brief inputs</Overline>
          {fields.map(([key, label]) => (
            <label key={key} style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: DEMO.schiefer,
                }}
              >
                {label}
              </span>
              <input
                value={form[key]}
                inputMode={key === "budget" ? "numeric" : undefined}
                onChange={(event) => {
                  setGenerated(false);
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }));
                }}
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: 44,
                  boxSizing: "border-box",
                  border: `1px solid ${DEMO.ink}`,
                  background: DEMO.birke,
                  color: DEMO.ink,
                  padding: "10px 11px",
                  font: "inherit",
                  fontSize: 12,
                }}
              />
            </label>
          ))}
          <div
            style={{
              display: "grid",
              gap: 6,
              padding: 10,
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.kalk,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
            }}
          >
            <span>01 · compare the sample style references</span>
            <span>02 · assemble a browser-only draft</span>
            <span>03 · mark the approval as pending</span>
          </div>
          <button
            type="button"
            onClick={() => setGenerated(true)}
            style={{
              minHeight: 44,
              border: `2px solid ${DEMO.ink}`,
              background: "var(--color-brand-orange)",
              color: "white",
              boxShadow: `3px 3px 0 ${DEMO.ink}`,
              padding: "10px 14px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {generated ? "Rebuild sample brief" : "Build sample brief"}
          </button>
        </section>

        <section
          aria-live="polite"
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${DEMO.ink}`,
            background: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              background: "#2B579A",
              color: "white",
              padding: "8px 10px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
            }}
          >
            <strong style={{ border: "1px solid white", padding: "1px 5px" }}>
              W
            </strong>
            <span style={{ overflowWrap: "anywhere" }}>{fileName}</span>
            <span style={{ marginLeft: "auto", opacity: 0.75 }}>simulated</span>
          </div>
          <div
            style={{
              flex: 1,
              padding: "clamp(18px, 5vw, 32px)",
              color: "#222",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              lineHeight: 1.62,
              overflowWrap: "anywhere",
            }}
          >
            {!generated ? (
              <div
                style={{
                  minHeight: 300,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  color: "#777",
                }}
              >
                Enter the brief inputs, then build the fixed sample document.
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  FICTIONAL WORKS · SAMPLE ADDRESS · NOT FOR DELIVERY
                </div>
                <hr
                  style={{
                    border: 0,
                    borderTop: "1px solid #222",
                    margin: "12px 0 20px",
                  }}
                />
                <div>
                  {form.kunde}
                  <br />
                  For the attention of: procurement review
                </div>
                <div
                  style={{ textAlign: "right", color: "#666", marginTop: 12 }}
                >
                  Berlin · sample dated 8 August 2026
                </div>
                <h3 style={{ margin: "18px 0 10px", fontSize: 16 }}>
                  Project brief: {form.projekt}
                </h3>
                <p>Dear review team,</p>
                <p>
                  This draft covers the proposed work for{" "}
                  <strong>{form.projekt}</strong> during{" "}
                  <strong>{form.zeitraum}</strong>.
                </p>
                <p>
                  The planning amount is{" "}
                  <strong>
                    €{Number(form.budget || 0).toLocaleString("en-GB")}
                  </strong>
                  . It is an assumption, not an approval or supplier offer.
                </p>
                <p>
                  Required before use: subject-matter review, data-protection
                  review, budget confirmation, and named ownership.
                </p>
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 10,
                    borderTop: "1px solid #ddd",
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                  }}
                >
                  <strong style={{ color: "#b45309" }}>APPROVAL PENDING</strong>
                  <br />
                  Human review required before export or delivery.
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({
  state,
  label,
  reducedMotion,
  isLast = false,
}: {
  state: StepState;
  label: string;
  reducedMotion: boolean;
  isLast?: boolean;
}) {
  const isDone = state === "done";
  const isRunning = state === "running";
  const accent =
    isDone || isRunning ? "var(--color-brand-orange)" : DEMO.leinen;
  const labelColor = isDone
    ? DEMO.ink
    : isRunning
      ? "var(--color-brand-orange)"
      : DEMO.schiefer;

  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        position: "relative",
        paddingBottom: isLast ? 0 : 10,
      }}
    >
      {/* Rail + tick column */}
      <div
        style={{
          position: "relative",
          width: 12,
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          paddingTop: 2,
        }}
      >
        {!isLast && (
          <span
            style={{
              position: "absolute",
              top: 14,
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              background: isDone ? "var(--color-brand-orange)" : DEMO.leinen,
              transition: reducedMotion ? "none" : "background 0.2s",
            }}
          />
        )}
        <span
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            border: `1.5px solid ${accent}`,
            background: isDone ? "var(--color-brand-orange)" : "transparent",
            transform: isRunning ? "rotate(45deg)" : "none",
            transition: reducedMotion
              ? "none"
              : "transform 0.2s, background 0.2s, border-color 0.2s",
            position: "relative",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: labelColor,
          letterSpacing: "0.08em",
          lineHeight: 1.4,
          fontWeight: isDone || isRunning ? 700 : 500,
          transition: reducedMotion ? "none" : "color 0.2s",
        }}
      >
        {label}
        {isRunning && !reducedMotion && (
          <span
            aria-hidden="true"
            style={{
              marginLeft: 6,
              display: "inline-block",
              width: 4,
              height: 10,
              background: "var(--color-brand-orange)",
              verticalAlign: "middle",
              animation: "demoBlink 0.9s steps(2, start) infinite",
            }}
          />
        )}
      </span>
      <style>{`
        @keyframes demoBlink {
          to { visibility: hidden; }
        }
      `}</style>
    </li>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: DEMO.font.mono,
        fontSize: 12,
        color: "var(--color-brand-orange)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}
