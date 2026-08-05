import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MotionProvider } from "./motion-provider";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.hydrated;
});

describe("MotionProvider hydration contract", () => {
  it("marks the root document only after the client provider mounts", async () => {
    expect(document.documentElement).not.toHaveAttribute(
      "data-hydrated",
      "true",
    );

    const { unmount } = render(
      <MotionProvider>
        <div>hydrated content</div>
      </MotionProvider>,
    );

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute(
        "data-hydrated",
        "true",
      ),
    );

    unmount();
    expect(document.documentElement).not.toHaveAttribute(
      "data-hydrated",
      "true",
    );
  });
});
