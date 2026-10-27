"use client";

import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, useBeatClock, useBeatGate, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasSheet } from "@/components/demos/glas";
import { modelName, recordedOn } from "@/lib/claude-runs";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill, type AppData, type AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { StepId } from "@/lib/demo-cases/esg-berichte-mit-ki/app-steps";
import type { BeatId } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
import type { CardAction } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import type { Citation } from "@/lib/demo-cases/esg-berichte-mit-ki/citations";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { DEMO_START, demoReducer } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { EMPTY_CLAIM, type ClaimInput, type OwnRow } from "@/lib/demo-cases/esg-berichte-mit-ki/own";
import { AppTurn } from "./app/app-turn";
import { ClaudeApp, modelLabel, type SidebarChat } from "./app/claude-app";
import { Composer } from "./app/composer";
import { INSTALL_STEPS, InstallView } from "./app/install-view";
import { MeasuredCard } from "./app/measured-card";
import { beatCaption, stepCaption, type StepState } from "./app/captions";
import { buildPanel, type PanelView } from "./app/step-panel";
import { DockCaption } from "./dock-caption";
import { formatter } from "./fmt";
import { OwnClaim } from "./own-claim";
import { TakeHome, type TakeHomeFiles } from "./takehome";
import "./demo.css";
import "./app/app.css";

type Progress = Readonly<Record<StepId, StepState>>;

const STEP_IDS: readonly StepId[] = ["schritt-1", "schritt-2", "schritt-3", "schritt-4", "schritt-5"];
const IDLE: Progress = { "schritt-1": "idle", "schritt-2": "idle", "schritt-3": "idle", "schritt-4": "idle", "schritt-5": "idle" };
const ALL_DONE: Progress = { "schritt-1": "done", "schritt-2": "done", "schritt-3": "done", "schritt-4": "done", "schritt-5": "done" };

/** Every step before `reach` is done (a seek, a deep link or "Weiter" past a step the visitor did not send). */
function doneUpTo(progress: Progress, reach: number): Progress {
  const missing = STEP_IDS.slice(0, reach).filter((id) => progress[id] !== "done");
  if (missing.length === 0) return progress;
  return { ...progress, ...Object.fromEntries(missing.map((id) => [id, "done"])) } as Progress;
}

/**
 * Workshop 04 in the depicted Claude app: the visitor sends the kit's five
 * prompts in the project, Claude's recorded answers stream in, and the check
 * by hand (the W04 interactions on the kit's own lines) opens beside the
 * chat, or as a sheet on the phone. Then the measurement, the skill in the
 * visitor's own Claude, and the take-home.
 */
