"use client";

import { useState } from "react";
import { GLAS_PRIORITY, GlasButton, GlasDropZone, GlasPanel, GlasSegmented } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { morphEnd } from "@/lib/demo-cases/esg-berichte-mit-ki/months-layout";
import { MAX_BYTES, parseBills, type ParsedBills, type ParseError } from "@/lib/demo-cases/esg-berichte-mit-ki/own-csv";
import { ownReport, reportMail, reportSentences, reportTable } from "@/lib/demo-cases/esg-berichte-mit-ki/own-report";
import type { Fmt } from "./fmt";
import { MonthsChart, MorphGrabber } from "./months-chart";
import { morphValueText } from "./scene-strom";

/** The visitor's file as this tab holds it: the parsed rows and the chosen year. Never stored, never sent. */
export interface OwnFile {
  readonly parsed: ParsedBills;
  readonly year: number;
  readonly t: number;
}

export function CopyButton({ text, label, done, variant = "fill", data }: { readonly text: string; readonly label: string; readonly done: string; readonly variant?: "fill" | "plain" | "prominent"; readonly data?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <GlasButton
      variant={variant}
      size="compact"
      icon={copied ? "check" : "copy"}
      data-w4-copy={data}
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
 * Beat 7, „Deine Datei": the visitor's own bill export, checked in this tab
 * the way the electricity file was. Drop, choose or paste; the rows morph
 * into months, and the result names the missing invoices.
 */
export function OwnFileStep({
  pack,
  fmt,
  kit,
  file,
  onFile,
  reducedMotion,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly file: OwnFile | null;
  readonly onFile: (file: OwnFile | null) => void;
  readonly reducedMotion: boolean;
}) {
  const own = pack.own;
  const [error, setError] = useState<ParseError | null>(null);
  const [paste, setPaste] = useState("");

  const take = (text: string) => {
    const result = parseBills(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onFile({ parsed: result, year: result.year, t: 1 });
  };

  const report = file ? ownReport(file.parsed.rows, file.year) : null;
  const unit = file?.parsed.unit ?? "";
  const amount = (value: number) => `${fmt.n(value)}${unit ? ` ${unit}` : ""}`;
  const otherYears = file ? file.parsed.rows.length - (report?.rows.length ?? 0) : 0;

  return (
    <div className="w4-own" data-w4-own="">
      <p className="w4-privacy" data-w4-privacy="">
        {own.privacy}
      </p>
      {!file ? (
        <GlasDropZone
          text={<span className="w4-drop-text">{own.drop}</span>}
          buttonLabel={own.choose}
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          onFile={(chosen) => {
            if (chosen.size > MAX_BYTES) {
              setError("tooBig");
              return;
            }
            chosen.text().then(take, () => setError("empty"));
          }}
          error={error ? own.errors[error].join(" ") : undefined}
          className="w4-drop"
        >
          <div className="w4-own-paste">
            <label className="w4-label" htmlFor="w4-own-paste">
              {own.pasteLabel}
            </label>
            <textarea id="w4-own-paste" className="w4-input w4-textarea" rows={3} value={paste} placeholder={own.pastePlaceholder} onChange={(event) => setPaste(event.target.value)} spellCheck={false} />
            <div className="w4-row">
              <GlasButton variant="fill" size="compact" disabled={paste.trim() === ""} onClick={() => take(paste)} data-w4-paste-run="">
                {own.pasteRun}
              </GlasButton>
              <GlasButton variant="plain" size="compact" icon="doc" onClick={() => take(kit.stromText)} data-w4-example="">
                {own.example}
              </GlasButton>
            </div>
          </div>
        </GlasDropZone>
      ) : (
        <>
          {file.parsed.years.length > 1 ? (
            <GlasSegmented
              label={own.yearLabel}
              options={file.parsed.years.slice(0, 4).map((year) => ({ value: String(year), label: String(year) }))}
              value={String(file.year)}
              onChange={(year) => onFile({ ...file, year: Number(year) })}
            />
          ) : null}
          <div className="w4-own-chart">
            <MonthsChart
              rows={report?.rows ?? []}
              year={file.year}
              t={file.t}
              monthLabels={pack.strom.months}
              label={fmt.t(own.resultCovered, { n: report?.covered ?? 0, year: file.year })}
              twice={pack.strom.twice}
              rowText={(row) => `${row.line}  ${row.month} ${row.invoice} ${fmt.n(row.amount)}`}
            />
          </div>
          <MorphGrabber
            t={file.t}
            onChange={(t) => onFile({ ...file, t })}
            label={pack.strom.grabberLabel}
            valueText={(t) => morphValueText(pack, t)}
            text={file.t >= 0.5 ? pack.strom.unsortButton : pack.strom.sortButton}
            reducedMotion={reducedMotion}
          />
          {report ? (
            <GlasPanel material="regular" shape="card" live={GLAS_PRIORITY.readout} className="w4-readout w4-readout-own" data-w4-readout="">
              <div className="w4-readout-body" aria-live="polite">
                <p className="w4-readout-lead">
                  {morphEnd(file.t) === "rows"
                    ? fmt.t(own.readoutRows, { naive: amount(report.naive) })
                    : fmt.t(own.readoutMonths, { distinct: amount(report.distinct), n: report.covered })}
                </p>
                {reportSentences(report, own).map((sentence) => (
                  <p key={sentence} data-w4-own-result="">
                    {sentence}
                  </p>
                ))}
                {otherYears > 0 ? <p className="w4-note">{fmt.t(own.otherYears, { n: otherYears })}</p> : null}
                {file.parsed.skipped > 0 ? <p className="w4-note">{fmt.t(own.skipped, { n: file.parsed.skipped })}</p> : null}
              </div>
            </GlasPanel>
          ) : null}
          {report ? (
            <div className="w4-row">
              <CopyButton text={reportTable(report, own, (value) => fmt.n(value))} label={own.copyTable} done={own.copied} data="table" />
              {reportMail(report, own) ? <CopyButton text={reportMail(report, own) ?? ""} label={own.copyMails} done={own.copied} variant="plain" data="mail" /> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
