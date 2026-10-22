"use client";

import type { Locale } from "@/lib/i18n/locale";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import { DECISIONS, type Decision } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { ChoiceGroup } from "./parts";

const QUOTE_MARKS: Record<Locale, readonly [string, string]> = {
  de: ["„", "“"],
  en: ["“", "”"],
};

/** Start: the three figures the report leads with, the VP's call and the gut vote. */
export function StationReport({
  copy,
  locale,
  gut,
  onGut,
}: {
  copy: NorthwindCopy;
  locale: Locale;
  gut: Decision | undefined;
  onGut: (decision: Decision) => void;
}) {
  const report = copy.report;
  const [open, close] = QUOTE_MARKS[locale];
  return (
    <div className="mt-6 flex flex-col gap-8">
      <dl
        aria-label={report.figuresLabel}
        className="grid grid-cols-1 gap-y-5 sm:grid-cols-3 sm:gap-y-0"
        data-testid="report-figures"
      >
        {report.figures.map((figure) => (
          <div
            key={figure.value}
            className="flex flex-col border-b border-hairline pb-4 sm:border-b-0 sm:border-l sm:pb-0 sm:pl-6 sm:pr-4 sm:first:border-l-0 sm:first:pl-0"
          >
            <dt className="order-2 mt-1 text-[1rem] leading-snug text-foreground">{figure.label}</dt>
            <dd className="order-1 text-[2.25rem] font-bold leading-none text-scene-line tabular-nums">
              {figure.value}
            </dd>
            <dd className="order-3 mt-1 text-[0.875rem] text-muted-foreground">{figure.note}</dd>
          </div>
        ))}
      </dl>

      <figure className="max-w-[68ch] border-l-2 border-foreground pl-4">
        <blockquote className="text-[1.0625rem] leading-relaxed text-foreground text-pretty">
          <p>{`${open}${report.quote}${close}`}</p>
        </blockquote>
        <figcaption className="mt-2 text-[0.875rem] text-muted-foreground">{report.attribution}</figcaption>
      </figure>

      <div className="max-w-[44rem]">
        <ChoiceGroup
          name="nw-gut"
          legend={report.gutLegend}
          options={DECISIONS.map((id) => ({ id, label: copy.decisionLabel[id] }))}
          value={gut}
          onChange={onGut}
          testId="gut-vote"
        />
        <p className="mt-3 text-[0.9375rem] text-muted-foreground">{report.gutNote}</p>
      </div>
    </div>
  );
}
