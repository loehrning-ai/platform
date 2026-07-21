import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ConnectorSwitcher } from "./connector-switcher";

afterEach(cleanup);

describe("ConnectorSwitcher (plan 011 stage 4)", () => {
  it("defaults to the Snowflake connector with fan-out worker nodes", () => {
    render(<ConnectorSwitcher />);
    expect(screen.getByText("Workers fan out to read Parquet files from S3. Predicate pushdown via stripe stats. The big-data default.")).toBeInTheDocument();
    expect(screen.getByText("S3 · Parquet")).toBeInTheDocument();
  });

  it("switches to the Redis-backed cache connector and shows local-SSD nodes", () => {
    render(<ConnectorSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Redis-backed cache/ }));
    expect(screen.getByText(/Data lives on the Trino worker nodes themselves/)).toBeInTheDocument();
    expect(screen.getAllByText("▾ SSD").length).toBe(4);
  });

  it("switches to the System tables connector and shows the in-memory node", () => {
    render(<ConnectorSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /System tables/ }));
    expect(screen.getByText("◆ in-memory metadata")).toBeInTheDocument();
  });
});
