"use client";

import { useMemo, type CSSProperties } from "react";
import { GlasButton, GlasChip } from "@/components/demos/glas";
import { draftClaims, OWNERS, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { mailSegments } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/mail-slots";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { kitText } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import { renderGapRequest } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/render";
import { draftChecks, sampleReplyOf } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/reply-check";
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

/** The four sentences of the managing director's draft (draft-reply.md), the same in both kits. */
export const DRAFT = draftClaims();

/** The draft's greeting line, as the kit writes it. */
const SALUTE = kitText("draft-reply.md").split("\n").find((line) => line.startsWith("Dear ")) ?? "";

/** The gap rows: every request that is not covered, from the kit's best file. */
export function gapRows(model: Model) {
  return model.rows.filter((row) => row.best.status !== "covered");
}

/**
 * Scene 6, first: the managing director's draft reply. A tap on a sentence
 * strikes it and shows what the answer key found in the files; once all four
 * are checked, the sample reply that names only what a file proves writes
 * itself in, line by line. Every word comes from the kit.
 */
function DraftCheck({
  fmt,
  struck,
  onStrike,
  reducedMotion,
}: {
  readonly fmt: Fmt;
  readonly struck: ReadonlySet<number>;
  readonly onStrike: (numbers: readonly number[]) => void;
  readonly reducedMotion: boolean;
}) {
  const d = fmt.copy.takehome.draft;
  const checks = useMemo(() => draftChecks(fmt.locale), [fmt.locale]);
  const reply = useMemo(() => sampleReplyOf(fmt.locale), [fmt.locale]);
  const all = checks.every((check) => struck.has(check.n));
  const checked = checks.filter((check) => struck.has(check.n)).length;
  // A sentence holds when the answer key keeps it; in this kit it strikes all four.
  const held = checks.filter((check) => !/^(STREICHEN|DELETE)$/.test(check.verdict)).length;
  return (
    <section className="w05-draft" aria-labelledby="w05-draft-label" data-w05-draft={checked} data-reduced={reducedMotion ? "" : undefined}>
      <div className="w05-draft-head">
        <p className="w05-label" id="w05-draft-label">
          {d.label}
        </p>
        <span className="w05-draft-count" aria-live="polite" data-w05-draft-count={all ? `held-${held}` : checked}>
          {all ? fmt.t(d.holds, { held, total: checks.length }) : fmt.t(d.progress, { n: checked, total: checks.length })}
        </span>
      </div>
      <p className="w05-hint">{d.hint}</p>
      <div className="w05-draft-sheet">
        <GlasChip kind="file">draft-reply.md</GlasChip>
        <p className="w05-draft-salute" lang="en">
          {SALUTE}
        </p>
        <ol className="w05-draft-claims">
          {checks.map((check) => {
            const done = struck.has(check.n);
            return (
              <li key={check.n} data-struck={done ? "" : undefined}>
                <button type="button" className="w05-claim" aria-pressed={done} onClick={() => onStrike([check.n])} data-w05-claim={check.n}>
                  <span className="w05-claim-n">{check.n}.</span>
                  <span className="w05-claim-text" lang="en">
                    {check.claim}
                  </span>
                </button>
                {done ? (
                  <p className="w05-claim-evidence" data-w05-claim-evidence={check.n}>
                    <span className="w05-stamp" data-status="gap">
                      {check.verdict}
                    </span>
                    <span className="w05-claim-proof">{check.evidence}</span>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
        {all ? null : (
          <GlasButton variant="plain" size="compact" onClick={() => onStrike(checks.map((check) => check.n))} data-w05-draft-all="">
            {d.checkAll}
          </GlasButton>
        )}
      </div>
      {all ? (
        <div className="w05-reply" data-w05-reply="">
          <p className="w05-label">{d.replyLabel}</p>
          <p className="w05-hint">{d.replyHint}</p>
          <div className="w05-reply-text" lang="en">
            {reply.split("\n").map((line, index) => (
              <span key={index} className="w05-reply-line" style={{ "--k": index } as CSSProperties}>
                {line}
              </span>
            ))}
          </div>
          <CopyButton text={reply} label={d.copyReply} done={fmt.copy.takehome.copied} variant="prominent" />
          <p className="w05-reply-signs">{d.signs}</p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Scene 6: the draft reply checked first, then the list of gaps, each with
 * its owner, the document that closes it and the date. A tap on a row fills
 * the request mail from the template, slot by slot; then the files to take
 * home.
 */
export function TakeHomeScene({
  fmt,
  model,
  chosen,
  onChoose,
  struck,
  onStrike,
  files,
  built,
  reducedMotion,
}: {
  readonly fmt: Fmt;
  readonly model: Model;
  readonly chosen: ItemId | null;
  readonly onChoose: (id: ItemId) => void;
  readonly struck: ReadonlySet<number>;
  readonly onStrike: (numbers: readonly number[]) => void;
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
      <DraftCheck fmt={fmt} struck={struck} onStrike={onStrike} reducedMotion={reducedMotion} />
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
      <p className="w05-hint" data-w05-deadlines="">
        {fmt.t(h.deadlines, {
          customer: model.context.customer,
          send: formatShort(model.context.sendBy, locale),
          due: formatShort(model.context.due, locale),
          audit: formatShort(model.context.audit, locale),
        })}
      </p>
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
