/**
 * validation.test.ts (regression coverage)
 *
 * Unit tests for the pure lookup + traversal helpers in `./validation`.
 * The existing `graph.test.ts` exercises `validateLearningGraph`,
 * `getNodesForCourse` (shallow) and `traverseNextStep` against the REAL
 * `LEARNING_EDGES`. This file complements it without duplication:
 *   - `getLearningNode` and `getNodesByStage` are otherwise untested;
 *   - `traverseNextStep` is re-tested as a PURE function over synthetic edges
 *     so the type-filter branch (a matching `from` with a non-`next_step`
 *     type must yield `null`) is exercised, which the real-data test never
 *     reaches;
 *   - `getNodesForCourse` gains a predicate-correctness assertion.
 *
 * Everything is asserted against observable behaviour (real id -> real node,
 * stage partitioning, edge selection), never by re-implementing the body.
 */

import { describe, expect, it } from "vitest";
import { LEARNING_NODES } from "./data";
import {
  getLearningNode,
  getNodesByStage,
  getNodesForCourse,
  traverseNextStep,
  validateLearningGraph,
} from "./validation";
import type { LearningEdge } from "./types";

describe("getLearningNode", () => {
  it("returns the node whose id matches the request", () => {
    const node = getLearningNode("self-test:standortbestimmung");
    expect(node).toBeDefined();
    expect(node?.id).toBe("self-test:standortbestimmung");
    // Correct entry, not merely some entry.
    expect(node?.route).toBe("/standortbestimmung");
    expect(node?.type).toBe("self_test");
  });

  it("resolves a generated course node id to the right course", () => {
    const node = getLearningNode("course:ki-fuehrerschein");
    expect(node?.courseSlug).toBe("ki-fuehrerschein");
    expect(node?.route).toBe("/ki-fuehrerschein");
  });

  it("returns undefined for an unknown id", () => {
    expect(getLearningNode("course:does-not-exist")).toBeUndefined();
    expect(getLearningNode("")).toBeUndefined();
  });

  it("returns a node whose id round-trips for every node in the graph", () => {
    for (const node of LEARNING_NODES) {
      expect(getLearningNode(node.id)?.id).toBe(node.id);
    }
  });
});

describe("getNodesByStage", () => {
  it("returns only nodes carrying the requested stage", () => {
    const pruefen = getNodesByStage("pruefen");
    expect(pruefen.length).toBeGreaterThan(0);
    for (const node of pruefen) {
      expect(node.stage).toBe("pruefen");
    }
  });

  it("includes the known pruefen members and excludes other stages", () => {
    const ids = new Set(getNodesByStage("pruefen").map((n) => n.id));
    expect(ids.has("self-test:standortbestimmung")).toBe(true);
    expect(ids.has("on-ramp:einstieg")).toBe(true);
    expect(ids.has("conceptual-block:wie-ki-funktioniert")).toBe(true);
    // course:ki-fuehrerschein is stage "grundlagen", never "pruefen".
    expect(ids.has("course:ki-fuehrerschein")).toBe(false);
  });

  it("partitions nodes so a stage query excludes the other stage's members", () => {
    const dokumentieren = getNodesByStage("dokumentieren");
    expect(dokumentieren.length).toBeGreaterThan(0);
    for (const node of dokumentieren) {
      expect(node.stage).toBe("dokumentieren");
    }
    const dokIds = new Set(dokumentieren.map((n) => n.id));
    // A "pruefen" node must not leak into the "dokumentieren" bucket.
    expect(dokIds.has("self-test:standortbestimmung")).toBe(false);
  });
});

describe("getNodesForCourse", () => {
  it("returns only nodes bound to the requested courseSlug", () => {
    const nodes = getNodesForCourse("ki-fuehrerschein");
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node.courseSlug).toBe("ki-fuehrerschein");
    }
    // The course node itself is part of its own bundle.
    expect(nodes.some((n) => n.id === "course:ki-fuehrerschein")).toBe(true);
  });

  it("excludes nodes bound to a different course and nodes with no course", () => {
    const ids = new Set(getNodesForCourse("ki-fuehrerschein").map((n) => n.id));
    // eu-ai-act-kurs course node belongs to another bundle.
    expect(ids.has("course:eu-ai-act-kurs")).toBe(false);
    // Imported labs carry no courseSlug and must never appear.
    const labs = LEARNING_NODES.filter((n) => n.type === "open_source_lab");
    expect(labs.length).toBeGreaterThan(0);
    for (const lab of labs) {
      expect(ids.has(lab.id)).toBe(false);
    }
  });

  it("returns an empty list for a course slug that has no nodes", () => {
    expect(getNodesForCourse("not-a-real-course")).toEqual([]);
  });
});

describe("traverseNextStep (pure over synthetic edges)", () => {
  it("returns the target of the matching next_step edge", () => {
    const edges: LearningEdge[] = [
      { from: "a", to: "b", type: "next_step" },
      { from: "b", to: "c", type: "next_step" },
    ];
    expect(traverseNextStep("a", edges)).toBe("b");
    expect(traverseNextStep("b", edges)).toBe("c");
  });

  it("returns null when the only edge from the node is not a next_step", () => {
    const edges: LearningEdge[] = [
      { from: "a", to: "b", type: "recommended_before" },
      { from: "a", to: "c", type: "supports" },
    ];
    expect(traverseNextStep("a", edges)).toBeNull();
  });

  it("selects the next_step edge even when a non-next_step edge shares the from", () => {
    const edges: LearningEdge[] = [
      { from: "a", to: "wrong", type: "recommended_before" },
      { from: "a", to: "right", type: "next_step" },
    ];
    expect(traverseNextStep("a", edges)).toBe("right");
  });

  it("returns null when no edge originates from the node", () => {
    const edges: LearningEdge[] = [{ from: "x", to: "y", type: "next_step" }];
    expect(traverseNextStep("a", edges)).toBeNull();
    expect(traverseNextStep("a", [])).toBeNull();
  });
});

describe("validateLearningGraph (contract invariant)", () => {
  it("keeps ok in sync with the emptiness of errors", () => {
    const result = validateLearningGraph();
    // The documented contract: ok === (no errors). graph.test.ts asserts the
    // real graph is clean; here we lock the invariant between the two fields.
    expect(result.ok).toBe(result.errors.length === 0);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
