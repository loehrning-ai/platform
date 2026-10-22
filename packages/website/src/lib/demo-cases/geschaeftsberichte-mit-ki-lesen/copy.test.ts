import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { COPY, type NorthwindCopy } from "./copy";
import { formatDecimal, formatEur, formatInt, formatPct, plainSpaces } from "./format";
import {
  craftEvidence,
  linePerWeekGrowth,
  rate,
  totalPerWeekGrowth,
} from "./logic";
import { bridgeText, sheetText } from "./texts";
import { INITIAL_STATE, reducer, type DemoAction } from "./logic";

/** Every string in the copy, with function outputs for sample arguments. */
function strings(value: unknown, path = ""): { path: string; text: string }[] {
  if (typeof value === "string") return [{ path, text: value }];
  if (typeof value === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    const samples: unknown[][] = [
      [[1, 4], [2, 3, 5, 6]],
      ["x", "y"],
      [1, 4],
      [3],
    ];
    return samples.flatMap((args, index) => {
      try {
        const out = fn(...args);
        return typeof out === "string" ? [{ path: `${path}(${index})`, text: out }] : [];
      } catch {
        return [];
      }
    });
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, inner]) => strings(inner, path ? `${path}.${key}` : key));
  }
  return [];
}

function keys(value: unknown, path = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, inner]) => keys(inner, path ? `${path}.${key}` : key));
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => keys(item, `${path}[${index}]`));
  return [path];
}

const sentences = (text: string) => text.split(/(?<=[.!?:;])\s+/);

/** Every choice group the learner sees: option labels, and which one holds. */
function groups(copy: NorthwindCopy): { name: string; labels: string[]; holds: string }[] {
  const decide = copy.decide.options;
  return [
    {
      name: "compare",
      labels: Object.values(copy.compare.options).map((option) => option.label),
      holds: copy.compare.options["line-week"].label,
    },
    {
      name: "defects",
      labels: Object.values(copy.defects.options).map((option) => option.label),
      holds: copy.defects.options.per1000.label,
    },
    {
      name: "flag",
      labels: Object.values(copy.flag.options).map((option) => option.label),
      holds: copy.flag.options.chronic.label,
    },
    {
      name: "decision",
      labels: Object.values(decide.decision).map((option) => option.label),
      holds: decide.decision.rework.label,
    },
    {
      name: "number",
      labels: Object.values(decide.number).map((option) => option.label),
      holds: decide.number["rate-251"].label,
    },
    {
      name: "cost",
      labels: Object.values(decide.cost).map((option) => option.label),
      holds: decide.cost["both-ways"].label,
    },
    {
      name: "open",
      labels: Object.values(decide.open).map((option) => option.label),
      holds: decide.open.marketing.label,
    },
    {
      name: "counter",
      labels: Object.values(decide.counter).map((option) => option.label),
      holds: decide.counter["rate-fell"].label,
    },
    {
      name: "trigger",
      labels: Object.values(decide.trigger).map((option) => option.label),
      holds: decide.trigger["rate-and-scrap"].label,
    },
  ];
}

/** Every bridge text the learner can produce. */
function allBridgeTexts(locale: Locale): string[] {
  const actions: DemoAction[][] = [];
  for (const compare of ["line-month", "total-week", "line-week"] as const) {
    for (const defect of ["count", "per1000", "returns"] as const) {
      for (const flag of ["chronic", "rising", "most-reports"] as const) {
        for (const open of ["weeks", "marketing", "rate"] as const) {
          actions.push([
            { type: "compare", value: compare },
            { type: "defect", value: defect },
            { type: "flag", value: flag },
            { type: "sheet", field: "open", value: open },
          ]);
        }
      }
    }
  }
  return actions.map((list) => bridgeText(list.reduce(reducer, INITIAL_STATE), COPY[locale]).text);
}

