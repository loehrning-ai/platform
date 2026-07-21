import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { WatermarkSim } from "./watermark-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("WatermarkSim ", () => {
  it("renders the readout grid and default balanced mode", () => {
    render(<WatermarkSim />);
    expect(screen.getByText("Included")).toBeInTheDocument();
    expect(screen.getByText("Late · dropped")).toBeInTheDocument();
    expect(screen.getByText("balanced")).toBeInTheDocument();
  });

  it("moves the watermark and switches mode via the range input", () => {
    render(<WatermarkSim />);
    const [watermarkSlider] = screen.getAllByRole("slider");
    fireEvent.change(watermarkSlider, { target: { value: "900" } });
    expect(screen.getByText("exact")).toBeInTheDocument();
  });

  it("pauses and resumes the event stream", () => {
    render(<WatermarkSim />);
    const btn = screen.getByRole("button", { name: /Pause stream/ });
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /Resume/ })).toBeInTheDocument();
  });
});
