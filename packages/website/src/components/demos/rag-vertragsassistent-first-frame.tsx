"use client";

import { Fragment, type ReactNode } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useDemoLocale } from "./demo-locale";

/**
 * The contract assistant's opening frame, server-rendered as the engine's
 * `dynamic()` loading state (demo-component-registry.ts). The engine stays
 * client-only; this frame paints the answered example exchange the engine
 * opens on, with the band, so the answer (the page's largest text) is not
 * held back until the engine chunk has loaded and hydrated.
 *
 * It copies the engine's opening markup and styles (the header, the caption,
 * the question and the answer sheet in German; the caption, the question
 * chips, the index strip, the query and the answer in English), so the
 * answer sits where the engine will draw it, at the same size. The frame is
 * inert and hidden from assistive technology; a status names the load. Its
 * minimum height is the engine's own (measured per locale at 390px, 768px
 * and 1024px+), so nothing below the demo moves when the engine takes over.
 *
 * rag-vertragsassistent-first-frame.test.tsx holds these texts equal to the
 * engine's opening render.
 */

export const RAG_FIRST_FRAME_COPY = {
  de: {
    caption: "Die Suche vergleicht nur Schlüsselwörter und kann Treffer übersehen.",
    title: "Vertrags-Assistent",
    subtitle: "Keyword-Suche · 6 Beispieldokumente",
    question: "Wie ist die Kündigungsfrist?",
    answerLabel: "Keyword-Suche · 2 Quellen",
    answer:
      "Die Kündigungsfrist beträgt **3 Monate zum Quartalsende**. Bei Laufzeiten unter 12 Monaten gilt eine verkürzte Frist von 4 Wochen. Eine außerordentliche Kündigung ist bei wesentlicher Vertragsverletzung jederzeit möglich.",
    inlineSource: "Quelle: Rahmenvereinbarung v3.2, §12.3 Kündigung",
    termsPhone: "Treffer: ",
    termsLabel: "Gefundene Schlüsselwörter (Konfidenz = Anzahl Treffer): ",
    terms: ["Kündigung", "Kündigungsfrist", "Quartalsende"],
  },
  en: {
    caption: "Fixed keyword rules run in the browser; no model or document service is called.",
    questions: ["What is the notice period?", "What liability cap applies?", "Who may sign the agreement?"],
    strip: ["Local sample index", "6 sample documents", "no external connection"],
    queryLabel: "Query",
    answer:
      "The fictional framework agreement sets three months' notice to the end of a quarter. A material breach can trigger extraordinary termination after the stated cure process.",
    terms: ["termination", "notice", "quarter end"],
  },
} as const;

/** The engine's height once loaded, per locale: phone (390px), sm (768px), lg (1024px and up). */
const RESERVED_HEIGHT = {
  de: "min-h-[516px] sm:min-h-[567px] lg:min-h-[479px]",
  en: "min-h-[899px] sm:min-h-[620px]",
} as const;

function renderBold(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    chunk.startsWith("**") ? (
      <strong key={index} style={{ color: DEMO.ink }}>
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{chunk}</span>
    ),
  );
}

