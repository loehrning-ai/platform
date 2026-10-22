"use client";

import { useState } from "react";
import { cx } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import type { NorthwindCopy, SheetOptionCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import {
  assessSheet,
  gutLine,
  optionIds,
  SHEET_FIELDS,
  type Decision,
  type RowResult,
  type Sheet,
  type SheetAction,
  type SheetField,
  type Verdict,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { fill, pick } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/template";
import { ACTION_BUTTON, ChoiceGroup, firstSentences, LiveRegion, VerdictMark } from "./parts";

function optionCopy(copy: NorthwindCopy, field: SheetField, option: string): SheetOptionCopy {
  return (copy.decide.options[field] as Readonly<Record<string, SheetOptionCopy>>)[option];
}

function RowFeedback({ row, copy, locale }: { row: RowResult; copy: NorthwindCopy; locale: Locale }) {
  if (row.verdict === "open" || row.option === undefined) {
    return <p className="text-[1rem] text-muted-foreground">{copy.empty}</p>;
  }
  const option = optionCopy(copy, row.field, row.option);
  const [open, close] = locale === "de" ? ["„", "“"] : ["“", "”"];
  // The cross-row rule adds why the number turns against the decision; the
  // option's own fact stays below it, labelled as what the data says.
  const labelled = Boolean(option.vp || row.against);
  return (
    <div className="flex flex-col gap-3">
      <VerdictMark verdict={row.verdict as Verdict} word={copy.verdict[row.verdict as Verdict]} />
      {row.against ? (
        <p className="text-[1rem] font-semibold leading-relaxed text-pretty" data-against={row.against}>
          {copy.decide.against[row.against]}
        </p>
      ) : null}
      {option.vp ? (
        <figure className="border-l-2 border-foreground pl-3">
          <figcaption className="text-[0.875rem] font-semibold text-muted-foreground">
            {copy.decide.vpLabel}
          </figcaption>
          <blockquote className="mt-1 text-[1rem] leading-snug">
            <p>{`${open}${option.vp}${close}`}</p>
          </blockquote>
        </figure>
      ) : null}
      <p className="text-[1rem] leading-relaxed text-pretty" data-row-fact="">
        {labelled ? <span className="font-semibold">{copy.decide.dataLabel}: </span> : null}
        {option.fact}
      </p>
    </div>
  );
}

export function StationDecide({
  copy,
  locale,
  sheet,
  gut,
  pristine,
  onSheet,
  onReset,
}: {
  copy: NorthwindCopy;
  locale: Locale;
  sheet: Sheet;
  gut: Decision | undefined;
  pristine: boolean;
  onSheet: (action: SheetAction) => void;
  onReset: () => void;
}) {
  const [last, setLast] = useState<SheetField | undefined>(undefined);
  const result = assessSheet(sheet);
  const gutKind = gutLine(gut, sheet.decision, result.holds);
  const lastRow = last ? result.rows.find((row) => row.field === last) : undefined;
  const announcement =
    lastRow && lastRow.verdict !== "open" && lastRow.option
      ? [
          `${copy.decide.rows[lastRow.field]}: ${copy.verdict[lastRow.verdict]}.`,
          lastRow.against ? copy.decide.against[lastRow.against] : "",
          firstSentences(optionCopy(copy, lastRow.field, lastRow.option).fact),
        ]
          .filter(Boolean)
          .join(" ")
      : "";

  return (
    <div className="mt-6">
      <p className="max-w-[68ch] text-[1.0625rem] leading-relaxed">{copy.decide.intro}</p>
      <LiveRegion message={announcement} />

      <ol className="mt-6 flex flex-col">
        {SHEET_FIELDS.map((field, index) => {
          const row = result.rows[index];
          return (
            <li
              key={field}
              data-sheet-row={field}
              data-verdict={row.verdict}
              className="grid grid-cols-1 gap-4 border-t border-hairline py-6 first:border-t-2 first:border-t-foreground lg:grid-cols-12 lg:gap-8"
            >
              <ChoiceGroup
                className="lg:col-span-7"
                name={`nw-sheet-${field}`}
                legend={
                  <span className="flex items-baseline gap-2">
                    <span aria-hidden="true" className="tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    {copy.decide.rows[field]}
                  </span>
                }
                options={optionIds(field).map((id) => ({
                  id: id as string,
                  label: optionCopy(copy, field, id as string).label,
                }))}
                value={sheet[field] as string | undefined}
                onChange={(id) => {
                  setLast(field);
                  onSheet({ type: "sheet", field, value: id } as SheetAction);
                }}
              />
              <div className="min-w-0 lg:col-span-5 lg:pt-9" data-row-feedback="">
                <RowFeedback row={row} copy={copy} locale={locale} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <section
          aria-labelledby="nw-sheet-heading"
          className="border border-hairline bg-card p-4 sm:p-5"
          data-testid="your-sheet"
        >
          <h3 id="nw-sheet-heading" className="text-[1.25rem] font-bold">
            {copy.decide.sheetHeading}
          </h3>
          <p
            className={cx(
              "mt-2 text-[1.0625rem] font-bold tabular-nums",
              result.holds ? "text-kobalt" : "text-foreground",
            )}
            data-testid="sheet-summary"
          >
            {result.holds
              ? copy.decide.sheetHolds
              : fill(pick(copy.decide.sheetHolding, result.holding), { count: result.holding })}
            {result.open > 0 ? ` ${fill(pick(copy.decide.sheetOpen, result.open), { count: result.open })}` : ""}
          </p>
          <ol className="mt-3 grid grid-cols-6 gap-1" aria-hidden="true">
            {result.rows.map((row) => (
              <li
                key={row.field}
                className={cx(
                  "h-2",
                  row.verdict === "holds"
                    ? "bg-kobalt"
                    : row.verdict === "misleads"
                      ? "bg-himbeere-tief"
                      : row.verdict === "absent"
                        ? "border border-dashed border-muted-foreground"
                        : "bg-track",
                )}
              />
            ))}
          </ol>
          {gutKind ? (
            <p className="mt-3 text-[1rem] leading-relaxed" data-testid="gut-line">
              {gutKind === "turned"
                ? fill(copy.decide.gut.turned, {
                    gut: copy.decisionShort[gut!],
                    decision: copy.decisionShort[sheet.decision!],
                  })
                : copy.decide.gut[gutKind]}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={ACTION_BUTTON}
              onClick={onReset}
              disabled={pristine}
              data-testid="reset"
            >
              {copy.ui.reset}
            </button>
            <span className="text-[0.875rem] text-muted-foreground">{copy.ui.resetNote}</span>
          </div>
        </section>

        <section
          aria-labelledby="nw-workshop-heading"
          className="border-t-2 border-scene-line pt-3"
          data-testid="workshop-answer"
        >
          <h3 id="nw-workshop-heading" className="text-[1.25rem] font-bold">
            {copy.decide.workshopHeading}
          </h3>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-pretty">{copy.decide.workshop}</p>
          <p className="mt-2 text-[0.875rem] text-muted-foreground">{copy.decide.workshopSource}</p>
        </section>
      </div>
    </div>
  );
}
