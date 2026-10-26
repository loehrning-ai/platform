"use client";

import { useRef, useState } from "react";
import { GlasButton, GlasChip } from "@/components/demos/glas";
import { revealIfOffscreen } from "@/components/demos/shell";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import type { CheckItem } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/our-check";
import { keyOf } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";
import { useDragTo } from "./use-drag";

export type FileKey = "anfrage" | "A" | "B" | "C" | "intern";
export const FILE_KEYS: readonly FileKey[] = ["anfrage", "A", "B", "C", "intern"];
export const FILE_NAMES: Readonly<Record<FileKey, string>> = {
  anfrage: "anfrage.md",
  A: "angebot-a-nuernberg.md",
  B: "angebot-b-poznan.md",
  C: "angebot-c-brno.md",
  intern: "kosten-intern.md",
};
export type FileSet = "ohne-saetze" | "mit-saetzen";

/** The recorded file sets: the request and all three offers, with or without Brandtwerk's rates. */
export function fileSetOf(attached: readonly FileKey[]): FileSet | null {
  const has = (key: FileKey) => attached.includes(key);
  if (!has("anfrage") || !has("A") || !has("B") || !has("C")) return null;
  return has("intern") ? "mit-saetzen" : "ohne-saetze";
}

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
  /** The scene's prompt chip per file set, in this language. */
  readonly setLabels: Readonly<Record<FileSet, string>>;
  readonly checks: readonly CheckTake[];
}

function FileCard({
  pack,
  file,
  attached,
  composer,
  onToggle,
  onAttach,
  onOver,
}: {
  readonly pack: DemoPack;
  readonly file: FileKey;
  readonly attached: boolean;
  readonly composer: () => HTMLElement | null;
  readonly onToggle: () => void;
  readonly onAttach: () => void;
  readonly onOver: (over: boolean) => void;
}) {
  const drag = useDragTo<"composer">(
    () => ({ composer: composer() }),
    () => onAttach(),
    (target) => onOver(target === "composer"),
  );
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={attached}
      className="av4-file-card"
      style={drag.offset ? { transform: `translate(${drag.offset.x}px, ${drag.offset.y}px)` } : undefined}
      data-dragging={drag.offset ? "" : undefined}
      onClick={onToggle}
      data-av4-file={file}
      {...drag.bind}
    >
      <span className="av4-file-check" aria-hidden="true" />
      <span className="av4-file-name">{pack.claude.files[file]}</span>
      <span className="av4-file-meta">
        {FILE_NAMES[file]} · {pack.claude.attach}
      </span>
    </button>
  );
}

/** Opens the recorded take of a file set in the shared Claude scene below the demo. */
function showInScene(label: string, reducedMotion: boolean): boolean {
  const scene = document.querySelector("[data-claude-scene]");
  if (!scene) return false;
  const chip = Array.from(scene.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim() === label);
  chip?.click();
  revealIfOffscreen(scene.closest("[data-claude-scene-section]") ?? scene, reducedMotion);
  return Boolean(chip);
}

/**
 * Beat 5 on the stage: the case's five documents as paper cards to drag into a message to Claude
 * (or tick), the one recorded prompt, and "Unsere Prüfung" for the takes with Brandtwerk's rates.
 * The recordings themselves play in the shared scene under the demo; this only picks the file set.
 */
export function Composer({
  pack,
  fmt,
  data,
  attached,
  onAttached,
  reducedMotion,
  onJump,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly data: TakeHomeData;
  readonly attached: readonly FileKey[];
  readonly onAttached: (files: readonly FileKey[]) => void;
  readonly reducedMotion: boolean;
  readonly onJump: (option: string) => void;
}) {
  const c = pack.claude;
  const composer = useRef<HTMLDivElement | null>(null);
  const [over, setOver] = useState(false);
  const [missing, setMissing] = useState(false);
  const set = fileSetOf(attached);
  const toggle = (file: FileKey) => onAttached(attached.includes(file) ? attached.filter((key) => key !== file) : FILE_KEYS.filter((key) => key === file || attached.includes(key)));
  const attach = (file: FileKey) => onAttached(FILE_KEYS.filter((key) => key === file || attached.includes(key)));
  const offerName = (option: string) => {
    const key = keyOf(option);
    return key ? pack.offers[key].name : option;
  };
  return (
    <div className="av4-claude" data-av4-claude="">
      <div className="av4-tray" role="group" aria-label={c.tray}>
        <p className="av4-kicker">{c.tray}</p>
        <div className="av4-tray-cards">
          {FILE_KEYS.map((file) => (
            <FileCard
              key={file}
              pack={pack}
              file={file}
              attached={attached.includes(file)}
              composer={() => composer.current}
              onToggle={() => toggle(file)}
              onAttach={() => attach(file)}
              onOver={setOver}
            />
          ))}
        </div>
      </div>
      <div ref={composer} className="av4-composer" data-over={over ? "" : undefined} aria-label={c.composer} role="group" data-av4-composer="">
        <div className="av4-composer-files">
          {attached.length === 0 ? <span className="av4-composer-drop">{c.composerDrop}</span> : null}
          {attached.map((file) => (
            <GlasChip key={file} kind="file" onClick={() => toggle(file)} label={`${FILE_NAMES[file]}, ${c.attach}`}>
              {FILE_NAMES[file]}
            </GlasChip>
          ))}
        </div>
        <p className="av4-composer-prompt" data-av4-prompt="">
          {c.prompt}
        </p>
        <div className="av4-composer-send">
          <GlasButton
            variant="prominent"
            size="compact"
            icon="send"
            disabled={set === null}
            onClick={() => {
              if (set) setMissing(!showInScene(data.setLabels[set], reducedMotion));
            }}
            data-av4-send=""
          >
            {c.send}
          </GlasButton>
        </div>
      </div>
      {missing ? <p className="av4-note">{c.noScene}</p> : null}
      {set === "mit-saetzen" && data.checks.length > 0 ? (
        <div className="av4-check" data-av4-check="">
          <p className="av4-kicker">{c.check}</p>
          <p className="av4-note">{c.checkNote}</p>
          {data.checks.map((take, index) => (
            <div key={take.id} className="av4-check-take" role="group" aria-label={fmt.t(c.takeOf, { i: index + 1 })}>
              <span className="av4-check-label">{fmt.t(c.takeOf, { i: index + 1 })}</span>
              {take.items.map((item) => (
                <span key={item.option} className="av4-check-item" data-av4-check-item={item.found ? "found" : "missing"}>
                  <GlasChip
                    kind="status"
                    icon={item.found ? "check" : undefined}
                    onClick={() => onJump(item.option)}
                    label={`${fmt.t(item.found ? c.found : c.missing, { amount: fmt.money(item.cents), option: offerName(item.option) })}. ${fmt.t(c.jump, { amount: fmt.money(item.cents), option: offerName(item.option) })}`}
                  >
                    {fmt.t(item.found ? c.found : c.missing, { amount: fmt.money(item.cents), option: offerName(item.option) })}
                  </GlasChip>
                </span>
              ))}
            </div>
          ))}
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

/** The six take-home rows (contract section 9): two files filled here, the skill, two texts, the kit. */
export function TakeHomeRows({
  pack,
  fmt,
  data,
  own,
  onTable,
  onMail,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly data: TakeHomeData;
  readonly own: boolean;
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
      </ol>
    </section>
  );
}
