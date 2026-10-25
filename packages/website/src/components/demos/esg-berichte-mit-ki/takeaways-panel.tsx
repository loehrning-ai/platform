"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Takeaway } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DemoPack, TakeawayId } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

/** Clipboard API first; a hidden textarea and execCommand when it is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // blocked by permissions or an insecure context: use the fallback below
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

type Feedback = { readonly id: TakeawayId; readonly ok: boolean } | null;

/** The text as it is shown: invoice numbers never break at a hyphen, and a mail's subject sits right above its body. */
function shown(id: TakeawayId, text: string): ReactNode {
  const flat = id === "mail" ? text.replace("\n\n", "\n") : text;
  return flat.split(/(EL-25-\d\d)/).map((part, index) =>
    index % 2 === 1 ? <span key={index} className="esg-nowrap">{part}</span> : part,
  );
}

/** The "which state do these lines describe" switch, shown once the bill is open. */
export interface TakeawayView {
  readonly value: "after" | "before";
  readonly onChange: (value: "after" | "before") => void;
}

/**
 * The three things to take away, shown in full before anything is copied.
 * Each block: its text, one 44 px copy button (full width on a phone), and a
 * "Kopiert" in a live region. A label in the anti colour says which state the
 * lines describe; once the bill is open a switch moves between "with the
 * bill" (12 of 12) and "before opening" (the template for a folder with a
 * gap). The sign switch changes the strip characters in all three.
 */
export function TakeawaysPanel({
  pack,
  items,
  ascii,
  onAscii,
  empty,
  note,
  view,
}: {
  readonly pack: DemoPack;
  readonly items: readonly Takeaway[];
  readonly ascii: boolean;
  readonly onAscii: (value: boolean) => void;
  readonly empty: boolean;
  /** Which series the lines describe. Null: no note. */
  readonly note: string | null;
  /** Present once the bill is open. */
  readonly view?: TakeawayView;
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(id: TakeawayId, text: string) {
    const ok = await copyText(text);
    setFeedback({ id, ok });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFeedback(null), 2200);
  }

  return (
    <section className="esg-take" aria-labelledby="esg-take-title">
      <h3 id="esg-take-title" className="esg-h">{pack.takeaways.title}</h3>
      {view && !empty ? (
        <>
          <div className="esg-seg esg-seg--wide" role="radiogroup" aria-label={pack.takeaways.title}>
            {(["before", "after"] as const).map((value) => (
              <label key={value} className="esg-seg__item">
                <input type="radio" name="esg-take-view" checked={view.value === value} onChange={() => view.onChange(value)} />
                <span>{pack.takeaways.view[value]}</span>
              </label>
            ))}
          </div>
          <p className="esg-take__tag" data-view={view.value} data-take-tag="">{pack.takeaways.tag[view.value]}</p>
        </>
      ) : null}
      {empty ? <p className="esg-take__empty">{pack.takeaways.ownEmpty}</p> : null}
      {empty || note === null ? null : <p className="esg-take__note" data-take-note="">{note}</p>}
      <div className="esg-take__blocks">
        {items.map((item) => {
          const disabled = empty || item.text === null;
          const own = feedback?.id === item.id ? feedback : null;
          return (
            <article key={item.id} className="esg-block" data-take={item.id}>
              <h4 className="esg-block__name">{pack.takeaways.names[item.id]}</h4>
              <p className="esg-block__text" data-disabled={disabled ? "" : undefined}>
                {empty ? "" : item.text === null ? pack.takeaways.nothingMissing : shown(item.id, item.text)}
              </p>
              <div className="esg-block__bar">
                <button
                  type="button"
                  className="esg-btn esg-btn--ink"
                  disabled={disabled}
                  onClick={() => item.text !== null && void copy(item.id, item.text)}
                >
                  {pack.takeaways.copy}
                </button>
                <span className="esg-block__done" role="status" aria-live="polite" data-ok={own?.ok ? "" : undefined}>
                  {own ? (own.ok ? pack.takeaways.copied : pack.takeaways.copyFailed) : ""}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="esg-take__notation">
        <p className="esg-sub">{pack.stripNotation}</p>
        <div className="esg-take__signs">
          <span id="esg-notation" className="esg-take__signs-label">{pack.takeaways.signs}</span>
          <div className="esg-seg esg-seg--small" role="radiogroup" aria-labelledby="esg-notation">
            {([false, true] as const).map((value) => (
              <label key={String(value)} className="esg-seg__item">
                <input type="radio" name="esg-notation" checked={ascii === value} onChange={() => onAscii(value)} />
                <span className="esg-seg__glyphs" aria-label={value ? "X ~ _" : "■ ▨ □"}>{value ? pack.takeaways.ascii : pack.takeaways.glyphs}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="esg-sub">{pack.takeaways.asciiNote}</p>
      </div>
      <p className="esg-take__why">{pack.takeaways.why}</p>
    </section>
  );
}
