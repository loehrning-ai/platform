"use client";

import { useEffect, useMemo, useState } from "react";
import { GlasButton, GlasSegmented, GlasSheet } from "@/components/demos/glas";
import { seedFrom } from "@/components/demos/claude-scene/replay-engine";
import { SceneInstall } from "@/components/demos/claude-scene/scene-install";
import { useReplay, type ReplayControl } from "@/components/demos/claude-scene/use-replay";
import { MAX_ANSWER, parseClaudeAnswer } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-answer";
import type { WindowQuestion, WindowTake } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-takes";
import { tally, type Tally } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { probeAnswer, probeSummary, probeTake, type ProbeMark, type TakeProbe } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/probe";
import { ClaudeWindow, type SceneCopy } from "./claude-window";
import { CopyButton } from "./copy-button";
import type { Fmt } from "./fmt";
import { MistakeHunt } from "./mistake-hunt";

export interface ClaudeState {
  readonly question: string;
  readonly skill: "with" | "without";
}

const NO_PROBE: TakeProbe = { marks: [], ownWords: 0 };

/** The count of statuses in an answer with one status for each of the eight requests, else null. */
export function answerTally(text: string): Tally | null {
  const rows = parseClaudeAnswer(text).filter((row) => row.status !== null);
  if (rows.length !== 8) return null;
  return tally(rows.map((row) => ({ status: row.status as NonNullable<typeof row.status> })));
}

export interface ClaudeScene {
  readonly state: ClaudeState;
  readonly setState: (state: ClaudeState) => void;
  readonly question: WindowQuestion | null;
  readonly take: WindowTake | null;
  readonly replay: ReplayControl;
  readonly probe: TakeProbe;
  /** The sheet scene 5 has open: every quote, the visitor's own answer, or the install steps. */
  readonly sheet: ClaudeSheet;
  readonly setSheet: (sheet: ClaudeSheet) => void;
}

export type ClaudeSheet = "marks" | "own" | "install" | null;

/**
 * Scene 5 opens on the run that shows what goes wrong: all eight requests,
 * without the skill (a quote that is not verbatim in German, no statuses in
 * English). One tap on the skill switch shows the same question with it.
 */
export function defaultClaudeState(questions: readonly WindowQuestion[]): ClaudeState {
  return { question: (questions.find((entry) => entry.id === "alle") ?? questions[0])?.id ?? "", skill: "without" };
}

/** Scene 5's state, shared by the window on the stage and the dock: the question, the skill and the replay. */
export function useClaudeScene(questions: readonly WindowQuestion[], options: { readonly reducedMotion: boolean; readonly visible: boolean }): ClaudeScene {
  const [state, setState] = useState<ClaudeState>(() => defaultClaudeState(questions));
  const question = questions.find((entry) => entry.id === state.question) ?? questions[0] ?? null;
  const take = question ? (state.skill === "with" ? (question.withSkill ?? question.withoutSkill) : (question.withoutSkill ?? question.withSkill)) : null;
  const turns = useMemo(() => (take ? [{ ...take.turn, prompt: take.prompt }] : []), [take]);
  const replay = useReplay(turns, {
    seed: seedFrom(take?.id ?? "w05"),
    reducedMotion: options.reducedMotion,
    visible: options.visible,
    producedNames: take?.produced ? [take.produced.name] : [],
    keepTime: false,
  });
  const probe = useMemo(() => (take ? probeTake(take) : NO_PROBE), [take]);
  const [sheet, setSheet] = useState<ClaudeSheet>(null);
  return { state, setState, question, take, replay, probe, sheet, setSheet };
}

/** A phone (below 40rem): the dock's two lookup buttons keep to their icons. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 39.99rem)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

function markSentence(fmt: Fmt, mark: ProbeMark): string {
  const { copy } = fmt;
  if (mark.check.kind === "found") return fmt.t(copy.claude.found, { file: mark.check.file, line: mark.line ?? "" });
  if (mark.check.kind === "similar") return fmt.t(copy.claude.similar, { file: mark.check.file, share: fmt.t(copy.claude.percent, { n: Math.round(mark.check.share * 100) }) });
  return copy.claude.missing;
}

/** "Die Seite hat 9 Zitate nachgeschlagen …": the sentence over a list of marks. */
export function summarySentence(fmt: Fmt, marks: readonly ProbeMark[]): string {
  const { copy } = fmt;
  if (marks.length === 0) return copy.claude.noQuotes;
  const summary = probeSummary(marks);
  const off = summary.missing + summary.similar;
  if (marks.length === 1) return off === 0 ? copy.claude.summaryOne : copy.claude.summaryOneOff;
  if (off === 0) return fmt.t(copy.claude.summaryAll, { n: marks.length });
  return fmt.t(off === 1 ? copy.claude.summaryOff : copy.claude.summary, { n: marks.length, m: off });
}

