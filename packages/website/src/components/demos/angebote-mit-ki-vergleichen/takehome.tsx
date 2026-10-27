"use client";

import { useRef, useState } from "react";
import { ClaudeDesktopScene } from "@/components/demos/claude-scene/claude-desktop-scene";
import type { SceneKitFile } from "@/components/demos/claude-scene/scene-types";
import { GlasButton, GlasChip } from "@/components/demos/glas";
import type { ClaudeSceneData } from "@/lib/claude-runs";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { CheckItem } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/our-check";
import { keyOf } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";
import { DragGhost, useDragTo } from "./use-drag";

/** The recorded file sets: the request and all three offers, with or without Brandtwerk's rates. */
export type FileSet = "ohne-saetze" | "mit-saetzen";
/** The one file that tells the two sets apart. */
export const RATES_FILE = "kosten-intern.md";

/** Our check of one recorded take with Brandtwerk's rates, computed on the server. */
export interface CheckTake {
  readonly id: string;
  readonly withSkill: boolean;
  readonly items: readonly CheckItem[];
}

export interface TakeHomeData {
  readonly mail: string;
  readonly instructions: string;
  readonly prompt: string;
  readonly kitHref: string;
  readonly kitName: string;
  readonly kitSize: string;
  readonly skillHref: string;
  readonly skillName: string;
  readonly checks: readonly CheckTake[];
  /** The recorded runs of this language (null while there are none), with the kit files they attached. */
  readonly scene: ClaudeSceneData | null;
  readonly kitFiles: Readonly<Record<string, SceneKitFile>>;
  /** The skill's folder name, for the scene's download (/skills/<name>.zip). */
  readonly sceneSkill: string;
}

/** The scene cut down to the question of one file set: its takes only, so the window has no picker. */
export function sceneFor(scene: ClaudeSceneData, set: FileSet): ClaudeSceneData | null {
  const prompt = scene.prompts.find((entry) => entry.id === set);
  if (!prompt) return null;
  const ids = new Set([...prompt.withSkill, ...prompt.withoutSkill]);
  return { ...scene, prompts: [prompt], recordings: scene.recordings.filter((recording) => ids.has(recording.id)) };
}

/** Brandtwerk's own rates as a paper card: drag it into the Claude window, or tap it. */
function RatesCard({ pack, attached, target, onAttach, onOver }: { readonly pack: DemoPack; readonly attached: boolean; readonly target: () => HTMLElement | null; readonly onAttach: (on: boolean) => void; readonly onOver: (over: boolean) => void }) {
  const c = pack.claude;
  const drag = useDragTo<"window">(
    () => ({ window: target() }),
    () => onAttach(true),
    (over) => onOver(over === "window"),
  );
  const face = (
    <>
      <span className="av4-file-check" aria-hidden="true" />
      <span className="av4-file-name">{c.ratesName}</span>
      <span className="av4-file-meta">{RATES_FILE}</span>
    </>
  );
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={attached}
        className="av4-file-card"
        data-dragging={drag.offset ? "" : undefined}
        onClick={() => onAttach(!attached)}
        data-av4-rates=""
        {...(attached ? {} : drag.bind)}
      >
        {face}
      </button>
      <DragGhost style={drag.ghost} className="av4-file-card">
        {face}
      </DragGhost>
    </>
  );
}

/**
 * Beat 5 on the stage: the depicted Claude window with a real recorded run, and Brandtwerk's rates
 * as the one file the visitor decides to attach (drag it into the window or tap it). The four case
 * files are always in the message; with the rates the window replays the "mit-saetzen" takes, without
 * them the "ohne-saetze" takes. The arrow in the window's composer plays the recording; the window's
 * own dock switches the skill on and off and offers the downloads. "Unsere Prüfung" lists, for the
 * takes with the rates, which of the totals built on this page the answer contains.
 */
