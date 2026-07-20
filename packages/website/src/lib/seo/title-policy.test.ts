import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const APP_DIR = resolve(process.cwd(), "src/app");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return entry === "page.tsx" || entry === "layout.tsx" ? [path] : [];
  });
}

function propertyName(node: ts.PropertyName): string | undefined {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : undefined;
}

function titleInitializer(object: ts.ObjectLiteralExpression): ts.Expression | undefined {
  const title = object.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) && propertyName(property.name) === "title",
  );
  return title?.initializer;
}

function isTitleTemplateOrAbsolute(initializer: ts.Expression): boolean {
  if (!ts.isObjectLiteralExpression(initializer)) return false;
  return initializer.properties.some(
    (property) =>
      ts.isPropertyAssignment(property) &&
      ["template", "absolute"].includes(propertyName(property.name) ?? ""),
  );
}

function metadataTitleInitializers(sourceFile: ts.SourceFile): ts.Expression[] {
  const initializers: ts.Expression[] = [];

  for (const node of sourceFile.statements) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "metadata" &&
          declaration.initializer &&
          ts.isObjectLiteralExpression(declaration.initializer)
        ) {
          const title = titleInitializer(declaration.initializer);
          if (title) initializers.push(title);
        }
      }
    }

    if (ts.isFunctionDeclaration(node) && node.name?.text === "generateMetadata") {
      const visit = (child: ts.Node) => {
        if (
          ts.isReturnStatement(child) &&
          child.expression &&
          ts.isObjectLiteralExpression(child.expression)
        ) {
          const title = titleInitializer(child.expression);
          if (title) initializers.push(title);
        }
        ts.forEachChild(child, visit);
      };
      if (node.body) visit(node.body);
    }
  }

  return initializers;
}

describe("metadata title policy", () => {
  it("lets title templates add the loehrning.ai suffix exactly once", () => {
    const violations: string[] = [];

    for (const file of routeFiles(APP_DIR)) {
      const source = readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      for (const initializer of metadataTitleInitializers(sourceFile)) {
        if (isTitleTemplateOrAbsolute(initializer)) continue;
        if (initializer.getText(sourceFile).includes("loehrning.ai")) {
          violations.push(file.replace(`${process.cwd()}/`, ""));
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
