import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { DemoShell } from "./demo-shell";
import { demos } from "@/lib/demos";
import { getDemoComponent } from "./demo-component-registry";
import { trackDemoOpen } from "@/lib/analytics";

/**
 * demo-shell.test.tsx (regression coverage)
 *
 * DemoShell resolves a demo slug to its interactive component via the registry,
 * fires trackDemoOpen exactly once on mount (origin = source ?? "deeplink"), and
 * frames the widget in a dark/light retro box. We mock the registry (so a
 * component can be returned or withheld without loading a real demo chunk), the
 * analytics helper (spy), and EngagementTracker (a timer/IntersectionObserver
 * widget irrelevant to this unit). Demo inputs are REAL entries from the demos
 * catalog so slug + dark come from production data.
 */

vi.mock("./demo-component-registry", () => ({
  getDemoComponent: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackDemoOpen: vi.fn(),
}));

vi.mock("./engagement-tracker", () => ({
  EngagementTracker: ({ slug }: { slug: string }) => (
    <div data-testid="engagement-tracker" data-slug={slug} />
  ),
}));

const excel = demos.find((d) => d.slug === "excel")!; // dark: false
const agent = demos.find((d) => d.slug === "agent-pipeline")!; // dark: true

const mockedGetComponent = vi.mocked(getDemoComponent);

describe("<DemoShell>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetComponent.mockReturnValue(() => <div>DEMO BODY</div>);
  });

  it("fires trackDemoOpen once on mount, defaulting the origin to deeplink", () => {
    render(
      <StrictMode>
        <DemoShell demo={excel} />
      </StrictMode>,
    );
    expect(trackDemoOpen).toHaveBeenCalledTimes(1);
    expect(trackDemoOpen).toHaveBeenCalledWith("excel", "deeplink");
  });

  it("passes an explicit source through as the analytics origin", () => {
    render(<DemoShell demo={excel} source="gallery" />);
    expect(trackDemoOpen).toHaveBeenCalledWith("excel", "gallery");
  });

  it("renders the component resolved from the registry", () => {
    render(<DemoShell demo={excel} />);
    expect(mockedGetComponent).toHaveBeenCalledWith("excel");
    expect(screen.getByText("DEMO BODY")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the loading fallback when the slug has no registered component", () => {
    mockedGetComponent.mockReturnValue(undefined);
    render(<DemoShell demo={excel} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Praxisbeispiel wird geladen…",
    );
  });

  it("applies the light surface classes for a light demo", () => {
    const { container } = render(<DemoShell demo={excel} />);
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain("bg-background");
    expect(shell.className).not.toContain("bg-foreground");
  });

  it("applies the dark surface classes for a dark demo", () => {
    const { container } = render(<DemoShell demo={agent} />);
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain("bg-foreground");
    expect(shell.className).not.toContain("bg-background");
  });

  it("always mounts the EngagementTracker for the demo slug", () => {
    render(<DemoShell demo={excel} />);
    expect(screen.getByTestId("engagement-tracker")).toHaveAttribute(
      "data-slug",
      "excel",
    );
  });
});
