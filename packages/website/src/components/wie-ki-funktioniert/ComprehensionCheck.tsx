"use client";

import { useState } from "react";

interface ComprehensionCheckProps {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly label: string;
}

export function ComprehensionCheck({
  id,
  question,
  answer,
  label,
}: ComprehensionCheckProps) {
  const [open, setOpen] = useState(false);
  const contentId = `check-${id}-content`;

  return (
    <div className="my-6 min-w-0 border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-brand-orange hover:bg-background sm:px-5 sm:tracking-[0.1em]"
      >
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
          {label}
        </span>
        <span aria-hidden="true" className="shrink-0 text-[16px]">
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        id={contentId}
        hidden={!open}
        className="min-w-0 border-t border-border px-4 py-4 sm:px-5"
      >
        <p className="mb-3 break-words font-bold text-foreground [overflow-wrap:anywhere]">
          {question}
        </p>
        <p className="break-words text-[14px] leading-[1.6] text-muted-foreground [overflow-wrap:anywhere]">
          {answer}
        </p>
      </div>
    </div>
  );
}
