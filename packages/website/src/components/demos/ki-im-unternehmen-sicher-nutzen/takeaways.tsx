"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { joinSegments, type ReplayResult } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/redact";
import type { KeyEntry } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

/**
 * A visible block and a button that copies exactly what is shown. If the
 * clipboard is refused the text is selected instead and the button says so.
 */
function CopyBlock({
  text,
  label,
  name,
  copy,
  children,
}: {
  readonly text: string;
  readonly label: string;
  readonly name: string;
  readonly copy: DemoPack["take"];
  readonly children?: ReactNode;
}) {
  const pre = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "selected">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2600);
    return () => clearTimeout(timer);
  }, [status]);

  const select = () => {
    const node = pre.current;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      select();
      setStatus("selected");
    }
  };

  return (
    <div className="w05-copy">
      <pre ref={pre} className="w05-pre" tabIndex={0} role="group" aria-label={name}>{children ?? text}</pre>
      <button type="button" className="w05-btn w05-btn-primary" onClick={onCopy}>{label}</button>
      <p className="w05-copy-status" role="status" data-status={status}>
        {status === "copied" ? copy.copied : status === "selected" ? copy.selected : null}
      </p>
    </div>
  );
}

interface Props {
  readonly copy: DemoPack;
  readonly prompt: string;
  readonly note: string;
  readonly task: string;
  readonly answer: string;
  readonly replay: ReplayResult;
  readonly key_: readonly KeyEntry[];
  readonly onTask: (task: string) => void;
  readonly sampleAnswer: string;
  readonly onAnswer: (answer: string) => void;
}

export function Takeaways({ copy, prompt, note, task, answer, replay, key_, sampleAnswer, onTask, onAnswer }: Props) {
  const ui = copy.take;
  const restoredText = joinSegments(replay.segments);
  const list = (title: string, items: readonly string[]) =>
    items.length === 0 ? null : (
      <p className="w05-honest">
        <strong>{title}:</strong> {items.join(" ")}
      </p>
    );
  return (
    <section className="w05-block" id="w05-take" aria-labelledby="w05-take-title">
      <h2 id="w05-take-title" className="w05-h">{ui.heading}</h2>

      <div className="w05-take-part">
        <h3 className="w05-h3">{ui.promptTitle}</h3>
        <label className="w05-field">
          <span className="w05-field-label">{ui.task}</span>
          <textarea value={task} rows={3} placeholder={ui.taskPlaceholder} spellCheck={false} onChange={(event) => onTask(event.currentTarget.value)} />
        </label>
        <CopyBlock text={prompt} label={ui.promptCopy} name={ui.promptTitle} copy={ui} />
        <p className="w05-hint">{ui.promptNote}</p>
        <p className="w05-hint">{ui.byHand}</p>
      </div>

      <div className="w05-take-part">
        <h3 className="w05-h3">{ui.replayTitle}</h3>
        <label className="w05-field">
          <span className="w05-field-label">{ui.replayLabel}</span>
          <textarea value={answer} rows={5} spellCheck={false} autoComplete="off" onChange={(event) => onAnswer(event.currentTarget.value)} />
        </label>
        <p className="w05-hint">{ui.replayHint}</p>
        <button type="button" className="w05-btn w05-sample-answer" onClick={() => onAnswer(sampleAnswer)}>{ui.replaySample}</button>
        {answer.trim() === "" ? null : (
          <>
            <p className="w05-field-label">{ui.replayOut}</p>
            <p className="w05-legend-line">
              <mark className="w05-restored">{ui.restored}: {replay.restored}</mark>
            </p>
            <CopyBlock text={restoredText} label={ui.replayCopy} name={ui.replayOut} copy={ui}>
              {replay.segments.map((segment, index) =>
                segment.token ? (
                  <mark key={index} className="w05-restored" aria-roledescription={ui.restored}>{segment.text}</mark>
                ) : (
                  segment.text
                ),
              )}
            </CopyBlock>
            <p className="w05-hint">{ui.replayCopyNote}</p>
            {list(ui.notFound, replay.notFound)}
            {list(ui.unknown, replay.unknown)}
            {list(ui.ambiguous, replay.ambiguous)}
          </>
        )}
        <h4 className="w05-h4">{ui.keyTitle}</h4>
        {key_.length === 0 ? (
          <p className="w05-hint">{ui.keyEmpty}</p>
        ) : (
          <table className="w05-key">
            <tbody>
              {key_.map((row) => (
                <tr key={row.token}>
                  <th scope="row">{row.token}</th>
                  <td>{row.original}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="w05-take-part">
        <h3 className="w05-h3">{ui.noteTitle}</h3>
        <CopyBlock text={note} label={ui.noteCopy} name={ui.noteTitle} copy={ui} />
      </div>
    </section>
  );
}
