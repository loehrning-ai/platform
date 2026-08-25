"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "../primitives";
import { useControllableAnimation } from "@/lib/animation-policy";
import { useDataEngineeringFundamentalsLocale } from "../locale-context";

// ─── ShuffleSim ───────────────────────────────────
// Ported from `src/chapters/Ch3_Compute.js`: hash vs broadcast join, key
// skew slider drives one worker "hot" while the rest idle.

type Strategy = "hash" | "broadcast";

interface Particle {
  readonly id: string;
  readonly target: number;
  readonly delay: number;
  readonly side: number;
}

function seededUnit(seed: number): number {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

export function ShuffleSim() {
  const { text } = useDataEngineeringFundamentalsLocale();
  const [skew, setSkew] = useState(20);
  const [workers, setWorkers] = useState(6);
  const [strategy, setStrategy] = useState<Strategy>("hash");
  const { running, toggle: toggleRunning } = useControllableAnimation(false);
  const [hydrated, setHydrated] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !running) return;
    const iv = setInterval(() => setTick((t) => t + 1), 380);
    return () => clearInterval(iv);
  }, [hydrated, running]);

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
    // Particle positions are decorative and time-dependent. Keeping them out of
    // the server and initial client render guarantees identical hydration HTML.
    if (!hydrated) return [];

    const arr: Particle[] = [];
    const count = strategy === "broadcast" ? 14 : 12;
    const seedBase =
      tick * 7_919 +
      skew * 131 +
      workers * 17 +
      (strategy === "broadcast" ? 1_009 : 0);
    for (let i = 0; i < count; i++) {
      let target: number;
      const hotKeyRoll = seededUnit(seedBase + i * 2 + 1);
      const workerRoll = seededUnit(seedBase + i * 2 + 2);
      if (strategy === "hash") {
        target = hotKeyRoll < skew / 100 ? 0 : Math.floor(workerRoll * workers);
      } else {
        target = Math.floor(workerRoll * workers);
      }
      arr.push({
        id: `${tick}-${i}`,
        target,
        delay: (i * 40) % 400,
        side: i % 2,
      });
    }
    return arr;
  }, [hydrated, tick, skew, workers, strategy]);

  const workerX = (i: number) =>
    140 + i * ((880 - 140) / Math.max(1, workers - 1));
  const leftSrcX = 70;
  const rightSrcX = 920;
  const p95 = Math.round(max * 2);
  const health = overloaded.some(Boolean)
    ? "overloaded"
    : loads.every((l) => l < 180)
      ? "healthy"
      : "busy";
  const healthColor =
    health === "overloaded" ? "danger" : health === "busy" ? "warn" : "ok";
  const healthLabel =
    health === "overloaded"
      ? text("overloaded", "überlastet")
      : health === "busy"
        ? text("busy", "ausgelastet")
        : text("healthy", "stabil");

  return (
    <Panel
      eyebrow={text(
        "live simulator · query planner",
        "Live-Simulator · Abfrageplaner",
      )}
      title={text(
        "Shuffles & joins, in motion",
        "Shuffle und Joins in Bewegung",
      )}
      meta={`${workers} Worker`}
      caption={text(
        "Illustrative join model. Adjust skew and strategy; row counts, load units, and latency are scenario inputs rather than engine benchmarks.",
        "Beispielhaftes Join-Modell. Skew und Strategie verändern; Zeilenzahlen, Lasteinheiten und Latenz sind Szenarioeingaben und keine Engine-Benchmarks.",
      )}
    >
      <div className="qp-stage">
        <svg
          className="qp-svg"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <rect
              x={leftSrcX - 50}
              y={60}
              width={100}
              height={40}
              rx={8}
              fill="#fff"
              stroke="var(--theme-gray-300)"
            />
            <text
              x={leftSrcX}
              y={85}
              textAnchor="middle"
              className="qp-lab-big"
            >
              events
            </text>
            <text
              x={leftSrcX}
              y={115}
              textAnchor="middle"
              className="qp-lab-small"
            >
              {text("scenario: 50M rows", "Szenario: 50 Mio. Zeilen")}
            </text>
          </g>
          <g>
            <rect
              x={rightSrcX - 50}
              y={60}
              width={100}
              height={40}
              rx={8}
              fill="#fff"
              stroke="var(--theme-gray-300)"
            />
            <text
              x={rightSrcX}
              y={85}
              textAnchor="middle"
              className="qp-lab-big"
            >
              users
            </text>
            <text
              x={rightSrcX}
              y={115}
              textAnchor="middle"
              className="qp-lab-small"
            >
              {strategy === "broadcast"
                ? `~10K (${text("small", "klein")})`
                : text("scenario: 2.1B rows", "Szenario: 2,1 Mrd. Zeilen")}
            </text>
          </g>
          <text
            x={500}
            y={150}
            textAnchor="middle"
            className="qp-lab-small"
            fill="var(--theme-blue)"
            style={{ fontWeight: 700, letterSpacing: "0.08em" }}
          >
            {strategy === "hash"
              ? "HASH PARTITION ON user_id"
              : `BROADCAST (${text("small side replicated", "kleine Seite repliziert")})`}
          </text>
          {loads.map((load, i) => {
            const x = workerX(i);
            const h = Math.min(180, Math.max(40, load * 0.6));
            const y = 420 - h;
            const isOverloaded = overloaded[i];
            const col = isOverloaded
              ? "var(--theme-red)"
              : load > 180
                ? "#F7B928"
                : "var(--theme-blue)";
            const barOpacity = isOverloaded
              ? 0.9
              : overloaded.some(Boolean)
                ? 0.38
                : 0.85;
            return (
              <g key={i} className={isOverloaded ? "qp-overload" : ""}>
                <rect
                  x={x - 30}
                  y={y}
                  width={60}
                  height={h}
                  rx={6}
                  fill={col}
                  opacity={barOpacity}
                />
                <rect
                  x={x - 30}
                  y={420}
                  width={60}
                  height={14}
                  rx={3}
                  fill="var(--theme-gray-300)"
                />
                {isOverloaded && (
                  <text
                    x={x}
                    y={y - 28}
                    textAnchor="middle"
                    className="qp-overload-label"
                  >
                    {text("OVERLOADED", "ÜBERLASTET")}
                  </text>
                )}
                <text x={x} y={460} textAnchor="middle" className="qp-lab-big">
                  W{i}
                </text>
                <text
                  x={x}
                  y={478}
                  textAnchor="middle"
                  className="qp-lab-small"
                >
                  {Math.round(load)}MB
                </text>
              </g>
            );
          })}
          {particles.map((p) => {
            const tx = workerX(p.target);
            const srcX = p.side === 0 ? leftSrcX : rightSrcX;
            return (
              <circle
                key={p.id}
                cx={srcX}
                cy={100}
                r={4}
                fill="var(--theme-blue)"
              >
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
                <animate
                  attributeName="opacity"
                  values="1;1;0"
                  keyTimes="0;0.85;1"
                  dur="0.9s"
                  begin={`${p.delay}ms`}
                  fill="freeze"
                />
              </circle>
            );
          })}
        </svg>
      </div>

      <div className="readout-grid">
        <div className={`readout ${healthColor}`}>
          <div className="r-k">Status</div>
          <div
            className="r-v"
            style={{ fontSize: 18, textTransform: "uppercase" }}
          >
            {healthLabel}
          </div>
          <div className="r-s">
            {overloaded.filter(Boolean).length}{" "}
            {text("node(s) overloaded", "überlastete Knoten")}
          </div>
        </div>
        <div className="readout">
          <div className="r-k">{text("Max shuffle", "Maximaler Shuffle")}</div>
          <div className="r-v">
            {Math.round(max)}
            <small>MB</small>
          </div>
          <div className="r-s">Worker 0</div>
        </div>
        <div className="readout">
          <div className="r-k">{text("relative latency index", "relativer Latenzindex")}</div>
          <div className="r-v">
            {p95}
            <small>{text("units", "Einheiten")}</small>
          </div>
          <div className="r-s">{text("sim estimate", "Simulationswert")}</div>
        </div>
        <div className="readout blue">
          <div className="r-k">{text("Strategy", "Strategie")}</div>
          <div
            className="r-v"
            style={{ fontSize: 17, textTransform: "uppercase" }}
          >
            {strategy}
          </div>
          <div className="r-s">
            {strategy === "hash"
              ? text("network heavy", "netzwerkintensiv")
              : text("memory heavy", "speicherintensiv")}
          </div>
        </div>
      </div>

      <div className="ctl-row">
        <div className="ctl-slider" style={{ flex: 1.2 }}>
          <div className="row">
            <label className="lab" htmlFor="shuffle-key-skew">
              {text("Key skew", "Schlüssel-Skew")}
            </label>
            <span className="val">{skew}%</span>
          </div>
          <input
            id="shuffle-key-skew"
            type="range"
            min={0}
            max={90}
            step={1}
            value={skew}
            onChange={(e) => setSkew(+e.target.value)}
          />
          <span className="hint">
            %{" "}
            {text(
              "of rows landing on the hot key",
              "der Zeilen auf dem stark belasteten Schlüssel",
            )}
          </span>
        </div>
        <div className="ctl-slider" style={{ flex: 1 }}>
          <div className="row">
            <label className="lab" htmlFor="shuffle-workers">
              Worker
            </label>
            <span className="val">{workers}</span>
          </div>
          <input
            id="shuffle-workers"
            type="range"
            min={2}
            max={12}
            step={1}
            value={workers}
            onChange={(e) => setWorkers(+e.target.value)}
          />
          <span className="hint">{text("parallelism", "Parallelität")}</span>
        </div>
        <div className="ctl-group">
          <div className="ctl-lab">
            {text("Join strategy", "Join-Strategie")}
          </div>
          <div className="pill-row">
            <button
              type="button"
              className={`pill ${strategy === "hash" ? "on" : ""}`}
              onClick={() => setStrategy("hash")}
            >
              Hash
            </button>
            <button
              type="button"
              className={`pill ${strategy === "broadcast" ? "on" : ""}`}
              onClick={() => setStrategy("broadcast")}
            >
              Broadcast
            </button>
          </div>
        </div>
        <button type="button" className="btn" onClick={toggleRunning}>
          {running
            ? text("⏸ Pause", "⏸ Pausieren")
            : text("▶ Run", "▶ Starten")}
        </button>
      </div>
    </Panel>
  );
}

export default ShuffleSim;
