import "server-only";

import { isGatedCoursePath } from "@/lib/auth/routes";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { getRuntimeFeatures } from "@/lib/runtime-features";

export type CourseAccess = "open" | "account-required" | "unavailable";
export type CourseAccessBySlug = Readonly<Record<string, CourseAccess>>;

/**
 * Public access facts, never the visitor's identity. Only these small enum
 * values cross the server/client boundary; provider config and auth cookies
 * stay out of public discovery markup and its client dependency graph.
 */
export function getCourseAccess(
  accountAvailable = getRuntimeFeatures().account,
): CourseAccessBySlug {
  return Object.fromEntries(
    COURSE_CATALOG.map((course) => [
      course.slug,
      isGatedCoursePath(course.startHref)
        ? accountAvailable
          ? "account-required"
          : "unavailable"
        : "open",
    ]),
  );
}
