import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MotionProvider } from "./motion-provider";

afterEach(cleanup);

describe("MotionProvider hydration contract", () => {
  it("provides motion features without owning a readiness marker", () => {
    const { container } = render(
      <MotionProvider>
        <div>hydrated content</div>
      </MotionProvider>,
    );

    expect(screen.getByText("hydrated content")).toBeVisible();
    expect(
      container.querySelector('[data-app-hydration-marker="true"]'),
    ).toBeNull();
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");
  });
});
