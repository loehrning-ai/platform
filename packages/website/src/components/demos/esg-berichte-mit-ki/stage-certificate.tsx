"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import { BIO } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { probeAt, seg } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import { CheckChips, DocCard, StatusTag } from "./parts";

export type Bet = "yes" | "no";

/** On a short phone screen: the operator line and the cellar line step back for the bet, */
const SATZ_OPTIONAL = [5, 11] as const;
/** and the probe keeps the four lines it cites: body (4), scope (6), validity (8), note (10). */
const PROBE_OPTIONAL = [3, 5, 7, 9, 11] as const;

/** Beat 1 and 2: "Zertifizierte Bio-Weinberge" next to bio_zertifikat_weinberg.txt. */
export function CertificateStage({
  pack,
  mode,
  progress,
  bet,
}: {
  readonly pack: Pack;
  /** "satz": the bet, with the intro; "probe": the four checks as a function of t. */
  readonly mode: "satz" | "probe";
  readonly progress: number;
  readonly bet: Bet | null;
}) {
  if (mode === "satz") {
    const card = seg(progress, 0, 0.35);
    const doc = seg(progress, 0.2, 0.6);
    return (
      <div className="nw-stage" data-scene="satz">
        <p className="nw-kicker">{pack.satz1.kicker}</p>
        <p className="nw-sentence" style={{ transform: `translateY(${(1 - card) * 12}px)`, opacity: 0.2 + 0.8 * card }}>
          {pack.satz1.text}
        </p>
        <DocCard
          file={pack.satz1.file}
          lines={pack.satz1.lines}
          optional={SATZ_OPTIONAL}
          className="nw-doc-cert nw-doc-tight"
          style={{ transform: `translateY(${(1 - doc) * 16}px)`, opacity: doc }}
        />
        <p className="nw-footnote">{pack.stichtag}</p>
      </div>
    );
  }

  const frame = probeAt(progress);
  const active = frame.stand > 0 && frame.stand < 1 ? 3 : frame.umfang > 0 && frame.umfang < 1 ? 2 : frame.zeitraum > 0 && frame.zeitraum < 1 ? 1 : frame.zitat < 1 ? 0 : undefined;
  const lineClass = (line: number) => {
    if (frame.zeitraum > 0 && line === 8) return frame.zeitraum >= 1 ? "is-fail" : "is-focus";
    if (frame.umfang > 0 && (line === 6 || line === 10 || line === 11)) return frame.umfang >= 1 ? "is-fail" : "is-focus";
    if (frame.zitat > 0 && line <= 8 && frame.zeitraum === 0) return "is-focus";
    if (frame.stand > 0 && (line === 3 || line === 4)) return frame.stand >= 1 ? "is-ok" : "is-focus";
    return undefined;
  };
  const cells = Array.from({ length: BIO.haTotal }, (_, index) => index < frame.cells);
  return (
    <div className="nw-stage" data-scene="probe">
      <div className="nw-sentence-strip">
        <span className="nw-sentence-small">{pack.satz1.text}</span>
      </div>
      <CheckChips pack={pack} marks={["ok", "fail", "fail", "ok"]} shown={[frame.zitat, frame.zeitraum, frame.umfang, frame.stand]} active={active} />
      <DocCard file={pack.satz1.file} lines={pack.satz1.lines} lineClass={lineClass} optional={PROBE_OPTIONAL} className="nw-doc-cert nw-doc-tight" />
      <div className="nw-evidence-band">
        <svg className="nw-ruler" viewBox="0 0 200 52" role="img" aria-label={`${pack.probe.rulerFrom} ${pack.probe.rulerTo} ${fill(pack.probe.overshoot, { days: frame.days })}`}>
          <line x1="4" y1="22" x2={4 + 150 * frame.ruler} y2="22" className="nw-stroke-ink" strokeWidth="4" />
          <line x1="154" y1="22" x2={154 + 38 * frame.overshoot} y2="22" className="nw-stroke-mark" strokeWidth="4" />
          <line x1="4" y1="14" x2="4" y2="30" className="nw-stroke-ink" strokeWidth="1.5" />
          <line x1="154" y1="12" x2="154" y2="32" className="nw-stroke-ink" strokeWidth="1.5" style={{ opacity: frame.ruler }} />
          <line x1="192" y1="12" x2="192" y2="32" className="nw-stroke-mark" strokeWidth="1.5" style={{ opacity: frame.overshoot }} />
          <text x="4" y="9" className="nw-svg-text">{pack.probe.rulerFrom}</text>
          <text x="151" y="9" textAnchor="end" className="nw-svg-text" style={{ opacity: frame.ruler }}>{pack.probe.rulerTo.slice(0, 6)}</text>
          <text x="198" y="9" textAnchor="end" className="nw-svg-text nw-svg-mark" style={{ opacity: frame.overshoot }}>{pack.probe.rulerStichtag}</text>
          <text x="196" y="47" textAnchor="end" className="nw-svg-text nw-svg-mark nw-svg-bold" style={{ opacity: frame.overshoot }}>
            {fill(pack.probe.overshoot, { days: frame.days })}
          </text>
        </svg>
        <svg className="nw-hectares" viewBox="0 0 84 52" role="img" aria-label={pack.probe.hectares}>
          {cells.map((on, index) => (
            <rect
              key={index}
              x={(index % 8) * 10 + 2}
              y={Math.floor(index / 8) * 7 + 2}
              width="8"
              height="5"
              className={on ? "nw-fill-ink" : "nw-stroke-ink nw-cell-open"}
              fill={on ? undefined : "none"}
              strokeWidth="0.75"
            />
          ))}
          <text x="2" y="49" className="nw-svg-text nw-svg-bold" style={{ opacity: frame.umfang }}>{pack.probe.hectares}</text>
        </svg>
      </div>
      <div className="nw-verdict-line" style={{ opacity: frame.verdict, transform: `translateY(${(1 - frame.verdict) * 6}px)` }}>
        <StatusTag status="luecke" pack={pack} />
        <span>{pack.bet.no}</span>
        {bet ? <span className="nw-bet-tag">{fill(pack.bet.yours, { bet: bet === "yes" ? pack.bet.yes : pack.bet.no })}</span> : null}
      </div>
    </div>
  );
}
