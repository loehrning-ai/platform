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

function Row({ copy, row }: { readonly copy: AppCopy; readonly row: ActivityRow }) {
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

/** The rows the depiction shows: calls the measurement refused (its own allowlist, not Claude's app) are left out and counted in the note. */
const shownRows = (rows: readonly ActivityRow[]) => rows.filter((row) => !row.denied);

function Activity({ copy, frame, running }: { readonly copy: AppCopy; readonly frame: AppFrame; readonly running: boolean }) {
  const [open, setOpen] = useState(false);
  const rows = shownRows(frame.rows);
  const steps = rows.filter((row) => TOOL_KINDS.has(row.kind)).length;
  const expanded = running || open;
  return (
    <div className="w4a-activity" data-running={running ? "" : undefined} data-w4a-activity="">
      <button type="button" className="w4a-act-head" aria-expanded={expanded} disabled={running} onClick={() => setOpen((value) => !value)} data-w4a-activity-toggle="">
        {running ? <span className="w4a-spark" aria-hidden="true" /> : <Icon name="chevron-down" size={14} />}
        <span>{running ? copy.activity.running : fill(copy.activity.done, { n: steps, time: clockLabel(frame.realMs) })}</span>
        {running ? <span className="w4a-timer">{clockLabel(frame.realMs)}</span> : null}
      </button>
      {expanded ? (
        <ul className="w4a-act-list">
          {(running ? rows.slice(-4) : rows).map((row, index) => (
            <Row key={`${row.realMs}-${index}`} copy={copy} row={row} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type Part = ReturnType<typeof citeParts>[number];

/**
 * Splits an answer into plain text and citations, with the word before each
 * citation and the punctuation after it moved into the citation's segment, so
 * the browser never breaks the line between them ("erfasst (" never ends a
 * line alone before the link). Pure; the text is unchanged when joined.
 */
export function citeSegments(parts: readonly Part[]): readonly { readonly lead: string; readonly part: Part; readonly tail: string }[] {
  const texts = parts.map((part) => part.text);
  const leads = parts.map(() => "");
  const tails = parts.map(() => "");
  parts.forEach((part, index) => {
    if (part.kind !== "cite") return;
    if (parts[index - 1]?.kind === "text") {
      const lead = /\S+\s*$/.exec(texts[index - 1] ?? "")?.[0] ?? "";
      leads[index] = lead;
      texts[index - 1] = (texts[index - 1] ?? "").slice(0, (texts[index - 1] ?? "").length - lead.length);
    }
    if (parts[index + 1]?.kind === "text") {
      const tail = /^[^\s\w]+/.exec(texts[index + 1] ?? "")?.[0] ?? "";
      tails[index] = tail;
      texts[index + 1] = (texts[index + 1] ?? "").slice(tail.length);
    }
  });
  return parts.map((part, index) => ({ lead: leads[index] ?? "", part: part.kind === "text" ? { ...part, text: texts[index] ?? "" } : part, tail: tails[index] ?? "" }));
}

/** Answer text with every citation of a project file as a link that opens the file at that line. */
function useCiteRenderer(files: readonly AppFile[], copy: AppCopy, onCite: (file: AppFile, cite: Citation) => void) {
  return useMemo(() => {
    const byName = new Map(files.filter((file) => file.text !== null).map((file) => [file.name, file]));
    const names = [...byName.keys()];
    return (text: string): ReactNode =>
      citeSegments(citeParts(text, names)).map(({ lead, part, tail }, index) => {
        const file = part.kind === "cite" ? byName.get(part.cite.file) : undefined;
        if (part.kind === "text" || !file) return <Fragment key={index}>{`${lead}${part.text}${tail}`}</Fragment>;
        const label = part.cite.from ? fill(copy.cite, { file: file.name, line: part.cite.from }) : fill(copy.citeFile, { file: file.name });
        return (
          <span key={index} className="w4a-nowrap">
            {lead}
            <button type="button" className="w4a-cite" onClick={() => onCite(file, part.cite)} data-w4a-cite={file.name}>
              {part.text}
              <span className="sr-only">, {label}</span>
            </button>
            {tail}
          </span>
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
  notes,
  produced,
  onDone,
  onCite,
  onChip,
  onProduced,
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
  /** How the recording was made, behind the recording line (the refused calls are counted here). */
  readonly notes: readonly string[];
  /** The file this turn created or updated, as Claude shows it under the answer. */
  readonly produced?: AppFile;
  readonly onDone: () => void;
  readonly onCite: (file: AppFile, cite: Citation) => void;
  readonly onChip: (file: AppFile) => void;
  readonly onProduced?: () => void;
}) {
  const frame = useTurnFrame(step, mode, reduced, onDone);
  const renderText = useCiteRenderer(files, copy, onCite);
  const attached = step.attach.map((path) => files.find((file) => file.path === path)).filter((file): file is AppFile => Boolean(file));
  const running = frame.phase !== "done";
  const refused = frame.rows.filter((row) => row.denied).length;
  const retried = refused === 0 ? [] : [refused === 1 ? copy.retriedOne : fill(copy.retried, { n: refused })];
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
      {!running && produced ? (
        <div className="w4a-produced" data-w4a-produced="">
          <FileChip file={produced} locale={locale} onOpen={onProduced} label={fill(copy.citeFile, { file: produced.name })} />
        </div>
      ) : null}
      {running ? null : (
        <div className="w4a-meta">
          <p className="w4a-meta-line">{meta}</p>
          {[...notes, ...retried].map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </article>
  );
});
