import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ConnectorSwitcher } from "./connector-switcher";

afterEach(cleanup);

describe("ConnectorSwitcher ", () => {
  it("defaults to the object-store scenario with fan-out worker nodes", () => {
    render(<ConnectorSwitcher />);
    expect(screen.getByText("The model fans workers out over Parquet files in object storage and uses row-group statistics where supported.")).toBeInTheDocument();
    expect(screen.getByText("S3 · Parquet")).toBeInTheDocument();
  });

  it("switches to the Redis-backed cache connector and shows local-SSD nodes", () => {
    render(<ConnectorSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Redis-backed cache/ }));
    expect(screen.getByText(/places shards on worker-local SSD/)).toBeInTheDocument();
    expect(screen.getAllByText("▾ SSD").length).toBe(4);
  });

  it("switches to the System tables connector and shows the in-memory node", () => {
    render(<ConnectorSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /System tables/ }));
    expect(screen.getByText("◆ in-memory metadata")).toBeInTheDocument();
  });
});
