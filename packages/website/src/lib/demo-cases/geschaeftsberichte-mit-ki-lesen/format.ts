export type Locale = "de" | "en";

const MINUS = "−";
/** Narrow no-break space: the thin space before a percent sign. */
const THIN = "\u202f";

const intl = (locale: Locale) => (locale === "de" ? "de-DE" : "en-GB");

export interface NumberOptions {
  readonly digits?: number;
  readonly sign?: boolean;
  /** Copy-paste text: ASCII hyphen and a plain space, no U+2212 or U+202F. */
  readonly plain?: boolean;
}

/** A locale-formatted number; zero after rounding carries no sign. */
export function formatNumber(value: number, locale: Locale, options: NumberOptions = {}): string {
  if (!Number.isFinite(value)) return "?";
  const digits = options.digits ?? 0;
  const text = new Intl.NumberFormat(intl(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).format(Math.abs(value));
  const rounded = Number(Math.abs(value).toFixed(digits));
  if (rounded === 0) return text;
  if (value < 0) return `${options.plain ? "-" : MINUS}${text}`;
  return options.sign ? `+${text}` : text;
}

/** A growth rate (0.258 = +25,8 %). The giant number uses `auto`: one decimal below 10 %, else none. */
export function formatPercent(
  fraction: number,
  locale: Locale,
  options: NumberOptions & { readonly auto?: boolean } = {},
): string {
  const value = fraction * 100;
  const digits = options.auto ? (Math.abs(value) < 10 ? 1 : 0) : (options.digits ?? 1);
  const gap = options.plain ? " " : THIN;
  return `${formatNumber(value, locale, { digits, sign: options.sign ?? true, plain: options.plain })}${gap}%`;
}

/** Revenue as "21,69 Mio. €" style text, from the pack's two money templates. */
export function formatMoney(
  eur: number,
  locale: Locale,
  templates: { readonly mio: string; readonly full: string },
): string {
  if (Math.abs(eur) >= 1e6) {
    return templates.mio.replace("{v}", formatNumber(eur / 1e6, locale, { digits: 2, plain: true }));
  }
  return templates.full.replace("{v}", formatNumber(eur, locale, { digits: 0, plain: true }));
}

/** Replace {name} placeholders. Unknown names stay visible, so a typo shows up in tests. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
