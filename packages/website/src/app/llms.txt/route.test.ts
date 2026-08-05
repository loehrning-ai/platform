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

  it("separates the German spine from the native English technical courses", async () => {
    const response = GET({} as never);
    const body = await response.text();

    expect(body).toContain("## Deutscher Lernpfad");
    expect(body).toContain("## Englische technische Vertiefung");
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
