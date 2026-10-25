import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { ADJUSTED, canAddCard, cardToMarkdown, cleanField, EMPTY_CARD, FIELD_LIMITS, lintCard, type OwnCard } from "./steckbrief";

const complete: OwnCard = {
  ...EMPTY_CARD,
  name: "Reklamationsquote Werk 2",
  decision: "Lieferant wechseln",
  numerator: "Reklamierte Stück",
  numeratorKind: "quantity",
  denominator: "Gelieferte Stück",
  period: "week",
  comparison: "previous",
  sourceFile: "reklamationen.xlsx",
  sourceColumn: "menge",
  limit: "Nur gemeldete Fälle.",
  trigger: "Wechsel ab 5 je 1.000",
};
const rules = (card: OwnCard) => lintCard(card).map((finding) => finding.rule);

describe("lintCard", () => {
  it("finds nothing on a complete quantity card", () => {
    expect(rules(complete)).toEqual([]);
    expect(rules(EMPTY_CARD)).toEqual([]);
  });

  it.each([
    ["R1", { numeratorKind: "events", trigger: "" }],
    ["R2", { noDenominator: true }],
    ["R3", { period: "month", comparison: "previous" }],
    ["R4", { sourceColumn: "" }],
    ["R5", { limit: " " }],
    ["R6", { name: "EBITDA bereinigt" }],
    ["R8", { decision: "" }],
  ] as const)("%s fires on its fixture", (rule, change) => {
    expect(rules({ ...complete, ...change })).toEqual([rule]);
  });

  it("R7 fires with R1 when an events counter carries a trigger", () => {
    expect(rules({ ...complete, numeratorKind: "events" })).toEqual(["R1", "R7"]);
    expect(rules({ ...complete, numeratorKind: "events", trigger: "" })).toEqual(["R1"]);
  });

  it("waits for a name before R4, R5 and R8", () => {
    expect(rules({ ...EMPTY_CARD, sourceFile: "x.csv" })).toEqual([]);
  });

  it("R6 knows adjusted wording and leaves look-alikes alone", () => {
    for (const hit of ["EBITDA bereinigt", "bereinigte Marge", "Adjusted EBIT", "operatives Ergebnis", "Umsatz ohne Sondereffekte", "underlying growth"]) {
      expect(ADJUSTED.test(hit), hit).toBe(true);
    }
    for (const miss of ["Bereich Nord", "Operationssaal", "Reklamationsquote", "operation room"]) {
      expect(ADJUSTED.test(miss), miss).toBe(false);
    }
  });
});

describe("cards", () => {
  it("needs name, numerator, denominator or none, and period", () => {
    expect(canAddCard(complete)).toBe(true);
    expect(canAddCard({ ...complete, period: "" })).toBe(false);
    expect(canAddCard({ ...complete, denominator: "" })).toBe(false);
    expect(canAddCard({ ...complete, denominator: "", noDenominator: true })).toBe(true);
  });

  it("flattens a field to one plain line within its limit", () => {
    expect(cleanField("---\n# Titel\nzweite", 60)).toBe("Titel zweite");
    expect(cleanField("## Quote\r\nWerk 2", 60)).toBe("Quote Werk 2");
    expect(cleanField("> zitiert", 60)).toBe("zitiert");
    expect(cleanField("x".repeat(500), FIELD_LIMITS.name)).toHaveLength(FIELD_LIMITS.name);
  });

  it("writes the skill's block format, one heading and seven lines", () => {
    const markdown = cardToMarkdown({ ...complete, name: "## Quote\nWerk 2" }, COPY.de.own.card);
    const lines = markdown.split("\n");
    expect(lines[0]).toBe("### Quote Werk 2");
    expect(lines.slice(1).map((line) => line.split(":")[0])).toEqual([
      "- Entscheidung",
      "- Zähler",
      "- Nenner",
      "- Zeitraum",
      "- Quelle",
      "- Grenze",
      "- Auslöser",
    ]);
    expect(markdown).toContain("Kalenderwoche, verglichen mit Vorperiode");
    expect(markdown).toContain("reklamationen.xlsx, Spalte menge");
    expect(cardToMarkdown(EMPTY_CARD, COPY.en.own.card)).toContain("### not set");
  });
});
