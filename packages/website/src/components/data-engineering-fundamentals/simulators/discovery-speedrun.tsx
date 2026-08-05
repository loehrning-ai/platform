"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { SafeLessonMarkup } from "@/components/safe-lesson-markup";

// ─── DiscoverySpeedrun ────────────────────────────
// Ported from `src/chapters/Ch6_Discover.js`: a timed practice round of six
// data-discovery shortcuts. Not a pass/fail quiz gate — free-text input
// matched by regex, penalties for tips/solutions, a baseline leaderboard.

interface ResultRow {
  readonly k: string;
  readonly v: string;
}

interface QuestionResult {
  readonly kind: string;
  readonly title: string;
  readonly rows?: readonly ResultRow[];
  readonly schema?: readonly string[];
  readonly body?: string;
  readonly children?: readonly { name: string; owner: string; kind: string }[];
}

interface Question {
  readonly q: string;
  readonly hint: string;
  readonly shortcut: string;
  readonly accept: RegExp;
  readonly tip: string;
  readonly why: string;
  readonly result: QuestionResult;
}

const DISC_QUESTIONS: readonly Question[] = [
  {
    q: "Who owns <b>dim_users</b>?",
    hint: "You need owner · contact · oncall",
    shortcut: "ht dim_users",
    accept: /^\s*ht\s+dim_users\s*$/i,
    tip: 'The "home table" shortcut is <code>ht</code>. Pass it the table name: <code>ht &lt;table&gt;</code>.',
    why: '<code>ht</code> ("home table") returns the metadata page for a single table: owner, partition, freshness, schema. It is the fastest way to confirm "is this the right table?"',
    result: {
      kind: "ht",
      title: "dim_users",
      rows: [
        { k: "owner", v: "analytics_oncall" },
        { k: "partition", v: "ds=YYYY-MM-DD" },
        { k: "rows/day", v: "12.4M" },
        { k: "sla", v: "24h" },
      ],
      schema: ["user_id : STRING", "account_id : STRING", "event_type : INT", "user_email : STRING", "ds : STRING"],
    },
  },
  {
    q: "Which job writes <b>fct_events</b>?",
    hint: "Find the producing pipeline",
    shortcut: "fpl fct_events",
    accept: /^\s*fpl\s+fct_events\s*$/i,
    tip: 'The "find pipeline" shortcut is <code>fpl</code>. Pass it the table whose producer you want: <code>fpl &lt;table&gt;</code>.',
    why: '<code>fpl</code> ("find pipeline") jumps from a table to the job that writes it: cadence, reader, oncall. Use this when a number looks wrong and you need to page someone.',
    result: {
      kind: "fpl",
      title: "Pipeline producing fct_events",
      rows: [
        { k: "job", v: "analytics.events_rollup" },
        { k: "cadence", v: "daily @ 04:00" },
        { k: "reader", v: "page_events_raw" },
        { k: "owner", v: "de_oncall" },
      ],
    },
  },
  {
    q: "Find the UDF that parses <b>CIDR ranges</b>.",
    hint: "Search the UDF catalog",
    shortcut: "udf cidr_parse",
    accept: /^\s*udf\s+\S+/i,
    tip: "The UDF-catalog shortcut is <code>udf</code>. Try a likely symbolic name: <code>udf cidr_parse</code> or <code>udf parse_cidr</code>.",
    why: "<code>udf &lt;name&gt;</code> looks up the UDF catalog by symbolic name. The catalog tells you who maintains the function and how often it is called, both matter before you take a runtime dependency.",
    result: {
      kind: "udf",
      title: "cidr_parse(STRING cidr) → STRUCT<net, mask, first, last>",
      rows: [
        { k: "owner", v: "netops_de" },
        { k: "lang", v: "Spark SQL" },
        { k: "calls/day", v: "240k" },
      ],
    },
  },
  {
    q: "What&apos;s a <b>dataset_acl</b>?",
    hint: "Look it up in the glossary",
    shortcut: "wut dataset_acl",
    accept: /^\s*wut\s+\S+/i,
    tip: 'The glossary shortcut is <code>wut</code> ("what is this thing"). Pass the term: <code>wut &lt;term&gt;</code>.',
    why: '<code>wut &lt;term&gt;</code> ("what is this thing") hits the glossary. Use it when you see an unfamiliar acronym in a Slack thread or a YAML file, three keystrokes saves you a tab into the wiki.',
    result: {
      kind: "wut",
      title: "dataset_acl",
      body: "Per-project access-control list. Scopes which engineers can read/write a dataset. Paired with actor annotations (Canonical_*) that tag the PII/identity nature of columns. Enforced at deploy by the Access Gateway.",
    },
  },
  {
    q: "Show <b>downstream consumers</b> of dim_accounts.",
    hint: "Walk one hop down the lineage",
    shortcut: "ds produce dim_accounts",
    accept: /^\s*ds\s+produce\s+\S+/i,
    tip: "The lineage shortcut is <code>ds</code>, with a <code>produce</code> subcommand for downstream: <code>ds produce &lt;table&gt;</code>.",
    why: "<code>ds produce &lt;table&gt;</code> walks one hop downstream: which facts, dimensions, metrics, and dashboards read this table. Always check this before deprecating or schema-changing, it tells you who you are about to break.",
    result: {
      kind: "lineage",
      title: "dim_accounts · downstream (1 hop)",
      children: [
        { name: "fct_logins", owner: "auth_de", kind: "fact" },
        { name: "dim_account_geo", owner: "geo_de", kind: "dim" },
        { name: "metric:mau_daily", owner: "analytics_team", kind: "metric" },
        { name: "dash:exec_weekly", owner: "analytics_team", kind: "dash" },
      ],
    },
  },
];

