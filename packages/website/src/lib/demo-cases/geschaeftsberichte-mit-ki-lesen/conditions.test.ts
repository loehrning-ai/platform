import { describe, expect, it } from "vitest";
import { SCENE } from "./claude-runs";
import { CONDITIONS } from "./conditions";
import { LINE } from "./data";
import { maxMerges, reading } from "./definitions";
import { fill } from "./format";

describe.each(["de", "en"] as const)("the %s condition card", (locale) => {
  const condition = CONDITIONS[locale];
  const take = SCENE?.recordings.find((recording) => recording.id === condition.takeId);

  it("quotes a stored take without the skill, word for word", () => {
    expect(take?.with_skill).toBe(false);
    expect(take?.locale).toBe(locale);
    expect(take?.final_text).toContain(fill(condition.quote, { line: LINE }));
    const prompt = SCENE?.prompts.find((entry) => entry.locale === locale && entry.withoutSkill.includes(condition.takeId));
    expect(prompt?.id).toBe("marketing");
  });

  it("counts units, so merging leaves it where it was", () => {
    const before = reading({
      counter: condition.counter,
      denom: condition.denom,
    });
    const after = reading({
      counter: condition.counter,
      denom: condition.denom,
      merges: maxMerges(),
    });
    expect(after.sep).toBe(before.sep);
    expect(Math.round(before.sep)).toBe(309);
  });
});
