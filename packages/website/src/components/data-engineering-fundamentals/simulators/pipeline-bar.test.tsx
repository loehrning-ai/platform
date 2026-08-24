import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { PipelineBar, StageIcon, OV_STAGES } from "./pipeline-bar";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("PipelineBar ", () => {
  it("renders all 10 stage stops with real titles", () => {
    render(
      <PipelineBar activeId="ingest" setActiveId={() => {}} locale="en" />,
    );
    expect(screen.getByText("Ingest")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(OV_STAGES).toHaveLength(10);
  });

  it("renders each chapter stop as a real link", () => {
    render(
      <PipelineBar activeId="ingest" setActiveId={() => {}} locale="en" />,
    );
    expect(
      screen.getByRole("link", { name: /Chapter 03 · Store/ }),
    ).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-engineering-fundamentals/store",
    );
  });

  it("marks the active stage with aria-current", () => {
    render(<PipelineBar activeId="orch" setActiveId={() => {}} locale="en" />);
    expect(
      screen.getByRole("link", { name: /Chapter 05 · Orchestrate/ }),
    ).toHaveAttribute("aria-current", "step");
  });

  it("does not animate while hidden and starts only after an explicit play", () => {
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(() => 1);
    const interval = vi.spyOn(window, "setInterval");

    render(
      <PipelineBar activeId="ingest" setActiveId={() => {}} locale="en" />,
    );

    expect(raf).not.toHaveBeenCalled();
    expect(interval).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Play flow" }));

    expect(raf).toHaveBeenCalledTimes(1);
    expect(interval).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Pause flow" }),
    ).toBeEnabled();
  });
});

describe("StageIcon ", () => {
  it("renders a real svg for a known kind and nothing for an unknown kind", () => {
    const { container: known } = render(
      <StageIcon kind="ingest" color="#000" />,
    );
    expect(known.querySelector("svg")).toBeInTheDocument();
    const { container: unknown } = render(
      <StageIcon kind="nope" color="#000" />,
    );
    expect(unknown.querySelector("svg")).not.toBeInTheDocument();
  });
});
