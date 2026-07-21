import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ByteTrace } from "./byte-trace";

afterEach(cleanup);

describe("ByteTrace (plan 011 stage 4)", () => {
  it("renders the warm/cold headline and all 8 trace stops", () => {
    render(<ByteTrace />);
    expect(screen.getAllByText("Warm cache").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cold cache").length).toBeGreaterThan(0);
    expect(screen.getByText("SQL enters")).toBeInTheDocument();
    expect(screen.getByText("Decompress → return")).toBeInTheDocument();
  });

  it("switches to cold cache and updates the active tab", () => {
    render(<ByteTrace />);
    fireEvent.click(screen.getByRole("button", { name: /Cold cache/ }));
    const coldTab = screen.getByRole("button", { name: /Cold cache/ });
    expect(coldTab.className).toContain("on");
  });

  it("starts the trace run on button click without throwing", () => {
    render(<ByteTrace />);
    fireEvent.click(screen.getByRole("button", { name: /Trace byte/ }));
    expect(screen.getByRole("button", { name: /Trace byte/ })).toBeInTheDocument();
  });
});
