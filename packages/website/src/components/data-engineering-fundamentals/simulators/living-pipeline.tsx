"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// ─── LivingPipeline (plan 011 stage 8) ───────────────────────────────
// Ported from `src/chapters/Ch9_Capstone.js`: real user rows stream through
// six sabotage-able gates (merge/write/watermark/dq/govern/semantic).
// DOM-diffed via refs for the row layer (matching source's own direct-DOM
// paintRows()), same pattern as ConveyorSim.

interface StageDef {
  readonly k: BreakKey;
  readonly n: string;
  readonly ref: string;
  readonly title: string;
  readonly sub: string;
  readonly color: string;
  readonly ink: string;
}

type BreakKey = "merge" | "write" | "watermark" | "dq" | "govern" | "semantic";

const STAGES: readonly StageDef[] = [
  { k: "merge", n: "01", ref: "Ch03 · Store", title: "Cumulative merge", sub: "FULL OUTER JOIN yesterday ⊕ today", color: "#7C5CFF", ink: "#6E4BFF" },
  { k: "write", n: "02", ref: "Ch05 · Orchestrate", title: "Idempotent write", sub: "INSERT OVERWRITE partition ds", color: "#2D7DFF", ink: "#0060FD" },
  { k: "watermark", n: "03", ref: "Ch02 · Streaming", title: "Watermark + dedup", sub: "ROW_NUMBER · event_ts ≥ ds", color: "#22D3EE", ink: "#0B798A" },
  { k: "dq", n: "04", ref: "Ch06 · Quality", title: "Data-quality gate", sub: "row-count · freshness · unique", color: "#31A24C", ink: "#267E3B" },
  { k: "govern", n: "05", ref: "Ch09 · Govern", title: "Access Gateway deploy", sub: "PII actors · data_classification", color: "#B8770A", ink: "#986308" },
  { k: "semantic", n: "06", ref: "Ch08 · Serve", title: "Semantic binding", sub: "metric → physical column", color: "#E41E3F", ink: "#D81A39" },
];

type UserKind = "paid" | "churned" | "new" | "late" | "dup";

interface PoolUser {
  readonly id: string;
  readonly kind: UserKind;
  readonly user_id: string;
  readonly owner: string;
  readonly late: boolean;
  readonly dup: boolean;
}

const USER_POOL: readonly PoolUser[] = [
  { id: "a1", kind: "paid", user_id: "u-A41", owner: "alice@example.com", late: false, dup: false },
  { id: "a2", kind: "paid", user_id: "u-B12", owner: "bob@example.com", late: false, dup: false },
  { id: "a3", kind: "paid", user_id: "u-C77", owner: "carol@example.com", late: false, dup: false },
  { id: "a4", kind: "paid", user_id: "u-D02", owner: "dan@example.com", late: false, dup: false },
  { id: "a5", kind: "paid", user_id: "u-E19", owner: "eve@example.com", late: false, dup: false },
  { id: "a6", kind: "paid", user_id: "u-F88", owner: "frank@example.com", late: false, dup: false },
  { id: "a7", kind: "paid", user_id: "u-G33", owner: "grace@example.com", late: false, dup: false },
  { id: "a8", kind: "paid", user_id: "u-H21", owner: "henry@example.com", late: false, dup: false },
  { id: "a9", kind: "paid", user_id: "u-J40", owner: "iris@example.com", late: false, dup: false },
  { id: "r1", kind: "churned", user_id: "u-xX01", owner: "inactive@example.com", late: false, dup: false },
  { id: "r2", kind: "churned", user_id: "u-xX02", owner: "inactive@example.com", late: false, dup: false },
  { id: "n1", kind: "new", user_id: "u-nN01", owner: "jack@example.com", late: false, dup: false },
  { id: "n2", kind: "new", user_id: "u-nN02", owner: "kate@example.com", late: false, dup: false },
  { id: "l1", kind: "late", user_id: "u-nL77", owner: "leo@example.com", late: true, dup: false },
  { id: "l2", kind: "late", user_id: "u-nL78", owner: "mia@example.com", late: true, dup: false },
  { id: "d1", kind: "dup", user_id: "u-nA41", owner: "alice@example.com", late: false, dup: true },
];

