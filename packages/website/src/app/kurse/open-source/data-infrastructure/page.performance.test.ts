import { existsSync, readFileSync } from "node:fs";
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = resolve(__dirname, "../../../..");
const ROUTE_ROOT = __dirname;
const FULL_CONTENT_MODULE = resolve(
  SOURCE_ROOT,
  "lib/data-infrastructure/data.ts",
);
const LESSON_MODULE_ROOT = resolve(
  SOURCE_ROOT,
  "lib/data-infrastructure/lessons",
);

const LIGHTWEIGHT_ROUTE_ENTRIES = [
  "page.tsx",
  "kurs/page.tsx",
  "kurs/zertifikat/layout.tsx",
  "kurs/zertifikat/page.tsx",
  "verifizierung/layout.tsx",
  "verifizierung/page.tsx",
  "error.tsx",
  "not-found.tsx",
] as const;

const LESSON_ROUTE = resolve(ROUTE_ROOT, "kurs/[lessonId]/page.tsx");

function moduleSpecifiers(filePath: string): readonly string[] {
  const source = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function resolveSourceModule(
  importerPath: string,
  specifier: string,
): string | null {
  const unresolved = specifier.startsWith("@/")
    ? resolve(SOURCE_ROOT, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importerPath), specifier)
      : null;
  if (!unresolved) return null;

  const candidates = extname(unresolved)
    ? [unresolved]
    : [
        `${unresolved}.ts`,
        `${unresolved}.tsx`,
        join(unresolved, "index.ts"),
        join(unresolved, "index.tsx"),
      ];
  const sourcePath = candidates.find((candidate) => existsSync(candidate));
  if (!sourcePath) return null;

  const relativePath = relative(SOURCE_ROOT, sourcePath);
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativePath)
  ) {
    return null;
  }
  return sourcePath;
}

function collectSourceGraph(entries: readonly string[]): ReadonlySet<string> {
  const pending = [...entries];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const specifier of moduleSpecifiers(current)) {
      const dependency = resolveSourceModule(current, specifier);
      if (dependency && !visited.has(dependency)) pending.push(dependency);
    }
  }
  return visited;
}

function isLessonModule(filePath: string): boolean {
  const relativePath = relative(LESSON_MODULE_ROOT, filePath);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(
      `..${process.platform === "win32" ? "\\" : "/"}`,
    ) &&
    !isAbsolute(relativePath)
  );
}

describe("data-infrastructure landing performance", () => {
  it("does not preload the interactive lesson bundle from the static landing page", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const linkOpenings = [...source.matchAll(/<Link\b[\s\S]*?>/g)].map(
      (match) => match[0],
    );
    const lessonLinks = linkOpenings.filter((link) => {
      const normalized = link.replace(/\s+/g, " ");
      return (
        normalized.includes("href={firstLessonHref}") ||
        /technicalCourseHref\(\s*"data-infrastructure"[\s\S]*kind:\s*"lesson"/.test(
          normalized,
        )
      );
    });

    expect(lessonLinks).toHaveLength(2);
    for (const link of lessonLinks) {
      expect(link).toContain("prefetch={false}");
    }
  });

  it("keeps non-lesson runtime routes off the full locale registry and lesson modules", () => {
    const graph = collectSourceGraph(
      LIGHTWEIGHT_ROUTE_ENTRIES.map((entry) => resolve(ROUTE_ROOT, entry)),
    );
    const violations = [...graph]
      .filter(
        (filePath) =>
          filePath === FULL_CONTENT_MODULE || isLessonModule(filePath),
      )
      .map((filePath) => relative(SOURCE_ROOT, filePath))
      .sort();

    expect(violations).toEqual([]);
  });

  it("limits the lesson-detail route to the single-lesson loader", () => {
    const source = readFileSync(LESSON_ROUTE, "utf8");
    const dataImport = source.match(
      /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/data-infrastructure\/data["']/,
    );

    expect(
      dataImport?.[1]
        .split(",")
        .map((name) => name.trim())
        .sort(),
    ).toEqual(["getDataInfraLesson"]);
    expect(source).not.toMatch(
      /\b(?:getAllDataInfraLessons|getDataInfraLocaleRegistry|getDataInfraLocaleBundle)\b/,
    );
    expect(moduleSpecifiers(LESSON_ROUTE)).not.toContainEqual(
      expect.stringMatching(/data-infrastructure\/lessons(?:\/|$)/),
    );
  });
});
