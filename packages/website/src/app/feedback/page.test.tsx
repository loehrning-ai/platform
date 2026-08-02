import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ feedback: false }));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => ({ feedback: runtime.feedback }),
}));

import FeedbackPage from "./page";

describe("FeedbackPage provider boundary", () => {
  beforeEach(() => {
    runtime.feedback = false;
  });

  it("fails closed to a mailto fallback when storage is not configured", () => {
    render(<FeedbackPage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Es werden keine Formulardaten gespeichert.",
    );
    expect(screen.queryByRole("textbox", { name: /Nachricht/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rückmeldung senden/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tim@loehrning\.ai/i })).toHaveAttribute(
      "href",
      "mailto:tim@loehrning.ai",
    );
  });

  it("mounts the real form only when the server feature boundary is ready", () => {
    runtime.feedback = true;
    render(<FeedbackPage />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Art der Rückmeldung/i })).toBeVisible();
    expect(screen.getByRole("textbox", { name: /Nachricht/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Rückmeldung senden/i })).toBeEnabled();
  });
});
