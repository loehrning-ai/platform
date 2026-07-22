"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";

// ─── MetricsSim ───────────────────────────────────
// Ported from `src/chapters/Ch7_Serve.js`: the same question, resolved
// through a governed metrics registry vs an ungoverned ad-hoc query that
// hits a deprecated table and a renamed column.

interface Metric {
  readonly name: string;
  readonly owner: string;
  readonly grain: string;
  readonly source: string;
  readonly formula: string;
}

const METRICS: Readonly<Record<string, Metric>> = {
  dau: {
    name: "daily_active_users",
    owner: "analytics_team",
    grain: "user, day",
    source: "events_daily",
    formula: 'COUNT(DISTINCT user_id) WHERE event_name IN ("open","login")',
  },
  revenue: {
    name: "revenue_usd",
    owner: "finance_team",
    grain: "day, country",
    source: "billable_impressions",
    formula: "SUM(bid_price * 1e-6) WHERE billable = TRUE",
  },
  creators: {
    name: "active_creators",
    owner: "creators_data",
    grain: "creator, day",
    source: "creator_posts_daily",
    formula: "COUNT(DISTINCT creator_id) WHERE posts >= 1",
  },
};

interface QuestionDef {
  readonly q: string;
  readonly metric: keyof typeof METRICS;
  readonly answer: string;
  readonly src: string;
}

const QUESTIONS: readonly QuestionDef[] = [
  { q: "DAU in US last week?", metric: "dau", answer: "142.3M", src: "events_daily · 7-day avg · US" },
  { q: "Ad revenue yesterday?", metric: "revenue", answer: "$89.4M", src: "billable_impressions · 2026-04-19 · global" },
  { q: "Active creators this month?", metric: "creators", answer: "2.14M", src: "creator_posts_daily · 2026-04 MTD" },
];

interface Step {
  readonly k: string;
  readonly title: string;
  readonly desc: string;
  readonly ms: number;
  readonly error?: boolean;
}

function governedSteps(q2: QuestionDef): readonly Step[] {
  return [
    { k: "parse", title: "Parse intent", desc: "question → metric lookup", ms: 500 },
    { k: "resolve", title: "Resolve metric", desc: `Registry hit: ${METRICS[q2.metric].name}`, ms: 700 },
    { k: "bind", title: "Bind grain & filters", desc: "time window · cohort · geo", ms: 650 },
    { k: "compose", title: "Compose SQL", desc: "from metric formula + filters", ms: 600 },
    { k: "execute", title: "Execute on Presto", desc: "read governed source", ms: 900 },
    { k: "answer", title: "Return answer + lineage", desc: "traceable to source rows", ms: 400 },
  ];
}

function ungovernedSteps(): readonly Step[] {
  return [
    { k: "parse", title: "Parse intent", desc: 'question → "find a relevant table"', ms: 500 },
    { k: "search", title: "Search warehouse schema", desc: "No registry: grep table names…", ms: 1000 },
    { k: "guess", title: "Pick table by name match", desc: 'Chose "dau_v3_deprecated_2021"', ms: 800 },
    { k: "wrongcol", title: "Reference columns from memory", desc: "Wrote: user_cnt · daily_cnt", ms: 900, error: true },
    { k: "execute", title: "Execute on Presto", desc: "Column not found: abort", ms: 500, error: true },
  ];
}

function renderSQL(q2: QuestionDef, governed: boolean): string {
  const m = METRICS[q2.metric];
  return governed
    ? `<span class="tok-c">-- auto-composed from metric registry · traceable</span>
<span class="tok-k">SELECT</span> <span class="tok-f">COUNT</span>(<span class="tok-k">DISTINCT</span> user_id) <span class="tok-k">AS</span> ${m.name}
<span class="tok-k">FROM</span> ${m.source}
<span class="tok-k">WHERE</span> ds <span class="tok-k">BETWEEN</span> <span class="tok-s">'&lt;DATEID-7&gt;'</span> <span class="tok-k">AND</span> <span class="tok-s">'&lt;DATEID&gt;'</span>
  <span class="tok-k">AND</span> country = <span class="tok-s">'US'</span>
  <span class="tok-k">AND</span> event_name <span class="tok-k">IN</span> (<span class="tok-s">'open'</span>, <span class="tok-s">'login'</span>);`
    : `<span class="tok-c">-- ad-hoc query · no metric registry · likely wrong</span>
<span class="tok-k">SELECT</span> <span class="tok-f">SUM</span>(user_cnt) <span class="tok-k">AS</span> total_users      <span class="tok-c">-- ↯ column doesn't exist</span>
<span class="tok-k">FROM</span> dau_v3_deprecated_2021                 <span class="tok-c">-- ↯ archived in 2022</span>
<span class="tok-k">WHERE</span> day <span class="tok-k">BETWEEN</span> <span class="tok-s">'last_week'</span> <span class="tok-k">AND</span> <span class="tok-f">NOW</span>(); <span class="tok-c">-- ↯ non-deterministic</span>`;
}

