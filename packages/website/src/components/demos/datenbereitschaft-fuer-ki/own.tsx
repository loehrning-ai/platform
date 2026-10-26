"use client";

import { GlasDropZone, GlasSegmented, GlasSlider } from "@/components/demos/glas";
import { EMPTY_CARD, type OwnCard } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { EXAMPLES, type ExampleId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/examples";
import { defaultColumns, defaultGroup, lintColumns, monthly, OWN_LIMITS, parseTable, profile, type Column, type CsvError, type MonthValue, type OwnKind, type Table } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/own-csv";
import type { Fmt } from "./fmt";

/**
 * "Deine Datei, deine Karte": the visitor's own file, read in this tab only.
 * Nothing here is stored or sent; restart (r) never touches it, only
 * "Eigene Eingaben löschen" does.
 */
export interface OwnState {
  readonly name: string;
  readonly table: Table | null;
  readonly columns: readonly Column[];
  readonly error: CsvError | "read" | null;
  readonly example: ExampleId | null;
  readonly value: number | null;
  readonly date: number | null;
  readonly group: number | null;
  readonly kind: OwnKind;
  readonly opening: number;
  readonly showCodes: boolean;
  readonly card: OwnCard;
}

export const EMPTY_OWN: OwnState = {
  name: "",
  table: null,
  columns: [],
  error: null,
  example: null,
  value: null,
  date: null,
  group: null,
  kind: "change",
  opening: 0,
  showCodes: false,
  card: EMPTY_CARD,
};

/** Fills the card fields the file can answer, never one the visitor already wrote. */
function prefill(card: OwnCard, state: Pick<OwnState, "name" | "columns" | "value" | "kind">): OwnCard {
  const value = state.columns.find((column) => column.index === state.value);
  const lints = lintColumns(state.columns, state.value);
  return {
    ...card,
    view: card.view || state.name,
    column: card.column || (value?.name ?? ""),
    kind: card.kind || state.kind,
    never: card.never || lints.identifiers.join(", "),
    lockedBy: card.lockedBy || (lints.identifiers.length > 0 ? "file" : ""),
  };
}

/** A parsed file (or an example) as the new own state; the card keeps what was typed. */
export function loadTable(previous: OwnState, text: string, bytes: number, name: string, example: ExampleId | null, exampleCard: OwnCard | null): OwnState {
  const parsed = parseTable(text, bytes);
  if (typeof parsed === "string") return { ...previous, error: parsed };
  const columns = profile(parsed);
  const picked = defaultColumns(columns);
  const chosen = example ? EXAMPLES.find((entry) => entry.id === example) : undefined;
  const value = chosen ? (columns.find((column) => column.name === chosen.value)?.index ?? picked.value) : picked.value;
  const lints = lintColumns(columns, value);
  const kind: OwnKind = chosen ? chosen.kind : lints.negative ? "change" : "level";
  const base = { ...previous, name, table: parsed, columns, error: null, example, value, date: picked.date, group: kind === "level" ? defaultGroup(columns) : null, kind, opening: 0, showCodes: false };
  return { ...base, card: prefill(exampleCard ?? previous.card, base) };
}

/** The monthly series of the own tub, or null while a column is missing. */
export function ownSeries(state: OwnState): readonly MonthValue[] | null {
  if (!state.table || state.value === null || state.date === null) return null;
  const series = monthly(state.table, state.value, state.date, state.kind, state.kind === "level" ? state.group : null);
  return series.length > 0 ? series : null;
}

/** The levels the own tub draws: a change is summed from the opening, a level is drawn as it is. */
export function ownLevels(state: OwnState, series: readonly MonthValue[]): readonly number[] {
  if (state.kind === "level") return series.map((entry) => entry.value);
  let running = state.opening;
  return series.map((entry) => (running += entry.value));
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= value) ?? 10;
  return step * power;
}

