import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { getMachineCourse } from "@/lib/machine-surfaces";

describe("GET /api/courses.json", () => {
  it("serves the public course catalog with open CORS and an hour of cache", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=3600",
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const body = await response.json();
    expect(body.schema).toBe("https://loehrning.ai/schema/courses/v1");
    expect(body.last_updated).toBe(SITE_CONTENT_DATE);
    expect(body.count).toBe(COURSE_CATALOG.length);
    expect(body.page_url).toBe("https://loehrning.ai/api/courses.json");
    expect(body.catalog_url).toBe("https://loehrning.ai/kurse");
    expect(body.locales).toEqual(["de", "en"]);
  });

  it("returns every catalog course in both locales, straight from the builder", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.courses.map((course: { slug: string }) => course.slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );

    for (const course of body.courses) {
      expect(course.localized.de).toEqual(
        JSON.parse(JSON.stringify(getMachineCourse(course.slug, "de"))),
      );
      expect(course.localized.en).toEqual(
        JSON.parse(JSON.stringify(getMachineCourse(course.slug, "en"))),
      );
      expect(course.localized.de.url).toMatch(/^https:\/\/loehrning\.ai\//);
      expect(course.localized.en.url).toMatch(/^https:\/\/loehrning\.ai\/en\//);
      expect(typeof course.localized.de.requires_login).toBe("boolean");
    }
  });

  it("keeps typographic dashes out of the served payload", async () => {
    const response = await GET();
    expect(await response.text()).not.toMatch(/[\u2014\u2013]/);
  });
});
