"use client";

import { useState } from "react";
import { TAKEAWAYS_ANCHOR } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/cases";
import { fill, type DemoText, type Takeaway } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import { CheckGlyph } from "./glyphs";
import { Rich } from "./rich";

/**
 * Copy with the async clipboard, falling back to a hidden textarea. The page
 * binds numbers to their units with no-break spaces; the clipboard gets plain
 * spaces, so a pasted test or prompt carries no invisible characters.
 */
export async function copyText(shown: string): Promise<boolean> {
  const text = shown.replace(/\u00a0/g, " ");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea fallback
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
    const ok = document.execCommand?.("copy") ?? false;
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function TakeawayCard({
  card,
  text,
  announce,
}: {
  readonly card: Takeaway;
  readonly text: DemoText;
  readonly announce: (message: string) => void;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const id = `dr3-take-${card.id}`;
  const onCopy = async () => {
    const ok = await copyText(card.text);
    setState(ok ? "copied" : "failed");
    announce(ok ? fill(text.liveCopied, { title: card.title }) : text.copyFailed);
  };
  return (
    <article className="dr3-take" aria-labelledby={`${id}-h`} data-takeaway={card.id}>
      <div className="dr3-take-head">
        <h3 id={`${id}-h`} className="dr3-h3">
          {card.title}
        </h3>
        <button
          type="button"
          className="dr3-btn dr3-btn-secondary dr3-copy anti-btn"
          onClick={onCopy}
          aria-describedby={`${id}-h`}
          data-copy={card.id}
        >
          {state === "copied" ? <CheckGlyph size={14} /> : null}
          {state === "copied" ? text.copied : text.copy}
        </button>
      </div>
      <pre className="dr3-take-text" data-copy-text={card.id}>
        {card.text}
      </pre>
      {state === "failed" ? <p className="dr3-copy-failed">{text.copyFailed}</p> : null}
      {card.example ? (
        <div className="dr3-take-example" data-example="">
          <span className="dr3-take-example-label">{card.example.label}</span>
          <Rich text={card.example.text} locale={text.locale} />
        </div>
      ) : null}
      {card.note ? <p className="dr3-take-note">{card.note}</p> : null}
    </article>
  );
}

/** Zum Mitnehmen: four copy cards, the same for everyone, shown in full. */
export function Takeaways({
  text,
  solved,
  announce,
}: {
  readonly text: DemoText;
  readonly solved: boolean;
  readonly announce: (message: string) => void;
}) {
  return (
    <section id={TAKEAWAYS_ANCHOR} aria-labelledby={`${TAKEAWAYS_ANCHOR}-h`} className="dr3-section" data-takeaways="">
      <h2 id={`${TAKEAWAYS_ANCHOR}-h`} tabIndex={-1} className="dr3-h2">
        {text.takeawaysH}
      </h2>
      {solved ? (
        <p className="dr3-closing" data-closing="">
          {text.closing}
        </p>
      ) : null}
      <p className="dr3-intro">{text.takeawaysIntro}</p>
      <div className="dr3-takeaways">
        {text.takeaways.map((card) => (
          <TakeawayCard key={card.id} card={card} text={text} announce={announce} />
        ))}
      </div>
      <p className="dr3-provenance" data-provenance="">
        {text.provenance}
      </p>
    </section>
  );
}
