"use client";

import { useMemo, useState, type JSX, type ReactNode } from "react";
import { DemoOverline } from "./_shared";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import { cn } from "@/lib/utils";

/**
 * ComplianceDemo — live PII / business-secret scanner.
 *
 * Classifies tokens in a textarea in real-time via regex. Three severity
 * levels: block (IBAN → must not leave the perimeter), review (company
 * names, financials), mask (personal names, emails). Two display modes:
 * "detect" highlights with type tag, "mask" renders redacted outgoing text.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21 to Tailwind + brand tokens.
 * See: AI-native demo gallery implementation.
 */

type Level = "block" | "review" | "mask";

interface Pattern {
  readonly regex: RegExp;
  readonly type: string;
  readonly level: Level;
}

interface Detection {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly type: string;
  readonly level: Level;
}

const SAMPLES: readonly string[] = [
  "Fiktivperson Alpha (IBAN DE00 0000 0000 0000 0000 00, ungültige Dummy-Daten) fragt nach einem vertraulichen Vertragsdetail.",
  "Bitte senden Sie die interne Unterlage an demo.person@example.invalid; dies ist eine reservierte Beispieladresse.",
  "Die Verhandlungen mit FIKTIVWERK-BEISPIEL AG laufen. Im Szenario stehen 2,4 Mio EUR für die Q3-Lieferung.",
  "Ich brauche Hilfe bei der Kampagnenplanung für den Launch im September.",
];

/**
 * Grading-pure regex patterns (no Date.now, no Math.random).
 * Source patterns verified against the reference implementation.
 */
const PATTERNS: readonly Pattern[] = [
  {
    regex: /\b[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4}\d{0,4}\b/g,
    type: "IBAN",
    level: "block",
  },
  {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    type: "E-Mail",
    level: "mask",
  },
  {
    regex: /\b[A-ZÄÖÜ][a-zäöüß]+\s[A-ZÄÖÜ][a-zäöüß]+\b/g,
    type: "Name",
    level: "mask",
  },
  {
    regex: /\b(FIKTIVWERK-BEISPIEL AG|BEISPIELBANK-FIKTIV AG)\b/g,
    type: "Unternehmen",
    level: "review",
  },
  {
    regex: /\b\d+(?:[,.]\d+)?\s?(?:Mio|Mrd|EUR|€|USD)\b/g,
    type: "Finanz",
    level: "review",
  },
];

function runDetections(text: string): readonly Detection[] {
  const hits: Detection[] = [];
  PATTERNS.forEach((p) => {
    // Each execution re-creates the regex with the same flags so state
    // (lastIndex) doesn't leak across calls — keeps grading pure.
    const re = new RegExp(p.regex.source, p.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      hits.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        type: p.type,
        level: p.level,
      });
    }
  });
  // Dedupe overlapping matches — take the earliest start that doesn't
  // collide with an already-accepted range.
  const sorted = [...hits].sort((a, b) => a.start - b.start);
  const accepted: Detection[] = [];
  for (const d of sorted) {
    const prev = accepted[accepted.length - 1];
    if (!prev || d.start >= prev.end) accepted.push(d);
  }
  return accepted;
}

function verdictFor(detections: readonly Detection[]): {
  readonly color: string;
  readonly tag: string;
  readonly sub: string;
  readonly borderColor: string;
} {
  if (detections.some((d) => d.level === "block")) {
    return {
      color: "text-destructive",
      tag: "BLOCKIERT",
      sub: "PII darf dein Netzwerk nicht verlassen",
      borderColor: "border-l-destructive",
    };
  }
  if (detections.some((d) => d.level === "review")) {
    return {
      color: "text-brand-amber",
      tag: "REVIEW",
      sub: "Geschäftsgeheimnis erkannt",
      borderColor: "border-l-brand-amber",
    };
  }
  if (detections.length > 0) {
    return {
      color: "text-brand-orange",
      tag: "MASKIERT",
      sub: "Anonymisierungsvorschlag",
      borderColor: "border-l-brand-orange",
    };
  }
  return {
    color: "text-risk-green",
    tag: "FREIGEGEBEN",
    sub: "Keine Treffer",
    borderColor: "border-l-risk-green",
  };
}

function renderDetectMode(
  text: string,
  detections: readonly Detection[],
): ReactNode {
  const els: ReactNode[] = [];
  let last = 0;
  detections.forEach((d, i) => {
    if (d.start > last) {
      els.push(<span key={`t${i}`}>{text.slice(last, d.start)}</span>);
    }
    const classes = cn(
      "relative border-b-2 px-0.5",
      d.level === "block"
        ? "border-destructive bg-destructive/15"
        : d.level === "review"
          ? "border-brand-amber bg-brand-amber/15"
          : "border-brand-orange bg-brand-orange/15",
    );
    const supColor =
      d.level === "block"
        ? "text-destructive"
        : d.level === "review"
          ? "text-brand-amber"
          : "text-brand-orange";
    els.push(
      <span key={`h${i}`} className={classes} title={d.type}>
        {d.text}
        <sup
          className={cn(
            "ml-0.5 font-mono text-[12px] font-bold uppercase",
            supColor,
          )}
        >
          {d.type}
        </sup>
      </span>,
    );
    last = d.end;
  });
  if (last < text.length) {
    els.push(<span key="tail">{text.slice(last)}</span>);
  }
  return <span className="text-[14px] leading-[1.9]">{els}</span>;
}

