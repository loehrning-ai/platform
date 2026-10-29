import { modelName, recordedOn } from "@/lib/claude-runs";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { MEASURED, medianRun, minutesSeconds, roundHalfEven, summary, type Edition } from "@/lib/demo-cases/esg-berichte-mit-ki/measured";

/** "8 Min. 32 s" / "8 min 32 s" from seconds, rounded as the measurement did. */
export function minSec(copy: AppCopy, seconds: number): string {
  const { min, s } = minutesSeconds(seconds);
  return fill(copy.measured.minSec, { min, s });
}

/**
 * The measurement of 26.10.2026 (the deck's slide „Mit Claude gemessen"):
 * our card over the dimmed window, never part of the depicted app. The time
 * with Claude is measured; the time by hand is not, and the card says so.
 */
export function MeasuredCard({ copy, edition }: { readonly copy: AppCopy; readonly edition: Edition }) {
  const m = copy.measured;
  const sum = summary(edition);
  const run = medianRun(edition);
  const date = recordedOn(`${MEASURED.date}T12:00:00Z`, edition);
  const longest = Math.max(...run.steps);
  return (
    <section className="w4a-measured" aria-labelledby="w4a-measured-title" data-w4a-measured="">
      <h2 id="w4a-measured-title" className="w4a-measured-title">
        {m.title}
      </h2>
      <div className="w4a-measured-grid">
        <div className="w4a-measured-col" data-side="claude">
          <p className="w4a-measured-kicker">{m.claude}</p>
          <p className="w4a-measured-value" data-w4a-measured-median="">
            {minSec(copy, sum.medianS)}
          </p>
          <p>
            {fill(m.claudeLead, {
              runs: sum.runs,
              date,
              model: modelName(MEASURED.model),
              version: MEASURED.claudeCode,
              min: minSec(copy, sum.minS),
              max: minSec(copy, sum.maxS),
            })}
          </p>
          <p>{sum.allRight === sum.runs ? fill(m.allRight, { runs: sum.runs }) : fill(m.someRight, { ok: sum.allRight, runs: sum.runs })}</p>
          <p>{fill(m.september, { s: roundHalfEven(sum.septemberMedianS) })}</p>
          <p className="w4a-measured-kicker">{m.shown}</p>
          <ol className="w4a-bars">
            {run.steps.map((seconds, index) => (
              <li key={index}>
                <span className="w4a-bar-label">{fill(m.stepBar, { n: index + 1, s: roundHalfEven(seconds) })}</span>
                <span className="w4a-bar" style={{ inlineSize: `${(seconds / longest) * 100}%` }} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>
        <div className="w4a-measured-col" data-side="hand">
          <p className="w4a-measured-kicker">{m.hand}</p>
          <p className="w4a-measured-value" data-muted="">
            {m.handValue}
          </p>
          <p>{m.handLead}</p>
          <p className="w4a-measured-small">{m.efrag}</p>
          {/* What the time leaves out is a person's work: it sits in this column, so the card fits a 900 px window. */}
          <p className="w4a-measured-small">{m.notCounted}</p>
        </div>
      </div>
    </section>
  );
}
