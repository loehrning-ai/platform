import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Bundle hygiene: the browser gets one locale's words. Every client module of
 * this demo is walked through its value imports (type-only imports vanish
 * at build time); none may reach a module that carries both locales. Only the
 * server entry index.tsx builds the locale pack from them.
 */

const SRC = resolve(process.cwd(), "src");
const HERE = join(SRC, "components/demos/esg-berichte-mit-ki");
const LIB = join(SRC, "lib/demo-cases/esg-berichte-mit-ki");

const BILINGUAL = [
  "copy.ts",
  "facts.ts",
  "rows.ts",
  "takeaways.ts",
  "logic.ts",
  "kit-files.ts",
  "pack.ts",
].map((name) => join(LIB, name));

/** Value imports of a module: `import type` and inline `type` specifiers only are dropped. */
function valueImports(source: string): string[] {
  const out: string[] = [];
  const pattern = /^\s*(import|export)\s+(type\s+)?([^;]*?)\s*from\s*["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm;
  for (const match of source.matchAll(pattern)) {
    if (match[5]) {
      out.push(match[5]);
      continue;
    }
    if (match[2]) continue;
    const clause = match[3] ?? "";
    const named = clause.match(/\{([^}]*)\}/);
    const hasDefault = /^[\w$]+\s*(,|$)/.test(clause.trim()) || clause.includes("*");
    const allTypes =
      named !== null &&
      !hasDefault &&
      (named[1] ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .every((part) => part.startsWith("type "));
    if (!allTypes) out.push(match[4] as string);
  }
  return out;
}

function resolveImport(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = resolve(dirname(from), specifier);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && !candidate.endsWith(".css") && /\.(ts|tsx)$/.test(candidate)) return candidate;
  }
  return null;
}

function reachable(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of valueImports(readFileSync(file, "utf8"))) {
      const target = resolveImport(file, specifier);
      if (target) queue.push(target);
    }
  }
  return seen;
}

const clientModules = readdirSync(HERE)
  .filter((name) => /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== "index.tsx")
  .map((name) => join(HERE, name));

describe("W04 demo bundle hygiene", () => {
  it("reads type-only imports as type-only", () => {
    expect(valueImports('import type { A } from "./a";\nimport { type B, type C } from "./b";')).toEqual([]);
    expect(valueImports('import { type B, c } from "./b";\nimport D from "./d";\nimport "./e.css";')).toEqual([
      "./b",
      "./d",
      "./e.css",
    ]);
  });

  it("keeps every client module away from the modules that carry both locales", () => {
    expect(clientModules.length).toBeGreaterThan(10);
    for (const file of clientModules) {
      const hits = [...reachable(file)].filter((target) => BILINGUAL.includes(target));
      expect(hits.map((hit) => relative(SRC, hit)), relative(SRC, file)).toEqual([]);
    }
  });

  it("builds the locale pack only in the server entry, which is no client module", () => {
    const index = readFileSync(join(HERE, "index.tsx"), "utf8");
    expect(index).not.toMatch(/^\s*["']use client["']/m);
    expect(valueImports(index)).toContain("@/lib/demo-cases/esg-berichte-mit-ki/pack");
    expect(readFileSync(join(LIB, "pack.ts"), "utf8")).toMatch(/^import "server-only";/m);
  });
});
