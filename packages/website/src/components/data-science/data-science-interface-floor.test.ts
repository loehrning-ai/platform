import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const COMPONENT_ROOT = __dirname;
const css = readFileSync(join(COMPONENT_ROOT, "ds-v8-scope.css"), "utf8");

type SvgException = {
  reason: string;
  sizes: Record<string, number>;
};

/*
 * These are spatial annotations inside bounded SVG viewBoxes, not interface
 * copy. File, purpose, size, and count are pinned so a new small label cannot
 * hide behind a generic allow-list. Learner-facing HTML controls, status,
 * captions, legends, and provenance remain subject to the 12px floor.
 */
const BOUNDED_SVG_ANNOTATION_EXCEPTIONS = {
  "ab-sim.tsx": {
    reason: "experiment-chart axes and true-lift marker",
    sizes: { "9": 3 },
  },
  "bias-variance-sim.tsx": {
    reason: "three bounded decomposition-plot labels",
    sizes: { "10": 3 },
  },
  "confounding-simulator.tsx": {
    reason: "scatterplot x-axis and y-axis titles",
    sizes: { "10": 2 },
  },
  "correlation-matrix.tsx": {
    reason: "matrix scale marks, row/column labels, and cell coefficient",
    sizes: { "7": 3, "10": 2, "11": 1 },
  },
  "cuped-explainer.tsx": {
    reason: "scatter axes, moving-point value, and distribution ticks",
    sizes: { "9": 1, "10": 1, "11": 1 },
  },
  "dag-builder.tsx": {
    reason: "causal-graph node role annotation",
    sizes: { "9": 1 },
  },
  "dag-viewer.tsx": {
    reason: "causal-graph node title and role annotation",
    sizes: { "9": 1, "11": 1 },
  },
  "dataset-explorer.tsx": {
    reason: "class-balance bars, values, and synthetic-data note",
    sizes: { "9.5": 1, "10": 4 },
  },
  "difference-in-differences.tsx": {
    reason: "time/response axes and treatment-line annotations",
    sizes: { "9": 2, "10": 5 },
  },
  "distribution-explorer.tsx": {
    reason: "distribution legend keys and x-axis ticks",
    sizes: { "8": 1, "9": 3 },
  },
  "drift-simulator.tsx": {
    reason: "threshold, time-step, and sparkline point annotations",
    sizes: { "8": 1, "8.5": 3 },
  },
  "feature-store-diagram.tsx": {
    reason: "feature-pipeline stage, node, divergence, and trace annotations",
    sizes: { "8.5": 2, "9": 3, "9.5": 6 },
  },
  "flowing-pipeline.tsx": {
    reason: "pipeline stage and moving-record annotations",
    sizes: { "9.5": 1, "10": 1 },
  },
  "galton-sim.tsx": {
    reason: "bounded population and sample-mean plot labels",
    sizes: { "10": 2 },
  },
  "global-vs-local.tsx": {
    reason: "global/local contribution plot names and values",
    sizes: { "9": 2, "10": 3 },
  },
  "instrumental-variable.tsx": {
    reason: "causal-diagram edge, node-detail, and legend annotations",
    sizes: { "9": 3, "10": 1 },
  },
  "interaction-terms.tsx": {
    reason: "interaction-surface cells and spatial axis titles",
    sizes: { "9": 3 },
  },
  "lime-explainer.tsx": {
    reason: "local-neighborhood plot regions, point label, and axes",
    sizes: { "9": 5, "10": 1 },
  },
  "model-serving-architecture.tsx": {
    reason: "serving-architecture node annotation",
    sizes: { "9.5": 1 },
  },
  "multiple-testing.tsx": {
    reason: "alpha line and paired significance-count annotations",
    sizes: { "8": 3 },
  },
  "outlier-detector.tsx": {
    reason: "bounded scatterplot axis titles",
    sizes: { "8": 2 },
  },
  "permutation-importance.tsx": {
    reason: "feature names and permutation-drop values inside the plot",
    sizes: { "10": 2 },
  },
  "polynomial-expansion.tsx": {
    reason: "fit-plot ticks and model legend annotations",
    sizes: { "9": 3 },
  },
  "power-calculator.tsx": {
    reason: "power guide, selected-point value, ticks, and x-axis title",
    sizes: { "8": 3, "9": 1 },
  },
  "precision-recall-tradeoff.tsx": {
    reason: "precision-recall axis titles and ticks",
    sizes: { "8": 2, "9": 2 },
  },
  "scaler-demo.tsx": {
    reason: "bounded distribution-group labels",
    sizes: { "9": 1 },
  },
  "shap-waterfall-sim.tsx": {
    reason: "waterfall baseline, feature, contribution, result, and ticks",
    sizes: { "8": 1, "9": 1, "10": 3 },
  },
  "threshold-sim.tsx": {
    reason: "score/threshold and confusion-chart spatial annotations",
    sizes: { "9": 3, "10": 3 },
  },
} satisfies Record<string, SvgException>;