export function ClaudeStep({ pack, fmt, data, rates, onRates, onJump }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly data: TakeHomeData; readonly rates: boolean; readonly onRates: (on: boolean) => void; readonly onJump: (option: string) => void }) {
  const c = pack.claude;
  const windowRef = useRef<HTMLDivElement | null>(null);
  const [over, setOver] = useState(false);
  const set: FileSet = rates ? "mit-saetzen" : "ohne-saetze";
  const scene = data.scene ? sceneFor(data.scene, set) : null;
  const offerName = (option: string) => {
    const key = keyOf(option);
    return key ? pack.offers[key].name : option;
  };
  return (
    <div className="av4-claude" data-av4-claude="" data-set={set}>
      <div className="av4-claude-head">
        <h3 className="av4-takehome-title">{c.title}</h3>
        <p className="av4-note">{scene ? c.lead : c.noScene}</p>
      </div>
      <div className="av4-rates" data-attached={rates ? "" : undefined}>
        <RatesCard pack={pack} attached={rates} target={() => windowRef.current} onAttach={onRates} onOver={setOver} />
        <p className="av4-note">{rates ? c.ratesOn : c.ratesOff}</p>
      </div>
      {scene ? (
        <div ref={windowRef} className="av4-claude-window" data-over={over ? "" : undefined} data-av4-window="">
          <ClaudeDesktopScene key={set} scene={scene} locale={pack.locale === "en" ? "en" : "de"} skillName={data.sceneSkill} kitFiles={data.kitFiles} />
        </div>
      ) : null}
      {set === "mit-saetzen" && data.checks.length > 0 ? (
        <div className="av4-check" data-av4-check="">
          <p className="av4-kicker">{c.check}</p>
          <p className="av4-note">{c.checkNote}</p>
          {data.checks.map((take) => {
            const label = take.withSkill ? c.takeWith : c.takeWithout;
            const index = data.checks.filter((other) => other.withSkill === take.withSkill).indexOf(take) + 1;
            const name = fmt.t(label, { i: index });
            return (
              <div key={take.id} className="av4-check-take" role="group" aria-label={name}>
                <span className="av4-check-label">{name}</span>
                {take.items.map((item) => {
                  const text = fmt.t(item.found ? c.found : c.missing, { amount: fmt.money(item.cents), option: offerName(item.option) });
                  return (
                    <span key={item.option} className="av4-check-item" data-av4-check-item={item.found ? "found" : "missing"}>
                      <GlasChip kind="status" icon={item.found ? "check" : undefined} onClick={() => onJump(item.option)} label={`${text}. ${fmt.t(c.jump, { option: offerName(item.option) })}`}>
                        {text}
                      </GlasChip>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CopyButton({ text, label, done }: { readonly text: string; readonly label: string; readonly done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <GlasButton
      variant="fill"
      size="compact"
      icon={copied ? "check" : "copy"}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
    >
      {copied ? done : label}
    </GlasButton>
  );
}

/** The take-home rows: two files filled here, the skill, two texts, the kit, and the result as one line to copy. */
export function TakeHomeRows({
  pack,
  data,
  fmt,
  own,
  line,
  onTable,
  onMail,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly data: TakeHomeData;
  readonly own: boolean;
  /** The result in one sentence, the kit's or the visitor's. */
  readonly line: string;
  readonly onTable: () => void;
  readonly onMail: () => void;
}) {
  const h = pack.takehome;
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const mark = (key: string) => setDone((current) => new Set([...current, key]));
  return (
    <section className="av4-takehome" aria-labelledby="av4-takehome-title" data-av4-takehome="">
      <h3 id="av4-takehome-title" className="av4-takehome-title">
        {h.title}
      </h3>
      <p className="av4-note">
        {h.lead} {own ? h.fromOwn : h.fromKit}
      </p>
      <ol className="av4-takehome-rows">
        <li>
          <GlasButton
            variant="prominent"
            size="compact"
            icon={done.has("table") ? "check" : "download"}
            onClick={() => {
              onTable();
              mark("table");
            }}
            data-av4-take="table"
          >
            {done.has("table") ? h.downloaded : h.rows.table.button}
          </GlasButton>
          <p className="av4-note">{h.rows.table.line}</p>
        </li>
        <li>
          <GlasButton
            variant="fill"
            size="compact"
            icon={done.has("mail") ? "check" : "download"}
            onClick={() => {
              onMail();
              mark("mail");
            }}
            data-av4-take="mail"
          >
            {done.has("mail") ? h.downloaded : h.rows.mail.button}
          </GlasButton>
          <p className="av4-note">{h.rows.mail.line}</p>
        </li>
        <li>
          <GlasButton variant="fill" size="compact" icon="download" href={data.skillHref} download={data.skillName} data-av4-take="skill">
            {h.rows.skill.button}
          </GlasButton>
          <p className="av4-note">{h.rows.skill.line}</p>
        </li>
        <li>
          <CopyButton text={data.instructions} label={h.rows.instructions.button} done={h.copied} />
          <p className="av4-note">{h.rows.instructions.line}</p>
        </li>
        <li>
          <CopyButton text={data.prompt} label={h.rows.prompt.button} done={h.copied} />
          <p className="av4-note">{h.rows.prompt.line}</p>
        </li>
        <li>
          <GlasButton variant="fill" size="compact" icon="download" href={data.kitHref} download={data.kitName} data-av4-take="kit">
            {fmt.t(h.rows.kit.button, { size: data.kitSize })}
          </GlasButton>
          <p className="av4-note">{h.rows.kit.line}</p>
        </li>
        <li>
          <CopyButton text={line} label={h.rows.line.button} done={h.copied} />
          <p className="av4-note" data-av4-line="">
            {line}
          </p>
        </li>
      </ol>
    </section>
  );
}
