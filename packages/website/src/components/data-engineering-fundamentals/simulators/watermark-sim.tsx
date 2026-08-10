"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";
import { useControllableAnimation } from "@/lib/animation-policy";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── WatermarkSim ─────────────────────────────────
// Ported from `src/chapters/Ch1_Ingest.js`: drag the watermark line to see
// which late events get dropped from the window.

interface SimEvent {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly born: number;
  readonly late: boolean;
}

const INITIAL_WATERMARK = 720;

export function WatermarkSim() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [watermark, setWatermark] = useState(INITIAL_WATERMARK);
  const { running, toggle: toggleRunning } = useControllableAnimation();
  const [events, setEvents] = useState<readonly SimEvent[]>([]);
  const [lateness, setLateness] = useState(20);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const viewport = stageScrollRef.current;
      const stage = stageRef.current;
      if (!viewport || !stage || viewport.scrollWidth <= viewport.clientWidth) return;
      const watermarkX = (INITIAL_WATERMARK / 1000) * stage.clientWidth;
      viewport.scrollLeft = Math.max(0, watermarkX - viewport.clientWidth / 2);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setEvents((prev) => {
        const next = [...prev];
        const now = Date.now();
        for (let i = 0; i < 3; i++) {
          const isLate = Math.random() * 100 < lateness;
          const eventTime = isLate ? 180 + Math.random() * 440 : 620 + Math.random() * 220;
          next.push({ id: now + i + Math.random(), x: eventTime, y: 60 + Math.random() * 280, born: Date.now(), late: isLate });
        }
        return next.filter((e) => Date.now() - e.born < 8000).slice(-90);
      });
    }, 420);
    return () => clearInterval(iv);
  }, [running, lateness]);

  const onDragStart = () => {
    const rect = stageRef.current!.getBoundingClientRect();
    const move = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      setWatermark(Math.max(140, Math.min(940, x * (1000 / rect.width))));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const included = events.filter((e) => e.x < watermark).length;
  const dropped = events.filter((e) => e.x >= watermark && e.late).length;
  const mode = watermark > 800 ? "wide" : watermark > 520 ? "middle" : "tight";
  const modeLabel = mode === "wide" ? text("wide window", "weites Fenster") : mode === "middle" ? text("middle window", "mittleres Fenster") : text("tight window", "enges Fenster");

  return (
    <Panel
      eyebrow={text("live simulator", "Live-Simulator")}
      title={text("kafka-to-warehouse · drag the watermark", "Kafka zum Warehouse · Watermark verschieben")}
      meta={`${events.length} ${text("events buffered", "Ereignisse gepuffert")}`}
      caption={text("This simulator uses a discard-late policy. Green events arrive before the modeled watermark; amber events arrive after it.", "Dieser Simulator verwirft Nachzügler. Grüne Ereignisse treffen vor der modellierten Watermark ein, gelbe danach.")}
    >
      <div
        className="wm-stage-scroll"
        role="region"
        aria-label={text("Event-time and watermark timeline", "Zeitleiste für Ereigniszeit und Watermark")}
        tabIndex={0}
        data-course-horizontal-scroll
        ref={stageScrollRef}
      >
        <div className="wm-stage" ref={stageRef}>
          <svg className="wm-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
          <line x1={60} y1={360} x2={960} y2={360} stroke="var(--theme-gray-300)" strokeWidth={1} />
          <line x1={60} y1={40} x2={60} y2={360} stroke="var(--theme-gray-300)" strokeWidth={1} />
          <text x={500} y={390} textAnchor="middle" className="wm-axis-label">
            {text("event time", "Ereigniszeit")} →
          </text>
          <text x={30} y={200} textAnchor="middle" transform="rotate(-90 30 200)" className="wm-axis-label">
            {text("session", "Sitzung")}
          </text>
          {[200, 400, 600, 800].map((x) => (
            <g key={x}>
              <line x1={x} y1={356} x2={x} y2={364} stroke="var(--theme-gray-400)" />
              <text x={x} y={380} textAnchor="middle" className="wm-tick">
                t−{Math.round((1000 - x) / 100)}m
              </text>
            </g>
          ))}
          {events.map((e) => {
            const age = (Date.now() - e.born) / 8000;
            const inc = e.x < watermark;
            return (
              <circle
                key={e.id}
                cx={e.x}
                cy={e.y}
                r={5.5}
                className={e.late ? "wm-dot-late" : "wm-dot-ontime"}
                opacity={inc ? 1 - age * 0.7 : 0.22}
              />
            );
          })}
          <rect x={watermark} y={40} width={960 - watermark} height={320} fill="#F7B928" opacity={0.1} />
          <text
            x={(watermark + 960) / 2}
            y={210}
            textAnchor="middle"
            style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", fill: "#8B5C00", opacity: 0.55 }}
          >
            {text("DROPPED", "VERWORFEN")}
          </text>
          <g style={{ cursor: "ew-resize" }} onMouseDown={onDragStart}>
            <line x1={watermark} y1={40} x2={watermark} y2={360} stroke="var(--theme-blue)" strokeWidth={3} />
            <line x1={watermark} y1={40} x2={watermark} y2={360} stroke="transparent" strokeWidth={22} />
            <rect x={watermark - 9} y={30} width={18} height={18} rx={3} fill="var(--theme-blue)" />
            <text
              x={watermark}
              y={22}
              textAnchor="middle"
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 800, fill: "var(--theme-blue)", letterSpacing: "0.08em" }}
            >
              WATERMARK: {text("drag", "ziehen")}
            </text>
          </g>
          </svg>
        </div>
      </div>
      <div className="course-scroll-hint" aria-hidden="true">{text("Scroll horizontally →", "Horizontal scrollen →")}</div>

      <div className="readout-grid">
        <div className="readout ok">
          <div className="r-k">{text("Included", "Enthalten")}</div>
          <div className="r-v">{included}</div>
          <div className="r-s">{text("before watermark", "vor der Watermark")}</div>
        </div>
        <div className="readout warn">
          <div className="r-k">{text("Late · dropped", "Verspätet · verworfen")}</div>
          <div className="r-v">{dropped}</div>
          <div className="r-s">{text("excluded from window", "vom Fenster ausgeschlossen")}</div>
        </div>
        <div className="readout">
          <div className="r-k">Watermark</div>
          <div className="r-v">
            t−{((1000 - watermark) / 100).toFixed(1)}
            <small>m</small>
          </div>
          <div className="r-s">{text("event time", "Ereigniszeit")}</div>
        </div>
        <div className="readout blue">
          <div className="r-k">{text("Mode", "Modus")}</div>
          <div className="r-v" style={{ fontSize: 17, textTransform: "uppercase" }}>
            {modeLabel}
          </div>
          <div className="r-s">{mode === "wide" ? text("more arrivals included · later closure", "mehr Ankünfte enthalten · spätere Schließung") : mode === "middle" ? text("scenario midpoint", "Mittelwert des Szenarios") : text("fewer arrivals included · earlier closure", "weniger Ankünfte enthalten · frühere Schließung")}</div>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 1.5 }}>
          <div className="row">
            <label className="lab" htmlFor="watermark-position">{text("Watermark position", "Watermark-Position")}</label>
            <span className="val">t−{((1000 - watermark) / 100).toFixed(1)}m</span>
          </div>
          <input id="watermark-position" type="range" min={150} max={920} step={5} value={watermark} onChange={(e) => setWatermark(+e.target.value)} />
          <span className="hint">{text("drag the slider or the blue line above", "Regler oder blaue Linie verschieben")}</span>
        </div>
        <div className="ctl-slider warn" style={{ flex: 1 }}>
          <div className="row">
            <label className="lab" htmlFor="watermark-network-lateness">{text("Network lateness", "Netzwerkverzögerung")}</label>
            <span className="val">{lateness}%</span>
          </div>
          <input id="watermark-network-lateness" type="range" min={0} max={60} step={5} value={lateness} onChange={(e) => setLateness(+e.target.value)} />
          <span className="hint">% {text("of events arriving late", "verspätet eintreffende Ereignisse")}</span>
        </div>
        <button type="button" className="btn" onClick={toggleRunning}>
          {running ? text("⏸ Pause stream", "⏸ Stream pausieren") : text("▶ Resume", "▶ Fortsetzen")}
        </button>
      </div>
    </Panel>
  );
}

export default WatermarkSim;
