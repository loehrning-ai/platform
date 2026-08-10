"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { SafeLessonMarkup } from "@/components/safe-lesson-markup";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

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

export const METRIC_REGISTRY: Readonly<Record<string, Metric>> = {
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
  readonly metric: keyof typeof METRIC_REGISTRY;
  readonly answer: string;
  readonly src: string;
}

export const QUESTIONS: readonly QuestionDef[] = [
  { q: "DAU in US last week?", metric: "dau", answer: "142.3M", src: "events_daily · 7-day avg · US" },
  { q: "Ad revenue yesterday?", metric: "revenue", answer: "$89.4M", src: "billable_impressions · 2026-04-19 · global" },
  { q: "Active creators this month?", metric: "creators", answer: "2.14M", src: "creator_posts_daily · 2026-04 MTD" },
];

export const QUESTIONS_DE: readonly QuestionDef[] = [
  { q: "DAU in den USA in der vergangenen Woche?", metric: "dau", answer: "142.3M", src: "events_daily · 7-Tage-Mittel · USA" },
  { q: "Werbeumsatz gestern?", metric: "revenue", answer: "$89.4M", src: "billable_impressions · 2026-04-19 · global" },
  { q: "Aktive Creator in diesem Monat?", metric: "creators", answer: "2.14M", src: "creator_posts_daily · 2026-04 MTD" },
];

interface Step {
  readonly k: string;
  readonly title: string;
  readonly desc: string;
  readonly ms: number;
  readonly error?: boolean;
}

function governedSteps(q2: QuestionDef, text: (english: string, german: string) => string): readonly Step[] {
  return [
    { k: "parse", title: text("Parse intent", "Absicht analysieren"), desc: text("question → metric lookup", "Frage → Metrik suchen"), ms: 500 },
    { k: "resolve", title: text("Resolve metric", "Metrik auflösen"), desc: `${text("Registry hit", "Treffer im Register")}: ${METRIC_REGISTRY[q2.metric].name}`, ms: 700 },
    { k: "bind", title: text("Bind grain & filters", "Granularität und Filter binden"), desc: text("time window · cohort · geo", "Zeitfenster · Kohorte · Region"), ms: 650 },
    { k: "compose", title: text("Compose SQL", "SQL zusammensetzen"), desc: text("from metric formula + filters", "aus Metrikformel und Filtern"), ms: 600 },
    { k: "execute", title: text("Execute on Presto", "Auf Presto ausführen"), desc: text("read declared source", "deklarierte Quelle lesen"), ms: 900 },
    { k: "answer", title: text("Return result + context", "Ergebnis und Kontext zurückgeben"), desc: text("record definition, filters, and source cutoff", "Definition, Filter und Quellenstichtag erfassen"), ms: 400 },
  ];
}

function ungovernedSteps(text: (english: string, german: string) => string): readonly Step[] {
  return [
    { k: "parse", title: text("Parse intent", "Absicht analysieren"), desc: text('question → "find a relevant table"', 'Frage → "passende Tabelle finden"'), ms: 500 },
    { k: "search", title: text("Search warehouse schema", "Warehouse-Schema durchsuchen"), desc: text("No registry: grep table names…", "Kein Register: Tabellennamen mit grep durchsuchen…"), ms: 1000 },
    { k: "guess", title: text("Pick table by name match", "Tabelle nach Namensähnlichkeit wählen"), desc: `${text("Chose", "Gewählt")}: "dau_v3_deprecated_2021"`, ms: 800 },
    { k: "wrongcol", title: text("Reference columns from memory", "Spalten aus dem Gedächtnis verwenden"), desc: `${text("Wrote", "Geschrieben")}: user_cnt · daily_cnt`, ms: 900, error: true },
    { k: "execute", title: text("Execute on Presto", "Auf Presto ausführen"), desc: text("Column not found: abort", "Spalte nicht gefunden: Abbruch"), ms: 500, error: true },
  ];
}