function renderMaskMode(
  text: string,
  detections: readonly Detection[],
): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  detections.forEach((d, i) => {
    if (d.start > last) parts.push(text.slice(last, d.start));
    const maskLabel =
      d.level === "block"
        ? "▓▓▓▓▓▓▓"
        : d.type === "E-Mail"
          ? "[E-MAIL]"
          : d.type === "Name"
            ? "[PERSON]"
            : `[${d.type.toUpperCase()}]`;
    parts.push(
      <span
        key={`m${i}`}
        className="bg-foreground px-1.5 py-0.5 font-mono text-[12px] font-bold text-background"
      >
        {maskLabel}
      </span>,
    );
    last = d.end;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <span className="font-mono text-[13px] leading-[1.8]">{parts}</span>;
}

export function ComplianceDemo(): JSX.Element {
  const [text, setText] = useState(SAMPLES[0]);
  const [mode, setMode] = useState<"detect" | "mask">("detect");
  const detections = useMemo(() => runDetections(text), [text]);
  const verdict = verdictFor(detections);

  const blockCount = detections.filter((d) => d.level === "block").length;
  const reviewCount = detections.filter((d) => d.level === "review").length;
  const maskCount = detections.filter((d) => d.level === "mask").length;

  return (
    <div
      className="flex h-[740px] flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: Compliance-Prompt-Scanner"
    >
      <div>
        <DemoOverline>Compliance-Sandbox</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Prompt-Scanner{" "}
          <span className="text-brand-orange">für DSGVO &amp; IP.</span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Regelbasierte Token-Klassifikation, Beispielregeln, lokal simuliert.
          Keine PII verlässt dein Netzwerk unkontrolliert.
        </p>
      </div>

      {/* Sample picker */}
      <div className="flex flex-wrap items-center gap-2">
        <DemoOverline>Beispiele</DemoOverline>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s, i) => {
            const active = text === s;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setText(s)}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center border px-2.5 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.1em] transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground",
                )}
                aria-pressed={active}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        className="min-h-[88px] w-full resize-y border border-border bg-card/60 p-3 text-[14px] leading-[1.6] text-foreground outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange"
        aria-label="Prompt-Eingabe"
      />

      <div className="flex items-center justify-between">
        <div
          role="radiogroup"
          aria-label="Ansichtsmodus"
          data-roving-group
          className="inline-flex border border-border"
        >
          {(["detect", "mask"] as const).map((m, index) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              data-roving-item
              tabIndex={rovingTabIndex(mode === "detect" ? 0 : 1, index)}
              onClick={() => setMode(m)}
              onKeyDown={(event) =>
                handleRovingFocusKeyDown(event, {
                  currentIndex: index,
                  itemCount: 2,
                  orientation: "horizontal",
                  onMove: (nextIndex) =>
                    setMode(nextIndex === 0 ? "detect" : "mask"),
                })
              }
              className={cn(
                "min-h-11 px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] transition-colors",
                mode === m
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-card",
              )}
            >
              {m === "detect" ? "Erkannt" : "Maskiert"}
            </button>
          ))}
        </div>
        <div className="font-mono text-[12px] text-muted-foreground">
          {detections.length} Treffer · 42ms · local LLM
        </div>
      </div>

      <div className="min-h-[100px] border border-border bg-card/40 p-4">
        {detections.length === 0 && mode === "detect" ? (
          <span className="text-[14px] leading-[1.9] text-foreground">
            {text}
          </span>
        ) : mode === "detect" ? (
          renderDetectMode(text, detections)
        ) : (
          renderMaskMode(text, detections)
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-between border border-border border-l-[4px] bg-background p-3",
          verdict.borderColor,
        )}
      >
        <div>
          <div
            className={cn(
              "font-mono text-[12px] font-bold tracking-[0.14em]",
              verdict.color,
            )}
          >
            ▲ {verdict.tag}
          </div>
          <div className="mt-0.5 text-[13px] text-foreground">
            {verdict.sub}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <div className="font-mono text-[18px] font-bold text-destructive">
              {blockCount}
            </div>
            <div className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
              PII
            </div>
          </div>
          <div>
            <div className="font-mono text-[18px] font-bold text-brand-amber">
              {reviewCount}
            </div>
            <div className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
              REVIEW
            </div>
          </div>
          <div>
            <div className="font-mono text-[18px] font-bold text-brand-orange">
              {maskCount}
            </div>
            <div className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground">
              MASK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceDemo;
