import { describe, expect, it } from "vitest";
import { applyPaste, derive, prefill } from "./compare-state";
import { COPY } from "./copy";
import { parsePaste } from "./parse";

describe("Dein Vergleich state", () => {
  it("prefills NORTHWIND and derives the spec numbers", () => {
    const d = derive(prefill(COPY.de), COPY.de);
    expect(d.result.ok && Math.round(d.result.h * 1000)).toBe(258);
    expect(d.facts).toMatchObject({ nameA: "August", nameB: "September", countA: 4, countB: 5, unit: "weeks" });
    expect(prefill(COPY.en).aVal).toBe("17,233,647");
  });

  it("flags a Mio field and names the missing fields instead of guessing", () => {
    const own = { ...prefill(COPY.de), aVal: "17,2 Mio", bN: "" };
    const d = derive(own, COPY.de);
    expect(d.scale).toEqual(["aVal"]);
    expect(d.result).toEqual({ ok: false, missing: ["aVal", "bN"] });
    expect(d.facts).toBeNull();
  });

  it("counts working days from the months and the holiday stepper", () => {
    const own = { ...prefill(COPY.de), unit: "days" as const, aHol: 1 };
    const d = derive(own, COPY.de);
    expect([d.countA, d.countB]).toEqual([22, 21]);
    expect(d.result.ok && Math.round(d.result.p * 1000)).toBe(Math.round(((21687544 / 21) / (17233647 / 22) - 1) * 1000));
    expect(d.nameA).toBe("August");
  });

  it("fills the fields from pasted weekly rows", () => {
    const text = [
      "2023-08-05\t4295459", "2023-08-12\t4442950", "2023-08-19\t4042856", "2023-08-26\t4452382",
      "2023-09-02\t4409249", "2023-09-09\t4307325", "2023-09-16\t4293319", "2023-09-23\t4202199", "2023-09-30\t4475452",
    ].join("\n");
    const parsed = parsePaste(text, "de");
    if (!parsed.ok) throw new Error("paste");
    const own = applyPaste(prefill(COPY.de), parsed, COPY.de);
    expect(own).toMatchObject({ aVal: "17.233.647", bVal: "21.687.544", aN: "4", bN: "5", unit: "weeks", edited: true });
  });

  it("explains absurd input by field instead of a giant percentage", () => {
    const wrongField = derive({ ...prefill(COPY.de), bN: "9450000" }, COPY.de);
    expect(wrongField.result.ok).toBe(false);
    expect(wrongField.note).toContain("Anzahl B");
    expect(wrongField.flagged).toEqual(["bN"]);
    const scale = derive({ ...prefill(COPY.de), bVal: "99999999999" }, COPY.de);
    expect(scale.note).toBe(COPY.de.cmp.tooBig);
  });

  it("names the real problem per field: not a number, count below one, value not positive, or empty", () => {
    const note = (patch: Partial<ReturnType<typeof prefill>>) => derive({ ...prefill(COPY.de), ...patch }, COPY.de).note;
    expect(note({ aVal: "1e9" })).toBe("Wert A: keine Zahl erkannt.");
    expect(note({ bVal: "abc" })).toBe("Wert B: keine Zahl erkannt.");
    expect(note({ aN: "-2" })).toBe("Anzahl A muss mindestens 1 sein.");
    expect(note({ aN: "0" })).toBe("Anzahl A muss mindestens 1 sein.");
    expect(note({ bN: "abc" })).toBe("Anzahl B: keine Zahl erkannt.");
    expect(note({ aVal: "0" })).toBe("Wert A muss größer als 0 sein.");
    expect(note({ aVal: "" })).toBe("Zu wenig Daten. Es fehlt: Wert A.");
    expect(note({ aVal: "", bN: "abc" })).toBe("Zu wenig Daten. Es fehlt: Wert A. Anzahl B: keine Zahl erkannt.");
    expect(derive({ ...prefill(COPY.en), aVal: "1e9" }, COPY.en).note).toBe("Value A: no number recognised.");
    expect(note({})).toBeNull();
  });

  const rows = (month: number, last: number, keep: (weekday: number, day: number) => boolean) =>
    Array.from({ length: last }, (_, index) => index + 1)
      .filter((d) => keep(new Date(Date.UTC(2023, month - 1, d)).getUTCDay(), d))
      .map((d) => `2023-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}\t100`);
  const weekday = (day: number) => day !== 0 && day !== 6;

  it("remembers how many pasted weekdays had no value, per side", () => {
    const text = [...rows(8, 31, (w, d) => weekday(w) && d !== 10 && d !== 11), ...rows(9, 30, (w) => weekday(w))].join("\n");
    const parsed = parsePaste(text, "de");
    if (!parsed.ok) throw new Error("paste");
    const own = applyPaste(prefill(COPY.de), parsed, COPY.de);
    expect(own.unit).toBe("days");
    expect(own.aGap).toBe(2);
    expect(own.aHol).toBe(own.aGap);
    expect(own.bGap).toBe(0);
  });

  it("turns a paste with weekend rows into calendar days and keeps the whole total", () => {
    const text = [...rows(8, 31, (_, d) => d !== 10), ...rows(9, 30, () => true)].join("\n");
    const parsed = parsePaste(text, "de");
    if (!parsed.ok) throw new Error("paste");
    const own = applyPaste(prefill(COPY.de), parsed, COPY.de);
    expect(own).toMatchObject({ unit: "cdays", aVal: "3.000", bVal: "3.000", aGap: 1, aHol: 1 });
    const d = derive(own, COPY.de);
    expect([d.countA, d.countB]).toEqual([30, 30]);
    expect(d.facts?.unit).toBe("cdays");
  });
});