const LANE_SECONDS = 9;
const SPAWN_EVERY = 0.55;
const GATE_X: Record<BreakKey | "source" | "analyst", number> = {
  source: 2,
  merge: 16,
  write: 30,
  watermark: 44,
  dq: 58,
  govern: 72,
  semantic: 86,
  analyst: 98,
};

interface TutorialStep {
  readonly stage: BreakKey | null;
  readonly title: string;
  readonly caption: string;
}

const TUTORIAL: readonly TutorialStep[] = [
  { stage: null, title: "Pipeline running clean", caption: "All six contracts hold. Rows flow source → analyst, every one arrives." },
  { stage: "merge", title: "Break the MERGE contract", caption: "LEFT JOIN drops yesterday-only users. Watch the churned (×) rows vanish at gate 1." },
  { stage: "write", title: "Break the WRITE contract", caption: "INSERT (non-idempotent) doubles rows on retry. Phantom duplicates appear after gate 2." },
  { stage: "watermark", title: "Break the WATERMARK contract", caption: "Late rows pass through silently instead of spilling to the side table: bad data lands." },
  { stage: "dq", title: "Break the DQ contract", caption: "Quality checks miss the bad batch. Rows halt; signal never fires; downstream blocked." },
  { stage: "govern", title: "Break the GOVERN contract", caption: "Access Gateway rejects the deploy. Rows blocked at gate 5: nothing reaches the analyst." },
  { stage: "semantic", title: "Break the SEMANTIC contract", caption: "Metric layer broken. Rows arrive but the downstream query references an unbound column: wrong answer." },
  { stage: null, title: "All contracts restored", caption: "Pipeline back to clean. The lesson: every gate is load-bearing." },
];

const TUTORIAL_STEP_MS = 6500;
const EMPTY_BRK: Record<BreakKey, boolean> = { merge: false, write: false, watermark: false, dq: false, govern: false, semantic: false };

const BREAKAGE_COPY: Record<BreakKey, { good: string; bad: string; code: string }> = {
  merge: { good: "FULL OUTER keeps churned and new users", bad: "LEFT JOIN silently drops every churned user", code: "FULL OUTER JOIN → LEFT JOIN" },
  write: { good: "INSERT OVERWRITE · retries are a no-op", bad: "INSERT INTO · retries double-count rows", code: "INSERT OVERWRITE → INSERT INTO" },
  watermark: { good: "late rows spill to __late table · dedup by event_id", bad: "late & duplicate rows slip through silently", code: "WHERE event_ts ≥ ds → (removed)" },
  dq: { good: "row-count · freshness · unique: then signal", bad: "checks skipped · signal never lands · downstream blocks", code: 'on_failure="block_downstream"' },
  govern: { good: "PII actors declared · Access Gateway resolves", bad: "unannotated PII · Access Gateway refuses deploy", code: "actors: [PII_Person]" },
  semantic: { good: "metric bound to physical column · one definition", bad: "no binding · downstream queries hit an unbound column", code: "metrics: [conversion_7d]" },
};

type RowState = "flowing" | "spilled" | "dropped" | "govblocked" | "dqhold" | "arrived";

interface FlowRow {
  id: number;
  key: string;
  user: PoolUser;
  t: number;
  lane: number;
  state: RowState;
  dropStage?: "merge" | "dedup";
  dropT?: number;
  spilled?: { born: number };
  dqHeldAt?: number;
  govAt?: number;
  arrivedAt?: number;
  halluc?: boolean;
  phantom?: boolean;
  silentlyBad?: boolean;
}

interface Stats {
  srcScanned: number;
  merged: number;
  dropped: number;
  written: number;
  dup: number;
  lateSpilled: number;
  onTime: number;
  dqFails: number;
  dqPass: number;
  govPass: number;
  govBlocked: number;
  semHit: number;
  semMiss: number;
  analystAnswered: number;
}

const EMPTY_STATS: Stats = {
  srcScanned: 0,
  merged: 0,
  dropped: 0,
  written: 0,
  dup: 0,
  lateSpilled: 0,
  onTime: 0,
  dqFails: 0,
  dqPass: 0,
  govPass: 0,
  govBlocked: 0,
  semHit: 0,
  semMiss: 0,
  analystAnswered: 0,
};

