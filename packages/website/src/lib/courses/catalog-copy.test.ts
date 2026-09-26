import { describe, expect, it } from "vitest";
import { COURSE_CATALOG } from "./catalog";
import { localizeCatalog } from "./catalog-copy";
import { COURSE_HUB_COPY, COURSE_PROMISES } from "./course-hub-copy";
import { courseBadges, courseSections } from "./tracks";

describe("course catalogue locale copy", () => {
  it("keeps factual German copy for all six bilingual technical courses", () => {
    const german = localizeCatalog(COURSE_CATALOG, "de");
    const technical = german.slice(4);

    expect(technical).toHaveLength(6);
    expect(technical[0]?.description).toContain("Zwölf Lektionen");
    expect(technical[1]?.description).toContain("Zwölf Lektionen");
    expect(technical[5]?.description).toContain("Neun Module");
    expect(technical.map((course) => course.language)).toEqual(
      Array(6).fill("Deutsch + Englisch"),
    );
    expect(
      technical.flatMap((course) => course.sourceFacts ?? []),
    ).not.toContain("Jetzt nativ");
    expect(
      technical.flatMap((course) => course.sourceFacts ?? []).join(" "),
    ).not.toMatch(/Hands-on Widgets|Live-Simulationen/);
    expect(
      technical.flatMap((course) => course.sourceFacts ?? []).join(" "),
    ).not.toMatch(/Auf loehrning\.ai gehostet/);
    expect(
      technical.every((course) =>
        course.integrationNote?.includes("getrennte Live-Prüfung"),
      ),
    ).toBe(true);
  });

  it("translates all four foundation cards and all six technical summaries", () => {
    const english = localizeCatalog(COURSE_CATALOG, "en");

    expect(english.slice(0, 4).map((course) => course.title)).toEqual([
      "AI Fundamentals",
      "AI and Society",
      "EU AI Act Course",
      "AI-Native Work Course",
    ]);
    expect(english).toHaveLength(10);
    expect(english.find(({ slug }) => slug === "codex")).toMatchObject({
      title: "Codex Course",
      language: "English + German",
    });
    expect(english.find(({ slug }) => slug === "data-science")?.description).toContain(
      "Thirty-seven simulations",
    );
    const technical = english.slice(4);
    expect(
      technical.flatMap((course) => course.sourceFacts ?? []).join(" "),
    ).not.toMatch(/Hosted on loehrning\.ai/);
    expect(
      technical.every((course) =>
        course.integrationNote?.includes("separate live verification"),
      ),
    ).toBe(true);
    for (const course of english) {
      expect(course.description).not.toMatch(
        /\b(Der|Die|Das|Zwölf|Neun|Vier|Kurs|Lektionen behandeln)\b/,
      );
    }
  });

  it("provides localized section, badge, and page metadata copy", () => {
    expect(courseSections("en").spine.title).toBe("Foundation path");
    expect(courseSections("de").deeper.title).toBe("Technikkurse");
    expect(
      courseBadges("ki-fuehrerschein", "en").map(({ label }) => label),
    ).toEqual(["DE + EN", "participation record"]);
    expect(COURSE_HUB_COPY.de.intro).toContain("Vier Grundlagenkurse");
    expect(COURSE_HUB_COPY.en.intro).toContain("Four foundation courses");
    expect(COURSE_HUB_COPY.de.intro.split(/\s+/).length).toBeLessThanOrEqual(20);
    expect(COURSE_HUB_COPY.en.intro.split(/\s+/).length).toBeLessThanOrEqual(20);
    expect(COURSE_HUB_COPY.en.metadataTitle).toContain("AI courses");
    // The access note gives the reason for the account in the same sentence.
    expect(COURSE_HUB_COPY.de.accessBody).toContain("damit dein Fortschritt");
    expect(COURSE_HUB_COPY.en.accessBody).toContain("so your progress");
    // Every course has a down-to-earth promise in both locales.
    for (const course of COURSE_CATALOG) {
      // The ledger intro states the frame once; a row opens with the action.
      expect(COURSE_PROMISES.de[course.slug], course.slug).toMatch(/\.$/);
      expect(COURSE_PROMISES.en[course.slug], course.slug).toMatch(/\.$/);
      expect(COURSE_PROMISES.de[course.slug], course.slug).not.toMatch(/^Nach dem Kurs/);
      expect(COURSE_PROMISES.en[course.slug], course.slug).not.toMatch(/^After this/);
    }
    for (const text of [
      ...Object.values(COURSE_PROMISES.de),
      ...Object.values(COURSE_PROMISES.en),
      COURSE_HUB_COPY.de.accessBody,
      COURSE_HUB_COPY.en.accessBody,
      COURSE_HUB_COPY.de.intro,
      COURSE_HUB_COPY.en.intro,
    ]) {
      expect(text).not.toMatch(/[\u2013\u2014]/);
    }
    expect(COURSE_HUB_COPY.de.metadataTitle).toContain("KI-Kurse");
    expect(COURSE_HUB_COPY.de.accessBody).toContain(
      "nur das PDF des Lernbuchs braucht eins",
    );
    expect(COURSE_HUB_COPY.en.accessBody).toContain(
      "only the learning book's PDF needs one",
    );
    expect(COURSE_HUB_COPY.de.accessBody).not.toContain(
      "Downloads bleiben ohne Konto erreichbar",
    );
    expect(COURSE_HUB_COPY.en.accessBody).not.toContain(
      "downloads remain available without an account",
    );
  });
});
