"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── SqlDecoderStage ──────────────────────────────
// Ported from `src/chapters/Ch0_StackSims.js`: SQL → AST → logical →
// physical → stages, with a worker-skew/salting-fix toggle for the hash-join
// preset.

interface QueryStage {
  readonly k: string;
  readonly ops: readonly string[];
  readonly exch: string | null;
  readonly color: string;
}

interface Query {
  readonly id: string;
  readonly label: string;
  readonly sql: string;
  readonly logical: readonly string[];
  readonly physical: readonly string[];
  readonly stages: readonly QueryStage[];
}

const QUERIES: readonly Query[] = [
  {
    id: "scan",
    label: "Simple scan",
    sql: "SELECT id, revenue\nFROM sales\nWHERE ds = '2024-01-15'\n  AND region = 'EU';",
    logical: ["Scan · sales", "Filter · ds=2024-01-15 ∧ region='EU'", "Project · id, revenue"],
    physical: ["TableScan(sales)", "Filter (pushed to scan)", "Project"],
    stages: [{ k: "S0", ops: ["Scan", "Filter", "Project"], exch: null, color: "b1" }],
  },
  {
    id: "hash",
    label: "Two-table hash join",
    sql: "SELECT u.country, SUM(s.revenue)\nFROM sales s\nJOIN users u ON s.user_id = u.user_id\nWHERE s.ds = '2024-01-15'\nGROUP BY u.country;",
    logical: ["Scan · sales", "Scan · users", "HashJoin · user_id", "Aggregate · GROUP BY country"],
    physical: [
      "TableScan(sales)",
      "TableScan(users)",
      "ExchangeHashPartitioned(user_id)",
      "HashJoin",
      "PartialAgg",
      "ExchangeHashPartitioned(country)",
      "FinalAgg",
    ],
    stages: [
      { k: "S0", ops: ["Scan sales"], exch: "→ hash(user_id)", color: "b1" },
      { k: "S1", ops: ["Scan users"], exch: "→ hash(user_id)", color: "b1" },
      { k: "S2", ops: ["HashJoin", "PartialAgg"], exch: "→ hash(country)", color: "b2" },
      { k: "S3", ops: ["FinalAgg"], exch: null, color: "b3" },
    ],
  },
  {
    id: "bcast",
    label: "Dimensional broadcast",
    sql: "SELECT s.*, c.country_name\nFROM sales s\nJOIN dim_country c ON s.country_id = c.id\nWHERE s.ds = '2024-01-15';",
    logical: ["Scan · sales", "Scan · dim_country", "BroadcastJoin · country_id", "Project"],
    physical: ["TableScan(sales)", "TableScan(dim_country)", "ExchangeBroadcast(dim_country)", "BroadcastJoin", "Project"],
    stages: [{ k: "S0", ops: ["Scan sales", "BroadcastJoin", "Project"], exch: null, color: "b1" }],
  },
];

const DECODE_PHASES = [
  { k: "ast", t: "AST", sub: "parser · tokens → tree" },
  { k: "logical", t: "Logical plan", sub: "relational algebra · what to compute" },
  { k: "physical", t: "Physical plan", sub: "distributed · exchange types · worker count" },
  { k: "stages", t: "Stages", sub: "grouped operators · runtime DAG" },
] as const;

const QUERY_LABELS_DE: Readonly<Record<string, string>> = {
  scan: "Einfacher Scan",
  hash: "Hash-Join über zwei Tabellen",
  bcast: "Broadcast einer Dimensionstabelle",
};

const DECODE_PHASES_DE = [
  { k: "ast", t: "AST", sub: "Parser · Tokens → Baum" },
  { k: "logical", t: "Logischer Plan", sub: "relationale Algebra · was berechnet wird" },
  { k: "physical", t: "Physischer Plan", sub: "verteilt · Exchange-Typen · Worker-Anzahl" },
  { k: "stages", t: "Stages", sub: "gruppierte Operatoren · Laufzeit-DAG" },
] as const;

const NUM_WORKERS = 6;

