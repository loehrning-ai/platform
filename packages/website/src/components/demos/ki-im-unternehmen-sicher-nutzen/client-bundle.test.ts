import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { textFor } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen";

/*
 * The client island must not carry the copy of both languages: every module
 * the island reaches imports only core.ts, motion.ts and types. Copy reaches
 * it as a prop (textFor), one language per page.
 */

const SRC = resolve(__dirname, "../../..");
const LIB = "lib/demo-cases/ki-im-unternehmen-sicher-nutzen";
const ISLAND = "components/demos/ki-im-unternehmen-sicher-nutzen/paste-light-demo.tsx";
/** Lib modules that hold copy or case data in both languages. */
const BILINGUAL = ["index", "copy", "scenes", "facts", "logic", "pack", "localize"].map((name) => `${LIB}/${name}`);

function resolveLocal(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : specifier.startsWith(".")
      ? join(dirname(from), specifier)
      : null;
  if (!base) return null;
  if (base === LIB) return `${LIB}/index`;
  return base.replace(/\.(tsx?|css)$/, "");
}

function fileOf(module: string): string | null {
  for (const extension of [".tsx", ".ts"]) {
    try {
      readFileSync(join(SRC, module + extension));
      return module + extension;
    } catch {
      // try the next extension
    }
  }
  return null;
}

/** Value imports only: `import type` is erased and never reaches the bundle. */
function valueImports(file: string): string[] {
  const source = readFileSync(join(SRC, file), "utf8");
  const statements = source.match(/^import\s[\s\S]*?from\s+"[^"]+";|^import\s+"[^"]+";/gm) ?? [];
  return statements
    .filter((statement) => !/^import\s+type\s/.test(statement))
    .map((statement) => /"([^"]+)"/.exec(statement)?.[1] ?? "")
    .filter(Boolean);
}

function islandGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const queue = [ISLAND];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (graph.has(file)) continue;
    const targets = valueImports(file)
      .map((specifier) => resolveLocal(file, specifier))
      .filter((module): module is string => module !== null && module.includes("ki-im-unternehmen-sicher-nutzen"));
    graph.set(file, targets);
    for (const target of targets) {
      const next = fileOf(target);
      if (next && !BILINGUAL.includes(target)) queue.push(next);
    }
  }
  return graph;
}

describe("client bundle", () => {
  it("reaches no bilingual copy module from the island", () => {
    const graph = islandGraph();
    expect(graph.size).toBeGreaterThan(5);
    for (const [file, targets] of graph) {
      for (const target of targets) expect(BILINGUAL, `${file} imports ${target}`).not.toContain(target);
    }
  });

  it("hands the island one language, as plain data", () => {
    const de = textFor("de");
    const en = textFor("en");
    expect(JSON.parse(JSON.stringify(de))).toEqual(de);
    expect(JSON.parse(JSON.stringify(en))).toEqual(en);
    const deJson = JSON.stringify({ ...de, mailEn: null });
    const enJson = JSON.stringify(en);
    for (const english of ["Start over", "Consumer Terms", "Customer data on a personal account.", "Back to Friday"]) {
      expect(deJson).not.toContain(english);
      expect(enJson).toContain(english);
    }
    for (const german of ["Von vorn", "Verbraucherbedingungen", "Kundendaten auf einem privaten Konto.", "Zurück zu Freitag"]) {
      expect(enJson).not.toContain(german);
      expect(deJson).toContain(german);
    }
    expect(en.mailEn).toBeNull();
    expect(de.mailEn?.template).toContain("Subject: Three questions");
  });
});
