"use client";

import { useEffect, useRef, useState } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { useEsg } from "./esg-context";
import { Refs } from "./refs";

/** Clipboard API first; a hidden textarea and execCommand as the fallback. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the fallback
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ text, copy, label }: { readonly text: string; readonly copy: EsgCopy; readonly label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="eb-copy-row">
      <button
        type="button"
        className="eb-copy"
        data-state={state}
        aria-label={`${state === "copied" ? copy.takeaways.copied : copy.takeaways.copy}: ${label}`}
        onClick={async () => {
          const ok = await writeClipboard(text);
          setState(ok ? "copied" : "failed");
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setState("idle"), 2400);
        }}
      >
        {state === "copied" ? copy.takeaways.copied : copy.takeaways.copy}
      </button>
      <span className={state === "failed" ? "eb-copy-status" : "sr-only"} aria-live="polite">
        {state === "failed" ? copy.takeaways.copyFailed : state === "copied" ? copy.takeaways.copied : ""}
      </span>
    </div>
  );
}

interface Props {
  readonly copy: EsgCopy;
  /** Checklist lines tied to today's misses (on screen only). */
  readonly marks: ReadonlySet<number>;
  readonly onRestart: () => void;
}

/**
 * Zum Mitnehmen: three exact texts with a copy button each. The copied text
 * is the same for everyone; "heute daneben" sits beside a line, outside the
 * copied text. Rendered from the first paint.
 */
export function Takeaways({ copy, marks, onRestart }: Props) {
  const t = copy.takeaways;
  const { takeaways: cards, checklist } = useEsg().pack;

  return (
    <section id="mitnehmen" className="eb-take" aria-labelledby="eb-take-h">
      <h2 id="eb-take-h" className="eb-h2">
        {t.heading}
      </h2>
      <p className="eb-take-sub">{t.sub}</p>
      <div className="eb-take-grid">
        {cards.map((card, index) => (
          <article key={t.titles[index]} className="eb-take-card" data-take={index + 1}>
            <div className="eb-take-head">
              <h3 className="eb-h3">{t.titles[index]}</h3>
              {card.fromKit ? <span className="eb-from-kit">{t.fromKit}</span> : null}
            </div>
            {index === 2 ? (
              <div className="eb-take-text eb-checklist" data-copy-source="">
                {/* The checklist title is the card heading; it stays in the copied text only. */}
                <ol className="eb-check-list">
                  {checklist.lines.map((line, lineIndex) => (
                    <li key={line} data-marked={marks.has(lineIndex + 1) ? "" : undefined}>
                      <span>
                        <Refs text={line} />
                      </span>
                      {marks.has(lineIndex + 1) ? <span className="eb-missed">{t.missed}</span> : null}
                    </li>
                  ))}
                </ol>
                <p className="eb-check-close">{checklist.close}</p>
              </div>
            ) : (
              <pre className="eb-take-text" data-copy-source="">
                <Refs text={card.text} />
              </pre>
            )}
            <p className="eb-take-note">{t.notes[index]}</p>
            <CopyButton text={card.text} copy={copy} label={t.titles[index] ?? ""} />
          </article>
        ))}
      </div>
      <p className="eb-privacy">{t.privacy}</p>
      <div className="eb-actions">
        <button type="button" className="eb-btn" onClick={onRestart}>
          {t.restart}
        </button>
      </div>
    </section>
  );
}
