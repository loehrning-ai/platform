"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { GlasIcon } from "@/components/demos/glas";
import { MarkdownLite } from "@/components/demos/claude-scene/markdown-lite";
import { clockLabel, type TurnFrame } from "@/components/demos/claude-scene/replay-engine";
import type { ReplayControl } from "@/components/demos/claude-scene/use-replay";
import type { TakeStep, WindowTake } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-takes";
import type { SourcedMark } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/probe";
import type { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import type { Fmt } from "./fmt";
import "@/components/demos/claude-scene/scene.css";

const HIGHLIGHTS = { found: "w05-found", similar: "w05-similar", missing: "w05-missing" } as const;

/** The steps the run has reached, grouped: one row per kind in a row ("Mit Python nachgezählt, in 3 Schritten"). */
function stepRows(take: WindowTake, frame: TurnFrame): readonly (TakeStep & { readonly count: number })[] {
  const reached = frame.steps.filter((step) => step.kind !== "note").length;
  const rows: (TakeStep & { count: number })[] = [];
  for (const step of take.steps.slice(0, reached)) {
    const last = rows[rows.length - 1];
    if (last && last.kind === step.kind && step.kind !== "write" && step.kind !== "skill") last.count += 1;
    else rows.push({ ...step, count: 1 });
  }
  return rows;
}

export type SceneCopy = (typeof DEMOS_PAGE_COPY)[keyof typeof DEMOS_PAGE_COPY]["claudeScene"];

function stepText(fmt: Fmt, scene: SceneCopy, step: TakeStep & { readonly count: number }): string {
  const words = fmt.copy.claude.desk;
  switch (step.kind) {
    case "skill":
      return scene.stepSkill(step.name);
    case "look":
      return words.look;
    case "python":
      return scene.stepBash(step.count);
    case "write":
      return scene.stepWrite(step.name);
    case "copy":
      return words.copy;
    default:
      return words.other;
  }
}

/** Text nodes of an element with their offsets in its text, for ranges across inline markup. */
function textIndex(root: Node): { readonly text: string; readonly nodes: readonly { readonly node: Text; readonly start: number }[] } {
  const nodes: { node: Text; start: number }[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: text.length });
    text += (node as Text).data;
  }
  return { text, nodes };
}

function rangeAt(index: ReturnType<typeof textIndex>, start: number, end: number): Range | null {
  const at = (offset: number, edge: "start" | "end") => {
    for (let i = index.nodes.length - 1; i >= 0; i -= 1) {
      const entry = index.nodes[i] as { node: Text; start: number };
      if (entry.start < offset || (edge === "start" && entry.start === offset)) return { node: entry.node, offset: Math.min(entry.node.data.length, offset - entry.start) };
    }
    return null;
  };
  const a = at(start, "start");
  const b = at(end, "end");
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  return range;
}

