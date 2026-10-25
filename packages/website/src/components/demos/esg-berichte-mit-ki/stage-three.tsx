"use client";

import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/export";
import type { Figures } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { FILE_NAMES, STROM, WASSER } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { verdictAt } from "@/lib/demo-cases/esg-berichte-mit-ki/motion";
import type { Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { CheckChips, DocCard, MonthStrip, StatusTag, type Mark } from "./parts";
import type { Bet } from "./stage-certificate";

/** The draft's header line steps back on a short phone screen; its file name already says draft. */
const DRAFT_OPTIONAL = [3] as const;

/** Beat 4: sentences 2 to 4, one at a time; the checks run after the visitor's call. */
export function ThreeStage({
  pack,
  figures,
  index,
  bet,
  t,
}: {
  readonly pack: Pack;
  readonly figures: Figures;
  /** 0, 1 or 2: sentence 2, 3 or 4. */
  readonly index: number;
  readonly bet: Bet | null;
  /** The verdict clock, 0 before the call. */
  readonly t: number;
}) {
  const sentence = pack.three.sentences[index]!;
  const frame = verdictAt(t);
  const decided = bet !== null;
  const gate = index === 1;
  return (
    <div className="nw-stage" data-scene={`satz-${index + 2}`}>
      <p className="nw-kicker">{sentence.kicker}</p>
      <p className="nw-sentence nw-sentence-mid" data-struck={gate && frame.checks[0] >= 1 ? "" : undefined}>
        {sentence.text}
      </p>
      {sentence.lines.length > 0 ? (
        <DocCard
          file={sentence.file}
          lines={sentence.lines}
          optional={index === 0 ? DRAFT_OPTIONAL : undefined}
          className="nw-doc-tight"
          lineClass={() => (decided && frame.checks[0] > 0 ? (gate ? "is-fail" : "is-focus") : undefined)}
        />
      ) : null}
      {index === 0 ? (
        <div className="nw-strip-wrap">
          <p className="nw-doc-name">{FILE_NAMES.strom[pack.locale === "en" ? "en" : "de"]}</p>
          <MonthStrip rows={STROM} monthsShort={pack.three.monthsShort} twice={pack.three.twice} />
        </div>
      ) : null}
      {index === 2 ? (
        <div className="nw-strip-wrap">
          <p className="nw-doc-name">{sentence.file}</p>
          <MonthStrip rows={WASSER} monthsShort={pack.three.monthsShort} twice={pack.three.twice} />
        </div>
      ) : null}
      {decided ? (
        <>
          <CheckChips pack={pack} marks={sentence.marks as Mark[]} shown={frame.checks} />
          <div className="nw-verdict-line" style={{ opacity: frame.verdict, transform: `translateY(${(1 - frame.verdict) * 6}px)` }}>
            <StatusTag status={sentence.status as Status} pack={pack} />
            <span>{sentence.status === "belegt" ? pack.bet.yes : pack.bet.no}</span>
            <span className="nw-verdict-note">{fill(sentence.notes[1]!, figures)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