export default function Demo({
  pack,
  kit,
  copy,
  data,
  files,
}: {
  readonly pack: Pack;
  readonly kit: KitText;
  readonly copy: AppCopy;
  readonly data: AppData;
  readonly files: TakeHomeFiles;
}) {
  const clock = useBeatClock();
  const { commit } = clock;
  const fmt = useMemo(() => formatter(data.locale), [data.locale]);
  const [scene, dispatch] = useReducer(demoReducer, DEMO_START);
  const [progress, setProgress] = useState<Progress>(IDLE);
  const [rising, setRising] = useState<StepId | null>(null);
  const [view, setView] = useState<PanelView>(null);
  /** Desktop: the panel the visitor closed stays closed until something new opens. */
  const [closedKey, setClosedKey] = useState<string | null>(null);
  /** Phone: the sheet opens only when the visitor asks. */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [freeChat, setFreeChat] = useState(1);
  const [ownOpen, setOwnOpen] = useState(false);
  const [claim, setClaim] = useState<ClaimInput>(EMPTY_CLAIM);
  const [claimRows, setClaimRows] = useState<readonly OwnRow[]>([]);
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const beatId = clock.beat.id as BeatId;
  const stepIndex = !free && clock.index < STEP_IDS.length ? clock.index : null;
  const current = stepIndex === null ? null : (data.steps[stepIndex] ?? null);
  const currentState = current ? progress[current.id] : null;
  const installing = !free && beatId === "dein-claude";
  const date = recordedOn(data.recordedAt, data.locale);

  const resetPanel = useCallback(() => {
    setView(null);
    setClosedKey(null);
    setSheetOpen(false);
  }, []);

  useOnRestart(() => {
    dispatch({ type: "restart" });
    setProgress(IDLE);
    setRising(null);
    resetPanel();
    setInstallStep(0);
    setFreeChat(1);
    setOwnOpen(false);
  });

  useEffect(() => {
    if (clock.phase === "guided") {
      setProgress((value) => doneUpTo(value, Math.min(clock.index, STEP_IDS.length)));
      dispatch({ type: "reach", index: clock.index });
    }
    if (clock.phase === "free") {
      setProgress(ALL_DONE);
      dispatch({ type: "free" });
    }
    setRising(null);
    setInstallStep(0);
    resetPanel();
  }, [clock.index, clock.phase, resetPanel]);

  const send = useCallback(
    (id: StepId) => {
      setProgress((value) => ({ ...value, [id]: "running" }));
      setRising(id);
      resetPanel();
      if (id === "schritt-1") commit();
    },
    [commit, resetPanel],
  );
  const finish = useCallback((id: StepId) => setProgress((value) => (value[id] === "running" ? { ...value, [id]: "done" } : value)), []);

  // "Weiter" sends the prompt, then shows the whole answer, then moves on; in "Dein Claude" it walks the four install steps.
  useBeatGate(
    true,
    () => {
      if (current && currentState === "idle") {
        send(current.id);
        return true;
      }
      if (current && currentState === "running") {
        finish(current.id);
        return true;
      }
      if (installing && installStep < INSTALL_STEPS - 1) {
        setInstallStep((value) => value + 1);
        return true;
      }
      return false;
    },
    () => {
      if (installing && installStep > 0) {
        setInstallStep((value) => value - 1);
        return true;
      }
      return false;
    },
  );

  // The chat the window shows: the current step's (steps 4 and 5 share one), the last one after step 5, any in free play.
  const chat = free ? freeChat : (current?.chat ?? 4);
  const shownSteps = data.steps.filter((step, index) => step.chat === chat && (free || stepIndex === null || index <= stepIndex) && progress[step.id] !== "idle");
  const panelStep = [...shownSteps].reverse().find((step) => progress[step.id] === "done")?.id ?? null;

  const cardDispatch = useCallback((action: CardAction) => dispatch({ type: "card", action }), []);
  const openView = useCallback((next: PanelView) => {
    setView(next);
    setClosedKey(null);
    if (next) setSheetOpen(true);
  }, []);
  const onCite = useCallback((file: AppFile, cite: Citation) => openView({ kind: "file", file, from: cite.from, to: cite.to }), [openView]);
  const onChip = useCallback((file: AppFile) => openView({ kind: "file", file, from: null, to: null }), [openView]);

  const panel = buildPanel(panelStep, view, { copy, pack, fmt, kit, data, scene, dispatch, cardDispatch, reduced, onView: openView });
  const panelOpen = panel !== null && (phone ? sheetOpen : closedKey !== panel.key);

  // The project's chats, newest first, as Claude's sidebar lists them.
  const chats: SidebarChat[] = [...new Set(data.steps.filter((step) => free || progress[step.id] !== "idle" || step.id === current?.id).map((step) => step.chat))]
    .reverse()
    .map((value) => ({ chat: value, title: copy.chatTitles[value - 1] ?? "" }));

  const onChat = (value: number) => {
    if (free) {
      setFreeChat(value);
      resetPanel();
      return;
    }
    const last = data.steps.reduce((found, step, index) => (step.chat === value && progress[step.id] !== "idle" ? index : found), -1);
    if (last >= 0 && last !== clock.index) clock.seek(last);
  };

  const meta = fill(copy.recordedMeta, { date, model: modelName(data.model), version: data.version });
  const turns = shownSteps.map((step) => (
    <AppTurn
      key={step.id}
      step={step}
      files={data.files}
      copy={copy}
      locale={data.locale}
      mode={progress[step.id] === "running" ? "running" : "done"}
      reduced={reduced}
      rising={rising === step.id}
      meta={meta}
      onDone={() => finish(step.id)}
      onCite={onCite}
      onChip={onChip}
    />
  ));

  const typing = current && currentState === "idle" ? current : null;
  const attach = typing ? typing.attach.map((path) => data.files.find((file) => file.path === path)).filter((file): file is AppFile => Boolean(file)) : [];
  const composer = (
    <Composer
      copy={copy}
      locale={data.locale}
      text={typing?.typed ?? null}
      attach={attach}
      model={modelLabel(data)}
      reduced={reduced}
      onSend={() => (typing ? send(typing.id) : undefined)}
      typeKey={typing?.id ?? "none"}
    />
  );

  const overlay: ReactNode = free ? null : beatId === "gemessen" ? (
    <MeasuredCard copy={copy} edition={data.locale} />
  ) : beatId === "mitnehmen" ? (
    <div className="w4a-takehome" data-tone="hell">
      <TakeHome pack={pack} files={files} ownLine={null} ownTable={null} />
    </div>
  ) : null;

  const caption: readonly string[] =
    clock.phase === "intro" || free
      ? []
      : current && currentState
        ? stepCaption({ copy, pack, fmt, kit, data, step: current, state: currentState, scene })
        : beatCaption(copy, beatId, data.locale, installStep);

  const nextLabel =
    current && currentState === "idle"
      ? copy.next.send
      : current && currentState === "running"
        ? copy.next.finish
        : installing && installStep < INSTALL_STEPS - 1
          ? fill(copy.install.next, { n: installStep + 2, total: INSTALL_STEPS })
          : undefined;

  const shownPanel = overlay || installing ? null : panel;
  const controls = (): ReactNode => {
    if (clock.phase === "intro") return null;
    if (installing)
      return (
        <GlasButton variant="fill" size="compact" icon="download" href={data.skill.href} download={`${data.skill.name}.zip`} data-w4a-skill-download="">
          {copy.install.download}
        </GlasButton>
      );
    if (!free && beatId === "mitnehmen")
      return (
        <GlasButton variant="fill" size="compact" onClick={() => setOwnOpen(true)} aria-expanded={ownOpen} data-w4a-own-open="">
          {copy.takehome.own}
        </GlasButton>
      );
    // Step 5 without dragging: the invoice goes in and out with a button too (keyboard, switch access).
    const invoice =
      current?.id === "schritt-5" && currentState === "done" ? (
        <GlasButton
          variant="fill"
          size="compact"
          icon={scene.invoiceIn ? "back" : "doc"}
          onClick={() => dispatch({ type: "invoice", in: !scene.invoiceIn, inFolder: true })}
          data-w4-invoice-toggle=""
        >
          {scene.invoiceIn ? pack.invoice.takeOut : pack.invoice.put}
        </GlasButton>
      ) : null;
    const sheet =
      phone && shownPanel && !panelOpen ? (
        <GlasButton variant="fill" size="compact" icon="doc" onClick={() => setSheetOpen(true)} data-w4a-open-sheet="">
          {shownPanel.title}
        </GlasButton>
      ) : null;
    return invoice || sheet ? (
      <>
        {sheet}
        {invoice}
      </>
    ) : null;
  };

  const feld = feldFor("autumn", [
    { x: 0.5, y: 0.94 },
    { x: 0.72, y: 0.34 },
  ]);

  return (
    <>
      <DemoGlasStage
        label={fill(copy.depiction, { date })}
        feld={feld}
        readingTone="hell"
        className="w4a-stage"
        dock={
          <DemoDock className="w4-dock" compact nextLabel={nextLabel}>
            {clock.phase === "intro" ? null : <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} />}
            {controls()}
          </DemoDock>
        }
      >
        <div className="w4a-data" data-w4a-beat={free ? "free" : beatId} data-w4-view={free ? "free" : beatId} data-w4a-state={currentState ?? undefined}>
          <ClaudeApp
            data={data}
            copy={copy}
            chats={chats}
            chat={chat}
            title={copy.chatTitles[chat - 1] ?? ""}
            empty={turns.length === 0}
            turns={turns}
            composer={composer}
            panel={shownPanel}
            panelOpen={panelOpen}
            onPanelOpen={(open) => {
              if (phone) setSheetOpen(open);
              // Closing closes the step's check too, not only the file opened over it.
              else setClosedKey(open ? null : panelStep ? `step:${panelStep}` : null);
              if (!open) setView(null);
            }}
            onChat={onChat}
            onFile={onChip}
            overlay={overlay}
            overlayLabel={beatId === "gemessen" ? copy.measured.title : pack.takehome.heading}
            main={installing ? <InstallView copy={copy} data={data} step={installStep} /> : undefined}
            scrollKey={`${chat}:${shownSteps.length}`}
            onLayout={setPhone}
          />
        </div>
      </DemoGlasStage>
      <GlasSheet open={ownOpen} onClose={() => setOwnOpen(false)} title={copy.takehome.own} closeLabel={pack.close} resizeLabel={pack.resize} detent="large">
        <div className="w4a-own">
          <p className="w4-note">{copy.takehome.ownLead}</p>
          <OwnClaim pack={pack} fmt={fmt} claim={claim} rows={claimRows} onClaim={setClaim} onRows={setClaimRows} />
        </div>
      </GlasSheet>
    </>
  );
}
