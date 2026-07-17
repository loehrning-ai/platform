/**
 * data.test.ts (regression coverage)
 *
 * Exercises the DERIVATION logic that builds `LEARNING_NODES` / `LEARNING_EDGES`
 * from the real `COURSE_CATALOG`, `IMPORTED_COURSE_CATALOG`, `books` and `demos`
 * sources. `graph.test.ts` already covers lab language/access, persona coverage
 * and the pathway-display labels, so this file targets the mappings it does not:
 *   - the demo `title` trailing-period strip + route/level/stage/audience/evidence
 *     ternaries;
 *   - the per-course and per-book field mappings (level, stage, audience,
 *     evidenceMode, courseSlug);
 *   - the derived `practice_for` (demo -> course) and lab `supports` edges.
 *
 * Concrete expected literals (e.g. "Claude in Excel") verify the transform is
 * real rather than a re-implementation of the source module.
 */

import { describe, expect, it } from "vitest";
import { LEARNING_EDGES, LEARNING_NODES, PATHWAY_STAGE_DISPLAY, PATHWAY_STAGES } from "./data";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { books } from "@/lib/books";
import { demos } from "@/lib/demos";

function nodeById(id: string) {
  return LEARNING_NODES.find((n) => n.id === id);
}

describe("demo node derivation", () => {
  it("strips a trailing period from the demo title", () => {
    // Guard: the source title genuinely ends with a period, so the strip is
    // not a no-op.
    const excel = demos.find((d) => d.slug === "excel");
    expect(excel?.title).toBe("Claude in Excel.");

    const node = nodeById("demo:excel");
    expect(node?.title).toBe("Claude in Excel");
  });

  it("leaves no demo node title ending in a period", () => {
    for (const demo of demos) {
      const node = nodeById(`demo:${demo.slug}`);
      expect(node, `missing node for demo ${demo.slug}`).toBeDefined();
      expect(node?.title.endsWith(".")).toBe(false);
    }
  });

  it("routes each demo node to /demos/<slug>", () => {
    for (const demo of demos) {
      expect(nodeById(`demo:${demo.slug}`)?.route).toBe(`/demos/${demo.slug}`);
    }
  });

  it("maps demo level einstieg/mittel/fortg to entry/intermediate/advanced", () => {
    const expected: Record<string, string> = {
      einstieg: "entry",
      mittel: "intermediate",
      fortg: "advanced",
    };
    for (const demo of demos) {
      expect(nodeById(`demo:${demo.slug}`)?.level).toBe(expected[demo.level]);
    }
  });

  it("assigns Governance demos to the dokumentieren stage and the rest to anwenden", () => {
    // prompt-scanner is the Governance demo; excel is Grundlagen.
    expect(nodeById("demo:prompt-scanner")?.stage).toBe("dokumentieren");
    expect(nodeById("demo:excel")?.stage).toBe("anwenden");
    for (const demo of demos) {
      const expectedStage = demo.category === "Governance" ? "dokumentieren" : "anwenden";
      expect(nodeById(`demo:${demo.slug}`)?.stage).toBe(expectedStage);
    }
  });

  it("gives fortgeschritten demos a technische-vertiefung audience and others verantwortliche", () => {
    const advanced = nodeById("demo:agent-pipeline"); // level fortg
    expect(advanced?.audience).toContain("praktiker");
    expect(advanced?.audience).toContain("technische-vertiefung");

    const entry = nodeById("demo:excel"); // level einstieg
    expect(entry?.audience).toContain("praktiker");
    expect(entry?.audience).toContain("verantwortliche");
    expect(entry?.audience).not.toContain("technische-vertiefung");
  });

  it("carries the demo evidenceMode through onto the node", () => {
    expect(nodeById("demo:excel")?.evidenceMode).toBe("synthetic");
    expect(nodeById("demo:rag-vertragsassistent")?.evidenceMode).toBe("rule_based");
    expect(nodeById("demo:agent-pipeline")?.evidenceMode).toBe("recorded_trace");
  });
});

