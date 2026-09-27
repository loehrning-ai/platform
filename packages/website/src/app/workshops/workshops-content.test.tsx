import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWorkshops, type Workshop } from "@/lib/workshops";
import { hubPlakat, WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";
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
      name: "Workshops mit Fall und Vorlage.",
    });
    expect(heading).not.toHaveStyle({ opacity: "0" });
    // Without a workshop the band still gets a scene (the fallback).
    expect(heading.closest("[data-cover-band]")).toHaveClass(`plakat-${hubPlakat([])}`);
    expect(heading).toHaveClass("poster-title");
    expect(screen.getByText("Workshops · 0 Fälle")).toBeVisible();
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
        name: "Workshops with a case and a template.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const rows = screen.getAllByTestId("workshop-row");
    const esg = getWorkshops("en").find((w) => w.number === "04");
    expect(rows.map((row) => row.id)).toEqual([
      "workshop-esg-berichte-mit-ki",
      "workshop-datenbereitschaft-fuer-ki",
      "workshop-geschaeftsberichte-mit-ki-lesen",
      "workshop-ki-prognosen-einschaetzen",
    ]);
    expect(
      rows.map(
        (row) => within(row).getByRole("heading", { level: 3 }).textContent,
      ),
    ).toEqual([
      esg?.title,
      "Are your data ready for AI?",
      "Read business reports with AI",
      "Can AI predict the future?",
    ]);
    expect(
      rows.map((row) => row.querySelector("[data-workshop-output]")?.textContent),
    ).toEqual([
      esg?.outcome,
      "Five-box template",
      "Metrics skill + dashboard",
      "Go/no-go rule",
    ]);

    const [, w03, w02, w01] = rows;
    expect(
      within(w03).getByText("Workshop 03 · Live 90 min · Alone about 75 min"),
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
      within(w02).getByText(
        "Claude desktop app and a Claude plan that includes Claude Code",
      ),
    ).toBeInTheDocument();
    // U+2212 reads like a dash in the brand face; the hub shows ASCII minus.
    expect(w03.textContent).not.toContain("\u2212");
    // The amount keeps its hyphen next to the euro sign on one line.
    const amount = within(w03).getByText("-€19,960");
    expect(amount.tagName).toBe("SPAN");
    expect(amount).toHaveClass("whitespace-nowrap", "tabular-nums");
    // Seven material roles fold to four nouns plus a count, in a fixed order.
    expect(w03.querySelector("[data-workshop-roles]")?.textContent).toBe(
      "Deck · Demo · Kit · Learner guide · 3 more",
    );
    expect(w03.textContent).not.toContain("For data teams");
    for (const item of w03.querySelectorAll("[data-workshop-roles] > span")) {
      expect(item).toHaveClass("whitespace-nowrap");
    }
    expect(screen.getByText("Newest first")).toBeInTheDocument();
    expect(
      screen.getAllByText(/\bfree\b/i).map((node) => node.textContent),
    ).toEqual(["All materials free, no sign-up"]);
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

    // The one primary action goes into the recommended start, Workshop 03.
    expect(
      screen.getByRole("link", { name: "Start with Workshop 03" }),
    ).toHaveAttribute("href", "/en/workshops/datenbereitschaft-fuer-ki");

    // The list is the index: the band carries no row of anchor links.
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(container.querySelector("[data-workshop-index]")).toBeNull();

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

  it("shows the route of the workshops it names as a static five-station route", () => {
    render(<WorkshopsContent workshops={getWorkshops("de")} locale="de" />);

    // Workshops 01 and 02 follow other stations (and 01 shows no AI answer),
    // so the route names the workshops it describes.
    const route = screen.getByRole("list", {
      name: "So laufen die Workshops 03 und 04",
    });
    expect(route).toHaveAttribute("data-route-mode", "description");
    expect(within(route).getAllByRole("listitem")).toHaveLength(5);
    expect(route.querySelector("[aria-current]")).toBeNull();
    expect(
      screen
        .getByText(/Gezeigte KI-Antworten sind aufgezeichnet oder für die Übung konstruiert/)
        .closest("[data-callout]"),
    ).toHaveAttribute("data-callout", "boundary");
  });

  it("marks workshop 04 as new and lists it first, while the button keeps 03", () => {
    const workshops = getWorkshops("de");

    expect(orderWorkshopsForHub(workshops).map((w) => w.number)).toEqual([
      "04",
      "03",
      "02",
      "01",
    ]);
    render(<WorkshopsContent workshops={workshops} locale="de" />);
    const rows = screen.getAllByTestId("workshop-row");
    expect(rows).toHaveLength(4);
    // Desktop carries the "Neu" chip; the phone row says it in its meta line.
    const newMarks = within(rows[0]).getAllByText("Neu");
    expect(newMarks).toHaveLength(2);
    expect(newMarks[0].closest("[data-workshop-meta]")).not.toBeNull();
    expect(newMarks[1]).toHaveAttribute("data-chip", "meta");
    expect(within(rows[1]).queryByText("Neu")).toBeNull();
    // German amount: ASCII minus, euro sign on the same line.
    expect(within(rows[1]).getByText("-19.960 €")).toHaveClass("whitespace-nowrap");
    // Hyphenated words such as "Scope-1-und-2-Frage" are not amounts.
    expect(within(rows[0]).getByText(/Scope-1-und-2-Frage/).tagName).toBe("P");
    expect(rows[0].querySelector("p:not([data-workshop-meta]) > .whitespace-nowrap")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Mit Workshop 03 beginnen" }),
    ).toHaveAttribute("href", "/workshops/datenbereitschaft-fuer-ki");
    expect(screen.queryByRole("link", { name: /Workshop 04 beginnen/ })).toBeNull();
    // The team note names every workshop with a presenter view.
    expect(
      screen.getByText(/^Workshops 03 und 04 haben eine Moderationsansicht/),
    ).toBeInTheDocument();
  });

  it("turns each row into a compact phone list item with one tap target", () => {
    render(<WorkshopsContent workshops={getWorkshops("de")} locale="de" />);
    const rows = screen.getAllByTestId("workshop-row");

    for (const row of rows) {
      // Poster thumb column plus text column below md, the poster cover
      // beside the text from md.
      expect(row).toHaveClass(
        "grid-cols-[5rem_minmax(0,1fr)]",
        "md:grid-cols-[14rem_minmax(0,1fr)]",
        "lg:grid-cols-[18rem_minmax(0,1fr)]",
        "py-4",
        "md:py-10",
      );
      // The details the workshop page repeats stay out of a phone row.
      expect(row.querySelector("[data-workshop-question]")).toHaveClass(
        "hidden",
        "md:grid",
      );
      expect(row.querySelector("[data-workshop-roles]")).toHaveClass(
        "hidden",
        "md:block",
      );
      // The title is the phone hook: the summary returns from md.
      const summary = row.querySelector("h3 + p");
      expect(summary).toHaveClass("hidden", "md:block");
      expect(summary).not.toHaveClass("line-clamp-2");
      // "Du gehst mit" is one flowing sentence over the full width.
      const facts = row.querySelector("dl")!;
      expect(facts).toHaveClass("max-md:line-clamp-2", "grid");
      expect(facts.querySelector("dt")).toHaveClass(
        "max-md:inline",
        "max-md:after:content-[':']",
      );
      expect(row.querySelector("[data-workshop-output]")).toHaveClass("max-md:inline");
      // One link; on a phone it covers the row and shows only the arrow, so
      // the text keeps the full width. Tapping gives visible feedback.
      const links = within(row).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveClass(
        "min-h-11",
        "min-w-11",
        "after:inset-0",
        "max-md:absolute",
        "max-md:inset-0",
        "[-webkit-tap-highlight-color:transparent]",
      );
      expect(links[0].querySelector("span")).toHaveClass("max-md:sr-only");
      expect(links[0].parentElement).not.toHaveClass("grid");
      expect(row).toHaveClass("relative", "has-[a:active]:bg-card-hover");
      expect(row.querySelector("h3")).toHaveClass("pr-8");
      expect(
        row.querySelector("[data-workshop-meta] > span:last-child"),
      ).toHaveClass("whitespace-nowrap");
    }

    // The phone meta line is a short duration line; the row the cover
    // button recommends says so.
    expect(rows[0].querySelector("[data-workshop-meta]")).toHaveTextContent(
      "Neu · Live 90 Min. · allein 80 Min.",
    );
    expect(rows[1].querySelector("[data-workshop-meta]")).toHaveTextContent(
      /^Einstieg · /,
    );
    for (const row of [rows[0], rows[2], rows[3]]) {
      expect(row.querySelector("[data-workshop-meta]")).not.toHaveTextContent(
        "Einstieg",
      );
    }
    expect(rows[3].querySelector("[data-workshop-meta]")).toHaveTextContent(
      /^Allein \d+ Min\.$/,
    );
    // A long title shows its head on a phone; the heading keeps the full name.
    const w04 = getWorkshops("de").find((w) => w.number === "04")!;
    const heading = within(rows[0]).getByRole("heading", { level: 3 });
    expect(heading).toHaveAccessibleName(w04.title);
    expect(heading.querySelector("span")).toHaveClass("sr-only", "md:not-sr-only");

    // Phones get a one-sentence lead; from sm the full lead returns.
    expect(
      screen.getByText(/^Du rechnest oder prüfst an den Daten/),
    ).toHaveClass("sm:hidden");
    expect(screen.getByText(/^Jeder Workshop dreht sich/)).toHaveClass(
      "hidden",
      "sm:block",
    );
    // Phones skip the route (each workshop page shows its own agenda), so
    // the list follows the cover; from sm it is the reviewed row.
    const rail = screen.getByRole("group", {
      name: "So laufen die Workshops 03 und 04",
    });
    expect(rail).toHaveAttribute("tabindex", "0");
    expect(rail.closest("section")).toHaveClass("hidden", "sm:block");
    // The H1 is a poster title: its size comes from the fit rule, so the
    // longest word always fits the phone column.
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveClass("poster-title", "text-scene-ink");
    expect(h1.style.getPropertyValue("--fit")).not.toBe("");
  });

  it("keeps the team note small and says how to open the presenter view", () => {
    const { container } = render(
      <WorkshopsContent workshops={getWorkshops("de")} locale="de" />,
    );

    // A note under the last row's hairline: no heading, no rule of its own.
    expect(screen.queryByRole("heading", { name: "Mit deinem Team" })).toBeNull();
    const note = container.querySelector("[data-workshop-teams]")!;
    expect(note.tagName).toBe("P");
    expect(note).not.toHaveClass("border-t");
    expect(note).toHaveTextContent(/^Mit deinem Team\. Workshops 03 und 04 haben/);
    expect(
      screen.getByText(/Workshops 03 und 04 haben eine Moderationsansicht mit Notizen/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Öffne das Deck und drück P\./)).toBeInTheDocument();
    expect(screen.getByText("Neueste zuerst")).toBeInTheDocument();
    expect(screen.getByText("Workshops · 4 Fälle")).toBeInTheDocument();
    expect(
      screen.getAllByText(/kostenlos/).map((node) => node.textContent),
    ).toEqual(["Alle Materialien kostenlos, ohne Anmeldung"]);
  });

  it("sets the band in the newest workshop's scene with the key numeral", () => {
    const workshops = getWorkshops("de");
    const { container } = render(<WorkshopsContent workshops={workshops} locale="de" />);
    const scene = hubPlakat(workshops);
    expect(scene).toBe("autumn");

    const band = screen
      .getByRole("heading", { level: 1 })
      .closest("[data-cover-band]") as HTMLElement;
    expect(band).toHaveClass(`plakat-${scene}`);
    expect(band).not.toHaveClass("dark-section");
    // The page carries its scene, so the Kopflinien and the tab marker below
    // the band take the scene line.
    expect(container.querySelector(`[data-plakat-page="${scene}"]`)).not.toBeNull();
    // The one caps line, the poster title and the 17px body: three sizes.
    expect(band.querySelectorAll(".plakat-caps")).toHaveLength(1);
    expect(within(band).getByText("Workshops · 4 Fälle").closest(".plakat-caps")).not.toBeNull();
    for (const text of band.querySelectorAll("p:not(.plakat-caps)")) {
      expect(text).toHaveClass("text-body", "text-scene-ink");
    }
    // The start button is the scene button (ink fill, ground label, 48px).
    const start = within(band).getByRole("link", { name: "Mit Workshop 03 beginnen" });
    expect(start).toHaveClass("bg-scene-ink", "text-scene-ground", "min-h-12");
    // The key numeral: the workshop count in the mark colour, in the lg art
    // column and in the phone strip, both decorative.
    const numerals = band.querySelectorAll("[data-poster-numeral]");
    expect([...numerals].map((numeral) => numeral.getAttribute("data-poster-numeral"))).toEqual([
      "band",
      "strip",
    ]);
    for (const numeral of numerals) {
      expect(numeral).toHaveAttribute("aria-hidden", "true");
      expect(numeral).toHaveTextContent(String(workshops.length));
      expect(numeral.querySelector("text")).toHaveClass("fill-scene-mark");
    }
    // Rost rules (SPEC §1.6): nothing small, muted or stateful in the scene.
    expect(
      band.querySelectorAll("[data-question-card], input, select, textarea, [role=status], [data-chip]"),
    ).toHaveLength(0);
    for (const node of band.querySelectorAll("*")) {
      const classes = node.getAttribute("class")?.split(/\s+/) ?? [];
      for (const small of ["text-caption", "text-label", "text-xs", "text-muted-foreground"]) {
        expect(classes, `${small} in the band`).not.toContain(small);
      }
      for (const name of classes) {
        expect(name, "reduced opacity in the band").not.toMatch(/(^|:)opacity-(?!100\b)/);
        expect(name, "a translucent colour in the band").not.toMatch(/(^|:)(text|decoration|border|bg|fill|stroke)-[\w-]+\/\d+$/);
      }
    }
    expectNoMennigeInScene(container);
    expectCapsInsideScene(container);
  });

  it("gives every row its own poster in its own palette on flat paper rows", () => {
    const { container } = render(
      <WorkshopsContent workshops={getWorkshops("de")} locale="de" />,
    );

    // The deck covers stay social cards; the hub draws SVG posters only.
    expect(SOURCE).not.toContain("card-preview.webp");
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
    // No row tint, no palette fill on a row (the retired ROW_TONES pattern).
    expect(SOURCE).not.toMatch(/bg-(?:ultramarin|kreide|sand|rost|butter|creme|kobalt|aubergine)/);
    expect(SOURCE).not.toContain("MiniCover");
    expect(SOURCE).not.toContain("GlobeLines");

    const rows = container.querySelectorAll("[data-testid='workshop-row']");
    for (const row of rows) {
      expect(row).toHaveClass("border-b", "border-hairline");
      expect(row.className).not.toMatch(/\bbg-(?!card-hover)/);
    }
    expect(container.querySelectorAll("img")).toHaveLength(0);

    // From md: four posters, one per row, in four distinct palettes, each
    // with its own numeral; all decorative.
    const covers = container.querySelectorAll("[data-workshop-mini-cover]");
    expect(covers).toHaveLength(4);
    const numbers = ["04", "03", "02", "01"];
    const slugs = [...rows].map((row) => row.id.replace(/^workshop-/, ""));
    const palettes = [...covers].map((cover, position) => {
      expect(cover).toHaveAttribute("aria-hidden", "true");
      expect(cover).toHaveClass("hidden", "md:block");
      const poster = cover.querySelector("svg[data-poster]")!;
      expect(poster).toHaveAttribute("aria-hidden", "true");
      expect(poster).toHaveAttribute("focusable", "false");
      expect(poster.querySelector("[data-poster-numeral-text]")?.textContent).toBe(numbers[position]);
      const slug = slugs[position] as keyof typeof WORKSHOP_PLAKAT;
      expect(poster).toHaveClass(`plakat-${WORKSHOP_PLAKAT[slug].plakat}`);
      return poster.getAttribute("data-poster");
    });
    expect(new Set(palettes).size).toBe(4);
    expect(palettes).toEqual(["autumn", "bloom", "idea", "lemons"]);

    // Phones: an 80x100 poster thumb in the same palette replaces the cover.
    const tiles = container.querySelectorAll("[data-workshop-tile]");
    expect(tiles).toHaveLength(4);
    for (const [position, tile] of [...tiles].entries()) {
      expect(tile).toHaveAttribute("aria-hidden", "true");
      expect(tile).toHaveClass("md:hidden");
      expect(tile.querySelector("[data-poster-thumb]")).toHaveClass("w-20", "aspect-[4/5]");
      expect(tile.querySelector("svg")).toHaveAttribute("data-poster", palettes[position]);
      expect(tile.textContent).toBe(numbers[position]);
      expect(tile.querySelector("a, button, [tabindex]")).toBeNull();
    }
    // Keyboard focus rings the whole clickable row.
    for (const row of rows) {
      expect(row).toHaveClass("has-[a:focus-visible]:outline-[3px]");
    }
  });
});
