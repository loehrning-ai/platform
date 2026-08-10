"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── TrustMeterSim ────────────────────────────────
// Ported from `src/chapters/Ch5_Quality.js`: 4 toggleable DQ checks feed a
// weighted check coverage; inject a corruption on day 18, run 30 days, see whether the
// check catches it (signal blocked, oncall paged) or the wrong number ships.

const DAYS = 30;
const CORRUPT_DAY = 17;

interface CheckDef {
  readonly id: "rows" | "schema" | "fresh" | "unique";
  readonly name: string;
  readonly desc: string;
  readonly weight: number;
}

export const CHECKS: readonly CheckDef[] = [
  { id: "rows", name: "Row-count band", desc: "scenario threshold vs baseline", weight: 32 },
  { id: "schema", name: "Schema check", desc: "declared compatibility rule", weight: 22 },
  { id: "fresh", name: "Freshness", desc: "dataset target", weight: 24 },
  { id: "unique", name: "Uniqueness", desc: "declared key and grain", weight: 22 },
];

export const CHECKS_DE: readonly CheckDef[] = [
  { id: "rows", name: "Band für die Zeilenzahl", desc: "Szenarioschwelle gegen Basislinie", weight: 32 },
  { id: "schema", name: "Schemaprüfung", desc: "deklarierte Kompatibilitätsregel", weight: 22 },
  { id: "fresh", name: "Aktualität", desc: "Ziel des Datensatzes", weight: 24 },
  { id: "unique", name: "Eindeutigkeit", desc: "deklarierter Schlüssel und Granularität", weight: 22 },
];

type CorruptionId = "halfWrite" | "schemaDrift" | "slaSlip" | "dupRows";

export const CORRUPTIONS: Record<CorruptionId, { label: string; tripsBy: CheckDef["id"]; wrongVal: number }> = {
  halfWrite: { label: "partial write (scenario retains 20% of rows)", tripsBy: "rows", wrongVal: 24.8 },
  schemaDrift: { label: "schema drift (new null column)", tripsBy: "schema", wrongVal: 0 },
  slaSlip: { label: "freshness miss (scenario partition arrives late)", tripsBy: "fresh", wrongVal: 142.3 },
  dupRows: { label: "duplicate rows (idempotency bug)", tripsBy: "unique", wrongVal: 284.6 },
};

