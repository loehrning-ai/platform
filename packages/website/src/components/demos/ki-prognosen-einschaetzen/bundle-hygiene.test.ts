import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Each locale is its own import chain: only the locale entries import a
 * locale's copy, and no component imports the two-locale map in copy.ts, so
 * a registry that mounts index-de or index-en ships one language. Type-only
 * imports are erased and allowed.
 */
const COMPONENTS = path.resolve(__dirname);
const LIB = path.resolve(__dirname, "../../../lib/demo-cases/ki-prognosen-einschaetzen");

const isSource = (name: string) => /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name);

function valueImports(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const imports = [...text.matchAll(/^import\s+(?!type\s)[^;]*?from\s+"([^"]+)";/gms)].map((match) => match[1] ?? "");
  return imports.map((spec) => spec.replace(/^@\/lib\/demo-cases\/ki-prognosen-einschaetzen\//, "./"));
}

const copyModule = (spec: string) => /^\.\/(copy|copy-de|copy-en)$/.exec(spec)?.[1] ?? null;

describe("Demo 01 bundle hygiene", () => {
  it("lets only the locale entries import a locale's copy, and nothing the two-locale map", () => {
    const allowed: Readonly<Record<string, readonly string[]>> = {
      "index-de.tsx": ["copy-de"],
      "index-en.tsx": ["copy-en"],
      "forecast-release-de.tsx": ["copy-de"],
      "forecast-release-en.tsx": ["copy-en"],
    };
    for (const name of readdirSync(COMPONENTS).filter(isSource)) {
      const used = valueImports(path.join(COMPONENTS, name)).map(copyModule).filter(Boolean);
      expect({ name, used }).toEqual({ name, used: allowed[name] ?? [] });
    }
  });

  it("keeps the lib modules the client uses free of copy values", () => {
    for (const name of readdirSync(LIB).filter(isSource)) {
      if (["copy.ts", "copy-de.ts", "copy-en.ts"].includes(name)) continue;
      const used = valueImports(path.join(LIB, name)).map(copyModule).filter(Boolean);
      expect({ name, used }).toEqual({ name, used: [] });
    }
  });

  it("marks both locale entries as client modules", () => {
    for (const name of ["forecast-release-de.tsx", "forecast-release-en.tsx"]) {
      expect(readFileSync(path.join(COMPONENTS, name), "utf8").startsWith('"use client";')).toBe(true);
    }
  });
});
