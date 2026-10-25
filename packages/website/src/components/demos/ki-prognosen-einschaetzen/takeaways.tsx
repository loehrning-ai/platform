"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import type { Takeaways } from "@/lib/demo-cases/ki-prognosen-einschaetzen/texts";

type CopyState = "idle" | "copied" | "failed";

const CONFIRM_MS = 1600;

/** execCommand fallback on a hidden, selected textarea (older iOS, blocked clipboard). */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText =
    "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

function CopyBlock({
  title,
  text,
  copy,
  children,
}: {
  readonly title: string;
  readonly text: string;
  readonly copy: DemoPack["takeaways"];
  readonly children: React.ReactNode;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const body = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const confirm = (next: CopyState) => {
    setState(next);
    window.clearTimeout(timer.current);
    if (next === "copied")
      timer.current = window.setTimeout(() => setState("idle"), CONFIRM_MS);
  };
  const fail = () => {
    if (body.current) window.getSelection()?.selectAllChildren(body.current);
    confirm("failed");
  };
  // The clipboard call is made synchronously inside the click (iOS gesture rule).
  const onCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => confirm("copied"),
        () => (legacyCopy(text) ? confirm("copied") : fail()),
      );
    } else if (legacyCopy(text)) confirm("copied");
    else fail();
  };

  return (
    <article className="hw-block" data-hw-block="">
      <div className="hw-block-head">
        <h3 className="hw-h3">{title}</h3>
        <button
          type="button"
          className="hw-btn hw-copy"
          data-state={state}
          onClick={onCopy}
        >
          {state === "copied"
            ? copy.copied
            : state === "failed"
              ? copy.selectCopy
              : copy.copy}
        </button>
      </div>
      <div ref={body} className="hw-block-body" data-hw-text="">
        {children}
      </div>
      <p className="hw-sr" role="status" aria-live="polite">
        {state === "copied" ? copy.copied : ""}
      </p>
    </article>
  );
}

export function TakeawayBlocks({
  copy,
  texts,
}: {
  readonly copy: DemoPack;
  readonly texts: Takeaways;
}) {
  const t = copy.takeaways;
  return (
    <section
      className="hw-takeaways"
      data-hw-takeaways=""
      aria-labelledby="hw-take-title"
    >
      <h2 id="hw-take-title" className="hw-h2">
        {t.heading}
      </h2>
      <div className="hw-blocks">
        <CopyBlock title={t.mailTitle} text={texts.mail} copy={t}>
          <p>{texts.mail}</p>
        </CopyBlock>
        <CopyBlock title={t.questionsTitle} text={texts.questions} copy={t}>
          <p>{t.questionsIntro}</p>
          <ol>
            {t.questions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </CopyBlock>
        <CopyBlock title={t.workingTitle} text={texts.working} copy={t}>
          <p>{texts.working}</p>
        </CopyBlock>
      </div>
    </section>
  );
}