describe("course node derivation", () => {
  it("assigns the KI-Fuehrerschein bundle its expected classification", () => {
    const node = nodeById("course:ki-fuehrerschein");
    expect(node?.level).toBe("entry");
    expect(node?.stage).toBe("grundlagen");
    expect(node?.evidenceMode).toBe("source_backed");
    expect(node?.audience).toEqual(["mitarbeitende", "verantwortliche"]);
  });

  it("assigns the EU-AI-Act course its expected classification", () => {
    const node = nodeById("course:eu-ai-act-kurs");
    expect(node?.level).toBe("intermediate");
    expect(node?.stage).toBe("regeln");
    expect(node?.evidenceMode).toBe("source_backed");
    expect(node?.audience).toEqual(["verantwortliche"]);
  });

  it("classifies KI und Gesellschaft as an entry-level societal course", () => {
    const node = nodeById("course:ki-und-gesellschaft");
    expect(node?.level).toBe("entry");
    expect(node?.stage).toBe("grundlagen");
    expect(node?.evidenceMode).toBe("source_backed");
    expect(node?.audience).toEqual(["mitarbeitende"]);
  });

  it("marks the AI-Native course advanced and self-attested", () => {
    const node = nodeById("course:ai-native");
    expect(node?.level).toBe("advanced");
    expect(node?.stage).toBe("anwenden");
    expect(node?.evidenceMode).toBe("self_attested");
    expect(node?.audience).toEqual(["praktiker"]);
  });

  it("mirrors route, summary and slug from each catalog course", () => {
    for (const course of COURSE_CATALOG) {
      const node = nodeById(`course:${course.slug}`);
      expect(node?.route).toBe(course.href);
      expect(node?.summary).toBe(course.description);
      expect(node?.courseSlug).toBe(course.slug);
      expect(node?.access).toBe("public-preview");
    }
  });
});

describe("book node derivation", () => {
  it("routes book courseSlug to the matching companion course", () => {
    expect(nodeById("book:ki-arbeitsalltag")?.courseSlug).toBe("ki-fuehrerschein");
    expect(nodeById("book:ki-tools-selbststaendige")?.courseSlug).toBe("ai-native");
    expect(nodeById("book:ki-landschaft")?.courseSlug).toBe("eu-ai-act-kurs");
  });

  it("levels the freelancer reference intermediate and other books entry", () => {
    expect(nodeById("book:ki-tools-selbststaendige")?.level).toBe("intermediate");
    expect(nodeById("book:ki-arbeitsalltag")?.level).toBe("entry");
    expect(nodeById("book:ki-landschaft")?.level).toBe("entry");
  });

  it("assigns each book a persona-specific audience", () => {
    expect(nodeById("book:ki-arbeitsalltag")?.audience).toEqual(["mitarbeitende"]);
    expect(nodeById("book:ki-tools-selbststaendige")?.audience).toEqual(["praktiker"]);
    expect(nodeById("book:ki-landschaft")?.audience).toEqual(["verantwortliche"]);
  });

  it("places every book in the vertiefen stage with source_backed evidence", () => {
    for (const book of books) {
      const node = nodeById(`book:${book.id}`);
      expect(node?.stage).toBe("vertiefen");
      expect(node?.evidenceMode).toBe("source_backed");
      expect(node?.route).toBe(book.readerHref);
    }
  });
});

describe("open-source lab node derivation", () => {
  it("maps the Englisch language flag to 'en' and keeps labs technical", () => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      const node = nodeById(`open-source-lab:${course.slug}`);
      expect(node, `missing lab node for ${course.slug}`).toBeDefined();
      expect(node?.language).toBe(course.language === "Englisch" ? "en" : "de");
      expect(node?.level).toBe("technical");
      expect(node?.audience).toEqual(["technische-vertiefung"]);
      expect(node?.route).toBe(course.href);
      expect(node?.evidenceMode).toBe("external");
    }
  });
});

describe("derived edges", () => {
  it("creates a practice_for edge from every demo to its course", () => {
    for (const demo of demos) {
      const edge = LEARNING_EDGES.find(
        (e) =>
          e.from === `demo:${demo.slug}` &&
          e.to === `course:${demo.courseSlug}` &&
          e.type === "practice_for",
      );
      expect(edge, `missing practice_for edge for demo ${demo.slug}`).toBeDefined();
    }
  });

  it("connects every imported lab to the ai-native course with a supports edge", () => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      const edge = LEARNING_EDGES.find(
        (e) =>
          e.from === `open-source-lab:${course.slug}` &&
          e.to === "course:ai-native" &&
          e.type === "supports",
      );
      expect(edge, `missing supports edge for lab ${course.slug}`).toBeDefined();
    }
  });
});

describe("pathway stage tables", () => {
  it("exposes the six ordered pathway stages with unique ids", () => {
    const ids = PATHWAY_STAGES.map((s) => s.id);
    expect(ids).toEqual([
      "pruefen",
      "grundlagen",
      "regeln",
      "anwenden",
      "dokumentieren",
      "vertiefen",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("provides a non-empty subtitle and icon for every stage display entry", () => {
    for (const stage of PATHWAY_STAGES) {
      const display = PATHWAY_STAGE_DISPLAY[stage.id];
      expect(display).toBeDefined();
      expect(display.subtitle.length).toBeGreaterThan(0);
      expect(display.icon.length).toBeGreaterThan(0);
    }
  });
});
