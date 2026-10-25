import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { fill, formatNumber, formatPercent } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import type { Counter } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";

export { fill };

/** The number formats of one pack: German or English digits, real minus, thin space before %. */
export function formatter(pack: DemoPack) {
  const locale = pack.locale === "en" ? "en" : "de";
  const n = (value: number, digits = 0) => formatNumber(value, locale, { digits });
  return {
    n,
    /** A growth rate with sign: +22,4 %. */
    pct: (fraction: number, digits = 1) => formatPercent(fraction, locale, { digits }),
    /** A share without sign: 16,8 %. */
    share: (fraction: number, digits = 1) => formatPercent(fraction, locale, { digits, sign: false }),
    eur: (value: number, digits = 0) => fill(pack.money, { v: n(value, digits) }),
    /** A rate per 1.000 the way the report rounds it: records to two decimals, units whole. */
    rate: (counter: Counter, value: number) => n(value, counter === "records" ? 2 : 0),
    per: n(1000),
  };
}

export type Fmt = ReturnType<typeof formatter>;
