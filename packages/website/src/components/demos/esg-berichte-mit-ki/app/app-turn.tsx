"use client";

import { Fragment, memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MarkdownLite } from "@/components/demos/claude-scene/markdown-lite";
import { clockLabel } from "@/components/demos/claude-scene/replay-engine";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { AppFile, AppStepData } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { appFrameAt, buildAppSchedule, type ActivityRow, type AppFrame } from "@/lib/demo-cases/esg-berichte-mit-ki/app-replay";
import { citeParts, type Citation } from "@/lib/demo-cases/esg-berichte-mit-ki/citations";
import { FileChip, Icon } from "./file-chip";

export type TurnMode = "running" | "done";

/** The replay of one recorded turn on a shortened clock (requestAnimationFrame, never a timer). */
function useTurnFrame(step: AppStepData, mode: TurnMode, reduced: boolean, onDone: () => void): AppFrame {
  const schedule = useMemo(() => buildAppSchedule(step.turn), [step.turn]);
  const [t, setT] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  const live = mode === "running" && !reduced;
  useEffect(() => {
    if (mode !== "running") return;
    if (reduced) {
      done.current();
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      setT(elapsed);
      if (elapsed >= schedule.duration) {
        done.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, reduced, schedule]);
  return appFrameAt(schedule, live ? t : Number.POSITIVE_INFINITY);
}

const TOOL_KINDS = new Set(["skill", "read", "command", "write"]);

function rowText(copy: AppCopy, row: ActivityRow): string {
  const a = copy.activity;
  switch (row.kind) {
    case "thinking":
      return a.thinking;
    case "skill":
      return fill(a.skill, { name: row.detail });
    case "read":
      return /[*?]/.test(row.detail) ? fill(a.search, { name: row.detail }) : fill(a.read, { name: row.detail });
    case "write":
      return fill(a.write, { name: row.detail });
    case "command":
      return a.command;
    default:
      return row.detail;
  }
}

const ROW_ICON = { thinking: "info", skill: "check", read: "doc", command: "code", write: "doc" } as const;

function Row({ copy, row, first }: { readonly copy: AppCopy; readonly row: ActivityRow; readonly first: boolean }) {
  const [code, setCode] = useState(false);
  if (row.kind === "note") return <p className="w4a-act-note">{row.detail}</p>;
  return (
    <li className="w4a-act-row" data-kind={row.kind} data-w4a-act={row.kind}>
      <span className="w4a-act-icon">
        <Icon name={ROW_ICON[row.kind]} size={14} />
      </span>
      <span className="w4a-act-body">
        <span className="w4a-act-text">{rowText(copy, row)}</span>
        {row.kind === "command" && row.detail ? <code className="w4a-act-cmd">{row.detail}</code> : null}
        {row.kind === "thinking" && first ? <span className="w4a-act-hint">{copy.activity.thinkingNote}</span> : null}
        {row.denied ? <span className="w4a-act-hint">{copy.activity.denied}</span> : null}
        {row.failed ? <span className="w4a-act-hint">{copy.activity.failed}</span> : null}
        {row.code ? (
          <>
            <button type="button" className="w4a-link" aria-expanded={code} onClick={() => setCode((value) => !value)} data-w4a-code="">
              {code ? copy.activity.hideCode : copy.activity.showCode}
            </button>
            {code ? <pre className="w4a-code">{row.code}</pre> : null}
          </>
        ) : null}
      </span>
    </li>
  );
}

function Activity({ copy, frame, running }: { readonly copy: AppCopy; readonly frame: AppFrame; readonly running: boolean }) {
  const [open, setOpen] = useState(false);
  const steps = frame.rows.filter((row) => TOOL_KINDS.has(row.kind)).length;
  const expanded = running || open;
  const firstThinking = frame.rows.findIndex((row) => row.kind === "thinking");
  return (
    <div className="w4a-activity" data-running={running ? "" : undefined} data-w4a-activity="">
      <button type="button" className="w4a-act-head" aria-expanded={expanded} disabled={running} onClick={() => setOpen((value) => !value)} data-w4a-activity-toggle="">
        {running ? <span className="w4a-spark" aria-hidden="true" /> : <Icon name="chevron-down" size={14} />}
        <span>{running ? copy.activity.running : fill(copy.activity.done, { n: steps, time: clockLabel(frame.realMs) })}</span>
        {running ? <span className="w4a-timer">{clockLabel(frame.realMs)}</span> : null}
      </button>
      {expanded ? (
        <ul className="w4a-act-list">
          {(running ? frame.rows.slice(-4) : frame.rows).map((row, index, list) => (
            <Row key={`${row.realMs}-${index}`} copy={copy} row={row} first={!running && index === firstThinking && list === frame.rows} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Answer text with every citation of a project file as a link that opens the file at that line. */
function useCiteRenderer(files: readonly AppFile[], copy: AppCopy, onCite: (file: AppFile, cite: Citation) => void) {
  return useMemo(() => {
    const byName = new Map(files.filter((file) => file.text !== null).map((file) => [file.name, file]));
    const names = [...byName.keys()];
    return (text: string): ReactNode =>
      citeParts(text, names).map((part, index) => {
        if (part.kind === "text") return <Fragment key={index}>{part.text}</Fragment>;
        const file = byName.get(part.cite.file);
        if (!file) return <Fragment key={index}>{part.text}</Fragment>;
        const label = part.cite.from ? fill(copy.cite, { file: file.name, line: part.cite.from }) : fill(copy.citeFile, { file: file.name });
        return (
          <button key={index} type="button" className="w4a-cite" aria-label={label} onClick={() => onCite(file, part.cite)} data-w4a-cite={file.name}>
            {part.text}
          </button>
        );
      });
  }, [copy, files, onCite]);
}

/**
 * One turn of the chat: the visitor's message with its attached files, the
 * activity Claude recorded (thinking, the skill, files, code), and the answer,
 * streamed word for word from the recording, with tappable citations.
 */
export const AppTurn = memo(function AppTurn({
  step,
  files,
  copy,
  locale,
  mode,
  reduced,
  rising,
  meta,
  onDone,
  onCite,
  onChip,
}: {
  readonly step: AppStepData;
  readonly files: readonly AppFile[];
  readonly copy: AppCopy;
  readonly locale: "de" | "en";
  readonly mode: TurnMode;
  readonly reduced: boolean;
  /** The message has just been sent: it rises from the composer. */
  readonly rising: boolean;
  /** The recording line under a finished answer. */
  readonly meta: string;
  readonly onDone: () => void;
  readonly onCite: (file: AppFile, cite: Citation) => void;
  readonly onChip: (file: AppFile) => void;
}) {
  const frame = useTurnFrame(step, mode, reduced, onDone);
  const renderText = useCiteRenderer(files, copy, onCite);
  const attached = step.attach.map((path) => files.find((file) => file.path === path)).filter((file): file is AppFile => Boolean(file));
  const running = frame.phase !== "done";
  return (
    <article className="w4a-turn" data-w4a-turn={step.id} data-phase={frame.phase}>
      <div className="w4a-user" data-rising={rising && !reduced ? "" : undefined}>
        {attached.length > 0 ? (
          <div className="w4a-chips">
            {attached.map((file) => (
              <FileChip key={file.path} file={file} locale={locale} onOpen={() => onChip(file)} label={fill(copy.citeFile, { file: file.name })} />
            ))}
          </div>
        ) : null}
        <p className="w4a-bubble">{step.typed}</p>
      </div>
      {frame.phase === "sending" ? null : <Activity copy={copy} frame={frame} running={running && frame.phase !== "streaming"} />}
      {frame.answer ? (
        <div className="w4a-answer" data-w4a-answer="">
          <MarkdownLite source={frame.answer} streaming={running} renderText={renderText} />
        </div>
      ) : null}
      {running ? null : <p className="w4a-meta">{meta}</p>}
    </article>
  );
});
