import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SectionShell,
  Marginalia,
  TierChip,
  ModNumber,
  Eyebrow,
} from "./primitives";

/**
 * primitives.test.tsx (regression coverage)
 *
 * The AI-Native design primitives are mostly framer-motion wrappers, but a few
 * carry real, deterministic composition logic worth guarding. We exercise the
 * non-animated ones directly (no mocking): SectionShell's conditional class /
 * marginalia gating, Marginalia's marker, TierChip's fixed German label,
 * ModNumber, and Eyebrow's className merge. The motion-driven primitives
 * (CountUp, ClipHeading, FadeBlock, ...) are intentionally not rendered here.
 */

const sectionOf = (c: HTMLElement) => c.querySelector("section") as HTMLElement;

describe("<SectionShell>", () => {
  it("renders a plain light section with no marginalia when num/label are absent", () => {
    const { container } = render(
      <SectionShell>
        <p>inhalt</p>
      </SectionShell>,
    );
    const section = sectionOf(container);
    expect(section).not.toBeNull();
    expect(section.className).toContain("py-24");
    expect(section.className).not.toContain("dark-section");
    expect(screen.getByText("inhalt")).toBeInTheDocument();
    // No marginalia marker.
    expect(container.textContent).not.toContain("§");
  });

  it("adds the dark-section class and an id when dark + id are set", () => {
    const { container } = render(
      <SectionShell id="os-bundle" dark>
        <p>x</p>
      </SectionShell>,
    );
    const section = sectionOf(container);
    expect(section.id).toBe("os-bundle");
    expect(section.className).toContain("dark-section");
  });

  it("renders the marginalia only when BOTH num and label are provided", () => {
    const both = render(
      <SectionShell num="VIII" label="Lernmaterialien">
        <p>a</p>
      </SectionShell>,
    );
    expect(both.container.textContent).toContain("§ VIII");
    expect(both.container.textContent).toContain("Lernmaterialien");
    // The inner wrapper opts into the marginalia layout modifier.
    expect(
      both.container.querySelector(".ai-section-inner--with-marginalia"),
    ).not.toBeNull();
    both.unmount();

    // num without label -> no marginalia.
    const numOnly = render(
      <SectionShell num="I">
        <p>b</p>
      </SectionShell>,
    );
    expect(numOnly.container.textContent).not.toContain("§");
  });

  it("selects the light dot-grid background when dotGrid is set without dark", () => {
    const { container } = render(
      <SectionShell dotGrid>
        <p>x</p>
      </SectionShell>,
    );
    const cls = sectionOf(container).className;
    expect(cls).toContain("bg-dot-pattern");
    expect(cls).not.toContain("bg-dot-pattern-dark");
  });

  it("selects the dark dot-grid background when dotGrid + dark are set", () => {
    const { container } = render(
      <SectionShell dotGrid dark>
        <p>x</p>
      </SectionShell>,
    );
    expect(sectionOf(container).className).toContain("bg-dot-pattern-dark");
  });
});

describe("<Marginalia>", () => {
  it("renders the section marker and label and is aria-hidden", () => {
    const { container } = render(<Marginalia num="IV" label="Skill Graph" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toContain("§ IV");
    expect(container.textContent).toContain("Skill Graph");
  });
});

describe("<TierChip>", () => {
  it("always renders the German KOSTENLOS label regardless of the tier prop", () => {
    render(<TierChip tier="FREE" />);
    expect(screen.getByText("KOSTENLOS")).toBeInTheDocument();
  });
});

describe("<ModNumber>", () => {
  it("renders the given number in the Kupfer square", () => {
    render(<ModNumber num="02" />);
    const el = screen.getByText("02");
    expect(el.className).toContain("bg-brand-orange");
  });
});

describe("<Eyebrow>", () => {
  it("merges an extra className onto the base eyebrow styles", () => {
    render(<Eyebrow className="text-brand-sand">Wie alles zusammenhängt</Eyebrow>);
    const el = screen.getByText("Wie alles zusammenhängt");
    expect(el.className).toContain("text-brand-sand");
    expect(el.className).toContain("font-mono");
  });
});
