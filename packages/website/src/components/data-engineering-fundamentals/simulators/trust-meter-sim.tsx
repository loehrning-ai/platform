"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";

// ─── TrustMeterSim (plan 011 stage 7) ────────────────────────────────
// Ported from `src/chapters/Ch5_Quality.js`: 4 toggleable DQ checks feed a
// trust score; inject a corruption on day 18, run 30 days, see whether the
// check catches it (signal blocked, oncall paged) or the wrong number ships.

const DAYS = 30;
const CORRUPT_DAY = 17;

interface CheckDef {
  readonly id: "rows" | "schema" | "fresh" | "unique";
  readonly name: string;
  readonly desc: string;
  readonly weight: number;
}

const CHECKS: readonly CheckDef[] = [
  { id: "rows", name: "Row-count band", desc: "±10% vs 7-day median", weight: 32 },
  { id: "schema", name: "Schema check", desc: "no null/new cols", weight: 22 },
  { id: "fresh", name: "Freshness", desc: "landed ≤ SLA", weight: 24 },
  { id: "unique", name: "Uniqueness", desc: "PK has no dupes", weight: 22 },
];

type CorruptionId = "halfWrite" | "schemaDrift" | "slaSlip" | "dupRows";

const CORRUPTIONS: Record<CorruptionId, { label: string; tripsBy: CheckDef["id"]; wrongVal: number }> = {
  halfWrite: { label: "half-write (80% rows dropped)", tripsBy: "rows", wrongVal: 24.8 },
  schemaDrift: { label: "schema drift (new null column)", tripsBy: "schema", wrongVal: 0 },
  slaSlip: { label: "SLA slip (partition landed 3h late)", tripsBy: "fresh", wrongVal: 142.3 },
  dupRows: { label: "duplicate rows (idempotency bug)", tripsBy: "unique", wrongVal: 284.6 },
};

interface DayResult {
  readonly day: number;
  readonly ok: boolean;
  readonly trippedBy: CheckDef["id"] | null;
  readonly corrupt: boolean;
  readonly caught: boolean;
}

interface Ticket {
  readonly id: string;
  readonly day: number;
  readonly reason: string;
}

type Checks = Record<CheckDef["id"], boolean>;
type Status = "idle" | "running" | "ok" | "stale" | "breach";
type DashState = "ok" | "stale" | "wrong";

