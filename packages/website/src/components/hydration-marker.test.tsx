import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HydrationMarker } from "./hydration-marker";

afterEach(cleanup);

describe("HydrationMarker", () => {
  it("marks and cleans up only its owned leaf", async () => {
    const { container, unmount } = render(<HydrationMarker />);
    const marker = container.querySelector(
      '[data-app-hydration-marker="true"]',
    );

    await waitFor(() =>
      expect(marker).toHaveAttribute("data-hydrated", "true"),
    );
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");

    unmount();
    expect(marker).not.toHaveAttribute("data-hydrated");
  });
});
