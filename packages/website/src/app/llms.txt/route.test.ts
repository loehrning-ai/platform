import { describe, expect, it } from "vitest";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseFacts } from "@/lib/courses/tracks";
import { GET } from "./route";

describe("GET /llms.txt", () => {
  it("lists every native and imported course from the canonical catalogs", async () => {
    const response = GET({} as never);
    const body = await response.text();

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      expect(body).toContain(`https://loehrning.ai${course.href}`);
    }
  });

  it("separates the ordered foundation path from technical courses without stale language claims", async () => {
    const response = GET({} as never);
    const body = await response.text();

    expect(body).toContain("## Grundlagenpfad");
    expect(body).toContain("## Technische Kurse");
    expect(body).toContain("## Sprachmodell / Language model");
    expect(body).not.toContain("## Englische technische Vertiefung");
    expect(
      COURSE_CATALOG.filter(
        (course) => courseFacts(course.slug).group === "spine",
      ),
    ).toHaveLength(4);
    expect(
      COURSE_CATALOG.filter(
        (course) => courseFacts(course.slug).group === "deeper",
      ),
    ).toHaveLength(6);
    expect(body).not.toContain("## Technische Labore");
  });
});