export function TrustMeterSim() {
  const [checks, setChecks] = useState<Checks>({ rows: true, schema: true, fresh: true, unique: true });
  const [corrupt, setCorrupt] = useState<CorruptionId | null>(null);
  const [runDay, setRunDay] = useState(-1);
  const [results, setResults] = useState<readonly DayResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [dashNumber, setDashNumber] = useState(142.3);
  const [dashState, setDashState] = useState<DashState>("ok");
  const [oncallTicket, setOncallTicket] = useState<Ticket | null>(null);

  const checksRef = useRef(checks);
  checksRef.current = checks;
  const corruptRef = useRef(corrupt);
  corruptRef.current = corrupt;
  const runTokenRef = useRef(0);

  useEffect(() => {
    return () => {
      // Deliberately mutates whatever the ref holds at unmount time (not a
      // value captured at mount), so any in-flight setTimeout chain from
      // run() sees a stale token and stops scheduling further steps.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runTokenRef.current++;
    };
  }, []);

  const activeWeight = Object.entries(checks)
    .filter(([, v]) => v)
    .reduce((a, [k]) => a + (CHECKS.find((c) => c.id === k)?.weight ?? 0), 0);
  const trustPct = activeWeight;

  const toggle = (id: CheckDef["id"]) => setChecks((c) => ({ ...c, [id]: !c[id] }));

  const reset = () => {
    runTokenRef.current++;
    setRunDay(-1);
    setResults([]);
    setStatus("idle");
    setDashNumber(142.3);
    setDashState("ok");
    setOncallTicket(null);
  };

  const run = () => {
    runTokenRef.current++;
    const token = runTokenRef.current;
    setRunDay(-1);
    setResults([]);
    setStatus("running");
    setDashNumber(142.3);
    setDashState("ok");
    setOncallTicket(null);
    let d = 0;
    const step = () => {
      if (token !== runTokenRef.current) return;
      const checksNow = checksRef.current;
      const corruptNow = corruptRef.current;
      setRunDay(d);
      const isCorruptDay = !!corruptNow && d === CORRUPT_DAY;
      const corruption = isCorruptDay && corruptNow ? CORRUPTIONS[corruptNow] : null;
      const trippingCheck = corruption?.tripsBy ?? null;
      const caught = isCorruptDay && !!trippingCheck && checksNow[trippingCheck];
      const ok = !isCorruptDay;
      setResults((r) => [...r, { day: d, ok, trippedBy: isCorruptDay ? trippingCheck : null, corrupt: isCorruptDay, caught }]);
      if (isCorruptDay && corruption && trippingCheck) {
        if (caught) {
          setDashState("stale");
          setOncallTicket({
            id: "T" + Math.floor(1700000 + Math.random() * 99999),
            day: d + 1,
            reason: corruption.label + " · caught by " + (CHECKS.find((c) => c.id === trippingCheck)?.name ?? ""),
          });
        } else {
          setDashNumber(corruption.wrongVal);
          setDashState(corruption.wrongVal === 142.3 ? "stale" : "wrong");
        }
      }
      d++;
      if (d >= DAYS) {
        setRunDay(-1);
        if (!corruptNow) setStatus("ok");
        else if (trippingCheck && checksNow[trippingCheck]) setStatus("stale");
        else setStatus("breach");
        return;
      }
      setTimeout(step, 90);
    };
    step();
  };

  const needle = trustPct;
  const needleColor = trustPct >= 80 ? "var(--theme-green)" : trustPct >= 50 ? "#F7B928" : "var(--theme-red)";

  return (
    <Panel
      eyebrow="live simulator · data-quality gates"
      title="Trust Meter"
      meta={`${Object.values(checks).filter(Boolean).length}/4 checks · ${corrupt ? "corruption: " + CORRUPTIONS[corrupt].label.split(" (")[0] : "clean"}`}
      caption="Each check costs nothing to add and catches a whole class of bug. The ExpectationSuite pattern runs them post-write; downstream ExternalTaskSensor waits on the signal table, not the data table."
    >
      <div className="tm-layout">
        <div className="tm-checks">
          <div className="tm-title">Active checks</div>
          {CHECKS.map((c) => (
            <label key={c.id} className={`tm-check ${checks[c.id] ? "on" : ""}`}>
              <input type="checkbox" checked={checks[c.id]} onChange={() => toggle(c.id)} />
              <div>
                <div className="n">{c.name}</div>
                <div className="d">{c.desc}</div>
              </div>
              <div className="w">+{c.weight}</div>
            </label>
          ))}
        </div>
        <div className="tm-meter">
          <div className="tm-score-lab">trust score</div>
          <div className="tm-score-big" style={{ color: needleColor }}>
            {needle}
            <span className="tm-score-max">/100</span>
          </div>
          <div className={`tm-verdict ${trustPct >= 80 ? "ok" : trustPct >= 50 ? "warn" : "bad"}`}>
            {trustPct >= 80 ? "trusted" : trustPct >= 50 ? "at risk" : "untrusted"}
          </div>
          <div className="tm-bar">
            <div className="tm-bar-track">
              <div className="tm-bar-zone bad" style={{ left: "0%", width: "50%" }} />
              <div className="tm-bar-zone warn" style={{ left: "50%", width: "30%" }} />
              <div className="tm-bar-zone ok" style={{ left: "80%", width: "20%" }} />
              <div className="tm-bar-needle" style={{ left: `${needle}%`, background: needleColor }} />
            </div>
            <div className="tm-bar-ticks">
              <span>0</span>
              <span style={{ left: "50%" }}>50</span>
              <span style={{ left: "80%" }}>80</span>
              <span style={{ right: 0 }}>100</span>
            </div>
          </div>
          <div className="tm-breakdown">
            {CHECKS.map((c) => (
              <div key={c.id} className={`tm-bd ${checks[c.id] ? "on" : "off"}`}>
                <span className="tm-bd-dot" />
                <span className="tm-bd-n">{c.name}</span>
                <span className="tm-bd-w">{checks[c.id] ? `+${c.weight}` : "-"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tm-impact">
        <div className="tm-impact-head">
          <div className="tm-impact-eyebrow">downstream dashboard · what the analyst sees</div>
          <div className="tm-impact-title">Exec Dashboard · DAU · US · 7-day avg</div>
        </div>
        <div className="tm-impact-grid">
          <div className="tm-impact-cell tm-impact-expected">
            <div className="lab">Expected (truth)</div>
            <div className="big">
              142.3<span>M</span>
            </div>
            <div className="sub">if pipeline ran clean</div>
          </div>
          <div className={`tm-impact-arrow is-${dashState}`}>{dashState === "ok" ? "→" : dashState === "stale" ? "⏸" : "⚠"}</div>
          <div className={`tm-impact-cell tm-impact-actual is-${dashState}`}>
            <div className="lab">Actual (what shipped)</div>
            <div className="big">
              {dashNumber.toFixed(1)}
              <span>M</span>
            </div>
            <div className="sub">
              {dashState === "wrong" &&
                (() => {
                  const pct = Math.abs(((dashNumber - 142.3) / 142.3) * 100).toFixed(0);
                  const diff = Math.round(Math.abs(dashNumber - 142.3));
                  const dir = dashNumber > 142.3 ? `${diff}M extra` : `${diff}M missing`;
                  return `wrong by ${pct}% · ${dir}`;
                })()}
              {dashState === "stale" && "3-day-old data · signal blocked upstream"}
              {dashState === "ok" && status === "ok" && "matches expected · all checks passed"}
              {dashState === "ok" && status !== "ok" && "idle · run the simulation to see impact"}
            </div>
          </div>
        </div>
        {dashState === "wrong" && <div className="tm-impact-banner err">⚠ Anomaly detected (T+3d) · wrong number already cited in exec review</div>}
        {dashState === "stale" && <div className="tm-impact-banner warn">⏸ Signal table never landed · downstream consumers wait or read stale</div>}
        {dashState === "ok" && status === "ok" && <div className="tm-impact-banner ok">✓ All 30 days clean · SLA met · signal landed on-time</div>}
        {oncallTicket && (
          <div className="tm-ticket">
            <div className="ti-k">ONCALL AUTO-CREATED</div>
            <div className="ti-id">#{oncallTicket.id}</div>
            <div className="ti-d">
              day {oncallTicket.day} · {oncallTicket.reason} · routed to de_oncall
            </div>
          </div>
        )}
      </div>

      <div className="tm-timeline">
        <div className="tm-timeline-lab">30-day run history</div>
        <div className="tm-days">
          {Array.from({ length: DAYS }, (_, i) => {
            const r = results[i];
            const isRunning = runDay === i;
            const isCorrupt = !!corrupt && i === CORRUPT_DAY;
            let cls = "tm-day";
            if (isRunning) cls += " running";
            else if (r) {
              if (r.ok) cls += " ok";
              else if (r.caught) cls += " caught";
              else cls += " fail";
            } else cls += " pending";
            if (isCorrupt) cls += " corrupt-mark";
            return (
              <div
                key={i}
                className={cls}
                title={`Day ${i + 1}${r ? (r.ok ? " · pass" : r.caught ? ` · CAUGHT (${r.trippedBy})` : ` · BREACH (${r.trippedBy})`) : ""}${isCorrupt ? " · corruption armed here" : ""}`}
              >
                {isCorrupt && <span className="mark">!</span>}
              </div>
            );
          })}
        </div>
        <div className="tm-timeline-legend">
          <span>
            <i className="sw pending" /> pending
          </span>
          <span>
            <i className="sw ok" /> pass
          </span>
          <span>
            <i className="sw caught" /> caught
          </span>
          <span>
            <i className="sw fail" /> breach
          </span>
          <span>
            <i className="sw corrupt-mark" /> corruption at day {CORRUPT_DAY + 1}
          </span>
        </div>
      </div>

      <div className="ctl-row">
        <div className="tm-corr-picker">
          <span className="tm-corr-lab">Inject at day {CORRUPT_DAY + 1}:</span>
          <button className={`tm-corr ${!corrupt ? "on" : ""}`} onClick={() => setCorrupt(null)}>
            none
          </button>
          {(Object.entries(CORRUPTIONS) as [CorruptionId, (typeof CORRUPTIONS)[CorruptionId]][]).map(([id, c]) => (
            <button
              key={id}
              className={`tm-corr ${corrupt === id ? "on" : ""}`}
              onClick={() => setCorrupt(id)}
              title={`caught only by "${CHECKS.find((x) => x.id === c.tripsBy)?.name}"`}
            >
              {c.label.split(" (")[0]}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={run}>
          ▶ Run 30 days
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
        <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>
          {status === "breach" && <span style={{ color: "var(--theme-red)" }}>✕ Corrupt data shipped: gate was off</span>}
          {status === "stale" && <span style={{ color: "#8B5C00" }}>✓ Gate held: signal never landed, oncall notified</span>}
          {status === "ok" && <span style={{ color: "var(--theme-green)" }}>✓ Clean run · 30/30</span>}
        </div>
      </div>
    </Panel>
  );
}

export default TrustMeterSim;
