import { afterEach, describe, expect, it, vi } from "vitest";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { isGatedCoursePath } from "@/lib/auth/routes";

const runtime = vi.hoisted(() => ({ account: false }));
vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => ({ account: runtime.account }),
}));

import { getCourseAccess } from "./access";

afterEach(() => {
  runtime.account = false;
});

describe("public course access facts", () => {
  it.each([false, true])("projects the canonical gates with account readiness %s", (ready) => {
    const access = getCourseAccess(ready);
    expect(Object.keys(access)).toEqual(COURSE_CATALOG.map((course) => course.slug));
    for (const course of COURSE_CATALOG) {
      expect(access[course.slug]).toBe(
        isGatedCoursePath(course.startHref)
          ? ready ? "account-required" : "unavailable"
          : "open",
      );
    }
    expect(Object.values(access).filter((value) => value === "open")).toHaveLength(6);
  });

  it("reads the existing server readiness predicate by default, not an identity", () => {
    expect(getCourseAccess()["ki-fuehrerschein"]).toBe("unavailable");
    runtime.account = true;
    expect(getCourseAccess()["ki-fuehrerschein"]).toBe("account-required");
  });

  it("serializes only course slugs and access enums", () => {
    const access = getCourseAccess();
    expect(JSON.parse(JSON.stringify(access))).toEqual(access);
    expect(Object.values(access).every((value) => ["open", "account-required", "unavailable"].includes(value))).toBe(true);
  });
});
