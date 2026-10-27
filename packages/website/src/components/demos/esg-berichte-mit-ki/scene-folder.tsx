"use client";

import { useEffect, useRef, useState } from "react";
import { ESCAPE_PRIORITY, GLAS_PRIORITY, GlasPanel, pushEscapeLayer } from "@/components/demos/glas";
import { connectionsFrom, gapSplit, RECHECK_REASON, recheckOrder } from "@/lib/demo-cases/esg-berichte-mit-ki/connections";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { FILE_IDS, type FileId } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { LEDGER, ledgerCounts, ROW_GROUPS, statusOf, type Phase, type RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { boxCurve, useAnchors } from "./connect";
import { numberWord, type Fmt } from "./fmt";
import { StatusGlyph } from "./glyph";

const THRESHOLD = 6;
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The count line under the folder: „9 der 21 Antworten sind belegt …", every number from the ledger. */
export function folderCounts(pack: Pack, fmt: Fmt, phase: Phase): string[] {
  const counts = ledgerCounts(phase);
  const split = gapSplit(phase);
  const noFile = split.noFile === 1 ? pack.folder.noFileOne : fmt.t(pack.folder.noFileOther, { n: split.noFile });
  return [
    fmt.t(pack.folder.counts, { belegt: counts.belegt, schwach: counts.schwach }),
    fmt.t(pack.folder.gaps, { luecke: counts.luecke, withDoc: split.withDoc, banned: split.banned, noFile }),
  ];
}

/** „Vier Antworten zitieren strom_2025.csv, und zwei weitere hängen von ihr ab." */
export function fileSentence(pack: Pack, fmt: Fmt, kit: KitText, file: FileId): string {
  const { quoted, dependsOn } = connectionsFrom(file);
  const name = kit.fileNames[file];
  if (quoted.length === 1 && dependsOn.length === 0) return fmt.t(pack.folder.fileReadoutOne, { file: name });
  const values = { quoted: capital(numberWord(quoted.length, fmt.locale)), depends: numberWord(dependsOn.length, fmt.locale), file: name };
  return fmt.t(dependsOn.length > 0 ? pack.folder.fileReadout : pack.folder.fileReadoutNone, values);
}

/**
 * Scene 5, the folder: 13 files and the 21 answers that hang on them. A tap
 * on a file draws its connections (solid: the answer quotes a line of it;
 * dashed: it only depends on it). The invoice token moves between the strom
 * file and the tray, and every move rechecks exactly the answers it touches.
 */
export function FolderScene({
  pack,
  fmt,
  kit,
  file,
  highlight,
  invoiceIn,
  rechecked,
  onFile,
  onTile,
  onInvoice,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly file: FileId | null;
  readonly highlight: readonly RowId[];
  readonly invoiceIn: boolean;
  readonly rechecked: boolean;
  readonly onFile: (file: FileId | null) => void;
  readonly onTile: (row: RowId) => void;
  readonly onInvoice: (on: boolean) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const phase: Phase = invoiceIn ? "after" : "before";
  const { anchors, register } = useAnchors(container, [file, invoiceIn]);
  const start = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const [lift, setLift] = useState<{ dx: number; dy: number } | null>(null);
  const links = file ? connectionsFrom(file) : null;
  const linked = new Set<RowId>([...(links?.quoted ?? []), ...(links?.dependsOn ?? [])]);
  const recheck = new Set(recheckOrder());

  useEffect(() => {
    if (!file) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.popover, () => onFile(null));
  }, [file, onFile]);
  useEffect(() => {
    if (!lift) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      start.current = null;
      setLift(null);
    });
  }, [lift]);

  const dropAt = (x: number, y: number): "strom" | "tray" | null => {
    const hit = document.elementsFromPoint(x, y).find((element) => element.closest?.("[data-w4-drop]"));
    const target = hit?.closest<HTMLElement>("[data-w4-drop]")?.dataset.w4Drop;
    return target === "strom" || target === "tray" ? target : null;
  };

  const token = (
    <button
      type="button"
      className="w4-token"
      data-w4-token=""
      data-lifted={lift ? "" : undefined}
      style={lift ? { transform: `translate(${lift.dx}px, ${lift.dy}px) rotate(-2deg)` } : undefined}
      aria-label={invoiceIn ? pack.folder.invoiceOut : pack.folder.invoiceIn}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        start.current = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        const begun = start.current;
        if (!begun || begun.id !== event.pointerId) return;
        const dx = event.clientX - begun.x;
        const dy = event.clientY - begun.y;
        if (!begun.moved && Math.hypot(dx, dy) < THRESHOLD) return;
        begun.moved = true;
        setLift({ dx, dy });
      }}
      onPointerUp={(event) => {
        const begun = start.current;
        start.current = null;
        setLift(null);
        if (!begun || begun.id !== event.pointerId) return;
        if (!begun.moved) {
          onInvoice(!invoiceIn);
          return;
        }
        const target = dropAt(event.clientX, event.clientY);
        if (target === "tray" && invoiceIn) onInvoice(false);
        if (target === "strom" && !invoiceIn) onInvoice(true);
      }}
      onPointerCancel={() => {
        start.current = null;
        setLift(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.detail === 0) onInvoice(!invoiceIn);
      }}
    >
      <span className="w4-token-sheet" aria-hidden="true" />
      <span>{pack.folder.token}</span>
    </button>
  );

  const readout = file ? (
    <>
      <p>{fileSentence(pack, fmt, kit, file)}</p>
      <p className="w4-readout-legend">{pack.folder.legend}</p>
    </>
  ) : rechecked ? (
    <>
      {invoiceIn ? <p>{pack.folder.afterDrop[0]}</p> : null}
      <ul className="w4-recheck">
        {recheckOrder()
          .filter((id) => RECHECK_REASON[id])
          .map((id) => (
            <li key={id}>
              <span className="w4-recheck-id">
                {id} {pack.folder.rows[id]}
              </span>{" "}
              {pack.folder.recheck[RECHECK_REASON[id] as keyof Pack["folder"]["recheck"]]}
            </li>
          ))}
      </ul>
    </>
  ) : null;

  return (
    <div ref={container} className="w4-s5" data-w4-scene="ordner" data-phase={phase} data-file={file ?? undefined}>
      <section className="w4-files" aria-label={pack.folder.filesTitle}>
        <p className="w4-kicker">{pack.folder.filesTitle}</p>
        <ul className="w4-files-list">
          {FILE_IDS.map((id) => (
            <li key={id} className="w4-file-item" data-w4-drop={id === "strom" ? "strom" : undefined}>
              <button
                type="button"
                className="w4-file"
                ref={register(`file:${id}`)}
                aria-pressed={file === id}
                data-w4-file={id}
                onClick={() => onFile(file === id ? null : id)}
              >
                <svg className="w4-file-icon" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
                  <path d="M3 1.5h9.5L18.5 7.5V21a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 21V3A1.5 1.5 0 0 1 3 1.5z" />
                </svg>
                <span>{kit.fileNames[id]}</span>
              </button>
              {id === "strom" && invoiceIn ? token : null}
            </li>
          ))}
        </ul>
        <div className="w4-ablage" data-w4-drop="tray" data-w4-ablage="">
          <span className="w4-ablage-label">{pack.folder.tray}</span>
          {invoiceIn ? null : token}
        </div>
      </section>
      <div className="w4-groups">
        {ROW_GROUPS.map((group) => (
          <section key={group} className="w4-group" aria-label={pack.folder.groups[group]}>
            <p className="w4-kicker">{pack.folder.groups[group]}</p>
            <ul className="w4-tiles">
              {LEDGER.filter((row) => row.group === group).map((row) => {
                const status = statusOf(row, phase);
                const link = links?.quoted.includes(row.id) ? "quoted" : links?.dependsOn.includes(row.id) ? "depends" : undefined;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="w4-tile"
                      ref={register(`tile:${row.id}`)}
                      data-w4-tile={row.id}
                      data-status={status}
                      data-link={link}
                      data-dim={(file && !linked.has(row.id)) || (highlight.length > 0 && !highlight.includes(row.id)) ? "" : undefined}
                      data-recheck={rechecked && recheck.has(row.id) ? `${phase}` : undefined}
                      onClick={() => onTile(row.id)}
                    >
                      <StatusGlyph status={status} label={pack.statuses[status]} size={16} />
                      <span className="w4-tile-id">{row.id}</span>
                      <span className="w4-tile-name">{pack.folder.rows[row.id]}</span>
                      {row.gate ? <span className="w4-ban">{pack.folder.ban}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <svg className="w4-threads w4-s5-threads" aria-hidden="true" focusable="false">
        {file && links
          ? [...links.quoted.map((id) => [id, "quoted"] as const), ...links.dependsOn.map((id) => [id, "depends"] as const)].map(([id, kind], index) => {
              const from = anchors[`file:${file}`];
              const to = anchors[`tile:${id}`];
              if (!from || !to) return null;
              return <path key={`${file}-${id}`} d={boxCurve(from, to)} className="w4-thread" data-kind={kind} data-w4-link={kind} style={{ ["--w4-i" as string]: index }} />;
            })
          : null}
      </svg>
      {readout ? (
        <GlasPanel key={file ?? `recheck-${phase}`} material="regular" shape="card" live={GLAS_PRIORITY.readout} className="w4-readout" data-w4-readout="" data-pop="">
          <div className="w4-readout-body" aria-live="polite">
            {readout}
          </div>
        </GlasPanel>
      ) : null}
    </div>
  );
}
