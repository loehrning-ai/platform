/**
 * Every figure the demo prints, derived from the kit rows (kit.ts) by the
 * rules (rules.ts) and formatted for the locale. The copy pack only holds
 * {placeholders}; this fills them, so a changed kit row changes the page.
 */
import type { Locale } from "@/lib/i18n/locale";
import { PV, SEPTEMBER_INVOICE, STROM, WASSER, YEAR } from "./kit";
import { affectedBy, cascadeFlips, ledgerCounts } from "./ledger";
import { EXPIRED_DAYS } from "./motion";
import { distinctMonths, naiveSum, roundTo, share, sumDistinct } from "./rules";

export function formatNumber(value: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).format(roundTo(value, digits));
}

export function formatPercent(fraction: number, locale: Locale): string {
  return `${formatNumber(fraction * 100, locale, 1)} %`;
}

export type Figures = Readonly<Record<string, string>>;

export function figures(locale: Locale): Figures {
  const kwh11 = sumDistinct(STROM);
  const kwh12 = kwh11 + SEPTEMBER_INVOICE.kwh;
  const mwh11 = roundTo(kwh11 / 1000, 1);
  const mwh12 = roundTo(kwh12 / 1000, 1);
  const mwh1211 = roundTo(((kwh11 / 11) * 12) / 1000, 1);
  const before = ledgerCounts("before");
  const after = ledgerCounts("after");
  const f = (value: number, digits = 0) => formatNumber(value, locale, digits);
  return {
    months: String(distinctMonths(STROM, YEAR).months.length),
    mwh11: f(mwh11, 1),
    mwhNaive: f(roundTo(naiveSum(STROM) / 1000, 1), 1),
    mwh12: f(mwh12, 1),
    mwh1211: f(mwh1211, 1),
    short1211: f(mwh12 - mwh1211, 1),
    shortDraft: f(mwh12 - mwh11, 1),
    share11: formatPercent(share(PV.yieldMwh, mwh11), locale),
    share12: formatPercent(share(PV.yieldMwh, mwh12), locale),
    waterMonths: String(distinctMonths(WASSER, YEAR).months.length),
    waterM3: f(sumDistinct(WASSER)),
    waterSeptember: f(WASSER.find((row) => row.month === `${YEAR}-09`)?.amount ?? 0),
    days: String(EXPIRED_DAYS),
    cite: String(affectedBy("strom").length),
    flips: String(cascadeFlips().length),
    before: `${before.belegt}/${before.schwach}/${before.luecke}`,
    after: `${after.belegt}/${after.schwach}/${after.luecke}`,
    belegtBefore: String(before.belegt),
  };
}