export const CORRUPTIONS_DE: typeof CORRUPTIONS = {
  halfWrite: { label: "unvollständiger Schreibvorgang (Szenario behält 20% der Zeilen)", tripsBy: "rows", wrongVal: 24.8 },
  schemaDrift: { label: "Schemadrift (neue Spalte mit Nullwerten)", tripsBy: "schema", wrongVal: 0 },
  slaSlip: { label: "Aktualitätsziel verfehlt (Szenariopartition verspätet)", tripsBy: "fresh", wrongVal: 142.3 },
  dupRows: { label: "doppelte Zeilen (Idempotenzfehler)", tripsBy: "unique", wrongVal: 284.6 },
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
  const { locale, text } = useDataEngineeringFundamentalsLocale();
  const checkDefs = locale === "de" ? CHECKS_DE : CHECKS;
  const corruptions = locale === "de" ? CORRUPTIONS_DE : CORRUPTIONS;
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
    .reduce((a, [k]) => a + (checkDefs.find((c) => c.id === k)?.weight ?? 0), 0);
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
      const corruption = isCorruptDay && corruptNow ? corruptions[corruptNow] : null;
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
            reason: corruption.label + ` · ${text("caught by", "erkannt durch")} ` + (checkDefs.find((c) => c.id === trippingCheck)?.name ?? ""),
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
      eyebrow={text("live simulator · data-quality gates", "Live-Simulator · Datenqualitätsschranken")}
      title={text("Check coverage", "Prüfungsabdeckung")}
      meta={`${Object.values(checks).filter(Boolean).length}/4 ${text("checks", "Prüfungen")} · ${corrupt ? `${text("corruption", "Fehler")}: ${corruptions[corrupt].label.split(" (")[0]}` : text("clean", "sauber")}`}
      caption={text("Four illustrative weighted checks. Thresholds, cost, coverage, signal dependencies, and alert routing must be configured per dataset.", "Vier beispielhaft gewichtete Prüfungen. Schwellen, Kosten, Abdeckung, Signalabhängigkeiten und Alarm-Routing werden pro Datensatz festgelegt.")}
    >
      <div className="tm-layout">
        <div className="tm-checks">
          <div className="tm-title">{text("Active checks", "Aktive Prüfungen")}</div>
          {checkDefs.map((c) => (
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
          <div className="tm-score-lab">{text("enabled check weight", "Gewicht aktiver Prüfungen")}</div>
          <div className="tm-score-big" style={{ color: needleColor }}>
            {needle}
            <span className="tm-score-max">/100</span>
          </div>
          <div className={`tm-verdict ${trustPct >= 80 ? "ok" : trustPct >= 50 ? "warn" : "bad"}`}>
            {trustPct >= 80 ? text("all modeled categories enabled", "alle modellierten Kategorien aktiv") : trustPct >= 50 ? text("partial modeled coverage", "teilweise Modellabdeckung") : text("few modeled categories enabled", "wenige modellierte Kategorien aktiv")}
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
            {checkDefs.map((c) => (
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
          <div className="tm-impact-eyebrow">{text("downstream dashboard · what the analyst sees", "nachgelagertes Dashboard · sichtbares Ergebnis")}</div>
          <div className="tm-impact-title">{text("Exec Dashboard", "Management-Dashboard")} · DAU · USA · {text("7-day avg", "7-Tage-Mittel")}</div>
        </div>
        <div className="tm-impact-grid">
          <div className="tm-impact-cell tm-impact-expected">
            <div className="lab">{text("Scenario reference", "Szenarioreferenz")}</div>
            <div className="big">
              142.3<span>M</span>
            </div>
            <div className="sub">{text("if pipeline ran clean", "bei fehlerfreiem Pipeline-Lauf")}</div>
          </div>
          <div className={`tm-impact-arrow is-${dashState}`}>{dashState === "ok" ? "→" : dashState === "stale" ? "⏸" : "⚠"}</div>
          <div className={`tm-impact-cell tm-impact-actual is-${dashState}`}>
            <div className="lab">{text("Displayed scenario value", "Angezeigter Szenariowert")}</div>
            <div className="big">
              {dashNumber.toFixed(1)}
              <span>M</span>
            </div>
            <div className="sub">
              {dashState === "wrong" &&
                (() => {
                  const pct = Math.abs(((dashNumber - 142.3) / 142.3) * 100).toFixed(0);
                  const diff = Math.round(Math.abs(dashNumber - 142.3));
                  const dir = dashNumber > 142.3 ? `${diff}M ${text("extra", "zu viel")}` : `${diff}M ${text("missing", "fehlend")}`;
                  return `${text("wrong by", "Abweichung")} ${pct}% · ${dir}`;
                })()}
              {dashState === "stale" && text("3-day-old data · signal blocked upstream", "3 Tage alte Daten · Signal upstream blockiert")}
              {dashState === "ok" && status === "ok" && text("matches scenario reference · selected checks passed", "entspricht der Szenarioreferenz · ausgewählte Prüfungen bestanden")}
              {dashState === "ok" && status !== "ok" && text("idle · run the simulation to see impact", "wartet · Simulation starten, um die Auswirkung zu sehen")}
            </div>
          </div>
        </div>
        {dashState === "wrong" && <div className="tm-impact-banner err">⚠ {text("Scenario anomaly reached the displayed result before the selected check caught it", "Szenarioanomalie erreichte das angezeigte Ergebnis, bevor eine ausgewählte Prüfung sie erkannte")}</div>}
        {dashState === "stale" && <div className="tm-impact-banner warn">⏸ {text("Modeled signal absent · configured consumers wait or retain prior data", "Modelliertes Signal fehlt · konfigurierte Verbraucher warten oder behalten vorherige Daten")}</div>}
        {dashState === "ok" && status === "ok" && <div className="tm-impact-banner ok">✓ {text("30-day scenario completed · selected checks passed · signal recorded", "30-Tage-Szenario abgeschlossen · ausgewählte Prüfungen bestanden · Signal erfasst")}</div>}
        {oncallTicket && (
          <div className="tm-ticket">
            <div className="ti-k">{text("SIMULATED ALERT CREATED", "SIMULIERTER ALARM ERSTELLT")}</div>
            <div className="ti-id">#{oncallTicket.id}</div>
            <div className="ti-d">
              {text("day", "Tag")} {oncallTicket.day} · {oncallTicket.reason} · {text("routed to", "zugewiesen an")} de_oncall
            </div>
          </div>
        )}
      </div>

      <div className="tm-timeline">
        <div className="tm-timeline-lab">{text("30-day run history", "Verlauf über 30 Tage")}</div>
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
                title={`${text("Day", "Tag")} ${i + 1}${r ? (r.ok ? ` · ${text("pass", "bestanden")}` : r.caught ? ` · ${text("CAUGHT", "ERKANNT")} (${r.trippedBy})` : ` · ${text("BREACH", "DURCHBRUCH")} (${r.trippedBy})`) : ""}${isCorrupt ? ` · ${text("corruption armed here", "Fehler hier aktiviert")}` : ""}`}
              >
                {isCorrupt && <span className="mark">!</span>}
              </div>
            );
          })}
        </div>
        <div className="tm-timeline-legend">
          <span>
            <i className="sw pending" /> {text("pending", "ausstehend")}
          </span>
          <span>
            <i className="sw ok" /> {text("pass", "bestanden")}
          </span>
          <span>
            <i className="sw caught" /> {text("caught", "erkannt")}
          </span>
          <span>
            <i className="sw fail" /> {text("breach", "durchgebrochen")}
          </span>
          <span>
            <i className="sw corrupt-mark" /> {text("corruption at day", "Fehler an Tag")} {CORRUPT_DAY + 1}
          </span>
        </div>
      </div>

      <div className="ctl-row">
        <div className="tm-corr-picker">
          <span className="tm-corr-lab">{text("Inject at day", "Fehler einfügen an Tag")} {CORRUPT_DAY + 1}:</span>
          <button type="button" className={`tm-corr ${!corrupt ? "on" : ""}`} onClick={() => setCorrupt(null)}>
            {text("none", "keiner")}
          </button>
          {(Object.entries(corruptions) as [CorruptionId, (typeof CORRUPTIONS)[CorruptionId]][]).map(([id, c]) => (
            <button
              type="button"
              key={id}
              className={`tm-corr ${corrupt === id ? "on" : ""}`}
              onClick={() => setCorrupt(id)}
              title={`${text("caught only by", "nur erkannt durch")} "${checkDefs.find((x) => x.id === c.tripsBy)?.name}"`}
            >
              {c.label.split(" (")[0]}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={run}>
          {text("▶ Run 30 days", "▶ 30 Tage ausführen")}
        </button>
        <button type="button" className="btn" onClick={reset}>
          {text("Reset", "Zurücksetzen")}
        </button>
        <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>
          {status === "breach" && <span style={{ color: "var(--theme-red)" }}>✕ {text("Corrupt data shipped: gate was off", "Fehlerhafte Daten veröffentlicht: Schranke war deaktiviert")}</span>}
          {status === "stale" && <span style={{ color: "#8B5C00" }}>✓ {text("Selected check blocked the modeled signal and emitted a simulated alert", "Ausgewählte Prüfung blockierte das modellierte Signal und erzeugte einen simulierten Alarm")}</span>}
          {status === "ok" && <span style={{ color: "var(--theme-green)" }}>✓ {text("Clean run", "Sauberer Lauf")} · 30/30</span>}
        </div>
      </div>
    </Panel>
  );
}

export default TrustMeterSim;
