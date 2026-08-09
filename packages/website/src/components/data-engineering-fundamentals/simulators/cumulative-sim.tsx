"use client";

import { useMemo, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

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
  const { text } = useDataEngineeringFundamentalsLocale();
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
      eyebrow={text("scrubber", "Tagesauswahl")}
      title={`user_lifetime_points · ${text("day by day", "Tag für Tag")}`}
      meta={`${text("Day", "Tag")} ${day + 1}/5`}
      caption={text("In this recursive additive example, each snapshot depends on the prior day. Rebuild the affected range after a faulty input or rule.", "In diesem rekursiven additiven Beispiel hängt jeder Snapshot vom Vortag ab. Nach einer fehlerhaften Eingabe oder Regel wird der betroffene Bereich neu aufgebaut.")}
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
            <div className="num">{text("DAY", "TAG")} {d + 1}</div>
            <div className="date">2026-04-{String(15 + d).padStart(2, "0")}</div>
            <div className="rc">{genDay(d, patched ? null : BUG_DAY).length} {text("rows", "Zeilen")}</div>
          </button>
        ))}
      </div>

      <div className="cm2-flow">
        <div className="cm2-panel">
          <div className="cm2-panel-head">
            <div className="cm2-panel-eyebrow">{text("step 1 · prior state", "Schritt 1 · vorheriger Zustand")}</div>
            <div className="cm2-panel-title">{text("Yesterday's snapshot", "Snapshot von gestern")}</div>
            <div className="cm2-panel-sub">
              <code>user_lifetime_points</code> · {text("day", "Tag")} {day || "-"}
            </div>
          </div>
          <div className="cm2-table">
            <div className="cm2-thead">
              <span>user_id</span>
              <span className="r">{text("points", "Punkte")}</span>
            </div>
            <div className="cm2-tbody">
              {day === 0 ? (
                <div className="cm2-empty">- {text("no prior state on Day 1", "kein vorheriger Zustand an Tag 1")} -</div>
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
              <span>{yesterday.length} {text("users", "Nutzer")}</span>
              <span className="r">{yesterday.reduce((a, r) => a + r.pts, 0).toLocaleString()} {text("pts", "Pkt.")}</span>
            </div>
          </div>
        </div>

        <div className="cm2-step">
          <div className="cm2-step-arrow">+</div>
          <div className="cm2-step-label">
            {text("merge", "zusammenführen")}
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
            <div className="cm2-panel-eyebrow">{text("step 2 · incoming", "Schritt 2 · eingehend")}</div>
            <div className="cm2-panel-title">{text("Today's events", "Heutige Ereignisse")}</div>
            <div className="cm2-panel-sub">
              <code>daily_user_points</code> · {text("day", "Tag")} {day + 1}
            </div>
            {bugActive && <div className="cm2-panel-alert">⚠ {text("unit mix-up: points halved", "Einheiten verwechselt: Punkte halbiert")}</div>}
          </div>
          <div className="cm2-table">
            <div className="cm2-thead">
              <span>user_id</span>
              <span className="r">+{text("points", "Punkte")}</span>
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
              <span>{today.length} {text("events", "Ereignisse")}</span>
              <span className="r">+{todayPts} {text("pts", "Pkt.")}</span>
            </div>
          </div>
        </div>

        <div className="cm2-step">
          <div className="cm2-step-arrow">=</div>
          <div className="cm2-step-label">
            {text("result", "Ergebnis")}
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
            <div className="cm2-panel-eyebrow">{text("step 3 · written out", "Schritt 3 · geschrieben")}</div>
            <div className="cm2-panel-title">{text("Today's snapshot", "Heutiger Snapshot")}</div>
            <div className="cm2-panel-sub">
              <code>user_lifetime_points</code> · {text("day", "Tag")} {day + 1}
            </div>
          </div>
          <div className="cm2-table">
            <div className="cm2-thead cm2-thead-3">
              <span>user_id</span>
              <span className="r">{text("points", "Punkte")}</span>
              <span className="s">Status</span>
            </div>
            <div className="cm2-tbody">
              {rowState.map((r) => (
                <div key={r.id} className={`cm2-row cm2-row-3 is-${r.state}`}>
                  <span className="cm2-key">{r.id}</span>
                  <span className="cm2-val">{r.pts}</span>
                  <span className={`cm2-status cm2-st-${r.state}`}>
                    {r.state === "new" ? text("NEW", "NEU") : r.state === "upd" ? `+${r.delta}` : "-"}
                  </span>
                </div>
              ))}
            </div>
            <div className="cm2-tfoot">
              <span>{cumulative.length} {text("users", "Nutzer")}</span>
              <span className="r">{totalPts.toLocaleString()} {text("pts", "Pkt.")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cm2-summary">
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">{text("New users", "Neue Nutzer")}</span>
          <span className="cm2-summary-v">+{newCount}</span>
        </div>
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">{text("Updated", "Aktualisiert")}</span>
          <span className="cm2-summary-v">{updCount}</span>
        </div>
        <div className={`cm2-summary-item ${bugActive ? "is-warn" : "is-ok"}`}>
          <span className="cm2-summary-k">{text("Data quality", "Datenqualität")}</span>
          <span className="cm2-summary-v">{bugActive ? text("DRIFT", "ABWEICHUNG") : text("CLEAN", "SAUBER")}</span>
        </div>
        <div className="cm2-summary-item">
          <span className="cm2-summary-k">{text("Join key", "Join-Schlüssel")}</span>
          <span className="cm2-summary-v">
            <code>user_id</code>
          </span>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 2 }}>
          <div className="row">
            <label className="lab" htmlFor="cumulative-scrub-day">{text("Scrub day", "Tag auswählen")}</label>
            <span className="val">{text("Day", "Tag")} {day + 1}</span>
          </div>
          <input id="cumulative-scrub-day" type="range" min={0} max={4} step={1} value={day} onChange={(e) => setDay(+e.target.value)} />
          <span className="hint">{text("click a day card above, or drag here", "Tageskarte auswählen oder Regler verschieben")}</span>
        </div>
        <button type="button" className="btn btn-primary" disabled={patched} onClick={startBackfill}>
          {patched ? `✓ ${text("Backfilled from Day", "Neu berechnet ab Tag")} ${BUG_DAY + 1}` : `${text("Patch & backfill from Day", "Korrigieren und neu berechnen ab Tag")} ${BUG_DAY + 1}`}
        </button>
      </div>
    </Panel>
  );
}

export default CumulativeSim;
