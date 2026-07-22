import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DsReaderShell } from "./reader-shell";

describe("DsReaderShell ", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders children inside the scoped .ds-v8-scope wrapper", () => {
    const { container } = render(
      <DsReaderShell activeId="fund">
        <div>chapter body</div>
      </DsReaderShell>,
    );
    expect(screen.getByText("chapter body")).toBeInTheDocument();
    expect(container.querySelector(".ds-v8-scope")).not.toBeNull();
  });

  it("renders the sidebar with the active chapter marked", () => {
    render(
      <DsReaderShell activeId="fund">
        <div>body</div>
      </DsReaderShell>,
    );
    expect(screen.getByText("Fundamentals").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("navigates to the next chapter on ArrowRight and the previous on ArrowLeft", () => {
    render(
      <DsReaderShell activeId="fund">
        <div>body</div>
      </DsReaderShell>,
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(push).toHaveBeenCalledWith("/kurse/open-source/data-science/explore");
    push.mockClear();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(push).toHaveBeenCalledWith("/kurse/open-source/data-science");
  });

  it("does not navigate past the last chapter or before the first", () => {
    render(
      <DsReaderShell activeId="cap">
        <div>body</div>
      </DsReaderShell>,
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores the shortcut when a modifier key is held", () => {
    render(
      <DsReaderShell activeId="fund">
        <div>body</div>
      </DsReaderShell>,
    );
    fireEvent.keyDown(window, { key: "ArrowRight", metaKey: true });
    expect(push).not.toHaveBeenCalled();
  });
});
