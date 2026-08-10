import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MetricsSim } from "./metrics-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MetricsSim ", () => {
  it("defaults to the registered path with the DAU question", () => {
    render(<MetricsSim />);
    expect(screen.getAllByText("registered path").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("DAU in US last week?")).toBeInTheDocument();
  });

  it("running the registered query eventually returns the scenario answer", async () => {
    render(<MetricsSim />);
    fireEvent.click(screen.getByRole("button", { name: /Run query/ }));
    await waitFor(() => expect(screen.getByText("142.3M")).toBeInTheDocument(), { timeout: 6000 });
  }, 8000);

  it("disabling the metrics layer switches to the ad-hoc path and eventually fails", async () => {
    render(<MetricsSim />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Disable metrics layer/ }));
    expect(screen.getAllByText("ad-hoc path").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Run query/ }));
    await waitFor(() => expect(screen.getByText("Query failed")).toBeInTheDocument(), { timeout: 6000 });
  }, 8000);
});
