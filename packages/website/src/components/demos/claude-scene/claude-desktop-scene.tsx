"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GLAS_PRIORITY } from "@/components/demos/glas/budget";
import { GlasButton } from "@/components/demos/glas/button";
import { GlasChip } from "@/components/demos/glas/chip";
import { useGlas } from "@/components/demos/glas/glas-root";
import { GlasIcon } from "@/components/demos/glas/icons";
import { GlasGroup } from "@/components/demos/glas/panel";
import { GlasSegmented } from "@/components/demos/glas/segmented";
import { modelName, modelShortName, promptsFor, recordedOn, takesFor, type ClaudeRecording, type ScenePrompt } from "@/lib/claude-runs";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { fileKind, fileSize } from "./file-kind";
import { MarkdownLite } from "./markdown-lite";
import { clockLabel, groupSteps, seedFrom, type ReplayStep, type ReplayTurn, type TurnFrame } from "./replay-engine";
import { SceneInstall } from "./scene-install";
import type { ClaudeDesktopSceneProps, SceneKitFile } from "./scene-types";
import { useReplay } from "./use-replay";
import "./scene.css";

type SceneCopy = (typeof DEMOS_PAGE_COPY)[keyof typeof DEMOS_PAGE_COPY]["claudeScene"];

interface OpenFile {
  readonly name: string;
  readonly text: string | null;
  readonly bytes: number;
  /** Where the bytes come from, for the download. */
  readonly kind: "kit" | "produced";
}

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function stepText(step: ReplayStep & { readonly count: number }, copy: SceneCopy): string {
  switch (step.kind) {
    case "skill":
      return copy.stepSkill(step.target);
    case "read":
      return copy.stepRead(step.target);
    case "bash":
      return copy.stepBash(step.count);
    case "write":
      return copy.stepWrite(step.target);
    case "note":
      return step.text ?? "";
    default:
      return step.isError ? copy.stepError : copy.stepOther(step.tool);
  }
}