function tToX(t: number) {
  return GATE_X.source + t * (GATE_X.analyst - GATE_X.source);
}

export function LivingPipeline() {
  const [brk, setBrk] = useState<Record<BreakKey, boolean>>(EMPTY_BRK);
  const [running, setRunning] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(-1);
  const tutorial = tutorialStep >= 0 ? TUTORIAL[tutorialStep] : null;
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [signalPulse, setSignalPulse] = useState(0);

  const rows = useRef<FlowRow[]>([]);
  const idSeq = useRef(0);
  const tSim = useRef(0);
  const spawnBank = useRef(0);
  const rafRef = useRef<number | null>(null);
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const rowLayerRef = useRef<HTMLDivElement>(null);

  const toggleBreak = (k: BreakKey) => setBrk((b) => ({ ...b, [k]: !b[k] }));
  const resetAll = () => setBrk({ ...EMPTY_BRK });

  const startTutorial = () => {
    setBrk({ ...EMPTY_BRK });
    setRunning(true);
    setTutorialStep(0);
  };
  const stopTutorial = () => {
    setTutorialStep(-1);
    setBrk({ ...EMPTY_BRK });
  };

  const reset = () => {
    rows.current = [];
    tSim.current = 0;
    spawnBank.current = 0;
    idSeq.current = 0;
    setStats(EMPTY_STATS);
    if (rowLayerRef.current) rowLayerRef.current.innerHTML = "";
  };

  function paintRows() {
    const layer = rowLayerRef.current;
    if (!layer) return;
    const list = rows.current;
    const need = list.length;
    const pool = layer.children;
    while (pool.length < need) {
      const el = document.createElement("div");
      el.className = "lp-row";
      const inner = document.createElement("span");
      el.appendChild(inner);
      layer.appendChild(el);
    }
    while (pool.length > need) layer.removeChild(pool[pool.length - 1]);
    const LANE_TOP = 32;
    const LANE_H = 28;
    list.forEach((r, i) => {
      const el = pool[i] as HTMLElement;
      let x: number;
      let y: number;
      if (r.state === "spilled") {
        x = GATE_X.watermark;
        const age = tSim.current - (r.spilled?.born ?? 0);
        y = LANE_TOP + LANE_H * r.lane + Math.min(1, age * 1.4) * 40;
      } else if (r.state === "dropped") {
        x = r.dropStage === "merge" ? GATE_X.merge : GATE_X.watermark;
        y = LANE_TOP + LANE_H * r.lane;
        const angle = ((r.id * 47) % 8) * 45;
        el.style.setProperty("--sx", `${(Math.cos((angle * Math.PI) / 180) * 9).toFixed(1)}%`);
        el.style.setProperty("--sy", `${(Math.sin((angle * Math.PI) / 180) * 9 - 4).toFixed(1)}%`);
      } else if (r.state === "govblocked") {
        x = GATE_X.govern;
        y = LANE_TOP + LANE_H * r.lane;
      } else if (r.state === "dqhold") {
        x = GATE_X.dq - 1.5;
        y = LANE_TOP + LANE_H * r.lane;
      } else {
        x = tToX(r.t);
        y = LANE_TOP + LANE_H * r.lane;
      }
      el.style.left = x.toFixed(2) + "%";
      el.style.top = y.toFixed(2) + "%";
      let cls = "lp-row";
      cls += " lp-k-" + r.user.kind;
      if (r.state === "dropped") cls += " lp-drop";
      if (r.state === "spilled") cls += " lp-spill";
      if (r.state === "govblocked") cls += " lp-govblock";
      if (r.state === "dqhold") cls += " lp-dqhold";
      if (r.state === "arrived") cls += " lp-arrived";
      if (r.halluc) cls += " lp-halluc";
      if (r.phantom) cls += " lp-phantom";
      if (r.silentlyBad) cls += " lp-silentbad";
      el.className = cls;
      const label = r.user.user_id;
      if (el.firstChild && (el.firstChild as HTMLElement).textContent !== label) {
        (el.firstChild as HTMLElement).textContent = label;
      }
    });
  }

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let statBank = 0;
    const tick = (now: number) => {
      const dtMs = Math.min(64, now - last);
      last = now;
      const dt = dtMs / 1000;
      tSim.current += dt;
      spawnBank.current += dt;
      while (spawnBank.current >= SPAWN_EVERY) {
        spawnBank.current -= SPAWN_EVERY;
        const user = USER_POOL[Math.floor(Math.random() * USER_POOL.length)];
        rows.current.push({
          id: ++idSeq.current,
          key: `${user.id}-${idSeq.current}`,
          user,
          t: 0,
          lane: 0.35 + Math.random() * 0.35,
          state: "flowing",
        });
      }

      const newStats = { ...statsRef.current };
      let statsDirty = false;
      rows.current.forEach((r) => {
        if (r.state !== "flowing") return;
        const prevT = r.t;
        r.t = Math.min(1.01, r.t + (dt * 1) / LANE_SECONDS);
        const prevX = tToX(prevT);
        const x = tToX(r.t);

        if (prevX < GATE_X.source && x >= GATE_X.source) {
          newStats.srcScanned++;
          statsDirty = true;
        }
        if (prevX < GATE_X.merge && x >= GATE_X.merge) {
          if (brk.merge && r.user.kind === "churned") {
            r.state = "dropped";
            r.dropStage = "merge";
            r.dropT = tSim.current;
            newStats.dropped++;
            statsDirty = true;
            return;
          }
          newStats.merged++;
          statsDirty = true;
        }
        if (prevX < GATE_X.write && x >= GATE_X.write) {
          newStats.written++;
          if (brk.write && Math.random() < 0.32) {
            rows.current.push({
              id: ++idSeq.current,
              key: `phantom-${idSeq.current}`,
              user: r.user,
              t: r.t - 0.015,
              lane: r.lane + 0.08,
              state: "flowing",
              phantom: true,
            });
            newStats.dup++;
          }
          statsDirty = true;
        }
        if (prevX < GATE_X.watermark && x >= GATE_X.watermark) {
          if (r.user.late && !brk.watermark) {
            r.state = "spilled";
            r.spilled = { born: tSim.current };
            newStats.lateSpilled++;
            statsDirty = true;
            return;
          }
          if (r.user.dup && !brk.watermark) {
            r.state = "dropped";
            r.dropStage = "dedup";
            r.dropT = tSim.current;
            newStats.dup++;
            statsDirty = true;
            return;
          }
          if (brk.watermark && (r.user.late || r.user.dup)) {
            r.silentlyBad = true;
          }
          newStats.onTime++;
          statsDirty = true;
        }
        if (prevX < GATE_X.dq && x >= GATE_X.dq) {
          if (brk.dq) {
            r.state = "dqhold";
            r.dqHeldAt = tSim.current;
            newStats.dqFails++;
            statsDirty = true;
            return;
          }
          newStats.dqPass++;
          statsDirty = true;
        }
        if (prevX < GATE_X.govern && x >= GATE_X.govern) {
          if (brk.govern) {
            r.state = "govblocked";
            r.govAt = tSim.current;
            newStats.govBlocked++;
            statsDirty = true;
            return;
          }
          newStats.govPass++;
          statsDirty = true;
        }
        if (prevX < GATE_X.semantic && x >= GATE_X.semantic) {
          if (brk.semantic) {
            r.halluc = true;
            newStats.semMiss++;
          } else {
            newStats.semHit++;
          }
          statsDirty = true;
        }
        if (r.t >= 1 && r.state === "flowing") {
          r.state = "arrived";
          r.arrivedAt = tSim.current;
          if (!r.halluc && !r.phantom) newStats.analystAnswered++;
          statsDirty = true;
        }
      });

      rows.current = rows.current.filter((r) => {
        if (r.state === "arrived") return tSim.current - (r.arrivedAt ?? 0) < 0.8;
        if (r.state === "dropped") return tSim.current - (r.dropT ?? 0) < 0.6;
        if (r.state === "govblocked") return tSim.current - (r.govAt ?? 0) < 1.1;
        if (r.state === "dqhold") return tSim.current - (r.dqHeldAt ?? 0) < 1.4;
        if (r.state === "spilled") return tSim.current - (r.spilled?.born ?? 0) < 1.5;
        return true;
      });

      paintRows();
      statBank += dt;
      if (statBank > 0.12 && statsDirty) {
        statBank = 0;
        setStats(newStats);
        statsRef.current = newStats;
      } else if (statsDirty) {
        statsRef.current = newStats;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
     
  }, [running, brk.merge, brk.write, brk.watermark, brk.dq, brk.govern, brk.semantic]);

  useEffect(() => {
    if (tutorialStep < 0) return;
    const step = TUTORIAL[tutorialStep];
    setBrk(step.stage ? { ...EMPTY_BRK, [step.stage]: true } : { ...EMPTY_BRK });
    const timer = setTimeout(() => {
      if (tutorialStep + 1 < TUTORIAL.length) {
        setTutorialStep(tutorialStep + 1);
      } else {
        setTutorialStep(-1);
        setBrk({ ...EMPTY_BRK });
      }
    }, TUTORIAL_STEP_MS);
    return () => clearTimeout(timer);
  }, [tutorialStep]);

  const pipelineGreen = !brk.merge && !brk.write && !brk.watermark && !brk.dq && !brk.govern && !brk.semantic;

  useEffect(() => {
    if (!pipelineGreen) return;
    const id = setInterval(() => setSignalPulse((p) => p + 1), 3000);
    return () => clearInterval(id);
  }, [pipelineGreen]);

  const consumerView = (() => {
    if (brk.semantic) return { kind: "err" as const, v: "ERROR", caption: "metric unbound · downstream query references a column that no longer exists" };
    if (brk.dq) return { kind: "wait" as const, v: "-", caption: "DQ failed · signal never fired · dashboard frozen on yesterday's number" };
    if (brk.govern) return { kind: "wait" as const, v: "-", caption: "Access Gateway blocked the deploy · no fresh data reached the consumer" };
    if (brk.merge) return { kind: "bad" as const, v: "97.8%", caption: "churned users dropped · denominator undercount · ratio inflated" };
    if (brk.write) return { kind: "bad" as const, v: "88.1%", caption: "retry double-counted rows · denominator inflated · ratio depressed" };
    if (brk.watermark) return { kind: "bad" as const, v: "91.4%", caption: "late + duplicate rows slipped past the gate · drift in both directions" };
    return { kind: "good" as const, v: "94.2%", caption: "source: analytics.conversion_7d · 23 min ago · governed · traceable" };
  })();

  return (
    <div className="lp-wrap">
      <div className="lp-stage">
        {tutorial && (
          <div className="lp-tutorial-banner" role="status" aria-live="polite">
            <div className="lp-tutorial-step">
              <span className="lp-tutorial-step-n">{tutorialStep + 1}</span>
              <span className="lp-tutorial-step-of">/ {TUTORIAL.length}</span>
            </div>
            <div className="lp-tutorial-text">
              <div className="lp-tutorial-title">{tutorial.title}</div>
              <div className="lp-tutorial-caption">{tutorial.caption}</div>
            </div>
            <button className="lp-tutorial-exit" onClick={stopTutorial} aria-label="Exit tutorial">
              ✕ exit
            </button>
            <div className="lp-tutorial-progress" aria-hidden="true">
              <div className="lp-tutorial-progress-fill" key={tutorialStep} />
            </div>
          </div>
        )}
        <svg className="lp-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="lp-grid" x="0" y="0" width="4" height="6" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 6" fill="none" stroke="rgba(11,18,31,0.05)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#lp-grid)" />
          <rect x="1" y="32" width="98" height="28" rx="0.8" fill="rgba(45,125,255,0.04)" />
          <line x1="1" y1="46" x2="99" y2="46" stroke="rgba(11,18,31,0.08)" strokeWidth="0.3" strokeDasharray="0.6 0.8" vectorEffect="non-scaling-stroke" />
          <rect
            x={GATE_X.watermark - 3}
            y="78"
            width="22"
            height="14"
            rx="0.8"
            fill="rgba(184,119,10,0.06)"
            stroke="rgba(184,119,10,0.35)"
            strokeWidth="0.25"
            strokeDasharray="1 0.8"
            vectorEffect="non-scaling-stroke"
          />
          {STAGES.map((s) => (
            <line
              key={s.k}
              x1={GATE_X[s.k]}
              y1="28"
              x2={GATE_X[s.k]}
              y2="64"
              stroke={brk[s.k] ? "#E41E3F" : s.color}
              strokeWidth={brk[s.k] ? "1.5" : "1"}
              strokeDasharray={brk[s.k] ? "2 1" : "0"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line x1={GATE_X.source} y1="26" x2={GATE_X.source} y2="66" stroke="var(--fg-1)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <line x1={GATE_X.analyst} y1="26" x2={GATE_X.analyst} y2="66" stroke="var(--fg-1)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="lp-labels">
          <div className="lp-label lp-label-src" style={{ left: `${GATE_X.source}%` }}>
            <div className="lp-l-eyebrow">raw source</div>
            <div className="lp-l-title">
              events_today
              <br />+ users_yesterday
            </div>
          </div>
          {STAGES.map((s) => (
            <div key={s.k} className={`lp-label lp-label-gate ${brk[s.k] ? "broken" : ""}`} style={{ left: `${GATE_X[s.k]}%`, "--c": s.color, "--ink": s.ink } as CSSProperties}>
              <div className="lp-l-n">{s.n}</div>
              <div className="lp-l-title">{s.title}</div>
              <div className="lp-l-ref">{s.ref}</div>
              {brk[s.k] && <div className="lp-l-broken">✕ BROKEN</div>}
            </div>
          ))}
          <div className="lp-label lp-label-analyst" style={{ left: `${GATE_X.analyst}%` }}>
            <div className="lp-l-eyebrow">analyst</div>
            <div className="lp-l-title">Jordan · Analyst</div>
          </div>
        </div>

        <div className="lp-side-label" style={{ left: `${GATE_X.watermark - 2}%` }}>
          <div>fct_users_late</div>
          <div className="sub">late arrivals spill here: never dropped</div>
        </div>

        <div className="lp-dataset">
          <div className="lp-d-eyebrow">dataset</div>
          <div className="lp-d-name">
            <code>dim_users</code>
          </div>
          <div className="lp-d-sub">1,421,882 users · trial-to-paid journey · refreshed daily</div>
        </div>

        <div className="lp-rows" ref={rowLayerRef} />

        <div className="lp-gate-stats">
          <div className="lp-gs" style={{ left: `${GATE_X.merge}%` }}>
            <span className="n">{stats.merged.toLocaleString()}</span>
            <span className="lab">merged</span>
            {brk.merge && <span className="bad">−{stats.dropped} churned dropped</span>}
          </div>
          <div className="lp-gs" style={{ left: `${GATE_X.write}%` }}>
            <span className="n">{stats.written.toLocaleString()}</span>
            <span className="lab">written</span>
            {brk.write && stats.dup > 0 && <span className="bad">+{stats.dup} duped by retry</span>}
          </div>
          <div className="lp-gs" style={{ left: `${GATE_X.watermark}%` }}>
            <span className="n">{stats.onTime.toLocaleString()}</span>
            <span className="lab">on-time</span>
            <span className="sub">
              {stats.lateSpilled} spilled{brk.watermark ? ": BYPASSED" : ""}
            </span>
          </div>
          <div className="lp-gs" style={{ left: `${GATE_X.dq}%` }}>
            <span className="n">{stats.dqPass.toLocaleString()}</span>
            <span className="lab">dq pass</span>
            {brk.dq && <span className="bad">signal not fired</span>}
          </div>
          <div className="lp-gs" style={{ left: `${GATE_X.govern}%` }}>
            <span className="n">{stats.govPass.toLocaleString()}</span>
            <span className="lab">deployed</span>
            {brk.govern && <span className="bad">{stats.govBlocked} blocked</span>}
          </div>
          <div className="lp-gs" style={{ left: `${GATE_X.semantic}%` }}>
            <span className="n">{stats.semHit.toLocaleString()}</span>
            <span className="lab">bound</span>
            {brk.semantic && <span className="bad">no metric</span>}
          </div>
        </div>
      </div>

      <div className="lp-console">
        <div className="lp-console-head">
          <div>
            <div className="lp-console-eyebrow">sabotage console · break one contract, watch the blast radius</div>
            <div className="lp-console-title">Six contracts. Every one is load-bearing.</div>
          </div>
          <div className="lp-console-actions">
            <button className="btn btn-primary" onClick={tutorial ? stopTutorial : startTutorial}>
              {tutorial ? "✕ stop tutorial" : "▶ guided tutorial"}
            </button>
            <button className="btn" onClick={() => setRunning((r) => !r)} disabled={!!tutorial}>
              {running ? "⏸ pause" : "▶ resume"}
            </button>
            <button className="btn" onClick={reset} disabled={!!tutorial}>
              ↻ reset counters
            </button>
            <button className="btn" onClick={resetAll} disabled={pipelineGreen || !!tutorial}>
              fix all
            </button>
          </div>
        </div>
        <div className="lp-break-grid">
          {STAGES.map((s) => {
            const contracts = BREAKAGE_COPY[s.k];
            return (
              <button
                key={s.k}
                className={`lp-break ${brk[s.k] ? "on" : ""} ${tutorial ? "is-locked" : ""}`}
                style={{ "--c": s.color, "--ink": s.ink } as CSSProperties}
                disabled={!!tutorial}
                onClick={() => toggleBreak(s.k)}
              >
                <div className="lp-break-head">
                  <span className="n">{s.n}</span>
                  <span className="title">{s.title}</span>
                  <span className={`pill ${brk[s.k] ? "on" : ""}`}>{brk[s.k] ? "broken" : "healthy"}</span>
                </div>
                <div className="lp-break-good">
                  <b>if healthy:</b> {contracts.good}
                </div>
                <div className="lp-break-bad">
                  <b>if broken:</b> {contracts.bad}
                </div>
                <div className="lp-break-code">
                  <code>{contracts.code}</code>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lp-downstream">
        <div className="lp-signal">
          <div className="lp-signal-head">
            <span className="l-k">signal table</span>
            <span className="l-v">
              <code>users_signal</code>
            </span>
          </div>
          <div className={`lp-signal-body ${pipelineGreen ? "on" : "off"}`}>
            {pipelineGreen ? (
              <>
                <div className="lp-pulse" key={signalPulse}>
                  <span className="d1" />
                  <span className="d2" />
                  <span className="d3" />
                </div>
                <div>
                  <div className="lp-sig-lab">signal landed · downstream unblocked</div>
                  <div className="lp-sig-sub">every consumer wakes up now</div>
                </div>
              </>
            ) : (
              <>
                <div className="lp-pulse-off">∅</div>
                <div>
                  <div className="lp-sig-lab lp-sig-off">signal never fired</div>
                  <div className="lp-sig-sub">
                    {brk.dq
                      ? "DQ failed → signal blocked."
                      : brk.govern
                        ? "Access Gateway blocked deploy → no signal."
                        : brk.semantic
                          ? "signal landed, but metric layer is broken."
                          : brk.merge
                            ? "signal landed, but dim is missing churned users."
                            : brk.write
                              ? "signal landed, but retry double-counted."
                              : brk.watermark
                                ? "signal landed, but late rows bypassed the gate."
                                : "waiting…"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="lp-consumer">
          <div className="lp-consumer-head">
            <div>
              <div className="lp-consumer-eyebrow">downstream consumer · what Jordan sees</div>
              <div className="lp-consumer-title">Conversion dashboard · last 7 days</div>
            </div>
            <code className="lp-consumer-src">analytics.conversion_7d</code>
          </div>
          <div className={`lp-consumer-body lp-consumer-${consumerView.kind}`}>
            <div className="lp-consumer-v">{consumerView.v}</div>
            <div className="lp-consumer-cap">
              {consumerView.kind === "bad" && <span className="lp-consumer-warn">⚠ wrong by silent drift · </span>}
              {consumerView.kind === "wait" && <span className="lp-consumer-warn">⏸ stale · </span>}
              {consumerView.kind === "err" && <span className="lp-consumer-warn">✕ failed · </span>}
              {consumerView.caption}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LivingPipeline;
