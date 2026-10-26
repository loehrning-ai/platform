"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, useBeatClock, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasChip, GlasSegmented, GlasSheet } from "@/components/demos/glas";
import type { BeatId } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
import { cardVerdict, type CardAction } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import { missingFor } from "@/lib/demo-cases/esg-berichte-mit-ki/connections";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { DEMO_START, demoReducer, type DemoState } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import { formatLines, LEDGER, missingDocuments, statusOf, type RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import type { FileId } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { EMPTY_CLAIM, type ClaimInput, type OwnRow } from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import { ownReport, reportTable, takeHomeLine } from "@/lib/demo-cases/esg-berichte-mit-ki/own-report";
import { DockCaption } from "./dock-caption";
import { formatter, type Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";
import { OwnClaim } from "./own-claim";
import { OwnFileStep, type OwnFile } from "./own-file";
import { BenchScene, benchCaption } from "./scene-bench";
import { CardScene } from "./scene-card";
import { FolderScene, folderCounts } from "./scene-folder";
import { INVOICE_IMAGE, InvoiceScene } from "./scene-invoice";
import { StromScene } from "./scene-strom";
import { TakeHome, type TakeHomeFiles } from "./takehome";
import "./demo.css";

type FreeScene = keyof Pack["free"]["scenes"];
type View = BeatId | FreeScene;
type SheetId = "more" | "terms" | "invoice" | "tile" | "missing";

const FREE_SCENES: readonly FreeScene[] = ["karte", "umschreiben", "strom", "rechnung", "ordner"];
/** Which free-play scene shows which guided view. */
const FREE_VIEW: Readonly<Record<FreeScene, BeatId>> = { karte: "zitate", umschreiben: "umschreiben", strom: "strom", rechnung: "rechnung", ordner: "ordner" };
const MORE_VIEWS = new Set<BeatId>(["zitate", "umschreiben", "strom", "rechnung"]);

function captionFor(pack: Pack, fmt: Fmt, view: BeatId, state: DemoState, guided: boolean, own: { file: OwnFile | null; door: "file" | "claim" }): string[] {
  switch (view) {
    case "regalkarte":
      return pack.guess.question;
    case "zitate": {
      if (state.card.picking) return [fmt.t(pack.connect.picking, { part: pack.card.parts[state.card.picking] })];
      if (cardVerdict(state.card)) return fmt.ts(pack.connect.verdict);
      return pack.connect.instruction;
    }
    case "umschreiben":
      return state.bench.scope === DEMO_START.bench.scope && state.bench.place === DEMO_START.bench.place && state.bench.offset === DEMO_START.bench.offset
        ? pack.bench.instruction
        : benchCaption(pack, fmt, state.bench);
    case "strom": {
      const s = state.strom;
      if (s.water) return fmt.ts(pack.strom.water.caption);
      if (!s.linked) return pack.strom.instruction;
      if (s.t < 1) return pack.strom.morphInstruction;
      if (guided && !s.guessKept) return pack.strom.guessQuestion;
      return s.guessKept ? [...fmt.ts(pack.strom.caption), pack.strom.guessKept] : fmt.ts(pack.strom.caption);
    }
    case "rechnung":
      return state.invoiceIn ? fmt.ts(pack.invoice.caption) : pack.invoice.instruction;
    case "ordner": {
      if (!state.folder.file && !state.rechecked) return pack.folder.opening;
      const counts = folderCounts(pack, fmt, state.invoiceIn ? "after" : "before");
      return state.rechecked && state.invoiceIn && !state.folder.file ? [pack.folder.afterDrop[1] ?? "", ...counts].filter(Boolean) : counts;
    }
    case "deine-datei":
      return own.door === "claim" ? pack.own.captionClaim : own.file ? pack.own.caption : pack.own.captionEmpty;
    case "mitnehmen":
      return pack.takehome.caption;
  }
}

function MoreText({ pack, fmt, view, onWater }: { readonly pack: Pack; readonly fmt: Fmt; readonly view: BeatId; readonly onWater: () => void }) {
  switch (view) {
    case "zitate":
      return (
        <>
          {pack.connect.moreText.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </>
      );
    case "umschreiben":
      return (
        <>
          <p>{pack.regel.caption}</p>
          <dl className="w4-rule">
            {pack.regel.checks.map(([word, text]) => (
              <div key={word}>
                <dt>{word}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          <ul className="w4-rule-statuses">
            {pack.regel.statuses.map(([status, text]) => (
              <li key={status}>
                <StatusGlyph status={status as "belegt" | "schwach" | "luecke"} label={pack.statuses[status as "belegt"]} size={16} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p>{pack.regel.weakest}</p>
        </>
      );
    case "strom":
      return (
        <>
          {pack.strom.moreText.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
          <GlasButton variant="fill" size="compact" onClick={onWater} data-w4-water="">
            {pack.strom.water.open}
          </GlasButton>
        </>
      );
    case "rechnung":
      return (
        <>
          {fmt.ts(pack.invoice.moreText).map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </>
      );
    default:
      return null;
  }
}

function TileSheet({ pack, fmt, kit, row, phase }: { readonly pack: Pack; readonly fmt: Fmt; readonly kit: KitText; readonly row: RowId; readonly phase: "before" | "after" }) {
  const entry = LEDGER.find((item) => item.id === row);
  if (!entry) return null;
  const status = statusOf(entry, phase);
  const after = phase === "after" ? (pack.folder.after as Readonly<Partial<Record<RowId, string>>>)[row] : undefined;
  const missing = missingFor(entry, phase);
  return (
    <div className="w4-tile-sheet" data-w4-tile-sheet={row}>
      <p className="w4-status-line">
        <StatusGlyph status={status} size={18} />
        {pack.statuses[status]}
        {entry.gate ? <span className="w4-ban">{pack.folder.ban}</span> : null}
      </p>
      <p>{after ? fmt.t(after) : pack.folder.reasons[row]}</p>
      <p className="w4-kicker">{pack.folder.tileQuotes}</p>
      <ul className="w4-quotes">
        {entry.lines.map(([file, refs]) => (
          <li key={file} className="w4-quote">
            <span className="w4-quote-file">{kit.fileNames[file]}</span>
            <span className="w4-quote-lines">{fmt.t(pack.line, { n: formatLines(refs, pack.own.words.to) })}</span>
          </li>
        ))}
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

export default function Demo({ pack, kit, files }: { readonly pack: Pack; readonly kit: KitText; readonly files: TakeHomeFiles }) {
  const clock = useBeatClock();
  const fmt = useMemo(() => formatter(pack.locale as "de" | "en"), [pack.locale]);
  const [state, dispatch] = useReducer(demoReducer, DEMO_START);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [tile, setTile] = useState<RowId | null>(null);
  const [freeScene, setFreeScene] = useState<FreeScene>("karte");
  const [ownFile, setOwnFile] = useState<OwnFile | null>(null);
  const [door, setDoor] = useState<"file" | "claim">("file");
  const [claim, setClaim] = useState<ClaimInput>(EMPTY_CLAIM);
  const [claimRows, setClaimRows] = useState<readonly OwnRow[]>([]);
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const guided = clock.phase === "guided";
  const beatId = clock.beat.id as BeatId;
  const view: BeatId = free ? FREE_VIEW[freeScene] : beatId;
  const phase = state.invoiceIn ? "after" : "before";

  // r and Shift+R: the kit state of every lever and beat 1; the visitor's own data stays.
  useOnRestart(() => {
    dispatch({ type: "restart" });
    setSheet(null);
    setTile(null);
    setFreeScene("karte");
  });
  useEffect(() => {
    if (clock.phase === "guided") dispatch({ type: "reach", index: clock.index });
    if (clock.phase === "free") dispatch({ type: "free" });
  }, [clock.index, clock.phase]);
  useEffect(() => {
    setSheet(null);
  }, [view]);

  const cardDispatch = useCallback((action: CardAction) => dispatch({ type: "card", action }), []);
  const onFile = useCallback((file: FileId | null) => dispatch({ type: "file", file }), []);

  const report = ownFile ? ownReport(ownFile.parsed.rows, ownFile.year) : null;
  const caption = captionFor(pack, fmt, view, state, guided, { file: ownFile, door });
  // While the quotes are being connected, the caption keeps to two short lines so the certificate keeps its room.
  const connecting = view === "zitate" && cardVerdict(state.card) === null;
  const picking = connecting;
  const feld = feldFor("autumn", [{ x: 0.5, y: 0.94 }, { x: view === "ordner" ? 0.3 : 0.72, y: 0.34 }]);

  const data = (): ReactNode => {
    switch (view) {
      case "regalkarte":
      case "zitate":
        return <CardScene pack={pack} fmt={fmt} kit={kit} state={state.card} dispatch={cardDispatch} connecting={view === "zitate"} reducedMotion={reduced} />;
      case "umschreiben":
        return (
          <BenchScene
            pack={pack}
            fmt={fmt}
            kit={kit}
            levers={state.bench}
            onScope={(scope) => dispatch({ type: "scope", scope })}
            onPlace={(place) => dispatch({ type: "place", place })}
            onOffset={(offset) => dispatch({ type: "offset", offset })}
          />
        );
      case "strom":
        return <StromScene pack={pack} fmt={fmt} kit={kit} strom={state.strom} dispatch={dispatch} reducedMotion={reduced} guessing={guided && !state.strom.guessKept} />;
      case "rechnung":
        return (
          <InvoiceScene pack={pack} fmt={fmt} kit={kit} strom={state.strom} invoiceIn={state.invoiceIn} onInvoice={(on) => dispatch({ type: "invoice", in: on })} onOpen={() => setSheet("invoice")} />
        );
      case "ordner":
        return (
          <FolderScene
            pack={pack}
            fmt={fmt}
            kit={kit}
            file={state.folder.file}
            highlight={state.folder.highlight}
            invoiceIn={state.invoiceIn}
            rechecked={state.rechecked}
            onFile={onFile}
            onTile={(row) => {
              setTile(row);
              setSheet("tile");
            }}
            onInvoice={(on) => dispatch({ type: "invoice", in: on, inFolder: true })}
          />
        );
      case "deine-datei":
        return door === "claim" ? (
          <OwnClaim pack={pack} fmt={fmt} claim={claim} rows={claimRows} onClaim={setClaim} onRows={setClaimRows} />
        ) : (
          <OwnFileStep pack={pack} fmt={fmt} kit={kit} file={ownFile} onFile={setOwnFile} reducedMotion={reduced} />
        );
      case "mitnehmen":
        return (
          <TakeHome
            pack={pack}
            files={files}
            ownLine={report ? takeHomeLine(report, pack.takehome, pack.own) : null}
            ownTable={report ? reportTable(report, pack.own, (value) => fmt.n(value)) : null}
          />
        );
    }
  };

  const sceneControls = (): ReactNode => {
    switch (view) {
      case "regalkarte":
        return (
          <div className="w4-guess" role="group" aria-label={pack.guess.group}>
            {(["print", "noPrint"] as const).map((guess) => (
              <GlasChip
                key={guess}
                kind="filter"
                selected={state.card.guess === guess}
                onClick={() => {
                  dispatch({ type: "card", action: { type: "guess", guess } });
                  clock.commit();
                  clock.next();
                }}
              >
                {pack.guess[guess]}
              </GlasChip>
            ))}
          </div>
        );
      case "zitate":
        // The card itself carries the guess next to the verdict.
        return null;
      case "strom": {
        const s = state.strom;
        if (s.water)
          return (
            <GlasButton variant="fill" size="compact" icon="back" onClick={() => dispatch({ type: "water", on: false })} data-w4-water-back="">
              {pack.strom.water.back}
            </GlasButton>
          );
        if (guided && s.linked && s.t >= 1 && !s.guessKept)
          return (
            <div className="w4-row">
              <GlasButton variant="fill" size="compact" icon="check" disabled={s.guess === null} onClick={() => dispatch({ type: "keepGuess" })} data-w4-guess-keep="">
                {pack.strom.guessCommit}
              </GlasButton>
              <GlasButton variant="plain" size="compact" onClick={clock.next} data-w4-guess-skip="">
                {pack.strom.guessSkip}
              </GlasButton>
            </div>
          );
        return s.guess !== null && s.guessKept ? <GlasChip kind="status">{fmt.t(pack.strom.guessChip, { v: fmt.n(s.guess, 1) })}</GlasChip> : null;
      }
      case "rechnung":
        return (
          <div className="w4-row">
            <GlasButton variant="fill" size="compact" icon={state.invoiceIn ? "back" : "doc"} onClick={() => dispatch({ type: "invoice", in: !state.invoiceIn })} data-w4-invoice-toggle="">
              {state.invoiceIn ? pack.invoice.takeOut : pack.invoice.put}
            </GlasButton>
          </div>
        );
      case "ordner":
        return (
          <div className="w4-row">
            <GlasButton variant="fill" size="compact" onClick={() => dispatch({ type: "invoice", in: !state.invoiceIn, inFolder: true })} data-w4-folder-invoice="">
              {state.invoiceIn ? pack.folder.invoiceOut : pack.folder.invoiceIn}
            </GlasButton>
            <GlasButton variant="fill" size="compact" onClick={() => setSheet("missing")} aria-expanded={sheet === "missing"} data-w4-missing-open="">
              {pack.folder.missingButton}
            </GlasButton>
          </div>
        );
      case "deine-datei":
        return (
          <div className="w4-row">
            <GlasButton variant="fill" size="compact" onClick={() => setDoor(door === "file" ? "claim" : "file")} data-w4-door="">
              {door === "file" ? pack.own.claimOpen : pack.own.claimClose}
            </GlasButton>
            {ownFile || claimRows.length > 0 || claim !== EMPTY_CLAIM ? (
              <GlasButton
                variant="plain"
                size="compact"
                onClick={() => {
                  setOwnFile(null);
                  setClaim(EMPTY_CLAIM);
                  setClaimRows([]);
                }}
                data-w4-own-clear=""
              >
                {pack.own.clear}
              </GlasButton>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  const controls = (): ReactNode => {
    if (clock.phase === "intro") return null;
    if (!free) return sceneControls();
    return (
      <>
        <GlasSegmented label={pack.free.label} wrap options={FREE_SCENES.map((value) => ({ value, label: pack.free.scenes[value] }))} value={freeScene} onChange={setFreeScene} />
        {sceneControls()}
      </>
    );
  };

  const missing = missingDocuments(phase)
    .map((item) => ({ ...item, rows: item.dependents.filter((who): who is RowId => LEDGER.some((row) => row.id === who)) }))
    .filter((item) => item.rows.length > 0);

  return (
    <>
      <DemoGlasStage
        label={pack.stageLabel}
        feld={feld}
        className="w4-stage"
        dock={
          <DemoDock className="w4-dock" compact>
            {clock.phase === "intro" ? null : <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} picking={picking} />}
            {controls()}
          </DemoDock>
        }
      >
        <div className="w4-data" data-view={view} data-w4-view={view} data-free={free ? "" : undefined} data-connecting={connecting ? "" : undefined}>
          <div className="w4-toolbar" hidden={clock.phase === "intro"}>
            <span className="w4-invented" data-w4-invented="">
              {pack.invented}
            </span>
            <GlasButton variant="plain" size="compact" onClick={() => setSheet("terms")} data-w4-terms="">
              {pack.terms}
            </GlasButton>
            {MORE_VIEWS.has(view) ? <GlasButton variant="icon" size="compact" icon="info" label={pack.more} onClick={() => setSheet("more")} data-w4-more="" /> : null}
          </div>
          <div className="w4-main">{data()}</div>
        </div>
      </DemoGlasStage>
      <GlasSheet open={sheet === "more"} onClose={() => setSheet(null)} title={pack.more} closeLabel={pack.close} resizeLabel={pack.resize}>
        <div className="w4-sheet-text">
          <MoreText
            pack={pack}
            fmt={fmt}
            view={view}
            onWater={() => {
              dispatch({ type: "water", on: true });
              setSheet(null);
            }}
          />
        </div>
      </GlasSheet>
      <GlasSheet open={sheet === "terms"} onClose={() => setSheet(null)} title={pack.termsTitle} closeLabel={pack.close} resizeLabel={pack.resize}>
        <dl className="w4-glossary">
          {pack.glossary.map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{fmt.t(text)}</dd>
            </div>
          ))}
        </dl>
      </GlasSheet>
      <GlasSheet open={sheet === "invoice"} onClose={() => setSheet(null)} title={pack.invoice.sheetTitle} closeLabel={pack.close} resizeLabel={pack.resize} detent="large">
        <div className="w4-invoice-sheet">
          <Image src={INVOICE_IMAGE[fmt.locale]} alt={pack.invoice.photoAlt} sizes="(min-width: 64rem) 40rem, 100vw" className="w4-invoice-full" />
          <dl className="w4-transcript">
            {pack.invoice.transcript.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </GlasSheet>
      <GlasSheet open={sheet === "tile" && tile !== null} onClose={() => setSheet(null)} title={tile ? `${tile} ${pack.folder.rows[tile]}` : ""} closeLabel={pack.close} resizeLabel={pack.resize}>
        {tile ? <TileSheet pack={pack} fmt={fmt} kit={kit} row={tile} phase={phase} /> : null}
      </GlasSheet>
      <GlasSheet open={sheet === "missing"} onClose={() => setSheet(null)} title={pack.folder.missingTitle} closeLabel={pack.close} resizeLabel={pack.resize}>
        <div className="w4-missing" data-w4-missing="">
          <p className="w4-note">{pack.folder.missingLead}</p>
          <ol>
            {missing.map((item) => (
              <li key={item.doc}>
                <button
                  type="button"
                  className="w4-missing-doc"
                  onClick={() => {
                    dispatch({ type: "highlight", rows: item.rows });
                    setSheet(null);
                  }}
                >
                  <span className="w4-slot-line">{pack.folder.docs[item.doc]}</span>
                  <span className="w4-note">{fmt.t(pack.folder.waitFor, { who: item.rows.map((row) => `${row} ${pack.folder.rows[row]}`).join(", ") })}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </GlasSheet>
    </>
  );
}
