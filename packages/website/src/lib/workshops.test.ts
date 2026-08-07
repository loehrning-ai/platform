import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { WORKSHOPS, getWorkshopBySlug, getWorkshopSlugs } from "./workshops";

describe("workshops catalog", () => {
  it("is non-empty", () => {
    expect(WORKSHOPS.length).toBeGreaterThan(0);
  });

  it("has unique slugs", () => {
    const slugs = WORKSHOPS.map((workshop) => workshop.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has all required string fields non-empty for every workshop", () => {
    for (const workshop of WORKSHOPS) {
      expect(workshop.slug.trim().length, `${workshop.slug}.slug`).toBeGreaterThan(0);
      expect(workshop.title.trim().length, `${workshop.slug}.title`).toBeGreaterThan(0);
      expect(workshop.eyebrow.trim().length, `${workshop.slug}.eyebrow`).toBeGreaterThan(0);
      expect(workshop.description.trim().length, `${workshop.slug}.description`).toBeGreaterThan(0);
      expect(workshop.format.trim().length, `${workshop.slug}.format`).toBeGreaterThan(0);
      expect(workshop.duration.trim().length, `${workshop.slug}.duration`).toBeGreaterThan(0);
      expect(workshop.summary.trim().length, `${workshop.slug}.summary`).toBeGreaterThan(0);
    }
  });

  it("keeps every card summary short enough to read in a card", () => {
    for (const workshop of WORKSHOPS) {
      expect(workshop.summary.length, `${workshop.slug}.summary is too long for the card`)
        .toBeLessThanOrEqual(260);
    }
  });

  it("gives every real-world second case a source and a decision", () => {
    for (const workshop of WORKSHOPS) {
      const realWorld = workshop.realWorldCase;
      if (!realWorld) continue;
      expect(realWorld.companyName.trim().length, `${workshop.slug}.realWorldCase`).toBeGreaterThan(0);
      expect(realWorld.source.trim().length, `${workshop.slug}.realWorldCase.source`).toBeGreaterThan(0);
      expect(realWorld.decisionQuestion.trim().length).toBeGreaterThan(0);
      expect(realWorld.metrics.length).toBeGreaterThan(0);
    }
  });

  it("has at least one audience entry per workshop, all non-empty", () => {
    for (const workshop of WORKSHOPS) {
      expect(workshop.audience.length, `${workshop.slug}.audience`).toBeGreaterThan(0);
      for (const line of workshop.audience) {
        expect(line.trim().length, `${workshop.slug}.audience item`).toBeGreaterThan(0);
      }
    }
  });

  it("has five to seven non-empty build-flow steps per workshop", () => {
    for (const workshop of WORKSHOPS) {
      expect(workshop.steps.length, `${workshop.slug}.steps`).toBeGreaterThanOrEqual(5);
      expect(workshop.steps.length, `${workshop.slug}.steps`).toBeLessThanOrEqual(7);
      for (const step of workshop.steps) {
        expect(step.n.trim().length, `${workshop.slug} step.n`).toBeGreaterThan(0);
        expect(step.title.trim().length, `${workshop.slug} step.title`).toBeGreaterThan(0);
        expect(step.description.trim().length, `${workshop.slug} step.description`).toBeGreaterThan(0);
        expect(step.tool.trim().length, `${workshop.slug} step.tool`).toBeGreaterThan(0);
      }
    }
  });

  it("states plainly whether each case study is fictional, with non-empty narrative and metrics", () => {
    for (const workshop of WORKSHOPS) {
      const { caseStudy } = workshop;
      expect(typeof caseStudy.isFictional, `${workshop.slug}.caseStudy.isFictional`).toBe(
        "boolean",
      );
      expect(caseStudy.companyName.trim().length).toBeGreaterThan(0);
      expect(caseStudy.narrative.trim().length).toBeGreaterThan(0);
      expect(caseStudy.decisionQuestion.trim().length).toBeGreaterThan(0);
      expect(caseStudy.metrics.length).toBeGreaterThan(0);
      expect(caseStudy.dataLimitations.length).toBeGreaterThan(0);
      for (const metric of caseStudy.metrics) {
        expect(metric.label.trim().length).toBeGreaterThan(0);
        expect(metric.value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("references materials that exist as real files under public/workshops/<slug>/", () => {
    for (const workshop of WORKSHOPS) {
      expect(workshop.materials.length, `${workshop.slug}.materials`).toBeGreaterThan(0);
      for (const material of workshop.materials) {
        expect(material.href.startsWith(`/workshops/${workshop.slug}/`), material.href).toBe(true);
        const relativePath = material.href.replace(/^\//, "");
        const filePath = resolve(process.cwd(), "public", relativePath);
        expect(existsSync(filePath), `missing file for ${material.href}`).toBe(true);
      }
    }
  });
});

describe("getWorkshopBySlug", () => {
  it("returns the matching workshop", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen");
    expect(workshop).toBeDefined();
    expect(workshop?.title).toBe("Geschäftsberichte mit KI lesen");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getWorkshopBySlug("gibt-es-nicht")).toBeUndefined();
  });
});

describe("getWorkshopSlugs", () => {
  it("returns every catalog slug", () => {
    expect(getWorkshopSlugs()).toEqual(WORKSHOPS.map((workshop) => workshop.slug));
  });
});