describe.each(SUPPORTED_LOCALES)("copy guards (%s)", (locale) => {
  const copy = COPY[locale];
  const all = [
    ...strings(copy),
    ...allBridgeTexts(locale).map((text, index) => ({ path: `bridge#${index}`, text })),
  ];

  it("the holding option is never the only longest label, and the spread stays within 1,35×", () => {
    for (const group of groups(copy)) {
      const lengths = group.labels.map((label) => label.length);
      const longest = Math.max(...lengths);
      const shortest = Math.min(...lengths);
      const longestLabels = group.labels.filter((label) => label.length === longest);
      expect(
        longestLabels.length === 1 && longestLabels[0] === group.holds,
        `${group.name}: the holding option is the only longest`,
      ).toBe(false);
      expect(longest / shortest, `${group.name} spread`).toBeLessThanOrEqual(1.35);
    }
  });

  it("every string with 691 says it is valued at list price", () => {
    const needle = locale === "de" ? "Listenpreis" : "list price";
    for (const { path, text } of all) {
      if (text.includes("691")) expect(text, path).toContain(needle);
    }
  });

  it("never pairs revenue with the −2,1 % in one sentence", () => {
    const revenue = locale === "de" ? /Umsatz/ : /revenue/i;
    const twoOne = /(?<![\d.,])2[.,]1(?![\d])/;
    for (const { path, text } of all) {
      for (const sentence of sentences(text)) {
        if (twoOne.test(sentence)) expect(revenue.test(sentence), `${path}: ${sentence}`).toBe(false);
      }
    }
  });

  it("never mentions the machine count", () => {
    for (const { path, text } of all) expect(text, path).not.toMatch(/maschine|machine/i);
  });

  it("the bridge never triggers the worksheet's model table, and every line names its blank", () => {
    for (const text of allBridgeTexts(locale)) {
      expect(text).not.toMatch(/worksheet answers|model answers|Arbeitsblatt-Antworten|Musterantworten/i);
      const [lead, ...lines] = text.split("\n");
      expect(lead).toMatch(locale === "de" ? /^Das sind meine eigenen Antworten/ : /^These are my own answers/);
      for (const line of lines) expect(line).toMatch(/^Blank [1-6] · /);
    }
  });

  it("449 appears only together with the word mean", () => {
    const needle = locale === "de" ? "Mittel" : "mean";
    for (const { path, text } of all) {
      if (/(?<![\d.,])449(?![\d])/.test(text)) expect(text, path).toContain(needle);
    }
  });

  it("uses no em or en dash and no hyphen as a minus", () => {
    for (const { path, text } of all) {
      expect(text, path).not.toMatch(/[–—]/);
      expect(text, path).not.toMatch(/(?:^|\s)-\d/);
    }
  });

  it("never lets a number break away from its unit (no-break space, not a plain one)", () => {
    const plainBreak =
      /\d (?:%|€|Tsd\.|Mio\.)|(?:Tsd|Mio)\. €|1\.000 Einheiten|1,000 units|Ø \d|(?:PULSE|CRAFT|NEST|BEAM|ECHO|BREW|AURA)(?:s|'s)? [−+]\d/;
    for (const { path, text } of all) {
      expect(text, path).not.toMatch(plainBreak);
    }
  });

  it("the take-aways are exact", () => {
    expect(copy.takeaways.check.text.split("\n")).toHaveLength(1);
    expect(copy.takeaways.traps.text.split("\n")).toHaveLength(5);
    expect(copy.takeaways.sheet.text.split("\n")).toHaveLength(6);
  });
});

describe("German copy", () => {
  it("uses real umlauts, never ae/oe/ue substitutes", () => {
    const substitutes =
      /\b(?:fuer|ueber|Ueber|Maengel|maengel|Pruef|pruef|waehl|Waehl|Geschaeft|moeglich|koenn|muess|zurueck|haelt|faellt|aender|Aender|schoen|groess|hoeh|naech|spaet|Laeng|laeng|traegt|taeuscht|fliesst|Schluessel|Stueck|Zusaetz|zaehl|gehoert|schliesst|Grosst)/;
    for (const { path, text } of strings(COPY.de)) expect(text, path).not.toMatch(substitutes);
  });

  it("speaks to the learner as du", () => {
    for (const { path, text } of strings(COPY.de)) expect(text, path).not.toMatch(/\b(?:Sie haben|Ihre|Ihr Blatt|Wählen Sie)\b/);
  });
});

describe("DE / EN parity", () => {
  it("has the same keys in both locales", () => {
    expect(keys(COPY.en)).toEqual(keys(COPY.de));
  });
});

describe("copy numbers match the computed values", () => {
  const de = COPY.de;
  const p = (value: number) => formatPct("de", value);
  const d = (value: number) => formatDecimal("de", value);

  it("station 1", () => {
    for (const line of ["PULSE", "CRAFT", "NEST"] as const) {
      expect(de.compare.options["line-week"].result).toContain(`${line}\u00a0${p(linePerWeekGrowth(line))}`);
      expect(de.compare.options["total-week"].result).toContain(`${line}\u00a0${p(linePerWeekGrowth(line))}`);
    }
    expect(de.compare.options["total-week"].result).toContain(p(totalPerWeekGrowth()));
    expect(de.compare.report).toContain(p(totalPerWeekGrowth()));
  });

  it("station 2", () => {
    expect(de.defects.options.per1000.result).toContain(d(rate("CRAFT", "2023-09")!));
    expect(de.defects.options.per1000.result).toContain(d(rate("NEST", "2023-09")!));
    const evidence = craftEvidence();
    const chronic = de.flag.options.chronic.result;
    expect(chronic).toContain(d(evidence.rateAug));
    expect(chronic).toContain(p(evidence.scrapShareAug).replace("+", ""));
    expect(chronic).toContain(p(evidence.scrapShareSep).replace("+", ""));
    expect(chronic).toContain(`${Math.round(evidence.scrapEur / 1000)}\u00a0Tsd.\u00a0€`);
  });

  it("station 3 totals", () => {
    expect(de.check.claims["craft-revenue"].total).toContain(formatEur("de", 4_124_238));
    expect(de.check.claims["craft-units"].total).toContain(formatInt("de", 9_162));
  });
});

describe("texts", () => {
  const strongest: DemoAction[] = [
    { type: "compare", value: "line-week" },
    { type: "defect", value: "per1000" },
    { type: "flag", value: "chronic" },
    { type: "sheet", field: "decision", value: "rework" },
    { type: "sheet", field: "number", value: "rate-251" },
    { type: "sheet", field: "cost", value: "both-ways" },
    { type: "sheet", field: "open", value: "marketing" },
    { type: "sheet", field: "counter", value: "rate-fell" },
    { type: "sheet", field: "trigger", value: "rate-and-scrap" },
  ];
  const state = strongest.reduce(reducer, INITIAL_STATE);

  it("bridge, strongest path, DE", () => {
    expect(bridgeText(state, COPY.de).text).toBe(
      [
        "Das sind meine eigenen Antworten auf Blank 1, 4, 5 und 6. Frag mich nur noch Blank 2 und 3.",
        "Blank 1 · Mängel: Mängel sind NCRs aus der Produktion, je Linie und Monat, verglichen je 1.000 gelieferte Einheiten. Keine Kundenretouren.",
        "Blank 4 · Vergleich: Jede Linie gegen ihren eigenen Vormonat, je Lieferwoche gerechnet, nie nur die Firmensumme.",
        "Blank 5 · Flag: Flagge die Linie mit der höchsten Preisspanne und der höchsten Mängelquote je 1.000. Zwei Monate in Folge: erst nacharbeiten, dann Budget. Das Flag ist eine Frage, kein Urteil.",
        "Blank 6 · Grenzen: Nenne die Grenze im selben Satz wie die Zahl. Offen bleiben Marge je Linie, Retouren je Linie und ob Marketing CRAFT bewegt.",
      ].join("\n"),
    );
  });

  it("bridge, strongest path, EN", () => {
    const text = bridgeText(state, COPY.en).text;
    expect(text.split("\n")[0]).toBe("These are my own answers to blanks 1, 4, 5 and 6. Only ask me blanks 2 and 3.");
    expect(text.split("\n")[4]).toBe(
      "Blank 6 · Limits: name the limit in the same sentence as the number. Still open: margin per line, returns per line, whether marketing moves CRAFT.",
    );
  });

  it("bridge, live order (stations 1 and 2 only)", () => {
    const live = strongest.slice(0, 3).reduce(reducer, INITIAL_STATE);
    expect(bridgeText(live, COPY.de).text.split("\n")[0]).toBe(
      "Das sind meine eigenen Antworten auf Blank 1, 4 und 5. Frag mich nur noch Blank 2, 3 und 6.",
    );
    expect(bridgeText(live, COPY.en).text.split("\n")[0]).toBe(
      "These are my own answers to blanks 1, 4 and 5. Only ask me blanks 2, 3 and 6.",
    );
  });

  it("bridge, one weak path and a single blank", () => {
    const weak = reducer(INITIAL_STATE, { type: "compare", value: "total-week" });
    expect(bridgeText(weak, COPY.de).text).toBe(
      "Das sind meine eigenen Antworten auf Blank 4. Frag mich nur noch Blank 1, 2, 3, 5 und 6.\nBlank 4 · Vergleich: Die ganze Firma gegen den Vormonat, je Lieferwoche gerechnet.",
    );
    expect(bridgeText(weak, COPY.en).text.split("\n")[0]).toBe(
      "These are my own answers to blank 4. Only ask me blanks 1, 2, 3, 5 and 6.",
    );
    expect(bridgeText(INITIAL_STATE, COPY.de)).toEqual({ answered: [], text: "" });
  });

  it("sheet, strongest path, DE and EN", () => {
    expect(plainSpaces(sheetText(state.sheet, COPY.de))).toBe(
      [
        "Entscheidung: Erst nacharbeiten, das Zusatzbudget einen Monat halten.",
        "Die Zahl: 2,51 Mängel je 1.000 Einheiten, 2,2-mal NEST (ncr_records.csv und demand_actuals.csv, September 2023).",
        "Irrtum kostet: Zu früh gebremst fehlt Umsatz, zu früh gefördert kaufen wir Ausschuss mit.",
        "Offen: Marge je Linie, Retouren je Linie, ob Marketing CRAFT bewegt.",
        "Gegenargument: Nur CRAFTs Quote fiel, von 3,21 auf 2,51 je 1.000 Einheiten.",
        "Freigabe: Oktober unter 2,51 je 1.000 und Ausschuss unter 8 % vom Umsatz.",
      ].join("\n"),
    );
    expect(plainSpaces(sheetText(state.sheet, COPY.en))).toBe(
      [
        "Decision: rework first, hold the extra budget for one month.",
        "The number: 2.51 defects per 1,000 units, 2.2 times NEST (ncr_records.csv and demand_actuals.csv, September 2023).",
        "Cost of being wrong: brake too early and we lose revenue, fund too early and we buy scrap.",
        "Open: margin per line, returns per line, whether marketing moves CRAFT.",
        "Counterargument: only CRAFT's rate fell, from 3.21 to 2.51 per 1,000 units.",
        "Release: October below 2.51 per 1,000 and scrap under 8% of revenue.",
      ].join("\n"),
    );
  });

  it("sheet, weak lines carry their tag; the cross-row rule tags the number", () => {
    const text = plainSpaces(sheetText({ decision: "marketing", number: "rate-251", cost: "lost-revenue" }, COPY.de));
    expect(text.split("\n")).toEqual([
      "Entscheidung: Mehr Q3-Marketing jetzt, die Mängel parallel beheben. [täuscht]",
      "Die Zahl: 2,51 Mängel je 1.000 Einheiten, 2,2-mal NEST (ncr_records.csv und demand_actuals.csv, September 2023). [täuscht]",
      "Irrtum kostet: Jeder Monat ohne Zusatzbudget kostet CRAFT bis zu 4,12 Mio. € Umsatz. [nicht in den Daten]",
    ]);
    expect(sheetText({}, COPY.de)).toBe("");
  });
});
