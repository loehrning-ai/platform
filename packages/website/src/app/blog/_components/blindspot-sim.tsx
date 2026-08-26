"use client";

import { useMemo, useState } from "react";

interface AxisCfg {
  readonly key: string;
  readonly short: string;
  readonly name: string;
  readonly scraped: number;
  readonly self: number;
  readonly color: string;
}

const AXES: readonly AxisCfg[] = [
  {
    key: "daten",
    short: "Daten",
    name: "Datenfundament",
    scraped: 0.2,
    self: 0.8,
    color: "#7C3AED",
  },
  {
    key: "tech",
    short: "Tech",
    name: "Technologie",
    scraped: 0.7,
    self: 0.3,
    color: "#1E40AF",
  },
  {
    key: "org",
    short: "Org",
    name: "Organisation",
    scraped: 0.4,
    self: 0.6,
    color: "#B45309",
  },
  {
    key: "strat",
    short: "Strat",
    name: "Strategie",
    scraped: 0.3,
    self: 0.7,
    color: "#C4431A",
  },
  {
    key: "comp",
    short: "Comp",
    name: "Compliance",
    scraped: 0.5,
    self: 0.5,
    color: "#065F46",
  },
];

const THRESHOLD = 20;

function scanId(seed: number): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 8; i++) {
    const n = Math.floor(Math.abs(Math.sin(seed + i) * 1e4)) % 16;
    s += hex[n];
  }
  return s;
}

function narrativeFor(
  sc: number,
  se: number,
  delta: number,
  name: string,
): string {
  if (delta >= THRESHOLD) {
    if (se > sc) {
      return `${name}: Die Innensicht liegt bei ${se}/100, die Außensicht bei ${sc}/100. Die Differenz kann auf interne Werkzeuge ohne öffentliche Spuren oder auf ambitionierte Pläne hinweisen.`;
    }
    return `${name}: Die Außensicht (${sc}/100) liegt deutlich über der Innensicht (${se}/100). Das kann auf sichtbare technische Aktivität hinweisen, die intern noch nicht als Reife wahrgenommen wird.`;
  }
  if (delta < 5)
    return "Außensicht und Innensicht stimmen fast überein. Die Einschätzung ist in diesem Modell stabil.";
  if (delta < 10)
    return "Leichte Abweichung zwischen Außen und Innen. Das liegt im normalen Rauschbereich.";
  return "Moderate Differenz, aber nicht groß genug um als Blindspot markiert zu werden.";
}

export function BlindspotSim() {
  const [axisKey, setAxisKey] = useState<string>("daten");
  const [scraped, setScraped] = useState(34);
  const [self, setSelf] = useState(78);

  const axis = useMemo(
    () => AXES.find((a) => a.key === axisKey) ?? AXES[0]!,
    [axisKey],
  );
  const delta = Math.abs(scraped - self);
  const combined =
    Math.round((scraped * axis.scraped + self * axis.self) * 10) / 10;
  const flagged = delta >= THRESHOLD;
  const tag = !flagged
    ? "Kein Blindspot"
    : self > scraped
      ? "! Blindspot · Überschätzung"
      : "! Blindspot · Unterschätzung";

  const id = useMemo(
    () => scanId(scraped * 1000 + self * 13 + axis.key.length),
    [scraped, self, axis.key],
  );

  return (
    <div
      className="sim"
      style={{ ["--sim-color" as string]: axis.color } as React.CSSProperties}
    >
      <div className="sim__controls">
        <div
          className="sim__axis-switch"
          role="group"
          aria-label="Achse wählen"
        >
          {AXES.map((a) => (
            <button
              type="button"
              key={a.key}
              className={`sim__axis-btn${axisKey === a.key ? " active" : ""}`}
              data-axis={a.key}
              aria-pressed={axisKey === a.key}
              onClick={() => setAxisKey(a.key)}
            >
              {a.short}
            </button>
          ))}
        </div>

        <div>
          <div className="sim__slider-label">
            <span>
              Außensicht
              <br />
              <span style={{ color: "var(--muted)", fontSize: 12 }}>
                öffentliche Signale
              </span>
            </span>
            <span className="v">{scraped}</span>
          </div>
          <input
            type="range"
            className="sim__slider"
            min={0}
            max={100}
            value={scraped}
            onChange={(e) => setScraped(Number(e.target.value))}
            aria-label="Außensicht, 0 bis 100"
          />
        </div>
        <div>
          <div className="sim__slider-label">
            <span>
              Selbsteinschätzung
              <br />
              <span style={{ color: "var(--muted)", fontSize: 12 }}>
                interne Sicht
              </span>
            </span>
            <span className="v">{self}</span>
          </div>
          <input
            type="range"
            className="sim__slider"
            min={0}
            max={100}
            value={self}
            onChange={(e) => setSelf(Number(e.target.value))}
            aria-label="Selbsteinschätzung, 0 bis 100"
          />
        </div>
        <div className="sim__weights">
          Achse: <b>{axis.name}</b> · Gewichte:{" "}
          <b>{Math.round(axis.scraped * 100)}%</b> Scraped /{" "}
          <b>{Math.round(axis.self * 100)}%</b> Selbst
        </div>
      </div>

      <div className={`sim__readout${flagged ? " sim__readout--flagged" : ""}`}>
        <div className="sim__scanid">Scan #{id}</div>
        <div className="sim__tag">{tag}</div>
        <div className="sim__delta">{delta}</div>
        <div className="sim__delta-label">Punkte Differenz · Schwelle: 20</div>
        <p className="sim__narrative">
          {narrativeFor(scraped, self, delta, axis.name)}
        </p>
        <div className="sim__combined">
          <span className="sim__combined-label">Kombinierter Achsen-Score</span>
          <span className="sim__combined-val">{combined}</span>
        </div>
      </div>
    </div>
  );
}
