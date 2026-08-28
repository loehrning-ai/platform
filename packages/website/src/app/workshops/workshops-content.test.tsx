import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWorkshops } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

describe("<WorkshopsContent>", () => {
  it("renders German first-viewport copy without motion-hidden styles", () => {
    render(<WorkshopsContent workshops={[]} locale="de" />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /Selbstlern-Workshops[\s\S]*für konkrete Entscheidungen/,
    });
    const introduction = screen.getByText(/0 geführte Fälle/);
    expect(heading).not.toHaveStyle({ opacity: "0" });
    expect(introduction).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Derzeit ist kein Workshop veröffentlicht.",
    );
  });

  it("renders reviewed English copy and locale-preserving links", () => {
    render(<WorkshopsContent workshops={getWorkshops("en")} locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Self-study workshops[\s\S]*for concrete decisions/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 guided cases/)).toBeInTheDocument();
    expect(screen.queryByText("Verfügbare Workshops")).toBeNull();
    expect(screen.getAllByTestId("workshop-row")).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "1,050 units. Who gets them?",
      }),
    ).toHaveAttribute("data-workshop-decision");
    const rows = screen.getAllByTestId("workshop-row");
    const outputs = rows.map((row) =>
      within(row).getByText("Decision + evidence"),
    );
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output).toHaveAttribute("data-workshop-output");
    }
    expect(screen.queryByText("Release with a gate")).toBeNull();
    expect(
      screen.getByRole("link", {
        name: "Open workshop: Can AI predict the future?",
      }),
    ).toHaveAttribute("href", "/en/workshops/ki-prognosen-einschaetzen");
    for (const row of rows) {
      const actions = within(row).getAllByRole("link");
      expect(actions).toHaveLength(1);
      expect(actions[0]).toHaveAccessibleName(/^Open workshop:/);
      expect(actions[0]).toHaveClass("min-h-11");
      expect(actions[0].querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
    expect(screen.queryByRole("link", { name: /View courses/ })).toBeNull();
  });

  it("uses preview-first decision folios without black hub panels", () => {
    const { container } = render(
      <WorkshopsContent workshops={getWorkshops("de")} locale="de" />,
    );
    const source = readFileSync(
      resolve(process.cwd(), "src/app/workshops/workshops-content.tsx"),
      "utf8",
    );

    expect(source).toContain('from "next/image"');
    expect(source).toContain("card-preview.webp");
    expect(source).not.toContain("transition-all");
    expect(source).not.toContain("feedback.aligned.title");
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(source).not.toContain("dark-section");
    expect(source).not.toContain("data-workshop-bento");
    expect(
      container.querySelector("[data-workshop-editorial-spread]"),
    ).not.toBeNull();
    expect(container.querySelectorAll("[data-decision-card]")).toHaveLength(2);
    const previews = container.querySelectorAll("img");
    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveAttribute("loading", "eager");
    expect(previews[0]).toHaveAttribute("fetchpriority", "high");
    expect(previews[1]).toHaveAttribute("loading", "lazy");
  });
});
