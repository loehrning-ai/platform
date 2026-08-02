"use client";

import { useEffect, useRef } from "react";

export function TimelineHinge() {
  const hingeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hinge = hingeRef.current;
    if (!hinge) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setTimeout(() => hinge.classList.add("fired"), 400);
          obs.disconnect();
          break;
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(hinge);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="timeline reveal" id="timeline" aria-label="EU AI Act Timeline">
      <div className="timeline__track" id="tl-track">
        <div className="timeline__axis" aria-hidden="true" />
        <div className="timeline__tick past" style={{ left: "8%" }}>
          <div className="timeline__dot" />
          <div className="timeline__date">Aug 2024</div>
          <div className="timeline__event">Gesetz in Kraft</div>
        </div>
        <div className="timeline__tick past" style={{ left: "28%" }}>
          <div className="timeline__dot" />
          <div className="timeline__date">Feb 2025</div>
          <div className="timeline__event">Art. 4: KI-Kompetenz</div>
        </div>
        <div className="timeline__tick past" style={{ left: "48%" }}>
          <div className="timeline__dot" />
          <div className="timeline__date">Aug 2025</div>
          <div className="timeline__event">GPAI-Anbieterpflichten</div>
        </div>
        <div
          ref={hingeRef}
          className="timeline__tick hinge"
          style={{ left: "72%" }}
          id="tl-hinge"
        >
          <div className="timeline__ring" />
          <div className="timeline__dot" />
          <div className="timeline__date">Aug 2026</div>
          <div className="timeline__event">
            Art. 50 Transparenzpflichten
          </div>
        </div>
        <div className="timeline__tick" style={{ left: "92%" }}>
          <div className="timeline__dot" />
          <div className="timeline__date">2027 / 2028</div>
          <div className="timeline__event">Hochrisiko gestaffelt</div>
        </div>
      </div>

      <div className="timeline__legend">
        Ab <b>2. August 2026</b> greifen Art. 50-Transparenzpflichten.
        Parlament und Rat beschlossen für eigenständige Anhang-III-Systeme den{" "}
        <b>2. Dezember 2027</b> und für produktintegrierte Hochrisiko-Systeme
        den <b>2. August 2028</b>. Die Verordnung (EU) 2026/1744 trat am 27. Juli
        2026 in Kraft. Bußgeldrahmen für die meisten
        Pflichten: bis <b>15 Mio. EUR</b> oder <b>3%</b> des weltweiten
        Jahresumsatzes.
      </div>
    </div>
  );
}
