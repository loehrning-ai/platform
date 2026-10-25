"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DemoLever,
  DemoStage,
  setTakeHomeLine,
  useBeatClock,
  useOnRestart,
} from "@/components/demos/shell";
import { CopyButton } from "@/components/demos/take-home/copy-button";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP, CRAFT_SEP_ROWS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import {
  BASES,
  growth,
  SAME_BAND,
  weekCount,
  type Basis,
  type Counter,
  type Verdict,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { buildSkillZip, renderProjectInstructions, renderReferences, SKILL_NAME } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import {
  canAddCard,
  cardToMarkdown,
  EMPTY_CARD,
  lintCard,
  MAX_CARDS,
  type Finding,
  type OwnCard,
  type TextField,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/steckbrief";
import { REVEAL, TRACE_MS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { ChipGroup } from "./chip-group";
import { decisionText, kitWords } from "./decision-text";
import { fill, formatter } from "./fmt";
import { Notes } from "./notes";
import { OwnForm } from "./own-form";
import { StageClaim } from "./stage-claim";
import { StageDecide } from "./stage-decide";
import { StageOwn, StageTakeHome } from "./stage-own";
import { RAIL_OF, ReportStrip, StageRails } from "./stage-rails";
import { StageTrace } from "./stage-trace";
import { StageWeeks } from "./stage-weeks";
import { EMPTY_CHOICES, REFERENCE, type Choices } from "./types";
import { useRunClock, useTransitionShare } from "./use-motion";
import "./demo.css";

const SLUG = "geschaeftsberichte-mit-ki-lesen";
const POLL: readonly Verdict[] = ["better", "same", "worse"];
const MERGE_MS = 600;
const PERIOD_MS = 700;
/** How long a downloaded file's object URL stays valid. */
const URL_LIFETIME_MS = 30_000;

/** Saves bytes as a file, in the browser only. */
function saveBytes(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), URL_LIFETIME_MS);
}

export interface DemoProps {
  readonly pack: DemoPack;
  /** content/skills/kennzahlen-steckbrief/SKILL.md, read on the server. */
  readonly skillText: string;
  /** project-instructions.md from this locale's kit zip, read on the server. */
  readonly instructions: string;
}

/**
 * "Eine Datei, drei Antworten": eight beats on the v3 shell clock. Every
 * object on the stage is a kit row or a number computed from one
 * (src/lib/demo-cases/geschaeftsberichte-mit-ki-lesen). Restart clears the
 * poll and the levers, never the visitor's own cards.
 */
export default function Demo({ pack, skillText, instructions }: DemoProps) {
  const { beat, progress, index, reducedMotion, commit, canAdvance, next, locale } = useBeatClock();
  const fmt = useMemo(() => formatter(pack), [pack]);
  const suggestion = DEMOS_PAGE_COPY[locale].shell.suggestionTaken;
  const [choices, setChoices] = useState<Choices>(EMPTY_CHOICES);
  const [advance, setAdvance] = useState(false);
  const [traceRun, setTraceRun] = useState<number | null>(null);
  const [view, setView] = useState<"mine" | "report">("mine");
  const [draft, setDraft] = useState<OwnCard>(EMPTY_CARD);
  const [cards, setCards] = useState<readonly OwnCard[]>([]);

  useOnRestart(() => {
    setChoices(EMPTY_CHOICES);
    setAdvance(false);
    setTraceRun(null);
    setView("mine");
  });

  // The poll commits and moves on by itself once beat 1's motion has finished.
  useEffect(() => {
    if (!advance || index !== 0 || !canAdvance) return;
    setAdvance(false);
    next();
  }, [advance, canAdvance, index, next]);

  const merge = useTransitionShare(choices.merged ? 1 : 0, MERGE_MS, reducedMotion);
  const mergeAmount = merge.from + (merge.to - merge.from) * merge.share;
  const period = useTransitionShare<"weeks" | Basis>(choices.basis ?? "weeks", PERIOD_MS, reducedMotion);
  const traceMs = useRunClock(traceRun, TRACE_MS, reducedMotion);

  const counter: Counter = choices.counter ?? REFERENCE.counter;
  const basis: Basis = choices.basis ?? REFERENCE.basis;
  const skipped = choices.counter === null || choices.basis === null;
  const shownCounter: Counter = view === "report" ? "records" : counter;
  const shownBasis: Basis = view === "report" ? "month" : basis;
  const decision = useMemo(() => decisionText(pack, fmt, shownCounter, shownBasis), [pack, fmt, shownCounter, shownBasis]);
  const words = useMemo(() => kitWords(pack, fmt), [pack, fmt]);

  const findings = useMemo(() => lintCard(draft), [draft]);
  const cardsMarkdown = useMemo(() => cards.map((card) => cardToMarkdown(card, pack.own.card)).join("\n\n"), [cards, pack]);
  useEffect(() => setTakeHomeLine(SLUG, cardsMarkdown), [cardsMarkdown]);

  const choose = (patch: Partial<Choices>) => setChoices((previous) => ({ ...previous, ...patch }));
  const onPoll = (value: Verdict) => {
    if (choices.poll !== null) return;
    choose({ poll: value });
    commit();
    next();
    setAdvance(true);
  };
  const addCard = () => {
    if (!canAddCard(draft) || cards.length >= MAX_CARDS) return;
    setCards((previous) => [...previous, draft]);
    setDraft(EMPTY_CARD);
  };
  const downloadSkill = () => {
    const references = cards.length > 0 ? renderReferences(cards, pack.own.card, pack.own.referencesTitle) : null;
    saveBytes(buildSkillZip(skillText, references), `${SKILL_NAME}.zip`);
  };
  const editDraft = (patch: Partial<OwnCard>) => setDraft((previous) => ({ ...previous, ...patch }));
  const startTrace = () => setTraceRun((previous) => (previous ?? 0) + 1);

  const id = beat.id;
  const revealT = id === "drei-zaehlweisen" ? progress : 1;
  const traceDone = traceRun !== null && traceMs >= TRACE_MS;

  let stage: ReactNode;
  let caption: string;
  let lever: ReactNode;

  if (id === "frage") {
    stage = <StageClaim pack={pack} fmt={fmt} progress={progress} />;
    caption = pack.claim.caption;
    lever = (
      <div className="nw-poll" role="group" aria-label={pack.claim.pollLabel}>
        {POLL.map((value) => (
          <button
            key={value}
            type="button"
            className="nw-poll-button"
            data-poll={value}
            aria-pressed={choices.poll === value}
            data-dim={choices.poll !== null && choices.poll !== value ? "" : undefined}
            onClick={() => onPoll(value)}
          >
            {pack.claim.poll[value]}
          </button>
        ))}
      </div>
    );
  } else if (id === "drei-zaehlweisen" || id === "zaehler-waehlen") {
    const reveal = id === "drei-zaehlweisen";
    const framed = reveal ? (choices.poll ? RAIL_OF[choices.poll] : null) : choices.counter;
    stage = (
      <StageRails
        pack={pack}
        fmt={fmt}
        t={revealT}
        framed={framed}
        merge={reveal ? 0 : mergeAmount}
        choice={
          reveal
            ? undefined
            : { legend: pack.counter.legend, value: choices.counter, onChange: (value) => choose({ counter: value }) }
        }
        top={
          reveal ? (
            <ReportStrip pack={pack} fmt={fmt} />
          ) : (
            <button
              type="button"
              className="nw-toggle"
              aria-pressed={choices.merged}
              data-merge-toggle=""
              onClick={() => choose({ merged: !choices.merged })}
            >
              <span className="nw-toggle-box" aria-hidden="true">
                {choices.merged ? "✓" : ""}
              </span>
              <span>{pack.counter.merge}</span>
            </button>
          )
        }
      />
    );
    if (reveal) {
      caption =
        revealT >= REVEAL.verdict
          ? pack.reveal.caption[choices.poll ?? "none"]
          : fill(pack.reveal.counting, { n: CRAFT_NCR_SEP.length });
      lever = <p className="nw-lever-note">{fill(pack.reveal.band, { band: fmt.share(SAME_BAND, 0) })}</p>;
    } else {
      caption = choices.counter
        ? fill(pack.counter.captionChosen, { counter: pack.counters[choices.counter].long })
        : choices.merged
          ? pack.counter.captionMerged
          : pack.counter.caption;
      lever = <p className="nw-lever-note">{pack.counter.pick}</p>;
    }
  } else if (id === "zeitraum") {
    stage = <StageWeeks pack={pack} fmt={fmt} grow={progress} from={period.from} to={period.to} share={period.share} />;
    caption =
      choices.basis === "month"
        ? fill(pack.period.captionMonth, { g: fmt.pct(growth("month")), sep: weekCount("sep"), aug: weekCount("aug") })
        : choices.basis === "week"
          ? fill(pack.period.captionWeek, { g: fmt.share(Math.abs(growth("week"))) })
          : pack.period.caption;
    lever = (
      <ChipGroup
        legend={pack.period.legend}
        name="nw-basis"
        value={choices.basis}
        options={BASES.map((value) => ({ value, label: pack.bases[value].short }))}
        onChange={(value) => choose({ basis: value })}
      />
    );
  } else if (id === "zahl-pruefen") {
    stage = <StageTrace pack={pack} fmt={fmt} ms={traceMs} started={traceRun !== null} onTrace={startTrace} />;
    caption = traceDone ? fill(pack.trace.captionDone, { rows: fmt.n(CRAFT_SEP_ROWS.length) }) : pack.trace.caption;
    lever = (
      <button type="button" className="nw-action" data-trace-button="" onClick={startTrace}>
        {pack.trace.button}
      </button>
    );
  } else if (id === "entscheiden") {
    stage = (
      <StageDecide
        pack={pack}
        fmt={fmt}
        counter={shownCounter}
        basis={shownBasis}
        decision={decision}
        progress={progress}
        suggested={view === "mine" && skipped ? suggestion : null}
      />
    );
    caption = view === "mine" ? pack.decide.caption : pack.decide.captionReport;
    lever = (
      <ChipGroup
        legend={pack.decide.legend}
        name="nw-view"
        value={view}
        options={[
          { value: "mine", label: pack.decide.mine },
          { value: "report", label: pack.decide.report },
        ]}
        onChange={setView}
      />
    );
  } else if (id === "deine-kennzahl") {
    stage = <StageOwn pack={pack} card={draft} findings={findings} added={cards.length} />;
    caption = pack.own.caption;
    lever = (
      <button
        type="button"
        className="nw-action"
        data-add-card=""
        disabled={!canAddCard(draft) || cards.length >= MAX_CARDS}
        onClick={addCard}
      >
        {pack.own.add}
      </button>
    );
  } else {
    stage = <StageTakeHome pack={pack} cards={cards} />;
    caption = cards.length > 0 ? pack.takehome.caption : pack.takehome.captionEmpty;
    lever = (
      <button type="button" className="nw-action" data-skill-zip="" onClick={downloadSkill}>
        {cards.length > 0 ? pack.takehome.zip : pack.takehome.zipEmpty}
      </button>
    );
  }

  return (
    <div className="nw-demo" data-nw-beat={id}>
      <h2 className="sr-only" data-nw-beat-heading="">
        {beat.label[locale]}
      </h2>
      <DemoStage label={pack.stageLabel} caption={caption}>
        {stage}
      </DemoStage>
      <DemoLever>{lever}</DemoLever>
      <Notes
        pack={pack}
        fmt={fmt}
        id={id}
        progress={progress}
        reducedMotion={reducedMotion}
        choices={choices}
        counter={counter}
        basis={basis}
        skipped={skipped}
        suggestion={suggestion}
        decision={decision}
        words={words}
        traceMs={traceMs}
        traceStarted={traceRun !== null}
      />
      {id === "deine-kennzahl" ? (
        <OwnSection
          pack={pack}
          draft={draft}
          cards={cards}
          findings={findings}
          onText={(field, value) => editDraft({ [field]: value })}
          onEdit={editDraft}
          onAdd={addCard}
          onRemove={(position) => setCards((previous) => previous.filter((_, at) => at !== position))}
          onClear={() => {
            setDraft(EMPTY_CARD);
            setCards([]);
          }}
          onDownload={downloadSkill}
        />
      ) : null}
      {id === "mitnehmen" ? (
        <TakeHomeNotes pack={pack} text={renderProjectInstructions(instructions, cards, pack.own.card)} />
      ) : null}
    </div>
  );
}

function OwnSection({
  pack,
  draft,
  cards,
  findings,
  onText,
  onEdit,
  onAdd,
  onRemove,
  onClear,
  onDownload,
}: {
  readonly pack: DemoPack;
  readonly draft: OwnCard;
  readonly cards: readonly OwnCard[];
  readonly findings: readonly Finding[];
  readonly onText: (field: TextField, value: string) => void;
  readonly onEdit: (patch: Partial<OwnCard>) => void;
  readonly onAdd: () => void;
  readonly onRemove: (position: number) => void;
  readonly onClear: () => void;
  readonly onDownload: () => void;
}) {
  const own = pack.own;
  const full = cards.length >= MAX_CARDS;
  const hint = full ? fill(own.full, { max: MAX_CARDS }) : canAddCard(draft) ? null : own.needs;
  return (
    <section className="nw-section" aria-labelledby="nw-own-heading" data-own-section="">
      <p className="nw-own-privacy" data-own-privacy="">
        {own.privacy}
      </p>
      <h2 id="nw-own-heading" className="nw-h2">
        {own.heading}
      </h2>
      <p className="nw-lead">{own.lead}</p>
      <OwnForm
        pack={pack}
        card={draft}
        findings={findings}
        onText={onText}
        onKind={(numeratorKind) => onEdit({ numeratorKind })}
        onNoDenominator={(noDenominator) => onEdit({ noDenominator })}
        onPeriod={(period) => onEdit({ period })}
        onComparison={(comparison) => onEdit({ comparison })}
      />
      {hint ? <p className="nw-muted">{hint}</p> : null}
      <h3 className="nw-h3">{own.added}</h3>
      {cards.length === 0 ? (
        <p className="nw-muted">{own.none}</p>
      ) : (
        <ol className="nw-card-list" data-own-cards="">
          {cards.map((card, position) => (
            <li key={position}>
              <pre className="nw-card-preview">
                <code>{cardToMarkdown(card, own.card)}</code>
              </pre>
              <button type="button" className="nw-small-button" onClick={() => onRemove(position)}>
                {own.remove}
              </button>
            </li>
          ))}
        </ol>
      )}
      <p>
        <button type="button" className="nw-small-button" data-own-clear="" onClick={onClear}>
          {own.clear}
        </button>
      </p>
      <div className="nw-dock glass" data-own-dock="">
        <button type="button" className="nw-action" disabled={!canAddCard(draft) || full} onClick={onAdd}>
          {own.add}
        </button>
        <span className="nw-dock-count">{fill(own.count, { n: cards.length, max: MAX_CARDS })}</span>
        <button type="button" className="nw-action nw-action-quiet" onClick={onDownload}>
          {own.dockZip}
        </button>
      </div>
    </section>
  );
}

function TakeHomeNotes({ pack, text }: { readonly pack: DemoPack; readonly text: string }) {
  const copy = pack.takehome;
  return (
    <section className="nw-section" aria-labelledby="nw-takehome-heading" data-takehome-notes="">
      <h2 id="nw-takehome-heading" className="nw-h2">
        {copy.instructionsHead}
      </h2>
      <p className="nw-lead">{copy.instructionsLead}</p>
      <pre className="nw-instructions" data-own-instructions="" tabIndex={0}>
        {text}
      </pre>
      <CopyButton text={text} label={copy.copy} doneLabel={copy.copied} />
      <h3 className="nw-h3">{copy.promptsHead}</h3>
      <ol className="nw-prompts">
        {copy.prompts.map((prompt) => (
          <li key={prompt}>
            <p>{prompt}</p>
            <CopyButton text={prompt} label={copy.copy} doneLabel={copy.copied} />
          </li>
        ))}
      </ol>
      <p className="nw-muted">{copy.below}</p>
    </section>
  );
}
