"use client";

import { useMemo, useState, type JSX } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, Copy, EyeOff, RotateCcw, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface PiiSegment {
  readonly text: string;
  /** Present when the segment must be redacted: the reason shown in feedback. */
  readonly pii?: string;
}

export interface PiiRedactorProps extends LabBaseProps {
  /** Who wants to paste what, and for which purpose. */
  readonly scenario?: string;
  /** Graded sample, split into phrases. */
  readonly segments: readonly PiiSegment[];
  /** Offer a scratch pad that auto-detects patterns in the learner's own text. */
  readonly freeText?: boolean;
}

export interface PiiDetection {
  readonly start: number;
  readonly end: number;
  readonly type: string;
}

const PATTERNS: readonly { readonly type: string; readonly regex: RegExp }[] = [
  { type: "IBAN", regex: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g },
  { type: "E-Mail", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { type: "Telefon", regex: /(?:\+\d{1,3}[\s/-]?)?(?:\(0\)\s?)?\d{2,5}[\s/-]\d{3,}(?:[\s-]\d{2,})*/g },
  { type: "Datum", regex: /\b\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}\b/g },
  { type: "Schlüssel", regex: /\b(?:sk|pk|api|key|token)[-_][A-Za-z0-9_-]{8,}\b/gi },
];