const BASELINE_TIMES = [
  { name: "adrian · sr_de", t: 42 },
  { name: "priya · de_oncall", t: 58 },
  { name: "code-spelunker", t: 247 },
];

const TIP_PENALTY = 2;
const SOLUTION_PENALTY = 5;

type Phase = "intro" | "playing" | "done";

interface RunResult {
  readonly q: Question;
  readonly input: string;
  readonly correct: boolean;
  readonly revealed?: boolean;
}

export function DiscoverySpeedrun() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIdx, setQIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [results, setResults] = useState<readonly RunResult[]>([]);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);
  const [tipShown, setTipShown] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "playing" || !t0) return;
    const id = setInterval(() => setNow(Date.now()), 60);
    return () => clearInterval(id);
  }, [phase, t0]);

  const elapsed = phase === "playing" && t0 ? (now - t0) / 1000 + penalty : 0;

  const start = () => {
    setPhase("playing");
    setQIdx(0);
    setInputVal("");
    setResults([]);
    setPenalty(0);
    setTipShown(false);
    setSolutionShown(false);
    setT0(Date.now());
    setNow(Date.now());
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const advance = (entry: RunResult) => {
    setResults((r) => [...r, entry]);
    if (qIdx === DISC_QUESTIONS.length - 1) {
      setPhase("done");
    } else {
      setQIdx((i) => i + 1);
      setInputVal("");
      setTipShown(false);
      setSolutionShown(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const submit = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const q2 = DISC_QUESTIONS[qIdx];
    if (q2.accept.test(inputVal)) {
      setFlash("ok");
      setTimeout(() => setFlash(null), 400);
      advance({ q: q2, input: inputVal, correct: true });
    } else {
      setFlash("err");
      setPenalty((p) => p + 3);
      setTimeout(() => setFlash(null), 450);
    }
  };

  const showTip = () => {
    if (tipShown) return;
    setTipShown(true);
    setPenalty((p) => p + TIP_PENALTY);
  };

  const showSolution = () => {
    if (solutionShown) return;
    setSolutionShown(true);
    setPenalty((p) => p + SOLUTION_PENALTY);
  };

  const fillSolution = () => {
    const q2 = DISC_QUESTIONS[qIdx];
    setInputVal(q2.shortcut);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (phase === "intro") {
    return (
      <Panel
        eyebrow="timed · 5 questions · 6 shortcuts"
        title="Discovery Speedrun"
        meta="practice round"
        caption="You don't read code to find a table's owner. You type one of six shortcuts into palette and get the answer in 200ms. Beat the baselines."
      >
        <div className="ds-intro">
          <div className="ds-intro-grid">
            {[
              { s: "ht <table>", w: "table home: owner, schema, freshness" },
              { s: "fpl <table>", w: "producing pipeline · cadence · oncall" },
              { s: "ds produce <table>", w: "downstream consumers · one hop" },
              { s: "qbgs <term>", w: "search the warehouse by keyword" },
              { s: "udf <name>", w: "UDF catalog lookup" },
              { s: "wut <term>", w: "glossary: what IS this thing" },
            ].map((x) => (
              <div key={x.s} className="ds-shortcut-card">
                <code>{x.s}</code>
                <div className="w">{x.w}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={start}>
              ▶ Start speedrun
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  if (phase === "done") {
    const final = t0 ? (Date.now() - t0) / 1000 + penalty : penalty;
    const solvedCount = results.filter((r) => r.correct).length;
    const revealedCount = results.filter((r) => r.revealed).length;
    const board = [...BASELINE_TIMES, { name: "you", t: final, you: true }].sort((a, b) => a.t - b.t);
    return (
      <Panel
        eyebrow="run complete"
        title={`Finished in ${final.toFixed(1)}s`}
        meta={`${solvedCount}/${DISC_QUESTIONS.length} solved${revealedCount ? ` · ${revealedCount} revealed` : ""} · +${penalty}s penalty`}
        caption="How you compare to the baselines."
      >
        <div className="ds-leaderboard">
          {board.map((r, i) => (
            <div key={i} className={`ds-lb-row ${"you" in r && r.you ? "you" : ""}`}>
              <div className="rank">#{i + 1}</div>
              <div className="name">{r.name}</div>
              <div className="time">{r.t.toFixed(1)}s</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button type="button" className="btn btn-primary" onClick={start}>
            ↻ Replay
          </button>
        </div>
      </Panel>
    );
  }

  const q = DISC_QUESTIONS[qIdx];
  const lastOk = results[results.length - 1];

  return (
    <Panel
      eyebrow={`question ${qIdx + 1} of ${DISC_QUESTIONS.length}`}
      title="Discovery Speedrun"
      meta={`elapsed · ${elapsed.toFixed(1)}s · penalty +${penalty}s`}
      caption="Type the shortcut · Enter to submit · Tip & Show solution available"
    >
      <div className={`ds-terminal ${flash ? "flash-" + flash : ""}`}>
        <div className="ds-term-head">
          <span className="t">palette@warehouse</span>
          <span className="clk">
            <span className="d">●</span>
            <span className="d y">●</span>
            <span className="d g">●</span>
          </span>
        </div>
        <div className="ds-term-body">
          <div className="ds-q">
            <span className="q-lab">Q:</span>
            <span className="q-t">
              <SafeLessonMarkup html={q.q} />
            </span>
          </div>
          <div className="ds-hint">▹ {q.hint}</div>
          <form className="ds-prompt" onSubmit={submit}>
            <span className="p">$</span>
            <input
              ref={inputRef}
              name="shortcut"
              aria-label="Shortcut answer"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="type a shortcut…"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd>↵</kbd>
          </form>
          <div className="ds-help-row">
            <button type="button" className="ds-help-btn is-tip" onClick={showTip} disabled={tipShown} title="Reveal a small nudge toward the right shortcut">
              ▹ {tipShown ? "Tip shown" : "Show tip"} <span className="cost">+{TIP_PENALTY}s</span>
            </button>
            <button type="button" className="ds-help-btn is-solution" onClick={showSolution} disabled={solutionShown} title="Reveal the canonical answer">
              ★ {solutionShown ? "Solution shown" : "Show solution"} <span className="cost">+{SOLUTION_PENALTY}s</span>
            </button>
          </div>
          {tipShown && (
            <div className="ds-tip-banner">
              <strong>Tip:</strong>{" "}
              <span>
                <SafeLessonMarkup html={q.tip} />
              </span>
            </div>
          )}
          {solutionShown && (
            <div className="ds-solution-banner">
              <span className="lab">Solution</span>
              <code>{q.shortcut}</code>
              {q.why && (
                <span className="why">
                  <SafeLessonMarkup html={q.why} />
                </span>
              )}
              <div className="ds-solution-actions">
                <button type="button" className="ds-help-btn" onClick={fillSolution}>
                  ↳ Fill input
                </button>
                <button
                  type="button"
                  className="ds-help-btn"
                  onClick={() => {
                    advance({ q, input: q.shortcut, correct: false, revealed: true });
                  }}
                >
                  → Skip to next
                </button>
              </div>
            </div>
          )}
          {flash === "err" && <div className="ds-toast err">✕ wrong shortcut · +3s</div>}
        </div>
      </div>

      {lastOk && (
          <div className={`ds-result ${lastOk.revealed ? "is-revealed" : ""}`}>
            <div className="ds-result-head">
              {lastOk.revealed ? "↳ revealed" : "✓ answered"} · {lastOk.q.result.title}
            </div>
            {lastOk.q.result.rows && (
              <div className="ds-result-rows">
                {lastOk.q.result.rows.map((r, i) => (
                  <div key={i} className="ds-row">
                    <span className="k">{r.k}</span>
                    <span className="v">{r.v}</span>
                  </div>
                ))}
              </div>
            )}
            {lastOk.q.result.schema && (
              <div className="ds-schema">
                {lastOk.q.result.schema.map((s, i) => (
                  <div key={i} className="ds-schema-row">
                    {s}
                  </div>
                ))}
              </div>
            )}
            {lastOk.q.result.body && <div className="ds-result-body">{lastOk.q.result.body}</div>}
            {lastOk.q.result.children && (
              <div className="ds-lineage-mini">
                <div className="ds-lineage-root">{lastOk.q.result.title.split(" · ")[0]}</div>
                <div className="ds-lineage-fan">
                  {lastOk.q.result.children.map((c, i) => (
                    <div key={i} className={`ds-lineage-leaf k-${c.kind}`}>
                      <div className="n">{c.name}</div>
                      <div className="o">{c.owner}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      <div className="ds-progress">
        {DISC_QUESTIONS.map((_, i) => (
          <span key={i} className={`ds-prog-dot ${i < qIdx ? "done" : i === qIdx ? "active" : ""}`}>
            {i + 1}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export default DiscoverySpeedrun;
