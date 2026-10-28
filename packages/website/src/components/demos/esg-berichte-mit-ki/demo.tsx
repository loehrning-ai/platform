"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, useBeatClock, useBeatGate, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasSheet } from "@/components/demos/glas";
import { modelName, recordedOn } from "@/lib/claude-runs";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill, type AppData, type AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { StepId } from "@/lib/demo-cases/esg-berichte-mit-ki/app-steps";
import { BEATS, type BeatId } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
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
import { CaptionLine } from "./app/caption-line";
import { Prediction } from "./app/prediction";
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
type Predictions = Readonly<Record<StepId, number | null>>;
const NO_PREDICTIONS: Predictions = { "schritt-1": null, "schritt-2": null, "schritt-3": null, "schritt-4": null, "schritt-5": null };
const INSTALL_BEAT = BEATS.findIndex((beat) => beat.id === "dein-claude");

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
  const [predictions, setPredictions] = useState<Predictions>(NO_PREDICTIONS);
  /** The step whose answer has just landed: the chat shows it from its start. */
  const [landed, setLanded] = useState<StepId | null>(null);
  /** Phone: the steps whose check by hand the visitor has opened. Until then "Weiter" opens the check first. */
  const [checked, setChecked] = useState<ReadonlySet<StepId>>(() => new Set());
  const checkWaitsRef = useRef(false);
  const sendRef = useRef<HTMLButtonElement>(null);
  const phaseWas = useRef(clock.phase);
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
    setPredictions(NO_PREDICTIONS);
    setLanded(null);
    setChecked(new Set());
  });

  // "Mit dem Fragebogen starten" hands the focus to the message box's arrow, never to the page (WCAG 2.4.3).
  useEffect(() => {
    const was = phaseWas.current;
    phaseWas.current = clock.phase;
    if (was !== "intro" || clock.phase !== "guided") return;
    const frame = requestAnimationFrame(() => sendRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [clock.phase]);

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
    setLanded(null);
    setInstallStep(0);
    resetPanel();
  }, [clock.index, clock.phase, resetPanel]);

  const send = useCallback(
    (id: StepId) => {
      setProgress((value) => ({ ...value, [id]: "running" }));
      setRising(id);
      setLanded(null);
      resetPanel();
      if (id === "schritt-1") commit();
      // The arrow goes away with the prompt; the focus moves on to "Antwort ganz zeigen" in the dock.
      requestAnimationFrame(() => {
        if (document.activeElement === document.body || document.activeElement === sendRef.current) document.querySelector<HTMLElement>(".w4a-stage [data-demo-next]")?.focus({ preventScroll: true });
      });
    },
    [commit, resetPanel],
  );
  const finish = useCallback((id: StepId) => {
    setProgress((value) => (value[id] === "running" ? { ...value, [id]: "done" } : value));
    setLanded(id);
  }, []);

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
      // On a phone the check by hand sits in a sheet: the first "Prüfen" opens it, the next press moves on.
      if (checkWaitsRef.current) {
        openCheck();
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
  const currentId = current?.id ?? null;
  const openCheck = useCallback(() => {
    setView(null);
    setClosedKey(null);
    setSheetOpen(true);
    if (currentId) setChecked((value) => (value.has(currentId) ? value : new Set([...value, currentId])));
  }, [currentId]);

  const panel = buildPanel(panelStep, view, { copy, pack, fmt, kit, data, scene, dispatch, cardDispatch, reduced, onView: openView });
  const panelOpen = panel !== null && (phone ? sheetOpen : closedKey !== panel.key);

  // The project's chats, newest first, as Claude's sidebar lists them: a chat appears once its first message is sent.
  const chats: SidebarChat[] = [...new Set(data.steps.filter((step) => free || progress[step.id] !== "idle").map((step) => step.chat))]
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
  const notes = [fill(copy.surface, { files: data.files.filter((file) => file.where !== "produced").length }), copy.thinkingNote];
  const produced = data.files.find((file) => file.where === "produced");
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
      notes={step.id === data.steps[0]?.id ? notes : []}
      produced={step.id === "schritt-4" || step.id === "schritt-5" ? produced : undefined}
      onDone={() => finish(step.id)}
      onCite={onCite}
      onChip={onChip}
      onProduced={openCheck}
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
      quiet={turns.length > 0}
      sendRef={sendRef}
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
        ? stepCaption({ copy, pack, fmt, kit, data, step: current, state: currentState, scene, prediction: predictions[current.id] })
        : beatCaption(copy, beatId, data.locale, installStep);


  const shownPanel = overlay || installing ? null : panel;
  const checkClosed = shownPanel !== null && !panelOpen;
  const checkWaits = phone && !free && current !== null && currentState === "done" && shownPanel?.kind === "check" && !checked.has(current.id);
  checkWaitsRef.current = checkWaits;

  const nextLabel =
    current && currentState === "idle"
      ? copy.next.send
      : current && currentState === "running"
        ? copy.next.finish
        : checkWaits
          ? copy.sheet.check
          : installing && installStep < INSTALL_STEPS - 1
          ? fill(copy.install.next, { n: installStep + 2, total: INSTALL_STEPS })
          : undefined;

  // Before each send: the kit's prediction for this step, as a tap (never scored).
  const prediction =
    current && currentState === "idle" ? (
      <Prediction
        copy={copy}
        fmt={fmt}
        kit={kit}
        step={current.id}
        value={predictions[current.id]}
        onChange={(value) => setPredictions((all) => ({ ...all, [current.id]: value }))}
      />
    ) : null;

  // The phone keeps the dock to one caption line over the path; the line opens the whole caption and the check as a sheet.
  const lead: ReactNode =
    clock.phase === "intro" ? null : phone ? (
      <>
        {prediction}
        <CaptionLine
          sentences={caption}
          action={shownPanel ? copy.sheet.check : copy.sheet.more}
          label={copy.sheet.open}
          attention={checkWaits && !reduced}
          onOpen={shownPanel?.kind === "check" ? openCheck : () => setSheetOpen(true)}
        />
      </>
    ) : (
      <>
        <DockCaption sentences={caption} more={pack.captionMore} less={pack.captionLess} />
        {prediction}
      </>
    );

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
    // A closed check opens again from the dock, outside the depicted window (on a phone the caption line does it).
    if (!phone && checkClosed && shownPanel?.kind === "check")
      return (
        <GlasButton variant="fill" size="compact" icon="check" onClick={openCheck} data-w4a-open-sheet="">
          {shownPanel.title}
        </GlasButton>
      );
    return null;
  };

  const feld = feldFor("autumn", [
    { x: 0.5, y: 0.94 },
    { x: 0.72, y: 0.34 },
  ]);

  // In the sheet the check comes first: with a check, its first sentence leads and the rest of the caption follows the check, nothing folded.
  const [leadFirst, ...leadRest] = caption;
  const splitLead = shownPanel?.kind === "check" && leadRest.length > 0;
  const sentences = (list: readonly string[], tail = false) => (
    <div className="w4a-sheet-caption" data-w4a-sheet-tail={tail ? "" : undefined}>
      {list.map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
    </div>
  );
  const sheetLead = caption.length === 0 ? null : splitLead && leadFirst ? sentences([leadFirst]) : sentences(caption);
  const sheetTail = splitLead ? sentences(leadRest, true) : null;

  return (
    <>
      <DemoGlasStage
        label={fill(copy.depiction, { date })}
        feld={feld}
        readingTone="hell"
        className="w4a-stage"
        restartInDock
        dock={
          <DemoDock className="w4-dock" compact nextLabel={nextLabel} restart lead={lead} stepOf={(n, total) => fill(copy.stepOf, { n, total })}>
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
            panelOpen={phone ? sheetOpen : panelOpen}
            onPanelOpen={(open) => {
              if (phone) setSheetOpen(open);
              // Closing closes the step's check too, not only the file opened over it.
              else setClosedKey(open ? null : panelStep ? `step:${panelStep}` : null);
              if (!open) setView(null);
            }}
            onChat={onChat}
            onFile={onChip}
            onCustomize={free || INSTALL_BEAT < 0 ? undefined : () => clock.seek(INSTALL_BEAT)}
            overlay={overlay}
            overlayLabel={beatId === "gemessen" ? copy.measured.title : pack.takehome.heading}
            main={installing ? <InstallView copy={copy} data={data} step={installStep} /> : undefined}
            mainTitle={installing ? (installStep === 0 ? copy.ui.settings : copy.ui.customize) : undefined}
            sheetLead={sheetLead}
            sheetTail={sheetTail}
            scrollKey={`${chat}:${shownSteps.length}`}
            answerKey={landed}
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
