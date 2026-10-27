"use client";

import { useState } from "react";
import { GlasButton, GlasDropZone, GlasSegmented } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import {
  compareMonths,
  detectColumns,
  direction,
  MAX_BYTES,
  parseCsv,
  type CsvError,
  type CsvTable,
  type Direction,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/own-csv";
import type { NumeratorKind } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import type { Fmt } from "./fmt";

interface Loaded {
  readonly table: CsvTable;
  readonly dates: readonly number[];
  readonly numbers: readonly number[];
}

const NO_QTY = "none";

/**
 * Part B of "Deine Kennzahl": the visitor's own CSV, read in this tab only.
 * The last two complete months, counted two ways (rows, and the quantity
 * column summed), the scene-2 lesson on the visitor's data.
 */
export function OwnFile({ pack, fmt, onTake }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly onTake: (kind: Exclude<NumeratorKind, "">) => void }) {
  const f = pack.own.file;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<CsvError | null>(null);
  const [dateColumn, setDateColumn] = useState(0);
  const [qtyColumn, setQtyColumn] = useState<string>(NO_QTY);
  const [taken, setTaken] = useState<Exclude<NumeratorKind, ""> | null>(null);

  const onFile = (file: File) => {
    setTaken(null);
    if (file.size > MAX_BYTES) {
      setLoaded(null);
      setError("tooBig");
      return;
    }
    file.text().then(
      (text) => {
        const table = parseCsv(text);
        if (typeof table === "string") {
          setLoaded(null);
          setError(table);
          return;
        }
        const columns = detectColumns(table);
        if (columns.dates.length === 0) {
          setLoaded(null);
          setError("noDate");
          return;
        }
        setError(null);
        setLoaded({ table, dates: columns.dates, numbers: columns.numbers });
        setDateColumn(columns.dates[0] as number);
        setQtyColumn(columns.numbers.length > 0 ? String(columns.numbers[0]) : NO_QTY);
      },
      () => {
        setLoaded(null);
        setError("read");
      },
    );
  };

  const compare = loaded ? compareMonths(loaded.table, dateColumn, qtyColumn === NO_QTY ? null : Number(qtyColumn)) : null;
  const result = compare && typeof compare !== "string" ? compare : null;
  const shownError = error ?? (typeof compare === "string" ? compare : null);
  const dirRows: Direction | null = result ? direction(result.rows[0], result.rows[1]) : null;
  const dirQty: Direction | null = result?.qty ? direction(result.qty[0], result.qty[1]) : null;
  const m2 = result ? fmt.month(result.m2) : "";
  const sentence = !result
    ? null
    : !result.qty
      ? f.noQty
      : dirRows === dirQty
        ? fmt.t(f.same, { m2, dir: f.dirs[dirRows as Direction] })
        : fmt.t(f.differ, {
            m2,
            dirRows: f.dirs[dirRows as Direction],
            dirQty: f.dirs[dirQty as Direction],
          });

  return (
    <div className="w02-own-file" data-w02-own-file="">
      <GlasDropZone text={f.drop} buttonLabel={f.pick} accept=".csv,text/csv,text/plain" onFile={onFile} error={shownError ? f.errors[shownError] : undefined} />
      {loaded ? (
        <div className="w02-own-file-columns">
          <GlasSegmented
            label={f.dateColumn}
            wrap
            options={loaded.dates.slice(0, 4).map((index) => ({
              value: String(index),
              label: loaded.table.header[index] || String(index + 1),
            }))}
            value={String(dateColumn)}
            onChange={(value) => setDateColumn(Number(value))}
          />
          <GlasSegmented
            label={f.qtyColumn}
            wrap
            options={[
              ...loaded.numbers.slice(0, 3).map((index) => ({
                value: String(index),
                label: loaded.table.header[index] || String(index + 1),
              })),
              { value: NO_QTY, label: f.noQtyOption },
            ]}
            value={qtyColumn}
            onChange={setQtyColumn}
          />
        </div>
      ) : null}
      {result ? (
        <div className="w02-own-file-result" aria-live="polite">
          <p className="w02-doc-kicker">{fmt.t(f.months, { m1: fmt.month(result.m1), m2 })}</p>
          <dl className="w02-own-file-rows">
            <div>
              <dt>{f.rows}</dt>
              <dd>
                {fmt.n(result.rows[0])}, {fmt.n(result.rows[1])} <span data-dir={dirRows ?? undefined}>{f.dirs[dirRows as Direction]}</span>
              </dd>
            </div>
            {result.qty ? (
              <div>
                <dt>{f.qty}</dt>
                <dd>
                  {fmt.n(result.qty[0])}, {fmt.n(result.qty[1])} <span data-dir={dirQty ?? undefined}>{f.dirs[dirQty as Direction]}</span>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="w02-own-file-sentence">{sentence}</p>
          <div className="w02-row">
            <GlasButton
              variant="fill"
              size="compact"
              onClick={() => {
                const kind = result.qty ? "quantity" : "events";
                setTaken(kind);
                onTake(kind);
              }}
            >
              {f.take}
            </GlasButton>
            {taken ? <span className="w02-note">{fmt.t(f.taken, { kind: pack.own.card.kinds[taken] })}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
