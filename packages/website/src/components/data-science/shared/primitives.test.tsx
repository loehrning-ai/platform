import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero, SectionLabel, Panel, AntiPatterns, BestPractices, Takeaway } from "./primitives";

describe("data-science shared primitives ", () => {
  it("Hero renders eyebrow, title (with inline markup), hook, and meta", () => {
    render(
      <Hero
        eyebrow="Chapter 01 · Fundamentals"
        title='The data scientist <em>turns noise</em> <span class="accent">into decisions.</span>'
        hook="Some hook text."
        meta={[{ k: "Read", v: "7 min" }]}
      />,
    );
    expect(screen.getByText("Chapter 01 · Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("turns noise")).toBeInTheDocument();
    expect(screen.getByText("into decisions.")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("7 min")).toBeInTheDocument();
  });

  it("Hero omits the meta block when not provided", () => {
    const { container } = render(<Hero eyebrow="e" title="t" hook="h" />);
    expect(container.querySelector(".hero-meta")).toBeNull();
  });

  it("SectionLabel renders its number and children", () => {
    render(<SectionLabel n="01.1">Sample vs population</SectionLabel>);
    expect(screen.getByText("01.1")).toBeInTheDocument();
    expect(screen.getByText("Sample vs population")).toBeInTheDocument();
  });

  it("Panel renders eyebrow, title, meta, caption, and children", () => {
    render(
      <Panel eyebrow="LIVE" title="Galton Board" meta="n = 25" caption="A caption.">
        <div>sim content</div>
      </Panel>,
    );
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("Galton Board")).toBeInTheDocument();
    expect(screen.getByText("n = 25")).toBeInTheDocument();
    expect(screen.getByText("A caption.")).toBeInTheDocument();
    expect(screen.getByText("sim content")).toBeInTheDocument();
  });

  it("Panel omits the eyebrow/meta/caption blocks when not provided", () => {
    const { container } = render(
      <Panel title="Plain panel">
        <div>content</div>
      </Panel>,
    );
    expect(container.querySelector(".lab")).toBeNull();
    expect(container.querySelector(".panel-meta")).toBeNull();
    expect(container.querySelector(".panel-caption")).toBeNull();
  });

  it("AntiPatterns numbers items and defaults its title", () => {
    render(<AntiPatterns items={["<b>First</b> mistake.", "Second mistake."]} />);
    expect(screen.getByText("Anti-patterns")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("BestPractices renders with its own default title", () => {
    render(<BestPractices items={["Do this instead."]} />);
    expect(screen.getByText("The right way")).toBeInTheDocument();
  });

  it("Takeaway renders a fixed heading plus each item", () => {
    render(<Takeaway items={["<b>Sample, not truth.</b> Quantify it."]} />);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
    expect(screen.getByText("Sample, not truth.")).toBeInTheDocument();
  });
});
