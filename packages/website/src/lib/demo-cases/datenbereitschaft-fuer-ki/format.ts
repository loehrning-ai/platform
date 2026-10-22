/**
 * Number formatting for demo 03, written out by hand so the server and every
 * browser print the same string (no ICU differences). Negative numbers use
 * the minus sign U+2212, never a hyphen or a dash.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { Value } from "./model";

export const MINUS = "−";

/** No-break space between a number and its unit, so "32.380 €" never breaks. */
export const NBSP = "\u00a0";

function group(integer: number, separator: string): string {
  const digits = String(Math.abs(Math.trunc(integer)));
  let out = "";
  for (let index = 0; index < digits.length; index += 1) {
    const fromEnd = digits.length - index;
    out += digits[index];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += separator;
  }
  return out;
}

/** 334675 → DE "334.675", EN "334,675"; 203.5 → DE "203,5", EN "203.5". */
export function formatNumber(value: number, locale: Locale, digits = 0): string {
  const negative = value < 0;
  const absolute = Math.abs(value);
  const fixed = absolute.toFixed(digits);
  const [integerPart, fraction] = fixed.split(".");
  const grouped = group(Number(integerPart), locale === "de" ? "." : ",");
  const decimal = locale === "de" ? "," : ".";
  const body = fraction ? `${grouped}${decimal}${fraction}` : grouped;
  return negative ? `${MINUS}${body}` : body;
}

/** DE "−19.960 €" (no-break space), EN "−€19,960". */
export function formatEur(amount: number, locale: Locale): string {
  const body = formatNumber(Math.abs(amount), locale);
  const sign = amount < 0 ? MINUS : "";
  return locale === "de" ? `${sign}${body}${NBSP}€` : `${sign}€${body}`;
}

/** DE "10,0 %" (no-break space), EN "10.0%". */
export function formatPct(pct: number, locale: Locale, digits: 1 | 2 = 1): string {
  const body = formatNumber(pct, locale, digits);
  return locale === "de" ? `${body}${NBSP}%` : `${body}%`;
}

/** Plain base: 200 → "200", 203.5 → "203,5". */
function formatBase(den: number, locale: Locale): string {
  return Number.isInteger(den) ? formatNumber(den, locale) : formatNumber(den, locale, 1);
}

const NOUNS = {
  de: { accounts: "Konten", people: "Beschäftigte" },
  en: { accounts: "accounts", people: "employees" },
} as const;

const NO_RATE = { de: "keine Quote", en: "no rate" } as const;

/** The short value: "−19.960 €", "10,0 %", "keine Quote", "40 Konten". */
export function formatValue(value: Value, locale: Locale): string {
  switch (value.unit) {
    case "eur":
      return formatEur(value.amount, locale);
    case "rate":
      return value.den === 0
        ? NO_RATE[locale]
        : formatPct((100 * value.num) / value.den, locale, value.digits ?? 1);
    case "averagedRate":
      return formatPct(value.pct, locale, value.digits ?? 1);
    case "count": {
      const number = formatNumber(value.n, locale);
      const signed = value.signed && value.n > 0 ? `+${number}` : number;
      return `${signed} ${NOUNS[locale][value.noun]}`;
    }
  }
}

/** The long value: a rate with its count, "4 von 40 = 10,0 %", "0 von 0, keine Quote". */
export function formatValueLong(value: Value, locale: Locale): string {
  if (value.unit !== "rate") return formatValue(value, locale);
  const of = locale === "de" ? "von" : "of";
  const fraction = `${formatNumber(value.num, locale)} ${of} ${formatBase(value.den, locale)}`;
  return value.den === 0 ? `${fraction}, ${NO_RATE[locale]}` : `${fraction} = ${formatValue(value, locale)}`;
}

/** The parts of a rate for {num}, {den} and {rate}. */
export function rateParts(value: Value, locale: Locale): { num: string; den: string; rate: string } {
  if (value.unit !== "rate") return { num: "", den: "", rate: formatValue(value, locale) };
  return {
    num: formatNumber(value.num, locale),
    den: formatBase(value.den, locale),
    rate: formatValue(value, locale),
  };
}

export function valuesEqual(a: Value, b: Value): boolean {
  if (a.unit !== b.unit) return false;
  switch (a.unit) {
    case "eur":
      return a.amount === (b as typeof a).amount;
    case "rate": {
      const other = b as typeof a;
      if (a.den === 0 || other.den === 0) return a.den === other.den;
      return a.num * other.den === other.num * a.den;
    }
    case "averagedRate":
      return a.pct === (b as typeof a).pct;
    case "count":
      return a.n === (b as typeof a).n && a.noun === (b as typeof a).noun;
  }
}
