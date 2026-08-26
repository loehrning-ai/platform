import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getWorkshops } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";

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
    const outputs = screen.getAllByText("Decision + evidence");
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
    for (const row of screen.getAllByTestId("workshop-row")) {
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

  it("keeps the catalogue flat, compact, and free of decorative card motion", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/workshops/workshops-content.tsx"),
      "utf8",
    );

    expect(source).not.toContain("next/image");
    expect(source).not.toContain("transition-all");
    expect(source).not.toContain("feedback.aligned.title");
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
  });
});
