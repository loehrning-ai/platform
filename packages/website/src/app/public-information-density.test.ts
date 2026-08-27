import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES = [
  "hilfe",
  "neuigkeiten",
  "einstieg",
] as const;

function routeSource(route: (typeof ROUTES)[number]): string {
  return readFileSync(join(__dirname, route, "page.tsx"), "utf8");
}

describe("public information route density", () => {
  it.each(ROUTES)("keeps /%s inside the compact editorial frame", (route) => {
    const source = routeSource(route);

    expect(source).toMatch(/pb-12 pt-(?:6|8)/);
    expect(source).toMatch(/sm:pt-(?:8|12)/);
    expect(source).not.toMatch(/\b(?:pb-28|pt-16|sm:pt-20)\b/);
  });

  it.each(ROUTES)("keeps /%s labels at 12px or larger", (route) => {
    expect(routeSource(route)).not.toMatch(/\btext-\[(?:9|10|10\.5|11)px\]\b/);
  });

  it.each(ROUTES)("keeps /%s surfaces flat and motion restrained", (route) => {
    expect(routeSource(route)).not.toMatch(
      /(?:shadow-(?:card|card-hover|tile)|shadow-\[|hover:-translate|transition-all|rounded-(?:xl|2xl|3xl|full))/,
    );
  });

  it("keeps secondary help and entry references disclosure-based", () => {
    expect(routeSource("hilfe")).toContain("<details");
    expect(routeSource("einstieg")).toContain("<details");
  });
});