/** Regex detections in free text, non-overlapping, sorted (exported for tests). */
export function detectPii(text: string): readonly PiiDetection[] {
  const hits: PiiDetection[] = [];
  for (const pattern of PATTERNS) {
    for (const match of text.matchAll(pattern.regex)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (hits.some((hit) => start < hit.end && end > hit.start)) continue;
      hits.push({ start, end, type: pattern.type });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

export function maskText(text: string, detections: readonly PiiDetection[]): string {
  let output = "";
  let cursor = 0;
  for (const hit of detections) {
    output += `${text.slice(cursor, hit.start)}[${hit.type}]`;
    cursor = hit.end;
  }
  return output + text.slice(cursor);
}

/** Grade a redaction (exported for tests). */
export function gradeRedaction(
  segments: readonly PiiSegment[],
  redacted: ReadonlySet<number>,
): { readonly missed: number[]; readonly over: number[]; readonly caught: number } {
  const missed: number[] = [];
  const over: number[] = [];
  let caught = 0;
  segments.forEach((segment, index) => {
    if (segment.pii && !redacted.has(index)) missed.push(index);
    if (segment.pii && redacted.has(index)) caught += 1;
    if (!segment.pii && redacted.has(index)) over.push(index);
  });
  return { missed, over, caught };
}

const COPY = {
  de: {
    region: "Schwärzen vor dem Einfügen",
    sample: "Text, der ins Tool soll",
    hint: "Tippe jede Angabe an, die für den Zweck nicht nötig ist. Nochmal tippen hebt die Schwärzung auf.",
    redacted: "geschwärzt",
    check: "Einfügen prüfen",
    again: "Nochmal",
    clean: "Sauber. Das kann in ein freigegebenes Tool.",
    missed: (n: number) => `${n} ${n === 1 ? "Angabe ist" : "Angaben sind"} noch offen.`,
    over: (n: number) => `${n} ${n === 1 ? "Stelle" : "Stellen"} unnötig geschwärzt: der Zweck braucht sie.`,
    outgoing: "So geht der Text raus",
    count: (caught: number, total: number) => `${caught} von ${total} sensiblen Angaben erfasst`,
    scratch: "Eigenen Text testen (bleibt in deinem Browser)",
    scratchHint: "Erkennt nur Muster wie E-Mail, Telefon, IBAN, Datum, Schlüssel. Namen, Gesundheitsdaten und Geschäftsgeheimnisse erkennt kein Muster sicher: die prüfst du selbst.",
    scratchLabel: "Eigener Text",
    found: (n: number) => `${n} Muster erkannt`,
    copyMasked: "Maskierten Text kopieren",
    copied: "Kopiert.",
  },
  en: {
    region: "Redact before you paste",
    sample: "Text that should go into the tool",
    hint: "Tap every detail the purpose does not need. Tap again to undo.",
    redacted: "redacted",
    check: "Check before pasting",
    again: "Again",
    clean: "Clean. This can go into an approved tool.",
    missed: (n: number) => `${n} ${n === 1 ? "detail is" : "details are"} still exposed.`,
    over: (n: number) => `${n} ${n === 1 ? "part was" : "parts were"} redacted needlessly: the purpose needs them.`,
    outgoing: "What leaves your desk",
    count: (caught: number, total: number) => `${caught} of ${total} sensitive details caught`,
    scratch: "Test your own text (stays in your browser)",
    scratchHint: "Only detects patterns such as e-mail, phone, IBAN, dates and keys. No pattern reliably detects names, health data or trade secrets: check those yourself.",
    scratchLabel: "Your text",
    found: (n: number) => `${n} patterns detected`,
    copyMasked: "Copy masked text",
    copied: "Copied.",
  },
} as const;

export function PiiRedactorWidget({
  scenario,
  segments,
  freeText = true,
  lessonId,
  cpId,
  locale,
  title,
}: PiiRedactorProps): JSX.Element {
  const copy = COPY[labLocale(locale)];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [redacted, setRedacted] = useState<ReadonlySet<number>>(() => new Set());
  const [checked, setChecked] = useState(false);
  const [scratch, setScratch] = useState("");
  const [copied, setCopied] = useState(false);

  const total = segments.filter((segment) => segment.pii).length;
  const grade = gradeRedaction(segments, redacted);
  const clean = grade.missed.length === 0 && grade.over.length === 0;
  const detections = useMemo(() => detectPii(scratch), [scratch]);

  const toggle = (index: number) => {
    setChecked(false);
    setRedacted((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const check = () => {
    setChecked(true);
    if (clean) complete();
  };

  const outgoing = segments
    .map((segment, index) => (redacted.has(index) ? `[${segment.pii ?? copy.redacted}]` : segment.text))
    .join("");

  return (
    <LabSurface label={copy.region} title={title}>
      {scenario ? <p className="mb-3 text-[15px] text-muted-foreground">{scenario}</p> : null}
      <p className="text-label text-muted-foreground">{copy.sample}</p>
      <div className="mt-2 rounded-2xl border border-lab-line bg-paper p-4 text-[16px] leading-[2.1] text-foreground shadow-lab-sm">
        {segments.map((segment, index) => {
          if (!segment.text.trim()) return <span key={index}>{segment.text}</span>;
          const isRedacted = redacted.has(index);
          const missed = checked && grade.missed.includes(index);
          const over = checked && grade.over.includes(index);
          return (
            <button
              key={index}
              type="button"
              aria-pressed={isRedacted}
              onClick={() => toggle(index)}
              data-segment-index={index}
              className={cn(
                "inline min-h-11 min-w-11 rounded-md px-1 py-1 text-left transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                isRedacted
                  ? "bg-lab-accent-soft text-lab-accent line-through decoration-2"
                  : "hover:bg-lab-accent-soft",
                missed && "bg-lab-bad-soft ring-2 ring-lab-bad",
                over && "ring-2 ring-ocker-tief",
              )}
            >
              {isRedacted ? (
                <>
                  <EyeOff className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  {segment.text}
                  <span className="sr-only"> ({copy.redacted})</span>
                </>
              ) : (
                segment.text
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{copy.hint}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <LabButton onClick={check}>
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          {copy.check}
        </LabButton>
        {checked ? (
          <LabButton
            tone="ghost"
            onClick={() => {
              setRedacted(new Set());
              setChecked(false);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {copy.again}
          </LabButton>
        ) : null}
      </div>

      <LabLive>
        <AnimatePresence initial={false}>
          {checked ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("mt-3 rounded-2xl px-4 py-3 text-[15px]", clean ? "bg-lab-good-soft" : "bg-lab-bad-soft")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <LabVerdictPill tone={clean ? "good" : "bad"}>{copy.count(grade.caught, total)}</LabVerdictPill>
              </div>
              {clean ? <p className="mt-2 font-semibold text-lab-good">{copy.clean}</p> : null}
              {grade.missed.length > 0 ? (
                <div className="mt-2">
                  <p className="font-semibold text-lab-bad">{copy.missed(grade.missed.length)}</p>
                  <ul className="mt-1 space-y-0.5 text-foreground">
                    {grade.missed.map((index) => (
                      <li key={index}>„{segments[index].text.trim()}“: {segments[index].pii}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {grade.over.length > 0 ? <p className="mt-2 text-lab-warn">{copy.over(grade.over.length)}</p> : null}
              <p className="mt-3 text-label text-muted-foreground">{copy.outgoing}</p>
              <p className="mt-1 rounded-xl bg-card p-3 font-mono text-[13px] leading-relaxed text-foreground">{outgoing}</p>
            </m.div>
          ) : null}
        </AnimatePresence>
      </LabLive>

      {freeText ? (
        <details className="mt-5 rounded-2xl border border-lab-line bg-card">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-foreground">
            {copy.scratch}
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <p className="text-xs text-muted-foreground">{copy.scratchHint}</p>
            <label className="block">
              <span className="text-sm font-semibold text-foreground">{copy.scratchLabel}</span>
              <textarea
                value={scratch}
                onChange={(event) => {
                  setScratch(event.target.value);
                  setCopied(false);
                }}
                rows={4}
                maxLength={4000}
                className="mt-1 min-h-11 w-full rounded-xl border border-lab-line bg-paper p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
              />
            </label>
            {scratch ? (
              <div>
                <p className="text-sm text-muted-foreground">{copy.found(detections.length)}</p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl bg-paper p-3 font-mono text-[13px] text-foreground">
                  {maskText(scratch, detections)}
                </p>
                <LabButton
                  tone="secondary"
                  className="mt-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(maskText(scratch, detections));
                      setCopied(true);
                    } catch {
                      setCopied(false);
                    }
                  }}
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? copy.copied : copy.copyMasked}
                </LabButton>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </LabSurface>
  );
}
