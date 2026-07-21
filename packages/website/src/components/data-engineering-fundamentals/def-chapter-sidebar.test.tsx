import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DefChapterSidebar } from "./def-chapter-sidebar";

afterEach(cleanup);

describe("DefChapterSidebar (plan 011 stage 10)", () => {
  it("renders all 12 chapters with real titles and durations", () => {
    render(<DefChapterSidebar activeId="fund" />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Core Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
  });

  it("marks only the active chapter with aria-current", () => {
    render(<DefChapterSidebar activeId="store" />);
    const links = screen.getAllByRole("link");
    const current = links.filter((l) => l.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/kurse/open-source/data-engineering-fundamentals/store");
  });

  it("links to the flat per-chapter route, no /kurs prefix", () => {
    render(<DefChapterSidebar activeId={null} />);
    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink).toHaveAttribute("href", "/kurse/open-source/data-engineering-fundamentals/home");
  });
});
