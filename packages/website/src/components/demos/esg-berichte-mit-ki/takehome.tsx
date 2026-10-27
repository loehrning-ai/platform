"use client";

import { GlasButton, GlasChip } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { CopyButton } from "./copy-button";

export type TakeHomeKey = "skill" | "card" | "instructions" | "register" | "mail" | "checklist" | "kit";

export interface TakeHomeLink {
  readonly key: TakeHomeKey;
  readonly href: string;
  readonly download: string;
}

export interface TakeHomeFiles {
  readonly links: readonly TakeHomeLink[];
  /** The kit files the page quoted, by name. */
  readonly shown: readonly string[];
  /** The kit's five prompts, as sent for the recordings. */
  readonly prompts: readonly string[];
}

/**
 * Beat 8, „Mitnehmen": every file is real and says what it does; the three
 * recorded prompts can be copied; the visitor's own month check comes along
 * when beat 7 has one.
 */
export function TakeHome({
  pack,
  files,
  ownLine,
  ownTable,
}: {
  readonly pack: Pack;
  readonly files: TakeHomeFiles;
  readonly ownLine: string | null;
  readonly ownTable: string | null;
}) {
  const h = pack.takehome;
  return (
    <div className="w4-takehome" data-w4-takehome="">
      <p className="w4-kicker">{h.heading}</p>
      <ol className="w4-takehome-list">
        {files.links.map((link, index) => {
          const [label, description] = h.items[link.key];
          return (
            <li key={link.key} data-w4-take={link.key}>
              <div className="w4-takehome-text">
                <p className="w4-takehome-head">{label}</p>
                <p className="w4-note">{description}</p>
                {link.key === "kit" ? (
                  <div className="w4-chips">
                    {files.shown.map((name) => (
                      <GlasChip key={name} kind="file">
                        {name}
                      </GlasChip>
                    ))}
                  </div>
                ) : null}
              </div>
              <GlasButton variant={index === 0 ? "prominent" : "fill"} size="compact" icon="download" href={link.href} download={link.download} label={label}>
                {link.download}
              </GlasButton>
            </li>
          );
        })}
        <li data-w4-take="prompts">
          <div className="w4-takehome-text">
            <p className="w4-takehome-head">{h.prompts}</p>
            <p className="w4-note">{h.promptsLead}</p>
            {files.prompts.map((prompt) => (
              <div key={prompt} className="w4-prompt">
                <p>{prompt}</p>
                <CopyButton text={prompt} label={h.copy} done={h.copied} variant="plain" />
              </div>
            ))}
          </div>
        </li>
        {ownLine ? (
          <li data-w4-take="own">
            <div className="w4-takehome-text">
              <p className="w4-takehome-head">{h.own}</p>
              <p className="w4-note">{ownLine}</p>
            </div>
            {ownTable ? <CopyButton text={ownTable} label={pack.own.copyTable} done={pack.own.copied} /> : null}
          </li>
        ) : null}
      </ol>
    </div>
  );
}
