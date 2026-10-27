import { fill, fmtEur, fmtNumber, type Lang } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stack";

/** Formats for the stage in one language; a number never breaks from its unit ("962 €", "6,97 %"). */
export interface Fmt {
  readonly lang: Lang;
  readonly money: (cents: number) => string;
  /** Price of one box, three decimals ("0,575 €" / "€0.575"). */
  readonly unit: (cents: number) => string;
  readonly qty: (boxes: number) => string;
  readonly pct: (value: number, places?: number) => string;
  readonly t: (template: string, vars?: Readonly<Record<string, string | number>>) => string;
}

const bind = (text: string) => text.replace(/(\d) (€|%)/g, "$1\u00a0$2");

export function formatter(lang: Lang): Fmt {
  const qty = (boxes: number) => String(boxes).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "de" ? "." : ",");
  return {
    lang,
    money: (cents) => bind(fmtEur(cents, lang)),
    unit: (cents) => {
      const text = (cents / 100).toFixed(3);
      return lang === "de" ? `${text.replace(".", ",")}\u00a0€` : `€${text}`;
    },
    qty,
    pct: (value, places = 2) => fmtNumber(value, places, lang),
    t: (template, vars = {}) => bind(fill(template, vars)),
  };
}
