"use client";

import { useMemo, useState, type ReactNode } from "react";
import { revealIfOffscreen } from "@/components/demos/shell";
import { GlasButton, GlasChip, GlasSegmented } from "@/components/demos/glas";
import { MAX_ANSWER, parseClaudeAnswer } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-answer";
import { tally, type Tally } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { probeAnswer, probeSummary, type ProbeMark } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/probe";
import { CopyButton } from "./copy-button";
import type { Fmt } from "./fmt";

/** One recorded take as the probe needs it (built on the server from claude-runs). */
export interface ProbeTake {
  readonly id: string;
  /** "26. Oktober 2026" / "26 October 2026", from the recording. */
  readonly recordedOn: string;
  /** "Claude Opus 5.5". */
  readonly model: string;
  readonly prompt: string;
  readonly text: string;
}

export interface ProbeQuestion {
  readonly id: string;
  readonly label: string;
  readonly withSkill: ProbeTake | null;
  readonly withoutSkill: ProbeTake | null;
}

export type ProbeSource = "recorded" | "own";

export interface ClaudeProbeState {
  readonly question: string;
  readonly skill: "with" | "without";
  readonly source: ProbeSource;
}

/** The count of statuses in an answer with one status for each of the eight requests, else null. */
export function answerTally(text: string): Tally | null {
  const rows = parseClaudeAnswer(text).filter((row) => row.status !== null);
  if (rows.length !== 8) return null;
  return tally(rows.map((row) => ({ status: row.status as NonNullable<typeof row.status> })));
}

function markSentence(fmt: Fmt, mark: ProbeMark): string {
  const { copy } = fmt;
  if (mark.check.kind === "found") return fmt.t(copy.claude.found, { file: mark.check.file, line: mark.line ?? "" });
  if (mark.check.kind === "similar") return fmt.t(copy.claude.similar, { file: mark.check.file, share: fmt.t(copy.claude.percent, { n: Math.round(mark.check.share * 100) }) });
  return copy.claude.missing;
}

/** The answer text with our marks: found quotes underlined, similar dashed, missing wavy. */
function MarkedText({ text, marks }: { readonly text: string; readonly marks: readonly ProbeMark[] }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [index, mark] of marks.entries()) {
    if (mark.start < at) continue;
    parts.push(text.slice(at, mark.start));
    parts.push(
      <mark key={index} className="w05-mark" data-kind={mark.check.kind}>
        {text.slice(mark.start, mark.end)}
      </mark>,
    );
    at = mark.end;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}

/**
 * Scene 5 on the stage, the Zitat-Probe: the recorded answer of Claude to
 * the same twelve files, with and without the skill, checked here with the
 * page's own tool. Every quote is looked up in the files; a found one opens
 * its file with the lens on the line. The window itself (the depiction of
 * the Claude app) sits below the stage; one button reveals it. "Deine
 * Antwort" runs the same check on an answer the visitor pastes.
 */