const stripMarkup = (quote: string) => quote.replace(/[*_`]/g, "");

/**
 * Draws the page's marks on the rendered answer with the CSS Custom
 * Highlight API: nothing in the answer's DOM changes, so the recorded text
 * stays exactly as Claude wrote it. Returns the found ranges for taps.
 */
function useAnswerHighlights(container: HTMLElement | null, answer: string, marks: readonly SourcedMark[]) {
  const found = useRef<{ range: Range; mark: SourcedMark }[]>([]);
  useLayoutEffect(() => {
    const registry = typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as unknown as { highlights: Map<string, unknown> }).highlights : null;
    const HighlightClass = typeof window !== "undefined" ? (window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight : undefined;
    found.current = [];
    if (!container) return;
    const index = textIndex(container);
    const groups: Record<keyof typeof HIGHLIGHTS, Range[]> = { found: [], similar: [], missing: [] };
    let from = 0;
    for (const mark of marks) {
      if (mark.source !== null) continue;
      let at = index.text.indexOf(mark.quote, from);
      let length = mark.quote.length;
      if (at < 0) {
        const plain = stripMarkup(mark.quote);
        at = index.text.indexOf(plain, from);
        length = plain.length;
      }
      if (at < 0) continue;
      const range = rangeAt(index, at, at + length);
      if (!range) continue;
      groups[mark.check.kind].push(range);
      if (mark.check.kind === "found") found.current.push({ range, mark });
      from = at + length;
    }
    if (!registry || !HighlightClass) return;
    for (const [kind, name] of Object.entries(HIGHLIGHTS) as [keyof typeof HIGHLIGHTS, string][]) {
      if (groups[kind].length > 0) registry.set(name, new HighlightClass(...groups[kind]));
      else registry.delete(name);
    }
  }, [answer, container, marks]);
  useEffect(
    () => () => {
      const registry = typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as unknown as { highlights: Map<string, unknown> }).highlights : null;
      for (const name of Object.values(HIGHLIGHTS)) registry?.delete(name);
    },
    [],
  );
  return found;
}

/** The point a tap landed on, as a DOM position (for the highlight ranges). */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Scene 5's picture: a self-drawn depiction of the Claude desktop app (title
 * bar, sidebar, chat, composer) replaying one recorded take. The visitor
 * sends the prompt with the arrow in the composer, watches the recorded run
 * stream in, and taps a quote the page underlined to see it in its file.
 * The marks are ours, drawn over the answer; the answer itself is the
 * recorded final text, untouched. No logo artwork; labelled as a depiction.
 */
export function ClaudeWindow({
  fmt,
  scene,
  take,
  marks,
  replay,
  recent,
  copyLabel,
  onCopy,
  copied,
  onOpenQuote,
  onOpenProduced,
  onInstall,
}: {
  readonly fmt: Fmt;
  readonly scene: SceneCopy;
  readonly take: WindowTake;
  readonly marks: readonly SourcedMark[];
  readonly replay: ReplayControl;
  /** The chat's title in the sidebar: the question in a few words. */
  readonly recent: string;
  readonly copyLabel: string;
  readonly onCopy: () => void;
  readonly copied: boolean;
  readonly onOpenQuote: (file: string, line: number) => void;
  readonly onOpenProduced: () => void;
  readonly onInstall: () => void;
}) {
  const words = fmt.copy.claude.desk;
  const chat = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  const [answerBox, setAnswerBox] = useState<HTMLDivElement | null>(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const frame = replay.frame.turns[0];
  const answer = frame?.answer ?? "";
  const foundRanges = useAnswerHighlights(answerBox, answer, marks);
  const running = replay.playing && frame?.phase !== "done";
  const done = replay.started && replay.frame.done;
  const request = take.kitFiles.find((file) => file.name.startsWith("request_"));
  const folder = take.kitFiles.filter((file) => file !== request);

  // Follow the stream unless the visitor scrolled up inside the chat.
  useEffect(() => {
    const element = chat.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  }, [answer, frame?.steps.length, frame?.phase]);
  useEffect(() => {
    pinned.current = true;
    setFilesOpen(false);
  }, [take.id]);

  const onAnswerClick = (event: MouseEvent<HTMLDivElement>) => {
    const caret = caretAt(event.clientX, event.clientY);
    if (!caret) return;
    const hit = foundRanges.current.find(({ range }) => {
      try {
        return range.isPointInRange(caret.node, caret.offset);
      } catch {
        return false;
      }
    });
    if (hit && hit.mark.check.kind === "found" && hit.mark.line !== null) onOpenQuote(hit.mark.check.file, hit.mark.line);
  };

  const rows = frame ? stepRows(take, frame) : [];
  return (
    <div className="w05-cw cds-window" data-theme="auto" data-w05-window={take.id} data-phase={frame?.phase ?? "idle"}>
      <div className="w05-cw-bar">
        <span className="w05-cw-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="w05-cw-title" aria-hidden="true">
          Claude
        </span>
        <span className="w05-cw-tag">{scene.depiction}</span>
      </div>
      <div className="w05-cw-body">
        <nav className="w05-cw-rail" aria-label={words.rail}>
          <span className="w05-cw-rail-item" data-new="" aria-hidden="true">
            <span className="w05-cw-plus">
              <GlasIcon name="plus" />
            </span>
            <span className="w05-cw-rail-label">{scene.newChat}</span>
          </span>
          <span className="w05-cw-rail-item" aria-hidden="true">
            <GlasIcon name="chat" />
            <span className="w05-cw-rail-label">{scene.sidebar.home}</span>
          </span>
          <span className="w05-cw-rail-item" aria-hidden="true">
            <GlasIcon name="folder" />
            <span className="w05-cw-rail-label">{scene.sidebar.projects}</span>
          </span>
          <button type="button" className="w05-cw-rail-item" onClick={onInstall} data-w05-install="">
            <GlasIcon name="sliders" />
            <span className="w05-cw-rail-label">{scene.sidebar.customize}</span>
            <span className="sr-only">{words.customizeHint}</span>
          </button>
          <span className="w05-cw-recents w05-cw-rail-label" aria-hidden="true">
            {scene.sidebar.recents}
          </span>
          <span className="w05-cw-recent w05-cw-rail-label" aria-hidden="true">
            {recent}
          </span>
        </nav>
        <div className="w05-cw-main">
          <div
            ref={chat}
            className="w05-cw-chat"
            onScroll={(event) => {
              const element = event.currentTarget;
              pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
            }}
          >
            <p className="w05-cw-note">
              {fmt.t(words.caption, { date: take.recordedOn, model: take.model })} {fmt.copy.claude.invented}.
            </p>
            {!replay.started || !frame ? (
              <p className="w05-cw-greeting">{words.greeting}</p>
            ) : (
              <div className="w05-cw-turn">
                <div className="w05-cw-user" data-rising={frame.phase === "sending" ? "" : undefined}>
                  <div className="w05-cw-attach">
                    {request ? (
                      <span className="w05-cw-file">
                        <span className="w05-cw-badge" aria-hidden="true">
                          md
                        </span>
                        {request.name}
                      </span>
                    ) : null}
                    <button type="button" className="w05-cw-file" aria-expanded={filesOpen} onClick={() => setFilesOpen((open) => !open)} data-w05-folder-chip="">
                      <span className="w05-cw-badge" aria-hidden="true">
                        {folder.length}
                      </span>
                      {fmt.t(words.folderFiles, { n: folder.length })}
                    </button>
                  </div>
                  {filesOpen ? (
                    <ul className="w05-cw-filelist">
                      {folder.map((file) => (
                        <li key={file.name}>{file.name}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="w05-cw-bubble">{take.prompt}</p>
                </div>
                {frame.phase !== "sending" ? (
                  <div className="w05-cw-activity" data-running={running ? "" : undefined}>
                    <p className="w05-cw-activity-head">
                      <span className="w05-cw-spark" aria-hidden="true" />
                      {running ? (frame.phase === "thinking" ? scene.thinking : scene.working) : scene.activity(rows.length, clockLabel(frame.realMs))}
                    </p>
                    {rows.length > 0 ? (
                      <ol className="w05-cw-steps">
                        {rows.map((row, index) => (
                          <li key={index} data-kind={row.kind}>
                            {stepText(fmt, scene, row)}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ) : null}
                {answer ? (
                  // The page's marks are drawn over this text; a tap on a found quote opens its file.
                  <div ref={setAnswerBox} className="w05-cw-answer cds-answer" onClick={onAnswerClick} data-w05-answer="">
                    <MarkdownLite source={answer} streaming={!frame.answerComplete} tableLabel={words.tableLabel} />
                  </div>
                ) : null}
                {done && marks.some((mark) => mark.source === null && mark.check.kind === "found") ? <p className="w05-cw-tap">{fmt.copy.claude.tapHint}</p> : null}
                {done && take.produced ? (
                  <button type="button" className="w05-cw-produced" onClick={onOpenProduced} data-w05-produced="">
                    <span className="w05-cw-badge" aria-hidden="true">
                      md
                    </span>
                    <span>
                      <span className="w05-cw-produced-name">{take.produced.name}</span>
                      <span className="w05-cw-produced-meta">{words.produced}</span>
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
          <div className="w05-cw-composer" data-started={replay.started ? "" : undefined}>
            <p className="w05-cw-input">{replay.started ? scene.composer : take.prompt}</p>
            <div className="w05-cw-composer-row">
              <button type="button" className="w05-cw-round" onClick={onCopy} aria-label={copyLabel} data-w05-copy-prompt="">
                <GlasIcon name={copied ? "check" : "copy"} />
              </button>
              {/* The skill switch of this run; a tap shows how to install the skill (on a phone the sidebar is hidden). */}
              <button type="button" className="w05-cw-skill" data-on={take.withSkill ? "" : undefined} onClick={onInstall} data-w05-skill-chip="">
                {fmt.t(take.withSkill ? words.skillOn : words.skillOff, { name: take.skillName })}
                <span className="sr-only">{words.customizeHint}</span>
              </button>
              <span className="w05-cw-spacer" />
              <span className="w05-cw-model" aria-hidden="true">
                {take.modelShort}
              </span>
              {/* One button, as in the app: send before the run, stop while it streams (shows the whole answer), then play it again. */}
              <button
                type="button"
                className="w05-cw-send"
                data-ready={!replay.started ? "" : undefined}
                data-state={!replay.started ? "send" : done ? "again" : "stop"}
                onClick={!replay.started ? replay.play : done ? replay.replay : replay.finish}
                aria-label={!replay.started ? words.send : done ? scene.replay : scene.showAll}
                data-w05-send=""
              >
                {!replay.started ? <GlasIcon name="send" /> : done ? <GlasIcon name="replay" /> : <span className="w05-cw-stop" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
