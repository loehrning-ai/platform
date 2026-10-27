"use client";

import { useEffect, useState } from "react";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import type { AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { FileChip, Icon } from "./file-chip";

/** Typing speed of the depicted composer: fast, and never longer than TYPE_MAX_MS for a long prompt. */
const TYPE_CPS = 140;
const TYPE_MAX_MS = 1900;

/** How many characters of the prompt are typed after `elapsed` ms. */
export function typedLength(length: number, elapsed: number): number {
  const cps = Math.max(TYPE_CPS, (length * 1000) / TYPE_MAX_MS);
  return Math.min(length, Math.floor((elapsed / 1000) * cps));
}

/**
 * Claude's message box: the kit's prompt types itself in, the attached files
 * sit above it, and the visitor sends it. With nothing to send it shows the
 * placeholder and stays inert, as the real box does before you type.
 */
export function Composer({
  copy,
  locale,
  text,
  attach,
  model,
  reduced,
  onSend,
  typeKey,
}: {
  readonly copy: AppCopy;
  readonly locale: "de" | "en";
  /** The prompt to type, or null for an empty box. */
  readonly text: string | null;
  readonly attach: readonly AppFile[];
  readonly model: string;
  readonly reduced: boolean;
  readonly onSend: () => void;
  /** Typing starts again when this changes (a new step). */
  readonly typeKey: string;
}) {
  const [shown, setShown] = useState(reduced || !text ? (text?.length ?? 0) : 0);
  useEffect(() => {
    if (!text) return;
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = typedLength(text.length, now - start);
      setShown(next);
      if (next < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, text, typeKey]);

  const typing = text !== null && shown < text.length;
  const ready = text !== null && !typing;
  return (
    <div className="w4a-composer" data-ready={ready ? "" : undefined} data-w4a-composer="">
      {text && attach.length > 0 ? (
        <div className="w4a-chips" data-in-composer="">
          {attach.map((file) => (
            <FileChip key={file.path} file={file} locale={locale} />
          ))}
        </div>
      ) : null}
      <div className="w4a-input" role="region" aria-label={copy.ui.input} tabIndex={0} data-placeholder={text ? undefined : ""} aria-live="off">
        {text ? (
          <>
            {text.slice(0, shown)}
            {typing ? <span className="w4a-caret" aria-hidden="true" /> : null}
          </>
        ) : (
          copy.ui.reply
        )}
      </div>
      <div className="w4a-composer-row">
        <span className="w4a-tool" aria-hidden="true">
          <Icon name="plus" size={16} />
        </span>
        <span className="w4a-tool" aria-hidden="true">
          <Icon name="sliders" size={16} />
        </span>
        <span className="w4a-model" aria-hidden="true">
          {model}
          <Icon name="chevron-down" size={12} />
        </span>
        <button
          type="button"
          className="w4a-send"
          aria-label={copy.ui.send}
          disabled={text === null}
          onClick={() => {
            if (text) {
              setShown(text.length);
              onSend();
            }
          }}
          data-w4a-send=""
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}
