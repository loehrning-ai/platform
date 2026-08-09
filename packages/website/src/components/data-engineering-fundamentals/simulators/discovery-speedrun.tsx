"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { SafeLessonMarkup } from "@/components/safe-lesson-markup";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── DiscoverySpeedrun ────────────────────────────
// Ported from `src/chapters/Ch6_Discover.js`: a timed practice round of six
// data-discovery shortcuts. Not a pass/fail quiz gate — free-text input
// matched by regex, with local timing and penalties for tips/solutions.

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

export const DISC_QUESTIONS: readonly Question[] = [
  {
    q: "Who owns <b>dim_users</b>?",
    hint: "You need owner · contact · oncall",
    shortcut: "ht dim_users",
    accept: /^\s*ht\s+dim_users\s*$/i,
    tip: 'The "home table" shortcut is <code>ht</code>. Pass it the table name: <code>ht &lt;table&gt;</code>.',
    why: '<code>ht</code> returns the course metadata page for one table: owner, partition, freshness, and schema.',
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
    why: '<code>fpl</code> opens the course record for the job that writes a table: cadence, input, and owner.',
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
    why: '<code>wut &lt;term&gt;</code> opens the course glossary entry for a term.',
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
    why: "<code>ds produce &lt;table&gt;</code> shows registered one-hop consumers. Verify graph completeness before a deprecation or schema change.",
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

export const DISC_QUESTIONS_DE: readonly Question[] = [
  {
    ...DISC_QUESTIONS[0],
    q: "Wem gehört <b>dim_users</b>?",
    hint: "Du brauchst Verantwortliche · Kontakt · Bereitschaftsdienst",
    tip: 'Das Kürzel für die Tabellenseite lautet <code>ht</code>. Übergib den Tabellennamen: <code>ht &lt;table&gt;</code>.',
    why: '<code>ht</code> öffnet im Kurs die Metadatenseite einer Tabelle mit Zuständigkeit, Partitionierung, Aktualität und Schema.',
    result: {
      ...DISC_QUESTIONS[0].result,
      rows: [
        { k: "verantwortlich", v: "analytics_oncall" },
        { k: "Partition", v: "ds=YYYY-MM-DD" },
        { k: "Zeilen/Tag", v: "12.4M" },
        { k: "SLA", v: "24h" },
      ],
    },
  },
  {
    ...DISC_QUESTIONS[1],
    q: "Welcher Job schreibt <b>fct_events</b>?",
    hint: "Finde die erzeugende Pipeline",
    tip: 'Das Kürzel zum Auffinden einer Pipeline lautet <code>fpl</code>. Übergib die Tabelle, deren Erzeuger du suchst: <code>fpl &lt;table&gt;</code>.',
    why: '<code>fpl</code> öffnet im Kurs den Job, der eine Tabelle schreibt, einschließlich Takt, Eingabe und Zuständigkeit.',
    result: {
      ...DISC_QUESTIONS[1].result,
      title: "Pipeline, die fct_events erzeugt",
      rows: [
        { k: "Job", v: "analytics.events_rollup" },
        { k: "Takt", v: "täglich · 04:00" },
        { k: "Eingabe", v: "page_events_raw" },
        { k: "verantwortlich", v: "de_oncall" },
      ],
    },
  },
  {
    ...DISC_QUESTIONS[2],
    q: "Finde die UDF, die <b>CIDR-Bereiche</b> verarbeitet.",
    hint: "Durchsuche den UDF-Katalog",
    tip: "Das Kürzel für den UDF-Katalog lautet <code>udf</code>. Probiere einen wahrscheinlichen symbolischen Namen: <code>udf cidr_parse</code> oder <code>udf parse_cidr</code>.",
    why: "<code>udf &lt;name&gt;</code> sucht im UDF-Katalog nach einem symbolischen Namen. Vor einer Laufzeitabhängigkeit brauchst du zwei Angaben aus dem Katalog: wer die Funktion pflegt und wie häufig sie aufgerufen wird.",
    result: {
      ...DISC_QUESTIONS[2].result,
      rows: [
        { k: "verantwortlich", v: "netops_de" },
        { k: "Sprache", v: "Spark SQL" },
        { k: "Aufrufe/Tag", v: "240k" },
      ],
    },
  },
  {
    ...DISC_QUESTIONS[3],
    q: "Was ist eine <b>dataset_acl</b>?",
    hint: "Schlage den Begriff im Glossar nach",
    tip: 'Das Glossarkürzel lautet <code>wut</code>. Übergib den Begriff: <code>wut &lt;term&gt;</code>.',
    why: '<code>wut &lt;term&gt;</code> öffnet im Kurs den Glossareintrag eines Begriffs.',
    result: {
      ...DISC_QUESTIONS[3].result,
      body: "Projektbezogene Zugriffsliste. Sie legt im Kursszenario fest, welche Personen einen Datensatz lesen oder schreiben dürfen. Zusammen mit Akteur-Annotationen wird sie durch die Referenzschranke geprüft.",
    },
  },
  {
    ...DISC_QUESTIONS[4],
    q: "Zeige die <b>nachgelagerten Verbraucher</b> von dim_accounts.",
    hint: "Gehe im Lineage-Graphen einen Schritt abwärts",
    tip: "Das Lineage-Kürzel lautet <code>ds</code>. Der Unterbefehl <code>produce</code> zeigt nachgelagerte Verbraucher: <code>ds produce &lt;table&gt;</code>.",
    why: "<code>ds produce &lt;table&gt;</code> zeigt registrierte Verbraucher einen Schritt nachgelagert. Vor Abschaltung oder Schemaänderung die Vollständigkeit des Graphen prüfen.",
    result: {
      ...DISC_QUESTIONS[4].result,
      title: "dim_accounts · nachgelagert (1 Schritt)",
    },
  },
];

export const TIP_PENALTY = 2;
export const SOLUTION_PENALTY = 5;

type Phase = "intro" | "playing" | "done";

interface RunResult {
  readonly q: Question;
  readonly input: string;
  readonly correct: boolean;
  readonly revealed?: boolean;
}

export function DiscoverySpeedrun() {
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const questions = locale === "de" ? DISC_QUESTIONS_DE : DISC_QUESTIONS;
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
    if (qIdx === questions.length - 1) {
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
    const q2 = questions[qIdx];
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
    const q2 = questions[qIdx];
    setInputVal(q2.shortcut);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (phase === "intro") {
    return (
      <Panel
        eyebrow={text("timed · 5 questions · 6 shortcuts", "mit Zeitmessung · 5 Fragen · 6 Kürzel")}
        title={text("Catalog command practice", "Katalogbefehle üben")}
        meta={text("practice round", "Übungsrunde")}
        caption={text("Practice five lookups in the course's fictional command palette. Timing is local feedback, not a benchmark or proficiency threshold.", "Fünf Abfragen in der fiktiven Befehlspalette des Kurses üben. Die Zeitmessung ist lokales Feedback und kein Benchmark oder Kompetenznachweis.")}
      >
        <div className="ds-intro">
          <div className="ds-intro-grid">
            {[
              { s: "ht <table>", w: text("table home: owner, schema, freshness", "Tabellenseite: Verantwortliche, Schema, Aktualität") },
              { s: "fpl <table>", w: text("producing pipeline · cadence · oncall", "erzeugende Pipeline · Takt · Bereitschaftsdienst") },
              { s: "ds produce <table>", w: text("downstream consumers · one hop", "nachgelagerte Verbraucher · ein Schritt") },
              { s: "qbgs <term>", w: text("search the warehouse by keyword", "Warehouse nach Stichwort durchsuchen") },
              { s: "udf <name>", w: text("UDF catalog lookup", "UDF im Katalog nachschlagen") },
              { s: "wut <term>", w: text("glossary: what IS this thing", "Glossar: Was bedeutet dieser Begriff?") },
            ].map((x) => (
              <div key={x.s} className="ds-shortcut-card">
                <code>{x.s}</code>
                <div className="w">{x.w}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={start}>
              ▶ {text("Start practice", "Übung starten")}
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
    return (
      <Panel
        eyebrow={text("run complete", "Durchlauf abgeschlossen")}
        title={`${text("Finished in", "Abgeschlossen in")} ${final.toFixed(1)}s`}
        meta={`${solvedCount}/${questions.length} ${text("solved", "gelöst")}${revealedCount ? ` · ${revealedCount} ${text("revealed", "aufgedeckt")}` : ""} · +${penalty}s ${text("penalty", "Zeitstrafe")}`}
        caption={text("Local practice result. No comparison baseline or pass threshold is applied.", "Lokales Übungsergebnis ohne Vergleichsbasis oder Bestehensgrenze.")}
      >
        <div className="ds-leaderboard">
          <div className="ds-lb-row you">
            <div className="rank">1</div>
            <div className="name">{text("practice result", "Übungsergebnis")}</div>
            <div className="time">{final.toFixed(1)}s</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button type="button" className="btn btn-primary" onClick={start}>
            ↻ {text("Replay", "Wiederholen")}
          </button>
        </div>
      </Panel>
    );
  }

  const q = questions[qIdx];
  const lastOk = results[results.length - 1];

  return (
    <Panel
      eyebrow={`${text("question", "Frage")} ${qIdx + 1} ${text("of", "von")} ${questions.length}`}
      title={text("Catalog command practice", "Katalogbefehle üben")}
      meta={`${text("elapsed", "verstrichen")} · ${elapsed.toFixed(1)}s · ${text("penalty", "Zeitstrafe")} +${penalty}s`}
      caption={text("Type the shortcut · Enter to submit · Tip & Show solution available", "Kürzel eingeben · mit Enter absenden · Tipp und Lösung sind verfügbar")}
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
              aria-label={text("Shortcut answer", "Antwortkürzel")}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={text("type a shortcut…", "Kürzel eingeben …")}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd>↵</kbd>
          </form>
          <div className="ds-help-row">
            <button type="button" className="ds-help-btn is-tip" onClick={showTip} disabled={tipShown} title={text("Reveal a small nudge toward the right shortcut", "Einen kleinen Hinweis auf das richtige Kürzel anzeigen")}>
              ▹ {tipShown ? text("Tip shown", "Tipp angezeigt") : text("Show tip", "Tipp anzeigen")} <span className="cost">+{TIP_PENALTY}s</span>
            </button>
            <button type="button" className="ds-help-btn is-solution" onClick={showSolution} disabled={solutionShown} title={text("Reveal the course answer", "Die Kursantwort anzeigen")}>
              ★ {solutionShown ? text("Solution shown", "Lösung angezeigt") : text("Show solution", "Lösung anzeigen")} <span className="cost">+{SOLUTION_PENALTY}s</span>
            </button>
          </div>
          {tipShown && (
            <div className="ds-tip-banner">
              <strong>{text("Tip:", "Tipp:")}</strong>{" "}
              <span>
                <SafeLessonMarkup html={q.tip} />
              </span>
            </div>
          )}
          {solutionShown && (
            <div className="ds-solution-banner">
              <span className="lab">{text("Solution", "Lösung")}</span>
              <code>{q.shortcut}</code>
              {q.why && (
                <span className="why">
                  <SafeLessonMarkup html={q.why} />
                </span>
              )}
              <div className="ds-solution-actions">
                <button type="button" className="ds-help-btn" onClick={fillSolution}>
                  ↳ {text("Fill input", "Eingabe übernehmen")}
                </button>
                <button
                  type="button"
                  className="ds-help-btn"
                  onClick={() => {
                    advance({ q, input: q.shortcut, correct: false, revealed: true });
                  }}
                >
                  → {text("Skip to next", "Zur nächsten Frage")}
                </button>
              </div>
            </div>
          )}
          {flash === "err" && <div className="ds-toast err">✕ {text("wrong shortcut", "falsches Kürzel")} · +3s</div>}
        </div>
      </div>

      {lastOk && (
          <div className={`ds-result ${lastOk.revealed ? "is-revealed" : ""}`}>
            <div className="ds-result-head">
              {lastOk.revealed ? text("↳ revealed", "↳ aufgedeckt") : text("✓ answered", "✓ beantwortet")} · {lastOk.q.result.title}
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
        {questions.map((_, i) => (
          <span key={i} className={`ds-prog-dot ${i < qIdx ? "done" : i === qIdx ? "active" : ""}`}>
            {i + 1}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export default DiscoverySpeedrun;