function renderSQL(q2: QuestionDef, governed: boolean): string {
  const m = METRIC_REGISTRY[q2.metric];
  return governed
    ? `<span class="tok-c">-- composed from the example metric registry</span>
<span class="tok-k">SELECT</span> <span class="tok-f">COUNT</span>(<span class="tok-k">DISTINCT</span> user_id) <span class="tok-k">AS</span> ${m.name}
<span class="tok-k">FROM</span> ${m.source}
<span class="tok-k">WHERE</span> ds <span class="tok-k">BETWEEN</span> <span class="tok-s">'&lt;DATEID-7&gt;'</span> <span class="tok-k">AND</span> <span class="tok-s">'&lt;DATEID&gt;'</span>
  <span class="tok-k">AND</span> country = <span class="tok-s">'US'</span>
  <span class="tok-k">AND</span> event_name <span class="tok-k">IN</span> (<span class="tok-s">'open'</span>, <span class="tok-s">'login'</span>);`
    : `<span class="tok-c">-- intentionally broken ad-hoc example · no metric registry</span>
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
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const questions = locale === "de" ? QUESTIONS_DE : QUESTIONS;
  const [governed, setGoverned] = useState(true);
  const [question, setQuestion] = useState(questions[0].q);
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
    const q2 = questions.find((x) => x.q === question) ?? questions[0];
    const steps = governed ? governedSteps(q2, text) : ungovernedSteps(text);
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
                ? { err: true, v: text("Query failed", "Abfrage fehlgeschlagen"), src: text('ERROR: Column "user_cnt" cannot be resolved. Table "dau_v3_deprecated_2021" was archived 2022-08.', 'FEHLER: Spalte "user_cnt" kann nicht aufgelöst werden. Tabelle "dau_v3_deprecated_2021" wurde 2022-08 archiviert.') }
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

  const q = questions.find((x) => x.q === question) ?? questions[0];
  const runStatus = run.status === "running" ? text("running", "läuft") : run.status === "done" ? text("done", "fertig") : run.status === "error" ? text("error", "Fehler") : text("idle", "wartet");

  return (
    <Panel
      eyebrow={text("live simulator · metrics query", "Live-Simulator · Metrikabfrage")}
      title={text("The same question: with and without a metrics layer", "Dieselbe Frage mit und ohne Metrikschicht")}
      meta={governed ? text("registered path", "registrierter Pfad") : text("ad-hoc path", "Ad-hoc-Pfad")}
      caption={text("Constructed scenario with illustrative values. The registered path records definition and source context; the ad-hoc path is intentionally broken.", "Konstruiertes Szenario mit Beispielwerten. Der registrierte Pfad erfasst Definitions- und Quellenkontext; der Ad-hoc-Pfad ist absichtlich fehlerhaft.")}
    >
      <div className="aa-question-row">
        <input aria-label={text("Metric question", "Metrikfrage")} className="aa-q-input" value={question} onChange={(e) => setQuestion(e.target.value)} list="aa-qs" placeholder={text("Ask about a metric…", "Frage zu einer Metrik…")} />
        <datalist id="aa-qs">
          {questions.map((x) => (
            <option key={x.q} value={x.q} />
          ))}
        </datalist>
        <label className="aa-toggle">
          <input type="checkbox" checked={!governed} onChange={(e) => setGoverned(!e.target.checked)} />
          {text("Disable metrics layer", "Metrikschicht deaktivieren")}
        </label>
        <button type="button" className="btn btn-primary" onClick={runQuery} disabled={run.status === "running"}>
          {run.status === "running" ? text("…running", "…läuft") : text("▶ Run query", "▶ Abfrage starten")}
        </button>
      </div>

      <div className="aa-stages">
        <div className="aa-stage-col">
          <div className="aa-stage-head">
            <span>{text("Query trace", "Abfrageablauf")}</span>
            <span>{runStatus}</span>
          </div>
          <div className="aa-stage-body">
            {run.log.length === 0 && (
              <div style={{ padding: "40px 18px", textAlign: "center", color: "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.02em" }}>
                {text("idle: press ▶ Run query", "wartet: ▶ Abfrage starten drücken")}
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
                  <div className="time">{text("step", "Schritt")} {i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="aa-stage-col dark">
          <div className="aa-yaml-head">
            <span>{governed ? text("generated · composed from registry", "generiert · aus dem Register zusammengesetzt") : text("ad-hoc · written by a hurried analyst", "Ad hoc · unter Zeitdruck geschrieben")}</span>
            <span>SQL</span>
          </div>
          <pre className="aa-yaml">
            <SafeLessonMarkup html={renderSQL(q, governed)} />
          </pre>
        </div>
      </div>

      {result && (
        <div className={`aa-answer ${result.err ? "err" : ""}`}>
          <div className="lab">{result.err ? text("Execution failed", "Ausführung fehlgeschlagen") : text("Answer", "Antwort")}</div>
          <div className="v">{result.v}</div>
          <div className="src">{result.src}</div>
        </div>
      )}
    </Panel>
  );
}

export default MetricsSim;
