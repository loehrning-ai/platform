import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedMetaTable } from "./animated-meta-table";

/**
 * animated-meta-table.test.tsx (regression coverage)
 *
 * The evidence ledger renders reviewed values verbatim. It never count-ups an
 * illustrative metric or changes it based on viewport state or motion policy.
 */

describe("<AnimatedMetaTable>", () => {
  it("renders every label and reviewed value verbatim", () => {
    const meta = [
      { label: "Zeitersparnis", value: "3,5 Std." },
      { label: "Genauigkeit", value: "98,2 %" },
      { label: "Status", value: "Aktiv" },
    ] as const;

    render(<AnimatedMetaTable meta={meta} />);

    expect(screen.getByText("Zeitersparnis")).toBeInTheDocument();
    expect(screen.getByText("3,5 Std.")).toBeInTheDocument();
    expect(screen.getByText("Genauigkeit")).toBeInTheDocument();
    expect(screen.getByText("98,2 %")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    // A value with no digits is passed straight through.
    expect(screen.getByText("Aktiv")).toBeInTheDocument();
  });

  it("renders only the container (no rows) for an empty meta list", () => {
    const { container } = render(<AnimatedMetaTable meta={[]} />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });

  it("does not schedule animation frames for numeric values", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    try {
      render(
        <AnimatedMetaTable meta={[{ label: "Umsatz", value: "1.234,5" }]} />,
      );
      expect(screen.getByText("1.234,5")).toBeInTheDocument();
      expect(raf).not.toHaveBeenCalled();
    } finally {
      raf.mockRestore();
    }
  });
});
