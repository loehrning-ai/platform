"use client";

import type { CSSProperties } from "react";
import { GlasChip } from "@/components/demos/glas";
import type { Status } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Model, ModelLine } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import type { Fmt } from "./fmt";
import type { Guesses } from "./scene-folder";

/** The share of the x-ray scan that is drawn so far, in rows. */
export function rowsDrawn(progress: number, total: number, done: boolean): number {
  return done ? total : Math.min(total, Math.floor(progress * total));
}

function Lens({ fmt, model, line, guess }: { readonly fmt: Fmt; readonly model: Model; readonly line: ModelLine; readonly guess: Status | undefined }) {
  const { copy } = fmt;
  const flagged = line.people.length > 0 ? fmt.t(copy.xray.flagged, { people: fmt.list(line.people) }) : line.wholeFirm ? copy.xray.flaggedWhole : copy.xray.flaggedNone;
  const near = line.nearMisses.flatMap((miss) => (miss.people.length > 0 ? miss.people : []));
  const nearWhole = line.nearMisses.some((miss) => miss.people.length === 0);
  const tail = guess ? (guess === line.status ? fmt.t(copy.xray.guessRight, { guess: fmt.status(guess) }) : fmt.t(copy.xray.guess, { guess: fmt.status(guess), status: fmt.status(line.status) })) : "";
  return (
    <section className="w05-lens" aria-live="polite" data-w05-lens={line.id} data-status={line.status}>
      <h3 className="w05-lens-title">{fmt.t(copy.xray.lineStatus, { id: line.id, label: line.label, status: fmt.status(line.status) })}</h3>
      <p className="w05-lens-rule">
        <span className="w05-label">{copy.xray.ruleLabel}</span> {line.rule}
      </p>
      <p className="w05-hint">{line.rows === null ? copy.xray.onlyText : fmt.t(copy.xray.rowsRead, { n: line.rows })}</p>
      <p className="w05-chips">
        {line.files.map((file) => (
          <GlasChip key={file} kind="file">
            {file}
          </GlasChip>
        ))}
      </p>
      {line.findings.length > 0 ? (
        <ul className="w05-found">
          {line.findings.map((finding) => (
            <li key={finding.id} data-w05-finding={finding.id}>
              {fmt.finding(line, finding, model)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="w05-hint">{copy.xray.noFinding}</p>
      )}
      <p className="w05-hint">{flagged}</p>
      {near.length > 0 ? <p className="w05-hint">{fmt.t(copy.xray.nearMiss, { people: fmt.list(near) })}</p> : nearWhole ? <p className="w05-hint">{copy.xray.nearMissWhole}</p> : null}
      {tail ? <p className="w05-lens-guess">{tail}</p> : null}
    </section>
  );
}

/** Scene 4 and free play: the 13 x 24 grid, one row per question and one cell per person. */
export function XrayStage({
  fmt,
  model,
  drawn,
  open,
  onOpen,
  guesses,
  scanning,
}: {
  readonly fmt: Fmt;
  readonly model: Model;
  readonly drawn: number;
  readonly open: string | null;
  readonly onOpen: (id: string) => void;
  readonly guesses: Guesses;
  readonly scanning: boolean;
}) {
  const { copy } = fmt;
  const line = model.lines.find((entry) => entry.id === open) ?? null;
  const seen = drawn >= model.lines.length;
  return (
    <div className="w05-xray" data-w05-xray={seen ? "done" : "scan"}>
      <div className="w05-xray-grid">
        <p className="w05-counters" aria-live="polite">
          <span data-w05-rows={seen ? model.rowsRead : undefined}>{fmt.t(copy.xray.rows, { n: seen ? model.rowsRead : Math.round((drawn / model.lines.length) * model.rowsRead) })}</span>
          <span>{fmt.t(copy.xray.findings, { n: seen ? model.findings : 0 })}</span>
          <span>{fmt.t(copy.xray.checked, { n: seen ? model.checked : 0 })}</span>
        </p>
        <ol className="w05-matrix" aria-label={copy.xray.gridLabel}>
          {model.lines.map((entry, index) => {
            const done = index < drawn;
            const cells = model.cells[index] ?? [];
            return (
              <li key={entry.id} className="w05-mrow" data-drawn={done ? "" : undefined} data-active={open === entry.id ? "" : undefined} data-status={done ? entry.status : undefined} style={{ "--i": index } as CSSProperties}>
                <button type="button" className="w05-mrow-button" aria-pressed={open === entry.id} onClick={() => onOpen(entry.id)} disabled={!seen && scanning} data-w05-row={entry.id}>
                  <span className="w05-mrow-head">
                    <span className="w05-card-id">{entry.id}</span>
                    <span className="w05-card-label">{entry.label}</span>
                    <span className="w05-mrow-status">{done ? fmt.status(entry.status) : ""}</span>
                  </span>
                  <span className="w05-cells" aria-hidden="true">
                    {model.people.map((person, column) => (
                      <span key={person} className="w05-cell" data-code={done ? (cells[column] ?? 0) : 0} title={person} />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {seen ? <p className="w05-tally" data-w05-tally="">{fmt.t(copy.xray.tally, model.tally)}</p> : null}
      </div>
      <div className="w05-xray-side">{line ? <Lens fmt={fmt} model={model} line={line} guess={guesses[line.id]} /> : <p className="w05-hint">{seen ? copy.xray.hint : copy.xray.scan}</p>}</div>
    </div>
  );
}
