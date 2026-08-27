import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TIM_ENTITY } from "@/lib/seo/entity";
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
        name: "Ich baue loehrning.ai als öffentliches Lernarchiv.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: "Tim Löhr vor der Golden Gate Bridge",
      }),
    ).toHaveAttribute("width", "800");
    for (const heading of [
      "Frühere Arbeitgeber",
      "Berufliche Stationen",
      "Akademischer Hintergrund",
      "Wie ich Inhalte prüfe",
      "Direkter Kontakt",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(
      container.querySelector("article > section:last-of-type"),
    ).toHaveAttribute("id", "kontakt");
    expect(container.querySelector("[data-profile-bento]")).not.toBeNull();
    expect(container.querySelector("[data-proof-ledger]")).not.toBeNull();
    expect(container.querySelector("[data-proof-bento]")).not.toBeNull();
    expect(container.querySelector("[data-editorial-bento]")).not.toBeNull();
    expect(container.querySelectorAll("[data-link-preview]")).toHaveLength(4);
    expect(container.querySelector(".js-reveal")).toBeNull();
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
  });

  it("renders full English copy without German UI leakage", () => {
    render(<UeberMichContent locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "I build loehrning.ai as a public learning archive.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Professional timeline" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Academic background" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "How I review content" }),
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
      ["Message me on LinkedIn, opens in a new tab", TIM_ENTITY.linkedInUrl],
      ["Open GitHub profile, opens in a new tab", TIM_ENTITY.personalGithubUrl],
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
      screen.getAllByRole("link", { name: /Message me on LinkedIn/i }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: /Open GitHub profile/i }),
    ).toHaveLength(1);
    const guide = screen.getByRole("link", {
      name: "CONTENT_GUIDE.md, opens in a new tab",
    });
    expect(guide).toHaveAttribute(
      "href",
      "https://github.com/loehrning-ai/platform/blob/main/CONTENT_GUIDE.md",
    );
    expect(guide).toHaveAttribute("rel", "noopener noreferrer");
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

  it("keeps the former-employer statement inside its labelled region", () => {
    render(<UeberMichContent locale="en" />);

    const stations = screen.getByRole("region", {
      name: "Previous professional roles",
    });
    expect(
      within(stations).getByText(/biographical context only/),
    ).toBeVisible();
    for (const employer of ["Apple", "Red Bull", "Meta"]) {
      expect(within(stations).getByText(employer)).toBeVisible();
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
});