export function ClaudeProbe({
  fmt,
  questions,
  state,
  ownText,
  onOwnText,
  kitTally,
  sceneId,
  reducedMotion,
  onOpenQuote,
  onState,
  prompt,
  personal,
}: {
  readonly fmt: Fmt;
  readonly questions: readonly ProbeQuestion[];
  readonly state: ClaudeProbeState;
  readonly onState: (state: ClaudeProbeState) => void;
  /** The prompt to copy: the recorded one, or the visitor's own once a Stichtag is set. */
  readonly prompt: string;
  readonly personal: boolean;
  readonly ownText: string;
  readonly onOwnText: (text: string) => void;
  readonly kitTally: Tally;
  /** The id of the Claude window's section below the stage. */
  readonly sceneId: string;
  readonly reducedMotion: boolean;
  readonly onOpenQuote: (file: string, line: number) => void;
}) {
  const { copy } = fmt;
  const [whole, setWhole] = useState(false);
  const [draft, setDraft] = useState(ownText);
  const question = questions.find((entry) => entry.id === state.question) ?? questions[0] ?? null;
  const take = question ? (state.skill === "with" ? question.withSkill : question.withoutSkill) : null;
  const text = state.source === "own" ? ownText.slice(0, MAX_ANSWER) : (take?.text ?? "");
  const marks = useMemo(() => probeAnswer(text), [text]);
  const summary = probeSummary(marks);
  const counted = state.source === "recorded" && question?.id !== "r7" ? answerTally(text) : null;

  return (
    <div className="w05-probe" id="zitat-probe" data-w05-probe={state.source} data-w05-take={take?.id ?? ""}>
      <div className="w05-probe-top">
      <GlasSegmented
        label={copy.claude.source}
        options={[
          { value: "recorded", label: copy.claude.sourceRecorded },
          { value: "own", label: copy.claude.sourceOwn },
        ]}
        value={state.source}
        onChange={(source) => onState({ ...state, source: source as ProbeSource })}
      />
      </div>
      {state.source === "recorded" && take ? (
        <>
          <div className="w05-chips">
            <GlasChip kind="status">{fmt.t(copy.claude.recorded, { date: take.recordedOn, model: take.model })}</GlasChip>
            <GlasChip kind="status">{copy.claude.invented}</GlasChip>
          </div>
          <p className="w05-label">{copy.claude.prompt}</p>
          <p className="w05-prompt" data-w05-prompt="">
            {take.prompt}
          </p>
          <div className="w05-row-buttons">
            <CopyButton text={prompt} label={personal ? copy.claude.copyOwnPrompt : copy.claude.copyPrompt} done={copy.claude.copied} />
          </div>
          {personal ? <p className="w05-hint w05-prompt-preview">{prompt}</p> : null}
        </>
      ) : state.source === "recorded" ? (
        <p className="w05-hint" data-w05-no-take="">
          {copy.claude.noTake}
        </p>
      ) : (
        <div className="w05-own-answer">
          <p className="w05-hint">{copy.claude.ownLead}</p>
          <div className="w05-row-buttons">
            <CopyButton text={prompt} label={personal ? copy.claude.copyOwnPrompt : copy.claude.copyPrompt} done={copy.claude.copied} />
          </div>
          <label className="w05-label" htmlFor="w05-own-answer">
            {copy.claude.ownLabel}
          </label>
          <textarea id="w05-own-answer" className="w05-input w05-textarea" rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} data-w05-own-answer="" />
          <div className="w05-row-buttons">
            <GlasButton variant="fill" size="compact" disabled={draft.trim() === ""} onClick={() => onOwnText(draft)} data-w05-own-check="">
              {copy.claude.ownCheck}
            </GlasButton>
            {draft ? (
              <GlasButton
                variant="plain"
                size="compact"
                onClick={() => {
                  setDraft("");
                  onOwnText("");
                }}
              >
                {copy.claude.ownClear}
              </GlasButton>
            ) : null}
          </div>
        </div>
      )}

      <p className="w05-label">
        {copy.claude.probeHeading} <span className="w05-ours">{copy.claude.ours}</span>
      </p>
      <p className="w05-hint">{copy.claude.probeLead}</p>
      <p className="w05-probe-summary" aria-live="polite" data-w05-probe-summary={`${marks.length}-${summary.missing}`}>
        {text ? (marks.length > 0 ? fmt.t(copy.claude.summary, { n: marks.length, m: summary.missing }) : copy.claude.noQuotes) : ""}
      </p>
      {counted ? (
        <p className="w05-probe-count" data-w05-count="">
          {fmt.t(copy.claude.count, { covered: counted.covered, weak: counted.weak, gap: counted.gap, kc: kitTally.covered, kw: kitTally.weak, kg: kitTally.gap })}
        </p>
      ) : state.source === "recorded" && question?.id !== "r7" && text ? (
        <p className="w05-probe-count">{copy.claude.noCount}</p>
      ) : null}
      <ol className="w05-marks">
        {marks.map((mark, index) => (
          <li key={`${mark.start}-${index}`} data-kind={mark.check.kind} data-w05-mark={mark.check.kind}>
            <span className="w05-mark-quote" lang="en">
              {fmt.locale === "de" ? `„${mark.quote}“` : `“${mark.quote}”`}
            </span>
            {mark.check.kind === "found" && mark.line !== null ? (
              <button type="button" className="w05-link-button" onClick={() => onOpenQuote((mark.check as { file: string }).file, mark.line as number)} data-w05-mark-open="">
                {markSentence(fmt, mark)}
              </button>
            ) : (
              <span className="w05-mark-text">{markSentence(fmt, mark)}</span>
            )}
          </li>
        ))}
      </ol>
      {text ? (
        <div className="w05-answer" data-whole={whole ? "" : undefined}>
          <p className="w05-label">{copy.claude.answer}</p>
          <div className="w05-answer-text">
            <MarkedText text={text} marks={marks} />
          </div>
          <GlasButton variant="plain" size="compact" onClick={() => setWhole(!whole)} data-w05-whole="">
            {whole ? copy.claude.showLess : copy.claude.showAll}
          </GlasButton>
        </div>
      ) : null}
      <GlasButton
        variant="fill"
        size="compact"
        icon="forward"
        onClick={() => revealIfOffscreen(document.getElementById(sceneId), reducedMotion)}
        data-w05-window=""
      >
        {copy.claude.window}
      </GlasButton>
    </div>
  );
}

/** Scene 5, the dock: which question and whether Claude had the skill (the source and the prompt sit in the stage). */
export function ClaudeDock({
  fmt,
  questions,
  state,
  onState,
}: {
  readonly fmt: Fmt;
  readonly questions: readonly ProbeQuestion[];
  readonly state: ClaudeProbeState;
  readonly onState: (state: ClaudeProbeState) => void;
}) {
  const { copy } = fmt;
  if (state.source !== "recorded") return null;
  return (
    <div className="w05-claude-dock">
      <GlasSegmented label={copy.claude.question} wrap options={questions.map((entry) => ({ value: entry.id, label: entry.label }))} value={state.question} onChange={(question) => onState({ ...state, question })} />
      <GlasSegmented
        label={copy.claude.skill}
        options={[
          { value: "without", label: copy.claude.withoutSkill },
          { value: "with", label: copy.claude.withSkill },
        ]}
        value={state.skill}
        onChange={(skill) => onState({ ...state, skill: skill as "with" | "without" })}
      />
    </div>
  );
}
