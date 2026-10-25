import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { compare } from "./logic";
import { buildPrompt, buildRules, buildSentence, verdictText, type Facts } from "./takeaway";

function facts(overrides: Partial<Facts> = {}): Facts {
  const base = { metric: "", nameA: "August", nameB: "September", unit: "weeks" as const, valueA: 17233647, valueB: 21687544, countA: 4, countB: 5 };
  const result = compare({ aVal: base.valueA, aN: base.countA, bVal: base.valueB, bN: base.countB });
  if (!result.ok) throw new Error("fixture");
  return { ...base, h: result.h, p: result.p, s: result.s, verdict: result.verdict, ...overrides };
}

const DE_SENTENCE =
  "Umsatz September: 21,69 Mio. € gegenüber 17,23 Mio. € im August (+25,8 %). Der September hat fünf Lieferwochen, der August vier. Pro Lieferwoche: 4,34 Mio. € gegenüber 4,31 Mio. € (+0,7 %). Rund 97 % des Anstiegs sind die zusätzliche Woche. Vergleichbar heißt nicht richtig: Feiertage und Aktionen sind nicht berücksichtigt. Zugeordnet nach Startdatum der Woche.";
const EN_SENTENCE =
  "Revenue September: EUR 21.69M against EUR 17.23M in August (+25.8 %). September has five shipping weeks, August four. Per shipping week: EUR 4.34M against EUR 4.31M (+0.7 %). Around 97 % of the increase is the extra week. Comparable does not mean right: holidays and promotions are not accounted for. Weeks assigned by start date.";

describe("report sentence", () => {
  it("is exactly the spec sentence for the Northwind prefill (DE)", () => {
    expect(buildSentence(COPY.de, facts({ metric: COPY.de.take.metric }))).toBe(DE_SENTENCE);
  });

  it("is exactly the spec sentence for the Northwind prefill (EN)", () => {
    expect(buildSentence(COPY.en, facts({ metric: COPY.en.take.metric }))).toBe(EN_SENTENCE);
  });

  it("replaces every number with the visitor's own and drops the week attribution for days", () => {
    const own = compare({ aVal: 80000, aN: 20, bVal: 99000, bN: 22 });
    if (!own.ok) throw new Error("fixture");
    const text = buildSentence(
      COPY.de,
      facts({ metric: "Umsatz", nameA: "Q1", nameB: "Q2", unit: "days", valueA: 80000, valueB: 99000, countA: 20, countB: 22, h: own.h, p: own.p, s: own.s, verdict: own.verdict }),
    );
    expect(text).toContain("Umsatz Q2: 99.000 € gegenüber 80.000 € in Q1 (+23,8 %).");
    expect(text).toContain("Q2 hat 22 Arbeitstage, Q1 20.");
    expect(text).toContain("Pro Arbeitstag: 4.500 € gegenüber 4.000 € (+12,5 %).");
    expect(text).not.toContain("Startdatum");
    expect(text).not.toContain("21,69");
  });

  it("says what the calendar cannot explain", () => {
    expect(verdictText(COPY.de, facts({ s: 0.2, verdict: "real" }))).toBe("Der Kalender erklärt nur 20 %: das Wachstum ist überwiegend real.");
    expect(verdictText(COPY.de, facts({ verdict: "thin" }))).toBe("Zu wenig Daten für ein Urteil.");
    expect(verdictText(COPY.de, facts({ countB: 7, s: 0.9, verdict: "calendar" }))).toBe("Rund 90 % des Anstiegs sind die drei zusätzlichen Wochen.");
  });
});

describe("prompt", () => {
  it("is exactly the spec prompt for the Northwind prefill (DE)", () => {
    expect(buildPrompt(COPY.de, facts())).toBe(
      "Lies zuerst regeln-fuer-meine-berichte.md. Der Bericht nennt +25,8 % für September gegenüber August (17,23 Mio. € bei 4 Lieferwochen, 21,69 Mio. € bei 5). Prüfe aus meinen Rohdaten, ob die Monate vergleichbar sind. Rechne pro Lieferwoche, zeig deinen Rechenweg, nenne die Datei und die Spalte, aus der du es hast, und sag mir, wie viel der +25,8 % übrig bleibt. Wo du etwas nicht prüfen kannst, schreib 'nicht prüfbar' und warum.",
    );
  });

  it("names report-rules.md in English", () => {
    const text = buildPrompt(COPY.en, facts());
    expect(text.startsWith("Read report-rules.md first.")).toBe(true);
    expect(text).toContain("(EUR 17.23M at 4 shipping weeks, EUR 21.69M at 5)");
  });
});

describe("rules file", () => {
  it("carries the visitor's numbers in rule 1 and labelled Northwind proof in rules 2 and 3", () => {
    const text = buildRules(COPY.de, facts(), { trigger: 2.51, withDefects: true });
    expect(text).toContain("# Regeln für meine Berichte");
    expect(text).toContain("Beleg: August/September: +25,8 % wurden +0,7 %. Der Kalender erklärt rund 97 %.");
    expect(text).toContain("Beleg (Beispiel NORTHWIND): CRAFT 23 gegen NEST 19 (+21 %) wurden 2,51 gegen 1,13 je 1.000 (2,2 x).");
    expect(text).toContain("Auslöser (Beispiel NORTHWIND): Oktober unter 2,51 Defektmeldungen je 1.000 Stück und Ausschuss unter 8 % des Umsatzes.");
    expect(text).toContain("## 4. Schreibweise");
  });

  it("uses the dragged trigger, drops rule 2 and renumbers when Act 2 was not used", () => {
    const text = buildRules(COPY.de, facts(), { trigger: 1.8, withDefects: false });
    expect(text).toContain("Oktober unter 1,80 Defektmeldungen");
    expect(text).not.toContain("Das Richtige im Nenner");
    expect(text).toContain("## 2. Grenze im selben Satz");
    expect(text).toContain("## 3. Schreibweise");
  });

  it("never prints the 691k scrap figure and mirrors in English", () => {
    const en = buildRules(COPY.en, facts(), { trigger: 2.51, withDefects: true });
    expect(en).toContain("# Rules for my reports");
    expect(en).toContain("(+21 %) became 2.51 against 1.13 per 1,000 (2.2 x)");
    expect(en).not.toMatch(/691/);
  });
});

