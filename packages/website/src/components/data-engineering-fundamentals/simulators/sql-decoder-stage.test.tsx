import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { SqlDecoderStage } from "./sql-decoder-stage";

afterEach(cleanup);

describe("SqlDecoderStage ", () => {
  it("defaults to the hash-join preset with real SQL and 6 workers", () => {
    render(<SqlDecoderStage />);
    expect(screen.getByText(/JOIN users u ON s.user_id = u.user_id/)).toBeInTheDocument();
    expect(screen.getAllByText("AST").length).toBeGreaterThan(0);
    expect(screen.getByText("w0")).toBeInTheDocument();
    expect(screen.getByText("w5")).toBeInTheDocument();
  });

  it("switches to the broadcast preset on click, showing its own SQL", () => {
    render(<SqlDecoderStage />);
    fireEvent.click(screen.getByRole("button", { name: "Dimensional broadcast" }));
    expect(screen.getByText(/JOIN dim_country c ON s.country_id = c.id/)).toBeInTheDocument();
  });

  it("only shows the skew/salting controls for the hash preset", () => {
    render(<SqlDecoderStage />);
    expect(screen.getByRole("button", { name: "inject skew" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simple scan" }));
    expect(screen.queryByRole("button", { name: "inject skew" })).not.toBeInTheDocument();
  });

  it("toggles skew on and the salting-fix button becomes enabled", () => {
    render(<SqlDecoderStage />);
    const skewBtn = screen.getByRole("button", { name: "inject skew" });
    fireEvent.click(skewBtn);
    expect(screen.getByRole("button", { name: /skew on/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "salting fix" })).toBeEnabled();
  });
});
