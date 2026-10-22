"use client";

import { useRef, useState } from "react";
import { cx } from "@/components/werk";
import type { Segment } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/core";

interface Props {
  /** Exactly the text that is shown, slots filled. */
  readonly text: string;
  readonly segments: readonly Segment[];
  readonly buttonLabel: string;
  /** Spoken after the button word, e.g. ": Antwort an den Kunden". */
  readonly spokenTarget: string;
  readonly copiedLabel: string;
  readonly selectedLabel: string;
  readonly lang?: string;
  readonly testId: string;
}

type Status = { readonly kind: "copied" | "selected"; readonly text: string } | null;

/**
 * A visible <pre> and a copy button. Copying copies exactly what is shown.
 * If the clipboard is refused, the text is selected so Ctrl+C works, and the
 * status says so. The status holds until the text changes.
 */
export function CopyBlock({
  text,
  segments,
  buttonLabel,
  spokenTarget,
  copiedLabel,
  selectedLabel,
  lang,
  testId,
}: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const current = status && status.text === text ? status.kind : null;

  const selectPre = () => {
    const pre = preRef.current;
    const selection = typeof window !== "undefined" ? window.getSelection() : null;
    if (!pre || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(pre);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setStatus({ kind: "copied", text });
    } catch {
      selectPre();
      setStatus({ kind: "selected", text });
    }
  };

  return (
    <div className="grid gap-2">
      <pre ref={preRef} className="w05-pre" lang={lang} data-copy-text={testId}>
        {segments.map((segment, index) => (
          <span
            key={`${index}-${segment.kind}`}
            className={cx(segment.kind === "filled" && "w05-fill", segment.kind === "slot" && "w05-slot-text")}
          >
            {segment.text}
          </span>
        ))}
      </pre>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          className="w05-btn w05-btn--plain w05-btn--small anti-btn"
          onClick={copy}
          data-copy-button={testId}
        >
          <CopyGlyph done={current === "copied"} />
          {buttonLabel}
          <span className="sr-only">: {spokenTarget}</span>
        </button>
        <p role="status" aria-live="polite" className="min-h-6 text-[0.9375rem] font-semibold" data-copy-status={testId}>
          {current === "copied" ? copiedLabel : current === "selected" ? selectedLabel : ""}
        </p>
      </div>
    </div>
  );
}

function CopyGlyph({ done }: { readonly done: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-4 shrink-0"
    >
      {done ? <path d="M4 10l4 4 8-8" /> : <path d="M7 3h10v10M3 7h10v10H3z" />}
    </svg>
  );
}
