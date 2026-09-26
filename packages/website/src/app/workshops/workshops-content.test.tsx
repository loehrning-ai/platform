import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWorkshops, type Workshop } from "@/lib/workshops";
import { orderWorkshopsForHub, WorkshopsContent } from "./workshops-content";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

const SOURCE = readFileSync(
  resolve(process.cwd(), "src/app/workshops/workshops-content.tsx"),
  "utf8",
);

describe("<WorkshopsContent>", () => {
  it("renders the German cover band without motion-hidden styles and an empty state", () => {
    const { container } = render(
      <WorkshopsContent workshops={[]} locale="de" />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Workshops mit einem Fall und einer Vorlage für deine Arbeit",
    });
    expect(heading).not.toHaveStyle({ opacity: "0" });
    expect(heading.closest("[data-cover-band]")).toHaveClass("dark-section");
    expect(screen.getByText("Workshops · 0 Fälle · kostenlos")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Derzeit ist kein Workshop veröffentlicht.",
    );
    // No workshop, no start button and no index row.
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("renders English rows newest first with one link each and no material links", () => {
    const { container } = render(
      <WorkshopsContent workshops={getWorkshops("en")} locale="en" />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Workshops with one case and a template for your own work",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const rows = screen.getAllByTestId("workshop-row");
    expect(rows.map((row) => row.id)).toEqual([
      "workshop-datenbereitschaft-fuer-ki",
      "workshop-geschaeftsberichte-mit-ki-lesen",
      "workshop-ki-prognosen-einschaetzen",
    ]);
    expect(
      rows.map(
        (row) => within(row).getByRole("heading", { level: 3 }).textContent,
      ),
    ).toEqual([
      "Are your data ready for AI?",
      "Read business reports with AI",
      "Can AI predict the future?",
    ]);
    expect(
      rows.map((row) => row.querySelector("[data-workshop-output]")?.textContent),
    ).toEqual(["Five-field template", "Metrics skill + dashboard", "Go/no-go rule"]);

    const [w03, w02, w01] = rows;
    expect(
      within(w03).getByText("Workshop 03 · Live 90 min · Alone about 60 min"),
    ).toBeInTheDocument();
    expect(
      within(w01).getByText("Workshop 01 · Alone about 90 min"),
    ).toBeInTheDocument();
    expect(
      within(w03).getByText(
        "“Show ending MRR by month for the last complete quarter.”",
      ),
    ).toBeInTheDocument();
    expect(within(w03).getByText("A browser, no AI account")).toBeInTheDocument();
    expect(
      within(w02).getByText(/^The Claude desktop app with Claude Code/),
    ).toBeInTheDocument();
    expect(
      within(w03).getByText("Run live on 25 September 2026"),
    ).toBeInTheDocument();
    expect(within(w02).queryByText(/^Run live on/)).toBeNull();
    expect(
      w02.querySelector("[data-workshop-roles]")?.textContent,
    ).toBe("Deck · Kit");

    for (const row of rows) {
      const actions = within(row).getAllByRole("link");
      expect(actions).toHaveLength(1);
      expect(actions[0]).toHaveAccessibleName(/^View workshop:/);
      expect(actions[0]).toHaveClass("min-h-11", "motion-reduce:transition-none");
      expect(actions[0].querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
    expect(
      screen.getByRole("link", { name: "View workshop: Can AI predict the future?" }),
    ).toHaveAttribute("href", "/en/workshops/ki-prognosen-einschaetzen");

    // The one primary action goes into the first row's workshop page.
    expect(
      screen.getByRole("link", { name: "Start with workshop 03" }),
    ).toHaveAttribute("href", "/en/workshops/datenbereitschaft-fuer-ki");

    const index = screen.getByRole("navigation", {
      name: "Workshops on this page",
    });
    expect(
      within(index)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["01Forecasts", "#workshop-ki-prognosen-einschaetzen"],
      ["02Business reports", "#workshop-geschaeftsberichte-mit-ki-lesen"],
      ["03Data readiness", "#workshop-datenbereitschaft-fuer-ki"],
    ]);

    // The hub links to workshop pages only; materials live on the detail page.
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (link) => link.getAttribute("href") ?? "",
    );
    expect(hrefs.filter((href) => /\.(?:html|zip|csv)(?:#|$)/.test(href))).toEqual(
      [],
    );
    expect(
      hrefs.every((href) => href.startsWith("#") || href.startsWith("/en/")),
    ).toBe(true);
  });

  it("shows how every workshop runs as a static five-station route", () => {
    render(<WorkshopsContent workshops={getWorkshops("de")} locale="de" />);

    const route = screen.getByRole("list", { name: "So läuft jeder Workshop" });
    expect(route).toHaveAttribute("data-route-mode", "description");
    expect(within(route).getAllByRole("listitem")).toHaveLength(5);
    expect(route.querySelector("[aria-current]")).toBeNull();
    expect(
      screen
        .getByText(/Gezeigte KI-Antworten sind Aufzeichnungen mit Datum/)
        .closest("[data-callout]"),
    ).toHaveAttribute("data-callout", "boundary");
  });

  it("marks workshop 04 as new and leads with it once it is in the registry", () => {
    const [w03] = getWorkshops("de").filter((w) => w.number === "03");
    const w04: Workshop = {
      ...w03,
      slug: "esg-berichte-mit-ki",
      number: "04",
      topic: "ESG-Berichte",
      title: "ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen",
    };
    const workshops = [...getWorkshops("de"), w04];

    expect(orderWorkshopsForHub(workshops).map((w) => w.number)).toEqual([
      "04",
      "03",
      "02",
      "01",
    ]);
    render(<WorkshopsContent workshops={workshops} locale="de" />);
    const rows = screen.getAllByTestId("workshop-row");
    expect(rows).toHaveLength(4);
    expect(within(rows[0]).getByText("Neu")).toHaveAttribute("data-chip", "meta");
    expect(within(rows[1]).queryByText("Neu")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Mit Workshop 04 beginnen" }),
    ).toHaveAttribute("href", "/workshops/esg-berichte-mit-ki");
  });

  it("uses deck-cover previews on flat Werkzeichnung rows", () => {
    const { container } = render(
      <WorkshopsContent workshops={getWorkshops("de")} locale="de" />,
    );

    expect(SOURCE).toContain('from "next/image"');
    expect(SOURCE).toContain("card-preview.webp");
    expect(SOURCE).not.toContain("transition-all");
    expect(SOURCE).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(SOURCE).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    // The retired risograph look: washes, offset sheets, tape, markers, lifts.
    expect(SOURCE).not.toMatch(/bg-brand-(?:acid|sky|pink|peach|cobalt|teal)/);
    expect(SOURCE).not.toContain("HighlightedText");
    expect(SOURCE).not.toMatch(/\btranslate-[xy]-\d/);
    expect(SOURCE).not.toMatch(/\brotate-\d/);
    expect(SOURCE).not.toMatch(/shadow-(?:card|tile|\[)/);
    expect(SOURCE).not.toMatch(/\buppercase\b/);
    expect(SOURCE).not.toMatch(/border-l-\[\d+px\]/);
    expect(SOURCE).not.toContain("font-black");
    expect(SOURCE).not.toMatch(/tracking-\[-0\.0[2-9]/);

    const rows = container.querySelectorAll("[data-testid='workshop-row']");
    for (const row of rows) expect(row).toHaveClass("border-b", "border-hairline");
    const previews = container.querySelectorAll("img");
    expect(previews).toHaveLength(3);
    expect(previews[0]).toHaveAttribute("loading", "eager");
    expect(previews[0]).toHaveAttribute("fetchpriority", "high");
    expect(previews[1]).toHaveAttribute("loading", "lazy");
    expect(previews[2]).toHaveAttribute("loading", "lazy");
  });
});
