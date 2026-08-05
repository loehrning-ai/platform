import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiNativeHero } from "./hero";

afterEach(() => {
  vi.useRealTimers();
});

describe("<AiNativeHero>", () => {
  it("top-aligns the growing mobile terminal without changing desktop alignment", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<AiNativeHero />);
    const section = container.querySelector("section");
    const classes = section?.className.split(/\s+/) ?? [];

    expect(classes).toContain("items-start");
    expect(classes).toContain("lg:items-center");
    expect(classes).not.toContain("items-center");
    unmount();
  });

  it("renders the LCP introduction eagerly instead of behind a motion reveal", () => {
    vi.useFakeTimers();
    const { unmount } = render(<AiNativeHero />);
    const introduction = screen.getByText(/AI-native arbeiten heißt:/);
    const copyColumn = introduction.parentElement;

    expect(copyColumn?.querySelector("h1")).not.toBeNull();
    expect(introduction).toBeVisible();
    unmount();
  });
});
