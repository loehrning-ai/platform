"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/components/demos/take-home/copy-button";
import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { COMPANY, CRAFT_NCR_SEP, CRAFT_SEP_ROWS, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { SCRAP_PRICE_EUR } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import {
  COUNTERS,
  companyGrowth,
  rate,
  verdict,
  type Basis,
  type Counter,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { renderKitCards, type KitCardWords } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { REVEAL, span, TRACE_MS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/timelines";
import { traceSum, traceGroups } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import type { DecisionText } from "./decision-text";
import { fill, type Fmt } from "./fmt";
import { SkillStrip } from "./skill-strip";
import type { Choices } from "./types";

/** Sections of the September report the period beat points to. */
const OVERVIEW_SECTION = 1;
const LIMITS_SECTION = 6;

function Para({ children }: { readonly children: ReactNode }) {
  return <p className="nw-para">{children}</p>;
}

/**
 * What a beat says below the lever: the explanation, the kit card lines and
 * the SKILL.md strip. Always open, one beat at a time.
 */
export function Notes({
  pack,
  fmt,
  id,
  progress,
  reducedMotion,
  choices,
  counter,
  basis,
  skipped,
  suggestion,
  decision,
  words,
  traceMs,
  traceStarted,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly id: string;
  readonly progress: number;
  readonly reducedMotion: boolean;
  readonly choices: Choices;
  readonly counter: Counter;
  readonly basis: Basis;
  readonly skipped: boolean;
  readonly suggestion: string;
  readonly decision: DecisionText;
  readonly words: KitCardWords;
  readonly traceMs: number;
  readonly traceStarted: boolean;
}) {
  if (id === "drei-zaehlweisen") {
    const done = progress >= REVEAL.frame;
    const live = [
      ...COUNTERS.map((item) =>
        fill(pack.reveal.live, {
          name: pack.counters[item].name,
          verdict: pack.verdicts[verdict(item)],
          a: fmt.rate(item, rate(item, "aug")),
          b: fmt.rate(item, rate(item, "sep")),
        }),
      ),
      fill(pack.reveal.liveTail, { per: fmt.per }),
    ].join(" ");
    return (
      <div className="nw-notes" data-nw-notes={id} style={{ opacity: span(progress, REVEAL.frame - 0.1, 1) }}>
        <p className="sr-only" aria-live="polite">
          {done ? live : ""}
        </p>
        <Para>{pack.reveal.others[choices.poll ?? "none"]}</Para>
        <Para>{pack.reveal.body}</Para>
        <h3 className="nw-h3">{pack.reveal.legendTitle}</h3>
        <Para>{pack.reveal.legend}</Para>
      </div>
    );
  }

  if (id === "zaehler-waehlen") {
    const quantities = CRAFT_NCR_SEP.map((row) => row.qty);
    const documentation = CRAFT_NCR_SEP.filter((row) => row.type === "documentation").length;
    return (
      <div className="nw-notes" data-nw-notes={id}>
        {choices.merged ? (
          <>
            <Para>{pack.counter.mergedBody}</Para>
            <Para>{fill(pack.counter.fact, { min: Math.min(...quantities), max: Math.max(...quantities) })}</Para>
          </>
        ) : null}
        <Para>{fill(pack.counter.reasoning, { per: fmt.per })}</Para>
        <div className="nw-card-lines" data-card-lines="">
          <p className="nw-caps">{pack.counter.cardTitle}</p>
          <p>{fill(pack.counter.cardLines.numerator, { counter: choices.counter ? pack.counters[choices.counter].long : "…" })}</p>
          <p>{pack.counter.cardLines.denominator}</p>
          <p>{fill(pack.counter.cardLines.limit, { doc: documentation, n: CRAFT_NCR_SEP.length })}</p>
        </div>
        {choices.counter ? (
          <SkillStrip head={pack.stripHead} text={renderKitCards({ counter: choices.counter, basis }, words, "counter")} reducedMotion={reducedMotion} />
        ) : null}
      </div>
    );
  }

  if (id === "zeitraum") {
    const month = fmt.pct(companyGrowth("month"));
    const week = fmt.pct(companyGrowth("week"));
    const reportMonth = fmt.pct((COMPANY.units.sep - COMPANY.units.aug) / COMPANY.units.aug, 0);
    return (
      <div className="nw-notes" data-nw-notes={id}>
        <Para>{fill(pack.period.company, { m: month, w: week })}</Para>
        <Para>{fill(pack.period.sections, { m: reportMonth, w: week, first: OVERVIEW_SECTION, last: LIMITS_SECTION })}</Para>
        <Para>{pack.period.calendar}</Para>
        <Para>{fill(pack.period.rates, { per: fmt.per })}</Para>
        {choices.basis ? (
          <SkillStrip head={pack.stripHead} text={renderKitCards({ counter, basis: choices.basis }, words, "period")} reducedMotion={reducedMotion} />
        ) : null}
      </div>
    );
  }

  if (id === "zahl-pruefen") {
    const path = pack.trace.path;
    const sum = traceSum(traceGroups());
    const steps = [
      path.file,
      path.filter,
      fill(path.rows, { n: CRAFT_SEP_ROWS.length }),
      path.formula,
      fill(path.sum, { eur: fmt.eur(sum) }),
    ];
    return (
      <div className="nw-notes" data-nw-notes={id}>
        <ol className="nw-path" data-trace-path="">
          {steps.map((step, position) => (
            <li key={step} data-lit={traceStarted && traceMs >= (TRACE_MS * position) / steps.length ? "" : undefined}>
              {step}
            </li>
          ))}
        </ol>
        <Para>{pack.trace.body}</Para>
        <Para>
          {fill(pack.trace.prices, {
            report: fmt.eur(REPORT.avgPriceCents / 100, 2),
            mean: fmt.eur(SCRAP_PRICE_EUR),
          })}
        </Para>
        <div className="nw-prompt">
          <p className="nw-caps">{pack.trace.promptHead}</p>
          <p>{pack.trace.prompt}</p>
          <CopyButton text={pack.trace.prompt} label={pack.takehome.copy} doneLabel={pack.takehome.copied} />
        </div>
      </div>
    );
  }

  if (id === "entscheiden") {
    const fields = pack.decide.fields;
    const rows = [
      { key: "decision", label: fields.decision, text: decision.headline },
      { key: "because", label: fields.because, text: decision.because },
      { key: "number", label: fields.number, text: decision.number },
      { key: "risk", label: fields.risk, text: decision.risk },
      { key: "counter", label: fields.counter, text: decision.counter },
      { key: "trigger", label: fields.trigger, text: decision.trigger },
    ];
    return (
      <div className="nw-notes" data-nw-notes={id}>
        <dl className="nw-fields" data-decision-fields="">
          {rows.map((row) => (
            <div key={row.key} data-field={row.key}>
              <dt>{row.label}</dt>
              <dd>{row.text}</dd>
            </div>
          ))}
        </dl>
        <ul className="nw-check-list" data-trigger-checks="">
          {decision.checks.map((check, position) => (
            <li key={position} data-check={check.ok ? "ok" : "fail"}>
              <span className="nw-check-mark">{check.ok ? "✓" : "✗"}</span> {check.text}
            </li>
          ))}
        </ul>
        <Para>{pack.decide.setting}</Para>
        <p className="nw-closing">{pack.decide.closing}</p>
        <p className="nw-muted">{pack.decide.stripAll}</p>
        <SkillStrip
          head={pack.stripHead}
          text={renderKitCards({ counter, basis }, words, "all")}
          note={skipped ? suggestion : null}
          reducedMotion={reducedMotion}
        />
      </div>
    );
  }

  return null;
}