/** The count sentence for a take of the question about all eight requests, or null. */
export function countSentence(fmt: Fmt, take: WindowTake | null, questionId: string | undefined, kitTally: Tally): string | null {
  if (!take || questionId === "r7") return null;
  const counted = answerTally(take.turn.final_text);
  if (!counted) return fmt.copy.claude.noCount;
  return fmt.t(fmt.copy.claude.count, { covered: counted.covered, weak: counted.weak, gap: counted.gap, kc: kitTally.covered, kw: kitTally.weak, kg: kitTally.gap });
}

function MarkList({ fmt, marks, onOpenQuote }: { readonly fmt: Fmt; readonly marks: readonly ProbeMark[]; readonly onOpenQuote: (file: string, line: number) => void }) {
  return (
    <ol className="w05-marks">
      {marks.map((mark, index) => (
        <li key={`${mark.start}-${index}`} data-kind={mark.check.kind} data-w05-mark={mark.check.kind}>
          <span className="w05-mark-quote">{fmt.locale === "de" ? `„${mark.quote}“` : `“${mark.quote}”`}</span>
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
  );
}

/**
 * Scene 5 on the stage: the Claude window replaying the recorded take, with
 * the page's quote marks drawn on the answer as it streams in, and under it
 * two ways on: every quote with its file and line, and the same lookup for
 * an answer the visitor pastes from their own Claude.
 */
export function ClaudeStage({
  fmt,
  scene,
  claude,
  kitTally,
  prompt,
  personal,
  ownText,
  onOwnText,
  onOpenQuote,
  onOpenProduced,
}: {
  readonly fmt: Fmt;
  readonly scene: SceneCopy;
  readonly claude: ClaudeScene;
  readonly kitTally: Tally;
  /** The prompt to copy: the recorded one, or the visitor's own once a Stichtag is set. */
  readonly prompt: string;
  readonly personal: boolean;
  readonly ownText: string;
  readonly onOwnText: (text: string) => void;
  readonly onOpenQuote: (file: string, line: number) => void;
  readonly onOpenProduced: (name: string, text: string) => void;
}) {
  const { copy } = fmt;
  const { take, question, replay, probe, sheet: open, setSheet: setOpen } = claude;
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState(ownText);
  const ownMarks = useMemo(() => probeAnswer(ownText.slice(0, MAX_ANSWER)), [ownText]);
  const sheetCommon = { onClose: () => setOpen(null), closeLabel: copy.close, resizeLabel: copy.resize, className: "w05 w05-sheet" };
  const done = replay.started && replay.frame.done;

  if (!take || !question) {
    return (
      <p className="w05-hint" data-w05-no-take="">
        {copy.claude.noTake}
      </p>
    );
  }
  const answerMarks = probe.marks.filter((mark) => mark.source === null);
  const fileMarks = probe.marks.filter((mark) => mark.source !== null);
  const fileName = fileMarks[0]?.source ?? "";
  const count = countSentence(fmt, take, question.id, kitTally);
  const openQuote = (file: string, line: number) => {
    setOpen(null);
    onOpenQuote(file, line);
  };
  return (
    <div className="w05-claude" data-w05-probe="recorded" data-w05-take={take.id} data-w05-done={done ? "" : undefined}>
      <ClaudeWindow
        fmt={fmt}
        scene={scene}
        take={take}
        marks={answerMarks}
        replay={replay}
        recent={question.label}
        copyLabel={copied === prompt ? copy.claude.copied : personal ? copy.claude.copyOwnPrompt : copy.claude.copyPrompt}
        copied={copied === prompt}
        onCopy={() => {
          navigator.clipboard?.writeText(prompt).then(
            () => setCopied(prompt),
            () => setCopied(null),
          );
        }}
        onOpenQuote={onOpenQuote}
        onOpenProduced={() => (take.produced ? onOpenProduced(take.produced.name, take.produced.text) : undefined)}
        onInstall={() => setOpen("install")}
      />
      {done ? <MistakeHunt fmt={fmt} /> : null}
      <GlasSheet {...sheetCommon} open={open === "marks"} title={copy.claude.probeHeading} detent="large">
        <div className="w05-probe" data-w05-probe-sheet={take.id}>
          <p className="w05-hint">
            <span className="w05-ours">{copy.claude.ours}</span> {copy.claude.probeLead}
          </p>
          <p className="w05-probe-summary" data-w05-probe-summary={`${probe.marks.length}-${probe.marks.filter((mark) => mark.check.kind !== "found").length}`}>
            {summarySentence(fmt, probe.marks)}
          </p>
          {count ? (
            <p className="w05-probe-count" data-w05-count="">
              {count}
            </p>
          ) : null}
          {probe.ownWords > 0 ? <p className="w05-hint">{fmt.t(probe.ownWords === 1 ? copy.claude.ownWordsOne : copy.claude.ownWords, { n: fmt.word(probe.ownWords) })}</p> : null}
          {answerMarks.length > 0 ? (
            <>
              <p className="w05-label">{copy.claude.inAnswer}</p>
              <MarkList fmt={fmt} marks={answerMarks} onOpenQuote={openQuote} />
            </>
          ) : null}
          {fileMarks.length > 0 ? (
            <>
              <p className="w05-label">{fmt.t(copy.claude.inFile, { name: fileName })}</p>
              <MarkList fmt={fmt} marks={fileMarks} onOpenQuote={openQuote} />
            </>
          ) : null}
          {question.notes.length > 0 ? (
            <div className="w05-notes" data-w05-notes="">
              <p className="w05-label">{copy.claude.noteLabel}</p>
              <ul>
                {question.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              {question.rejected > 0 ? (
                <p className="w05-hint" data-w05-rejected={question.rejected}>
                  {question.rejectedReason ? fmt.t(copy.claude.rejectedWhy, { n: question.rejected, reason: question.rejectedReason }) : `${scene.rejected(question.rejected)}.`}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </GlasSheet>

      <GlasSheet {...sheetCommon} open={open === "own"} title={copy.claude.sourceOwn} detent="large">
        <div className="w05-own-answer" data-w05-probe="own">
          <p className="w05-hint">{copy.claude.ownLead}</p>
          <div className="w05-row-buttons">
            <CopyButton text={prompt} label={personal ? copy.claude.copyOwnPrompt : copy.claude.copyPrompt} done={copy.claude.copied} />
          </div>
          <label className="w05-label" htmlFor="w05-own-answer">
            {copy.claude.ownLabel}
          </label>
          <textarea id="w05-own-answer" className="w05-input w05-textarea" rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} data-w05-own-answer="" />
          <div className="w05-row-buttons">
            <GlasButton variant="prominent" size="compact" disabled={draft.trim() === ""} onClick={() => onOwnText(draft)} data-w05-own-check="">
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
          {ownText ? (
            <>
              <p className="w05-probe-summary" aria-live="polite" data-w05-probe-summary={`${ownMarks.length}-${ownMarks.filter((mark) => mark.check.kind !== "found").length}`}>
                {summarySentence(fmt, ownMarks)}
              </p>
              <MarkList fmt={fmt} marks={ownMarks} onOpenQuote={openQuote} />
            </>
          ) : null}
        </div>
      </GlasSheet>

      {open === "install" ? <SceneInstall copy={scene} skillName={take.skillName} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

/**
 * Scene 5, the dock: which question and whether Claude had the skill. The
 * one button in the window's composer sends the prompt, stops the stream
 * (the whole answer at once) and plays it again.
 */
export function ClaudeDock({ fmt, scene, claude, questions }: { readonly fmt: Fmt; readonly scene: SceneCopy; readonly claude: ClaudeScene; readonly questions: readonly WindowQuestion[] }) {
  const { copy } = fmt;
  const { state, setState, setSheet, replay, probe } = claude;
  const narrow = useNarrow();
  const done = replay.started && replay.frame.done;
  const marksLabel = probe.marks.length === 1 ? copy.claude.marksOpenOne : probe.marks.length > 0 ? fmt.t(copy.claude.marksOpen, { n: probe.marks.length }) : copy.claude.marksNone;
  return (
    <div className="w05-claude-dock">
      <GlasSegmented
        label={copy.claude.question}
        options={questions.map((entry) => ({ value: entry.id, label: (copy.claude.questionShort as Readonly<Record<string, string>>)[entry.id] ?? entry.label }))}
        value={state.question}
        onChange={(id) => setState({ ...state, question: id })}
      />
      <GlasSegmented
        label={copy.claude.skill}
        options={[
          { value: "with", label: scene.withSkill },
          { value: "without", label: scene.withoutSkill },
        ]}
        value={state.skill}
        onChange={(skill) => setState({ ...state, skill: skill as "with" | "without" })}
      />
      <span className="w05-claude-dock-more">
        {narrow ? (
          <>
            <GlasButton variant="icon" size="compact" icon="search" label={marksLabel} onClick={() => setSheet("marks")} data-w05-marks-open="" data-ready={done ? "" : undefined} />
            <GlasButton variant="icon" size="compact" icon="doc" label={copy.claude.ownOpen} onClick={() => setSheet("own")} data-w05-own-open="" />
          </>
        ) : (
          <>
            <GlasButton variant={done ? "prominent" : "plain"} size="compact" icon="search" onClick={() => setSheet("marks")} data-w05-marks-open="">
              {marksLabel}
            </GlasButton>
            <GlasButton variant="plain" size="compact" icon="doc" onClick={() => setSheet("own")} data-w05-own-open="">
              {copy.claude.ownOpen}
            </GlasButton>
          </>
        )}
      </span>
    </div>
  );
}
