"use client";

import type { Locale } from "@/lib/i18n/locale";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { formatPct } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import {
  COMPARE_IDS,
  readCompare,
  reportMonthRows,
  type CompareId,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { CompareBars, WeekStrip } from "./figures";
import { ChoiceGroup, firstSentences, LiveRegion, VerdictMark } from "./parts";
import { useSeek } from "./use-seek";

/** M1: 450 ms from the monthly stacks to the weekly columns. */
const STRIP_MS = 450;

export function StationCompare({
  copy,
  locale,
  value,
  onChange,
}: {
  copy: NorthwindCopy;
  locale: Locale;
  value: CompareId | undefined;
  onChange: (id: CompareId) => void;
}) {
  const reading = value ? readCompare(value) : undefined;
  const p = useSeek(reading?.stripTarget ?? 0, STRIP_MS);
  const rows = reading?.rows ?? reportMonthRows();
  const basis = reading ? copy.compare.barsBasis[reading.basis] : copy.compare.barsBasis.report;
  const option = value ? copy.compare.options[value] : undefined;
  const announcement =
    reading && option ? `${copy.verdict[reading.verdict]}. ${firstSentences(option.result)}` : "";

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <ChoiceGroup
        className="lg:col-span-5"
        name="nw-compare"
        legend={copy.compare.legend}
        options={COMPARE_IDS.map((id) => ({ id, label: copy.compare.options[id].label }))}
        value={value}
        onChange={onChange}
        testId="compare-choices"
      />

      <figure className="min-w-0 lg:col-span-7">
        <div className="border border-hairline bg-card p-3 sm:p-4">
          <WeekStrip p={p} locale={locale} copy={copy} />
        </div>
        <figcaption className="mt-2 max-w-[68ch] text-[0.875rem] leading-normal text-muted-foreground text-pretty">
          {copy.compare.figureCaption}
        </figcaption>
      </figure>

      <div className="min-w-0 lg:col-span-12" data-testid="compare-result">
        <LiveRegion message={announcement} />
        <div className="max-w-[68ch] border-t border-hairline pt-4">
          {reading && option ? (
            <>
              <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <VerdictMark verdict={reading.verdict} word={copy.verdict[reading.verdict]} />
                <span className="text-[1.75rem] font-bold leading-none tabular-nums text-foreground">
                  {formatPct(locale, reading.headline.value)}
                </span>
                <span className="text-[0.9375rem] text-muted-foreground">{copy.compare.headline[value!]}</span>
              </p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-pretty">{option.result}</p>
            </>
          ) : (
            <p className="text-[1rem] text-muted-foreground">{copy.empty}</p>
          )}
        </div>

        <div className="mt-6 max-w-[44rem]">
          <p className="text-[0.9375rem] font-bold">{copy.compare.barsHeading}</p>
          <p className="mb-2 text-[0.875rem] text-muted-foreground">{basis}</p>
          <CompareBars rows={rows} locale={locale} copy={copy} />
          {reading?.rows.length === 1 ? (
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">{copy.compare.totalOnly}</p>
          ) : null}
        </div>

        {reading ? (
          <p className="mt-5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-foreground text-pretty">
            {copy.compare.report}
          </p>
        ) : null}
      </div>
    </div>
  );
}
