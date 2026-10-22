/**
 * The browser loads one language: no "use client" module of demo 03 reaches
 * copy.ts, copy-de.ts or copy-en.ts through its imports. Only the server
 * component index.tsx picks a locale's copy and passes it down as a prop.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = __dirname;
const SRC = resolve(COMPONENTS, "../../..");
const LIB = join(SRC, "lib/demo-cases/datenbereitschaft-fuer-ki");
const BOTH_LANGUAGES = ["copy.ts", "copy-de.ts", "copy-en.ts"].map((file) => join(LIB, file));

function resolveImport(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith("@/") ? join(SRC, specifier.slice(2)) : specifier.startsWith(".") ? resolve(dirname(from), specifier) : undefined;
  if (!base) return undefined;
  return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
    (candidate) => existsSync(candidate) && !candidate.endsWith("/"),
  );
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const specifiers = [...source.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+"([^"]+)"/gms)].map((match) => match[1]);
  return specifiers
    .map((specifier) => resolveImport(file, specifier))
    .filter((path): path is string => !!path && (path.startsWith(COMPONENTS) || path.startsWith(LIB)));
}

/** Every module of this demo a client file pulls in, the file included. */
function reach(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...importsOf(file));
  }
  return seen;
}

const clientFiles = readdirSync(COMPONENTS)
  .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
  .map((file) => join(COMPONENTS, file))
  .filter((file) => /^\s*["']use client["']/.test(readFileSync(file, "utf8")));

describe("client bundle", () => {
  it("finds the client modules", () => {
    expect(clientFiles.map((file) => file.slice(COMPONENTS.length + 1)).sort()).toEqual(
      expect.arrayContaining(["demo.tsx", "receipt.tsx", "figures.tsx", "takeaways.tsx", "triage.tsx", "definition-request.tsx"]),
    );
  });

  it.each(clientFiles.map((file) => [file.slice(COMPONENTS.length + 1), file]))(
    "%s never reaches both languages' copy",
    (_name, file) => {
      const reached = [...reach(file)];
      expect(reached.filter((path) => BOTH_LANGUAGES.includes(path))).toEqual([]);
    },
  );

  it("index.tsx is a server component that picks the copy", () => {
    const index = readFileSync(join(COMPONENTS, "index.tsx"), "utf8");
    expect(index).not.toMatch(/^\s*["']use client["']/);
    expect(index).toMatch(/copy-de/);
    expect(index).toMatch(/copy-en/);
  });
});
