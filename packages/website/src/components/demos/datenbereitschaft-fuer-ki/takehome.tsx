"use client";

import { useState } from "react";
import { GlasButton, GlasPanel } from "@/components/demos/glas";
import { TAKEHOME_TARGET_ID } from "@/components/demos/shell";
import { clean, validateCard, type OwnCard } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { checklistMd, definitionsMd, projectInstructions, skillZip } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import type { Fmt } from "./fmt";

export interface TakeHomeHrefs {
  /** The kit zip. */
  readonly kit: string;
  /** The public skill zip (SKILL.md only), for a visitor without a card. */
  readonly skill: string;
  /** The printable question card. */
  readonly card: string;
}

function save(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Item({ name, does, children, extra }: { readonly name: string; readonly does: string; readonly children: React.ReactNode; readonly extra?: React.ReactNode }) {
  return (
    <li className="w03-take">
      <div className="w03-take-text">
        <p className="w03-take-name">{name}</p>
        <p className="w03-take-does">{does}</p>
        {extra}
      </div>
      <div className="w03-take-buttons">{children}</div>
    </li>
  );
}

function CopyPrompt({ text, copy, copied }: { readonly text: string; readonly copy: string; readonly copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <li className="w03-prompt">
      <p className="w03-prompt-text">{text}</p>
      <GlasButton
        variant="glass"
        size="compact"
        icon={done ? "check" : "copy"}
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(
            () => setDone(true),
            () => setDone(false),
          );
        }}
      >
        {done ? copied : copy}
      </GlasButton>
    </li>
  );
}

/**
 * The take-home: each file says what it does for the visitor next to its
 * button. Built from the visitor's card when it is complete, otherwise the
 * kit's own FOLDLINE card ("die Fassung aus dem Kit"). Nothing is uploaded.
 */
export function TakeHome({ pack, fmt, card, hrefs }: { readonly pack: Pack; readonly fmt: Fmt; readonly card: OwnCard; readonly hrefs: TakeHomeHrefs }) {
  const t = pack.takehome;
  const mine = validateCard(card, pack.locale).length === 0;
  const used = mine ? card : (pack.presets[0]?.card as OwnCard);
  const names = pack.files.names;
  return (
    <GlasPanel material="regular" shape="card" live={false} className="w03-takehome" data-w03-takehome="">
      <p className="w03-objective" data-w03-objective="">
        {t.objective}
      </p>
      <p className="w03-take-lead">{t.lead}</p>
      <p className="w03-take-from">{mine ? t.fromCard : t.fromKit}</p>
      <ul className="w03-takes">
        <Item name={t.skill.name} does={mine ? t.skill.withCard : t.skill.plain}>
          {mine ? (
            <GlasButton variant="prominent" size="compact" icon="download" onClick={() => save("kennzahl-fragekarte.zip", new Uint8Array(skillZip(used, pack.files)), "application/zip")} data-w03-take="skill">
              {t.skill.button}
            </GlasButton>
          ) : (
            <GlasButton variant="prominent" size="compact" icon="download" href={hrefs.skill} download data-w03-take="skill">
              {t.skill.button}
            </GlasButton>
          )}
        </Item>
        <Item name={t.project.name} does={t.project.does} extra={<p className="w03-take-lock">{fmt.t(t.project.lock, { never: clean(used.never) })}</p>}>
          <GlasButton variant="glass" size="compact" icon="download" onClick={() => save(names.instructions, projectInstructions(used, pack.files), "text/plain;charset=utf-8")} data-w03-take="instructions">
            {t.project.buttonInstructions}
          </GlasButton>
          <GlasButton variant="glass" size="compact" icon="download" onClick={() => save("kennzahlen.md", definitionsMd(used, pack.files), "text/markdown;charset=utf-8")} data-w03-take="definitions">
            {t.project.buttonDefinitions}
          </GlasButton>
        </Item>
        <Item name={t.checklist.name} does={t.checklist.does}>
          <GlasButton variant="glass" size="compact" icon="download" onClick={() => save(names.checklist, checklistMd(used, pack.files), "text/markdown;charset=utf-8")} data-w03-take="checklist">
            {t.checklist.button}
          </GlasButton>
        </Item>
        <li className="w03-take w03-take-prompts">
          <div className="w03-take-text">
            <p className="w03-take-name">{t.prompts.name}</p>
            <p className="w03-take-does">{t.prompts.does}</p>
          </div>
          <ol className="w03-prompts">
            {t.prompts.items.map((text) => (
              <CopyPrompt key={text} text={text} copy={t.prompts.copy} copied={t.prompts.copied} />
            ))}
          </ol>
        </li>
        <Item name={t.card.name} does={t.card.does}>
          <GlasButton variant="glass" size="compact" href={hrefs.card} data-w03-take="card">
            {t.card.button}
          </GlasButton>
        </Item>
        <Item name={t.kit.name} does={t.kit.does} extra={<p className="w03-take-lock">{t.kit.lead}</p>}>
          <GlasButton variant="glass" size="compact" icon="download" href={hrefs.kit} download data-w03-take="kit">
            {t.kit.button}
          </GlasButton>
        </Item>
      </ul>
      <p className="w03-take-to">
        <a href={`#${TAKEHOME_TARGET_ID}`} className="w03-link">
          {t.toClaude}
        </a>
      </p>
    </GlasPanel>
  );
}
