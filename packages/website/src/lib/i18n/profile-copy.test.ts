import { describe, expect, it } from "vitest";
import { PROFILE_COPY } from "./profile-copy";

describe("profile locale copy", () => {
  it("preserves factual career and credential structure across locales", () => {
    expect(PROFILE_COPY.de.timeline.milestones).toHaveLength(5);
    expect(PROFILE_COPY.en.timeline.milestones).toHaveLength(5);
    expect(
      PROFILE_COPY.de.timeline.milestones.map(({ company }) => company),
    ).toEqual(
      PROFILE_COPY.en.timeline.milestones.map(({ company }) => company),
    );
    expect(
      PROFILE_COPY.de.timeline.milestones.map(({ period }) =>
        period.replace("Seit ", "Since "),
      ),
    ).toEqual(PROFILE_COPY.en.timeline.milestones.map(({ period }) => period));
    expect(PROFILE_COPY.de.credentials.cards.map(({ id }) => id)).toEqual([
      "degree",
      "international",
      "research",
    ]);
    expect(PROFILE_COPY.en.credentials.cards.map(({ id }) => id)).toEqual([
      "degree",
      "international",
      "research",
    ]);
  });

  it("keeps explicit no-endorsement framing in both languages", () => {
    expect(PROFILE_COPY.de.stations.notice).toMatch(
      /ausschließlich der biografischen Einordnung/,
    );
    expect(PROFILE_COPY.de.stations.notice).toMatch(/nicht/);
    expect(PROFILE_COPY.en.stations.notice).toMatch(
      /biographical context only/,
    );
    expect(PROFILE_COPY.en.stations.notice).toMatch(
      /do not endorse or support/,
    );
    expect(PROFILE_COPY.de.timeline.intro).not.toMatch(
      /Partnerschaft|bestätig/u,
    );
    expect(PROFILE_COPY.en.timeline.intro).not.toMatch(/partner|endorse/iu);
  });

  it("uses direct editorial language without promotional stock phrases", () => {
    const allCopy = JSON.stringify(PROFILE_COPY);
    for (const phrase of [
      /KI-Transformation/i,
      /KI-beschleunigt/i,
      /Jetzt loslegen/i,
      /game.?chang/i,
      /revolution/i,
      /unlock/i,
      /supercharge/i,
    ]) {
      expect(allCopy).not.toMatch(phrase);
    }
    expect(PROFILE_COPY.de.editorial.policies).toHaveLength(3);
    expect(PROFILE_COPY.en.editorial.policies).toHaveLength(3);
    expect(PROFILE_COPY.de.editorial.guideLabel).toBe("CONTENT_GUIDE.md");
    expect(PROFILE_COPY.en.editorial.guideLabel).toBe("CONTENT_GUIDE.md");
  });

  it("states the account boundary instead of claiming universal public access", () => {
    expect(PROFILE_COPY.de.hero.detail).toContain(
      "Vier Grundlagen-Reader benötigen ein kostenloses Lernkonto",
    );
    expect(PROFILE_COPY.en.hero.detail).toContain(
      "Four foundation readers require a free learning account",
    );
    expect(PROFILE_COPY.de.hero.detail).not.toMatch(
      /Die Inhalte sind frei zugänglich/u,
    );
    expect(PROFILE_COPY.en.hero.detail).not.toMatch(
      /The material is freely accessible/u,
    );
  });
});
