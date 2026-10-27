"use client";

import { GlasButton, GlasSheet } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR, type NcrRow } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import type { Fmt } from "./fmt";

/** The CSV row of a record, as it stands in ncr_records.csv (the CRAFT columns). */
export function csvRow(row: NcrRow): string {
  return [row.id, row.date, row.machine, row.type, row.qty, row.scrap ? "scrap" : "rework"].join(" · ");
}

/**
 * One record, down to its row (P6): the CSV line and how this one row counts
 * under each Zähler. "Vorherige" and "Nächste Meldung" reach every row
 * without a precise tap.
 */
export function RecordSheet({
  pack,
  fmt,
  row,
  onSelect,
  onClose,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly row: NcrRow | null;
  readonly onSelect: (row: NcrRow) => void;
  readonly onClose: () => void;
}) {
  const t = pack.trays;
  const index = row ? CRAFT_NCR.indexOf(row) : -1;
  const step = (delta: number) => {
    const next = CRAFT_NCR[(index + delta + CRAFT_NCR.length) % CRAFT_NCR.length];
    if (next) onSelect(next);
  };
  return (
    <GlasSheet
      open={row !== null}
      onClose={onClose}
      modal={false}
      title={row ? fmt.t(t.sheetTitle, { id: row.id }) : ""}
      closeLabel={pack.close}
      resizeLabel={pack.resize}
      footer={
        <div className="w02-sheet-steps">
          <GlasButton variant="fill" size="compact" icon="back" onClick={() => step(-1)}>
            {t.prev}
          </GlasButton>
          <GlasButton variant="fill" size="compact" trailingIcon="forward" onClick={() => step(1)}>
            {t.next}
          </GlasButton>
        </div>
      }
    >
      {row ? (
        <div className="w02-record" data-w02-record={row.id}>
          <p className="w02-record-label">{t.row}</p>
          <p className="w02-record-csv">{csvRow(row)}</p>
          <p className="w02-record-facts">
            {fmt.date(row.date)}, {row.machine}, {t.types[row.type]}, {row.scrap ? t.scrapWord : t.reworkWord}
          </p>
          <p className="w02-record-sentence">{fmt.t(row.scrap ? t.scrap : t.rework, { qty: fmt.n(row.qty) })}</p>
        </div>
      ) : null}
    </GlasSheet>
  );
}