export function SqlDecoderStage() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const decodePhases = locale === "de" ? DECODE_PHASES_DE : DECODE_PHASES;
  const [qid, setQid] = useState("hash");
  const Q = QUERIES.find((q) => q.id === qid)!;
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [skew, setSkew] = useState(false);
  const [salt, setSalt] = useState(false);
  const rafRef = useRef<number | null>(null);

  const plan = () => {
    setPhase(0);
    setRunning(true);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const duration = 3600;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setPhase(p * decodePhases.length);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    setPhase(0);
    setSkew(false);
    setSalt(false);
  }, [qid]);

  const phaseIdx = Math.min(decodePhases.length - 1, Math.floor(phase));
  const showLogical = phase >= 1;
  const showPhysical = phase >= 2;
  const showStages = phase >= 3;

  const gantt = useMemo(() => {
    const n = Q.stages.length;
    if (n === 1) return [{ k: Q.stages[0].k, start: 0, w: 100, color: Q.stages[0].color }];
    const gap = 2;
    const avail = 100 - gap * (n - 1);
    const weights = Q.stages.map((_, i) => (i === 0 ? 28 : i === n - 1 ? 22 : 26));
    const sum = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    return Q.stages.map((s, i) => {
      const w = (weights[i] / sum) * avail;
      const bar = { k: s.k, start: acc, w, color: s.color };
      acc += w + gap;
      return bar;
    });
  }, [Q]);

  const workerLoad = useMemo(() => {
    if (!skew) return Array<number>(NUM_WORKERS).fill(1);
    if (salt) return Array<number>(NUM_WORKERS).fill(1);
    const a = Array<number>(NUM_WORKERS).fill(0.08);
    a[0] = 1;
    return a;
  }, [skew, salt]);

  return (
    <Panel
      eyebrow={text("live · compiler", "live · Compiler")}
      title={text("SQL → AST → logical → physical → stages", "SQL → AST → logisch → physisch → Stages")}
      meta={text("click a preset · run plan · poke skew", "Vorlage wählen · Plan ausführen · Skew auslösen")}
      caption={text("Five transformations between your text and your bytes. Engine chooses the exchange, you get the stages.", "Fünf Transformationen liegen zwischen Text und Bytes. Die Engine wählt den Exchange; daraus entstehen die Stages.")}
    >
      <div className="sd-top">
        <div className="sd-presets">
          {QUERIES.map((q) => (
            <button type="button" key={q.id} className={`sd-preset ${qid === q.id ? "on" : ""}`} onClick={() => setQid(q.id)}>
              {locale === "de" ? QUERY_LABELS_DE[q.id] : q.label}
            </button>
          ))}
          <button type="button" className="btn btn-primary sd-plan" onClick={plan} disabled={running}>
            {running ? text("planning…", "Planung…") : text("▶ Plan", "▶ Plan erstellen")}
          </button>
        </div>
        <div className="sd-sql">
          <pre className="sd-sql-pre">{Q.sql}</pre>
        </div>
        <div className="sd-phases">
          {decodePhases.map((p, i) => (
            <div key={p.k} className={`sd-phase ${phase >= i + 1 ? "on" : ""} ${phaseIdx === i ? "cur" : ""}`}>
              <div className="sd-phase-n">0{i + 1}</div>
              <div className="sd-phase-t">{p.t}</div>
              <div className="sd-phase-s">{p.sub}</div>
            </div>
          ))}
        </div>
        <div className="sd-plans">
          <div className={`sd-plan-col ${phase >= 1 ? "on" : ""}`}>
            <div className="sd-pc-lab">AST</div>
            <div className="sd-ast">
              <div className="sd-ast-root">SELECT</div>
              <div className="sd-ast-branch">
                <div className="sd-ast-leaf">{text("projections", "Projektionen")}</div>
                <div className="sd-ast-leaf">{text("from", "Quelle")}</div>
                {qid !== "scan" && <div className="sd-ast-leaf">Join</div>}
                <div className="sd-ast-leaf">{text("where", "Filter")}</div>
                {qid === "hash" && <div className="sd-ast-leaf">Group By</div>}
              </div>
            </div>
          </div>
          <div className={`sd-plan-col ${showLogical ? "on" : ""}`}>
            <div className="sd-pc-lab">{text("Logical", "Logisch")}</div>
            <div className="sd-ops">
              {Q.logical.map((op, i) => (
                <div key={i} className="sd-op">
                  {op}
                </div>
              ))}
            </div>
          </div>
          <div className={`sd-plan-col ${showPhysical ? "on" : ""}`}>
            <div className="sd-pc-lab">{text("Physical", "Physisch")}</div>
            <div className="sd-ops">
              {Q.physical.map((op, i) => {
                const isExch = op.includes("Exchange");
                const isJoin = op.includes("Join");
                return (
                  <div key={i} className={`sd-op ${isExch ? "exch" : ""} ${isJoin ? "join" : ""}`}>
                    {op}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`sd-plan-col ${showStages ? "on" : ""}`}>
            <div className="sd-pc-lab">Stages</div>
            <div className="sd-stages">
              {Q.stages.map((s) => (
                <div key={s.k} className={`sd-stage sd-${s.color}`}>
                  <div className="sd-stage-k">{s.k}</div>
                  <div className="sd-stage-ops">
                    {s.ops.map((o, i) => (
                      <div key={i} className="sd-stage-op">
                        {o}
                      </div>
                    ))}
                  </div>
                  {s.exch && <div className="sd-stage-exch">{s.exch}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sd-bot">
        <div className="sd-bot-head">
          <span className="sd-bot-lab">{text("Stage Visualizer", "Stage-Darstellung")}</span>
          <span className="sd-bot-meta">
            {Q.stages.length} {Q.stages.length > 1 ? text("stages", "Stages") : text("stage", "Stage")} · {NUM_WORKERS} {text("workers", "Worker")}
          </span>
          {Q.id === "hash" && (
            <div className="sd-bot-ctrls">
              <button
                type="button"
                className={`sv-btn ${skew ? "on" : ""}`}
                onClick={() => {
                  setSkew((s) => !s);
                  if (skew) setSalt(false);
                }}
              >
                {skew ? text("● skew on", "● Skew aktiv") : text("inject skew", "Skew auslösen")}
              </button>
              <button type="button" className={`sv-btn ${salt ? "on" : ""}`} onClick={() => setSalt((s) => !s)} disabled={!skew}>
                {salt ? text("● salted", "● gesalzen") : text("salting fix", "Salting anwenden")}
              </button>
            </div>
          )}
        </div>
        <div className="sd-cluster">
          <div className="sd-coord">
            <div className="sd-coord-dot" />
            <div className="sd-coord-lab">{text("Coordinator", "Koordinator")}</div>
          </div>
          <div className="sd-fan">
            {Array.from({ length: NUM_WORKERS }).map((_, i) => {
              const load = workerLoad[i];
              const state = skew && !salt && i === 0 ? "hot" : skew && !salt ? "idle" : "go";
              return (
                <div key={i} className={`sd-worker ${state}`}>
                  <div className="sd-w-bar">
                    <div className="sd-w-fill" style={{ height: `${Math.max(6, load * 100)}%` }} />
                  </div>
                  <div className="sd-w-lab">w{i}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="sd-gantt">
          <div className="sd-gantt-lab">{text("timeline", "Zeitleiste")}</div>
          <div className="sd-gantt-track">
            {gantt.map((g) => (
              <div key={g.k} className={`sd-gantt-bar sd-${g.color}`} style={{ left: `${g.start}%`, width: `${g.w}%` }}>
                {g.k}
              </div>
            ))}
          </div>
          <div className="sd-gantt-note">
            {Q.id === "scan" && text("Single stage. Scan+filter+project fuse into one pipeline on each worker.", "Eine Stage. Scan, Filter und Projektion verschmelzen auf jedem Worker zu einer Pipeline.")}
            {Q.id === "hash" && text("Three stages. Two parallel scans, then a join stage after the shuffle, then a final aggregate.", "Drei Stages. Zwei parallele Scans, danach eine Join-Stage nach dem Shuffle und abschließend die Aggregation.")}
            {Q.id === "bcast" && text("One stage. The small dim table is broadcast to every worker: no shuffle of the big table.", "Eine Stage. Die kleine Dimensionstabelle wird an jeden Worker übertragen; die große Tabelle wird nicht geshuffelt.")}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default SqlDecoderStage;
