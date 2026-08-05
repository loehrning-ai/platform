import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { LayerCake } from "./layer-cake";

afterEach(cleanup);

describe("LayerCake ", () => {
  it("renders all 7 stack layers and an empty-state detail panel", () => {
    render(<LayerCake />);
    for (const name of [
      "Application",
      "Query engine",
      "Catalog / Metastore",
      "Table abstraction",
      "File format",
      "Blob layer",
      "Physical storage",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText("Hover any layer")).toBeInTheDocument();
  });

  it("shows a layer's detail card (stores/API/above/below) on hover", () => {
    const { container } = render(<LayerCake />);
    const catalog = screen.getByRole("button", {
      name: /Catalog \/ Metastore/,
    });
    fireEvent.focus(catalog);
    const detail = container.querySelector(".lc-detail-card") as HTMLElement;
    expect(detail).toBeInTheDocument();
    expect(within(detail).getByText("Thrift: getPartitions · getTableSchema")).toBeInTheDocument();
    expect(within(detail).getByText("L6 Query engine")).toBeInTheDocument();
    expect(within(detail).getByText("L4 Table abstraction")).toBeInTheDocument();
  });

  it("marks a layer broken in failure mode and shows the failure explanation", () => {
    render(<LayerCake />);
    fireEvent.click(screen.getByLabelText(/Failure mode/));
    const blob = screen.getByRole("button", { name: /Blob layer/ });
    fireEvent.click(blob);
    expect(blob).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("✕")).toBeInTheDocument();
    fireEvent.focus(blob);
    expect(screen.getByText("If this layer is down")).toBeInTheDocument();
    expect(screen.getByText("Reads slow, retries kick in, timeouts cascade up to engine.")).toBeInTheDocument();
  });
});
