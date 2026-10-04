import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero";

describe("HeroSection learning-platform positioning", () => {
  it("renders the free German learning platform headline without employer proof", () => {
    render(<HeroSection />);
    expect(screen.getByText("KI")).toBeInTheDocument();
    expect(screen.getByText("verstehen.")).toBeInTheDocument();
    expect(screen.getByText("Sicher anwenden.")).toBeInTheDocument();
    expect(
      screen.queryByText("Offene Lerninstrumente"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Deutsch.")).not.toBeInTheDocument();
    ["Amazon", "Apple", "Red Bull", "Meta"].forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });

  it("renders English positioning and locale-preserving actions", () => {
    const { container } = render(<HeroSection locale="en" />);

    expect(
      screen.getByRole("heading", { name: "Understand AI. Apply it safely." }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Open learning instruments"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Free courses, examples and workshops on AI/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Choose a learning route/i }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(container.textContent).not.toMatch(
      /\b(?:verstehen|Sicher anwenden|Kostenfreie|Kurse|Bücher|Deutsch|Quellenstand|Öffnen)\b/,
    );
  });

  it("links each pillar to the surface it names, preserving locale", () => {
    const { unmount } = render(<HeroSection />);
    for (const [name, href] of [
      ["Lernen", "/kurse"],
      ["Prüfen", "/demos"],
      ["Anwenden", "/workshops"],
    ] as const) {
      expect(
        screen.getByRole("link", { name: new RegExp(name) }),
      ).toHaveAttribute("href", href);
    }
    unmount();

    render(<HeroSection locale="en" />);
    // The pillars are the only demos/workshops links in the hero, so a locale
    // regression here would otherwise ship silently.
    expect(
      screen.getAllByRole("link").map((a) => a.getAttribute("href")),
    ).toEqual(
      expect.arrayContaining(["/en/kurse", "/en/demos", "/en/workshops"]),
    );
  });

  it("renders one in-flow primary CTA linking to the course atlas", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /Lernroute wählen/i });
    expect(cta).toHaveAttribute("href", "/kurse");
    expect(
      screen.queryByRole("link", { name: /Open Source/i }),
    ).not.toBeInTheDocument();
  });

  it("puts the continue seat first in source order, where the phone band shows it", () => {
    // phone-hero.css places the seat in the band's first row; the DOM has to
    // agree, or Tab jumps back up the page after the CTA (WCAG 2.4.3).
    const { container } = render(
      <HeroSection
        continueSlot={
          <a href="/kurse/claude" data-home-continue-slot="true">
            Weiter
          </a>
        }
      />,
    );
    const seat = container.querySelector("[data-home-continue-slot]");
    const title = container.querySelector("[data-hero-title]");
    const cta = screen.getByRole("link", { name: /Lernroute wählen/i });
    expect(seat).not.toBeNull();
    expect(title).not.toBeNull();
    const before = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(seat!, title!)).toBe(true);
    expect(before(seat!, cta)).toBe(true);
    const focusables = Array.from(container.querySelectorAll("a, button"));
    expect(focusables[0]).toBe(seat);
  });

  it("states the facts once, as a tag line under the sentence from lg", () => {
    const { unmount } = render(<HeroSection />);
    const lead = screen.getByText(
      /Freie Kurse, Praxisbeispiele und Workshops zu KI/,
    );
    const facts = Array.from(lead.querySelectorAll(":scope > span")).find(
      (span) => span.classList.contains("font-ui-mono"),
    );
    expect(facts).toBeDefined();
    expect(facts).toHaveClass("max-lg:hidden");
    expect(facts?.textContent).toBe("Ohne PaywallDeutsch und EnglischQuelloffen");
    // One sentence, no restated "Frei" after "Freie".
    expect(lead.textContent).not.toMatch(/Frei,/);
    unmount();

    render(<HeroSection locale="en" />);
    expect(screen.getByText("No paywall")).toBeInTheDocument();
    expect(screen.getByText("German and English")).toBeInTheDocument();
    expect(screen.getByText("Open source")).toBeInTheDocument();
  });

  it("renders the above-fold introduction without a delayed clipping reveal", () => {
    render(<HeroSection />);
    const introduction = screen.getByText(
      /Freie Kurse, Praxisbeispiele und Workshops zu KI/,
    );

    expect(introduction.tagName).toBe("P");
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(introduction.style.clipPath).toBe("");
  });
});
