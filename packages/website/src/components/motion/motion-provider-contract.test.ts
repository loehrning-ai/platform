import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(process.cwd(), "src");

const ANCESTOR_SCOPED_CONSUMERS = new Set([
  "app/buecher/buecher-content.tsx",
  "app/ki-check/dimension-bars.tsx",
  "app/ki-check/radar-chart.tsx",
  "components/ai-native/demos/agent-demo.tsx",
  "components/ai-native/demos/chat-demo.tsx",
  "components/ai-native/demos/doc-demo.tsx",
  "components/ai-native/demos/excel-demo.tsx",
  "components/ai-native/demos/logistics-demo.tsx",
  "components/ai-native/demos/maturity-demo.tsx",
  "components/ai-native/demos/word-demo.tsx",
  "components/ai-native/demos/workflow-demo.tsx",
  "components/ai-native/exercises/_shell.tsx",
  "components/ai-native/exercises/context-budget.tsx",
  "components/ai-native/exercises/fix-prompt.tsx",
  "components/ai-native/exercises/free-response.tsx",
  "components/ai-native/exercises/pii-spotter.tsx",
  "components/ai-native/exercises/prompt-diff.tsx",
  "components/ai-native/exercises/rctfc-checklist.tsx",
  "components/ai-native/exercises/role-scenario.tsx",
  "components/ai-native/exercises/workflow-builder.tsx",
  "components/course/kurs/lesson-content.tsx",
  "components/course/kurs/lesson-quiz.tsx",
  "components/course/kurs/section-reader.tsx",
  "components/nav.tsx",
  "components/widgets/tier-a/_frame.tsx",
  "components/widgets/tier-a/failure-tagger.tsx",
  "components/widgets/tier-a/quiz.tsx",
  "components/widgets/tier-a/redaction-drill.tsx",
]);

function productionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsxFiles(absolute);
    if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) return [];
    return [absolute];
  });
}

function sourcePath(absolute: string): string {
  return relative(SOURCE_ROOT, absolute).split(sep).join("/");
}

describe("Framer Motion provider ownership", () => {
  it("requires every m.* consumer to own a scope or declare a concrete ancestor", () => {
    const uncovered = productionTsxFiles(SOURCE_ROOT).flatMap((absolute) => {
      const source = readFileSync(absolute, "utf8");
      if (!/<m\./.test(source)) return [];
      const localScope =
        source.includes("withMotionProvider(") ||
        source.includes("<MotionProvider") ||
        source.includes("<LazyMotion");
      const path = sourcePath(absolute);
      return localScope || ANCESTOR_SCOPED_CONSUMERS.has(path) ? [] : [path];
    });

    expect(uncovered).toEqual([]);
  });

  it("keeps streamed route children outside the root motion island", () => {
    const rootLayout = readFileSync(join(SOURCE_ROOT, "app", "layout.tsx"), "utf8");
    const providerBodies = [...rootLayout.matchAll(/<MotionProvider>([\s\S]*?)<\/MotionProvider>/g)];

    expect(providerBodies.length).toBeGreaterThan(0);
    for (const match of providerBodies) {
      expect(match[1]).not.toContain("{children}");
    }
    // Route children may have server-owned siblings, but must remain a direct
    // child of main rather than crossing a root client-provider boundary.
    expect(rootLayout).toMatch(/<main[^>]*>[\s\S]*?\{children\}[\s\S]*?<\/main>/);
    expect(rootLayout.indexOf("<ScrollToTop />")).toBeGreaterThan(
      rootLayout.indexOf("</main>"),
    );
  });
});
