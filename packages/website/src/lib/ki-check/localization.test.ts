import { describe, expect, it } from "vitest";
import {
  KI_CHECK_CONTENT,
  KI_CHECK_PAGE_COPY,
  KI_CHECK_UI_COPY,
  localizedDimension,
  localizedRating,
  localizedStage,
} from "./localization";

describe("KI check localization", () => {
  it("preserves all scoring and identity fields across languages", () => {
    const de = KI_CHECK_CONTENT.de;
    const en = KI_CHECK_CONTENT.en;

    expect(en.dimensions.map(({ id }) => id)).toEqual(
      de.dimensions.map(({ id }) => id),
    );
    expect(en.questions).toHaveLength(de.questions.length);
    expect(
      en.questions.map(({ id, dimensionId }) => ({ id, dimensionId })),
    ).toEqual(de.questions.map(({ id, dimensionId }) => ({ id, dimensionId })));

    for (let index = 0; index < de.questions.length; index += 1) {
      expect(en.questions[index].options.map(({ score }) => score)).toEqual(
        de.questions[index].options.map(({ score }) => score),
      );
      expect(en.questions[index].text).not.toBe(de.questions[index].text);
    }
  });

  it("provides complete English page, interface, stage, rating, and dimension copy", () => {
    expect(KI_CHECK_PAGE_COPY.en.description).toMatch(/no login/i);
    expect(KI_CHECK_UI_COPY.en.quizTitle).toBe("What is your current level?");
    expect(localizedDimension("en", "verantwortung").name).toBe(
      "Work responsibly",
    );
    expect(localizedStage("en", 5).label).toBe("Independent");
    expect(localizedRating("en", 75).label).toBe("Strong");
  });
});
