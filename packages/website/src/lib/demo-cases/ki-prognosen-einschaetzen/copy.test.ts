import { describe, expect, it } from "vitest";
import { MORNINGS, OPTION_KEYS } from "./data";
import { FORECAST_COPY } from "./copy";
import { fmtInt, fmtPct, fmtSignedPct, fmtHours, fmtTriple, fmtList, keepTriplesTogether, MINUS } from "./fmt";
import { PRESET_SPLITS, splitMessage } from "./logic";
import type { Triple } from "./data";

/** Every reachable string of a copy object, with functions called on sample arguments. */
function strings(value: unknown, locale: "de" | "en"): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    if (fn.length === 2 && fn.name.endsWith("Message")) {
      const splits: Triple[] = [[350, 350, 350], [700, 250, 100], [600, 300, 150], [500, 370, 180], [480, 365, 205], PRESET_SPLITS.ask, PRESET_SPLITS.preorders, [520, 330, 200]];
      return splits.flatMap((split) => strings(fn(splitMessage(split), locale), locale));
    }
    const args = Array.from({ length: fn.length }, (_, i) => (i === 0 ? "1" : `x${i}`));
    return strings(fn(...args.map((arg) => (/^\d+$/.test(arg) ? 3 : arg))), locale).concat(strings(fn(...args), locale));
  }
  if (Array.isArray(value)) return value.flatMap((entry) => strings(entry, locale));
  if (value && typeof value === "object") return Object.values(value).flatMap((entry) => strings(entry, locale));
  return [];
}

