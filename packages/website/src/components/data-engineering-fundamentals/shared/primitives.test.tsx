import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Hero,
  SectionLabel,
  Panel,
  Term,
  AntiPatterns,
  BestPractices,
  Takeaway,
} from "./primitives";

describe("Hero (plan 011 stage 2)", () => {
  it("renders eyebrow, HTML-formatted title/hook, and meta rows", () => {
    render(
      <Hero
        eyebrow="Chapter 00 · 8 min"
        title="Core fundamentals: <span class='accent'>storage, formats, engines.</span>"
        hook="Before we talk about engines, we talk about <strong>physics</strong>."
        meta={[
          { k: "Covers", v: '<span class="chip">Lakehouse</span>' },
          { k: "Engines", v: "Presto · Spark" },
        ]}
        accent="#0F1729"
      />,
    );
    expect(screen.getByText("Chapter 00 · 8 min")).toBeInTheDocument();
    expect(screen.getByText("storage, formats, engines.")).toBeInTheDocument();
    expect(screen.getByText("physics")).toBeInTheDocument();
    expect(screen.getByText("Covers")).toBeInTheDocument();
    expect(screen.getByText("Lakehouse")).toBeInTheDocument();
  });

  it("omits the meta row entirely when none is passed", () => {
    const { container } = render(<Hero eyebrow="e" title="t" hook="h" />);
    expect(container.querySelector(".hero-meta")).not.toBeInTheDocument();
  });
});

describe("SectionLabel (plan 011 stage 2)", () => {
  it("renders the numbered label and children", () => {
    render(<SectionLabel n="0.1">Decoupling storage from compute</SectionLabel>);
    expect(screen.getByText("0.1")).toBeInTheDocument();
    expect(screen.getByText("Decoupling storage from compute")).toBeInTheDocument();
  });
});

describe("Panel (plan 011 stage 2)", () => {
  it("renders eyebrow, title, meta, caption, and children", () => {
    render(
      <Panel eyebrow="live simulator" title="Row vs columnar scanner" meta="SELECT SUM(revenue)" caption="Scan head animates real cells.">
        <div>panel body</div>
      </Panel>,
    );
    expect(screen.getByText("live simulator")).toBeInTheDocument();
    expect(screen.getByText("Row vs columnar scanner")).toBeInTheDocument();
    expect(screen.getByText("SELECT SUM(revenue)")).toBeInTheDocument();
    expect(screen.getByText("Scan head animates real cells.")).toBeInTheDocument();
    expect(screen.getByText("panel body")).toBeInTheDocument();
  });

  it("omits the eyebrow and caption when not provided", () => {
    render(
      <Panel title="Bare panel">
        <div>content</div>
      </Panel>,
    );
    expect(screen.queryByText("live simulator")).not.toBeInTheDocument();
    expect(screen.getByText("Bare panel")).toBeInTheDocument();
  });
});

describe("Term (plan 011 stage 2)", () => {
  it("renders the term as inline code", () => {
    render(<Term meta="Kafka" />);
    expect(screen.getByText("Kafka").tagName).toBe("CODE");
  });
});

describe("AntiPatterns / BestPractices / Takeaway (plan 011 stage 2)", () => {
  it("AntiPatterns renders numbered HTML items under the default title", () => {
    render(<AntiPatterns items={["<b>Treating a lake like a DB.</b> Rewrites a whole file."]} />);
    expect(screen.getByText("Anti-patterns")).toBeInTheDocument();
    expect(screen.getByText("Treating a lake like a DB.")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("BestPractices renders numbered HTML items under the default title", () => {
    render(<BestPractices items={["<b>Inspect join keys.</b> Cheap and fast."]} />);
    expect(screen.getByText("The right way")).toBeInTheDocument();
    expect(screen.getByText("Inspect join keys.")).toBeInTheDocument();
  });

  it("Takeaway renders a labeled list of HTML items", () => {
    render(<Takeaway items={["<b>A warehouse is seven layers.</b> Know the failure mode."]} />);
    expect(screen.getByText("Key takeaways")).toBeInTheDocument();
    expect(screen.getByText("A warehouse is seven layers.")).toBeInTheDocument();
  });
});
