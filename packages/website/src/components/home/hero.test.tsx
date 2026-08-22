import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero";

describe("HeroSection learning-platform positioning", () => {
  it("renders the free German learning platform headline without employer proof", () => {
    render(<HeroSection />);
    expect(screen.getByText("KI")).toBeInTheDocument();
    expect(screen.getByText("verstehen.")).toBeInTheDocument();
    expect(screen.getByText("Sicher anwenden.")).toBeInTheDocument();
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
      screen.getByText(
        /Four foundation-path readers require a free learning account/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open AI check/i }),
    ).toHaveAttribute("href", "/en/ki-check");
    expect(screen.getByRole("link", { name: /Open Source/i })).toHaveAttribute(
      "href",
      "/en/open-source",
    );
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
    ).toEqual(expect.arrayContaining(["/en/kurse", "/en/demos", "/en/workshops"]));
  });

  it("renders an in-flow primary CTA linking to the diagnostic start", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /KI-Check öffnen/i });
    expect(cta).toHaveAttribute("href", "/ki-check");
  });

  it("renders the above-fold introduction without a delayed clipping reveal", () => {
    render(<HeroSection />);
    const introduction = screen.getByText(
      /Kostenfreie Kurse, Demos, Bücher und Workshops/,
    );

    expect(introduction.tagName).toBe("P");
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(introduction.style.clipPath).toBe("");
  });
});