type RunStatus = "idle" | "running" | "done" | "error";

interface RunState {
  readonly status: RunStatus;
  readonly step: number;
  readonly log: readonly Step[];
}

interface Result {
  readonly err: boolean;
  readonly v: string;
  readonly src: string;
}

export function MetricsSim() {
  const [governed, setGoverned] = useState(true);
  const [question, setQuestion] = useState(QUESTIONS[0].q);
  const [run, setRun] = useState<RunState>({ status: "idle", step: -1, log: [] });
  const [result, setResult] = useState<Result | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const runQuery = () => {
    clearTimers();
    setResult(null);
    const q2 = QUESTIONS.find((x) => x.q === question) ?? QUESTIONS[0];
    const steps = governed ? governedSteps(q2) : ungovernedSteps();
    setRun({ status: "running", step: 0, log: [] });
    let elapsed = 0;
    steps.forEach((s, i) => {
      const t = setTimeout(() => {
        setRun((r) => ({ ...r, step: i, log: [...r.log, s] }));
        if (i === steps.length - 1) {
          const t2 = setTimeout(() => {
            const errored = steps.some((x) => x.error);
            setRun((r) => ({ ...r, status: errored ? "error" : "done" }));
            setResult(
              errored
                ? { err: true, v: "Query failed", src: 'ERROR: Column "user_cnt" cannot be resolved. Table "dau_v3_deprecated_2021" was archived 2022-08.' }
                : { err: false, v: q2.answer, src: q2.src },
            );
          }, 350);
          timers.current.push(t2);
        }
      }, elapsed);
      timers.current.push(t);
      elapsed += s.ms;
    });
  };

  const q = QUESTIONS.find((x) => x.q === question) ?? QUESTIONS[0];

  return (
    <Panel
      eyebrow="live simulator · metrics query"
      title="The same question: with and without a metrics layer"
      meta={governed ? "governed" : "ungoverned"}
      caption="Toggle the ungoverned switch. Same question, same warehouse. The difference is whether the consumer can find the right table by name or has to guess."
    >
      <div className="aa-question-row">
        <input className="aa-q-input" value={question} onChange={(e) => setQuestion(e.target.value)} list="aa-qs" placeholder="Ask about a metric…" />
        <datalist id="aa-qs">
          {QUESTIONS.map((x) => (
            <option key={x.q} value={x.q} />
          ))}
        </datalist>
        <label className="aa-toggle">
          <input type="checkbox" checked={!governed} onChange={(e) => setGoverned(!e.target.checked)} />
          Disable metrics layer
        </label>
        <button className="btn btn-primary" onClick={runQuery} disabled={run.status === "running"}>
          {run.status === "running" ? "…running" : "▶ Run query"}
        </button>
      </div>

      <div className="aa-stages">
        <div className="aa-stage-col">
          <div className="aa-stage-head">
            <span>Query trace</span>
            <span>{run.status}</span>
          </div>
          <div className="aa-stage-body">
            {run.log.length === 0 && (
              <div style={{ padding: "40px 18px", textAlign: "center", color: "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.02em" }}>
                idle: press ▶ Run query
              </div>
            )}
            {run.log.map((s, i) => {
              const cls = s.error ? "error" : i === run.step && run.status === "running" ? "active" : "done";
              return (
                <div key={i} className={`aa-step ${cls}`}>
                  <div className="ico">{s.error ? "✕" : String(i + 1)}</div>
                  <div>
                    <div className="title">{s.title}</div>
                    <div className="desc">{s.desc}</div>
                  </div>
                  <div className="time">{s.ms}ms</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="aa-stage-col dark">
          <div className="aa-yaml-head">
            <span>{governed ? "generated · composed from registry" : "ad-hoc · written by a hurried analyst"}</span>
            <span>SQL</span>
          </div>
          <pre className="aa-yaml" dangerouslySetInnerHTML={{ __html: renderSQL(q, governed) }} />
        </div>
      </div>

      {result && (
        <div className={`aa-answer ${result.err ? "err" : ""}`}>
          <div className="lab">{result.err ? "Execution failed" : "Answer"}</div>
          <div className="v">{result.v}</div>
          <div className="src">{result.src}</div>
        </div>
      )}
    </Panel>
  );
}

export default MetricsSim;
