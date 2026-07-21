import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PipelineBar, StageIcon, OV_STAGES } from "./pipeline-bar";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PipelineBar (plan 011 stage 8)", () => {
  it("renders all 10 stage stops with real titles", () => {
    render(<PipelineBar goTo={() => {}} activeId="ingest" setActiveId={() => {}} />);
    expect(screen.getByText("Ingest")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(OV_STAGES).toHaveLength(10);
  });

  it("calls goTo with the stage's chapter id when a stop is clicked", () => {
    const goTo = vi.fn();
    render(<PipelineBar goTo={goTo} activeId="ingest" setActiveId={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Chapter 03 · Store/ }));
    expect(goTo).toHaveBeenCalledWith("store");
  });

  it("marks the active stage with aria-current", () => {
    render(<PipelineBar goTo={() => {}} activeId="orch" setActiveId={() => {}} />);
    expect(screen.getByRole("button", { name: /Chapter 05 · Orchestrate/ })).toHaveAttribute("aria-current", "step");
  });
});

describe("StageIcon (plan 011 stage 8)", () => {
  it("renders a real svg for a known kind and nothing for an unknown kind", () => {
    const { container: known } = render(<StageIcon kind="ingest" color="#000" />);
    expect(known.querySelector("svg")).toBeInTheDocument();
    const { container: unknown } = render(<StageIcon kind="nope" color="#000" />);
    expect(unknown.querySelector("svg")).not.toBeInTheDocument();
  });
});
