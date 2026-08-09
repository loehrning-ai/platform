"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { mulberry32, randn, round } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── ImputationRace ─────────────────────────────────
//
// Typed port of Ch03_Clean.js's `ImputationRace`. Seeded with
// `mulberry32(19)` for the truth series and `mulberry32(55)` for the
// missingness mask — never reseed or swap for `Math.random()`.

type Method = "mean" | "median" | "ffill" | "knn";

interface TruthPoint {
  readonly x: number;
  readonly y: number;
}

interface ObservedPoint extends TruthPoint {
  readonly missing: boolean;
}

const METHOD_DESC: Record<Method, string> = {
  mean: "Replaces every gap with the global mean. Fast, but erases trend and shrinks variance.",
  median:
    "Less sensitive to extreme observed values than the mean, but still ignores covariate and time structure.",
  ffill:
    "Copies the last known value forward. Its plausibility depends on ordering, gap length, and how quickly the process changes.",
  knn: "Averages the 3 nearest observed neighbors by index. It has the smallest error in this fixed construction; index proximity is not a generally valid distance metric.",
};
const METHOD_DESC_DE: Record<Method, string> = {
  mean: "Ersetzt jede Lücke durch den globalen Mittelwert. Das ist schnell, entfernt aber Trends und verringert die Varianz.",
  median:
    "Reagiert weniger stark auf extreme beobachtete Werte als der Mittelwert, ignoriert aber ebenfalls Kovariaten- und Zeitstruktur.",
  ffill:
    "Übernimmt den letzten bekannten Wert. Die Plausibilität hängt von Reihenfolge, Lückenlänge und Änderungsgeschwindigkeit des Prozesses ab.",
  knn: "Mittelt die 3 nach Index nächstgelegenen beobachteten Nachbarn. In dieser festen Konstruktion ist der Fehler am kleinsten; Indexnähe ist keine allgemein gültige Distanzmetrik.",
};
const METHOD_LABELS_DE: Record<Method, string> = {
  mean: "Mittelwert",
  median: "Median",
  ffill: "Forward Fill",
  knn: "KNN",
};

export function ImputationRace() {
  const { locale, text } = useDataScienceLocale();
  const [method, setMethod] = useState<Method>("mean");

  const truth = useMemo<readonly TruthPoint[]>(() => {
    const rng = mulberry32(19);
    return Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: 20 + 0.9 * i + 7 * randn(rng),
    }));
  }, []);

  const observed = useMemo<readonly ObservedPoint[]>(() => {
    const rng = mulberry32(55);
    return truth.map((d) => ({ ...d, missing: rng() < 0.2 }));
  }, [truth]);

  const obs = observed.filter((d) => !d.missing).map((d) => d.y);
  const mean = obs.reduce((a, b) => a + b, 0) / obs.length;
  const sorted = [...obs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;

  const imputed = useMemo(() => {
    return observed.map((d) => {
      if (!d.missing) return null;
      if (method === "mean") return mean;
      if (method === "median") return median;
      if (method === "ffill") {
        let last: number | null = null;
        for (let i = d.x - 1; i >= 0; i--) {
          const candidate = observed[i];
          if (candidate && !candidate.missing) {
            last = candidate.y;
            break;
          }
        }
        return last !== null ? last : (obs[0] ?? 0);
      }
      if (method === "knn") {
        const neighbors = observed
          .filter((o) => !o.missing)
          .map((o) => ({ dist: Math.abs(o.x - d.x), y: o.y }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);
        return neighbors.reduce((a, n) => a + n.y, 0) / neighbors.length;
      }
      return mean;
    });
  }, [observed, method, mean, median, obs]);

  const W = 400;
  const H = 180;
  const PAD = 20;
  const xScale = (x: number) => PAD + x * ((W - PAD * 2) / 50);
  const yMin = 10;
  const yMax = 75;
  const yScale = (y: number) =>
    H - PAD - ((y - yMin) / (yMax - yMin)) * (H - PAD * 2);

  const mae = useMemo(() => {
    const errs = observed
      .map((d, i) => (d.missing ? Math.abs((imputed[i] ?? 0) - d.y) : null))
      .filter((e): e is number => e !== null);
    return errs.length
      ? round(errs.reduce((a, b) => a + b, 0) / errs.length, 1)
      : 0;
  }, [observed, imputed]);

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Imputation Race", "Imputationsverfahren vergleichen")}
      meta={text("20% MCAR · MAE vs truth", "20% MCAR · MAE gegen wahre Werte")}
      caption={text(
        "Yellow dots = imputed values. Hollow circles = true missing values underneath. Lower MAE = closer to truth.",
        "Gelbe Punkte zeigen imputierte Werte. Leere Kreise markieren die darunterliegenden wahren Werte. Ein kleinerer MAE liegt näher an der Wahrheit.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Method", "Verfahren")}</label>
            <div className="seg" style={{ flexWrap: "wrap" }}>
              {(["mean", "median", "ffill", "knn"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={method === m ? "on" : ""}
                  onClick={() => setMethod(m)}
                >
                  {locale === "de" ? METHOD_LABELS_DE[m] : m}
                </button>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 12.5, margin: 0 }}>
            {locale === "de" ? METHOD_DESC_DE[method] : METHOD_DESC[method]}
          </p>
          <div className="sim-stats" style={{ marginTop: 12 }}>
            <div>
              <div className="k">
                {text("MAE (imputed vs true)", "MAE (imputiert gegen wahr)")}
              </div>
              <div
                className="v"
                style={{
                  color: mae < 5 ? "var(--lime-ink)" : "var(--coral-ink)",
                }}
              >
                {mae}
              </div>
            </div>
            <div>
              <div className="k">{text("Missing pts", "Fehlende Punkte")}</div>
              <div className="v">
                {observed.filter((d) => d.missing).length}
              </div>
            </div>
          </div>
          <div className="galton-note">
            <span className="tag-pill">{text("Tip", "Hinweis")}</span>
            {text(
              "KNN tracks the linear trend. Mean/median ignore it, notice the flat cluster of yellow dots.",
              "KNN folgt dem linearen Trend. Mittelwert und Median ignorieren ihn; ihre gelben Punkte bilden eine flache Gruppe.",
            )}
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <line
              x1={PAD}
              y1={H - PAD}
              x2={W - PAD}
              y2={H - PAD}
              stroke="#A49D9A"
              strokeWidth="0.8"
            />
            <line
              x1={PAD}
              y1={PAD}
              x2={PAD}
              y2={H - PAD}
              stroke="#A49D9A"
              strokeWidth="0.8"
            />
            {observed
              .filter((d) => !d.missing)
              .map((d) => (
                <circle
                  key={d.x}
                  cx={xScale(d.x)}
                  cy={yScale(d.y)}
                  r="2.5"
                  fill="#4DE2FF"
                  opacity="0.85"
                />
              ))}
            {observed
              .filter((d) => d.missing)
              .map((d) => (
                <circle
                  key={"t" + d.x}
                  cx={xScale(d.x)}
                  cy={yScale(d.y)}
                  r="3.5"
                  fill="none"
                  stroke="#A49D9A"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
              ))}
            {observed.map((d, i) =>
              d.missing && imputed[i] != null ? (
                <circle
                  key={"imp" + d.x}
                  cx={xScale(d.x)}
                  cy={yScale(imputed[i] ?? 0)}
                  r="4"
                  fill="#D1FF3A"
                  opacity="0.9"
                />
              ) : null,
            )}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default ImputationRace;