function GermanFrame() {
  const copy = RAG_FIRST_FRAME_COPY.de;
  return (
    <div style={{ display: "flex", flexDirection: "column", fontFamily: DEMO.font.sans, color: DEMO.ink }}>
      <div
        className="flex max-sm:hidden"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingBottom: 12,
          borderBottom: `1px solid ${DEMO.leinen}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              background: DEMO.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: DEMO.kalk,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            KI
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {copy.title}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {copy.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-none sm:max-h-[400px] sm:min-h-[280px]"
        style={{
          overflowY: "hidden",
          overflowWrap: "anywhere",
          padding: "12px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p className="text-caption" style={{ margin: 0, color: DEMO.schiefer, maxWidth: 520 }}>
          {copy.caption}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            className="text-[14px] sm:text-[13px]"
            style={{
              maxWidth: "85%",
              background: DEMO.ink,
              color: DEMO.kalk,
              padding: "9px 13px",
              lineHeight: 1.55,
              wordBreak: "break-word",
            }}
          >
            {copy.question}
          </div>
        </div>
        <div className="max-sm:max-w-full sm:max-w-[85%]" style={{ minWidth: 0 }}>
          <div style={{ ...DEMO.label, color: "#4f4640", marginBottom: 4 }}>{copy.answerLabel}</div>
          <div
            className="text-[14px] sm:text-[13px]"
            style={{
              background: DEMO.birke,
              padding: "11px 13px",
              lineHeight: 1.6,
              border: `1px solid ${DEMO.ink}`,
              wordBreak: "break-word",
            }}
          >
            {renderBold(copy.answer)}
          </div>
          <p className="text-[13px] sm:hidden" style={{ margin: "6px 0 0", color: "#4f4640", lineHeight: 1.45 }}>
            {copy.inlineSource}
          </p>
          <div
            className="text-[13px] [overflow-wrap:anywhere] sm:text-[12px]"
            style={{ marginTop: 6, fontFamily: "var(--font-geist-mono, ui-monospace, monospace)" }}
          >
            <span style={{ ...DEMO.label, color: "#4f4640" }}>
              <span className="sm:hidden">{copy.termsPhone}</span>
              <span className="max-sm:hidden">{copy.termsLabel}</span>
            </span>
            {copy.terms.map((term, index) => (
              <Fragment key={term}>
                {index > 0 ? <span style={{ color: "#4f4640" }}>{" · "}</span> : null}
                <b style={{ color: DEMO.ink, fontWeight: 700 }}>{term}</b>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnglishFrame() {
  const copy = RAG_FIRST_FRAME_COPY.en;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 0,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        <p className="text-caption text-muted-foreground" style={{ margin: 0, maxWidth: 720 }}>
          {copy.caption}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {copy.questions.map((label) => (
          <span
            key={label}
            className="text-[14px] sm:text-[12px]"
            style={{
              // A button centres its label in the 44px box; so does this.
              display: "inline-flex",
              alignItems: "center",
              boxSizing: "border-box",
              minHeight: 44,
              border: `1px solid ${DEMO.ink}`,
              background: DEMO.kalk,
              color: DEMO.ink,
              padding: "7px 10px",
              fontFamily: DEMO.font.mono,
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div style={{ border: `1px solid ${DEMO.ink}`, background: DEMO.kalk, minWidth: 0 }}>
        <div
          style={{
            ...DEMO.label,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: DEMO.ink,
            color: DEMO.kalk,
          }}
        >
          <span style={{ fontWeight: 700 }}>{copy.strip[0]}</span>
          <span>{copy.strip[1]}</span>
          <span style={{ marginLeft: "auto" }}>{copy.strip[2]}</span>
        </div>
        <div style={{ minHeight: 310, padding: "clamp(14px, 4vw, 24px)", minWidth: 0 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ borderTop: `2px solid ${DEMO.ink}`, paddingTop: 8 }}>
              <div style={{ ...DEMO.label, color: DEMO.schiefer }}>{copy.queryLabel}</div>
              <strong style={{ display: "block", marginTop: 4, overflowWrap: "anywhere" }}>{copy.questions[0]}</strong>
            </div>
            <p style={{ margin: 0, maxWidth: 800, fontSize: 14, lineHeight: 1.65 }}>{copy.answer}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {copy.terms.map((term) => (
                <span
                  key={term}
                  style={{
                    border: `1px solid ${DEMO.leinen}`,
                    background: DEMO.birke,
                    color: DEMO.ink,
                    padding: "3px 7px",
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                  }}
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RagVertragsassistentFirstFrame() {
  const { locale } = useDemoLocale();
  const english = locale === "en";
  return (
    <div className={RESERVED_HEIGHT[english ? "en" : "de"]} data-rag-first-frame="">
      <p role="status" aria-live="polite" className="sr-only">
        {DEMOS_PAGE_COPY[locale].shell.loading}
      </p>
      <div aria-hidden="true" inert>
        {english ? <EnglishFrame /> : <GermanFrame />}
      </div>
    </div>
  );
}
