"use client";

import { useEffect, useRef } from "react";

interface Region {
  readonly code: string;
  readonly short: string;
  readonly name: string;
  readonly count: number;
}

const REGIONS: readonly Region[] = [
  { code: "SH", short: "SH", name: "Schleswig-Holstein", count: 8 },
  { code: "HH", short: "HH", name: "Hamburg", count: 44 },
  { code: "MV", short: "MV", name: "Mecklenburg-Vorpommern", count: 9 },
  { code: "HB", short: "HB", name: "Bremen", count: 1 },
  { code: "NI", short: "NI", name: "Niedersachsen", count: 40 },
  { code: "BE", short: "BE", name: "Berlin", count: 55 },
  { code: "BB", short: "BB", name: "Brandenburg", count: 6 },
  { code: "NRW", short: "NRW", name: "Nordrhein-Westfalen", count: 157 },
  { code: "HE", short: "HE", name: "Hessen", count: 72 },
  { code: "ST", short: "ST", name: "Sachsen-Anhalt", count: 6 },
  { code: "SN", short: "SN", name: "Sachsen", count: 28 },
  { code: "RP", short: "RP", name: "Rheinland-Pfalz", count: 14 },
  { code: "TH", short: "TH", name: "Thüringen", count: 16 },
  { code: "SL", short: "SL", name: "Saarland", count: 4 },
  { code: "BW", short: "BW", name: "Baden-Württemberg", count: 102 },
  { code: "BY", short: "BY", name: "Bayern", count: 130 },
];

const MAX = 157;

export function RegionalDensity() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cells = Array.from(
      grid.querySelectorAll<HTMLDivElement>(".regional__cell"),
    );

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          cells.forEach((c, i) => {
            const n = Number.parseInt(c.dataset.count ?? "0", 10);
            const ratio = n / MAX;
            const intensity = Math.max(0.04, Math.pow(ratio, 0.6));
            setTimeout(() => {
              c.style.setProperty("--intensity", intensity.toFixed(3));
            }, i * 50);
          });
          obs.disconnect();
          break;
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(grid);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="regional">
      <div ref={gridRef} className="regional__grid" id="regional">
        {REGIONS.map((r) => {
          const ratio = r.count / MAX;
          const intensity = Math.max(0.04, Math.pow(ratio, 0.6));
          const extraClass =
            intensity >= 0.5 ? " dense" : intensity <= 0.12 ? " sparse" : "";
          return (
            <div
              key={r.code}
              className={`regional__cell r-${r.code}${extraClass}`}
              data-count={r.count}
              data-short={r.short}
              data-name={r.name}
              title={`${r.name}: ${r.count} Anbieterauftritte`}
              style={{ ["--intensity" as string]: "0" } as React.CSSProperties}
            >
              <div className="regional__short">{r.short}</div>
              <div className="regional__count">{r.count}</div>
            </div>
          );
        })}
      </div>

      <div className="regional__legend">
        <span>Dichte</span>
        <div className="scale" aria-hidden="true">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((a) => (
            <span key={a} style={{ background: `rgba(196,67,26,${a})` }} />
          ))}
        </div>
        <span>1 → 157 Auftritte</span>
        <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
          n=1.742 DE + 56 Ausland
        </span>
      </div>
    </div>
  );
}
