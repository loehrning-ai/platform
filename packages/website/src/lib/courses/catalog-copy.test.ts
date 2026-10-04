import { describe, expect, it } from "vitest";
import { COURSE_CATALOG } from "./catalog";
import { localizeCatalog } from "./catalog-copy";
import {
  COURSE_DURATIONS_SHORT,
  COURSE_HUB_COPY,
  COURSE_PROMISES,
  COURSE_PROMISES_SHORT,
} from "./course-hub-copy";
import { courseBadges, courseSections } from "./tracks";

describe("course catalogue locale copy", () => {
  it("keeps factual German copy for all four bilingual visual-learning courses", () => {
    const german = localizeCatalog(COURSE_CATALOG, "de");
    const technical = german.slice(4);

    expect(technical).toHaveLength(4);
    expect(technical.map((course) => course.slug)).toEqual([
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ]);
    expect(technical[0]?.description).toContain("Zwölf Lektionen");
    expect(technical[1]?.description).toContain("Zwölf Kapitel");
    expect(technical[3]?.description).toContain("Neun Module");
    expect(technical.map((course) => course.language)).toEqual(
      Array(4).fill("Deutsch + Englisch"),
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

  it("translates all four foundation cards and all four visual-learning summaries", () => {
    const english = localizeCatalog(COURSE_CATALOG, "en");

    expect(english.slice(0, 4).map((course) => course.title)).toEqual([
      "Everyday AI Literacy",
      "AI and Society",
      "EU AI Act Course",
      "Working with AI",
    ]);
    expect(english).toHaveLength(8);
    expect(english.find(({ slug }) => slug === "data-infrastructure")).toMatchObject({
      title: "Data Infrastructure",
      eyebrow: "Visual learning · System design",
      language: "English + German",
    });
    expect(english.map(({ slug }) => slug)).not.toContain("claude");
    expect(english.map(({ slug }) => slug)).not.toContain("codex");
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
    expect(courseSections("de").deeper.title).toBe("Visuelles Lernen");
    expect(courseSections("en").deeper.title).toBe("Visual learning");
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
    expect(COURSE_HUB_COPY.en.accessBody).toContain("to keep your progress");
    // Every course has a down-to-earth promise in both locales.
    for (const course of COURSE_CATALOG) {
      // The ledger intro states the frame once; a row opens with the action.
      expect(COURSE_PROMISES.de[course.slug], course.slug).toMatch(/\.$/);
      expect(COURSE_PROMISES.en[course.slug], course.slug).toMatch(/\.$/);
      expect(COURSE_PROMISES.de[course.slug], course.slug).not.toMatch(/^Nach dem Kurs/);
      expect(COURSE_PROMISES.en[course.slug], course.slug).not.toMatch(/^After this/);
    }
    // The phone preview: one clause of at most 45 characters for every
    // course, never an ellipsis.
    for (const course of COURSE_CATALOG) {
      for (const locale of ["de", "en"] as const) {
        const short = COURSE_PROMISES_SHORT[locale][course.slug];
        expect(short, `${locale} ${course.slug}`).toBeDefined();
        expect(short?.length, `${locale} ${course.slug}`).toBeLessThanOrEqual(45);
        expect(short).not.toMatch(/…|\.$/);
      }
    }
    // The one cost note (every width) keeps the three facts in at most two
    // sentences.
    for (const locale of ["de", "en"] as const) {
      const note = COURSE_HUB_COPY[locale].accessBody;
      expect(note.split(/(?<=\.)\s/).length).toBeLessThanOrEqual(2);
      expect(Object.keys(COURSE_HUB_COPY[locale])).not.toContain("accessBodyShort");
    }
    expect(COURSE_HUB_COPY.de.accessBody).toContain("nicht akkreditiert");
    expect(COURSE_HUB_COPY.en.accessBody).toContain("not accredited");
    for (const text of [
      ...Object.values(COURSE_PROMISES_SHORT.de),
      ...Object.values(COURSE_PROMISES_SHORT.en),
      ...Object.values(COURSE_DURATIONS_SHORT.de),
      ...Object.values(COURSE_DURATIONS_SHORT.en),
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
      "und für das Buch-PDF",
    );
    expect(COURSE_HUB_COPY.en.accessBody).toContain(
      "and the book PDF",
    );
    // The account is needed only in those two cases.
    expect(COURSE_HUB_COPY.de.accessBody).toContain(
      "nur für die vier Grundlagenkurse",
    );
    expect(COURSE_HUB_COPY.en.accessBody).toContain(
      "need an account only for the four foundation courses",
    );
    expect(COURSE_HUB_COPY.de.accessBody).not.toContain(
      "Downloads bleiben ohne Konto erreichbar",
    );
    expect(COURSE_HUB_COPY.en.accessBody).not.toContain(
      "downloads remain available without an account",
    );
  });
});
