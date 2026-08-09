import { describe, expect, it } from "vitest";
import {
  getLektionById,
  getNextLektion,
  getPrevLektion,
  getWieKiContent,
} from "./wie-ki-funktioniert";

function numericTokens(value: unknown): readonly string[] {
  return (JSON.stringify(value).match(/\d+/g) ?? []).sort();
}

function urls(value: unknown): readonly string[] {
  return (
    JSON.stringify(value).match(/https?:\\?\/\\?\/[^\s"']+/g) ?? []
  ).sort();
}

describe("wie-ki-funktioniert English source parity", () => {
  const de = getWieKiContent("de");
  const en = getWieKiContent("en");

  it("registers a complete English bundle without changing course identity", () => {
    expect(en.meta).toMatchObject({
      slug: de.meta.slug,
      durationMinutes: de.meta.durationMinutes,
      lessonCount: de.meta.lessonCount,
      stage: de.meta.stage,
      access: de.meta.access,
      lastReviewed: de.meta.lastReviewed,
      nextReview: de.meta.nextReview,
      reviewCadence: de.meta.reviewCadence,
      riskClass: de.meta.riskClass,
      owner: de.meta.owner,
      language: "en",
    });
    expect(de.meta.language).toBe("de");
    expect(en.meta.title).toBe("How Language Models Work");
    expect(en.lektionen).toHaveLength(4);
  });

  it("preserves every lesson and section identity, order, duration, and count", () => {
    expect(en.lektionen.map((lesson) => lesson.id)).toEqual(
      de.lektionen.map((lesson) => lesson.id),
    );

    for (const [index, deLesson] of de.lektionen.entries()) {
      const enLesson = en.lektionen[index];
      expect(enLesson).toBeDefined();
      expect(enLesson).toMatchObject({
        id: deLesson.id,
        blockId: deLesson.blockId,
        number: deLesson.number,
        durationMinutes: deLesson.durationMinutes,
      });
      expect(enLesson?.keyConcepts).toHaveLength(deLesson.keyConcepts.length);
      expect(enLesson?.sections).toHaveLength(deLesson.sections.length);
      expect(enLesson?.sections.map((section) => section.id)).toEqual(
        deLesson.sections.map((section) => section.id),
      );
      expect(
        enLesson?.sections.map((section) => section.readTimeMinutes),
      ).toEqual(deLesson.sections.map((section) => section.readTimeMinutes));
      expect(numericTokens(enLesson)).toEqual(numericTokens(deLesson));
      expect(urls(enLesson)).toEqual(urls(deLesson));
    }
  });

  it("preserves the named legal citation and avoids dash-based filler punctuation", () => {
    const source = "Mata v. Avianca";
    const englishLesson = getLektionById("lektion-3-halluzinationen", "en");
    expect(englishLesson?.sections[0]?.content).toContain(source);
    expect(JSON.stringify(en)).not.toMatch(/[—–]/u);
  });

  it("rejects reductive model claims and unverifiable self-confidence advice in both languages", () => {
    const copy = JSON.stringify({ de, en });
    expect(copy).not.toMatch(
      /statistically the most common continuation|statistisch die häufigste Fortsetzung|no thinking, beliefs, or memories|kein Denken, keine Überzeugungen, keine Erinnerungen|ask the model how certain|das Modell fragen, wie sicher|four structural limits|vier strukturelle Grenzen|methodisch, nicht behebbar|outside its training period.*unknown/i,
    );
    expect(copy).toMatch(/product documentation|Produktdokumentation/);
    expect(copy).toMatch(/primary or official|primären oder amtlichen/);
  });

  it("uses the localized sequence for direct, previous, and next lookup", () => {
    expect(getLektionById("lektion-1-vorhersage", "en")?.title).toContain(
      "Token prediction",
    );
    expect(getNextLektion("lektion-1-vorhersage", "en")?.title).toContain(
      "Training data",
    );
    expect(getPrevLektion("lektion-4-grenzen", "en")?.title).toContain(
      "Hallucinations",
    );
  });
});
