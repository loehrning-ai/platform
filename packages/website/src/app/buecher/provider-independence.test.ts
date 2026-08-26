import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTE_FILES = ["page.tsx", "[slug]/page.tsx"] as const;

describe("public book route provider-independence", () => {
  it.each(ROUTE_FILES)(
    "keeps %s free of per-render authentication calls",
    (relativePath) => {
      const source = readFileSync(
        join(process.cwd(), "src/app/buecher", relativePath),
        "utf8",
      );

      expect(source).not.toMatch(
        /getAuthenticatedUser|auth-server|cookies\s*\(/,
      );
    },
  );

  it("defers PDF authorization to the login and protected-download flow", () => {
    const overview = readFileSync(
      join(process.cwd(), "src/app/buecher/[slug]/page.tsx"),
      "utf8",
    );
    const library = readFileSync(
      join(process.cwd(), "src/app/buecher/buecher-content.tsx"),
      "utf8",
    );

    for (const source of [overview, library]) {
      expect(source).toContain(
        '`${localizeHref("/login", locale)}?next=${encodeURIComponent(book.pdfPath)}`',
      );
      expect(source).toContain("localizeHref(");
    }
  });
});
