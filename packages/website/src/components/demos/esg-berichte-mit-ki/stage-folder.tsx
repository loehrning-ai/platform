"use client";

import { Fragment } from "react";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { FILE_IDS, FILE_NAMES, type FileId } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { citeCounts, LEDGER, ledgerCounts, ROW_GROUPS, statusOf, type Phase } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { sweepAt } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import { StatusGlyph } from "./parts";

const CITES = citeCounts();
/** The register row that first cites each file: its defect tag appears when the sweep sets that row. */
const FIRST_CITE = Object.fromEntries(FILE_IDS.map((id) => [id, LEDGER.findIndex((row) => row.cites.includes(id))])) as Record<FileId, number>;

/** A file name that may wrap after each underscore, never inside a word. */
function breakAtUnderscores(name: string) {
  const parts = name.split("_");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? (
        <>
          _<wbr />
        </>
      ) : null}
    </Fragment>
  ));
}

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
  const locale = pack.locale === "en" ? "en" : "de";
  const defects = pack.folder.defects as Partial<Record<FileId, string>>;
  return (
    <div className="nw-stage" data-scene="ordner">
      {/* The result takes the label's place, so the register and all 13 files keep their room on a phone. */}
      <p className="nw-kicker">
        {sweep.tally > 0 ? (
          <span className="nw-tally" style={{ opacity: sweep.tally }} data-folder-result="">
            {fill(pack.folder.result, { n: counts.belegt })}
          </span>
        ) : (
          pack.folder.railLabel
        )}
      </p>
      <ul className="nw-files">
        {FILE_IDS.map((id) => {
          const lit = current?.cites.includes(id);
          const defect = defects[id];
          const tagged = defect !== undefined && FIRST_CITE[id] >= 0 && FIRST_CITE[id] < sweep.set;
          return (
            <li key={id} className="nw-file" data-lit={lit ? statusOf(current!, phase) : undefined} data-file={id}>
              <span className="nw-file-name">{breakAtUnderscores(FILE_NAMES[id][locale])}</span>
              <span className="nw-file-foot">
                <span className="nw-file-defect" data-defect={tagged ? "" : undefined}>
                  {tagged ? defect : ""}
                </span>
                <span className="nw-file-count" style={{ opacity: sweep.tally }} aria-label={fill(pack.folder.cites, { n: CITES[id] ?? 0 })}>
                  {CITES[id] ?? 0}
                </span>
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
    </div>
  );
}
