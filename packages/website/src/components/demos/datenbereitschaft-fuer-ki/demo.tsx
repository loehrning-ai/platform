"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DemoLever, DemoStage, revealIfOffscreen, setTakeHomeLine, TAKEHOME_TARGET_ID, useBeatClock, useOnRestart } from "@/components/demos/shell";
import { EMPTY_CARD, type OwnCard } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/card";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { CLAUDE_ANSWER, ENDING_MRR } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { formatNumber } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import type { Boundary, WhoFilter } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import { boxesDone, START, VOTES, type Bets } from "./model";
import { OwnForm, OwnPreview, TakeHomeScene, takeHomeLine } from "./own-card";
import { AnswerScene, ReadingsScene } from "./scene-answer";
import { BoundaryScene, TestScene, ViewScene, WHO, WhoScene } from "./scene-boxes";
import { useSince, useTween } from "./tween";
import "./demo.css";

const SLUG = "datenbereitschaft-fuer-ki";
const LEVELS = [ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]];
const BOUNDARIES: readonly Boundary[] = ["instruction", "notUploaded", "grant"];

/** The question card strip on top of the stage: five squares, the state, the answer as it stands. */
function Strip({ pack, done, index }: { readonly pack: Pack; readonly done: readonly boolean[]; readonly index: number }) {
  const copy = pack.strip;
  const right = done[1] as boolean;
  const values = (right ? LEVELS : CLAUDE_ANSWER).map((value) => formatNumber(value, pack.locale)).join(" · ");
  const state = done[4] ? copy.stateTested : right ? copy.stateView : copy.stateOpen;
  return (
    <div className="fk-strip" data-fk-strip="">
      <p className="fk-strip-card">
        <span className="fk-strip-name">{copy.card}</span>
        <span className="fk-squares-5">
          {copy.boxes.map((name, box) => (
            <span
              key={name}
              className="fk-box-sq"
              data-done={done[box] ? "" : undefined}
              role="img"
              aria-label={fill(done[box] ? copy.boxDone : copy.boxOpen, { n: box + 1, name })}
            >
              {box + 1}
            </span>
          ))}
        </span>
      </p>
      {index > 0 ? (
        <p className="fk-strip-answer" data-fk-state={done[4] ? "tested" : right ? "view" : "open"}>
          <span className="fk-strip-values">{values}</span> <span className="fk-strip-state">{state}</span>
        </p>
      ) : null}
    </div>
  );
}

/** The "Im Kit:" line and the beat's notes, under the lever. */
function Notes({ pack, notes, kitFile, lead }: { readonly pack: Pack; readonly notes: readonly string[]; readonly kitFile: string; readonly lead?: string }) {
  return (
    <div className="fk-notes" data-fk-notes="">
      {lead ? (
        <p className="fk-lead" data-fk-feedback="">
          {lead}
        </p>
      ) : null}
      {notes.map((note) => (
        <p key={note} className="fk-note">
          {note}
        </p>
      ))}
      <p className="fk-kit">
        {pack.inKit}{" "}
        <a href={`${pack.kitBase}${kitFile}`} className="fk-kit-link" data-fk-kit-file={kitFile}>
          {kitFile}
        </a>
      </p>
    </div>
  );
}