function StepIcon({ kind }: { readonly kind: ReplayStep["kind"] }) {
  const paths: Record<string, string> = {
    skill: "M4 4h8l4 4v8H4zM12 4v4h4",
    read: "M3 5h6l1 1h7v9H3z",
    bash: "M4 6l4 4-4 4M10 14h6",
    write: "M5 15h3l7-7-3-3-7 7zM11 6l3 3",
    note: "M4 6h12M4 10h12M4 14h7",
    other: "M10 4v12M4 10h12",
  };
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="cds-step-icon">
      <path d={paths[kind] ?? paths.other} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Activity({ frame, copy, running }: { readonly frame: TurnFrame; readonly copy: SceneCopy; readonly running: boolean }) {
  const rows = groupSteps(frame.steps.filter((step) => step.kind !== "note"));
  const notes = frame.steps.filter((step) => step.kind === "note");
  if (frame.phase === "idle" || frame.phase === "sending") return null;
  const label = running
    ? frame.phase === "thinking"
      ? copy.thinking
      : copy.working
    : copy.activity(rows.length, clockLabel(frame.realMs));
  return (
    <div className="cds-activity" data-open={running ? "" : undefined}>
      <div className="cds-activity-head">
        <span className="cds-spark" data-running={running ? "" : undefined} aria-hidden="true" />
        <span>{label}</span>
        {running ? <span className="cds-timer">{clockLabel(frame.elapsedMs)}</span> : null}
      </div>
      {(running || rows.length <= 4) && rows.length + (running ? notes.length : 0) > 0 ? (
        <ol className="cds-steps">
          {rows.map((row, index) => (
            <li key={index} data-kind={row.kind} data-error={row.isError ? "" : undefined}>
              <StepIcon kind={row.kind} />
              <span>{stepText(row, copy)}</span>
            </li>
          ))}
          {notes.length > 0 && running ? (
            <li data-kind="note" className="cds-note-row">
              <StepIcon kind="note" />
              <span>{(notes[notes.length - 1] as ReplayStep).text}</span>
            </li>
          ) : null}
        </ol>
      ) : null}
    </div>
  );
}

function FileCard({ name, bytes, locale, onOpen }: { readonly name: string; readonly bytes: number; readonly locale: "de" | "en"; readonly onOpen?: () => void }) {
  return (
    <button type="button" className="cds-file" tabIndex={-1} onClick={onOpen}>
      <span className="cds-file-badge" aria-hidden="true">
        {(name.split(".").pop() ?? "").slice(0, 4)}
      </span>
      <span className="cds-file-text">
        <span className="cds-file-name">{name}</span>
        <span className="cds-file-meta">
          {fileKind(name)} · {fileSize(bytes, locale)}
        </span>
      </span>
    </button>
  );
}

function Turn({
  frame,
  recording,
  kitFiles,
  copy,
  locale,
  running,
  produced,
  onOpenFile,
  attach,
}: {
  readonly frame: TurnFrame;
  readonly recording: ClaudeRecording;
  readonly kitFiles: Readonly<Record<string, SceneKitFile>>;
  readonly copy: SceneCopy;
  readonly locale: "de" | "en";
  readonly running: boolean;
  readonly produced: readonly { name: string; bytes: number }[];
  readonly onOpenFile: (file: OpenFile) => void;
  readonly attach: boolean;
}) {
  if (frame.phase === "idle") return null;
  return (
    <div className="cds-turn" data-phase={frame.phase}>
      <div className="cds-user" data-rising={frame.phase === "sending" ? "" : undefined}>
        {attach ? (
          <div className="cds-attach">
            {recording.kit_files.map((file) => (
              <FileCard
                key={file.name}
                name={file.name}
                bytes={file.bytes}
                locale={locale}
                onOpen={() => onOpenFile({ name: file.name, bytes: file.bytes, text: kitFiles[file.name]?.text ?? null, kind: "kit" })}
              />
            ))}
          </div>
        ) : null}
        <div className="cds-bubble">{frame.prompt}</div>
      </div>
      <Activity frame={frame} copy={copy} running={running} />
      {frame.answer ? (
        <div className="cds-answer">
          <MarkdownLite source={frame.answer} streaming={!frame.answerComplete} />
        </div>
      ) : null}
      {frame.files.length > 0 ? (
        <div className="cds-produced">
          {frame.files.map((name) => {
            const file = produced.find((entry) => entry.name === name);
            const stored = recording.produced_files.find((entry) => entry.name === name);
            return (
              <FileCard
                key={name}
                name={name}
                bytes={file?.bytes ?? 0}
                locale={locale}
                onOpen={() => onOpenFile({ name, bytes: stored?.bytes ?? 0, text: stored?.text ?? null, kind: "produced" })}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The Claude scene (claude-desktop-spec): a drawn depiction of the Claude
 * desktop app replaying a real, recorded run with the workshop's skill and
 * kit files. The window is content, opaque, never glass; the Glas dock under
 * it holds every control. Nothing here calls an AI: it replays a recording,
 * labelled with its date and model, and every file offered is the real one.
 */
export function ClaudeDesktopScene({ scene, locale, skillName, kitFiles, initialPromptId, theme = "auto" }: ClaudeDesktopSceneProps) {
  const copy = DEMOS_PAGE_COPY[locale].claudeScene;
  const { reducedMotion } = useGlas();
  const headingId = useId();
  const captionId = useId();
  const root = useRef<HTMLElement | null>(null);
  const chat = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  const { prompts, foreign } = promptsFor(scene, locale);
  const [promptId, setPromptId] = useState(initialPromptId && prompts.some((prompt) => prompt.id === initialPromptId) ? initialPromptId : prompts[0]?.id ?? "");
  const prompt = prompts.find((entry) => entry.id === promptId) ?? (prompts[0] as ScenePrompt);
  const hasWithout = (prompt?.withoutSkill.length ?? 0) > 0;
  const [withSkill, setWithSkill] = useState(true);
  const variantWithSkill = hasWithout ? withSkill : true;
  const takes = prompt ? takesFor(scene, prompt, variantWithSkill) : [];
  const [takeIndex, setTakeIndex] = useState(() => Math.max(0, takes.findIndex((take) => take.selected)));
  const recording = (takes[takeIndex] ?? takes[0]) as ClaudeRecording | undefined;
  const [followUps, setFollowUps] = useState(0);
  const [keepTime, setKeepTime] = useState(false);
  const [visible, setVisible] = useState(false);
  const [file, setFile] = useState<OpenFile | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [seenVariants, setSeenVariants] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    setTakeIndex(Math.max(0, takes.findIndex((take) => take.selected)));
    setFollowUps(0);
    setKeepTime(false);
    // a new prompt or variant starts with its selected take
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId, variantWithSkill]);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { rootMargin: "200px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const turns = useMemo<readonly ReplayTurn[]>(() => {
    if (!recording) return [];
    return [{ ...recording, prompt: recording.prompt }, ...recording.follow_ups.slice(0, followUps)];
  }, [followUps, recording]);
  const replay = useReplay(turns, {
    seed: seedFrom(recording?.id ?? "scene"),
    reducedMotion,
    visible,
    producedNames: recording?.produced_files.map((entry) => entry.name) ?? [],
    keepTime,
  });
  const { frame } = replay;
  const lastTurn = frame.turns[frame.turns.length - 1];

  // Follow the stream unless the visitor scrolled up inside the chat.
  useEffect(() => {
    const element = chat.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  }, [frame]);

  useEffect(() => {
    if (frame.done && replay.started && recording) setSeenVariants((previous) => new Set([...previous, `${promptId}:${variantWithSkill}`]));
  }, [frame.done, promptId, recording, replay.started, variantWithSkill]);

  if (!prompt || !recording) return null;

  const date = recordedOn(recording.recorded_at, locale);
  const model = `${modelName(recording.model)} (${recording.model})`;
  const produced = recording.produced_files.map((entry) => ({ name: entry.name, bytes: entry.bytes }));
  const nextFollowUp = recording.follow_ups[followUps];
  const status = replay.playing ? copy.statusRunning : frame.done && replay.started ? copy.statusDone : "";
  const note = scene.notes?.[locale];
  const bothSeen = seenVariants.has(`${promptId}:true`) && seenVariants.has(`${promptId}:false`);
  const rejected = prompt.rejected ?? 0;
  const kitList = recording.kit_files.map((entry) => kitFiles[entry.name]).filter((entry): entry is SceneKitFile => Boolean(entry));

  const onCopy = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
    }
  };

  return (
    <section ref={root} className="cds" aria-labelledby={headingId} aria-describedby={captionId} data-claude-scene="">
      <h3 id={headingId} className="sr-only">
        {copy.sceneLabel}
      </h3>
      <div className="cds-window" data-theme={theme} data-panel={file ? "open" : undefined}>
        <div className="cds-chrome" aria-hidden="true">
          <div className="cds-titlebar">
            <span className="cds-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="cds-title">Claude</span>
          </div>
          <div className="cds-phonebar">
            <GlasIcon name="menu" />
            <span className="cds-phone-title">
              <span>Claude</span>
              <span className="cds-phone-model">{modelShortName(recording.model)}</span>
            </span>
            <GlasIcon name="compose" />
          </div>
          <div className="cds-body">
            <nav className="cds-sidebar">
              <span className="cds-brand">Claude</span>
              <span className="cds-nav-item cds-new">
                <span className="cds-plus">
                  <GlasIcon name="plus" />
                </span>
                <span className="cds-label">{copy.newChat}</span>
              </span>
              <span className="cds-nav-item">
                <GlasIcon name="home" />
                <span className="cds-label">{copy.sidebar.home}</span>
              </span>
              <span className="cds-nav-item">
                <GlasIcon name="code" />
                <span className="cds-label">{copy.sidebar.code}</span>
              </span>
              <button type="button" tabIndex={-1} className="cds-nav-item" data-clickable="" onClick={() => setInstallOpen(true)}>
                <GlasIcon name="sliders" />
                <span className="cds-label">{copy.sidebar.customize}</span>
              </button>
              <span className="cds-nav-item">
                <GlasIcon name="folder" />
                <span className="cds-label">{copy.sidebar.projects}</span>
              </span>
              <span className="cds-recents cds-label">{copy.sidebar.recents}</span>
              <span className="cds-recent cds-label" data-current="">
                {prompt.label}
              </span>
              <span className="cds-account">
                <span className="cds-avatar">{locale === "de" ? "Du" : "You"}</span>
              </span>
            </nav>
            <div className="cds-main">
              <div
                ref={chat}
                className="cds-chat"
                onScroll={(event) => {
                  const element = event.currentTarget;
                  pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
                }}
              >
                <div className="cds-column" data-fade={replay.started ? undefined : ""}>
                  {replay.started ? null : (
                    <div className="cds-empty">
                      <p className="cds-greeting">{locale === "de" ? "Wobei kann ich helfen?" : "How can I help?"}</p>
                    </div>
                  )}
                  {frame.turns.map((turnFrame, index) => (
                    <Turn
                      key={`${recording.id}-${index}`}
                      frame={turnFrame}
                      recording={recording}
                      kitFiles={kitFiles}
                      copy={copy}
                      locale={locale}
                      running={replay.playing && index === frame.turns.length - 1 && turnFrame.phase !== "done"}
                      produced={produced}
                      onOpenFile={setFile}
                      attach={index === 0}
                    />
                  ))}
                </div>
              </div>
              <div className="cds-composer">
                {!replay.started ? (
                  <div className="cds-attach" data-in-composer="">
                    {recording.kit_files.map((entry) => (
                      <FileCard key={entry.name} name={entry.name} bytes={entry.bytes} locale={locale} />
                    ))}
                  </div>
                ) : null}
                {nextFollowUp && frame.done && replay.started && prompt.followUpLabel ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="cds-suggestion"
                    onClick={() => {
                      setKeepTime(true);
                      setFollowUps((count) => count + 1);
                    }}
                  >
                    {prompt.followUpLabel}
                  </button>
                ) : null}
                <div className="cds-input">{replay.started ? copy.composer : recording.prompt}</div>
                <div className="cds-composer-row">
                  <span className="cds-round">
                    <GlasIcon name="plus" />
                  </span>
                  <span className="cds-spacer" />
                  <span className="cds-model">
                    {modelShortName(recording.model)}
                    <GlasIcon name="chevron-down" />
                  </span>
                  <span className="cds-round" data-kind="mic">
                    <GlasIcon name="mic" />
                  </span>
                  <span className="cds-send" data-ready={!replay.started ? "" : undefined}>
                    <GlasIcon name="send" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {file ? (
          <aside className="cds-panel" aria-label={`${copy.file}: ${file.name}`}>
            <header className="cds-panel-head">
              <span className="cds-panel-name">{file.name}</span>
              {file.text !== null ? (
                <>
                  <button type="button" className="cds-panel-btn" onClick={() => onCopy(`file:${file.name}`, file.text ?? "")}>
                    {copied === `file:${file.name}` ? copy.copied : copy.copyFile}
                  </button>
                  <button type="button" className="cds-panel-btn" onClick={() => downloadText(file.name, file.text ?? "")}>
                    {copy.download}
                  </button>
                </>
              ) : null}
              <button type="button" className="cds-panel-btn" data-close="" aria-label={copy.close} onClick={() => setFile(null)}>
                <GlasIcon name="close" />
              </button>
            </header>
            <div className="cds-panel-body">
              {file.text === null ? null : file.name.endsWith(".md") ? (
                <div className="cds-answer">
                  <MarkdownLite source={file.text} />
                </div>
              ) : (
                <pre className="cds-pre">{file.text}</pre>
              )}
            </div>
          </aside>
        ) : null}
        {installOpen ? <SceneInstall copy={copy} skillName={skillName} onClose={() => setInstallOpen(false)} /> : null}
      </div>

      <p id={captionId} className="cds-caption">
        {copy.caption(date, model)}
      </p>
      <p className="cds-chips">
        <GlasChip kind="status" glass>
          {copy.depiction}
        </GlasChip>
        <GlasChip kind="status" glass>
          {copy.recordedOn(date)}
        </GlasChip>
        {takes.length > 1 ? (
          <GlasChip kind="status" glass>
            {copy.takeOf(takeIndex + 1, takes.length)}
          </GlasChip>
        ) : null}
        {rejected > 0 ? (
          <GlasChip kind="status" glass>
            {copy.rejected(rejected)}
          </GlasChip>
        ) : null}
      </p>

      <GlasGroup label={copy.pickPrompt} material="regular" live={GLAS_PRIORITY.dock} className="cds-dock">
        {prompts.length > 1 ? (
          <div className="cds-row cds-prompts" role="group" aria-label={copy.pickPrompt}>
            {prompts.map((entry) => (
              <GlasChip key={entry.id} kind="filter" selected={entry.id === prompt.id} onClick={() => setPromptId(entry.id)}>
                {entry.label}
              </GlasChip>
            ))}
          </div>
        ) : null}
        <div className="cds-row">
          {hasWithout ? (
            <GlasSegmented
              label={copy.skillSwitch}
              options={[
                { value: "with", label: copy.withSkill },
                { value: "without", label: copy.withoutSkill },
              ]}
              value={variantWithSkill ? "with" : "without"}
              onChange={(value) => setWithSkill(value === "with")}
              className="cds-variant"
            />
          ) : null}
          {replay.playing ? (
            <GlasButton variant="fill" icon="pause" onClick={replay.pause} data-scene-pause="">
              {copy.pause}
            </GlasButton>
          ) : replay.started && !frame.done ? (
            <GlasButton variant="prominent" icon="play" onClick={replay.play} data-scene-play="">
              {copy.resume}
            </GlasButton>
          ) : replay.started ? (
            <GlasButton variant="fill" icon="replay" onClick={replay.replay} data-scene-replay="">
              {reducedMotion ? copy.reload : copy.replay}
            </GlasButton>
          ) : (
            <GlasButton variant="prominent" icon="play" onClick={replay.play} data-scene-play="">
              {copy.play}
            </GlasButton>
          )}
          {!frame.done || !replay.started ? (
            <GlasButton variant="plain" icon="skip" onClick={replay.finish} data-scene-finish="">
              {copy.showAll}
            </GlasButton>
          ) : null}
          {nextFollowUp && prompt.followUpLabel && frame.done && replay.started ? (
            <GlasButton
              variant="fill"
              icon="forward"
              onClick={() => {
                setKeepTime(true);
                setFollowUps((count) => count + 1);
              }}
              data-scene-follow-up=""
            >
              {prompt.followUpLabel}
            </GlasButton>
          ) : null}
        </div>
        {!hasWithout ? <p className="cds-hint">{copy.noWithout}</p> : !variantWithSkill ? <p className="cds-hint">{copy.withoutHint}</p> : null}
        {takes.length > 1 ? (
          <div className="cds-row">
            <GlasSegmented
              label={copy.takeOf(takeIndex + 1, takes.length)}
              options={takes.map((take, index) => ({ value: String(index), label: copy.takeOf(index + 1, takes.length) }))}
              value={String(takeIndex)}
              onChange={(value) => {
                setTakeIndex(Number(value));
                setFollowUps(0);
                setKeepTime(false);
              }}
            />
          </div>
        ) : null}
        <div className="cds-row cds-actions">
          <GlasButton variant="fill" icon="copy" onClick={() => onCopy("prompt", recording.prompt)} data-scene-copy="">
            {copied === "prompt" ? copy.copied : copy.copyPrompt}
          </GlasButton>
          <GlasButton variant="fill" icon="download" href={`/skills/${skillName}.zip`} download={`${skillName}.zip`}>
            {copy.downloadSkill}
          </GlasButton>
          <GlasButton variant="plain" icon="info" onClick={() => setInstallOpen(true)} data-scene-install="">
            {copy.install}
          </GlasButton>
        </div>
        {kitList.length > 0 ? (
          <div className="cds-row cds-kit" role="group" aria-label={copy.kitFiles}>
            {kitList.map((entry) => (
              <GlasChip
                key={entry.name}
                kind="file"
                onClick={() => setFile({ name: entry.name, bytes: entry.bytes, text: entry.text, kind: "kit" })}
                label={`${copy.openFile}: ${entry.name}`}
              >
                {entry.name}
              </GlasChip>
            ))}
            {recording.produced_files
              .filter((entry) => lastTurn && frame.turns.some((turnFrame) => turnFrame.files.includes(entry.name)))
              .map((entry) => (
                <GlasChip
                  key={entry.stored_as}
                  kind="file"
                  onClick={() => setFile({ name: entry.name, bytes: entry.bytes, text: entry.text ?? null, kind: "produced" })}
                  label={`${copy.openFile}: ${entry.name}`}
                >
                  {entry.name}
                </GlasChip>
              ))}
          </div>
        ) : null}
        <p className="cds-skill-note">{copy.skillNote}</p>
      </GlasGroup>

      {note && note.length > 0 && bothSeen ? (
        <aside className="cds-note" aria-label={copy.note}>
          <p className="cds-note-label">
            {copy.note}: {copy.noteHeading}
          </p>
          <ul>
            {note.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      <p className="cds-fine">
        {copy.surface} {replay.schedule.pacing.some((pace) => pace === "approximated") ? copy.pacing : ""}{" "}
        {replay.schedule.clamped.some(Boolean) ? copy.shortened : ""} {foreign ? copy.foreign : ""} {copy.noAi}
      </p>

      <details className="cds-transcript">
        <summary>{copy.transcript}</summary>
        <div className="cds-transcript-body">
          <p>{copy.transcriptCase}</p>
          <p className="cds-fine">{copy.caption(date, model)}</p>
          {[{ prompt: recording.prompt, turn: recording }, ...recording.follow_ups.map((turn) => ({ prompt: turn.prompt, turn }))].map(({ prompt: text, turn }, index) => {
            const steps = groupSteps(
              turn.timeline
                .filter((item): item is Extract<typeof item, { kind: "tool_use" }> => item.kind === "tool_use")
                .map((item) => {
                  const input = (item.input ?? {}) as Record<string, unknown>;
                  const path = typeof input.file_path === "string" ? input.file_path : "";
                  const kind: ReplayStep["kind"] = item.tool === "Skill" ? "skill" : item.tool === "Read" ? "read" : item.tool === "Bash" ? "bash" : item.tool === "Write" ? "write" : "other";
                  return { kind, tool: item.tool, target: kind === "skill" ? String(input.skill ?? "") : path.split("/").pop() ?? "" };
                }),
            );
            return (
              <div key={index} className="cds-transcript-turn">
                <p>
                  <strong>{copy.you}:</strong> {text}
                </p>
                {index === 0 ? (
                  <p>
                    {copy.kitFiles}: {recording.kit_files.map((entry) => entry.name).join(", ")}
                  </p>
                ) : null}
                {steps.length > 0 ? (
                  <>
                    <p>
                      <strong>{copy.transcriptSteps}:</strong>
                    </p>
                    <ul>
                      {steps.map((step, position) => (
                        <li key={position}>{stepText(step, copy)}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p>
                  <strong>{copy.claude}:</strong>
                </p>
                <div className="cds-answer">
                  <MarkdownLite source={turn.final_text} tableLabel={copy.claude} />
                </div>
              </div>
            );
          })}
          {steps0Grouped(recording) ? <p className="cds-fine">{copy.grouped}</p> : null}
        </div>
      </details>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
        {frame.turns.some((turnFrame) => turnFrame.files.length > 0) && frame.done ? ` ${copy.statusFile(recording.produced_files.map((entry) => entry.name).join(", "))}` : ""}
      </p>
    </section>
  );
}

function steps0Grouped(recording: ClaudeRecording): boolean {
  let previous = "";
  for (const item of recording.timeline) {
    if (item.kind !== "tool_use") continue;
    if (item.tool === "Bash" && previous === "Bash") return true;
    previous = item.tool;
  }
  return false;
}
