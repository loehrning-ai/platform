"use client";

import { GlasButton, GlasChip } from "@/components/demos/glas";
import { daysBetween } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { CopyButton } from "./copy-button";
import { downloadText } from "./download";
import type { Fmt } from "./fmt";

export interface TakeHomeLink {
  readonly href: string;
  readonly download: string;
}

export interface TakeHomeFiles {
  readonly skill: TakeHomeLink & { readonly size: string };
  readonly kit: TakeHomeLink & { readonly size: string };
  /** The kit files the page showed, by name. */
  readonly shown: readonly string[];
}

/** The briefing for the person who is present at the visit: what happens, what to answer, what not to sign. */
export function briefingText(fmt: Fmt, model: Model): string {
  const { copy } = fmt;
  const days = daysBetween(model.visit, model.clock[model.clock.length - 1]?.papersDue ?? model.visit);
  const last = model.clock[model.clock.length - 1];
  const due = last ? fmt.short(last.papersDue, last.papersDueWeekday) : "";
  return copy.takehome.briefing.map((line) => fmt.t(line, { visit: fmt.date(model.visit), days, papers: due })).join("\n\n");
}

/** Scene 8: the kit, the skill and a briefing built in this tab. */
export function TakeHomeScene({ fmt, model, files }: { readonly fmt: Fmt; readonly model: Model; readonly files: TakeHomeFiles }) {
  const { copy } = fmt;
  const h = copy.takehome;
  const text = briefingText(fmt, model);
  return (
    <div className="w05-takehome" id="mitnehmen" data-w05-takehome="">
      <ul className="w05-downloads">
        <li data-w05-file="kit">
          <span className="w05-download-text">
            <span className="w05-file-name">{files.kit.download}</span>
            <span className="w05-hint">{`${files.kit.size}, ${h.edition}`}</span>
          </span>
          <GlasButton variant="fill" size="compact" icon="download" href={files.kit.href} download={files.kit.download} label={h.kit}>
            {h.kit}
          </GlasButton>
        </li>
        <li data-w05-file="skill">
          <span className="w05-download-text">
            <span className="w05-file-name">{files.skill.download}</span>
            <span className="w05-hint">{files.skill.size}</span>
          </span>
          <GlasButton variant="fill" size="compact" icon="download" href={files.skill.href} download={files.skill.download} label={h.skill}>
            {h.skill}
          </GlasButton>
        </li>
      </ul>
      <div className="w05-shown">
        <p className="w05-label">{h.shown}</p>
        <p className="w05-chips">
          {files.shown.map((name) => (
            <GlasChip key={name} kind="file">
              {name}
            </GlasChip>
          ))}
        </p>
      </div>
      <section className="w05-sheet-card" aria-label={h.briefingLabel}>
        <p className="w05-label">{h.briefingLabel}</p>
        <pre className="w05-note" data-w05-briefing="">
          {text}
        </pre>
        <p className="w05-actions">
          <CopyButton text={text} label={h.copy} done={h.copied} variant="prominent" />
          <GlasButton variant="fill" size="compact" icon="download" onClick={() => downloadText(h.fileName, text)} data-w05-build="briefing">
            {h.download}
          </GlasButton>
        </p>
      </section>
    </div>
  );
}
