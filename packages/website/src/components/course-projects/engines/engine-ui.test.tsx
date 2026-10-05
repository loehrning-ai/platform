import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCourseProjectConfig } from "@/lib/course-projects/configs";

import { EngineFrame, VerifyPanel } from "./engine-ui";

describe("engine accessibility tokens", () => {
  it("sets the engine heading in ink on a light pastel header, never a black bar", () => {
    render(
      <EngineFrame
        config={getCourseProjectConfig("data-infrastructure")}
        locale="en"
      >
        body
      </EngineFrame>,
    );
    const header = screen
      .getByRole("heading", { name: "Streaming Control Room" })
      .closest("header");
    expect(header).toHaveClass("bg-sky-sheet", "text-foreground");
    expect(header?.className).not.toMatch(/\bbg-(?:foreground|black|graphit|dark-bg)\b/);
  });

  it("uses an explicit high-contrast neutral for the pending badge", () => {
    render(
      <VerifyPanel
        locale="en"
        ready={false}
        verified={false}
        criteria={<li>criterion</li>}
        onVerify={vi.fn()}
        statusDetail="pending"
      />,
    );
    expect(screen.getByText("Not ready yet")).toHaveClass(
      "bg-[#e6e0d6]",
      "text-[#3f3932]",
    );
  });
});
