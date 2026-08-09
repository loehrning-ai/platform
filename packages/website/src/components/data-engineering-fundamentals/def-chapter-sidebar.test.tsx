import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { getDefLocalizedChapterMeta } from "@/lib/data-engineering-fundamentals/content";
import {
  DEF_CHAPTER_IDS,
  DEF_CHAPTERS,
} from "@/lib/data-engineering-fundamentals/types";
import { DefChapterSidebar } from "./def-chapter-sidebar";

afterEach(cleanup);

describe("DefChapterSidebar", () => {
  it("renders all 12 English chapters with real titles and durations", () => {
    render(
      <DefChapterSidebar activeId="fund" locale="en" chapters={DEF_CHAPTERS} />,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Core Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Capstone")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
  });

  it("marks only the active chapter and prefixes English links with /en", () => {
    render(
      <DefChapterSidebar
        activeId="store"
        locale="en"
        chapters={DEF_CHAPTERS}
      />,
    );
    const links = screen.getAllByRole("link");
    const current = links.filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-engineering-fundamentals/store",
    );
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(
        /^\/en\/kurse\/open-source\/data-engineering-fundamentals\//,
      );
    }
  });

  it("renders German metadata on the unprefixed chapter routes", () => {
    render(
      <DefChapterSidebar
        activeId="fund"
        locale="de"
        chapters={DEF_CHAPTER_IDS.map((id) =>
          getDefLocalizedChapterMeta(id, "de"),
        )}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Kapitelnavigation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Grundlagen").closest("a")).toHaveAttribute(
      "href",
      "/kurse/open-source/data-engineering-fundamentals/fund",
    );
    expect(screen.getByText("15 Min.")).toBeInTheDocument();
  });
});
