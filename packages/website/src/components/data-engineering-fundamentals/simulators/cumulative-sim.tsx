"use client";

import { useMemo, useState } from "react";
import { Panel } from "../primitives";

// ─── CumulativeSim ────────────────────────────────
// Ported from `src/chapters/Ch2_Store.js`: day-by-day `user_lifetime_points`
// scrubber. A unit-mix-up bug halves points from day 3 onward until the
// learner hits "Patch & backfill".

interface DayRow {
  readonly id: string;
  readonly points: number;
  readonly active: boolean;
}

function genDay(dayIdx: number, bugFromDay: number | null): readonly DayRow[] {
  const rows: DayRow[] = [];
  const seed = dayIdx * 37;
  const count = 6 + (dayIdx % 3);
  for (let i = 0; i < count; i++) {
    const id = `u${100 + i + (dayIdx > 2 ? i % 2 : 0)}`;
    const base = 10 + ((seed + i * 13) % 40);
    const points = bugFromDay !== null && dayIdx >= bugFromDay ? Math.floor(base / 2) : base;
    const active = (seed + i * 7) % 5 !== 0;
    rows.push({ id, points, active });
  }
  return rows;
}

interface CumRow {
  readonly id: string;
  readonly pts: number;
}

function computeCumulative(dayIdx: number, bugFromDay: number, patched: boolean): readonly CumRow[] {
  const totals: Record<string, number> = {};
  for (let d = 0; d <= dayIdx; d++) {
    const effectiveBug = patched ? null : bugFromDay;
    const day = genDay(d, effectiveBug);
    for (const u of day) {
      if (!(u.id in totals)) totals[u.id] = 0;
      if (u.active) totals[u.id] += u.points;
    }
  }
  return Object.entries(totals)
    .map(([id, pts]) => ({ id, pts }))
    .sort((a, b) => b.pts - a.pts);
}

const BUG_DAY = 2;

