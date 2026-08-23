import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCourseProjectConfig } from "@/lib/course-projects/configs";

import { EngineFrame, VerifyPanel } from "./engine-ui";

describe("engine accessibility tokens", () => {
  it("uses a light readable eyebrow on the dark engine header", () => {
    render(
      <EngineFrame
        config={getCourseProjectConfig("codex")}
        locale="en"
        engineLabel="Repository lab"
      >
        body
      </EngineFrame>,
    );
    expect(screen.getByText(/Repository lab ·/)).toHaveClass("text-[#ffc6aa]");
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
