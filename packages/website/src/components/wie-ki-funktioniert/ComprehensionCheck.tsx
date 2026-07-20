"use client";

import { useState } from "react";

interface ComprehensionCheckProps {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export function ComprehensionCheck({ id, question, answer }: ComprehensionCheckProps) {
  const [open, setOpen] = useState(false);
  const contentId = `check-${id}-content`;

  return (
    <div className="my-6 border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand-orange hover:bg-background"
      >
        Kurze Selbstprüfung
        <span aria-hidden="true" className="ml-2 text-[16px]">
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        id={contentId}
        hidden={!open}
        className="border-t border-border px-5 py-4"
      >
        <p className="mb-3 font-bold text-foreground">{question}</p>
        <p className="text-[14px] leading-[1.6] text-muted-foreground">{answer}</p>
      </div>
    </div>
  );
}
