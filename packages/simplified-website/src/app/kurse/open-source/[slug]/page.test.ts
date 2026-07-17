import { describe, expect, it } from "vitest";
import { IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { generateMetadata, generateStaticParams } from "./page";

describe("imported course detail discovery metadata", () => {
  it("generates one static route for every imported course", () => {
    expect(generateStaticParams()).toEqual(
      IMPORTED_COURSE_CATALOG.map((course) => ({ slug: course.slug })),
    );
  });

  it("marks every substantial detail page indexable with its local canonical", async () => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: course.slug }),
      });
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.alternates?.canonical).toBe(course.href);
      expect(metadata.openGraph?.url).toBe(`https://loehrning.ai${course.href}`);
    }
  });
});
