import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { skippedNameSpans } from "./detect";
import { buildRedaction, keyTable, replay } from "./redact";

describe("sample answers: the Rückspiel works in two taps", () => {
  for (const locale of ["de", "en"] as const) {
    for (const sample of COPY[locale].samples) {
      it(`${locale} ${sample.id}: restores real details and reports exactly one unknown placeholder`, () => {
        const labels = COPY[locale].labels;
        const key = keyTable(buildRedaction(sample.text, [], new Set(), labels));
        const result = replay(sample.answer, key);
        expect(result.restored).toBeGreaterThanOrEqual(3);
        expect(result.unknown.length).toBe(1);
        expect(result.ambiguous).toEqual([]);
        // Every restored value really came from the visitor's text.
        const restored = result.segments.filter((s) => s.token).map((s) => s.text);
        for (const value of restored) expect(sample.text).toContain(value);
      });
    }
  }

  it("Ana's answer carries the three placeholders the reviewer asked for", () => {
    expect(COPY.de.samples[0]?.answer).toMatch(/\[KUNDE\][\s\S]*\[ADRESSE\][\s\S]*\[E-MAIL\]/);
    expect(COPY.en.samples[0]?.answer).toMatch(/\[CUSTOMER\][\s\S]*\[ADDRESS\][\s\S]*\[EMAIL\]/);
  });
});

describe("skippedNameSpans", () => {
  it("returns where the uncovered word pairs are, and none for covered or sentence-start pairs", () => {
    const text = "Hans Meier von Tannwald GmbH schreibt. Mein Name ist leer.";
    const spans = skippedNameSpans(text, []);
    expect(spans.map((s) => text.slice(s.start, s.end))).toEqual(["Hans Meier", "Tannwald GmbH"].filter((v) => text.includes(v)));
    expect(skippedNameSpans(text, [{ start: 0, end: 10 }]).map((s) => text.slice(s.start, s.end))).not.toContain("Hans Meier");
  });
});
