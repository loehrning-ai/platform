import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { demos } from "@/lib/demos";
import { books } from "@/lib/books";
import { LEARNING_EDGES, LEARNING_NODES } from "./data";
import type { LearningEdge, LearningNode } from "./types";

export function traverseNextStep(currentNodeId: string, edges: readonly LearningEdge[]): string | null {
  const edge = edges.find((e) => e.from === currentNodeId && e.type === "next_step");
  return edge ? edge.to : null;
}

export interface LearningGraphValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export function getLearningNode(id: string): LearningNode | undefined {
  return LEARNING_NODES.find((node) => node.id === id);
}

export function getNodesForCourse(courseSlug: string): readonly LearningNode[] {
  return LEARNING_NODES.filter((node) => node.courseSlug === courseSlug);
}

export function getNodesByStage(stage: LearningNode["stage"]): readonly LearningNode[] {
  return LEARNING_NODES.filter((node) => node.stage === stage);
}

export function validateLearningGraph(): LearningGraphValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const node of LEARNING_NODES) {
    if (ids.has(node.id)) errors.push(`Duplicate node id: ${node.id}`);
    ids.add(node.id);
    if (!node.route.startsWith("/")) errors.push(`Node route must be internal: ${node.id}`);
    if (node.audience.length === 0) errors.push(`Node has no audience: ${node.id}`);
    if (!node.sourceOwner) errors.push(`Node has no source owner: ${node.id}`);
  }

  for (const edge of LEARNING_EDGES) {
    if (!ids.has(edge.from)) errors.push(`Edge source missing: ${edge.from}`);
    if (!ids.has(edge.to)) errors.push(`Edge target missing: ${edge.to}`);
  }

  for (const course of COURSE_CATALOG) {
    if (!ids.has(`course:${course.slug}`)) errors.push(`Course missing from graph: ${course.slug}`);
  }

  for (const demo of demos) {
    if (!ids.has(`demo:${demo.slug}`)) errors.push(`Demo missing from graph: ${demo.slug}`);
  }

  for (const book of books) {
    if (!ids.has(`book:${book.id}`)) errors.push(`Book missing from graph: ${book.id}`);
  }

  return { ok: errors.length === 0, errors };
}

