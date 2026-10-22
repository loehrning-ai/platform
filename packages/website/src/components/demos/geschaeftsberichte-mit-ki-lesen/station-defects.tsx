"use client";

import { Fragment, useId } from "react";
import { cx } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { formatDecimal, formatInt, formatPct } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import {
  LADDER_MAX,
  ladderFrame,
  ladderTicks,
  lerp,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/frames";
import {
  DEFECT_IDS,
  FLAG_IDS,
  readDefects,
  readFlag,
  type DefectId,
  type DefectRow,
  type FlagId,
  type FlagReading,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import type { BridgeText } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/texts";
import styles from "./northwind.module.css";
import { ChoiceGroup, CopyButton, CopyText, firstSentences, LiveRegion, VerdictMark } from "./parts";
import { useMorph } from "./use-seek";

/** M2: 400 ms between scales. */
const LADDER_MS = 400;
/** The scale takes the left 78 % of the track; the "nicht in den Daten" lane sits at the right. */
const SCALE_WIDTH = 78;
const LANE_CENTRE = 90;

function valueText(row: DefectRow, scale: DefectId, locale: Locale, copy: NorthwindCopy): string {
  if (row.absent) return copy.defects.notInData;
  if (row.value === null) return copy.defects.noReport;
  return scale === "count" ? formatInt(locale, row.value) : formatDecimal(locale, row.value);
}

/** The report's view on load is the count scale (§3). */
function RateLadder({
  scale,
  flag,
  locale,
  copy,
}: {
  scale: DefectId;
  flag: FlagReading | undefined;
  locale: Locale;
  copy: NorthwindCopy;
}) {
  const { from, to, p } = useMorph(scale, LADDER_MS);
  const dots = new Map(ladderFrame(p, from, to).map((dot) => [dot.line, dot]));
  const reading = readDefects(scale);
  const laneOpacity = Math.max(from === "returns" ? 1 - p : 0, to === "returns" ? p : 0);
  const axis = (id: DefectId, opacity: number) =>
    id === "returns"
      ? null
      : ladderTicks(id).map((tick) => (
          <span
            key={`${id}-${tick}`}
            className="absolute top-0 -translate-x-1/2 text-[0.8125rem] tabular-nums text-muted-foreground"
            style={{ left: `${(tick / LADDER_MAX[id]) * SCALE_WIDTH}%`, opacity }}
          >
            {id === "count" ? tick : formatInt(locale, tick)}
          </span>
        ));

  return (
    <div data-testid="rate-ladder" data-scale={scale}>
      <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-end gap-x-3 pb-1 sm:grid-cols-[4.5rem_minmax(0,1fr)_10rem]">
        <span className="text-[0.8125rem] font-semibold text-muted-foreground">{copy.defects.lineHeader}</span>
        <span className="text-right text-[0.8125rem] font-semibold text-muted-foreground sm:col-start-3 sm:text-left">
          {copy.defects.valueHeader}
        </span>
        <span
          aria-hidden="true"
          className="relative col-span-2 mt-1 block h-5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0"
        >
          {from !== to ? axis(from, 1 - p) : null}
          {axis(to, from !== to ? p : 1)}
        </span>
      </div>
      <ul className="border-t border-foreground">
        {reading.rows.map((row) => {
          const dot = dots.get(row.line);
          const flagged = flag?.flagged.includes(row.line) ?? false;
          const noise = flag?.noise.includes(row.line) ?? false;
          const craft = row.line === "CRAFT";
          return (
            <li
              key={row.line}
              data-line={row.line}
              data-flagged={flagged || undefined}
              className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-b border-hairline py-2 sm:min-h-11 sm:grid-cols-[4.5rem_minmax(0,1fr)_10rem] sm:py-1.5"
            >
              <span className={cx("text-[0.9375rem]", craft && "font-bold")}>{copy.lines[row.line]}</span>
              <span className="flex flex-wrap items-baseline justify-end gap-x-2 text-right sm:col-start-3 sm:row-start-1 sm:justify-start sm:text-left">
                <span
                  className={cx(
                    "text-[0.9375rem] tabular-nums",
                    row.value === null ? "text-muted-foreground" : "font-semibold",
                    craft && row.value !== null && "font-bold",
                  )}
                >
                  {valueText(row, scale, locale, copy)}
                </span>
                {flagged ? (
                  <span className="inline-flex items-center gap-1 text-[0.8125rem] font-bold text-himbeere-tief">
                    <span aria-hidden="true" className="inline-block size-2.5 bg-himbeere-tief" />
                    {copy.defects.flagged}
                  </span>
                ) : null}
                {noise ? (
                  <span className="text-[0.8125rem] font-semibold text-muted-foreground">{copy.defects.noise}</span>
                ) : null}
              </span>
              {dot ? (
                <span
                  aria-hidden="true"
                  className="relative col-span-2 block h-5 sm:col-span-1 sm:col-start-2 sm:row-start-1"
                >
                  <span className="absolute inset-x-0 top-1/2 h-px bg-track" style={{ right: `${100 - SCALE_WIDTH}%` }} />
                  <span
                    className={cx("absolute inset-y-0 border-2 border-dashed border-muted-foreground", styles.noPrint)}
                    style={{ left: `${LANE_CENTRE - 7}%`, width: "14%", opacity: laneOpacity }}
                  />
                  <span
                    className={styles.dot}
                    style={{
                      left: `${lerp(dot.x * SCALE_WIDTH, LANE_CENTRE, dot.drop)}%`,
                      backgroundColor:
                        dot.drop > 0.5 ? "transparent" : craft ? "var(--color-himbeere-tief)" : "var(--color-kobalt)",
                      borderColor: craft ? "var(--color-himbeere-tief)" : undefined,
                      borderStyle: dot.drop > 0.5 ? "dashed" : "solid",
                    }}
                  />
                </span>
              ) : row.note ? (
                /* Its own line under track and value, so it never squeezes into the dot track. */
                <span className="col-span-2 text-[0.875rem] leading-snug text-foreground sm:col-start-2 sm:row-start-2">
                  {copy.defects.echo}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The ladder's marks, repeated under the 2b result: on a phone the ladder
 * sits a screen above the choices, so the learner sees here what it marked.
 */
function FlagMarks({ flag, copy }: { flag: FlagReading; copy: NorthwindCopy }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]" data-testid="flag-marks">
      <span className="text-muted-foreground">{copy.flag.markedAbove}</span>
      {flag.flagged.map((line) => (
        <Fragment key={line}>
          {" "}
          <span className="inline-flex items-center gap-1 font-bold text-himbeere-tief">
            <span aria-hidden="true" className="inline-block size-2.5 bg-himbeere-tief" />
            {`${copy.lines[line]}\u00a0${copy.defects.flagged}`}
          </span>
        </Fragment>
      ))}
      {flag.noise.map((line) => (
        <Fragment key={line}>
          {" "}
          <span className="font-semibold text-muted-foreground">{`${copy.lines[line]}\u00a0${copy.defects.noise}`}</span>
        </Fragment>
      ))}
    </p>
  );
}

function FlagEvidence({ flag, locale, copy }: { flag: FlagReading; locale: Locale; copy: NorthwindCopy }) {
  const evidence = flag.evidence;
  if (!evidence) return null;
  const pct = (value: number) => formatPct(locale, value, { signed: false });
  const rows: { label: string; from: string; to: string; trend: string }[] = [
    {
      label: copy.flag.evidenceRate,
      from: formatDecimal(locale, evidence.rateAug),
      to: formatDecimal(locale, evidence.rateSep),
      trend: copy.flag.falls,
    },
    {
      label: copy.flag.evidenceScrap,
      from: pct(evidence.scrapShareAug),
      to: pct(evidence.scrapShareSep),
      trend: copy.flag.rises,
    },
  ];
  const thousand = Math.round(evidence.scrapEur / 1000);
  return (
    <dl className="mt-4 grid max-w-[40rem] grid-cols-1 gap-3 sm:grid-cols-3" data-testid="flag-evidence">
      {rows.map((row) => (
        <div key={row.label} className="border-t-2 border-foreground pt-2">
          <dt className="text-[0.875rem] text-muted-foreground">{row.label}</dt>
          <dd className="mt-1 text-[1.25rem] font-bold tabular-nums">
            {row.from} → {row.to}
          </dd>
          <dd className="text-[0.875rem] font-semibold">{row.trend}</dd>
        </div>
      ))}
      <div className="border-t-2 border-foreground pt-2">
        <dt className="text-[0.875rem] text-muted-foreground">{copy.flag.evidenceValue}</dt>
        <dd className="mt-1 text-[1.25rem] font-bold tabular-nums text-himbeere-tief">
          {locale === "de" ? `${thousand}\u00a0Tsd.\u00a0€` : `€${thousand}k`}
        </dd>
        <dd className="text-[0.875rem] tabular-nums text-muted-foreground">
          {pct(evidence.scrapShareOfRevenue)} {copy.flag.evidenceShare}
        </dd>
      </div>
    </dl>
  );
}

export function StationDefects({
  copy,
  locale,
  defect,
  flag,
  bridge,
  onDefect,
  onFlag,
}: {
  copy: NorthwindCopy;
  locale: Locale;
  defect: DefectId | undefined;
  flag: FlagId | undefined;
  bridge: BridgeText;
  onDefect: (id: DefectId) => void;
  onFlag: (id: FlagId) => void;
}) {
  const bridgeHint = useId();
  const defectReading = defect ? readDefects(defect) : undefined;
  const flagReading = flag ? readFlag(flag) : undefined;
  const defectOption = defect ? copy.defects.options[defect] : undefined;
  const flagOption = flag ? copy.flag.options[flag] : undefined;
  const ready = bridge.text.length > 0;

  return (
    <div className="mt-6 flex flex-col gap-10">
      {/* 2a · what counts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <ChoiceGroup
          className="lg:col-span-5"
          name="nw-defect"
          legend={copy.defects.legend}
          options={DEFECT_IDS.map((id) => ({ id, label: copy.defects.options[id].label }))}
          value={defect}
          onChange={onDefect}
          testId="defect-choices"
        />
        <figure className="min-w-0 lg:col-span-7">
          <div className="border border-hairline bg-card p-3 sm:p-4">
            <RateLadder scale={defect ?? "count"} flag={flagReading} locale={locale} copy={copy} />
          </div>
          <figcaption className="mt-2 text-[0.875rem] leading-normal text-muted-foreground">
            {copy.defects.ladderScale[defect ?? "count"]}. {copy.defects.ladderCaption}
          </figcaption>
        </figure>
        <div className="min-w-0 lg:col-span-12" data-testid="defect-result">
          <LiveRegion
            message={
              defectReading && defectOption
                ? `${copy.verdict[defectReading.verdict]}. ${firstSentences(defectOption.result)}`
                : ""
            }
          />
          <div className="max-w-[68ch] border-t border-hairline pt-4">
            {defectReading && defectOption ? (
              <>
                <VerdictMark verdict={defectReading.verdict} word={copy.verdict[defectReading.verdict]} />
                <p className="mt-2 text-[1.0625rem] leading-relaxed text-pretty">{defectOption.result}</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty">{copy.defects.report}</p>
              </>
            ) : (
              <p className="text-[1rem] text-muted-foreground">{copy.empty}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2b · when to flag */}
      <div className="flex flex-col gap-6">
        <ChoiceGroup
          className="max-w-[44rem]"
          name="nw-flag"
          legend={copy.flag.legend}
          options={FLAG_IDS.map((id) => ({ id, label: copy.flag.options[id].label }))}
          value={flag}
          onChange={onFlag}
          testId="flag-choices"
        />
        <div className="min-w-0" data-testid="flag-result">
          <LiveRegion
            message={
              flagReading && flagOption
                ? `${copy.verdict[flagReading.verdict]}. ${firstSentences(flagOption.result)}`
                : ""
            }
          />
          <div className="max-w-[68ch] border-t border-hairline pt-4">
            {flagReading && flagOption ? (
              <>
                <VerdictMark verdict={flagReading.verdict} word={copy.verdict[flagReading.verdict]} />
                <p className="mt-2 text-[1.0625rem] leading-relaxed text-pretty">{flagOption.result}</p>
                <FlagMarks flag={flagReading} copy={copy} />
              </>
            ) : (
              <p className="text-[1rem] text-muted-foreground">{copy.empty}</p>
            )}
          </div>
          {flagReading ? <FlagEvidence flag={flagReading} locale={locale} copy={copy} /> : null}
        </div>
      </div>

      {/* The bridge into prompt 2 */}
      <section aria-labelledby="nw-bridge-heading" className="max-w-[68ch]" data-testid="bridge">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t-2 border-scene-line pt-3">
          <h3 id="nw-bridge-heading" className="text-[1.25rem] font-bold text-balance">
            {copy.bridge.title}
          </h3>
          <CopyButton
            text={bridge.text}
            label={copy.ui.copy}
            copiedLabel={copy.ui.copied}
            failedLabel={copy.ui.copyFailed}
            disabled={!ready}
            describedBy={ready ? undefined : bridgeHint}
            testId="copy-bridge"
          />
        </div>
        {ready ? (
          <CopyText text={bridge.text} testId="bridge-text" />
        ) : (
          <p id={bridgeHint} className="mt-3 bg-inset px-4 py-3 text-[0.9375rem] text-muted-foreground">
            {copy.bridge.disabled}
          </p>
        )}
        <p className="mt-2 text-[0.875rem] leading-normal text-muted-foreground text-pretty">{copy.bridge.caption}</p>
      </section>
    </div>
  );
}