export function CumulativeSim() {
  const [day, setDay] = useState(2);
  const [patched, setPatched] = useState(false);
  const [bfKey, setBfKey] = useState(0);

  const today = useMemo(() => genDay(day, patched ? null : BUG_DAY), [day, patched]);
  const cumulative = useMemo(() => computeCumulative(day, BUG_DAY, patched), [day, patched]);
  const yesterday = useMemo(() => (day > 0 ? computeCumulative(day - 1, BUG_DAY, patched) : []), [day, patched]);

  const rowState = useMemo(() => {
    const prev = Object.fromEntries(yesterday.map((r) => [r.id, r.pts]));
    return cumulative.map((r) => ({
      ...r,
      delta: r.pts - (prev[r.id] ?? 0),
      state: !(r.id in prev) ? "new" : prev[r.id] !== r.pts ? "upd" : "same",
    }));
  }, [cumulative, yesterday]);

  const newCount = rowState.filter((r) => r.state === "new").length;
  const updCount = rowState.filter((r) => r.state === "upd").length;
  const totalPts = cumulative.reduce((a, r) => a + r.pts, 0);
  const todayPts = today.reduce((a, r) => a + (r.active ? r.points : 0), 0);
  const bugActive = !patched && day >= BUG_DAY;

  const startBackfill = () => {
    setPatched(true);
    setBfKey((k) => k + 1);
  };

  return (
    <Panel
      eyebrow="scrubber"
      title="user_lifetime_points · day by day"
      meta={`Day ${day + 1}/5`}
      caption="Each day, yesterday's snapshot merges with today's events into a new snapshot. Break any day and every following day inherits the drift."
    >
      <div className="cm-days">
        {[0, 1, 2, 3, 4].map((d) => (
          <button
            type="button"
            key={d}
            className={`cm-day ${day === d ? "active" : ""} ${!patched && d >= BUG_DAY ? "bug" : ""} ${patched && bfKey && d >= BUG_DAY ? "backfill" : ""}`}
            onClick={() => setDay(d)}
            aria-pressed={day === d}
          >
            <div className="num">DAY {d + 1}</div>
            <div className="date">2026-04-{String(15 + d).padStart(2, "0")}</div>
            <div className="rc">{genDay(d, patched ? null : BUG_DAY).length} rows</div>
          </button>
        ))}
      </div>

      <div className="cm2-flow">
        <div className="cm2-panel">
          <div className="cm2-panel-head">
            <div className="cm2-panel-eyebrow">step 1 · prior state</div>
            <div className="cm2-panel-title">Yesterday&apos;s snapshot</div>
            <div className="cm2-panel-sub">
              <code>user_lifetime_points</code> · day {day || "-"}
            </div>
          </div>
          <div className="cm2-table">
            <div className="cm2-thead">
              <span>user_id</span>
              <span className="r">points</span>
            </div>
            <div className="cm2-tbody">
              {day === 0 ? (
                <div className="cm2-empty">- no prior state on Day 1 -</div>
              ) : (
                yesterday.slice(0, 10).map((r) => (
                  <div className="cm2-row" key={r.id}>
                    <span className="cm2-key">{r.id}</span>
                    <span className="cm2-val">{r.pts}</span>
                  </div>
                ))
              )}
            </div>
            <div className="cm2-tfoot">
              <span>{yesterday.length} users</span>
              <span className="r">{yesterday.reduce((a, r) => a + r.pts, 0).toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        <div className="cm2-step">
          <div className="cm2-step-arrow">+</div>
          <div className="cm2-step-label">
            merge
            <br />
            <span>
              FULL OUTER
              <br />
              JOIN
            </span>
          </div>
        </div>

        <div className={`cm2-panel ${bugActive ? "is-bug" : ""}`}>
          <div className="cm2-panel-head">
            <div className="cm2-panel-eyebrow">step 2 · incoming</div>
            <div className="cm2-panel-title">Today&apos;s events</div>
            <div className="cm2-panel-sub">
              <code>daily_user_points</code> · day {day + 1}
            </div>
            {bugActive && <div className="cm2-panel-alert">⚠ unit mix-up: points halved</div>}
          </div>
          <div className="cm2-table">
            <div className="cm2-thead">
              <span>user_id</span>
              <span className="r">+points</span>
            </div>
            <div className="cm2-tbody">
              {today.map((r) => (
                <div className={`cm2-row ${r.active ? "" : "is-skipped"}`} key={r.id}>
                  <span className="cm2-key">{r.id}</span>
                  <span className="cm2-val cm2-delta">+{r.points}</span>
                </div>
              ))}
            </div>
            <div className="cm2-tfoot">
              <span>{today.length} events</span>
              <span className="r">+{todayPts} pts</span>
            </div>
          </div>
        </div>

        <div className="cm2-step">
          <div className="cm2-step-arrow">=</div>
          <div className="cm2-step-label">
            result
            <br />
            <span>
              COALESCE
              <br />
              (y, t)
            </span>
          </div>
        </div>

        <div className="cm2-panel cm2-panel-result">
          <div className="cm2-panel-head">
            <div className="cm2-panel-eyebrow">step 3 · written out</div>
            <div className="cm2-panel-title">Today&apos;s snapshot</div>
            <div className="cm2-panel-sub">
              <code>user_lifetime_points</code> · day {day + 1}
            </div>
          </div>
          <div className="cm2-table">
            <div className="cm2-thead cm2-thead-3">
              <span>user_id</span>
              <span className="r">points</span>
              <span className="s">status</span>
            </div>
            <div className="cm2-tbody">
              {rowState.map((r) => (
                <div key={r.id} className={`cm2-row cm2-row-3 is-${r.state}`}>
                  <span className="cm2-key">{r.id}</span>
                  <span className="cm2-val">{r.pts}</span>
                  <span className={`cm2-status cm2-st-${r.state}`}>
                    {r.state === "new" ? "NEW" : r.state === "upd" ? `+${r.delta}` : "-"}
                  </span>
                </div>
              ))}
            </div>
            <div className="cm2-tfoot">
              <span>{cumulative.length} users</span>
              <span className="r">{totalPts.toLocaleString()} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cm2-summary">
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">New users</span>
          <span className="cm2-summary-v">+{newCount}</span>
        </div>
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">Updated</span>
          <span className="cm2-summary-v">{updCount}</span>
        </div>
        <div className={`cm2-summary-item ${bugActive ? "is-warn" : "is-ok"}`}>
          <span className="cm2-summary-k">Data quality</span>
          <span className="cm2-summary-v">{bugActive ? "DRIFT" : "CLEAN"}</span>
        </div>
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">Join key</span>
          <span className="cm2-summary-v">
            <code>user_id</code>
          </span>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 2 }}>
          <div className="row">
            <label className="lab" htmlFor="cumulative-scrub-day">Scrub day</label>
            <span className="val">Day {day + 1}</span>
          </div>
          <input id="cumulative-scrub-day" type="range" min={0} max={4} step={1} value={day} onChange={(e) => setDay(+e.target.value)} />
          <span className="hint">click a day card above, or drag here</span>
        </div>
        <button type="button" className="btn btn-primary" disabled={patched} onClick={startBackfill}>
          {patched ? `✓ Backfilled from Day ${BUG_DAY + 1}` : `Patch & backfill from Day ${BUG_DAY + 1}`}
        </button>
      </div>
    </Panel>
  );
}

export default CumulativeSim;
