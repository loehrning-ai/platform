import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWorkshops, type Workshop } from "@/lib/workshops";
import { WORKSHOP_PLAKAT } from "@/lib/plakat/palettes";
import { orderWorkshopsForHub, WorkshopsContent } from "./workshops-content";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

const SOURCE = readFileSync(
  resolve(process.cwd(), "src/app/workshops/workshops-content.tsx"),
  "utf8",
);
/** The list rows only: the paper header above them keeps the pastel look. */
const ROW_SOURCE = SOURCE.slice(SOURCE.indexOf("function WorkshopRow("));

describe("<WorkshopsContent>", () => {
  it("renders the German paper header without motion-hidden styles and an empty state", () => {
    const { container } = render(
      <WorkshopsContent workshops={[]} locale="de" />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Workshops mit Fall und Vorlage.",
    });
    expect(heading).not.toHaveStyle({ opacity: "0" });
    // A paper header, not a poster band: no scene, even without a workshop.
    expect(heading.closest("[data-cover-band]")).toBeNull();
    expect(heading.closest("[data-workshop-hero]")).toHaveClass("bg-paper");
    expect(container.querySelector("[data-plakat-page]")).toBeNull();
    // The tail of the title sits on the sky highlight band.
    expect(heading.querySelector("span.box-decoration-clone")).toHaveTextContent(
      "mit Fall und Vorlage.",
    );
    expect(screen.getByText("Workshops · 0 Fälle")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Derzeit ist kein Workshop veröffentlicht.",
    );
    // No workshop, no start button and no catalogue link; the card still
    // states the count.
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(
      screen.getByRole("complementary", { name: "Im Katalog" }).querySelector("strong"),
    ).toHaveTextContent("00");
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
      within(w03).getByText("Workshop 03 · Live 90 min · Self-paced about 75 min"),
    ).toBeInTheDocument();
    expect(
      within(w01).getByText("Workshop 01 · Self-paced about 90 min"),
    ).toBeInTheDocument();
    // The fixed question is the first thing on the workshop page; the hub
    // row does not repeat it.
    expect(
      within(w03).queryByText(
        "“Show ending MRR by month for the last complete quarter.”",
      ),
    ).toBeNull();
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

    // The catalogue card indexes the rows in number order: numbered squares
    // on a phone, topic bars from sm, both jump links into the list.
    const catalogue = screen.getByRole("complementary", {
      name: "In the catalogue",
    });
    expect(catalogue.querySelector("strong")).toHaveTextContent("04");
    const jumps = within(catalogue)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]);
    const index = [
      ["01", "Forecasts", "#workshop-ki-prognosen-einschaetzen"],
      ["02", "Business reports", "#workshop-geschaeftsberichte-mit-ki-lesen"],
      ["03", "Data readiness", "#workshop-datenbereitschaft-fuer-ki"],
      ["04", esg?.topic, "#workshop-esg-berichte-mit-ki"],
    ];
    expect(jumps).toEqual([
      ...index.map(([number, topic, href]) => [`${number} ${topic}`, href]),
      ...index.map(([number, topic, href]) => [`${number}${topic}`, href]),
    ]);
    expect(screen.queryByRole("navigation")).toBeNull();

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
    // Hyphenated words such as "Scope-1-und-2-Summe" are not amounts.
    expect(within(rows[0]).getByText(/Scope-1-und-2-Summe/).tagName).toBe("P");
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
      expect(row.querySelector("[data-workshop-question]")).toBeNull();
      expect(row.querySelector("[data-workshop-roles]")).toHaveClass(
        "hidden",
        "md:block",
      );
      // The title is the phone hook: the summary returns from md.
      const summary = row.querySelector("h3 + p");
      expect(summary).toHaveClass("hidden", "md:block");
      expect(summary).not.toHaveClass("line-clamp-2");
      // "Du nimmst mit" is one flowing sentence over the full width.
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
      "Neu · Live 90 Min. · Selbstlernen 80 Min.",
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
      /^Selbstlernen \d+ Min\.$/,
    );
    // The series sets single titles (no subtitle after a colon): the row
    // heading is the whole title, with no part hidden on a phone.
    const w04 = getWorkshops("de").find((w) => w.number === "04")!;
    const heading = within(rows[0]).getByRole("heading", { level: 3 });
    expect(heading).toHaveAccessibleName(w04.title);
    expect(w04.title).not.toContain(":");
    expect(heading.querySelector(".sr-only")).toBeNull();

    // One one-sentence lead at every width; no second lede from sm.
    const lead = screen.getByText(/^Du rechnest oder prüfst an den Daten/);
    expect(lead).not.toHaveClass("sm:hidden");
    expect(lead).not.toHaveClass("hidden");
    expect(screen.queryByText(/^Jeder Workshop dreht sich/)).toBeNull();
    // Phones skip the route (each workshop page shows its own agenda), so
    // the list follows the cover; from sm it is the reviewed row.
    const rail = screen.getByRole("group", {
      name: "So laufen die Workshops 03 und 04",
    });
    expect(rail).toHaveAttribute("tabindex", "0");
    expect(rail.closest("section")).toHaveClass("hidden", "sm:block");
    // Each time on a phone meta line stays whole and keeps its separator,
    // with a break opportunity between the times: at 320px the pair wraps
    // instead of running into the arrow.
    const times = rows[0].querySelectorAll("[data-workshop-meta] > span.whitespace-nowrap");
    expect([...times].map((time) => time.textContent)).toEqual([
      "Live 90 Min. ·",
      "Selbstlernen 80 Min.",
    ]);
    // The H1 is the old display head at the leading the highlight band is
    // built for (0.9): a 36px phone size, fluid from sm.
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveClass("leading-[0.9]", "text-[2.25rem]", "text-foreground");
    expect(h1).not.toHaveClass("poster-title");
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
    // Phones have no P key: the keyboard hint shows from lg only.
    expect(note.querySelector("[data-workshop-key-hint]")).toHaveClass("max-lg:hidden");
    expect(screen.getByText("Neueste zuerst")).toBeInTheDocument();
    expect(screen.getByText("Workshops · 4 Fälle")).toBeInTheDocument();
    expect(
      screen.getAllByText(/kostenlos/).map((node) => node.textContent),
    ).toEqual(["Alle Materialien kostenlos, ohne Anmeldung"]);
  });

  it("sets the header on paper with the highlighted title, pastel geometry and the tilted catalogue card", () => {
    const workshops = getWorkshops("de");
    const { container } = render(<WorkshopsContent workshops={workshops} locale="de" />);

    const hero = container.querySelector("[data-workshop-hero]") as HTMLElement;
    expect(hero).toHaveClass("bg-paper", "overflow-hidden", "isolate");
    expect(hero).toHaveAttribute("aria-labelledby", "workshops-hub-heading");
    // No poster band, no key numeral and no dark surface on the hub: the
    // header and the rows never take an ink-black or graphit fill (the
    // route's 16px station squares are markers, not surfaces).
    expect(container.querySelector("[data-cover-band]")).toBeNull();
    expect(container.querySelector("[data-poster-numeral]")).toBeNull();
    expect(container.querySelector(".dark-section")).toBeNull();
    const surfaces = [hero, ...container.querySelectorAll("[data-testid='workshop-row']")];
    for (const node of surfaces.flatMap((surface) => [surface, ...surface.querySelectorAll("*")])) {
      const classes = node.getAttribute("class")?.split(/\s+/) ?? [];
      for (const name of classes) {
        expect(name, "a dark fill on the hub").not.toMatch(
          /^(?:hover:)?bg-(?:foreground|graphit|black|dark-bg|neutral-9\d\d)$/,
        );
      }
    }

    // The geometry: a tilted sky band and a tilted pink band, decorative
    // and behind the text.
    const geometry = [...hero.querySelectorAll("[data-workshop-geometry]")];
    expect(geometry.map((shape) => shape.getAttribute("data-workshop-geometry"))).toEqual([
      "sky",
      "pink",
    ]);
    expect(geometry[0]).toHaveClass("bg-brand-sky/60", "rotate-3", "-z-10");
    expect(geometry[1]).toHaveClass("bg-brand-pink/55", "-rotate-6", "-z-10");
    for (const shape of geometry) {
      expect(shape).toHaveAttribute("aria-hidden", "true");
      expect(shape).toHaveClass("pointer-events-none", "absolute");
    }

    // The kicker and the H1 with its tail on the sky band; the lead is
    // positioned so a descender paints above the next line's band.
    expect(within(hero).getByText("Workshops · 4 Fälle")).toHaveClass(
      "font-mono",
      "uppercase",
      "text-brand-orange",
    );
    const h1 = within(hero).getByRole("heading", { level: 1 });
    const mark = h1.querySelector("span.box-decoration-clone") as HTMLElement;
    expect(mark).toHaveTextContent("mit Fall und Vorlage.");
    expect(mark.style.backgroundImage).toContain("var(--color-brand-sky)");
    expect(h1.firstElementChild).toHaveClass("relative");
    expect(h1.firstElementChild).toHaveTextContent("Workshops");

    // The one primary action: Mennige with a paper label.
    const start = within(hero).getByRole("link", { name: "Mit Workshop 03 beginnen" });
    expect(start).toHaveClass("bg-mennige", "text-paper", "min-h-11");
    expect(within(hero).getByText("Alle Materialien kostenlos, ohne Anmeldung")).toBeInTheDocument();

    // The catalogue card: tilted, on an acid offset sheet, with the count.
    const card = within(hero).getByRole("complementary", { name: "Im Katalog" });
    expect(card).toHaveClass("-rotate-1");
    expect(card.querySelector("span[aria-hidden='true']")).toHaveClass(
      "bg-brand-acid/75",
      "translate-x-3",
      "translate-y-3",
    );
    expect(card.querySelector("strong")).toHaveTextContent(/^04$/);
    // Phones: four numbered 44px squares, one per workshop; from sm the
    // topic bars, widest first.
    const chips = card.querySelector("[data-workshop-catalogue-chips]") as HTMLElement;
    expect(chips).toHaveClass("sm:hidden");
    const squares = within(chips).getAllByRole("link");
    expect(squares.map((square) => square.textContent)).toEqual([
      "01 Prognosen",
      "02 Geschäftsberichte",
      "03 Datenbereitschaft",
      "04 ESG-Berichte",
    ]);
    for (const square of squares) {
      expect(square).toHaveClass("size-11", "focus-visible:outline-brand-orange");
    }
    const bars = [...card.querySelectorAll("ol:not([data-workshop-catalogue-chips]) a")];
    expect(bars.map((bar) => bar.getAttribute("href"))).toEqual([
      "#workshop-ki-prognosen-einschaetzen",
      "#workshop-geschaeftsberichte-mit-ki-lesen",
      "#workshop-datenbereitschaft-fuer-ki",
      "#workshop-esg-berichte-mit-ki",
    ]);
    expect(bars[0]).toHaveClass("w-full", "bg-brand-pink/70", "min-h-11");
    expect(bars[3]).toHaveClass("w-[64%]", "bg-brand-acid/80");
    expect(bars[0].closest("ol")).toHaveClass("hidden", "sm:block");
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
    // The pastel geometry, the highlight and the tilted card belong to the
    // paper header; the rows stay flat poster rows on the page ground.
    expect(ROW_SOURCE).not.toMatch(/bg-brand-(?:acid|sky|pink|peach|cobalt|teal)/);
    expect(ROW_SOURCE).not.toContain("HighlightedText");
    expect(ROW_SOURCE).not.toMatch(/\btranslate-[xy]-\d/);
    expect(ROW_SOURCE).not.toMatch(/\brotate-\d/);
    expect(ROW_SOURCE).not.toMatch(/shadow-(?:card|tile|\[)/);
    expect(ROW_SOURCE).not.toMatch(/\buppercase\b/);
    expect(ROW_SOURCE).not.toMatch(/border-l-\[\d+px\]/);
    expect(SOURCE).not.toContain("font-black");
    expect(ROW_SOURCE).not.toMatch(/tracking-\[-0\.0[2-9]/);
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
