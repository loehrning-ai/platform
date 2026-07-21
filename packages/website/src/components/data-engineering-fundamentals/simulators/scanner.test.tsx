import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Scanner } from "./scanner";

afterEach(cleanup);

describe("Scanner (plan 011 stage 4)", () => {
  it("defaults to row-oriented mode with the Snappy checkbox disabled", () => {
    render(<Scanner />);
    expect(screen.getByRole("button", { name: /Row-oriented/ }).className).toContain("on");
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("switches to columnar mode and enables the Snappy checkbox", () => {
    render(<Scanner />);
    fireEvent.click(screen.getByRole("button", { name: /Columnar/ }));
    expect(screen.getByRole("button", { name: /Columnar/ }).className).toContain("on");
    expect(screen.getByRole("checkbox")).toBeEnabled();
  });

  it("starts a scan run without throwing and shows Reset/Run controls", () => {
    render(<Scanner />);
    fireEvent.click(screen.getByRole("button", { name: /Run scan/ }));
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});
