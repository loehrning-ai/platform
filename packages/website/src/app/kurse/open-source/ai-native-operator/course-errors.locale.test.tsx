import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiNativeOperatorCourseErrorState } from "@/components/ai-native-operator/course-error-state";
import { AiNativeOperatorCourseNotFoundState } from "@/components/ai-native-operator/course-not-found-state";

const navigation = vi.hoisted(() => ({ pathname: vi.fn() }));
const observability = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: navigation.pathname,
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: observability.report,
}));

describe("AI-Native Operator localized recovery surfaces", () => {
  beforeEach(() => {
    navigation.pathname.mockReturnValue(
      "/kurse/open-source/ai-native-operator/mindset/1",
    );
    observability.report.mockReset();
  });

  it("renders a bounded German lesson error and reports only its boundary", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("private message"), {
      digest: "12345",
    });
    render(
      <AiNativeOperatorCourseErrorState
        error={error}
        reset={reset}
        kind="lesson"
        boundary="ai-native-operator-lesson"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Die Lektion konnte nicht geladen werden",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Zurück zum Kurs" }),
    ).toHaveAttribute("href", "/kurse/open-source/ai-native-operator");
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(observability.report).toHaveBeenCalledWith(
      "ai-native-operator-lesson",
      error,
    );
  });

  it("renders an English course error with locale-preserving recovery links", () => {
    navigation.pathname.mockReturnValue(
      "/en/kurse/open-source/ai-native-operator",
    );
    render(
      <AiNativeOperatorCourseErrorState
        error={new Error("test")}
        reset={() => undefined}
        kind="course"
        boundary="ai-native-operator-course"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "The course could not be loaded" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to courses" }),
    ).toHaveAttribute("href", "/en/kurse");
  });

  it.each([
    [
      "de",
      "lesson",
      "Lektion nicht gefunden",
      "/kurse/open-source/ai-native-operator",
    ],
    [
      "en",
      "module",
      "Module not found",
      "/en/kurse/open-source/ai-native-operator",
    ],
  ] as const)(
    "renders the %s %s not-found state without losing locale",
    (locale, kind, title, href) => {
      render(
        <AiNativeOperatorCourseNotFoundState locale={locale} kind={kind} />,
      );
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
      expect(screen.getByRole("link")).toHaveAttribute("href", href);
    },
  );
});
