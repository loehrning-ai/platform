"use client";

import { useId, useState } from "react";
import { GlasButton, GlasDropZone } from "@/components/demos/glas";
import { STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { LIMITS, parse, parseCents, type CostRow, type Lang, type ParseError, type Per } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";
import type { Fmt } from "./fmt";

/** One row of the editor, as typed. */
export interface DraftRow {
  readonly option: string;
  readonly line: string;
  readonly amount: string;
  readonly per: Per;
  readonly source: string;
}

/** The visitor's own offers: the pasted text, the editor rows, and the rows last read without an error. */
export interface OwnState {
  readonly text: string;
  readonly draft: readonly DraftRow[];
  readonly rows: readonly CostRow[] | null;
  readonly second: boolean;
  readonly errors: readonly ParseError[];
  readonly editor: boolean;
}

export const NO_OWN: OwnState = { text: "", draft: [], rows: null, second: false, errors: [], editor: false };
export const EMPTY_ROW: DraftRow = { option: "", line: "", amount: "", per: "recurring", source: "" };
/** Only the pasted text is kept as a draft in this browser, never the rows. */
export const DRAFT_KEY = "loehrning-w06-own-text";

const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** The editor rows as the kit's CSV, so one parser reads pasted text, files and the editor. */
export function draftToCsv(draft: readonly DraftRow[]): string {
  const { columns, once, recurring } = STACK;
  const head = [columns.option, columns.line, columns.amount, columns.per, columns.source].join(",");
  const body = draft
    .filter((row) => row.option || row.line || row.amount)
    .map((row) => [row.option, row.line, row.amount, row.per === "once" ? once : recurring, row.source].map(cell).join(","));
  return [head, ...body].join("\n");
}

/** Rows read without an error, back into the editor ("1400" or "1400,50"). */
export function rowsToDraft(rows: readonly CostRow[], lang: Lang): readonly DraftRow[] {
  return rows.map((row) => {
    const euros = Math.trunc(Math.abs(row.cents) / 100);
    const cents = Math.abs(row.cents) % 100;
    const amount = `${row.cents < 0 ? "-" : ""}${euros}${cents ? `${lang === "de" ? "," : "."}${String(cents).padStart(2, "0")}` : ""}`;
    return { option: row.option, line: row.line, amount, per: row.per, source: row.src };
  });
}

export function errorText(pack: DemoPack, fmt: Fmt, error: ParseError): string {
  const vars: Record<string, string | number> = { ...error } as unknown as Record<string, string | number>;
  return fmt.t(pack.deins.errors[error.kind], vars);
}

/** Reads text as offers; the result goes to the stage only when nothing failed. */
export function readOwn(text: string, lang: Lang): { readonly rows: readonly CostRow[] | null; readonly errors: readonly ParseError[] } {
  const parsed = parse(text, lang, STACK);
  return parsed.errors.length > 0 ? { rows: null, errors: parsed.errors } : { rows: parsed.rows, errors: [] };
}

function Editor({ pack, fmt, draft, onDraft }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly draft: readonly DraftRow[]; readonly onDraft: (draft: readonly DraftRow[]) => void }) {
  const c = pack.deins.columns;
  const rows = draft.length > 0 ? draft : [EMPTY_ROW];
  const set = (index: number, patch: Partial<DraftRow>) => onDraft(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  return (
    <div className="av4-editor" data-av4-editor="">
      <div className="av4-editor-head" aria-hidden="true">
        <span>{c.option}</span>
        <span>{c.line}</span>
        <span>{c.amount}</span>
        <span>{c.per}</span>
        <span>{c.source}</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <div key={index} className="av4-editor-row" role="group" aria-label={`${pack.deins.editor} ${index + 1}`}>
          <input aria-label={c.option} value={row.option} maxLength={40} onChange={(event) => set(index, { option: event.target.value })} />
          <input aria-label={c.line} value={row.line} maxLength={40} onChange={(event) => set(index, { line: event.target.value })} />
          <input aria-label={c.amount} value={row.amount} inputMode="decimal" maxLength={18} onChange={(event) => set(index, { amount: event.target.value })} />
          <select aria-label={c.per} value={row.per} onChange={(event) => set(index, { per: event.target.value === "once" ? "once" : "recurring" })}>
            <option value="recurring">{pack.deins.recurring}</option>
            <option value="once">{pack.deins.once}</option>
          </select>
          <input aria-label={c.source} value={row.source} maxLength={LIMITS.source} onChange={(event) => set(index, { source: event.target.value })} />
          <GlasButton variant="icon" size="compact" icon="close" label={fmt.t(pack.deins.removeRow, { n: index + 1 })} onClick={() => onDraft(rows.filter((_, at) => at !== index))} />
        </div>
      ))}
      <GlasButton variant="plain" size="compact" icon="plus" onClick={() => onDraft([...rows, { ...EMPTY_ROW, per: rows[rows.length - 1]?.per ?? "recurring" }])} data-av4-add-row="">
        {pack.deins.addRow}
      </GlasButton>
    </div>
  );
}

