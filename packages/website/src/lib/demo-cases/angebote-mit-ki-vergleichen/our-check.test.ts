import { describe, expect, it } from "vitest";
import { SCENE } from "./claude-runs";
import { HORIZON, kitRows, STACK } from "./config";
import { amountInText, bareAmount, checkAnswer } from "./our-check";
import { compute } from "./stack";

const model = compute(kitRows("de"), HORIZON, null, STACK);
const totals = model.ranked.map((option) => ({ option: option.name, cents: option.total }));

describe("our check: the engine's totals in a recorded answer", () => {
  it("formats the bare number per language", () => {
    expect(bareAmount(2491000, "de")).toBe("24.910");
    expect(bareAmount(2491000, "en")).toBe("24,910");
  });

  it("matches the whole number only", () => {
    expect(amountInText("**24.910 €**", 2491000, "de")).toBe(true);
    expect(amountInText("€24,910 a year", 2491000, "en")).toBe(true);
    expect(amountInText("124.910 €", 2491000, "de")).toBe(false);
    expect(amountInText("24.910,50 €", 2491000, "de")).toBe(false);
    expect(amountInText("24.91", 2491000, "de")).toBe(false);
  });

  it("finds every total in every take with our rates, and the table is the kit's", () => {
    expect(totals.map((total) => total.cents)).toEqual([2491000, 2587200, 2655400]);
    const takes = SCENE?.recordings.filter((recording) => recording.prompt_id === "mit-saetzen") ?? [];
    expect(takes.length).toBeGreaterThan(0);
    for (const take of takes) {
      const check = checkAnswer(take.final_text, totals, take.locale === "en" ? "en" : "de");
      expect(check.every((item) => item.found), take.id).toBe(true);
    }
  });
});
