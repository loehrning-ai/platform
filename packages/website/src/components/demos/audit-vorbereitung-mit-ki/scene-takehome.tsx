"use client";

import type { CSSProperties } from "react";
import { GlasButton, GlasChip } from "@/components/demos/glas";
import { OWNERS, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { mailSegments } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/mail-slots";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { renderGapRequest } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/render";
import { CopyButton } from "./copy-button";
import { downloadText } from "./download";
import type { Fmt } from "./fmt";

export interface TakeHomeLink {
  readonly href: string;
  readonly download: string;
}

export interface TakeHomeFiles {
  readonly skill: TakeHomeLink & { readonly size: string };
  readonly kit: TakeHomeLink;
  /** The kit files the page showed, by name. */
  readonly shown: readonly string[];
}

/** The three files built in this tab, as text. */
export interface BuiltFiles {
  readonly instructions: string;
  readonly gapList: string;
  readonly index: string;
}

/** The gap rows: every request that is not covered, from the kit's best file. */
export function gapRows(model: Model) {
  return model.rows.filter((row) => row.best.status !== "covered");
}

/**
 * Scene 6: the list of gaps, each with its owner, the document that closes
 * it and the date. A tap on a row fills the request mail from the template,
 * slot by slot; then the files to take home.
 */
export function TakeHomeScene({
  fmt,
  model,
  chosen,
  onChoose,
  files,
  built,
  reducedMotion,
}: {
  readonly fmt: Fmt;
  readonly model: Model;
  readonly chosen: ItemId | null;
  readonly onChoose: (id: ItemId) => void;
  readonly files: TakeHomeFiles;
  readonly built: BuiltFiles;
  readonly reducedMotion: boolean;
}) {
  const { copy, locale } = fmt;
  const h = copy.takehome;
  const rows = gapRows(model);
  const row = rows.find((entry) => entry.item.id === chosen) ?? null;
  const mail = row ? renderGapRequest(row.best, model.context, copy.gapTemplate, locale) : "";
  const segments = row ? mailSegments(copy.gapTemplate, mail) : null;
  let slot = 0;
  return (
    <div className="w05-takehome" id="mitnehmen" data-w05-takehome="">
      <p className="w05-label">{h.rows}</p>
      <ol className="w05-gaps">
        {rows.map((entry) => (
          <li key={entry.item.id}>
            <button
              type="button"
              className="w05-gap"
              aria-pressed={chosen === entry.item.id}
              onClick={() => onChoose(entry.item.id)}
              data-w05-gap={entry.item.id}
            >
              <span className="w05-gap-head">
                <span className="w05-request-id">{entry.item.id}</span>
                <span>{copy.shortName[entry.item.id]}</span>
                <span className="w05-stamp" data-status={entry.best.status}>
                  {copy.stamp[entry.best.status]}
                </span>
              </span>
              <span className="w05-gap-meta">
                {h.owner}: {OWNERS[entry.item.owner][locale]}. {h.closes}: {entry.item.closing[locale]}. {fmt.t(h.dueBy, { date: formatShort(model.context.due, locale) })}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="w05-hint">{row ? fmt.t(h.mailFor, { id: row.item.id }) : h.mailHint}</p>
      {row ? (
        <div className="w05-mail" data-w05-mail={row.item.id} data-reduced={reducedMotion ? "" : undefined} key={row.item.id}>
          <pre className="w05-mail-text" lang={locale}>
            {segments
              ? segments.map((segment, index) =>
                  segment.slot ? (
                    <span key={index} className="w05-slot" style={{ "--k": slot++ } as CSSProperties} title={segment.slot}>
                      {segment.text}
                    </span>
                  ) : (
                    segment.text
                  ),
                )
              : mail}
          </pre>
          <CopyButton text={mail} label={h.copyMail} done={h.copied} variant="prominent" />
        </div>
      ) : null}
      <p className="w05-label">{h.downloads}</p>
      <ul className="w05-downloads">
        <li>
          <span className="w05-download-text">
            <span className="w05-download-head">{h.skill[0]}</span>
            <span className="w05-hint">{h.skill[1]}</span>
          </span>
          <GlasButton variant="prominent" size="compact" icon="download" href={files.skill.href} download={files.skill.download} label={fmt.t(copy.claude.skillZip, { size: files.skill.size })}>
            {files.skill.download}
          </GlasButton>
        </li>
        <li>
          <span className="w05-download-text">
            <span className="w05-download-head">{h.kit[0]}</span>
            <span className="w05-hint">{h.kit[1]}</span>
            <span className="w05-chips">
              {files.shown.map((name) => (
                <GlasChip key={name} kind="file">
                  {name}
                </GlasChip>
              ))}
            </span>
          </span>
          <GlasButton variant="fill" size="compact" icon="download" href={files.kit.href} download={files.kit.download} label={h.kit[0]}>
            {files.kit.download}
          </GlasButton>
        </li>
        {(
          [
            ["instructions", built.instructions, "text/markdown"],
            ["gapList", built.gapList, "text/markdown"],
            ["index", built.index, "text/csv"],
          ] as const
        ).map(([key, text, type]) => (
          <li key={key}>
            <span className="w05-download-text">
              <span className="w05-download-head">{h[key][0]}</span>
              <span className="w05-hint">{h[key][1]}</span>
            </span>
            <GlasButton variant="fill" size="compact" icon="download" onClick={() => downloadText(h.fileNames[key], text, type)} label={h[key][0]} data-w05-build={key}>
              {h.fileNames[key]}
            </GlasButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