/** The visitor's file as a small tub: one flat level per month, a dashed floor, the axis fixed for the file. */
function OwnTub({ pack, fmt, series, levels, label }: { readonly pack: Pack; readonly fmt: Fmt; readonly series: readonly MonthValue[]; readonly levels: readonly number[]; readonly label: string }) {
  const W = 360;
  const H = 150;
  const pad = { l: 8, r: 8, t: 10, b: 24 };
  const top = niceCeiling(Math.max(...levels.map((value) => Math.abs(value)), 1) * 1.15);
  const width = (W - pad.l - pad.r) / Math.max(1, series.length);
  const yy = (value: number) => H - pad.b - (Math.max(0, value) / top) * (H - pad.t - pad.b);
  const path = levels.map((value, index) => `${index === 0 ? "M" : "L"}${(pad.l + index * width).toFixed(1)},${yy(value).toFixed(1)}L${(pad.l + (index + 1) * width).toFixed(1)},${yy(value).toFixed(1)}`).join("");
  const body = `${path}L${(pad.l + series.length * width).toFixed(1)},${H - pad.b}L${pad.l},${H - pad.b}Z`;
  const every = Math.max(1, Math.ceil(series.length / 8));
  return (
    <figure className="w03-own-tub" data-w03-own-tub="">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} rx="10" className="w03-own-vessel" />
        <path d={body} className="w03-own-water" />
        <path d={path} className="w03-own-surface" />
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="w03-own-floor" />
        {levels.some((value) => value < 0) ? (
          <text x={W - pad.r - 4} y={H - pad.b - 4} textAnchor="end" className="w03-own-below">
            {pack.wanne.belowFloor}
          </text>
        ) : null}
        {series.map((entry, index) =>
          index % every === 0 ? (
            <text key={entry.month} x={pad.l + index * width + width / 2} y={H - 8} textAnchor="middle" className="w03-own-month">
              {fmt.monthShort(`${entry.month}`)}
            </text>
          ) : null,
        )}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {series.map((entry, index) => (
            <tr key={entry.month}>
              <th scope="row">{fmt.month(entry.month)}</th>
              <td>{fmt.n(levels[index] ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function ColumnPick({ label, columns, value, onPick, allowNone, noneLabel, pack }: { readonly label: string; readonly columns: readonly Column[]; readonly value: number | null; readonly onPick: (index: number | null) => void; readonly allowNone?: boolean; readonly noneLabel?: string; readonly pack: Pack }) {
  return (
    <div className="w03-pick" role="group" aria-label={label}>
      <p className="w03-pick-label">{label}</p>
      <div className="w03-pick-chips">
        {allowNone ? (
          <button type="button" className="w03-col-chip" aria-pressed={value === null} onClick={() => onPick(null)}>
            {noneLabel}
          </button>
        ) : null}
        {columns.map((column) => (
          <button key={column.index} type="button" className="w03-col-chip" aria-pressed={value === column.index} onClick={() => onPick(column.index)} data-w03-col={column.name}>
            <span className="w03-col-name">{column.name}</span> <span className="w03-col-type">{pack.own.types[column.type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The own tub's caption: what the demo did with the file, in plain sentences. */
export function ownCaption(pack: Pack, fmt: Fmt, state: OwnState): readonly string[] {
  const o = pack.own;
  if (!state.table) return [o.lead];
  const series = ownSeries(state);
  const col = state.columns.find((column) => column.index === state.value)?.name ?? "";
  const group = state.columns.find((column) => column.index === state.group)?.name ?? "";
  if (!series) return [state.value === null ? o.errors.noNumber : o.errors.noDate];
  const first = fmt.month(series[0]?.month ?? "2026-01");
  if (state.kind === "change") return [fmt.t(o.ruleChange, { col }), fmt.t(o.ownTubChange, { first })];
  return [fmt.t(state.group === null ? o.ruleLevel : o.ruleLevelGroup, { col, group }), o.ownTubLevel];
}

/**
 * The own step on the stage: the privacy sentence, the drop zone and the
 * kit examples; once a file is read, its columns as chips (name and type,
 * never a cell), the kind switch, the own tub and the lints.
 */
export function OwnStage({ pack, fmt, own, onChange, onExample, onFile }: { readonly pack: Pack; readonly fmt: Fmt; readonly own: OwnState; readonly onChange: (next: OwnState) => void; readonly onExample: (id: ExampleId) => void; readonly onFile: (file: File) => void }) {
  const o = pack.own;
  const series = ownSeries(own);
  const levels = series ? ownLevels(own, series) : [];
  const lints = lintColumns(own.columns, own.value);
  const col = own.columns.find((column) => column.index === own.value)?.name ?? "";
  const first = series ? fmt.month(series[0]?.month ?? "") : "";
  const dates = own.columns.filter((column) => column.type === "date").length;
  const numbers = own.columns.filter((column) => column.type === "number").length;
  const spread = Math.max(1, ...levels.map((value) => Math.abs(value - own.opening)));
  const sliderMax = niceCeiling(spread * 2);
  const set = (patch: Partial<OwnState>) => {
    const next = { ...own, ...patch };
    onChange({ ...next, card: prefill(next.card, next) });
  };
  return (
    <div className="w03-own" data-w03-own="">
      <p className="w03-privacy" data-w03-privacy="">
        {o.privacy}
      </p>
      <GlasDropZone
        text={o.dropText}
        buttonLabel={o.dropButton}
        accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values"
        onFile={onFile}
        error={own.error ? (own.error === "read" ? o.errors.read : o.errors[own.error]) : undefined}
        className="w03-drop"
      />
      <div className="w03-examples" role="group" aria-label={o.examplesLabel}>
        <p className="w03-pick-label">{o.examplesLabel}</p>
        <div className="w03-pick-chips">
          {EXAMPLES.map((example) => (
            <button key={example.id} type="button" className="w03-col-chip" aria-pressed={own.example === example.id} onClick={() => onExample(example.id)} data-w03-example={example.id}>
              {o.examples[example.id]}
            </button>
          ))}
        </div>
        {own.example ? <p className="w03-own-note">{o.exampleNote}</p> : null}
      </div>
      {own.table ? (
        <div className="w03-own-read">
          <p className="w03-own-line" data-w03-own-read="">
            <span className="w03-file">{own.name}</span> {fmt.t(o.read, { rows: fmt.n(own.table.rows.length), cols: fmt.n(own.columns.length), dates, numbers })}
          </p>
          <ColumnPick pack={pack} label={o.pickValue} columns={own.columns.filter((column) => column.type === "number")} value={own.value} onPick={(value) => set({ value })} />
          <ColumnPick pack={pack} label={o.pickDate} columns={own.columns.filter((column) => column.type === "date")} value={own.date} onPick={(date) => set({ date })} />
          {own.value !== null ? (
            <GlasSegmented
              label={fmt.t(o.kindLabel, { col })}
              options={[
                { value: "change", label: o.kinds.change },
                { value: "level", label: o.kinds.level },
              ]}
              value={own.kind}
              onChange={(kind) => set({ kind, group: kind === "level" ? own.group ?? defaultGroup(own.columns) : null })}
            />
          ) : null}
          {own.kind === "level" && own.columns.some((column) => column.type === "code" || column.type === "text") ? (
            <ColumnPick pack={pack} label={o.pickGroup} columns={own.columns.filter((column) => column.type === "code" || column.type === "text")} value={own.group} onPick={(group) => set({ group })} allowNone noneLabel={o.noGroup} />
          ) : null}
          {lints.negative ? <p className="w03-own-line">{fmt.t(o.negative, { col })}</p> : null}
          {series ? <OwnTub pack={pack} fmt={fmt} series={series} levels={levels} label={fmt.t(o.tubLabel, { n: series.length })} /> : null}
          {series && own.kind === "change" ? (
            <GlasSlider
              label={fmt.t(o.ownHandle, { first })}
              value={own.opening}
              min={0}
              max={sliderMax}
              step={Math.max(1, sliderMax / 100)}
              onChange={(opening) => set({ opening })}
              format={(value) => fmt.n(value)}
              valueText={(value) => fmt.t(o.ownHandleText, { first, opening: fmt.n(value) })}
              className="w03-own-slider"
            />
          ) : null}
          {lints.codeColumns.map((name) => {
            const column = own.columns.find((entry) => entry.name === name);
            return (
              <p key={name} className="w03-own-line">
                {fmt.t(o.codes, { col: name })}{" "}
                {own.showCodes ? (
                  <span className="w03-own-codes">{fmt.t(o.codesList, { col: name, codes: (column?.codes ?? []).join(", ") })}</span>
                ) : (
                  <button type="button" className="w03-link" onClick={() => set({ showCodes: true })}>
                    {o.showCodes}
                  </button>
                )}
              </p>
            );
          })}
          {lints.vague.map((name) => (
            <p key={name} className="w03-own-line">
              {fmt.t(o.vague, { col: name })}
            </p>
          ))}
          {lints.identifiers.length > 0 ? (
            <p className="w03-own-line">
              <strong>{fmt.t(o.identifiers, { cols: lints.identifiers.join(", ") })}</strong> {o.identifiersNote}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="w03-own-note">{o.noFile}</p>
      )}
    </div>
  );
}

/** Reads a dropped file in the tab (never uploaded), with the size limit checked before reading. */
export async function readOwnFile(file: File): Promise<{ readonly text: string; readonly bytes: number } | CsvError | "read"> {
  if (file.size > OWN_LIMITS.bytes) return "tooBig";
  try {
    return { text: await file.text(), bytes: file.size };
  } catch {
    return "read";
  }
}
