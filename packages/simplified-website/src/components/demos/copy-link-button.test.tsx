import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

/**
 * copy-link-button.test.tsx (regression coverage)
 *
 * Drives the real <CopyLinkButton>. We assert its own logic: the share URL it
 * builds from window.location.origin + the slug, the success flip to "Kopiert"
 * plus the tracked CTA, the 1800ms reset back to the idle label, and the
 * window.prompt fallback when the clipboard write is rejected.
 *
 * lucide-react is stubbed to avoid SVG rendering; @/lib/analytics is mocked so
 * we can assert the CTA is (or is not) tracked without a live analytics
 * provider. navigator.clipboard is defined per test.
 */

vi.mock("lucide-react", () => ({
  Copy: () => null,
  Check: () => null,
}));

vi.mock("@/lib/analytics", () => ({
  trackDemoCta: vi.fn(),
}));

import { CopyLinkButton } from "./copy-link-button";
import { trackDemoCta } from "@/lib/analytics";

const writeText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

describe("<CopyLinkButton>", () => {
  it("renders the idle copy label with an accessible name", () => {
    render(<CopyLinkButton slug="excel" />);
    const btn = screen.getByRole("button", {
      name: "Link zu diesem Praxisbeispiel kopieren",
    });
    expect(btn).toHaveTextContent("Link kopieren");
  });

  it("writes the share URL, flips to Kopiert, and tracks the CTA on success", async () => {
    vi.useFakeTimers();
    try {
      writeText.mockResolvedValue(undefined);
      render(<CopyLinkButton slug="rag-vertragsassistent" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        await Promise.resolve();
      });

      expect(screen.getByRole("button")).toHaveTextContent("Kopiert");
      const expectedUrl = `${window.location.origin}/demos/rag-vertragsassistent?source=share`;
      expect(writeText).toHaveBeenCalledWith(expectedUrl);
      expect(vi.mocked(trackDemoCta)).toHaveBeenCalledWith(
        "rag-vertragsassistent",
        "copy-link",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets back to the idle label after the 1800ms timeout", async () => {
    vi.useFakeTimers();
    try {
      writeText.mockResolvedValue(undefined);
      render(<CopyLinkButton slug="word" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        await Promise.resolve();
      });
      expect(screen.getByRole("button")).toHaveTextContent("Kopiert");

      act(() => {
        vi.advanceTimersByTime(1800);
      });
      expect(screen.getByRole("button")).toHaveTextContent("Link kopieren");
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to window.prompt and does not track when the clipboard write fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);
    try {
      render(<CopyLinkButton slug="excel" />);

      fireEvent.click(screen.getByRole("button"));

      const expectedUrl = `${window.location.origin}/demos/excel?source=share`;
      await waitFor(() =>
        expect(promptSpy).toHaveBeenCalledWith("Link kopieren:", expectedUrl),
      );
      expect(vi.mocked(trackDemoCta)).not.toHaveBeenCalled();
      // The copied state is never entered on the failure path.
      expect(screen.getByRole("button")).toHaveTextContent("Link kopieren");
    } finally {
      promptSpy.mockRestore();
    }
  });
});
