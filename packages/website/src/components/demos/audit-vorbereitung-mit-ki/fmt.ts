import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import type { Status } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import type { Model, ModelFinding, ModelLine } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";

type Values = Readonly<Record<string, string | number>>;

/** Text helpers of the demo: slots, dates without a clock, the finding sentences. Pure; the copy and the model are props. */
export interface Fmt {
  readonly copy: W05Copy;
  readonly locale: "de" | "en";
  /** Fills the "{name}" slots of a copy string; a filled slot that ends in a full stop ("30. Nov.") never doubles the sentence's own. */
  t(template: string, values?: Values): string;
  /** "27 November 2026" or "27. November 2026". */
  date(iso: string): string;
  /** The printable weekday word ("Thu"), or an empty string for the day the demo never names. */
  weekday(weekday: number | null): string;
  /** A short day cell: the weekday when the demo may print it, then the day of the month. */
  day(iso: string, weekday: number | null): string;
  /** A day with its month in short form, for a choice button. */
  short(iso: string, weekday: number | null): string;
  /** A day, the short month and the year, for a choice button: "26 Nov 2026" or "26. Nov. 2026". */
  dayYear(iso: string): string;
  list(ids: readonly string[]): string;
  status(status: Status): string;
  /** The sentence of one finding, from its template and the oracle's numbers. */
  finding(line: ModelLine, finding: ModelFinding, model: Model): string;
}

const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y as number, month: (m as number) - 1, day: d as number };
};

export function formatter(copy: W05Copy): Fmt {
  const de = copy.locale === "de";
  const date = (iso: string) => {
    const { year, month, day } = parts(iso);
    const name = copy.months[month] as string;
    return de ? `${day}. ${name} ${year}` : `${day} ${name} ${year}`;
  };
  const shortDate = (iso: string) => {
    const { month, day } = parts(iso);
    const name = copy.monthsShort[month] as string;
    return de ? `${day}. ${name}` : `${day} ${name}`;
  };
  const weekdayWord = (weekday: number | null) => (weekday === null ? "" : (copy.weekdays[weekday - 1] ?? ""));
  return {
    copy,
    locale: copy.locale,
    t: (template, values = {}) => fill(template, values).replace(/(?<!\.)\.\.(?!\.)/g, "."),
    date,
    weekday: weekdayWord,
    day: (iso, weekday) => (weekday === null ? String(parts(iso).day) : `${weekdayWord(weekday)} ${parts(iso).day}`),
    dayYear: (iso) => `${shortDate(iso)} ${parts(iso).year}`,
    short: (iso, weekday) => (weekday === null ? shortDate(iso) : `${weekdayWord(weekday)} ${shortDate(iso)}`),
    list: (ids) => ids.join(", "),
    status: (status) => copy.status[status],
    finding: (line, finding, model) => {
      const templates = copy.xray.finding as Readonly<Record<string, string>>;
      const template = templates[line.id];
      if (!template) return "";
      const facts = finding.facts as Readonly<Record<string, unknown>>;
      const periodEnd = typeof facts.periodEnd === "string" ? facts.periodEnd : model.pay.periodEnd;
      return fill(template, {
        people: finding.people.join(", "),
        n: finding.number,
        month: copy.months[parts(periodEnd).month] as string,
        listed: typeof facts.listed === "number" ? facts.listed : 0,
        titles: typeof facts.titles === "number" ? facts.titles : model.titles.length,
      });
    },
  };
}