function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;

  for (const character of selector) {
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === "[" || character === "(") depth += 1;
    if (character === "]" || character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current.trim());
  return parts;
}

function finalCssFontSizes(): Map<string, string> {
  const declarations = new Map<string, string>();
  postcss.parse(css).walkRules((rule) => {
    rule.walkDecls("font-size", (declaration) => {
      for (const selector of splitSelectorList(rule.selector)) {
        declarations.set(selector, declaration.value);
      }
    });
  });
  return declarations;
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectTsxFiles(path);
      return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
    })
    .sort();
}

describe("Data Science learner-facing interface floor", () => {
  it("resolves CSS text to 12px or larger except bounded SVG plot ticks", () => {
    const undersized = [...finalCssFontSizes()]
      .filter(([, value]) => /^\d+(?:\.\d+)?px$/.test(value))
      .filter(([, value]) => Number.parseFloat(value) < 12)
      .sort(([left], [right]) => left.localeCompare(right));

    expect(undersized).toEqual([[".ds-v8-scope .plot-wrap svg text", "10px"]]);
  });

  it("keeps inline HTML UI at 12px and pins every smaller SVG annotation by file, purpose, size, and count", () => {
    const inlineViolations: string[] = [];
    const arbitraryTextSizeViolations: string[] = [];
    const nonSvgExceptions: string[] = [];
    const actualSvgExceptions: Record<string, Record<string, number>> = {};
    const files = collectTsxFiles(COMPONENT_ROOT);

    for (const filePath of files) {
      const file = relative(COMPONENT_ROOT, filePath);
      const source = readFileSync(filePath, "utf8");
      const inlinePattern =
        /\bfontSize\s*:\s*(?:([0-9]+(?:\.[0-9]+)?)|["']([0-9]+(?:\.[0-9]+)?)(?:px)?["'])/g;
      for (const match of source.matchAll(inlinePattern)) {
        const size = Number.parseFloat(match[1] ?? match[2] ?? "0");
        if (size < 12) {
          inlineViolations.push(`${file}:${lineAt(source, match.index)}`);
        }
      }

      const arbitraryTextSizePattern = /\btext-\[([0-9]+(?:\.[0-9]+)?)px\]/g;
      for (const match of source.matchAll(arbitraryTextSizePattern)) {
        if (Number.parseFloat(match[1] ?? "0") < 12) {
          arbitraryTextSizeViolations.push(
            `${file}:${lineAt(source, match.index)}`,
          );
        }
      }

      const jsxPattern =
        /\bfontSize\s*=\s*(?:["']([0-9]+(?:\.[0-9]+)?)["']|\{\s*([0-9]+(?:\.[0-9]+)?)\s*\})/g;
      for (const match of source.matchAll(jsxPattern)) {
        const size = Number.parseFloat(match[1] ?? match[2] ?? "0");
        if (size >= 12) continue;

        const tagStart = source.lastIndexOf("<", match.index);
        const tagEnd = source.indexOf(">", match.index);
        const openingTag = source.slice(tagStart, tagEnd + 1).trimStart();
        if (!openingTag.startsWith("<text")) {
          nonSvgExceptions.push(`${file}:${lineAt(source, match.index)}`);
          continue;
        }

        const sizeKey = String(size);
        const exceptionFile = basename(filePath);
        actualSvgExceptions[exceptionFile] ??= {};
        actualSvgExceptions[exceptionFile]![sizeKey] =
          (actualSvgExceptions[exceptionFile]![sizeKey] ?? 0) + 1;
      }
    }

    const expectedSvgExceptions = Object.fromEntries(
      Object.entries(BOUNDED_SVG_ANNOTATION_EXCEPTIONS).map(
        ([file, exception]) => [file, exception.sizes],
      ),
    );

    expect(inlineViolations).toEqual([]);
    expect(arbitraryTextSizeViolations).toEqual([]);
    expect(nonSvgExceptions).toEqual([]);
    expect(actualSvgExceptions).toEqual(expectedSvgExceptions);
    for (const exception of Object.values(BOUNDED_SVG_ANNOTATION_EXCEPTIONS)) {
      expect(exception.reason.length).toBeGreaterThan(12);
    }
  });
});
