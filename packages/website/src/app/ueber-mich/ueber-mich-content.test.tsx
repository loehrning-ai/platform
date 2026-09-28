import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LOEHRNING_LINKEDIN_URL, TIM_ENTITY } from "@/lib/seo/entity";
import { UeberMichContent } from "./ueber-mich-content";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

describe("<UeberMichContent>", () => {
  it("renders the complete German profile as static document content", () => {
    const { container } = render(<UeberMichContent locale="de" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Ich baue loehrning.ai, damit KI-Wissen prüfbar bleibt.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: "Tim Löhr vor der Golden Gate Bridge",
      }),
    ).toHaveAttribute("width", "800");
    for (const heading of [
      "Berufliche Stationen",
      "Akademischer Hintergrund",
      "Direkter Kontakt",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(
      container.querySelector("article > section:last-of-type"),
    ).toHaveAttribute("id", "kontakt");
    expect(
      container.querySelector("[data-profile-editorial-spread]"),
    ).not.toBeNull();
    expect(container.querySelector("[data-proof-ledger]")).not.toBeNull();
    expect(container.querySelector("[data-credential-spread]")).not.toBeNull();
    expect(container.querySelectorAll("[data-link-preview]")).toHaveLength(4);
    expect(container.querySelector(".js-reveal")).toBeNull();
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
    expect(container.querySelector(".dark-section")).toBeNull();
  });

  it("renders full English copy without German UI leakage", () => {
    render(<UeberMichContent locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "I build loehrning.ai so AI knowledge stays verifiable.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Professional timeline" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Academic background" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Contact me directly" }),
    ).toBeVisible();
    expect(screen.queryByText("Berufliche Einordnung")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Akademischer Hintergrund"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Direkter Kontakt")).not.toBeInTheDocument();
  });

  it("preserves external destinations and hardened rel attributes", () => {
    render(<UeberMichContent locale="en" />);

    const links = [
      ["LinkedIn · Tim Löhr, opens in a new tab", TIM_ENTITY.linkedInUrl],
      ["LinkedIn · loehrning.ai, opens in a new tab", LOEHRNING_LINKEDIN_URL],
      ["GitHub · Tim Löhr, opens in a new tab", TIM_ENTITY.personalGithubUrl],
    ] as const;
    for (const [name, href] of links) {
      const link = screen.getByRole("link", {
        name: new RegExp(escapeRegExp(name), "i"),
      });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(
      screen.getAllByRole("link", { name: /^LinkedIn · Tim Löhr/ }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: /^LinkedIn · loehrning\.ai/ }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /^GitHub/ })).toHaveLength(1);
  });

  it("tells contact rows apart by their real destination, without icons", () => {
    const { container } = render(<UeberMichContent locale="de" />);
    const nav = screen.getByRole("navigation", { name: "Kontaktwege" });
    const details = Array.from(
      nav.querySelectorAll("a > span > span:last-child"),
    ).map((span) => span.textContent);
    expect(details).toEqual([
      TIM_ENTITY.email,
      "linkedin.com/in/tim-loehr-821ba8188",
      "linkedin.com/company/loehrning",
      "github.com/Mavengence",
    ]);
    expect(new Set(details).size).toBe(details.length);
    // The only glyph in a row is its direction arrow.
    for (const link of nav.querySelectorAll("a")) {
      expect(link.querySelectorAll("svg")).toHaveLength(1);
    }
    // One icon family site-wide: the profile uses no Lucide glyphs.
    expect(
      readFileSync(join(__dirname, "ueber-mich-content.tsx"), "utf8"),
    ).not.toMatch(/from "lucide-react"/);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("localizes the internal feedback link and keeps contact terminal", () => {
    render(<UeberMichContent locale="en" />);

    expect(
      screen.getByRole("link", { name: "the feedback form" }),
    ).toHaveAttribute("href", "/en/feedback");
    expect(screen.getByRole("link", { name: /Send an email/ })).toHaveAttribute(
      "href",
      `mailto:${TIM_ENTITY.email}`,
    );
    expect(
      screen.getByRole("navigation", { name: "Contact methods" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "Related sections" }),
    ).not.toBeInTheDocument();
  });

  it("names former employers once in the ledger, with the no-endorsement line", () => {
    const { container } = render(<UeberMichContent locale="en" />);

    // No separate logo band: the marks sit beside the names in the ledger.
    expect(container.querySelector("[data-employer-proof]")).toBeNull();
    const ledger = screen.getByRole("region", {
      name: "Professional timeline",
    });
    expect(within(ledger).getByText(/only as past roles/)).toBeVisible();
    for (const employer of ["Apple", "Red Bull", "Meta"]) {
      expect(within(ledger).getByText(employer)).toBeVisible();
      expect(
        ledger.querySelector(`[data-employer-mark="${employer}"]`),
      ).not.toBeNull();
    }
  });

  it("keeps profile facts concise without dropping the factual record", () => {
    render(<UeberMichContent locale="en" />);

    for (const fact of [
      "Curator and developer",
      "AI literacy · data work · technical practice",
      "Free access · public sources",
    ]) {
      expect(screen.getByText(fact)).toBeVisible();
    }
    expect(
      screen.getByText("Data quality, pipelines, and analytics systems."),
    ).toBeVisible();
    expect(screen.getByText(/Graduated with distinction/)).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Journal article|Conference paper/ }),
    ).toHaveLength(2);
  });

  it("renders the profile in Werkzeichnung: flat paper, Kopflinien, no risograph", () => {
    const { container } = render(<UeberMichContent locale="de" />);
    const html = container.innerHTML;
    for (const [pattern, label] of [
      [/\bbg-brand-(?:acid|sky|pink|peach|cobalt|teal)/, "pastel wash"],
      [/\bshadow-card\b|\bshadow-\[/, "card shadow"],
      [/(?:^|\s)(?:sm:|lg:|hover:|group-hover:)?-?rotate-/, "rotation"],
      [/\btranslate-[xy]-3\b|hover:-translate|group-hover:scale/, "offset block or hover lift"],
      [/\buppercase\b|\bfont-mono\b/, "mono all-caps eyebrow"],
      [/border-l-\[[3-9]px\]/, "side stripe"],
      [/tracking-\[-0\.0[2-9]/, "crushed headline tracking"],
    ] as const) {
      expect(html, label).not.toMatch(pattern);
    }
    // Every section after the header opens with a 2px Kopflinie in the scene line.
    const sections = container.querySelectorAll("article > section");
    expect(sections.length).toBe(3);
    // Section heads carry no kicker-like caption; the ledger's is a fact.
    for (const caption of [
      "Berufliche Einordnung",
      "Laufbahn",
      "Ausbildung und Forschung",
      "Kontakt",
    ]) {
      expect(screen.queryByText(caption)).not.toBeInTheDocument();
    }
    expect(screen.getByText("2021 bis heute")).toBeInTheDocument();
    for (const section of sections) {
      expect(section.querySelector("header.border-t-2.border-scene-line")).not.toBeNull();
    }
    // The portrait is the one framed object, square and unrotated.
    const portrait = screen.getByRole("img", { name: "Tim Löhr vor der Golden Gate Bridge" });
    expect(portrait.parentElement).toHaveClass("border", "border-foreground");
  });
});