describe("copy hygiene", () => {
  it("has no em or en dashes in any output or pack", () => {
    const outputs = [
      JSON.stringify(COPY),
      buildSentence(COPY.de, facts({ metric: "Umsatz" })),
      buildPrompt(COPY.en, facts()),
      buildRules(COPY.de, facts(), { trigger: 2.51, withDefects: true }),
      buildRules(COPY.en, facts(), { trigger: 2.51, withDefects: true }),
    ];
    for (const text of outputs) expect(text).not.toMatch(/[–—]/);
  });

  it("copies with an ASCII hyphen, not the typographic minus", () => {
    const down = compare({ aVal: 100, aN: 4, bVal: 90, bN: 4 });
    if (!down.ok) throw new Error("fixture");
    const text = buildSentence(COPY.de, facts({ metric: "Umsatz", valueA: 100, valueB: 90, countA: 4, countB: 4, h: down.h, p: down.p, s: down.s, verdict: down.verdict }));
    expect(text).toContain("(-10,0 %)");
    expect(text).not.toContain("−");
  });

  it("keeps the German and English packs the same shape", () => {
    const shape = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(shape) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v;
    expect(shape(COPY.en)).toEqual(shape(COPY.de));
  });
});

describe("wording edge cases", () => {
  it("says the same thing as the card when both periods are equally long", () => {
    const equal = compare({ aVal: 100, aN: 4, bVal: 130, bN: 4 });
    if (!equal.ok) throw new Error("fixture");
    const f = facts({ valueA: 100, valueB: 130, countA: 4, countB: 4, h: equal.h, p: equal.p, s: equal.s, verdict: equal.verdict });
    expect(verdictText(COPY.de, f)).toBe("Beide Zeiträume sind gleich lang: der Kalender erklärt nichts.");
    expect(verdictText(COPY.de, f)).not.toMatch(/0 %/);
    expect(verdictText(COPY.en, f)).toBe("Both periods are the same length: the calendar explains nothing.");
  });

  it("uses the card's real minus sign in display mode and a hyphen in copy text", () => {
    const shrink = compare({ aVal: 100, aN: 3, bVal: 90, bN: 5 });
    if (!shrink.ok) throw new Error("fixture");
    const f = facts({ valueA: 100, valueB: 90, countA: 3, countB: 5, h: shrink.h, p: shrink.p, s: shrink.s, verdict: shrink.verdict });
    expect(verdictText(COPY.de, f, true)).toContain("\u2212");
    expect(verdictText(COPY.de, f)).not.toContain("\u2212");
    expect(verdictText(COPY.de, f)).toContain("-");
  });

  const fall = (aVal: number, aN: number, bVal: number, bN: number) => {
    const r = compare({ aVal, aN, bVal, bN });
    if (!r.ok) throw new Error("fixture");
    return facts({ valueA: aVal, valueB: bVal, countA: aN, countB: bN, h: r.h, p: r.p, s: r.s, verdict: r.verdict });
  };

  it("says the calendar hid a harder fall when the headline falls less than the per-week value", () => {
    // 5.000 over 3 weeks against 3.000 over 4 weeks: headline -40 %, per week -55 %.
    const f = fall(5000, 3, 3000, 4);
    expect(verdictText(COPY.de, f)).toBe("Pro Lieferwoche fällt es noch stärker (-55,0 %): der Kalender hat den Rückgang verdeckt.");
    expect(verdictText(COPY.en, f)).toBe("Per shipping week it falls even harder (-55.0 %): the calendar hid the decline.");
    expect(buildSentence(COPY.de, f)).not.toContain("Die Schlagzeile ist negativ");
  });

  it("says part of a fall is calendar when per-week falls less, and all of it when per-week does not fall", () => {
    expect(verdictText(COPY.de, fall(5000, 4, 3000, 3))).toBe("Ein Teil des Rückgangs ist Kalender: pro Lieferwoche sind es -20,0 %.");
    expect(verdictText(COPY.de, fall(5000, 4, 4800, 3))).toBe("Pro Lieferwoche sind es +28,0 %: der Rückgang ist Kalender.");
    expect(verdictText(COPY.de, fall(5000, 4, 4000, 4))).toBe("Der Kalender ändert hier nichts: pro Lieferwoche sind es ebenfalls -20,0 %.");
  });

  it("calls calendar days calendar days", () => {
    const f = facts({ unit: "cdays", countA: 30, countB: 31, s: 0.5, verdict: "mixed" });
    expect(verdictText(COPY.de, { ...f, countA: 30, countB: 31, verdict: "calendar", s: 0.9 })).toBe("Rund 90 % des Anstiegs ist der zusätzliche Kalendertag.");
    expect(buildPrompt(COPY.de, f)).toContain("bei 30 Kalendertagen");
  });

  it("puts the unit after bei in the dative plural", () => {
    const f = facts({ unit: "days", countA: 12, countB: 14 });
    expect(buildPrompt(COPY.de, f)).toContain("bei 12 Arbeitstagen");
    expect(buildPrompt(COPY.de, facts())).toContain("bei 4 Lieferwochen");
  });
});