function Radios<T extends string>({
  name,
  legend,
  options,
  labels,
  value,
  onChange,
  mark,
}: {
  readonly name: string;
  readonly legend: string;
  readonly options: readonly T[];
  readonly labels: Readonly<Record<T, string>>;
  readonly value: T | null;
  readonly onChange: (value: T) => void;
  /** The box number in front of the control, when one beat carries two boxes. */
  readonly mark?: number;
}) {
  return (
    <fieldset className="fk-seg" data-fk-seg={name}>
      <legend className="fk-sr">{legend}</legend>
      {mark ? (
        <span className="fk-seg-mark" aria-hidden="true">
          {mark}
        </span>
      ) : null}
      {options.map((option) => (
        <label key={option} className="fk-seg-option">
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
          <span>{labels[option]}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * "Die Fragekarte": Claude's answer from one correct file, the four
 * readings of it, then the five boxes, the visitor's own card and the
 * take-home. The stage is a pure function of the clock and the bets; the own
 * card lives in this component only and survives "Von vorn".
 */
export default function Demo({ pack }: { readonly pack: Pack }) {
  const clock = useBeatClock();
  const { index, progress, reducedMotion, commit, seek } = clock;
  const [bets, setBets] = useState<Bets>(START);
  const [card, setCard] = useState<OwnCard>(EMPTY_CARD);
  const [preset, setPreset] = useState("");
  const previousWho = useRef<WhoFilter | null>(null);
  const root = useRef<HTMLDivElement | null>(null);

  // A reset is always the visitor's own key or tap: bring the stage back if they had scrolled away from it.
  useOnRestart(() => {
    previousWho.current = null;
    setBets(START);
    revealIfOffscreen(root.current, reducedMotion);
  });

  const reading = useTween(bets.detent, 420, reducedMotion);
  const fold = useTween(bets.view ? 1 : 0, 420, reducedMotion);
  const whoShare = useSince(bets.who ?? "none", 860, reducedMotion);
  const testRun = useTween(bets.tested ? 1 : 0, 2000, reducedMotion);
  const done = boxesDone(index, bets);
  const line = takeHomeLine(card, pack);

  useEffect(() => setTakeHomeLine(SLUG, line), [line]);

  const update = (patch: Partial<Bets>) => setBets((previous) => ({ ...previous, ...patch }));
  const vote = (choice: (typeof VOTES)[number]) => {
    update({ vote: choice });
    commit();
    seek(1, "user");
  };
  const chooseWho = (who: WhoFilter) => {
    previousWho.current = bets.who;
    update({ who });
  };

  let scene: ReactNode;
  let caption: string = pack.answer.caption;
  let lever: ReactNode;
  let notes: ReactNode;
  let below: ReactNode = null;

  if (index === 0) {
    scene = <AnswerScene pack={pack} progress={progress} />;
    lever = (
      <div className="fk-votes" role="group" aria-label={pack.answer.leverLabel}>
        <div className="fk-vote-row">
          {VOTES.map((choice) => (
            <button key={choice} type="button" className="fk-vote" aria-pressed={bets.vote === choice} data-fk-vote={choice} onClick={() => vote(choice)}>
              {pack.answer.votes[choice]}
            </button>
          ))}
        </div>
      </div>
    );
    notes = <Notes pack={pack} notes={pack.answer.notes} kitFile={pack.answer.kitFile} />;
  } else if (index === 1) {
    const copy = pack.reveal;
    scene = <ReadingsScene pack={pack} progress={progress} reading={reading} detent={bets.detent} />;
    const revealing = progress < 1;
    caption = revealing
      ? progress < 0.25
        ? copy.captionFile
        : progress < 0.67
          ? copy.captionMissing
          : copy.captionVerdict
      : bets.detent === 3
        ? copy.captionRight
        : copy.captionVerdict;
    const short = copy.readings[bets.detent]?.short ?? "";
    lever = (
      <label className="fk-slider">
        <span className="fk-lever-label">
          {copy.sliderLabel} {bets.detent + 1}: <strong>{short}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={bets.detent}
          disabled={progress < 1}
          aria-valuetext={copy.readings[bets.detent]?.label}
          onChange={(event) => update({ detent: Number(event.currentTarget.value) })}
          data-fk-slider=""
        />
        <span className="fk-ticks" aria-hidden="true">
          {copy.readings.map((reading, detent) => (
            <span key={reading.short} data-on={detent === bets.detent ? "" : undefined}>
              {detent + 1}
            </span>
          ))}
        </span>
      </label>
    );
    notes = <Notes pack={pack} notes={copy.notes} kitFile={copy.kitFile} lead={copy.feedback[bets.vote ?? "none"]} />;
  } else if (index === 2) {
    const copy = pack.view;
    scene = <ViewScene pack={pack} exact={bets.exact} view={bets.view} fold={fold} />;
    caption = copy.caption;
    lever = (
      <div className="fk-two">
        <Radios
          name="fk-question"
          legend={copy.questionLabel}
          options={["vague", "exact"] as const}
          labels={copy.questionToggle}
          value={bets.exact ? "exact" : "vague"}
          onChange={(value) => update({ exact: value === "exact" })}
          mark={1}
        />
        <Radios
          name="fk-view"
          legend={copy.toggleLabel}
          options={["tables", "view"] as const}
          labels={copy.toggle}
          value={bets.view ? "view" : "tables"}
          onChange={(value) => update({ view: value === "view" })}
          mark={2}
        />
      </div>
    );
    notes = <Notes pack={pack} notes={[copy.box1Note, ...copy.notes, copy.stored]} kitFile={copy.kitFile} />;
  } else if (index === 3) {
    const copy = pack.who;
    scene = <WhoScene pack={pack} who={bets.who} previous={previousWho.current} share={whoShare} />;
    caption = copy.caption;
    lever = <Radios name="fk-who" legend={copy.chipLabel} options={WHO} labels={copy.chips} value={bets.who} onChange={chooseWho} />;
    notes = <Notes pack={pack} notes={[copy.honest, ...copy.notes, copy.rule, copy.addNote]} kitFile={copy.kitFile} />;
  } else if (index === 4) {
    const copy = pack.boundary;
    scene = <BoundaryScene pack={pack} boundary={bets.boundary} />;
    caption = copy.caption;
    lever = <Radios name="fk-boundary" legend={copy.label} options={BOUNDARIES} labels={copy.states} value={bets.boundary} onChange={(boundary) => update({ boundary })} />;
    notes = <Notes pack={pack} notes={copy.notes} kitFile={copy.kitFile} />;
  } else if (index === 5) {
    const copy = pack.test;
    scene = <TestScene pack={pack} tested={bets.tested} run={testRun} />;
    caption = copy.caption;
    lever = (
      <button type="button" className="fk-button fk-button-ink" aria-pressed={bets.tested} onClick={() => update({ tested: true })} data-fk-run="">
        {copy.run}
      </button>
    );
    const recall = bets.vote ? fill(copy.recall, { vote: pack.answer.votes[bets.vote] }) : undefined;
    notes = <Notes pack={pack} notes={copy.notes} kitFile={copy.kitFile} lead={recall} />;
  } else if (index === 6) {
    const copy = pack.own;
    scene = <OwnPreview pack={pack} card={card} />;
    caption = copy.caption;
    lever = (
      <label className="fk-select">
        <span className="fk-lever-label">{copy.presetLabel}</span>
        <select
          value={preset}
          onChange={(event) => {
            const chosen = pack.presets.find((candidate) => candidate.id === event.currentTarget.value);
            setPreset(event.currentTarget.value);
            if (chosen) setCard(chosen.card);
          }}
          data-fk-preset=""
        >
          <option value="">{copy.presetChoose}</option>
          {pack.presets.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.label}
            </option>
          ))}
        </select>
      </label>
    );
    below = <OwnForm pack={pack} card={card} onChange={(next) => setCard(next)} />;
    notes = <Notes pack={pack} notes={[]} kitFile={copy.kitFile} />;
  } else {
    const copy = pack.takehome;
    scene = <TakeHomeScene pack={pack} fromCard={line !== ""} />;
    caption = copy.caption;
    lever = (
      <a href={`#${TAKEHOME_TARGET_ID}`} className="fk-button fk-button-ink" data-fk-takehome="">
        {copy.lever}
      </a>
    );
    notes = <Notes pack={pack} notes={copy.notes} kitFile={copy.kitFile} />;
  }

  return (
    <div className="fk" data-fk-beat={index} ref={root}>
      <h2 className="fk-sr">{pack.stageLabel}</h2>
      <DemoStage label={pack.stageLabel} caption={caption}>
        <div className="fk-stage">
          <Strip pack={pack} done={done} index={index} />
          <div className="fk-scene">{scene}</div>
        </div>
      </DemoStage>
      <DemoLever>{lever}</DemoLever>
      {notes}
      {below}
    </div>
  );
}
