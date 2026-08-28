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
      screen.getByText(/Commit to a decision\. Test it against a model/),
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

  it("renders the above-fold introduction without a delayed clipping reveal", () => {
    render(<HeroSection />);
    const introduction = screen.getByText(
      /Wähle ein Ziel\. Triff eine Entscheidung/,
    );

    expect(introduction.tagName).toBe("P");
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(introduction.style.clipPath).toBe("");
  });
});
