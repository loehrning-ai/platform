import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { WORKSHOP_KIT_TONES, workshopKitPath } from "./workshop-kit";
import {
  getWorkshopBySlug,
  getWorkshopKitSlugs,
  getWorkshops,
  workshopKitMaterial,
} from "./workshops";

/**
 * The contract of the kit block, for every workshop that has one: a workshop
 * that fills it in gets a working, indexed, bilingual kit page and nothing else
 * to wire. ESG-specific figures are checked in workshops-esg-reporting.test.ts.
 */
const slugs = getWorkshopKitSlugs();

describe("workshop kit blocks", () => {
  it("exist for at least the ESG workshop, and only a workshop with a block is listed", () => {
    expect(slugs).toContain("esg-berichte-mit-ki");
    for (const workshop of getWorkshops("de")) {
      expect(slugs.includes(workshop.slug), workshop.slug).toBe(Boolean(workshop.kit));
    }
  });

  for (const slug of slugs) {
    describe(slug, () => {
      const de = getWorkshopBySlug(slug, "de")!;
      const en = getWorkshopBySlug(slug, "en")!;

      it("has a kit in both locales with the same structure", () => {
        expect(de.kit).toBeDefined();
        expect(en.kit).toBeDefined();
        const [a, b] = [de.kit!, en.kit!];
        // A kit with a German edition names its own files (prognose-pruefen.zip,
        // pruefregel.md); then only the shape has to match, not the names.
        const sameEdition = a.fileName === b.fileName;
        const name = (file: string | undefined) => (sameEdition ? file : Boolean(file));
        expect(a.steps).toHaveLength(b.steps.length);
        expect(a.rules).toHaveLength(b.rules.length);
        expect(a.contents.map((item) => name(item.name))).toEqual(b.contents.map((item) => name(item.name)));
        expect(a.stats.map((stat) => stat.value)).toEqual(b.stats.map((stat) => stat.value));
        a.steps.forEach((step, index) => {
          const twin = b.steps[index];
          expect(name(step.file), step.tag).toBe(name(twin.file));
          expect(step.segments?.map(({ tone, value }) => [tone, value])).toEqual(
            twin.segments?.map(({ tone, value }) => [tone, value]),
          );
          expect(Boolean(step.line)).toBe(Boolean(twin.line));
        });
      });

      it("fills every field and uses a known tone and a positive value", () => {
        for (const kit of [de.kit!, en.kit!]) {
          expect(kit.steps.length).toBeGreaterThanOrEqual(2);
          expect(kit.steps.length).toBeLessThanOrEqual(7);
          for (const text of [kit.title, kit.lead, kit.howTo, kit.fictionalNote, kit.rulesHeading, kit.stepsHeading]) {
            expect(text.trim()).not.toBe("");
          }
          for (const step of kit.steps) {
            for (const text of [step.tag, step.title, step.input, step.action, step.output]) {
              expect(text.trim(), step.tag).not.toBe("");
            }
            for (const segment of step.segments ?? []) {
              expect(WORKSHOP_KIT_TONES).toContain(segment.tone);
              expect(segment.value).toBeGreaterThan(0);
              expect(segment.label.trim()).not.toBe("");
            }
          }
        }
      });

      it("uses no en or em dashes", () => {
        expect(JSON.stringify(de.kit)).not.toMatch(/[–—]/);
        expect(JSON.stringify(en.kit)).not.toMatch(/[–—]/);
      });

      it("points at a published zip: a kit material whose file exists and ends in the block's file name", () => {
        for (const workshop of [de, en]) {
          const material = workshopKitMaterial(workshop);
          expect(material, workshop.slug).toBeDefined();
          expect(material!.href.endsWith(`/${workshop.kit!.fileName}`)).toBe(true);
          expect(material!.sizeLabel).toBeTruthy();
          expect(existsSync(resolve(process.cwd(), "public", material!.href.slice(1)))).toBe(true);
        }
      });

      it("is registered for English parity and the crawl contract, so it is indexed in both locales", () => {
        const path = workshopKitPath(slug);
        expect(contentLocalesForPath(path)).toEqual(["de", "en"]);
        const route = getCrawlRoute(path);
        expect(route.routeClass).toBe("public-indexable");
        expect(route.includeInSitemap).toBe(true);
        expect(getCrawlRoute(`/en${path}`)).toBe(route);
      });
    });
  }
});
