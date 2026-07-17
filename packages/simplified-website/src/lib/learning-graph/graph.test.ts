import { describe, expect, it } from "vitest";
import {
  LEARNING_EDGES,
  LEARNING_NODES,
  PATHWAY_STAGES,
  PATHWAY_STAGE_DISPLAY,
  getNodesForCourse,
  traverseNextStep,
  validateLearningGraph,
} from ".";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { books } from "@/lib/books";
import { demos } from "@/lib/demos";

describe("learning graph", () => {
  it("validates without orphan nodes or broken edges", () => {
    const result = validateLearningGraph();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("covers every native course, book, and demo", () => {
    const ids = new Set(LEARNING_NODES.map((node) => node.id));
    for (const course of COURSE_CATALOG) expect(ids.has(`course:${course.slug}`)).toBe(true);
    for (const book of books) expect(ids.has(`book:${book.id}`)).toBe(true);
    for (const demo of demos) expect(ids.has(`demo:${demo.slug}`)).toBe(true);
  });

  it("maps every catalog course back to its course context", () => {
    for (const course of COURSE_CATALOG) {
      const nodes = getNodesForCourse(course.slug);
      expect(nodes.some((node) => node.type === "course")).toBe(true);
    }
  });

  it("keeps books public and connects every demo book reference", () => {
    const edgeIds = new Set(LEARNING_EDGES.map((edge) => `${edge.from}->${edge.to}`));
    for (const book of books) {
      const node = LEARNING_NODES.find((item) => item.id === `book:${book.id}`);
      expect(node?.route).toBe(book.readerHref);
      expect(node?.access).toBe("public");
    }
    for (const demo of demos) {
      for (const bookSlug of demo.bookSlugs) {
        expect(edgeIds.has(`demo:${demo.slug}->book:${bookSlug}`)).toBe(true);
      }
    }
  });

  it("separates imported labs from native German certificate courses", () => {
    const labs = LEARNING_NODES.filter((node) => node.type === "open_source_lab");
    expect(labs.length).toBeGreaterThan(0);
    for (const lab of labs) {
      expect(lab.language).toBe("en");
      expect(lab.access).toBe("public-preview");
      expect(lab.evidenceMode).toBe("external");
    }
  });

  it("ki-check node replaces placeholder, no node points to /ki-transformation-check", () => {
    for (const node of LEARNING_NODES) {
      expect(node.route).not.toBe("/ki-transformation-check");
    }
    const sbNode = LEARNING_NODES.find((n) => n.id === "self-test:ki-check");
    expect(sbNode).toBeDefined();
    expect(sbNode?.route).toBe("/ki-check");
  });

  it("traverseNextStep follows the next_step chain correctly", () => {
    expect(traverseNextStep("course:ki-fuehrerschein", LEARNING_EDGES)).toBe("course:ki-und-gesellschaft");
    expect(traverseNextStep("course:ki-und-gesellschaft", LEARNING_EDGES)).toBe("course:eu-ai-act-kurs");
    expect(traverseNextStep("course:eu-ai-act-kurs", LEARNING_EDGES)).toBe("course:ai-native");
    expect(traverseNextStep("course:ai-native", LEARNING_EDGES)).toBeNull();
  });

  it("all 6 PATHWAY_STAGE_DISPLAY keys exist in PATHWAY_STAGES", () => {
    const stageIds = PATHWAY_STAGES.map((s) => s.id);
    for (const key of Object.keys(PATHWAY_STAGE_DISPLAY)) {
      expect(stageIds).toContain(key);
    }
    expect(PATHWAY_STAGE_DISPLAY["pruefen"].displayLabel).toBe("Prüfen");
    expect(PATHWAY_STAGE_DISPLAY["grundlagen"].displayLabel).toBe("Verstehen");
    expect(PATHWAY_STAGE_DISPLAY["regeln"].displayLabel).toBe("Einordnen");
    expect(PATHWAY_STAGE_DISPLAY["anwenden"].displayLabel).toBe("Umsetzen");
    expect(PATHWAY_STAGE_DISPLAY["dokumentieren"].displayLabel).toBe("Belegen");
    expect(PATHWAY_STAGE_DISPLAY["vertiefen"].displayLabel).toBe("Vertiefen");
  });

  it("all open_source_lab nodes have language 'en'", () => {
    const labs = LEARNING_NODES.filter((n) => n.type === "open_source_lab");
    expect(labs.length).toBeGreaterThan(0);
    for (const lab of labs) {
      expect(lab.language).toBe("en");
    }
  });

  it("no self_test node is gated (ki-check must be public)", () => {
    const selfTests = LEARNING_NODES.filter((n) => n.type === "self_test");
    expect(selfTests.length).toBeGreaterThan(0);
    for (const st of selfTests) {
      expect(st.access).not.toBe("gated-learning-app");
    }
  });

  it("all native courses have access: public-preview", () => {
    const courseSlugs = COURSE_CATALOG.map((course) => course.slug);
    for (const slug of courseSlugs) {
      const node = LEARNING_NODES.find((n) => n.id === `course:${slug}`);
      expect(node, `course:${slug} not found`).toBeDefined();
      expect(node?.access).toBe("public-preview");
    }
  });

  it("all four LearnerPersona types appear in at least one LEARNING_NODE audience", () => {
    const allAudiences = LEARNING_NODES.flatMap((n) => n.audience);
    expect(allAudiences).toContain("mitarbeitende");
    expect(allAudiences).toContain("verantwortliche");
    expect(allAudiences).toContain("praktiker");
    expect(allAudiences).toContain("technische-vertiefung");
  });

  it("/einstieg node exists and has a next_step edge to course:ki-fuehrerschein (learning-path rollout)", () => {
    const einstiegNode = LEARNING_NODES.find((n) => n.id === "on-ramp:einstieg");
    expect(einstiegNode).toBeDefined();
    expect(einstiegNode?.route).toBe("/einstieg");
    expect(einstiegNode?.access).toBe("public");
    const edge = LEARNING_EDGES.find(
      (e) => e.from === "on-ramp:einstieg" && e.to === "course:ki-fuehrerschein",
    );
    expect(edge).toBeDefined();
  });

  it("pruefen stage has at least two nodes (learning-path rollout)", () => {
    const pruefen = LEARNING_NODES.filter((n) => n.stage === "pruefen");
    expect(pruefen.length).toBeGreaterThanOrEqual(2);
  });

  it("wie-ki-funktioniert conceptual block node exists with public access (learning-path rollout)", () => {
    const node = LEARNING_NODES.find((n) => n.id === "conceptual-block:wie-ki-funktioniert");
    expect(node).toBeDefined();
    expect(node?.route).toBe("/wie-ki-funktioniert");
    expect(node?.access).toBe("public");
    expect(node?.type).toBe("conceptual_block");
    const edge = LEARNING_EDGES.find(
      (e) => e.from === "conceptual-block:wie-ki-funktioniert" && e.to === "course:ki-fuehrerschein",
    );
    expect(edge).toBeDefined();
  });

  it("PATHWAY_STAGES[0] has plain German title and description without commercial language", () => {
    const pruefen = PATHWAY_STAGES[0];
    expect(pruefen.title).toBe("Prüfen");
    expect(pruefen.description).not.toMatch(/Reife|Datenlage/);
    expect(pruefen.description).toMatch(/KI/);
  });
});
