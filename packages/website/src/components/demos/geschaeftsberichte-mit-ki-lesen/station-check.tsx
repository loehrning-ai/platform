"use client";

import { useState } from "react";
import { cx } from "@/components/werk";
import type { Locale } from "@/lib/i18n/locale";
import type { NorthwindCopy } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy-types";
import {
  CLAIMS,
  TRUTHS,
  type Cell,
  type Claim,
  type ClaimId,
  type Truth,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { formatEur, formatInt } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { threadFrame } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/frames";
import { fill } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/template";
import { checkClaim, claimSummary, type Verdict } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import styles from "./northwind.module.css";
import { ChoiceGroup, firstSentences, LiveRegion, VerdictMark } from "./parts";
import { useSeek } from "./use-seek";

/** M3: thread 360 ms, then ring and rows 120 ms. */
const THREAD_MS = 480;

const TRUTH_MARK: Record<Truth, Verdict> = { match: "holds", differs: "misleads", nowhere: "absent" };

function formatValue(locale: Locale, value: number, unit: Claim["unit"]): string {
  return unit === "eur" ? formatEur(locale, value) : formatInt(locale, value);
}

function cellText(cell: Cell, locale: Locale): string {
  if (cell.t === "text") return cell.v;
  return cell.t === "eur" ? formatEur(locale, cell.v) : formatInt(locale, cell.v);
}

/** Everything after the first sentence (the first one repeats the mark's word). */
function afterFirst(text: string): string {
  return text.split(/(?<=[.!?])\s+/).slice(1).join(" ");
}

function ClaimCard({
  claim,
  said,
  onSay,
  copy,
  locale,
}: {
  claim: Claim;
  said: Truth | undefined;
  onSay: (truth: Truth) => void;
  copy: NorthwindCopy;
  locale: Locale;
}) {
  const text = copy.check.claims[claim.id];
  const revealed = said !== undefined;
  const p = useSeek(revealed ? 1 : 0, THREAD_MS);
  const frame = threadFrame(revealed ? p : 0);
  const check = said ? checkClaim(claim.id, said) : undefined;
  const headingId = `nw-claim-${claim.id}`;

  return (
    <article
      aria-labelledby={headingId}
      data-claim={claim.id}
      data-revealed={revealed || undefined}
      className="flex min-w-0 flex-col border border-hairline bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={headingId} className="text-[1.0625rem] font-bold leading-snug">
          {text.label}
        </h3>
        <p className="relative text-[1.75rem] font-bold leading-none tabular-nums" data-claim-value="">
          {formatValue(locale, claim.value, claim.unit)}
          {revealed && claim.truth === "differs" ? (
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className={styles.cross}
              style={{ opacity: frame.rows }}
            >
              <path
                d="M4 4L96 36M96 4L4 36"
                className="stroke-himbeere-tief"
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
                fill="none"
              />
            </svg>
          ) : null}
        </p>
      </div>
      {check ? (
        <p
          className="mt-1 text-right text-[0.9375rem] font-semibold tabular-nums text-kobalt"
          style={{ opacity: frame.rows }}
          data-source-value=""
        >
          {check.sourceValue === null
            ? copy.check.sourceNone
            : fill(copy.check.sourceShows, { value: formatValue(locale, check.sourceValue, claim.unit) })}
        </p>
      ) : null}

      <div className="relative mt-3 pl-6">
        {revealed ? (
          <span
            aria-hidden="true"
            className={styles.thread}
            style={{ transform: `scaleY(${1 - frame.dash})` }}
          />
        ) : (
          <span aria-hidden="true" className="absolute left-[0.4375rem] top-[0.625rem] size-2 bg-kobalt" />
        )}
        <p className="text-[0.9375rem] leading-snug text-foreground">{text.source}</p>
        <ChoiceGroup
          className="mt-3"
          name={`nw-claim-${claim.id}`}
          legend={copy.check.group}
          legendClassName="mb-2 text-[0.9375rem] font-semibold"
          options={TRUTHS.map((id) => ({ id, label: copy.check.truth[id] }))}
          value={said}
          onChange={onSay}
          compact
        />
      </div>

      {check ? (
        <div className="relative mt-4 pl-6" data-claim-rows="">
          <span
            aria-hidden="true"
            className={styles.ring}
            style={{ transform: `scale(${frame.ring})`, opacity: frame.ring }}
          />
          <div style={{ opacity: frame.rows }}>
            <div className="bg-inset px-3 py-2 font-mono text-[0.8125rem] leading-relaxed text-foreground sm:text-[0.875rem]">
              <p className="break-words text-muted-foreground">
                {claim.header.join(claim.separator === " · " ? " · " : " ")}
                {claim.truth === "nowhere" ? (
                  <>
                    {" · "}
                    <span className={cx("inline-block bg-card px-1.5 font-semibold text-foreground", styles.missing)}>
                      {copy.check.missingColumn}
                    </span>
                  </>
                ) : null}
              </p>
              {check.rows.map((row, index) => (
                <p key={index} className="break-words">
                  {row.map((cell) => cellText(cell, locale)).join(claim.separator)}
                </p>
              ))}
              {check.more > 0 ? (
                <p className="text-muted-foreground">{fill(copy.check.more, { count: formatInt(locale, check.more) })}</p>
              ) : null}
            </div>
            <p className="mt-2 text-[0.875rem] font-semibold tabular-nums">{text.total}</p>
            <p className="mt-3 text-[1rem] leading-relaxed text-pretty">
              <VerdictMark
                verdict={TRUTH_MARK[check.truth]}
                word={copy.check.truth[check.truth]}
                className="mr-2 align-[-0.125em]"
              />
              {afterFirst(text.result)}
            </p>
            {/* A wrong prediction is the lesson: ink weight and the Himbeere mark, not a grey aside. */}
            <p
              className={cx(
                "mt-2 text-[0.9375rem]",
                check.said === check.truth
                  ? "text-muted-foreground"
                  : "flex items-baseline gap-2 font-semibold text-foreground",
              )}
              data-echo=""
              data-echo-mismatch={check.said !== check.truth || undefined}
            >
              {check.said !== check.truth ? (
                <span aria-hidden="true" className="inline-block size-2.5 shrink-0 bg-himbeere-tief" />
              ) : null}
              <span>
                {fill(check.said === check.truth ? copy.check.echo.same : copy.check.echo.differs, {
                  said: copy.check.truth[check.said],
                  truth: copy.check.truth[check.truth],
                })}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function StationCheck({
  copy,
  locale,
  said,
  onSay,
}: {
  copy: NorthwindCopy;
  locale: Locale;
  said: Readonly<Partial<Record<ClaimId, Truth>>>;
  onSay: (claim: ClaimId, truth: Truth) => void;
}) {
  const [last, setLast] = useState<ClaimId | undefined>(undefined);
  const summary = claimSummary(said);
  const lastSaid = last ? said[last] : undefined;
  const counter = fill(copy.check.counter, { count: summary.checked, of: summary.of });
  const announcement =
    last && lastSaid
      ? `${copy.check.claims[last].label}: ${firstSentences(copy.check.claims[last].result, 2)} ${counter}.`
      : "";

  return (
    <div className="mt-6">
      <p className="max-w-[68ch] text-[1.0625rem] leading-relaxed text-pretty">{copy.check.intro}</p>
      <LiveRegion message={announcement} />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {CLAIMS.map((claim) => (
          <ClaimCard
            key={claim.id}
            claim={claim}
            said={said[claim.id]}
            onSay={(truth) => {
              setLast(claim.id);
              onSay(claim.id, truth);
            }}
            copy={copy}
            locale={locale}
          />
        ))}
      </div>
      <p className="mt-4 text-[1rem] font-bold tabular-nums" data-testid="check-counter">
        {counter}
      </p>
      <p className="mt-1 max-w-[68ch] text-[0.9375rem] text-muted-foreground">{copy.check.closing}</p>
    </div>
  );
}
