"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { FILE_IDS } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { citeCounts, LEDGER, ledgerCounts, ROW_GROUPS, statusOf, type Phase } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { sweepAt } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import { StatusGlyph } from "./parts";

const CITES = citeCounts();

/**
 * Beat 5: the folder (13 files) above the register (21 answers in three
 * requests). The sweep sets one row after the other and lights the files it
 * cites; the tally is the count of BELEGT rows.
 */
export function FolderStage({
  pack,
  t,
  phase = "before",
  flipped,
}: {
  readonly pack: Pack;
  /** Sweep clock, 0 before "Prüfen". */
  readonly t: number;
  readonly phase?: Phase;
  readonly flipped?: ReadonlySet<string>;
}) {
  const sweep = sweepAt(t);
  const current = sweep.set > 0 && sweep.set <= LEDGER.length && sweep.tally < 1 ? LEDGER[sweep.set - 1] : undefined;
  const counts = ledgerCounts(phase);
  return (
    <div className="nw-stage" data-scene="ordner">
      <p className="nw-kicker">{pack.folder.railLabel}</p>
      <ul className="nw-files">
        {FILE_IDS.map((id) => {
          const lit = current?.cites.includes(id);
          return (
            <li key={id} className="nw-file" data-lit={lit ? statusOf(current!, phase) : undefined}>
              <span className="nw-file-name">{pack.folder.files[id]}</span>
              <span className="nw-file-count" style={{ opacity: sweep.tally }} title={fill(pack.folder.cites, { n: CITES[id] ?? 0 })}>
                {CITES[id] ?? 0}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="nw-register">
        {ROW_GROUPS.map((group) => (
          <div key={group} className="nw-register-group">
            <p className="nw-register-label">{pack.folder.groupsShort[group]}</p>
            <ul className="nw-cells">
              {LEDGER.map((row, index) =>
                row.group === group ? (
                  <li key={row.id} className="nw-cell" data-set={index < sweep.set ? "" : undefined} data-flipped={flipped?.has(row.id) ? "" : undefined}>
                    <span className="nw-cell-id">{row.id}</span>
                    {index < sweep.set ? <StatusGlyph status={statusOf(row, phase)} size={12} /> : <span className="nw-cell-blank" aria-hidden="true" />}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="nw-tally" style={{ opacity: sweep.tally }} data-folder-result="">
        {sweep.tally > 0 ? fill(pack.folder.result, { n: counts.belegt }) : null}
      </p>
    </div>
  );
}
