import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DsReaderShell } from "./reader-shell";
import { DS_CHAPTERS } from "@/lib/data-science/types";

function shell(
  activeId: Parameters<typeof DsReaderShell>[0]["activeId"],
  body: ReactNode,
) {
  return (
    <DsReaderShell activeId={activeId} locale="en" chapters={DS_CHAPTERS}>
      <div>{body}</div>
    </DsReaderShell>
  );
}

describe("DsReaderShell ", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders children inside the scoped .ds-v8-scope wrapper", () => {
    const { container } = render(shell("fund", "chapter body"));
    expect(screen.getByText("chapter body")).toBeInTheDocument();
    expect(container.querySelector(".ds-v8-scope")).not.toBeNull();
  });

  it("renders the sidebar with the active chapter marked", () => {
    render(shell("fund", "body"));
    expect(
      screen.getByRole("link", { name: /01 Fundamentals/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("navigates to the next chapter on ArrowRight and the previous on ArrowLeft", () => {
    render(shell("fund", "body"));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(push).toHaveBeenCalledWith(
      "/en/kurse/open-source/data-science/explore",
    );
    push.mockClear();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(push).toHaveBeenCalledWith("/en/kurse/open-source/data-science");
  });

  it("does not navigate past the last chapter or before the first", () => {
    render(shell("cap", "body"));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores the shortcut when a modifier key is held", () => {
    render(shell("fund", "body"));
    fireEvent.keyDown(window, { key: "ArrowRight", metaKey: true });
    expect(push).not.toHaveBeenCalled();
  });

  it("does not navigate when an arrow shortcut originates in an aria-modal dialog", () => {
    render(
      shell(
        "fund",
        <section role="dialog" aria-modal="true" aria-label="Project modal">
          Modal content
        </section>,
      ),
    );
    const modal = screen.getByRole("dialog", { name: "Project modal" });

    fireEvent.keyDown(modal, { key: "ArrowRight" });

    expect(push).not.toHaveBeenCalled();
  });
});
