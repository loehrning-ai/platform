import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DAGDiagram } from "./dag-diagram";

afterEach(cleanup);

describe("DAGDiagram (plan 011 stage 6)", () => {
  it("renders all 6 nodes with the real dataset names", () => {
    render(<DAGDiagram />);
    for (const name of ["raw_events", "clean_events", "deduped_sessions", "daily_rollup", "exec_dashboard", "ml_features"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("labels each node with its kind (source/etl/sink)", () => {
    render(<DAGDiagram />);
    expect(screen.getByText("source")).toBeInTheDocument();
    expect(screen.getAllByText("etl")).toHaveLength(3);
    expect(screen.getAllByText("sink")).toHaveLength(2);
  });
});
