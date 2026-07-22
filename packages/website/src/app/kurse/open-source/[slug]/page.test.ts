import { describe, expect, it } from "vitest";
import { IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { generateMetadata, generateStaticParams } from "./page";

describe("imported course detail discovery metadata", () => {
  it("generates one static route for every imported course", () => {
    expect(generateStaticParams()).toEqual(
      IMPORTED_COURSE_CATALOG.map((course) => ({ slug: course.slug })),
    );
  });

  //: generateStaticParams is the single owner of this
  // exclusion mechanism, deriving purely from nativeStatus === "pending" so
  // a course plan's single-field flip is enough to drop it from this route
  // without any course plan adding its own separate filtering logic here.
  it("derives purely from nativeStatus === 'pending', excluding anything 'live'", () => {
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(course.nativeStatus).toBe("pending");
    }
    const params = generateStaticParams();
    const liveSlug = "ki-fuehrerschein"; // a real 'live' slug, never a static param here
    expect(params.map((p) => p.slug)).not.toContain(liveSlug);
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
