import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DsChapterSidebar } from "./ds-chapter-sidebar";

describe("DsChapterSidebar ", () => {
  it("renders a nav item for all 13 chapters, home included", () => {
    render(<DsChapterSidebar activeId="home" />);
    expect(screen.getAllByRole("link")).toHaveLength(13);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
  });

  it("marks the active chapter with aria-current and the active class", () => {
    render(<DsChapterSidebar activeId="fund" />);
    const fundamentals = screen.getByText("Fundamentals").closest("a");
    expect(fundamentals).toHaveAttribute("aria-current", "page");
    expect(fundamentals?.className).toContain("active");
  });

  it("points home at the bare course root and numbered chapters at their own slug", () => {
    render(<DsChapterSidebar activeId={null} />);
    expect(screen.getByText("Overview").closest("a")).toHaveAttribute(
      "href",
      "/kurse/open-source/data-science",
    );
    expect(screen.getByText("Fundamentals").closest("a")).toHaveAttribute(
      "href",
      "/kurse/open-source/data-science/fund",
    );

    const source = readFileSync(join(__dirname, "ds-chapter-sidebar.tsx"), "utf8");
    expect(source).toContain("prefetch={false}");
  });

  it("calls onNavigate when a link is clicked", () => {
    const onNavigate = vi.fn();
    render(<DsChapterSidebar activeId={null} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Overview"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
