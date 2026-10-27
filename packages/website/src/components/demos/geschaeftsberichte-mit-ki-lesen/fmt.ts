import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { LINE } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import type { Counter } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { fill, formatNumber, formatPercent } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";

export { fill };

/** The number and date formats of one pack: German or English digits, real minus, thin space before %. */
export function formatter(pack: DemoPack) {
  const locale = pack.locale === "en" ? "en" : "de";
  const n = (value: number, digits = 0) => formatNumber(value, locale, { digits });
  const per = n(1000);
  return {
    locale: locale as "de" | "en",
    n,
    per,
    line: LINE,
    /** A change with sign: +22,4 %. */
    pct: (fraction: number, digits = 1) => formatPercent(fraction, locale, { digits }),
    /** A share without sign: 16,8 %. */
    share: (fraction: number, digits = 1) => formatPercent(fraction, locale, { digits, sign: false }),
    eur: (value: number, digits = 0) => fill(pack.money, { v: n(value, digits) }),
    /** A value of a counter per 1.000 the way the report rounds it: records to two decimals, units whole. */
    rate: (counter: Counter, value: number) => n(value, counter === "records" ? 2 : 0),
    /** A value of a reading: per 1.000 like rate, absolute records whole, per week one decimal for records. */
    value: (counter: Counter, value: number, perBase: boolean) => n(value, perBase ? (counter === "records" ? 2 : 0) : counter === "records" && !Number.isInteger(value) ? 1 : 0),
    /** "2023-09-30" to "30. September" / "30 September". */
    date: (iso: string) => {
      const month = pack.months[Number(iso.slice(5, 7)) - 1] ?? "";
      return fill(pack.date, { d: Number(iso.slice(8, 10)), m: month });
    },
    /** "2026-10-26" to "26. Oktober 2026" / "26 October 2026". */
    fullDate: (iso: string) => {
      const month = pack.months[Number(iso.slice(5, 7)) - 1] ?? "";
      return `${fill(pack.date, { d: Number(iso.slice(8, 10)), m: month })} ${iso.slice(0, 4)}`;
    },
    /** "2024-02" to "Februar 2024" / "February 2024". */
    month: (key: string) => `${pack.months[Number(key.slice(5, 7)) - 1] ?? key} ${key.slice(0, 4)}`,
    /** Fills a template with the pack's fixed values ({line}, {per}) and the given ones. */
    t: (template: string, values: Readonly<Record<string, string | number>> = {}) => fill(template, { line: LINE, per, ...values }),
  };
}

export type Fmt = ReturnType<typeof formatter>;
