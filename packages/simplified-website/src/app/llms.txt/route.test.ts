import { describe, expect, it } from "vitest";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { GET } from "./route";

describe("GET /llms.txt", () => {
  it("lists every native and imported course from the canonical catalogs", async () => {
    const response = GET({} as never);
    const body = await response.text();

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      expect(body).toContain(`https://loehrning.ai${course.href}`);
    }
  });
});