/**
 * Beat 4: the visitor's own offers. A CSV dropped or chosen, rows pasted from a spreadsheet, or rows
 * typed into the editor; all three go through the kit's parser, and nothing leaves the tab. The
 * kit's second case loads the same way. Errors say what is wrong and how to fix it.
 */
export function OwnEditor({
  pack,
  fmt,
  own,
  onText,
  onDraft,
  onEditor,
  onCompare,
  onFile,
  onSecond,
  onClear,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly own: OwnState;
  readonly onText: (text: string) => void;
  readonly onDraft: (draft: readonly DraftRow[]) => void;
  readonly onEditor: (open: boolean) => void;
  readonly onCompare: () => void;
  readonly onFile: (text: string) => void;
  readonly onSecond: () => void;
  readonly onClear: () => void;
}) {
  const d = pack.deins;
  const pasteId = useId();
  const [fileError, setFileError] = useState<string | null>(null);
  const errors = own.errors.slice(0, 3).map((error) => errorText(pack, fmt, error));
  return (
    <div className="av4-own" data-av4-own="">
      <GlasDropZone
        text={d.drop}
        buttonLabel={d.dropButton}
        accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values"
        onFile={(file) => {
          setFileError(null);
          if (file.size > LIMITS.chars * 4) {
            setFileError(fmt.t(d.errors.long, { max: LIMITS.chars }));
            return;
          }
          file.text().then(onFile, () => setFileError(d.errors.empty));
        }}
        error={fileError ?? undefined}
      />
      <label className="av4-label" htmlFor={pasteId}>
        {d.paste}
      </label>
      <textarea id={pasteId} className="av4-paste" rows={3} value={own.text} placeholder={d.pastePlaceholder} spellCheck={false} onChange={(event) => onText(event.target.value)} data-av4-paste="" />
      <GlasButton variant="plain" size="compact" icon={own.editor ? "chevron-down" : "plus"} aria-expanded={own.editor} onClick={() => onEditor(!own.editor)} data-av4-editor-toggle="">
        {d.editor}
      </GlasButton>
      {own.editor ? <Editor pack={pack} fmt={fmt} draft={own.draft} onDraft={onDraft} /> : null}
      {errors.length > 0 ? (
        <div className="av4-errors" role="alert" data-av4-errors="">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
      <div className="av4-own-actions">
        <GlasButton variant="prominent" size="compact" onClick={onCompare} data-av4-compare="">
          {d.compare}
        </GlasButton>
        <GlasButton variant="fill" size="compact" icon="doc" onClick={onSecond} data-av4-second="">
          {d.second}
        </GlasButton>
        {own.rows || own.text || own.draft.length > 0 ? (
          <GlasButton variant="plain" size="compact" onClick={onClear} data-av4-clear="">
            {d.clear}
          </GlasButton>
        ) : null}
      </div>
      <p className="av4-note" data-av4-showing={own.rows ? "own" : "kit"}>
        {own.rows ? d.showingOwn : d.showingKit}
      </p>
    </div>
  );
}

/** The decimal keypad for an open line (P11): digits, one comma, delete, confirm. */
export function Keypad({ pack, fmt, onConfirm }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly onConfirm: (cents: number) => void }) {
  const [value, setValue] = useState("");
  const separator = fmt.lang === "de" ? "," : ".";
  const press = (key: string) =>
    setValue((current) => {
      if (key === separator) return current.includes(separator) ? current : `${current || "0"}${separator}`;
      const [, fraction] = current.split(separator);
      if (fraction !== undefined && fraction.length >= 2) return current;
      return current.length >= 12 ? current : `${current}${key}`;
    });
  const parsed = value ? parseCents(value, fmt.lang) : null;
  const cents = parsed && "cents" in parsed ? parsed.cents : null;
  return (
    <div className="av4-keypad" data-av4-keypad="">
      <output className="av4-keypad-value" aria-label={pack.deins.keypadLabel} aria-live="polite">
        {value || "0"} €
      </output>
      <div className="av4-keypad-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", separator, "0"].map((key) => (
          <button key={key} type="button" className="av4-key" onClick={() => press(key)}>
            {key}
          </button>
        ))}
        <button type="button" className="av4-key" aria-label={pack.deins.keypadDelete} onClick={() => setValue((current) => current.slice(0, -1))}>
          ⌫
        </button>
      </div>
      <GlasButton variant="prominent" block disabled={cents === null} onClick={() => cents !== null && onConfirm(cents)} data-av4-keypad-confirm="">
        {pack.deins.keypadConfirm}
      </GlasButton>
    </div>
  );
}
