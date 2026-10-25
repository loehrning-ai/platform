export type DemoLocale = "de" | "en";

const INTL: Readonly<Record<DemoLocale, string>> = { de: "de-DE", en: "en-GB" };
const NBSP = "\u00a0";

/** 1.180 (de) or 1,180 (en); a real minus sign. */
export function formatNumber(value: number, locale: DemoLocale, maxFraction = 0, minFraction = 0): string {
  const rounded = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(INTL[locale], {
    maximumFractionDigits: maxFraction,
    minimumFractionDigits: minFraction,
    useGrouping: true,
  })
    .format(rounded)
    .replace(/^-/, "−");
}

/** One decimal, always shown: 33,3 / 33.3. */
export const formatOne = (value: number, locale: DemoLocale) => formatNumber(value, locale, 1, 1);

/** A share as percent: 92,6 % / 92.6 %, with a sign when asked (+3,0 %). */
export function formatPercent(share: number, locale: DemoLocale, { decimals = 1, sign = false } = {}): string {
  const text = formatNumber(share * 100, locale, decimals, decimals);
  const signed = sign && share > 0 ? `+${text}` : text;
  return `${signed}${NBSP}%`;
}

/** Euro, rounded half up to whole euros unless decimals are asked for: 2.052 € / €2,052. */
export function formatEuro(value: number, locale: DemoLocale, decimals = 0): string {
  const amount = decimals === 0 ? Math.floor(value + 0.5) : value;
  const text = formatNumber(amount, locale, decimals, decimals);
  return locale === "de" ? `${text}${NBSP}€` : `€${text}`;
}

function utc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y as number, (m as number) - 1, d as number));
}

/** 7. April / 7 April, from an ISO date, never shifted by the visitor's time zone. */
export function formatDay(iso: string, locale: DemoLocale, withYear = false): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(utc(iso));
}

/** 07.04. / 7 Apr: the short label on the chart. */
export function formatShortDay(iso: string, locale: DemoLocale): string {
  if (locale === "de") {
    const [, m, d] = iso.split("-");
    return `${d}.${m}.`;
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(utc(iso));
}

/** Replaces {name} slots in a copy template; unknown slots stay visible so tests catch them. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) => (name in values ? String(values[name]) : slot));
}
