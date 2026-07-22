"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "../primitives";

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

export function WatermarkSim() {
  const [watermark, setWatermark] = useState(720);
  const [running, setRunning] = useState(true);
  const [events, setEvents] = useState<readonly SimEvent[]>([]);
  const [lateness, setLateness] = useState(20);
  const stageRef = useRef<HTMLDivElement>(null);

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
  const mode = watermark > 800 ? "exact" : watermark > 520 ? "balanced" : "real-time";

  return (
    <Panel
      eyebrow="live simulator"
      title="kafka-to-warehouse · drag the watermark"
      meta={`${events.length} events buffered`}
      caption="Green = on-time. Amber = late. Watermark is the event-time point past which a window is closed and late events are dropped."
    >
      <div className="wm-stage" ref={stageRef}>
        <svg className="wm-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
          <line x1={60} y1={360} x2={960} y2={360} stroke="var(--theme-gray-300)" strokeWidth={1} />
          <line x1={60} y1={40} x2={60} y2={360} stroke="var(--theme-gray-300)" strokeWidth={1} />
          <text x={500} y={390} textAnchor="middle" className="wm-axis-label">
            event time →
          </text>
          <text x={30} y={200} textAnchor="middle" transform="rotate(-90 30 200)" className="wm-axis-label">
            session
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
            DROPPED
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
              WATERMARK: drag
            </text>
          </g>
        </svg>
      </div>

      <div className="readout-grid">
        <div className="readout ok">
          <div className="r-k">Included</div>
          <div className="r-v">{included}</div>
          <div className="r-s">before watermark</div>
        </div>
        <div className="readout warn">
          <div className="r-k">Late · dropped</div>
          <div className="r-v">{dropped}</div>
          <div className="r-s">excluded from window</div>
        </div>
        <div className="readout">
          <div className="r-k">Watermark</div>
          <div className="r-v">
            t−{((1000 - watermark) / 100).toFixed(1)}
            <small>m</small>
          </div>
          <div className="r-s">event time</div>
        </div>
        <div className="readout blue">
          <div className="r-k">Mode</div>
          <div className="r-v" style={{ fontSize: 17, textTransform: "uppercase" }}>
            {mode}
          </div>
          <div className="r-s">{mode === "exact" ? "low loss · high delay" : mode === "balanced" ? "default" : "real-time · lossy"}</div>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 1.5 }}>
          <div className="row">
            <span className="lab">Watermark position</span>
            <span className="val">t−{((1000 - watermark) / 100).toFixed(1)}m</span>
          </div>
          <input type="range" min={150} max={920} step={5} value={watermark} onChange={(e) => setWatermark(+e.target.value)} />
          <span className="hint">drag the slider or the blue line above</span>
        </div>
        <div className="ctl-slider warn" style={{ flex: 1 }}>
          <div className="row">
            <span className="lab">Network lateness</span>
            <span className="val">{lateness}%</span>
          </div>
          <input type="range" min={0} max={60} step={5} value={lateness} onChange={(e) => setLateness(+e.target.value)} />
          <span className="hint">% of events arriving late</span>
        </div>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? "⏸ Pause stream" : "▶ Resume"}
        </button>
      </div>
    </Panel>
  );
}

export default WatermarkSim;
