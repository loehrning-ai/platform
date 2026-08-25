"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useControllableAnimation } from "@/lib/animation-policy";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── ConveyorSim ──────────────────────────────────
// Ported from `src/chapters/Ch1_5_Streaming.js`: events fall onto a
// conveyor belt and travel toward a gate that dedups by event_id and drops
// late arrivals past the watermark. DOM-diffed via refs (matching source's
// own direct-DOM `renderStage` approach) rather than React state per frame,
// since this is a 60fps particle system.

const CV_STAGE_SECONDS = 30;
const CV_WATERMARK_LAG = 4;
const CV_GATE_X = 70;
const CV_BASELINE_Y = 78;

type EventState = "falling" | "onbelt" | "passed" | "dup" | "late";

interface ConveyorEvent {
  id: string;
  et: number;
  at: number;
  lane: number;
  y: number;
  targetY: number;
  state: EventState;
  bornReal: number;
  onBeltAt?: number;
  gated?: boolean;
  endedAt?: number;
  twinLedgerIdx?: number;
}

interface TwinLink {
  id: string;
  fromT: number;
  ledgerIdx: number;
}

interface LateEntry {
  readonly id: string;
  readonly et: number;
  readonly at: number;
  readonly lag: number;
}

function eventTimeToX(et: number, now: number): number {
  const age = now - et;
  return 100 - (age / CV_STAGE_SECONDS) * 100;
}

