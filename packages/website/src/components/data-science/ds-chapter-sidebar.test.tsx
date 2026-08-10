import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DS_CHAPTERS } from "@/lib/data-science/types";
import { DsChapterSidebar } from "./ds-chapter-sidebar";

const sidebar = (
  activeId: Parameters<typeof DsChapterSidebar>[0]["activeId"],
  onNavigate?: () => void,
) => (
  <DsChapterSidebar
    activeId={activeId}
    locale="en"
    chapters={DS_CHAPTERS}
    onNavigate={onNavigate}
  />
);

describe("DsChapterSidebar ", () => {
  it("renders a nav item for all 13 chapters, home included", () => {
    render(sidebar("home"));
    expect(screen.getAllByRole("link")).toHaveLength(13);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
  });

  it("marks the active chapter with aria-current and the active class", () => {
    render(sidebar("fund"));
    const fundamentals = screen.getByText("Fundamentals").closest("a");
    expect(fundamentals).toHaveAttribute("aria-current", "page");
    expect(fundamentals?.className).toContain("active");
  });

  it("points home at the bare course root and numbered chapters at their own slug", () => {
    render(sidebar(null));
    expect(screen.getByText("Overview").closest("a")).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-science",
    );
    expect(screen.getByText("Fundamentals").closest("a")).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-science/fund",
    );

    const source = readFileSync(
      join(__dirname, "ds-chapter-sidebar.tsx"),
      "utf8",
    );
    expect(source).toContain("prefetch={false}");
  });

  it("calls onNavigate when a link is clicked", () => {
    const onNavigate = vi.fn();
    render(sidebar(null, onNavigate));
    fireEvent.click(screen.getByText("Overview"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
