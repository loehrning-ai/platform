"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DemoLever, DemoStage, FILE_CHIP, revealIfOffscreen, setTakeHomeLine, useBeatClock, useOnRestart } from "@/components/demos/shell";
import type { ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import { GENERIC_ITEM_IDS } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/classify";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatPercent } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { TEST_ORDER } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import { buildModel } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { LABELS_FROM, PASS_LENGTH, PASS_START, frame } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/motion";
import { downloadText } from "./download";
import { gapListMarkdown, indexCsv, instructionsText } from "./exports";
import { GapReply } from "./gap-reply";
import { OwnFolderSection, PASTE_ID } from "./own-folder";
import { QuoteProbe } from "./quote-probe";
import { Ribbon } from "./ribbon";
import { LinkStage } from "./stage-links";
import { OwnStage, TakehomeStage } from "./stage-own";
import { AllStage, R5Stage, R7Stage, ToolStage } from "./stage-stations";
import { useOwnFolder } from "./use-own-folder";
import { filesLabel, type Loc } from "./words";
import "./w05.css";

const SLUG = "audit-vorbereitung-mit-ki";
const ESTIMATES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
/** Beat indices, in the order of beats.ts. */
const BEAT = { estimate: 0, run: 1, tool: 2, r7: 3, r5: 4, all: 5, own: 6, home: 7 } as const;

type Download = "instructions" | "index" | "gapList";

/**
 * W05 "Die Lückenliste": eight requests, eleven files, a line from each
 * request to the file whose name fits; the visitor estimates, then the four
 * tests run over the links and two of eight hold. Every object on the stage
 * is a kit file or a number computed from one (model.ts). The stage is a
 * pure function of the shell's clock.
 */
export default function Demo({ copy, locale }: { readonly copy: W05Copy; readonly locale: Loc }) {
  const clock = useBeatClock();
  const { index, progress, reducedMotion } = clock;
  const model = useMemo(() => buildModel(), []);
  const own = useOwnFolder();
  const [estimate, setEstimate] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [selected, setSelected] = useState<ItemId>("R1");
  const [since, setSince] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const firstInput = useCallback(() => setSince((current) => current ?? performance.now()), []);

  // Restart clears the estimate, the pick and the selection; the visitor's own folder stays.
  useOnRestart(() => {
    setEstimate(null);
    setPick(null);
    setSelected("R1");
    setCopied(false);
  });

  // "Deine Zeile" exists only once the visitor's own folder does, and it is built from it.
  const ownResult = own.result;
  const ownLine = useMemo(() => {
    if (!ownResult || ownResult.files.length === 0) return "";
    const items = ownResult.items.filter((item) => item.candidates.length > 0).map((item) => item.id);
    const values = {
      files: filesLabel(copy, ownResult.files.length),
      items: items.length > 0 ? items.join(", ") : copy.takehome.noItems,
      audit: own.audit ? formatShort(own.audit, locale) : "",
      window: own.windowFrom ? formatShort(own.windowFrom, locale) : "",
    };
    return fill(own.windowFrom ? copy.takehome.ownLine : copy.takehome.ownLineNoAudit, values);
  }, [ownResult, own.audit, own.windowFrom, copy, locale]);
  useEffect(() => {
    setTakeHomeLine(SLUG, ownLine);
  }, [ownLine]);

  const runT = index === BEAT.run ? progress : index > BEAT.run ? 1 : 0;
  const revealed = index > BEAT.run || (index === BEAT.run && progress >= LABELS_FROM);
  const covered = model.tally.covered;

  const download = (which: Download) => {
    if (which === "instructions") downloadText(copy.takehome.fileNames.instructions, instructionsText(copy, own.audit, own.months, locale));
    else if (which === "index") downloadText(copy.takehome.fileNames.index, indexCsv(model, own.result, copy, locale), "text/csv;charset=utf-8");
    else downloadText(copy.takehome.fileNames.gapList, gapListMarkdown(model, copy, locale));
  };

  const selectItem = (id: ItemId) => {
    setSelected(id);
    if (index !== BEAT.all) clock.seek(BEAT.all);
    revealIfOffscreen(stageRef.current, reducedMotion);
  };

  let stage: React.ReactNode;
  let caption: React.ReactNode;
  let lever: React.ReactNode;

  if (index <= BEAT.run) {
    stage = <LinkStage model={model} copy={copy} locale={locale} drawT={index === BEAT.estimate ? progress : 1} runT={runT} />;
    if (index === BEAT.estimate) {
      caption = fill(copy.estimateCaption, { total: model.rows.length });
      lever = (
        <div className="w05-estimates" role="group" aria-label={copy.estimateGroup}>
          {ESTIMATES.map((n) => (
            <button
              key={n}
              type="button"
              className="w05-estimate"
              aria-pressed={estimate === n}
              data-w05-estimate={n}
              onClick={() => {
                setEstimate(n);
                clock.commit();
                clock.seek(BEAT.run);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      );
    } else {
      const run = frame(runT, model.rows.map((row) => ({ failsAt: row.failsAt, status: row.status })));
      const pass = Math.min(3, Math.max(0, Math.floor((runT - PASS_START) / PASS_LENGTH)));
      caption = revealed
        ? fill(copy.revealCaption, { word: copy.numberWords[covered] ?? String(covered) })
        : fill(copy.passCaption, { n: pass + 1, test: copy.test[TEST_ORDER[pass] ?? "date"] });
      // Before the labels land the lever shows only the pass and the estimate: the result is never readable early, not even dimmed.
      lever = !revealed ? (
        <p className="w05-lever-text w05-run-lever" data-w05-run="">
          {estimate === null
            ? fill(copy.runLeverNone, { n: pass + 1 })
            : fill(copy.runLever, { n: pass + 1, estimate })}
        </p>
      ) : (
        <div className="w05-tally" style={{ opacity: run.tallyOpacity }} data-w05-tally="">
          <p className="w05-tally-words">
            {(["covered", "weak", "gap"] as const).map((status) => (
              <span key={status} data-status={status}>
                {copy.status[status]} {model.tally[status]}
              </span>
            ))}
          </p>
          <p className="w05-tally-result">
            {estimate === null
              ? fill(copy.resultNone, { covered, total: model.rows.length })
              : fill(copy.result, { covered, total: model.rows.length, estimate })}
          </p>
        </div>
      );
    }
  } else if (index === BEAT.tool) {
    stage = <ToolStage model={model} copy={copy} locale={locale} />;
    caption = copy.tool.rule;
    lever = <span className={FILE_CHIP}>{copy.takehome.fileNames.instructions}</span>;
  } else if (index === BEAT.r7) {
    stage = <R7Stage model={model} copy={copy} locale={locale} pick={pick} t={progress} />;
    const report = model.r7[model.r7.length - 1];
    caption =
      pick !== null && progress >= 1
        ? fill(copy.r7.end, { pick: copy.r7.pickLong[pick] ?? "", status: report ? copy.status[report.status] : "" })
        : copy.r7.caption;
    lever = (
      <div className="w05-picks w05-lever-picks" role="group" aria-label={copy.r7.pickGroup}>
        {copy.r7.pick.map((label, n) => (
          <button
            key={label}
            type="button"
            className="w05-pick"
            aria-pressed={pick === n}
            data-w05-r7={n}
            onClick={() => {
              setPick(n);
              clock.seek(BEAT.r7);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  } else if (index === BEAT.r5) {
    const figures = model.r5.tests.quote.figures;
    stage = <R5Stage model={model} copy={copy} locale={locale} t={progress} />;
    caption = fill(copy.r5.caption, { rows: figures.rows ?? 0 });
    lever = (
      <p className="w05-lever-text" data-w05-r5="">
        {fill(copy.r5.lever, { unique: figures.unique ?? 0, staff: figures.staff ?? 0, share: formatPercent(figures.share ?? 0, locale) })}
      </p>
    );
  } else if (index === BEAT.all) {
    stage = <AllStage model={model} copy={copy} locale={locale} selected={selected} />;
    caption = copy.all.caption;
    lever = (
      <div className="w05-items" role="group" aria-label={copy.all.group}>
        {GENERIC_ITEM_IDS.map((id) => (
          <button key={id} type="button" className="w05-item-chip" aria-pressed={selected === id} onClick={() => setSelected(id)} data-w05-item={id}>
            {id}
          </button>
        ))}
      </div>
    );
  } else if (index === BEAT.own) {
    stage = <OwnStage own={own} copy={copy} locale={locale} />;
    caption = copy.own.caption;
    lever = (
      <div className="w05-lever-actions">
        <label className="w05-button is-primary w05-file-input">
          {copy.own.pickFiles}
          <input
            type="file"
            multiple
            className="sr-only"
            data-w05-lever-files=""
            onChange={(event) => {
              const files = event.target.files;
              if (!files || files.length === 0) return;
              firstInput();
              void own.addFiles(Array.from(files));
            }}
          />
        </label>
        <button
          type="button"
          className="w05-button w05-lever-paste"
          onClick={() => {
            const field = document.getElementById(PASTE_ID);
            revealIfOffscreen(field, reducedMotion);
            field?.focus({ preventScroll: true });
          }}
        >
          {copy.own.paste}
        </button>
      </div>
    );
  } else {
    stage = <TakehomeStage copy={copy} onDownload={download} />;
    caption = copy.takehome.caption;
    lever = (
      <div className="w05-lever-actions">
        <button type="button" className="w05-button is-primary" onClick={() => download("gapList")}>
          {copy.takehome.gapList}
        </button>
        <button
          type="button"
          className="w05-button"
          onClick={() => {
            void navigator.clipboard?.writeText(copy.takehome.prompt).then(() => setCopied(true), () => setCopied(false));
          }}
        >
          {copied ? copy.takehome.copied : copy.takehome.copyPrompt}
        </button>
      </div>
    );
  }

  return (
    <div className="w05" data-w05="" data-beat={clock.beat.id}>
      <DemoStage label={copy.stageLabel} caption={caption}>
        <div ref={stageRef} className="w05-frame">
          {stage}
        </div>
      </DemoStage>
      <DemoLever>{lever}</DemoLever>
      <Ribbon model={model} copy={copy} shown={revealed} selected={selected} onSelect={selectItem} />
      <GapReply model={model} copy={copy} locale={locale} shown={revealed} selected={selected} onSelect={setSelected} />
      <QuoteProbe copy={copy} locale={locale} context={model.context} onFirstInput={firstInput} />
      <OwnFolderSection own={own} copy={copy} locale={locale} since={since} onFirstInput={firstInput} onExport={() => download("index")} />
    </div>
  );
}