function shape(value: unknown): unknown {
  if (typeof value === "function") return "fn";
  if (typeof value === "string") return "s";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

describe("Demo 01 copy", () => {
  const de = strings(FORECAST_COPY.de, "de");
  const en = strings(FORECAST_COPY.en, "en");

  it("has the same keys and list lengths in DE and EN", () => {
    expect(shape(FORECAST_COPY.en)).toEqual(shape(FORECAST_COPY.de));
  });

  it("uses no em or en dashes and no ASCII umlaut substitutes", () => {
    for (const text of [...de, ...en]) {
      expect(text, text).not.toMatch(/[–—]/);
      expect(text, text).not.toMatch(/ - /);
    }
    const substitutes = /\b(?:fuer|ueber|Pruef|pruef|Geraet|naechst|waehrend|koennen|muessen|Stueck|frueh|schwaech|hoeher|Bestaend|zurueck|Rueck|laeuft|gaebe|haette|verkaeuf|Verkaeuf|Ausloes|loes|Gruen|gruen|reiss)/;
    for (const text of de) expect(text, text).not.toMatch(substitutes);
  });

  it("names no real city, country, brand or vendor", () => {
    const banned = /Skopje|Bitola|Macedonia|Mazedonien|East Gate|City Mall|iPhone|Apple|Snowflake|LightGBM|\bMall\b/i;
    for (const text of [...de, ...en]) expect(text, text).not.toMatch(banned);
  });

  it("has an option label for every option, a why and a lesson for every morning", () => {
    for (const locale of ["de", "en"] as const) {
      const copy = FORECAST_COPY[locale].mornings;
      for (const key of OPTION_KEYS) expect(copy.options[key].length).toBeGreaterThan(3);
      expect(copy.why).toHaveLength(MORNINGS.length);
      expect(copy.lessons).toHaveLength(MORNINGS.length);
      // Every wrong option has its own consequence; the right one is the why.
      for (const [i, m] of MORNINGS.entries()) {
        const wrong = m.options.filter((o) => m.grade[o] !== "right");
        expect(Object.keys(copy.consequences[i] ?? {}).sort()).toEqual([...wrong].sort());
      }
    }
  });

  it("the morning check carries every blank and all four case values", () => {
    const de = FORECAST_COPY.de.takeaways.check("der Planer oder die Planerin vom Dienst");
    expect(de.match(/___/g)).toHaveLength(6);
    for (const value of ["(im Fall: 2)", "14 %", "21 %", "(im Fall: 5 %)", "über 80 %"]) expect(de).toContain(value);
    expect(de).toContain("Ein Nein: der Planer oder die Planerin vom Dienst entscheidet, bevor etwas rausgeht.");
    expect(de).toContain(`zwischen ${MINUS}___ % und +___ %`);
    const en = FORECAST_COPY.en.takeaways.check("the planner on duty");
    expect(en.match(/___/g)).toHaveLength(6);
    for (const value of ["(in the case: 2)", "14%", "21%", "(in the case: 5%)", "over 80%"]) expect(en).toContain(value);
  });

  it("has five sentences with eight blanks and one example each", () => {
    for (const locale of ["de", "en"] as const) {
      const t = FORECAST_COPY[locale].takeaways;
      expect(t.sentences).toHaveLength(5);
      expect(t.examples).toHaveLength(5);
      const blanks = t.sentences.flat().filter((part) => typeof part !== "string");
      expect(blanks).toHaveLength(8);
      const labels = blanks.map((part) => (typeof part === "string" ? "" : part.label));
      expect(new Set(labels).size).toBe(8);
    }
  });

  it("states the spec's split messages", () => {
    const m = FORECAST_COPY.de.split.message;
    expect(m(splitMessage([350, 350, 350]), "de")).toBe(
      "Gleiche Teile klingen fair, aber die Kleinstadt bekommt 152 % ihres Medians und das Zentrum 65 %: 120 Geräte bleiben liegen, und das Zentrum schickt 190 Kunden ohne Gerät heim.",
    );
    expect(m(splitMessage([700, 250, 100]), "de")).toBe(
      "Standort Zentrum bekommt mehr, als er angemeldet hat (700 statt 610). Bei Median-Nachfrage bleiben dort 160 liegen, während Standort Stadtrand 160 Kunden ohne Gerät heimschickt.",
    );
    expect(m(splitMessage([500, 370, 180]), "de")).toContain("(21,7 %) als dem Zentrum (7,4 %)");
    expect(m(splitMessage(PRESET_SPLITS.ask), "de")).toContain("nur 3,5 % Luft nach unten");
    expect(m(splitMessage(PRESET_SPLITS.preorders), "de")).toContain("nur 4,8 % Luft nach unten, und die Kleinstadt schickt 71 Kunden heim");
    expect(FORECAST_COPY.en.split.message(splitMessage(PRESET_SPLITS.ask), "en")).toContain("only 3.5% room below its median");
  });
});

describe("Demo 01 copy, round 2", () => {
  it("never repeats the bold lesson in the why printed right after it", () => {
    for (const locale of ["de", "en"] as const) {
      const m = FORECAST_COPY[locale].mornings;
      for (const [i, lesson] of m.lessons.entries()) {
        const why = (m.why[i] ?? "").toLowerCase();
        const fragments = lesson
          .toLowerCase()
          .split(/[.:]/)
          .map((part) => part.trim())
          .filter((part) => part.length >= 12);
        for (const fragment of fragments) expect(why, `${locale} morning ${i + 1}`).not.toContain(fragment);
      }
    }
  });

  it("does not open a split message with the headline's 'everything sells'", () => {
    for (const split of [PRESET_SPLITS.ask, PRESET_SPLITS.preorders, [500, 370, 180], [520, 330, 200]] as Triple[]) {
      expect(FORECAST_COPY.de.split.message(splitMessage(split), "de")).not.toMatch(/verkauft (sie )?alles/);
      expect(FORECAST_COPY.en.split.message(splitMessage(split), "en")).not.toMatch(/sells everything/);
    }
  });

  it("pluralises the English result lines", () => {
    const r = FORECAST_COPY.en.result;
    expect(r.missed("2", 1)).toBe("Slipped through: morning 2.");
    expect(r.missed("2 and 5", 2)).toBe("Slipped through: mornings 2 and 5.");
    expect(r.needless("1, 3 and 6", 3)).toBe("Held for nothing: mornings 1, 3 and 6.");
    expect(FORECAST_COPY.de.result.wrongStep("2 und 5", 2)).toBe("Falscher Schritt: Morgen 2 und 5.");
  });

  it("keeps number triples in running text on one line", () => {
    const nb = "\u00A0";
    expect(FORECAST_COPY.de.mornings.deliveryModel("23 / 17 / 10")).toBe(`Heute geht der Plan des Modells raus: 23${nb}/${nb}17${nb}/${nb}10.`);
    expect(FORECAST_COPY.de.split.continueMedian).toBe(`Mit 480${nb}/${nb}365${nb}/${nb}205 weiter`);
    // Names keep their ordinary spaces.
    expect(FORECAST_COPY.de.stores.order).toBe("Zentrum / Stadtrand / Kleinstadt");
    expect(keepTriplesTogether(`a 24 / ${MINUS}3 / +5 b`)).toBe(`a 24${nb}/${nb}${MINUS}3${nb}/${nb}+5 b`);
  });
});

describe("Demo 01 number formats", () => {
  it("formats DE and EN numbers", () => {
    expect(fmtInt(1050, "de")).toBe("1.050");
    expect(fmtInt(1050, "en")).toBe("1,050");
    expect(fmtInt(-12, "de")).toBe(`${MINUS}12`);
    expect(fmtPct(0.12, "de")).toBe("12,0 %");
    expect(fmtPct(0.12, "en")).toBe("12.0%");
    expect(fmtPct(0.81, "de", 0)).toBe("81 %");
    expect(fmtSignedPct(0.024, "de")).toBe("+2,4 %");
    expect(fmtSignedPct(-0.012, "de")).toBe(`${MINUS}1,2 %`);
    expect(fmtSignedPct(-0.012, "en")).toBe(`${MINUS}1.2%`);
    expect(fmtSignedPct(0, "de")).toBe("0,0 %");
    expect(fmtSignedPct(-0.0001, "en")).toBe("0.0%");
    expect(fmtHours(1.2, "de")).toBe("1,2 Std.");
    expect(fmtHours(3.4, "en")).toBe("3.4 h");
    expect(fmtTriple([480, 365, 205], "de")).toBe("480 / 365 / 205");
    expect(fmtList(["1", "3", "6"], "de")).toBe("1, 3 und 6");
    expect(fmtList(["2", "4"], "en")).toBe("2 and 4");
    expect(fmtList(["5"], "en")).toBe("5");
  });
});
