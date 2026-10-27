"use client";

import { GlasButton, GlasSegmented, GlasToggle } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { missingDocMails, missingText, reasonText, safeWording, toMarkdownTable, toRegisterCsv } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { addRow, cleanSentence, fromClaim, GATE_IDS, MAX_ROWS, MAX_SENTENCE, probeOwn, validate, type ClaimInput, type OwnRow } from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import type { Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";
import { CopyButton } from "./copy-button";

/** Hands the visitor a file built in this tab (no server, no storage). */
function saveText(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The probe's row for a claim, as it goes into the visitor's list. */
export function claimRow(claim: ClaimInput, words: Pack["own"]["words"]): OwnRow {
  const input = fromClaim(claim);
  const result = probeOwn(input);
  const sentence = cleanSentence(claim.sentence);
  return { sentence, destination: input.destination, evidence: input.evidence, result, safe: safeWording(input, result, sentence, words), period: "" };
}

/**
 * The second door of beat 7, „Eigene Angabe prüfen": the visitor's own answer
 * next to its file, four checks with one control each, and the ban list
 * first for a marketing claim. The rules are the kit's (own.ts); no AI runs.
 */
export function OwnClaim({
  pack,
  fmt,
  claim,
  rows,
  onClaim,
  onRows,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly claim: ClaimInput;
  readonly rows: readonly OwnRow[];
  readonly onClaim: (claim: ClaimInput) => void;
  readonly onRows: (rows: readonly OwnRow[]) => void;
}) {
  const c = pack.own.claim;
  const words = pack.own.words;
  const set = (patch: Partial<ClaimInput>) => onClaim({ ...claim, ...patch });
  const errors = validate(fromClaim(claim));
  const ready = claim.sentence.trim() !== "" && errors.length === 0;
  const row = ready ? claimRow(claim, words) : null;
  const status = row?.result.status ?? null;
  const mails = missingDocMails(rows, words);

  return (
    <div className="w4-claim" data-w4-claim-door="">
      <p className="w4-note">{c.lead}</p>
      <div className="w4-claim-card">
        <label className="w4-label" htmlFor="w4-claim-sentence">
          {c.sentence}
        </label>
        <textarea
          id="w4-claim-sentence"
          className="w4-input w4-textarea"
          rows={2}
          maxLength={MAX_SENTENCE}
          value={claim.sentence}
          placeholder={c.sentencePlaceholder}
          onChange={(event) => set({ sentence: event.target.value })}
        />
        <p className="w4-note">{fmt.t(c.counter, { n: claim.sentence.length })}</p>
        <GlasToggle checked={claim.marketing} onChange={(marketing) => set({ marketing })} label={c.marketing} />
      </div>
      {claim.marketing ? (
        <fieldset className="w4-claim-gates">
          <legend>{c.gatesHeading}</legend>
          {GATE_IDS.map((gate) => (
            <div key={gate} className="w4-claim-row">
              <p>{c.gates[gate]}</p>
              <GlasSegmented
                label={c.gates[gate]}
                options={[
                  { value: "no", label: c.no },
                  { value: "yes", label: c.yes },
                ]}
                value={claim.gates[gate] ? "yes" : "no"}
                onChange={(value) => set({ gates: { ...claim.gates, [gate]: value === "yes" } })}
              />
            </div>
          ))}
        </fieldset>
      ) : null}
      <div className="w4-claim-row">
        <p className="w4-check-name">{c.zitat}</p>
        <GlasSegmented
          wrap
          label={c.zitat}
          options={(["known", "unknown"] as const).map((value) => ({ value, label: c.zitatOptions[value] }))}
          value={claim.zitat}
          onChange={(zitat) => set({ zitat })}
        />
        {claim.zitat === "known" ? (
          <div className="w4-row">
            <label className="w4-field-inline">
              <span>{c.file}</span>
              <input className="w4-input" value={claim.file} maxLength={80} onChange={(event) => set({ file: event.target.value })} />
            </label>
            <label className="w4-field-inline w4-field-short">
              <span>{c.line}</span>
              <input className="w4-input" value={claim.line} maxLength={20} inputMode="numeric" onChange={(event) => set({ line: event.target.value })} />
            </label>
          </div>
        ) : null}
      </div>
      <div className="w4-claim-row">
        <p className="w4-check-name">{c.zeitraum}</p>
        <GlasSegmented
          label={c.zeitraum}
          options={(["months", "validUntil"] as const).map((value) => ({ value, label: c.zeitraumOptions[value] }))}
          value={claim.zeitraum}
          onChange={(zeitraum) => set({ zeitraum })}
        />
        {claim.zeitraum === "months" ? (
          <fieldset className="w4-month-strip">
            <legend className="w4-note">{c.monthsLabel}</legend>
            {pack.strom.months.map((label, index) => (
              <label key={label} className="w4-month-tick">
                <input
                  type="checkbox"
                  checked={claim.months[index] ?? false}
                  onChange={(event) => set({ months: claim.months.map((on, at) => (at === index ? event.target.checked : on)) })}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="w4-row">
            <label className="w4-field-inline">
              <span>{c.validUntil}</span>
              <input className="w4-input" value={claim.validUntil} maxLength={10} inputMode="numeric" onChange={(event) => set({ validUntil: event.target.value })} />
            </label>
            <label className="w4-field-inline">
              <span>{c.stichtag}</span>
              <input className="w4-input" value={claim.stichtag} maxLength={10} inputMode="numeric" onChange={(event) => set({ stichtag: event.target.value })} />
            </label>
          </div>
        )}
      </div>
      <div className="w4-claim-row">
        <p className="w4-check-name">{c.umfang}</p>
        <GlasSegmented label={c.umfang} options={(["all", "part", "unsure"] as const).map((value) => ({ value, label: c.umfangOptions[value] }))} value={claim.umfang} onChange={(umfang) => set({ umfang })} />
      </div>
      <div className="w4-claim-row">
        <p className="w4-check-name">{c.freigabe}</p>
        <GlasSegmented label={c.freigabe} options={(["yes", "no", "unsure"] as const).map((value) => ({ value, label: c.freigabeOptions[value] }))} value={claim.freigabe} onChange={(freigabe) => set({ freigabe })} />
        <p className="w4-note">{c.freigabeHelp}</p>
      </div>
      <div className="w4-claim-result" aria-live="polite" data-w4-claim-result={status ?? "empty"}>
        {row && status ? (
          <>
            <p className="w4-status-line">
              <StatusGlyph status={status} size={18} />
              {fmt.t(c.result, { status: words.statuses[status] })}
            </p>
            {row.result.reasons.map((reason) => (
              <p key={reasonText(reason, words)}>{reasonText(reason, words)}</p>
            ))}
            {row.result.missing.map((doc) => (
              <p key={missingText(doc, words)} className="w4-slot-line">
                {fmt.t(c.missing, { doc: missingText(doc, words) })}
              </p>
            ))}
          </>
        ) : (
          <p className="w4-note">{c.empty}</p>
        )}
      </div>
      <p className="w4-note">{c.limit}</p>
      <div className="w4-row">
        <GlasButton
          variant="fill"
          size="compact"
          icon="plus"
          disabled={!row || rows.length >= MAX_ROWS}
          onClick={() => {
            if (row) onRows(addRow(rows, row));
          }}
          data-w4-claim-add=""
        >
          {c.add}
        </GlasButton>
      </div>
      {rows.length >= MAX_ROWS ? <p className="w4-note">{c.full}</p> : null}
      {rows.length > 0 ? (
        <section className="w4-claim-list" aria-label={fmt.t(c.listHeading, { n: rows.length })}>
          <p className="w4-kicker">{fmt.t(c.listHeading, { n: rows.length })}</p>
          <ol>
            {rows.map((entry, index) => (
              <li key={`${index}-${entry.sentence}`}>
                <StatusGlyph status={entry.result.status} label={words.statuses[entry.result.status]} size={16} />
                <span>{entry.sentence}</span>
              </li>
            ))}
          </ol>
          <div className="w4-row">
            <GlasButton variant="fill" size="compact" icon="download" onClick={() => saveText(toRegisterCsv(rows, words), c.downloadName, "text/csv;charset=utf-8")}>
              {c.download}
            </GlasButton>
            <CopyButton text={toMarkdownTable(rows, words)} label={c.copyTable} done={pack.own.copied} variant="plain" />
          </div>
          {mails.length > 0 ? (
            <>
              <p className="w4-kicker">{c.mailsHeading}</p>
              {mails.map((mail) => (
                <div key={mail.doc} className="w4-mail">
                  <p>{mail.doc}</p>
                  <CopyButton text={mail.text} label={c.copyMail} done={pack.own.copied} variant="plain" />
                </div>
              ))}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
