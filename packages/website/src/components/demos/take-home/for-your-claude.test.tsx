import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CLAUDE_UI } from "@/lib/claude-ui";

vi.mock("@/lib/demo-takehome", () => ({
  takeHomeFor: (slug: string) =>
    slug === "esg-berichte-mit-ki"
      ? {
          kit: {
            de: { href: "/workshops/x/kit.zip", shown: ["kit/daten/strom.csv", "kit/ANTWORTEN.md"], instructions: "kit/projekt-anweisungen.md", installDoc: "kit/START.md" },
            en: { href: "/workshops/x/kit.zip", shown: ["kit/daten/strom.csv"], instructions: "kit/projekt-anweisungen.md", installDoc: "kit/START.md" },
          },
          skill: { name: "esg-nachweise" },
          templates: [],
        }
      : undefined,
}));

vi.mock("@/lib/demo-takehome.server", () => ({
  resolveKit: (kit: { href: string; shown: readonly string[] }) => ({
    href: kit.href,
    fileName: "kit.zip",
    bytes: 1_300_000,
    shown: kit.shown,
    instructions: "Antworte nur mit Datei und Zeile.\n",
  }),
}));

const { ForYourClaude, formatBytes } = await import("./for-your-claude");

describe("Für deinen Claude", () => {
  it("renders nothing for a demo without an entry", () => {
    const { container } = render(<ForYourClaude slug="ki-prognosen-einschaetzen" locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists kit, skill, instructions, install steps and the share line, all open", () => {
    const { container } = render(<ForYourClaude slug="esg-berichte-mit-ki" locale="de" />);
    expect(screen.getByRole("heading", { level: 2, name: "Für deinen Claude" })).toBeInTheDocument();
    expect(container.querySelector("#fuer-deinen-claude")).not.toBeNull();
    const kit = container.querySelector('[data-takehome-row="kit"]') as HTMLElement;
    expect(within(kit).getByText("daten/strom.csv")).toBeInTheDocument();
    expect(within(kit).getByText("kit.zip · ZIP · 1,2 MB")).toBeInTheDocument();
    expect(within(kit).getByRole("link", { name: /Kit laden/ })).toHaveAttribute("href", "/workshops/x/kit.zip");
    expect(screen.getByRole("link", { name: /Skill laden/ })).toHaveAttribute("href", "/skills/esg-nachweise.zip");
    expect(container.querySelector("[data-instructions]")?.textContent).toBe("Antworte nur mit Datei und Zeile.\n");
    for (const step of CLAUDE_UI.de.app.steps) expect(screen.getByText(step)).toBeInTheDocument();
    expect(screen.getByText("unzip esg-nachweise.zip -d ~/.claude/skills/")).toBeInTheDocument();
    expect(screen.getByText(CLAUDE_UI.de.noSync)).toBeInTheDocument();
    expect(container.querySelector("details, summary, [aria-expanded]")).toBeNull();
    expect(container.querySelector('[data-takehome-row="templates"]')).toBeNull();
  });

  it("speaks English on the English page", () => {
    render(<ForYourClaude slug="esg-berichte-mit-ki" locale="en" />);
    expect(screen.getByRole("heading", { level: 2, name: "For your Claude" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download skill/ })).toBeInTheDocument();
  });

  it("formats sizes per locale", () => {
    expect(formatBytes(500, "de")).toBe("1 KB");
    expect(formatBytes(27_000, "en")).toBe("27 KB");
    expect(formatBytes(1_300_000, "de")).toBe("1,2 MB");
    expect(formatBytes(1_300_000, "en")).toBe("1.2 MB");
  });
});
