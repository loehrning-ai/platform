"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import type { SampleId } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { NetLine } from "./net-line";

interface Props {
  readonly copy: DemoPack;
  readonly text: string;
  readonly sampleId: SampleId | null;
  readonly since: number | null;
  readonly onSample: (id: SampleId) => void;
  /** `bulk`: a paste or a fill, not a keystroke: the stage above must answer visibly. */
  readonly onText: (text: string, bulk: boolean) => void;
}

/**
 * A paste, a drop or a fill replaces or adds a run of characters; typing adds
 * one. Compared by the changed middle (common start and end stripped), so a
 * paste that is SHORTER than the text it replaces still counts: length alone
 * missed exactly the replace-the-sample case.
 */
export function isBulkEdit(previous: string, next: string): boolean {
  let start = 0;
  const limit = Math.min(previous.length, next.length);
  while (start < limit && previous[start] === next[start]) start += 1;
  let end = 0;
  while (end < limit - start && previous[previous.length - 1 - end] === next[next.length - 1 - end]) end += 1;
  const removed = previous.length - start - end;
  const added = next.length - start - end;
  return added > 1 || (removed > 1 && added > 0);
}

/**
 * Samples, the visitor's own text and the proof that it stays here. The
 * button reads the clipboard on the visitor's own tap (the one user-gesture
 * read; the text goes into this field and nowhere else). Where the browser
 * refuses, it readies the field and says to long-press: Ctrl+V works as ever.
 */
export function OwnText({ copy, text, sampleId, since, onSample, onText }: Props) {
  const ui = copy.own;
  const area = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState<"pasted" | "denied" | "empty" | null>(null);
  const pasted = useRef(false);
  return (
    <section className="w05-block" id="w05-own" aria-labelledby="w05-own-title">
      <header className="w05-block-head">
        <h2 id="w05-own-title" className="w05-h">{ui.heading}</h2>
        <span className="w05-badge">{ui.badge}</span>
      </header>

      <fieldset className="w05-chips-set">
        <legend className="w05-legend">{ui.samples}</legend>
        <div className="w05-segment" role="radiogroup" aria-label={ui.samples}>
          {copy.samples.map((sample) => (
            <label key={sample.id} className="w05-choice">
              <input
                type="radio"
                name="w05-sample"
                checked={sampleId === sample.id}
                onChange={() => onSample(sample.id)}
              />
              <span>{sample.chip}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="w05-btn"
        onClick={() => {
          const readText = navigator.clipboard?.readText?.bind(navigator.clipboard);
          const fallback = () => {
            area.current?.focus();
            area.current?.select();
            setNote("denied");
          };
          if (!readText) {
            fallback();
            return;
          }
          readText().then(
            (clip) => {
              if (clip.trim() === "") {
                setNote("empty");
                return;
              }
              setNote("pasted");
              onText(clip, true);
            },
            fallback,
          );
        }}
      >
        {ui.paste}
      </button>
      <p className="w05-hint" role="status">{note === "pasted" ? ui.pasteReady : note === "denied" ? ui.pasteDenied : note === "empty" ? ui.pasteEmpty : null}</p>

      <label className="w05-field">
        <span className="w05-field-label">{ui.textarea}</span>
        <textarea
          ref={area}
          value={text}
          rows={6}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          onPaste={() => {
            pasted.current = true;
          }}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            const next = event.currentTarget.value;
            // A paste, a fill or a drop changes many characters at once; typing changes one.
            const bulk = pasted.current || isBulkEdit(text, next);
            pasted.current = false;
            onText(next, bulk && next.trim() !== "");
          }}
        />
      </label>
      <p className="w05-hint">{ui.trainer}</p>
      <p className="w05-hint">{ui.offline}</p>
      <NetLine template={ui.net} pathsTemplate={ui.netPaths} since={since} />
    </section>
  );
}
