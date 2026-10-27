"use client";

import { useState } from "react";
import { GlasButton, GlasToggle } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { buildSkillZip, renderProjectInstructions, renderReferences, SKILL_FILE, SKILL_NAME } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import type { OwnCard } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import type { Fmt } from "./fmt";

export interface TakeHomeFiles {
  readonly skillText: string;
  readonly instructions: string;
  readonly plainSkillHref: string;
  readonly templateHref: string;
  readonly templateName: string;
  readonly kitHref: string;
  readonly kitName: string;
}

/** Hands the visitor a file built in this tab (no server, no storage). */
function saveBytes(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CopyText({ text, label, done }: { readonly text: string; readonly label: string; readonly done: string }) {
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

/**
 * "Mitnehmen": the skill with the visitor's cards (packed here), the
 * template, the kit, and behind one button the project instructions and the
 * two check prompts.
 */
export function TakeHome({
  pack,
  fmt,
  files,
  cards,
  craftCard,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly files: TakeHomeFiles;
  readonly cards: readonly OwnCard[];
  readonly craftCard: OwnCard;
}) {
  const h = pack.takehome;
  const [withCraft, setWithCraft] = useState(false);
  const [more, setMore] = useState(false);
  const chosen = withCraft ? [...cards, craftCard] : cards;
  const instructions = renderProjectInstructions(files.instructions, chosen, pack.own.card);
  return (
    <div className="w02-takehome" data-w02-takehome="">
      <ol className="w02-takehome-rows">
        <li data-row="skill">
          <p className="w02-takehome-head">{chosen.length > 0 ? h.zip : h.zipEmpty}</p>
          <p className="w02-note">{chosen.length > 0 ? fmt.t(h.zipNote, { n: chosen.length, file: SKILL_FILE }) : fmt.t(h.zipNoteEmpty, { file: SKILL_FILE })}</p>
          <GlasToggle checked={withCraft} onChange={setWithCraft} label={fmt.t(h.craft)} />
          {chosen.length > 0 ? (
            <GlasButton
              variant="prominent"
              size="compact"
              icon="download"
              onClick={() => saveBytes(buildSkillZip(files.skillText, renderReferences(chosen, pack.own.card, pack.own.referencesTitle)), `${SKILL_NAME}.zip`)}
              data-w02-zip=""
            >
              {h.zip}
            </GlasButton>
          ) : (
            <GlasButton variant="prominent" size="compact" icon="download" href={files.plainSkillHref} download={`${SKILL_NAME}.zip`}>
              {h.zipEmpty}
            </GlasButton>
          )}
        </li>
        <li data-row="template">
          <p className="w02-takehome-head">{h.template}</p>
          <GlasButton variant="fill" size="compact" icon="download" href={files.templateHref} download={files.templateName}>
            {files.templateName}
          </GlasButton>
        </li>
        <li data-row="kit">
          <p className="w02-takehome-head">{h.kit}</p>
          <p className="w02-note">{h.kitLine}</p>
          <GlasButton variant="fill" size="compact" icon="download" href={files.kitHref} download={files.kitName}>
            {files.kitName}
          </GlasButton>
        </li>
        <li data-row="more">
          <GlasButton variant="plain" size="compact" aria-expanded={more} onClick={() => setMore((open) => !open)}>
            {more ? h.moreClose : h.moreOpen}
          </GlasButton>
          {more ? (
            <div className="w02-takehome-more">
              <p className="w02-takehome-head">{h.instructionsHead}</p>
              <p className="w02-note">{h.instructionsLead}</p>
              <pre className="w02-markdown w02-markdown-scroll">{instructions}</pre>
              <CopyText text={instructions} label={h.copy} done={h.copied} />
              <p className="w02-takehome-head">{h.promptsHead}</p>
              {h.prompts.map((prompt) => (
                <div key={prompt} className="w02-prompt">
                  <p>{prompt}</p>
                  <CopyText text={prompt} label={h.copy} done={h.copied} />
                </div>
              ))}
            </div>
          ) : null}
        </li>
      </ol>
      <p className="w02-note">{h.below}</p>
    </div>
  );
}
