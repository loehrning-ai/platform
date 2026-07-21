"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "../primitives";

// ─── ShuffleSim (plan 011 stage 6) ───────────────────────────────────
// Ported from `src/chapters/Ch3_Compute.js`: hash vs broadcast join, key
// skew slider drives one worker "hot" while the rest idle.

type Strategy = "hash" | "broadcast";

interface Particle {
  readonly id: string;
  readonly target: number;
  readonly delay: number;
  readonly side: number;
}

export function ShuffleSim() {
  const [skew, setSkew] = useState(20);
  const [workers, setWorkers] = useState(6);
  const [strategy, setStrategy] = useState<Strategy>("hash");
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setTick((t) => t + 1), 380);
    return () => clearInterval(iv);
  }, [running]);

  const loads = useMemo(() => {
    const n = workers;
    const arr = Array<number>(n).fill(100);
    if (strategy === "hash") {
      const extra = skew * 10;
      arr[0] += extra;
      for (let i = 1; i < n; i++) arr[i] -= extra / (n - 1);
    } else {
      for (let i = 0; i < n; i++) arr[i] += 40;
    }
    return arr.map((v) => Math.max(30, v));
  }, [skew, workers, strategy]);

  const max = Math.max(...loads);
  const overloaded = loads.map((l) => l > 260);

  const particles = useMemo<readonly Particle[]>(() => {
    const arr: Particle[] = [];
    const count = strategy === "broadcast" ? 14 : 12;
    for (let i = 0; i < count; i++) {
      let target: number;
      if (strategy === "hash") target = Math.random() < skew / 100 ? 0 : Math.floor(Math.random() * workers);
      else target = Math.floor(Math.random() * workers);
      arr.push({ id: `${tick}-${i}`, target, delay: (i * 40) % 400, side: i % 2 });
    }
    return arr;
     
  }, [tick, skew, workers, strategy]);

  const workerX = (i: number) => 140 + i * ((880 - 140) / Math.max(1, workers - 1));
  const leftSrcX = 70;
  const rightSrcX = 920;
  const p95 = Math.round(max * 2);
  const health = overloaded.some(Boolean) ? "overloaded" : loads.every((l) => l < 180) ? "healthy" : "busy";
  const healthColor = health === "overloaded" ? "danger" : health === "busy" ? "warn" : "ok";

  return (
    <Panel
      eyebrow="live simulator · query planner"
      title="Shuffles & joins, in motion"
      meta={`${workers} workers`}
      caption="Rows fly from source tables to workers. Push skew up until worker 0 chokes: that's the hashtag doing 80% of impressions."
    >
      <div className="qp-stage">
        <svg className="qp-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
          <g>
            <rect x={leftSrcX - 50} y={60} width={100} height={40} rx={8} fill="#fff" stroke="var(--theme-gray-300)" />
            <text x={leftSrcX} y={85} textAnchor="middle" className="qp-lab-big">
              events
            </text>
            <text x={leftSrcX} y={115} textAnchor="middle" className="qp-lab-small">
              50M rows
            </text>
          </g>
          <g>
            <rect x={rightSrcX - 50} y={60} width={100} height={40} rx={8} fill="#fff" stroke="var(--theme-gray-300)" />
            <text x={rightSrcX} y={85} textAnchor="middle" className="qp-lab-big">
              users
            </text>
            <text x={rightSrcX} y={115} textAnchor="middle" className="qp-lab-small">
              {strategy === "broadcast" ? "~10K (small)" : "2.1B rows"}
            </text>
          </g>
          <text x={500} y={150} textAnchor="middle" className="qp-lab-small" fill="var(--theme-blue)" style={{ fontWeight: 700, letterSpacing: "0.08em" }}>
            {strategy === "hash" ? "HASH PARTITION ON user_id" : "BROADCAST (small side replicated)"}
          </text>
          {loads.map((load, i) => {
            const x = workerX(i);
            const h = Math.min(180, Math.max(40, load * 0.6));
            const y = 420 - h;
            const isOverloaded = overloaded[i];
            const col = isOverloaded ? "var(--theme-red)" : load > 180 ? "#F7B928" : "var(--theme-blue)";
            const barOpacity = isOverloaded ? 0.9 : overloaded.some(Boolean) ? 0.38 : 0.85;
            return (
              <g key={i} className={isOverloaded ? "qp-overload" : ""}>
                <rect x={x - 30} y={y} width={60} height={h} rx={6} fill={col} opacity={barOpacity} />
                <rect x={x - 30} y={420} width={60} height={14} rx={3} fill="var(--theme-gray-300)" />
                {isOverloaded && (
                  <text x={x} y={y - 28} textAnchor="middle" className="qp-overload-label">
                    OVERLOADED
                  </text>
                )}
                <text x={x} y={460} textAnchor="middle" className="qp-lab-big">
                  W{i}
                </text>
                <text x={x} y={478} textAnchor="middle" className="qp-lab-small">
                  {Math.round(load)}MB
                </text>
              </g>
            );
          })}
          {particles.map((p) => {
            const tx = workerX(p.target);
            const srcX = p.side === 0 ? leftSrcX : rightSrcX;
            return (
              <circle key={p.id} cx={srcX} cy={100} r={4} fill="var(--theme-blue)">
                <animate
                  attributeName="cx"
                  from={srcX}
                  to={tx}
                  dur="0.9s"
                  begin={`${p.delay}ms`}
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.32 0.72 0 1"
                />
                <animate
                  attributeName="cy"
                  from={100}
                  to={400 - loads[p.target] * 0.6 + 8}
                  dur="0.9s"
                  begin={`${p.delay}ms`}
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.32 0.72 0 1"
                />
                <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="0.9s" begin={`${p.delay}ms`} fill="freeze" />
              </circle>
            );
          })}
        </svg>
      </div>

      <div className="readout-grid">
        <div className={`readout ${healthColor}`}>
          <div className="r-k">Status</div>
          <div className="r-v" style={{ fontSize: 18, textTransform: "uppercase" }}>
            {health}
          </div>
          <div className="r-s">{overloaded.filter(Boolean).length} node(s) overloaded</div>
        </div>
        <div className="readout">
          <div className="r-k">Max shuffle</div>
          <div className="r-v">
            {Math.round(max)}
            <small>MB</small>
          </div>
          <div className="r-s">worker 0</div>
        </div>
        <div className="readout">
          <div className="r-k">p95 latency</div>
          <div className="r-v">
            {p95}
            <small>ms</small>
          </div>
          <div className="r-s">sim estimate</div>
        </div>
        <div className="readout blue">
          <div className="r-k">Strategy</div>
          <div className="r-v" style={{ fontSize: 17, textTransform: "uppercase" }}>
            {strategy}
          </div>
          <div className="r-s">{strategy === "hash" ? "network heavy" : "memory heavy"}</div>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 1.2 }}>
          <div className="row">
            <span className="lab">Key skew</span>
            <span className="val">{skew}%</span>
          </div>
          <input type="range" min={0} max={90} step={1} value={skew} onChange={(e) => setSkew(+e.target.value)} />
          <span className="hint">% of rows landing on the hot key</span>
        </div>
        <div className="ctl-slider" style={{ flex: 1 }}>
          <div className="row">
            <span className="lab">Workers</span>
            <span className="val">{workers}</span>
          </div>
          <input type="range" min={2} max={12} step={1} value={workers} onChange={(e) => setWorkers(+e.target.value)} />
          <span className="hint">parallelism</span>
        </div>
        <div className="ctl-group">
          <div className="ctl-lab">Join strategy</div>
          <div className="pill-row">
            <button className={`pill ${strategy === "hash" ? "on" : ""}`} onClick={() => setStrategy("hash")}>
              Hash
            </button>
            <button className={`pill ${strategy === "broadcast" ? "on" : ""}`} onClick={() => setStrategy("broadcast")}>
              Broadcast
            </button>
          </div>
        </div>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? "⏸ Pause" : "▶ Run"}
        </button>
      </div>
    </Panel>
  );
}

export default ShuffleSim;
