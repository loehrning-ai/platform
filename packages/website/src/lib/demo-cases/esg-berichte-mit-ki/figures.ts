/**
 * Every figure the demo prints, derived from the kit rows (kit.ts) by the
 * rules (rules.ts) and formatted for the locale. The copy pack only holds
 * {placeholders}; this fills them, so a changed kit row changes the page.
 */
import type { Locale } from "@/lib/i18n/locale";
import { BIO, PV, SEPTEMBER_INVOICE, STICHTAG, STROM, WASSER, YEAR } from "./kit";
import { ledgerCounts } from "./ledger";
import { daysBetween, distinctMonths, naiveSum, roundTo, share, sumDistinct, type CalendarDate } from "./rules";

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

/** Days the certificate has been expired on a date (negative while it is valid). */
export function days(stichtag: CalendarDate): number {
  return daysBetween(BIO.validUntil, stichtag);
}

/** Days the certificate is still valid on a date (0 on its last day, negative once expired). */
export function daysLeft(stichtag: CalendarDate): number {
  return daysBetween(stichtag, BIO.validUntil);
}

/** Days the certificate had expired on the kit's Stichtag: 46. */
export const EXPIRED_DAYS = days(STICHTAG);

const KWH11 = sumDistinct(STROM);
const KWH12 = KWH11 + SEPTEMBER_INVOICE.kwh;

/** The electricity figures in MWh with one decimal, as LOESUNGEN.md Schritte 1 and 5 state them. */
export const MWH = {
  /** Eleven distinct months: 279,7. */
  eleven: roundTo(KWH11 / 1000, 1),
  /** Every row added, October twice: 318,4. */
  naive: roundTo(naiveSum(STROM) / 1000, 1),
  /** Twelve months with the late invoice: 320,9. */
  twelve: roundTo(KWH12 / 1000, 1),
  /** Eleven months scaled up by 12/11: 305,1. */
  scaledUp: roundTo(((KWH11 / 11) * 12) / 1000, 1),
  /** The September invoice: 41,2. */
  september: roundTo(SEPTEMBER_INVOICE.kwh / 1000, 1),
} as const;

/** What scaling up puts in for September: 305,1 minus 279,7 = 25,4 MWh. */
export const scaleUpSeptember = roundTo(MWH.scaledUp - MWH.eleven, 1);

export type Figures = Readonly<Record<string, string>>;

export function figures(locale: Locale): Figures {
  const before = ledgerCounts("before");
  const after = ledgerCounts("after");
  const f = (value: number, digits = 0) => formatNumber(value, locale, digits);
  return {
    months: String(distinctMonths(STROM, YEAR).months.length),
    mwh11: f(MWH.eleven, 1),
    mwhNaive: f(MWH.naive, 1),
    mwh12: f(MWH.twelve, 1),
    mwh1211: f(MWH.scaledUp, 1),
    mwhSeptember: f(MWH.september, 1),
    scaleUp: f(scaleUpSeptember, 1),
    short1211: f(MWH.twelve - MWH.scaledUp, 1),
    shortDraft: f(MWH.twelve - MWH.eleven, 1),
    share11: formatPercent(share(PV.yieldMwh, MWH.eleven), locale),
    share12: formatPercent(share(PV.yieldMwh, MWH.twelve), locale),
    waterMonths: String(distinctMonths(WASSER, YEAR).months.length),
    waterM3: f(sumDistinct(WASSER)),
    waterSeptember: f(WASSER.find((row) => row.month === `${YEAR}-09`)?.amount ?? 0),
    days: String(EXPIRED_DAYS),
    haCertified: String(BIO.haCertified),
    haTotal: String(BIO.haTotal),
    haRest: String(BIO.haTotal - BIO.haCertified),
    meterOld: f(SEPTEMBER_INVOICE.meterOld),
    meterNew: f(SEPTEMBER_INVOICE.meterNew),
    kwhSeptember: f(SEPTEMBER_INVOICE.kwh),
    before: `${before.belegt}/${before.schwach}/${before.luecke}`,
    after: `${after.belegt}/${after.schwach}/${after.luecke}`,
  };
}
