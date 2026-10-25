"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import type { Figures } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { LEDGER, ledgerCounts, missingDocuments, ROW_GROUPS, tileStatus, VSME, vsmeCounts } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { StatusGlyph, StatusTag } from "./parts";
import type { Bet } from "./stage-certificate";

/** Under the lever after probe 1: the ban line, the visitor's call in plain words, what may go out. */
export function ProbeDetails({ pack, bet, days }: { readonly pack: Pack; readonly bet: Bet | null; readonly days: string }) {
  return (
    <>
      <p className="nw-detail-lead">{fill(pack.probe.notes.zeitraum, { days })}: {fill(pack.probe.overshoot, { days })}.</p>
      <p>{pack.probe.ban}</p>
      <p data-bet-line="">{bet === "yes" ? pack.probe.betYes : bet === "no" ? pack.probe.betNo : pack.probe.betNone}</p>
      <p>
        <strong>{pack.probe.safeLabel}: </strong>
        {pack.probe.safe}
      </p>
    </>
  );
}

/** Under the lever in beat 4: the notes of the current sentence, then the factual tally of all four calls. */
export function ThreeDetails({
  pack,
  figures,
  index,
  first,
  three,
  allDone,
}: {
  readonly pack: Pack;
  readonly figures: Figures;
  readonly index: number;
  readonly first: Bet | null;
  readonly three: readonly (Bet | null)[];
  readonly allDone: boolean;
}) {
  const sentence = pack.three.sentences[index]!;
  const checks = [pack.checks.zitat, pack.checks.zeitraum, pack.checks.umfang, pack.checks.stand];
  // Sentences 1, 2 and 3 cannot go out like this; sentence 4 (water) can.
  const sentOut = [first, three[0], three[1]].filter((bet) => bet === "yes").length;
  const heldBack = three[2] === "no";
  return (
    <>
      <ul className="nw-detail-checks">
        {sentence.notes.map((note, position) => (
          <li key={position} data-mark={sentence.marks[position]}>
            <span className="nw-rule-label">{checks[position]}</span> {fill(note, figures)}
          </li>
        ))}
      </ul>
      {sentence.details.map((line, position) => (
        <p key={position}>{fill(line, figures)}</p>
      ))}
      {allDone && index === 2 ? (
        <p className="nw-detail-lead" data-tally="">
          {fill(pack.three.tally, { n: sentOut })}
          {heldBack ? ` ${pack.three.heldBack}` : ""}
        </p>
      ) : null}
    </>
  );
}

/** Under the lever after the sweep: the register, the VSME tiles and the request list (kit step 4). */
export function FolderDetails({ pack, guess }: { readonly pack: Pack; readonly guess: number | null }) {
  const counts = ledgerCounts("before");
  const vsme = vsmeCounts("before");
  return (
    <>
      <p className="nw-detail-lead">
        {fill(pack.folder.result, { n: counts.belegt })}. {guess === null ? pack.folder.noGuess : fill(pack.folder.yourGuess, { guess })}
      </p>
      <h3 className="nw-detail-heading">{pack.folder.registerHeading}</h3>
      {ROW_GROUPS.map((group) => (
        <div key={group} className="nw-ledger-group">
          <p className="nw-label">{pack.folder.groups[group]}</p>
          <ul className="nw-ledger">
            {LEDGER.filter((row) => row.group === group).map((row) => {
              const [text, reason] = pack.folder.rows[row.id];
              return (
                <li key={row.id} className="nw-ledger-row">
                  <span className="nw-cell-id">{row.id}</span>
                  <StatusGlyph status={row.before} />
                  <span className="nw-ledger-text">
                    <strong>{text}</strong> {reason}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <h3 className="nw-detail-heading">{fill(pack.folder.vsmeHeading, { belegt: vsme.belegt, luecke: vsme.luecke })}</h3>
      <ul className="nw-vsme">
        {VSME.map((tile) => (
          <li key={tile.id} className="nw-vsme-tile" data-status={tileStatus(tile.done, tile.total)}>
            <span className="nw-vsme-id">{tile.id}</span>
            <span className="nw-vsme-name">{pack.folder.vsme[tile.id]}</span>
            <span className="nw-vsme-count">
              <StatusGlyph status={tileStatus(tile.done, tile.total)} size={12} /> {tile.done}/{tile.total}
            </span>
          </li>
        ))}
      </ul>
      <h3 className="nw-detail-heading">{pack.folder.requestHeading}</h3>
      <ol className="nw-request">
        {missingDocuments().map((entry) => (
          <li key={entry.doc} data-doc={entry.doc}>
            <strong>{pack.folder.docs[entry.doc]}</strong>
            <span className="nw-hint">{fill(pack.folder.waitFor, { who: entry.dependents.join(", ") })}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/** Under the lever after the cascade: the call, the summary, the three lines about the wrong totals. */
export function InvoiceDetails({
  pack,
  figures,
  guess,
  summary,
}: {
  readonly pack: Pack;
  readonly figures: Figures;
  readonly guess: number | null;
  readonly summary: string;
}) {
  return (
    <>
      <p className="nw-detail-lead" data-cascade-summary="">
        {fill(pack.invoice.caption, figures)} {guess === null ? pack.invoice.noGuess : fill(pack.invoice.yourGuess, { guess })}
      </p>
      <p>{summary}</p>
      {pack.invoice.details.map((line, position) => (
        <p key={position}>{fill(line, figures)}</p>
      ))}
      <p className="nw-own-verdict">
        <StatusTag status="belegt" pack={pack} /> F2 · <StatusTag status="schwach" pack={pack} /> F3
      </p>
    </>
  );
}
