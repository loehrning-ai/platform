import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_CONTENT_DATE } from "./content-freshness";

const ROOT = process.cwd();
const PUBLIC_TEXT_ROOTS = [
  resolve(ROOT, "content"),
  resolve(ROOT, "src/app/blog"),
  resolve(ROOT, "src/app/eu-ai-act-kurs"),
  resolve(ROOT, "src/lib/blog-metadata.ts"),
];
const TEXT_EXTENSIONS = new Set([".json", ".md", ".ts", ".tsx"]);

function collectTextFiles(path: string, result: string[] = []): string[] {
  const stat = statSync(path);
  if (stat.isFile()) {
    const extension = path.slice(path.lastIndexOf("."));
    if (TEXT_EXTENSIONS.has(extension) && !path.includes(".test.")) result.push(path);
    return result;
  }

  for (const entry of readdirSync(path)) {
    if (["node_modules", ".next"].includes(entry)) continue;
    collectTextFiles(resolve(path, entry), result);
  }
  return result;
}

function publicTextFiles(): string[] {
  return PUBLIC_TEXT_ROOTS.flatMap((path) => collectTextFiles(path));
}

describe("temporal legal truth", () => {
  it("does not describe 2 August 2026 as a past event before that date", () => {
    if (SITE_CONTENT_DATE >= "2026-08-02") return;

    const pastTensePatterns = [
      /\bseit (?:dem )?2\. August 2026\b/giu,
      /\bbegann(?:en)?(?: jedoch)?(?: erst)? (?:am )?2\. August 2026\b/giu,
      /\bstartete(?:n)?(?: erst)? (?:am )?2\. August 2026\b/giu,
    ];
    const violations: string[] = [];

    for (const file of publicTextFiles()) {
      const text = readFileSync(file, "utf8");
      for (const pattern of pastTensePatterns) {
        if (pattern.test(text)) {
          violations.push(`${relative(ROOT, file)}: ${pattern.source}`);
        }
        pattern.lastIndex = 0;
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not claim that the AI Act applies fully on 2 August 2026", () => {
    const forbiddenClaims = [
      /gilt der EU AI Act vollständig/iu,
      /der EU AI Act gilt vollständig/iu,
      /tritt der EU AI Act vollständig in Kraft/iu,
      /vollständige EU AI Act-Anwendung/iu,
      /vollständige Anwendung des EU AI Act/iu,
      /AI Act fully applies/iu,
      /AI Act is fully applicable/iu,
    ];
    const violations: string[] = [];

    for (const file of publicTextFiles()) {
      const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
      for (const pattern of forbiddenClaims) {
        if (pattern.test(text)) {
          violations.push(`${relative(ROOT, file)}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