export function ConveyorSim() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [rate, setRate] = useState(10);
  const [dupPct, setDupPct] = useState(22);
  const [latePct, setLatePct] = useState(15);
  const [dedupOn, setDedupOn] = useState(true);
  const [lateGateOn, setLateGateOn] = useState(true);
  const [beginner, setBeginner] = useState(true);
  const { running, toggle: toggleRunning } = useControllableAnimation(false);
  const [ledger, setLedger] = useState<readonly string[]>([]);
  const [lateDrawer, setLateDrawer] = useState<readonly LateEntry[]>([]);
  const [rtCount, setRtCount] = useState(0);
  const [whCount, setWhCount] = useState(0);
  const [rtTotal, setRtTotal] = useState(0);
  const [snapped, setSnapped] = useState(0);
  const [droppedLate, setDroppedLate] = useState(0);
  const [driftSeries, setDriftSeries] = useState<readonly { t: number; rt: number }[]>([]);

  const simT = useRef(0);
  const events = useRef<ConveyorEvent[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const seenOrder = useRef<string[]>([]);
  const passedStamps = useRef<number[]>([]);
  const twinLinks = useRef<TwinLink[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const eventsLayerRef = useRef<HTMLDivElement>(null);
  const linksSvgRef = useRef<SVGSVGElement>(null);
  const poolRef = useRef<string[]>([]);

  const reset = () => {
    simT.current = 0;
    events.current = [];
    seenIds.current = new Set();
    seenOrder.current = [];
    passedStamps.current = [];
    twinLinks.current = [];
    setLedger([]);
    setLateDrawer([]);
    setRtCount(0);
    setWhCount(0);
    setRtTotal(0);
    setSnapped(0);
    setDroppedLate(0);
    setDriftSeries([]);
  };

  const nextId = () => {
    const id = `E${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    poolRef.current.push(id);
    if (poolRef.current.length > 60) poolRef.current.shift();
    return id;
  };

  const reuseId = () => {
    if (poolRef.current.length < 2) return nextId();
    const idx = Math.max(0, poolRef.current.length - 1 - Math.floor(Math.random() * 20));
    return poolRef.current[idx];
  };

  function renderStage(list: readonly ConveyorEvent[], now: number, links: readonly TwinLink[]) {
    const layer = eventsLayerRef.current;
    if (layer) {
      const need = list.length;
      const pool = layer.children;
      while (pool.length < need) {
        const el = document.createElement("div");
        el.className = "cv-ev";
        const inner = document.createElement("span");
        el.appendChild(inner);
        layer.appendChild(el);
      }
      while (pool.length > need) layer.removeChild(pool[pool.length - 1]);
      list.forEach((e, i) => {
        const el = pool[i] as HTMLElement;
        const x = eventTimeToX(e.et, now);
        el.style.left = x.toFixed(2) + "%";
        el.style.top = e.y.toFixed(2) + "%";
        el.className = `cv-ev cv-${e.state}${e.state === "dup" ? " cv-dup" : ""}`;
        const inner = el.firstChild as HTMLElement;
        if (inner.textContent !== e.id) inner.textContent = e.id;
      });
    }
    const lyr2 = linksSvgRef.current;
    if (lyr2) {
      while (lyr2.lastChild) lyr2.removeChild(lyr2.lastChild);
      const ns = "http://www.w3.org/2000/svg";
      links.forEach((l) => {
        const path = document.createElementNS(ns, "path");
        const age = now - l.fromT;
        const op = Math.max(0, 1 - age / 0.55);
        const fromX = CV_GATE_X;
        const fromY = CV_BASELINE_Y;
        const toX = 99.5;
        const toY = 6 + l.ledgerIdx * 4.6;
        path.setAttribute("d", `M ${fromX} ${fromY} Q 92 ${fromY - 25} ${toX} ${toY}`);
        path.setAttribute("stroke", "#E41E3F");
        path.setAttribute("stroke-width", "0.45");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-dasharray", "1.2 0.8");
        path.setAttribute("vector-effect", "non-scaling-stroke");
        path.setAttribute("opacity", op.toFixed(2));
        lyr2.appendChild(path);
      });
    }
  }

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let spawnBank = 0;
    let rtBank = 0;
    const rtWindow: number[] = [];
    const tick = (now: number) => {
      const dtMs = Math.min(64, now - last);
      last = now;
      const dt = dtMs / 1000;
      simT.current += dt;
      spawnBank += dt * rate;
      while (spawnBank >= 1) {
        spawnBank -= 1;
        const isLate = Math.random() * 100 < latePct;
        const isDup = Math.random() * 100 < dupPct;
        let et: number;
        if (isLate) {
          const wm2 = simT.current - CV_WATERMARK_LAG;
          et = wm2 - (0.4 + Math.random() * 3.5);
        } else {
          et = simT.current - Math.random() * 0.6;
        }
        const id = isDup ? reuseId() : nextId();
        const lane = Math.floor(Math.random() * 5);
        events.current.push({
          id,
          et,
          at: simT.current,
          lane,
          y: 20 + Math.random() * 15,
          targetY: CV_BASELINE_Y - 10 + lane * 5,
          state: "falling",
          bornReal: now,
        });
      }

      const wm = simT.current - CV_WATERMARK_LAG;
      events.current.forEach((e) => {
        if (e.state === "falling") {
          const targetY = e.targetY ?? CV_BASELINE_Y;
          e.y = Math.min(targetY, e.y + dt * 80);
          if (e.y >= targetY) {
            e.state = "onbelt";
            e.onBeltAt = simT.current;
          }
        }
        if (e.state === "onbelt") {
          const x = eventTimeToX(e.et, simT.current);
          if (x <= CV_GATE_X + 0.4 && !e.gated) {
            e.gated = true;
            if (lateGateOn && e.et < wm) {
              e.state = "late";
              e.endedAt = simT.current;
              setLateDrawer((arr) => [{ id: e.id, et: e.et, at: e.at, lag: e.at - e.et }, ...arr].slice(0, 6));
              setDroppedLate((n) => n + 1);
              return;
            }
            if (dedupOn && seenIds.current.has(e.id)) {
              e.state = "dup";
              e.endedAt = simT.current;
              e.twinLedgerIdx = seenOrder.current.indexOf(e.id);
              twinLinks.current.push({ id: e.id, fromT: simT.current, ledgerIdx: e.twinLedgerIdx });
              setSnapped((n) => n + 1);
              return;
            }
            e.state = "passed";
            seenIds.current.add(e.id);
            seenOrder.current.unshift(e.id);
            if (seenOrder.current.length > 18) {
              const dropped = seenOrder.current.pop();
              if (dropped) seenIds.current.delete(dropped);
            }
            passedStamps.current.push(e.et);
            rtWindow.push(simT.current);
            setRtTotal((n) => n + 1);
          }
        }
      });

      events.current = events.current.filter((e) => {
        if (e.state === "dup" || e.state === "late") return simT.current - (e.endedAt ?? 0) < 0.55;
        if (e.state === "passed") return eventTimeToX(e.et, simT.current) > -4;
        return true;
      });
      twinLinks.current = twinLinks.current.filter((l) => simT.current - l.fromT < 0.55);

      while (passedStamps.current.length > 0 && passedStamps.current[0] <= wm - 0.05) {
        passedStamps.current.shift();
        setWhCount((n) => n + 1);
      }

      const oneAgo = simT.current - 1;
      while (rtWindow.length > 0 && rtWindow[0] < oneAgo) rtWindow.shift();
      rtBank += dt;
      if (rtBank > 0.2) {
        rtBank = 0;
        setRtCount(rtWindow.length);
        setDriftSeries((prev) => [...prev, { t: simT.current, rt: rtWindow.length }].slice(-90));
      }

      if (Math.floor(simT.current * 10) % 2 === 0) {
        setLedger([...seenOrder.current]);
      }

      renderStage(events.current, simT.current, twinLinks.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, rate, dupPct, latePct, dedupOn, lateGateOn]);

  useEffect(() => {
    reset();
     
  }, [dedupOn, lateGateOn]);

  const watermarkX = 100 - (CV_WATERMARK_LAG / CV_STAGE_SECONDS) * 100;
  const drift = rtTotal - whCount;
  const spark = useMemo(() => {
    if (driftSeries.length < 2) return "";
    const max = Math.max(1, ...driftSeries.map((p) => p.rt));
    const min = Math.min(0, ...driftSeries.map((p) => p.rt));
    const range = max - min || 1;
    return driftSeries
      .map((p, i) => {
        const x = (i / (driftSeries.length - 1)) * 100;
        const y = 100 - ((p.rt - min) / range) * 100;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [driftSeries]);

  return (
    <Panel
      eyebrow={text("live simulator · streaming boundary", "Live-Simulator · Streaming-Grenze")}
      title={text("The Ingestion Conveyor Belt", "Das Förderband der Datenaufnahme")}
      meta={`${rate}/s · ${text("dup", "Duplikate")} ${dupPct}% · ${text("late", "verspätet")} ${latePct}%`}
      caption={text(`The simulation uses a fixed ${CV_WATERMARK_LAG}-second watermark lag and a discard-late policy. Deduplication and late-data handling are two separate modeled controls.`, `Die Simulation verwendet eine feste Watermark-Verzögerung von ${CV_WATERMARK_LAG} Sekunden und verwirft Nachzügler. Deduplizierung und Nachzüglerbehandlung sind zwei getrennte modellierte Kontrollen.`)}
    >
      <div className="cv-stage" ref={stageRef}>
        <div className="cv-field">
          <svg className="cv-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="cv-grid" x="0" y="0" width="5" height="10" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 10" fill="none" stroke="rgba(11,18,31,0.05)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#cv-grid)" />
            <line x1="0" y1={CV_BASELINE_Y} x2="100" y2={CV_BASELINE_Y} stroke="rgba(11,18,31,0.14)" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <rect x="0" y="0" width={watermarkX} height="100" fill="rgba(49,162,76,0.04)" />
            <line x1={watermarkX} y1="0" x2={watermarkX} y2="100" stroke="#B8770A" strokeWidth="1.5" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
            <line x1={CV_GATE_X} y1="0" x2={CV_GATE_X} y2="100" stroke="#2D7DFF" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
            <rect x={CV_GATE_X - 3} y="60" width="6" height="18" fill="rgba(45,125,255,0.12)" stroke="#2D7DFF" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="cv-labels">
            <div className="cv-label-settled" style={{ left: 0, width: `${watermarkX}%` }}>
              ◄ {text("SETTLED · behind watermark", "ABGESCHLOSSEN · hinter der Watermark")}
            </div>
            <div className="cv-label-watermark" style={{ left: `${watermarkX}%` }}>
              WATERMARK
              <br />
              <span>now − {CV_WATERMARK_LAG}s</span>
            </div>
            <div className="cv-label-gate" style={{ left: `${CV_GATE_X}%` }}>
              <div className="g">{text("GATE", "SCHRANKE")}</div>
              <div className="gsub">{dedupOn && lateGateOn ? text("dedup · late", "Deduplizierung · Verspätung") : dedupOn ? text("dedup only", "nur Deduplizierung") : lateGateOn ? text("late only", "nur Verspätung") : text("pass-all", "alles durchlassen")}</div>
            </div>
            <div className="cv-label-now">{text("NOW", "JETZT")} ►</div>
          </div>
          <div className="cv-events-layer" ref={eventsLayerRef} />
          <svg className="cv-links-svg" viewBox="0 0 100 100" preserveAspectRatio="none" ref={linksSvgRef} />
        </div>
        <div className="cv-ledger">
          <div className="cv-ledger-head">
            <span>{text("SEEN", "GESEHEN")}</span>
            <span className="n">{ledger.length}</span>
          </div>
          <div className="cv-ledger-body">
            {ledger.length === 0 ? (
              <div className="empty">{text("ledger empty", "Register leer")}</div>
            ) : (
              ledger.map((id, i) => (
                <div key={id + "-" + i} className="cv-ledger-row">
                  <span className="i">{i + 1}</span>
                  <code>{id}</code>
                </div>
              ))
            )}
          </div>
          <div className="cv-ledger-foot">{dedupOn ? text("dedup by event_id · on", "Deduplizierung nach event_id · aktiv") : text("dedup · OFF", "Deduplizierung · AUS")}</div>
        </div>
      </div>

      {!beginner && (
        <div className="cv-drawer-2">
          <div className="cv-drawer-head">
            <span className="k">{text("LATE DRAWER", "VERSPÄTETE EREIGNISSE")}</span>
            <span className="c">{lateDrawer.length}</span>
            <span className="h">{text("events arrived after their window closed", "Ereignisse trafen nach Schließung ihres Fensters ein")}</span>
          </div>
          <div className="cv-drawer-rows">
            {lateDrawer.length === 0 ? (
              <div className="empty">{text("no late events in the window", "keine verspäteten Ereignisse im Fenster")}</div>
            ) : (
              lateDrawer.map((e, i) => (
                <div key={i} className="cv-late-row">
                  <code>{e.id}</code>
                  <span className="et">{text("event-time", "Ereigniszeit")} t={e.et.toFixed(1)}s</span>
                  <span className="lag">+{e.lag.toFixed(1)}s {text("late", "verspätet")}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className={`cv-readouts ${beginner ? "cv-readouts-beginner" : ""}`}>
        <div className="cv-r cv-r-rt">
          <div className="k">{text("Scenario rate (events/s)", "Szenariorate (Ereignisse/s)")}</div>
          <div className="v">{rtCount}</div>
          <div className="s">{text("1-second rolling window · jittery", "gleitendes 1-Sekunden-Fenster · schwankend")}</div>
        </div>
        <div className="cv-r cv-r-wh">
          <div className="k">Warehouse · {text("settled rows", "abgeschlossene Zeilen")}</div>
          <div className="v">{whCount.toLocaleString()}</div>
          <div className="s">{text("event-time", "Ereigniszeit")} ≤ Watermark · {text("stable", "stabil")}</div>
        </div>
        {!beginner && (
          <div className={`cv-r ${Math.abs(drift) > 8 ? "warn" : ""}`}>
            <div className="k">{text("Passed − settled", "Passiert − abgeschlossen")}</div>
            <div className="v">
              {drift >= 0 ? "+" : ""}
              {drift}
            </div>
            <div className="s">{text("in-flight (passed, not yet behind watermark)", "in Bearbeitung (passiert, noch nicht hinter der Watermark)")}</div>
            <svg className="cv-spark" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={spark} stroke="var(--accent)" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
        )}
        <div className={`cv-r cv-r-gate ${snapped + droppedLate > 0 ? "danger" : ""}`}>
          <div className="k">{text("Gate actions", "Schrankenaktionen")}</div>
          <div className="v cv-gate-nums">
            <span>
              <b>{snapped}</b> {text("dedup", "Deduplizierung")}
            </span>
            {!beginner && (
              <span>
                <b>{droppedLate}</b> {text("late", "verspätet")}
              </span>
            )}
          </div>
          <div className="s">{text("blocked at the boundary", "an der Grenze blockiert")}</div>
        </div>
      </div>

      <label className="cv-mode">
        <input type="checkbox" checked={beginner} onChange={(e) => setBeginner(e.target.checked)} />
        <span className="cv-mode-name">{text("Beginner mode", "Einsteigermodus")}</span>
        <span className="cv-mode-sub">{beginner ? text("focus on dedup only · late drawer hidden", "nur Deduplizierung · verspätete Ereignisse ausgeblendet") : text("all guards visible", "alle Schranken sichtbar")}</span>
      </label>

      <div className="cv-ctls">
        <div className="cv-guards">
          <label className={`cv-guard ${dedupOn ? "on" : ""}`}>
            <input type="checkbox" checked={dedupOn} onChange={(e) => setDedupOn(e.target.checked)} />
            <div>
              <div className="n">
                {text("Dedup by", "Deduplizierung nach")} <code>event_id</code>
              </div>
              <div className="d">{text("Suppress events whose id the gate has already passed", "Ereignisse unterdrücken, deren ID die Schranke bereits passiert hat")}</div>
            </div>
          </label>
          {!beginner && (
            <label className={`cv-guard ${lateGateOn ? "on" : ""}`}>
              <input type="checkbox" checked={lateGateOn} onChange={(e) => setLateGateOn(e.target.checked)} />
              <div>
                <div className="n">{text("Drop late (past watermark)", "Verspätete Ereignisse verwerfen (hinter der Watermark)")}</div>
                <div className="d">{text("Events whose event-time trails the watermark at arrival", "Ereignisse, deren Ereigniszeit beim Eintreffen hinter der Watermark liegt")}</div>
              </div>
            </label>
          )}
        </div>
        <div className="cv-sliders">
          <div className="cv-slider">
            <div className="row">
              <label className="lab" htmlFor="conveyor-event-rate">{text("Event rate", "Ereignisrate")}</label>
              <span className="val">{rate}/s</span>
            </div>
            <input id="conveyor-event-rate" type="range" min={3} max={60} value={rate} onChange={(e) => setRate(+e.target.value)} />
          </div>
          <div className="cv-slider warn">
            <div className="row">
              <label className="lab" htmlFor="conveyor-duplicate-rate">{text("Duplicate %", "Duplikate %")}</label>
              <span className="val">{dupPct}%</span>
            </div>
            <input id="conveyor-duplicate-rate" type="range" min={0} max={45} value={dupPct} onChange={(e) => setDupPct(+e.target.value)} />
          </div>
          {!beginner && (
            <div className="cv-slider warn">
              <div className="row">
                <label className="lab" htmlFor="conveyor-late-rate">{text("Late %", "Verspätet %")}</label>
                <span className="val">{latePct}%</span>
              </div>
              <input id="conveyor-late-rate" type="range" min={0} max={35} value={latePct} onChange={(e) => setLatePct(+e.target.value)} />
            </div>
          )}
        </div>
        <div className="cv-btns">
          <button type="button" className="btn btn-primary" onClick={toggleRunning}>
            {running ? text("⏸ Pause", "⏸ Pausieren") : text("▶ Start", "▶ Starten")}
          </button>
          <button type="button" className="btn" onClick={reset}>
            {text("↻ Reset", "↻ Zurücksetzen")}
          </button>
        </div>
      </div>
    </Panel>
  );
}

export default ConveyorSim;
