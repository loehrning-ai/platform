"use client";

import { useEffect, useRef, useState } from "react";

interface ComprehensionCheckProps {
  readonly id: string;
  readonly question: string;
  readonly criteria: readonly string[];
  readonly label: string;
  readonly responseLabel: string;
  readonly responsePlaceholder: string;
  readonly compareLabel: string;
  readonly hideLabel: string;
  readonly criteriaLabel: string;
  readonly sessionOnlyLabel: string;
}

export function ComprehensionCheck({
  id,
  question,
  criteria,
  label,
  responseLabel,
  responsePlaceholder,
  compareLabel,
  hideLabel,
  criteriaLabel,
  sessionOnlyLabel,
}: ComprehensionCheckProps) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = `check-${id}-content`;
  const headingId = `check-${id}-heading`;
  const responseId = `check-${id}-response`;
  const privacyId = `check-${id}-privacy`;
  const responseReady = response.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (typeof content?.scrollIntoView === "function") {
      content.scrollIntoView({ behavior: "instant", block: "end" });
    }
  }, [open]);

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--color-brand-orange)]"
    >
      <div className="px-3 pt-3 sm:px-5 sm:pt-4">
        <h2
          id={headingId}
          className="font-mono text-xs font-black uppercase tracking-[0.14em] text-brand-orange-dark"
        >
          {label}
        </h2>
        <p className="mt-1.5 max-w-[65ch] break-words text-[17px] font-black leading-[1.25] text-foreground [overflow-wrap:anywhere] sm:mt-2 sm:text-xl sm:leading-snug">
          {question}
        </p>
        <label
          htmlFor={responseId}
          className="mt-2 block font-mono text-xs font-black uppercase tracking-[0.1em] text-foreground"
        >
          {responseLabel}
        </label>
        <textarea
          id={responseId}
          name={`self-check-${id}-response`}
          autoComplete="off"
          rows={1}
          maxLength={400}
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          placeholder={responsePlaceholder}
          aria-describedby={privacyId}
          className="mt-1 min-h-11 w-full resize-y border border-foreground bg-background px-3 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
        />
        <p
          id={privacyId}
          className="mt-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
        >
          {sessionOnlyLabel}
        </p>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        disabled={!open && !responseReady}
        className="mt-3 flex min-h-11 w-full min-w-0 items-center justify-between gap-3 border-t border-foreground px-3 py-2.5 text-left font-mono text-xs font-black uppercase tracking-[0.08em] text-brand-orange-dark outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent sm:px-5 sm:tracking-[0.1em]"
      >
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {open ? hideLabel : compareLabel}
        </span>
        <span aria-hidden="true" className="shrink-0 text-[16px]">
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        ref={contentRef}
        id={contentId}
        hidden={!open}
        className="min-w-0 scroll-mb-3 border-t border-foreground bg-background px-3 py-3 sm:px-5 sm:py-4"
      >
        <h3 className="font-mono text-xs font-black uppercase tracking-[0.1em] text-brand-orange-dark">
          {criteriaLabel}
        </h3>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-[1.4] text-foreground">
          {criteria.map((criterion) => (
            <li key={criterion} className="flex min-w-0 gap-2">
              <span
                aria-hidden="true"
                className="shrink-0 text-brand-orange-dark"
              >
                →
              </span>
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                {criterion}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
