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
      "Can AI predict the future?",
    );
    expect(getDemoForLocale("ki-prognosen-einschaetzen", "de")?.question).toBe(
      "Kann KI die Zukunft vorhersagen?",
    );
    expect(getDemoForLocale("unknown", "de")).toBeUndefined();
  });

  it("writes copy without em dashes or en dashes", () => {
    for (const locale of ["de", "en"] as const) {
      for (const demo of getDemosForLocale(locale)) {
        const text = [
          demo.title,
          demo.oneLiner,
          demo.question,
          demo.syntheticDataLabel,
          demo.tile.hook,
          demo.tile.take,
        ].join(" ");
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

  it("names the five demos and states each promise in German and English", () => {
    const names = {
      "ki-prognosen-einschaetzen": ["Hundert Startwochen", "A Hundred Launch Weeks"],
      "geschaeftsberichte-mit-ki-lesen": ["Monatsgrenze", "The Month Line"],
      "datenbereitschaft-fuer-ki": ["Die Fragekarte", "The question card"],
      "esg-berichte-mit-ki": ["Elf von zwölf", "Eleven of twelve"],
      "ki-im-unternehmen-sicher-nutzen": ["Was fliegt mit?", "What goes along?"],
    } as const;
    for (const [slug, [de, en]] of Object.entries(names)) {
      expect(getDemoForLocale(slug, "de")?.title).toBe(de);
      expect(getDemoForLocale(slug, "en")?.title).toBe(en);
    }
    expect(getDemoForLocale("ki-prognosen-einschaetzen", "de")?.oneLiner).toBe(
      "Zieh dein Lager durch hundert mögliche Startwochen und sieh, in wie vielen es nicht reicht.",
    );
    expect(getDemoForLocale("ki-prognosen-einschaetzen", "en")?.oneLiner).toBe(
      "Drag your stock through a hundred possible launch weeks and see in how many it falls short.",
    );
  });

  it("gives every demo a hub tile line and a take-away, without homework words", () => {
    const homework = /(?<!\p{L})(Übung|Übungen|Aufgabe|Lösung|Prüfen|Bewertung|Auswertung|exercise|homework|quiz)(?!\p{L})/iu;
    for (const locale of ["de", "en"] as const) {
      for (const demo of getDemosForLocale(locale)) {
        expect(demo.tile.hook.trim().length, `${locale} ${demo.slug} hook`).toBeGreaterThan(0);
        expect(demo.tile.take.trim().length, `${locale} ${demo.slug} take`).toBeGreaterThan(0);
        const all = [demo.title, demo.oneLiner, demo.question, demo.syntheticDataLabel, demo.tile.hook, demo.tile.take];
        for (const text of all) expect(text, `${locale} ${demo.slug}`).not.toMatch(homework);
      }
    }
  });

  it("runs a few minutes on invented data, with no outside action", () => {
    for (const demo of demos) {
      expect(demo.minutes).toBeGreaterThanOrEqual(3);
      expect(demo.minutes).toBeLessThanOrEqual(15);
      expect(demo.illustrative).toBe(true);
      expect(demo.externalActionMode).toBe("none");
      expect(demo.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has a component folder with an index and a hub tile for every slug", () => {
    for (const slug of DEMO_SLUGS) {
      for (const file of ["index.tsx", "tile.tsx", "tile-motion.ts"]) {
        expect(existsSync(join(WEBSITE, "src/components/demos", slug, file)), `${slug}/${file}`).toBe(true);
      }
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
