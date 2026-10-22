import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEMO_SLUGS,
  demoForWorkshop,
  demoLede,
  demos,
  demosForCourse,
  getDemoForLocale,
  getDemosForLocale,
} from "./demos";
import { workshopPlakat } from "./plakat/palettes";
import { getWorkshopBySlug, getWorkshops } from "./workshops";

const WEBSITE = join(__dirname, "../..");

describe("demo registry", () => {
  it("holds exactly one demo per workshop, keyed by the workshop slug", () => {
    expect(demos).toHaveLength(5);
    expect(demos.map((demo) => demo.slug)).toEqual([...DEMO_SLUGS]);
    expect(demos.map((demo) => demo.slug).sort()).toEqual(
      getWorkshops("de").map((workshop) => workshop.slug).sort(),
    );
    for (const demo of demos) {
      expect(demo.id).toBe(demo.slug);
      expect(demo.workshopSlug).toBe(demo.slug);
      expect(demoForWorkshop(demo.slug)).toBe(demo);
    }
  });

  it("takes the workshop's number and poster palette", () => {
    for (const demo of demos) {
      const workshop = getWorkshopBySlug(demo.slug, "de");
      expect(demo.workshopNumber, demo.slug).toBe(workshop?.number);
      expect({ plakat: demo.plakat, motif: demo.motif }, demo.slug).toEqual(workshopPlakat(demo.slug));
    }
  });

  it("has German and English copy for title, one-liner, question and data line", () => {
    for (const locale of ["de", "en"] as const) {
      for (const demo of getDemosForLocale(locale)) {
        for (const field of ["title", "oneLiner", "question", "syntheticDataLabel"] as const) {
          expect(demo[field].trim().length, `${locale} ${demo.slug} ${field}`).toBeGreaterThan(0);
        }
        expect(demo.locale).toBe(locale);
      }
    }
    expect(getDemoForLocale("ki-prognosen-einschaetzen", "en")?.question).toBe(
      "When may the plan ship on its own?",
    );
    expect(getDemoForLocale("ki-prognosen-einschaetzen", "de")?.question).toBe(
      "Wann darf der Plan allein raus?",
    );
    expect(getDemoForLocale("unknown", "de")).toBeUndefined();
  });

  it("writes copy without em dashes or en dashes", () => {
    for (const locale of ["de", "en"] as const) {
      for (const demo of getDemosForLocale(locale)) {
        const text = [demo.title, demo.oneLiner, demo.question, demo.syntheticDataLabel].join(" ");
        expect(text, demo.slug).not.toMatch(/[–—]/);
      }
    }
  });

  it("never repeats the title as the lede", () => {
    for (const locale of ["de", "en"] as const) {
      for (const demo of getDemosForLocale(locale)) {
        expect(demoLede(demo), demo.slug).not.toBe(demo.title);
      }
    }
  });

  it("runs at most fifteen minutes on invented data, with no outside action", () => {
    for (const demo of demos) {
      expect(demo.minutes).toBeGreaterThanOrEqual(5);
      expect(demo.minutes).toBeLessThanOrEqual(15);
      expect(demo.illustrative).toBe(true);
      expect(demo.externalActionMode).toBe("none");
      expect(demo.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has a component folder with an index for every slug", () => {
    for (const slug of DEMO_SLUGS) {
      expect(existsSync(join(WEBSITE, "src/components/demos", slug, "index.tsx")), slug).toBe(true);
    }
  });

  it("binds the demos to the workshops' courses", () => {
    expect(demosForCourse("data-science").map((demo) => demo.slug)).toEqual([
      "ki-prognosen-einschaetzen",
    ]);
    expect(demosForCourse("data-engineering-fundamentals").map((demo) => demo.slug)).toEqual([
      "datenbereitschaft-fuer-ki",
    ]);
    expect(demosForCourse("ki-fuehrerschein")).toEqual([]);
  });
});
