"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DemoDock, DemoGlasStage, revealIfOffscreen, useBeatClock, useBeatGate, useOnRestart } from "@/components/demos/shell";
import { feldFor, GlasButton, GlasChip, GlasSegmented } from "@/components/demos/glas";
import { BEATS, GUESS_LINES, type BeatId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/beats";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { TEST_ORDER, type Status, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { DockCaption } from "./dock-caption";
import { formatter } from "./fmt";
import { ClockStage, FolderStage, TestsStage, type Guesses } from "./scene-folder";
import { LateStage, type LateStep } from "./scene-late";
import { OwnStage, type OwnTicks } from "./scene-own";
import { RegisterStage } from "./scene-register";
import { TakeHomeScene, type TakeHomeFiles } from "./scene-takehome";
import { rowsDrawn, XrayStage } from "./scene-xray";
import "./w05.css";

const NO_GUESSES: Guesses = {};

export default function Demo({ copy, model, files }: { readonly copy: W05Copy; readonly model: Model; readonly files: TakeHomeFiles }) {
  const clock = useBeatClock();
  const fmt = useMemo(() => formatter(copy), [copy]);
  const reduced = clock.reducedMotion;
  const free = clock.phase === "free";
  const view: BeatId | "free" = free ? "free" : (clock.beat.id as BeatId);
  const total = model.lines.length;

  const [guesses, setGuesses] = useState<Guesses>(NO_GUESSES);
  const [kept, setKept] = useState(false);
  const [pick, setPick] = useState(model.clock.length - 1);
  const [focus, setFocus] = useState<TestId | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [late, setLate] = useState<LateStep>("start");
  const [dateAt, setDateAt] = useState(0);
  const [ownText, setOwnText] = useState("");
  const [ticks, setTicks] = useState<OwnTicks>({});
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shownView = useRef(view);

  // r and Shift+R: every lever and the guesses start again; the visitor's own papers stay.
  useOnRestart(() => {
    setGuesses(NO_GUESSES);
    setKept(false);
    setPick(model.clock.length - 1);
    setFocus(null);
    setOpen(null);
    setLate("start");
    setDateAt(0);
  });
  // A new beat brings the stage back into view when the visitor had scrolled away (never on load).
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    revealIfOffscreen(stageRef.current, reduced);
  }, [reduced, view]);
  // The deck's QR target #mitnehmen opens the last scene (read once on load).
  useEffect(() => {
    const index = window.location.hash === "#mitnehmen" ? BEATS.findIndex((beat) => beat.id === "mitnehmen") : -1;
    if (index >= 0) clock.seek(index, "load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Weiter" turns prominent once the visitor has opened one question; the v4 shell never blocks the press.
  useBeatGate(view === "roentgen" ? open !== null : null);

  const guessesDone = GUESS_LINES.every((id) => guesses[id] !== undefined);
  const scanDone = reduced || clock.progress >= 1 || view !== "roentgen";
  const scanRows = view === "free" ? total : rowsDrawn(clock.progress, total, scanDone);
  const cardRows = view === "ordner" && !reduced && clock.progress < 1 ? Math.floor(clock.progress * total) : total;
  // The register's counts run up once while its beat opens; a picked date then shows its counts at once.
  const registerProgress = view !== "register" || reduced ? 1 : clock.progress;
  const chosen = model.clock[pick] ?? model.clock[model.clock.length - 1];

  const guess = (id: string, status: Status) => setGuesses((current) => ({ ...current, [id]: status }));
  const tick = (paper: string, test: TestId) =>
    setTicks((current) => {
      const now = current[paper] ?? [];
      return { ...current, [paper]: now.includes(test) ? now.filter((entry) => entry !== test) : [...now, test] };
    });

  const caption = ((): string[] => {
    switch (view) {
      case "ordner":
        return kept ? [copy.folder.kept] : [];
      case "uhr":
        return chosen ? [...copy.clock.caption] : [];
      case "pruefungen":
        return focus ? [copy.checkDef[focus], copy.tests.rule] : [copy.tests.rule, copy.statusDef.weak, copy.statusDef.gap];
      case "roentgen":
        return scanRows < total
          ? [copy.xray.scan]
          : [copy.xray.caption[0], fmt.t(copy.xray.caption[1], { over: model.wrong.over, under: model.wrong.under, month: copy.months[Number(model.pay.periodEnd.slice(5, 7)) - 1] as string })];
      case "nachtrag":
        return [late === "start" ? fmt.t(copy.late.captionStart, { n: model.pay.daysLate }) : late === "edited" ? copy.late.captionEdited : copy.late.captionNote];
      case "register":
        return [...copy.register.caption];
      case "ordner-eigen":
        return [copy.own.caption];
      case "mitnehmen":
        return [copy.takehome.lead];
      case "free":
        return [copy.free.caption];
    }
  })();

  const data = (): ReactNode => {
    switch (view) {
      case "ordner":
        return <FolderStage fmt={fmt} model={model} drawn={cardRows} guesses={guesses} onGuess={guess} locked={kept} />;
      case "uhr":
        return <ClockStage fmt={fmt} model={model} pick={pick} />;
      case "pruefungen":
        return <TestsStage fmt={fmt} model={model} focus={focus} />;
      case "roentgen":
      case "free":
        return <XrayStage fmt={fmt} model={model} drawn={scanRows} open={open} onOpen={setOpen} guesses={guesses} scanning={scanRows < total} />;
      case "nachtrag":
        return <LateStage fmt={fmt} model={model} step={late} />;
      case "register":
        return <RegisterStage fmt={fmt} model={model} pick={dateAt} progress={registerProgress} />;
      case "ordner-eigen":
        return <OwnStage fmt={fmt} text={ownText} onText={setOwnText} ticks={ticks} onTick={tick} />;
      case "mitnehmen":
        return <TakeHomeScene fmt={fmt} model={model} files={files} />;
    }
  };

  const controls = (): ReactNode => {
    switch (view) {
      case "ordner":
        if (kept) return null;
        return guessesDone ? (
          <GlasButton
            variant="prominent"
            size="compact"
            onClick={() => {
              setKept(true);
              clock.commit();
            }}
            data-w05-commit="keep"
          >
            {copy.folder.keep}
          </GlasButton>
        ) : (
          <GlasButton
            variant="plain"
            size="compact"
            onClick={() => {
              clock.commit();
              // Skipping moves on at once, even while the cards are still being drawn.
              clock.seek(clock.index + 1, "user");
            }}
            data-w05-commit="skip"
          >
            {copy.folder.skip}
          </GlasButton>
        );
      case "uhr":
        return (
          <GlasSegmented
            label={copy.clock.group}
            value={String(pick)}
            onChange={(value) => setPick(Number(value))}
            options={model.clock.map((entry, index) => ({ value: String(index), label: fmt.short(entry.visit, entry.weekday) }))}
          />
        );
      case "pruefungen":
        return (
          <div className="w05-focus" role="group" aria-label={copy.tests.lead}>
            {TEST_ORDER.map((test) => (
              <GlasChip key={test} kind="filter" selected={focus === test} onClick={() => setFocus((current) => (current === test ? null : test))}>
                {copy.test[test]}
              </GlasChip>
            ))}
          </div>
        );
      case "nachtrag":
        if (late === "start") {
          return (
            <GlasButton variant="plain" size="compact" onClick={() => setLate("edited")} data-w05-late-edit="">
              {fmt.t(copy.late.edit, { date: fmt.date(model.pay.limit) })}
            </GlasButton>
          );
        }
        return late === "edited" ? (
          <GlasButton variant="prominent" size="compact" onClick={() => setLate("written")} data-w05-late-write="">
            {copy.late.write}
          </GlasButton>
        ) : null;
      case "register":
        return (
          <GlasSegmented
            label={copy.register.group}
            value={String(dateAt)}
            onChange={(value) => setDateAt(Number(value))}
            options={model.register.map((entry, index) => ({ value: String(index), label: fmt.dayYear(entry.date) }))}
          />
        );
      default:
        return null;
    }
  };

  const feld = feldFor("sage", [
    { x: 0.2, y: 0.42 },
    { x: 0.78, y: 0.4 },
    { x: 0.5, y: view === "roentgen" || view === "free" ? 0.5 : 0.96 },
  ]);

  return (
    // "Von vorn" sits in the dock, so nothing floats over the top right of the folder.
    <div className="w05" data-w05-view={view} ref={stageRef}>
      <DemoGlasStage
        label={copy.stageLabel}
        feld={feld}
        className="w05-stage"
        restartInDock
        dock={
          <DemoDock className="w05-dock" compact restart>
            {clock.phase === "intro" ? null : <DockCaption sentences={caption} more={copy.captionMore} less={copy.captionLess} />}
            {clock.phase === "intro" ? null : controls()}
          </DemoDock>
        }
      >
        <div className="w05-data" data-view={view} data-w05-data={view}>
          <div className="w05-main">{data()}</div>
        </div>
      </DemoGlasStage>
    </div>
  );
}
