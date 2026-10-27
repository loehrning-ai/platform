import { describe, expect, it } from "vitest";
import { toSentences } from "./demo-sentences";

describe("toSentences", () => {
  it("splits at a sentence end and keeps dates, abbreviations and numbers inside", () => {
    expect(toSentences(["Am 1. Juli 2026 zählt z. B. Nr. 3 mit. Das kostet 3,50 €. Danach „steigt“ es.", "Zweiter Teil!"])).toEqual([
      "Am 1. Juli 2026 zählt z. B. Nr. 3 mit.",
      "Das kostet 3,50 €.",
      "Danach „steigt“ es.",
      "Zweiter Teil!",
    ]);
  });

  it("splits English the same way", () => {
    expect(toSentences(["The rate fell to 2.51 in September. It was 2.8 before."])).toEqual(["The rate fell to 2.51 in September.", "It was 2.8 before."]);
  });
});
