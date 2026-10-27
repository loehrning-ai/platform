"use client";

import { GlasButton } from "@/components/demos/glas";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import type { AppData, AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { StepId } from "@/lib/demo-cases/esg-berichte-mit-ki/app-steps";
import type { CardAction } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { DemoAction, DemoState } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import type { FileId } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import type { RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import type { Fmt } from "../fmt";
import { CardScene } from "../scene-card";
import { FolderScene } from "../scene-folder";
import { InvoiceScene } from "../scene-invoice";
import { StromScene } from "../scene-strom";
import type { AppPanel } from "./claude-app";
import { fileMeta } from "./file-chip";
import { FileView, MonthCheck, RegisterSheetView } from "./file-view";
import { TileDetail } from "./tile-detail";

/** What the panel shows instead of the step's check: a cited file, or one answer of the register. */
export type PanelView =
  | { readonly kind: "file"; readonly file: AppFile; readonly from: number | null; readonly to: number | null }
  | { readonly kind: "tile"; readonly row: RowId }
  | null;

export interface PanelContext {
  readonly copy: AppCopy;
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly data: AppData;
  readonly scene: DemoState;
  readonly dispatch: (action: DemoAction) => void;
  readonly cardDispatch: (action: CardAction) => void;
  readonly reduced: boolean;
  readonly onView: (view: PanelView) => void;
}

const STROM_PATH = /^(ordner\/strom_2025|files\/electricity_2025)\.csv$/;

function fileByPath(data: AppData, pattern: RegExp): AppFile | undefined {
  return data.files.find((file) => pattern.test(file.path));
}

/** The check by hand after one step: the W04 interactions, each on the kit's own lines. */
function stepBody(step: StepId, ctx: PanelContext) {
  const { copy, pack, fmt, kit, data, scene, dispatch, cardDispatch, reduced, onView } = ctx;
  const onFile = (file: FileId | null) => dispatch({ type: "file", file });
  const onTile = (row: RowId) => onView({ kind: "tile", row });
  switch (step) {
    case "schritt-1": {
      const strom = fileByPath(data, STROM_PATH);
      return strom ? <MonthCheck file={strom} copy={copy} /> : null;
    }
    case "schritt-2":
      return <CardScene pack={pack} fmt={fmt} kit={kit} state={scene.card} dispatch={cardDispatch} connecting reducedMotion={reduced} />;
    case "schritt-3":
      return <StromScene pack={pack} fmt={fmt} kit={kit} strom={scene.strom} dispatch={dispatch} reducedMotion={reduced} guessing={false} />;
    case "schritt-4":
      return (
        <>
          <p className="w4a-panel-note">{copy.panel.registerBefore}</p>
          <FolderScene
            pack={pack}
            fmt={fmt}
            kit={kit}
            file={scene.folder.file}
            highlight={scene.folder.highlight}
            invoiceIn={false}
            rechecked={false}
            onFile={onFile}
            onTile={onTile}
            onInvoice={() => undefined}
          />
        </>
      );
    case "schritt-5": {
      const invoice = data.files.find((file) => file.where === "late");
      // The invoice goes in and out with a button too (keyboard, switch access), next to the drag.
      return (
        <>
          <p className="w4a-panel-actions">
            <GlasButton
              variant="fill"
              size="compact"
              icon={scene.invoiceIn ? "back" : "doc"}
              onClick={() => dispatch({ type: "invoice", in: !scene.invoiceIn, inFolder: true })}
              data-w4-invoice-toggle=""
            >
              {scene.invoiceIn ? pack.invoice.takeOut : pack.invoice.put}
            </GlasButton>
          </p>
          <InvoiceScene
            pack={pack}
            fmt={fmt}
            kit={kit}
            strom={scene.strom}
            invoiceIn={scene.invoiceIn}
            onInvoice={(on) => dispatch({ type: "invoice", in: on, inFolder: true })}
            onOpen={() => (invoice ? onView({ kind: "file", file: invoice, from: null, to: null }) : undefined)}
          />
          {scene.invoiceIn ? (
            <>
              <FolderScene
                pack={pack}
                fmt={fmt}
                kit={kit}
                file={scene.folder.file}
                highlight={scene.folder.highlight}
                invoiceIn
                rechecked
                onFile={onFile}
                onTile={onTile}
                onInvoice={(on) => dispatch({ type: "invoice", in: on, inFolder: true })}
              />
              <p className="w4a-panel-note">{copy.panel.registerAfter}</p>
              <RegisterSheetView rows={data.register.rows} label={data.register.name} />
            </>
          ) : null}
        </>
      );
    }
  }
}

/** The check's title and the files it works on. */
function stepMeta(step: StepId, ctx: PanelContext): { title: string; meta: string } {
  const { copy, kit, data } = ctx;
  switch (step) {
    case "schritt-1":
      return { title: copy.panel.check, meta: kit.fileNames.strom };
    case "schritt-2":
      return { title: copy.panel.check, meta: kit.certificate.name };
    case "schritt-3":
      return { title: copy.panel.check, meta: `${kit.fileNames.entwurf}, ${kit.fileNames.strom}` };
    case "schritt-4":
      return { title: copy.panel.check, meta: data.register.name };
    case "schritt-5":
      return { title: copy.panel.check, meta: kit.invoiceName };
  }
}

/**
 * The panel beside the chat (a sheet on the phone): a file the visitor opened,
 * one answer of the register, or the step's check by hand. Null while nothing
 * is there to show (before the first answer, while Claude works).
 */
export function buildPanel(step: StepId | null, view: PanelView, ctx: PanelContext): AppPanel | null {
  const back = step ? () => ctx.onView(null) : undefined;
  if (view?.kind === "file") {
    const { file, from, to } = view;
    return {
      key: `file:${file.path}:${from ?? ""}`,
      title: file.name,
      meta: fileMeta(file, ctx.data.locale),
      kind: "file",
      body: <FileView file={file} from={from} to={to} copy={ctx.copy} invoiceAlt={ctx.pack.invoice.photoAlt} />,
      onBack: back,
      backLabel: ctx.copy.panel.check,
    };
  }
  if (!step) return null;
  if (view?.kind === "tile") {
    return {
      key: `tile:${view.row}`,
      title: `${view.row} ${ctx.pack.folder.rows[view.row]}`,
      meta: ctx.data.register.name,
      kind: "check",
      body: (
        <div className="w4a-check">
          <TileDetail pack={ctx.pack} fmt={ctx.fmt} kit={ctx.kit} row={view.row} phase={step === "schritt-5" && ctx.scene.invoiceIn ? "after" : "before"} />
        </div>
      ),
      onBack: back,
      backLabel: ctx.copy.panel.check,
    };
  }
  const { title, meta } = stepMeta(step, ctx);
  return {
    key: `step:${step}`,
    title,
    meta,
    kind: "check",
    body: (
      <div className={step === "schritt-1" ? "w4a-check" : "w4a-scene"} data-w4a-step={step}>
        {stepBody(step, ctx)}
      </div>
    ),
  };
}
