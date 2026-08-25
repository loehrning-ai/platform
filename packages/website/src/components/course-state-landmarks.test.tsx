import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiNativeOperatorCourseErrorState } from "@/components/ai-native-operator/course-error-state";
import { AiNativeOperatorCourseNotFoundState } from "@/components/ai-native-operator/course-not-found-state";
import { DefCourseErrorState } from "@/components/data-engineering-fundamentals/def-course-error-state";
import { DefCourseNotFoundState } from "@/components/data-engineering-fundamentals/def-course-not-found-state";
import { DsCourseErrorState } from "@/components/data-science/ds-course-error-state";
import { DsCourseNotFoundState } from "@/components/data-science/ds-course-not-found-state";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/kurse/open-source/data-science",
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: vi.fn(),
}));

const error = new Error("test boundary");
const reset = () => undefined;

const states: ReadonlyArray<readonly [string, ReactElement]> = [
  [
    "AI-Native Operator error",
    <AiNativeOperatorCourseErrorState
      key="ai-error"
      error={error}
      reset={reset}
      kind="course"
      boundary="ai-native-operator-course"
    />,
  ],
  [
    "AI-Native Operator not found",
    <AiNativeOperatorCourseNotFoundState
      key="ai-not-found"
      locale="en"
      kind="course"
    />,
  ],
  [
    "Data Engineering error",
    <DefCourseErrorState
      key="de-error"
      error={error}
      reset={reset}
      boundary="data-engineering-chapter"
    />,
  ],
  [
    "Data Engineering not found",
    <DefCourseNotFoundState key="de-not-found" locale="en" />,
  ],
  [
    "Data Science error",
    <DsCourseErrorState
      key="ds-error"
      error={error}
      reset={reset}
      boundary="data-science-course"
    />,
  ],
  [
    "Data Science not found",
    <DsCourseNotFoundState key="ds-not-found" locale="en" />,
  ],
];

describe("course state landmarks", () => {
  it.each(states)("keeps %s inside the layout-owned main", (_name, state) => {
    const { container } = render(state);

    expect(container.querySelector("main")).toBeNull();
    expect(container.querySelector("h1")).not.toBeNull();
  });
});
