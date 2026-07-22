import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Hero,
  SectionLabel,
  Panel,
  AntiPatterns,
  BestPractices,
  Takeaway,
  Term,
} from "./primitives";

describe("data-engineering-fundamentals shared primitives ", () => {
  it("Hero renders eyebrow, title, hook, and meta rows", () => {
    render(
      <Hero
        eyebrow="Chapter 00"
        title="Core Fundamentals"
        hook="Storage, formats, engines."
        meta={[{ k: "Read time", v: "8 min" }]}
      />,
    );
    expect(screen.getByText("Chapter 00")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Core Fundamentals" })).toBeInTheDocument();
    expect(screen.getByText("Storage, formats, engines.")).toBeInTheDocument();
    expect(screen.getByText("Read time")).toBeInTheDocument();
    expect(screen.getByText("8 min")).toBeInTheDocument();
  });

  it("Hero applies the accent as a CSS custom property when provided", () => {
    const { container } = render(<Hero eyebrow="e" title="t" hook="h" accent="#2D7DFF" />);
    const header = container.querySelector("header.hero");
    expect(header).not.toBeNull();
    expect(header?.getAttribute("style")).toContain("--chapter-accent: #2D7DFF");
  });

  it("SectionLabel renders its number and children", () => {
    render(<SectionLabel n="01">Ingest patterns</SectionLabel>);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Ingest patterns")).toBeInTheDocument();
  });

  it("Panel renders eyebrow, title, meta, children, and caption", () => {
    render(
      <Panel eyebrow="Simulator" title="Layer Cake" meta={<span>live</span>} caption="Drag to explore">
        <div>panel body</div>
      </Panel>,
    );
    expect(screen.getByText("Simulator")).toBeInTheDocument();
    expect(screen.getByText("Layer Cake")).toBeInTheDocument();
    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.getByText("panel body")).toBeInTheDocument();
    expect(screen.getByText("Drag to explore")).toBeInTheDocument();
  });

  it("AntiPatterns numbers its items and defaults its title", () => {
    render(<AntiPatterns items={["Skip the schema registry", "Write directly to prod"]} />);
    expect(screen.getByText("Anti-patterns")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Skip the schema registry")).toBeInTheDocument();
  });

  it("BestPractices numbers its items and defaults its title", () => {
    render(<BestPractices items={["Version every schema"]} />);
    expect(screen.getByText("The right way")).toBeInTheDocument();
    expect(screen.getByText("Version every schema")).toBeInTheDocument();
  });

  it("Takeaway renders a heading and every item", () => {
    render(<Takeaway items={["Idempotency is not optional", "Backfills will happen"]} />);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
    expect(screen.getByText("Idempotency is not optional")).toBeInTheDocument();
    expect(screen.getByText("Backfills will happen")).toBeInTheDocument();
  });

  it("Term renders its meta (vendor) name as inline code", () => {
    render(<Term meta="Kafka" />);
    const el = screen.getByText("Kafka");
    expect(el.tagName).toBe("CODE");
  });
});
