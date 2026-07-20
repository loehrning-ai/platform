import { describe, it, expect } from "vitest";
import {
  WIE_KI_META,
  WIE_KI_LEKTIONEN,
  getLektionById,
  getPrevLektion,
  getNextLektion,
  formatGermanDate,
} from "./wie-ki-funktioniert";

const BANNED_PHRASES = [
  "Mehrwert",
  "disruptiv",
  "KI-Transformation",
  "Wettbewerbsvorteil",
  "profitieren Sie",
  "Jetzt loslegen",
  "Ihr Unternehmen",
  "zukunftssicher",
  "Paradigmenwechsel",
  "Hier klicken",
  "Erfahren Sie mehr",
];

describe("wie-ki-funktioniert data loader", () => {
  it("WIE_KI_LEKTIONEN has exactly 4 lektionen", () => {
    expect(WIE_KI_LEKTIONEN.length).toBe(4);
  });

  it("WIE_KI_META.lessonCount equals 4", () => {
    expect(WIE_KI_META.lessonCount).toBe(4);
  });

  it("WIE_KI_META has all required freshness fields", () => {
    expect(WIE_KI_META.lastReviewed).toBeDefined();
    expect(WIE_KI_META.nextReview).toBeDefined();
    expect(WIE_KI_META.reviewCadence).toBeDefined();
    expect(WIE_KI_META.riskClass).toBeDefined();
    expect(WIE_KI_META.owner).toBeDefined();
  });

  it("WIE_KI_META has access public and language de", () => {
    expect(WIE_KI_META.access).toBe("public");
    expect(WIE_KI_META.language).toBe("de");
  });

  it("getLektionById returns correct lektion for valid IDs", () => {
    const l1 = getLektionById("lektion-1-vorhersage");
    expect(l1).toBeDefined();
    expect(l1?.title).toContain("Vorhersage");
    const l4 = getLektionById("lektion-4-grenzen");
    expect(l4).toBeDefined();
    expect(l4?.title).toContain("Grenzen");
  });

  it("getLektionById returns undefined for unknown IDs", () => {
    expect(getLektionById("nonexistent")).toBeUndefined();
    expect(getLektionById("")).toBeUndefined();
    expect(getLektionById("lektion-99")).toBeUndefined();
  });

  it("no lektion has durationMinutes exceeding 20", () => {
    for (const l of WIE_KI_LEKTIONEN) {
      expect(l.durationMinutes, `${l.id} exceeds 20 minutes`).toBeLessThanOrEqual(20);
    }
  });

  it("each lektion has exactly 2 sections", () => {
    for (const l of WIE_KI_LEKTIONEN) {
      expect(l.sections.length, `${l.id} should have 2 sections`).toBe(2);
    }
  });

  it("each lektion has at least 1 keyConcept", () => {
    for (const l of WIE_KI_LEKTIONEN) {
      expect(l.keyConcepts.length, `${l.id} needs keyConcepts`).toBeGreaterThan(0);
    }
  });

  it("section content contains no banned phrases", () => {
    for (const l of WIE_KI_LEKTIONEN) {
      for (const s of l.sections) {
        for (const phrase of BANNED_PHRASES) {
          expect(
            s.content,
            `Section ${s.id} contains banned phrase: "${phrase}"`,
          ).not.toContain(phrase);
          expect(
            s.keyTakeaway,
            `Takeaway in ${s.id} contains banned phrase: "${phrase}"`,
          ).not.toContain(phrase);
        }
      }
    }
  });

  it("section content contains no em-dashes (U+2014)", () => {
    for (const l of WIE_KI_LEKTIONEN) {
      for (const s of l.sections) {
        expect(s.content, `Section ${s.id} has em-dash`).not.toContain("—");
        expect(s.content, `Section ${s.id} has spaced em-dash`).not.toContain(" — ");
      }
    }
  });

  it("lektion IDs match expected canonical values", () => {
    const ids = WIE_KI_LEKTIONEN.map((l) => l.id);
    expect(ids).toContain("lektion-1-vorhersage");
    expect(ids).toContain("lektion-2-trainingsdaten");
    expect(ids).toContain("lektion-3-halluzinationen");
    expect(ids).toContain("lektion-4-grenzen");
  });

  it("getPrevLektion returns undefined for first lektion", () => {
    expect(getPrevLektion("lektion-1-vorhersage")).toBeUndefined();
  });

  it("getNextLektion returns undefined for last lektion", () => {
    expect(getNextLektion("lektion-4-grenzen")).toBeUndefined();
  });

  it("getPrevLektion and getNextLektion form a correct chain", () => {
    const next1 = getNextLektion("lektion-1-vorhersage");
    expect(next1?.id).toBe("lektion-2-trainingsdaten");
    const prev4 = getPrevLektion("lektion-4-grenzen");
    expect(prev4?.id).toBe("lektion-3-halluzinationen");
  });

  it("formatGermanDate converts ISO date to German month name", () => {
    expect(formatGermanDate("2026-06-22")).toBe("Juni 2026");
    expect(formatGermanDate("2026-01-01")).toBe("Januar 2026");
    expect(formatGermanDate("2026-12-20")).toBe("Dezember 2026");
  });
});
