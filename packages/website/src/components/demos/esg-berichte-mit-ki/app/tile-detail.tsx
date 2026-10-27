"use client";

import { missingFor } from "@/lib/demo-cases/esg-berichte-mit-ki/connections";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { formatLines, LEDGER, statusOf, type Phase, type RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import type { Fmt } from "../fmt";
import { StatusGlyph } from "../glyph";

/**
 * One answer of the register, opened from the folder: its status, why, the
 * files and lines it quotes and the document it still waits for. After the
 * late invoice every answer that waited for it quotes it, and the draft it
 * refutes says so.
 */
export function TileDetail({ pack, fmt, kit, row, phase }: { readonly pack: Pack; readonly fmt: Fmt; readonly kit: KitText; readonly row: RowId; readonly phase: Phase }) {
  const entry = LEDGER.find((item) => item.id === row);
  if (!entry) return null;
  const status = statusOf(entry, phase);
  const after = phase === "after" ? (pack.folder.after as Readonly<Partial<Record<RowId, string>>>)[row] : undefined;
  const missing = missingFor(entry, phase);
  const invoiceFiled = phase === "after" && entry.missing.includes("septemberInvoice");
  return (
    <div className="w4-tile-sheet w4a-tile" data-w4-tile-sheet={row}>
      <p className="w4-status-line">
        <StatusGlyph status={status} size={18} />
        {pack.statuses[status]}
        {entry.gate ? <span className="w4-ban">{pack.folder.ban}</span> : null}
      </p>
      <p>{after ? fmt.t(after) : pack.folder.reasons[row]}</p>
      <p className="w4-kicker">{pack.folder.tileQuotes}</p>
      <ul className="w4-quotes">
        {entry.lines.map(([file, refs]) => (
          <li key={file} className="w4-quote" data-refuted={invoiceFiled && file === "entwurf" ? "" : undefined}>
            <span className="w4-quote-file">{kit.fileNames[file]}</span>
            <span className="w4-quote-lines">
              {fmt.t(pack.line, { n: formatLines(refs, pack.own.words.to) })}
              {invoiceFiled && file === "entwurf" ? `, ${pack.folder.refuted}` : null}
            </span>
          </li>
        ))}
        {invoiceFiled ? (
          <li className="w4-quote" data-w4-quote-invoice="">
            <span className="w4-quote-file">{kit.invoiceName}</span>
            <span className="w4-quote-lines">{pack.folder.invoiceQuote}</span>
          </li>
        ) : null}
      </ul>
      {missing.length > 0 ? (
        <>
          <p className="w4-kicker">{pack.folder.tileMissing}</p>
          {missing.map((doc) => (
            <p key={doc} className="w4-slot-line">
              {pack.folder.docs[doc]}
            </p>
          ))}
        </>
      ) : null}
    </div>
  );
}
