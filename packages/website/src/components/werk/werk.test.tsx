import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ButtonLink,
  Callout,
  Chip,
  CoverBand,
  cx,
  GlobeLines,
  Kicker,
  MaterialList,
  MaterialRow,
  PICTOGRAM_NAMES,
  Pictogram,
  QuestionCard,
  Route,
  routeStationState,
  SectionHead,
  StatRow,
} from "./index";
import { GERMANY_OUTLINE, graticulePath, outlinePath, projectPoint } from "./globe-geometry";

const WERK_DIR = __dirname;
const productionSources = readdirSync(WERK_DIR)
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
  .map((file) => ({ file, source: readFileSync(join(WERK_DIR, file), "utf8") }));

describe("Werkzeichnung primitives: source contract", () => {
  it.each(productionSources)("$file stays square, flat and server-safe", ({ source }) => {
    expect(source).not.toMatch(/\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/);
    expect(source).not.toMatch(/\bshadow-(?:card|tile|\[)/);
    expect(source).not.toMatch(/\bfont-black\b/);
    expect(source).not.toMatch(/\buppercase\b/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/\bbg-brand-(?:acid|sky|pink|peach|cobalt|teal)\b/);
    expect(source).not.toMatch(/\brotate-\d/);
    expect(source).not.toMatch(/tracking-\[-0\.0[2-9]/);
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source).not.toMatch(/\b100vw\b/);
    expect(source).not.toMatch(/[–—]/);
  });

  it("keeps a transition only where a motion-reduce fallback sits next to it", () => {
    for (const { file, source } of productionSources) {
      const transitions = source.match(/transition-colors[^"]*"/g) ?? [];
      for (const match of transitions) {
        expect(match, file).toContain("motion-reduce:transition-none");
      }
    }
  });
});

describe("cx", () => {
  it("keeps a Werkzeichnung type token next to a text colour", () => {
    expect(cx("text-label text-muted-foreground")).toBe("text-label text-muted-foreground");
    expect(cx("text-caption", "text-label")).toBe("text-label");
  });
});

describe("Kicker and SectionHead", () => {
  it("renders the kicker as a sentence-case label in Schiefer", () => {
    render(<Kicker>Workshop 03 · 75 Min.</Kicker>);
    const kicker = screen.getByText("Workshop 03 · 75 Min.");
    expect(kicker.tagName).toBe("P");
    expect(kicker).toHaveClass("text-label", "text-muted-foreground", "tabular-nums");
  });

  it("draws the Kopflinie above an h2 with an optional caption", () => {
    const { container } = render(
      <SectionHead id="material" title="Material" caption="Kostenlos, ohne Konto" description="Alles zum Nacharbeiten." />,
    );
    const header = container.querySelector("header");
    expect(header).toHaveClass("border-t-2", "border-foreground");
    const heading = screen.getByRole("heading", { level: 2, name: "Material" });
    expect(heading).toHaveAttribute("id", "material");
    expect(heading).toHaveClass("text-fluid-h2", "font-bold");
    expect(screen.getByText("Kostenlos, ohne Konto")).toHaveClass("text-caption");
    expect(screen.getByText("Alles zum Nacharbeiten.")).toBeInTheDocument();
  });
});

describe("Pictogram", () => {
  it("exports the deck glyphs the learning surfaces need", () => {
    for (const name of [
      "question",
      "deck",
      "guide",
      "demo",
      "download",
      "checklist",
      "table",
      "clock",
      "pass",
      "gap",
      "shield",
    ] as const) {
      expect(PICTOGRAM_NAMES).toContain(name);
    }
  });

  it("copies deck path data verbatim", () => {
    const markup = renderToStaticMarkup(<Pictogram name="question" />);
    expect(markup).toContain('d="M8 12h84v60H46L28 90V72H8z"');
    expect(markup).toContain('stroke-linecap="square"');
    expect(markup).toContain('stroke-linejoin="miter"');
    expect(markup).toContain('viewBox="0 0 100 100"');
  });

  it("is hidden when decorative and named when titled", () => {
    const { container } = render(
      <>
        <Pictogram name="table" />
        <Pictogram name="pass" title="Passt" />
      </>,
    );
    const [decorative, named] = Array.from(container.querySelectorAll("svg"));
    expect(decorative).toHaveAttribute("aria-hidden", "true");
    expect(named).toHaveAttribute("role", "img");
    expect(named).toHaveAttribute("aria-label", "Passt");
  });
});

describe("Route", () => {
  const stations = [
    { label: "Falsche Antwort", minutes: 10 },
    { label: "Warum falsch", minutes: 15 },
    { label: "Die Reparatur", minutes: 15, caption: "unten ausprobieren" },
    { label: "Du bist dran", minutes: 15 },
  ];

  it("derives past, current and future states", () => {
    expect(routeStationState(0, 2, "progress")).toBe("past");
    expect(routeStationState(2, 2, "progress")).toBe("current");
    expect(routeStationState(3, 2, "progress")).toBe("future");
    expect(routeStationState(0, undefined, "progress")).toBe("future");
    expect(routeStationState(3, 1, "description")).toBe("solid");
  });

  it("renders an ordered list with aria-current and state words", () => {
    render(<Route label="Ablauf" stations={stations} current={2} />);
    const list = screen.getByRole("list", { name: "Ablauf" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[0]).toHaveTextContent("Falsche Antwort, erledigt");
    expect(items[2]).toHaveTextContent("Die Reparatur, aktuell");
    expect(items[3]).toHaveTextContent("Du bist dran, offen");
    expect(items[1]).toHaveTextContent("15 Min.");
    expect(items[2]).toHaveTextContent("unten ausprobieren");
  });

  it("draws solid segments up to the current station and dashed after", () => {
    const { container } = render(<Route stations={stations} current={2} />);
    const lines = Array.from(container.querySelectorAll("[data-route-line]")).map((line) =>
      line.getAttribute("data-route-line"),
    );
    // Three segments for four stations; the last station has none.
    expect(lines).toEqual(["solid", "solid", "dashed"]);
  });

  it("makes every station and segment solid in description mode, without state words", () => {
    const { container } = render(<Route stations={stations} mode="description" locale="en" />);
    expect(container.querySelectorAll('[data-state="solid"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-route-line="dashed"]')).toHaveLength(0);
    expect(container.querySelector("[aria-current]")).toBeNull();
    expect(container.textContent).toContain("10 min");
    expect(container.textContent).not.toMatch(/done|current|open/);
  });

  it("switches from vertical on phones to horizontal from sm", () => {
    const { container } = render(<Route stations={stations} />);
    expect(container.querySelector("ol")).toHaveClass("grid-cols-1", "sm:grid-flow-col", "sm:auto-cols-fr");
  });
});

describe("QuestionCard", () => {
  it("renders the question in a figure with the only left bar in Mennige", () => {
    const { container } = render(
      <QuestionCard label="Eine Frage, fest gehalten" question="100 Euro plus 20 Euro. Wirklich 120?" />,
    );
    const figure = container.querySelector("figure");
    expect(figure).toHaveClass("border-foreground", "bg-card");
    expect(container.querySelector("[data-question-card-bar]")).toHaveClass("bg-mennige", "w-1.5");
    expect(container.querySelector("figcaption")).toHaveTextContent("Eine Frage, fest gehalten");
    expect(container.querySelector("blockquote")).toHaveTextContent("Wirklich 120?");
    expect(container.querySelector('[data-pictogram="question"]')).toHaveAttribute("aria-hidden", "true");
  });

  it("scopes the dark tone with the graphit tokens", () => {
    const { container } = render(<QuestionCard tone="dark" question="Zeige den MRR." />);
    expect(container.querySelector("figure")).toHaveClass("dark-section", "border-dark-fg", "bg-dark-bg");
  });
});

describe("ButtonLink", () => {
  it("renders the paper primary with paper text on Mennige and a 44px target", () => {
    render(<ButtonLink href="/workshops">Workshops ansehen</ButtonLink>);
    const link = screen.getByRole("link", { name: "Workshops ansehen" });
    expect(link).toHaveAttribute("href", "/workshops");
    expect(link).toHaveClass("bg-mennige", "text-paper", "min-h-11");
    expect(link.className).not.toMatch(/rounded|shadow/);
  });

  it("never pairs white text with the lightened accent on dark", () => {
    render(
      <ButtonLink href="/x" tone="dark">
        Deck öffnen
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Deck öffnen" });
    expect(link).toHaveClass("bg-dark-fg", "text-dark-bg");
    expect(link.className).not.toMatch(/bg-brand-orange|text-white/);
  });

  it("marks external links with a new-window note and download links with download", () => {
    render(
      <>
        <ButtonLink href="https://example.org/slides.html" external variant="secondary" locale="en">
          Open deck
        </ButtonLink>
        <ButtonLink href="/workshops/kit.zip" download variant="text">
          Kit laden
        </ButtonLink>
      </>,
    );
    const external = screen.getByRole("link", { name: /Open deck/ });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(external).toHaveTextContent("(opens in a new window)");
    expect(external.querySelector('[data-arrow="external"]')).not.toBeNull();

    const download = screen.getByRole("link", { name: /Kit laden/ });
    expect(download).toHaveAttribute("download", "");
    expect(download.querySelector('[data-arrow="down"]')).not.toBeNull();
    expect(download).toHaveClass("min-h-11", "underline");
  });
});

describe("Chip and Callout", () => {
  it("renders square hairline chips; pass and gap carry a pictogram", () => {
    const { container } = render(
      <>
        <Chip>HTML · EN</Chip>
        <Chip variant="pass">Passt</Chip>
        <Chip variant="gap">Bekannte Lücke</Chip>
      </>,
    );
    expect(screen.getByText("HTML · EN")).toHaveClass("border", "border-border", "text-label");
    expect(container.querySelector('[data-chip="pass"] [data-pictogram="pass"]')).not.toBeNull();
    expect(container.querySelector('[data-chip="gap"]')).toHaveClass("border-dashed");
  });

  it("renders note, gap and boundary callouts without a left bar", () => {
    const { container } = render(
      <>
        <Callout>Kurzer Kontext.</Callout>
        <Callout variant="gap" title="Grenzen der Daten">
          Die Daten sind synthetisch.
        </Callout>
        <Callout variant="boundary">Läuft nur auf dieser Seite.</Callout>
      </>,
    );
    expect(container.querySelector('[data-callout="note"]')).toHaveClass("border-hairline", "bg-card");
    expect(container.querySelector('[data-callout="gap"]')).toHaveClass("border-dashed", "border-foreground");
    expect(container.querySelector('[data-callout="boundary"] [data-pictogram="shield"]')).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/border-l-\[|border-l-4/);
  });
});

describe("StatRow", () => {
  it("renders labels and tabular values in a description list", () => {
    const { container } = render(
      <StatRow
        stats={[
          { label: "Szenen", value: 26, note: "75 Min. mit Fragen" },
          { label: "Materialien", value: 3 },
          { label: "Konten", value: 144 },
        ]}
      />,
    );
    const dl = container.querySelector("dl");
    expect(dl).toHaveClass("sm:grid-cols-3");
    expect(container.querySelectorAll("dt")).toHaveLength(3);
    expect(screen.getByText("26")).toHaveClass("text-num-lg", "tabular-nums");
    expect(screen.getByText("75 Min. mit Fragen")).toHaveClass("text-caption");
  });
});

describe("MaterialList", () => {
  it("renders one stretched link per row with a named action", () => {
    render(
      <MaterialList aria-label="Material">
        <MaterialRow
          icon="deck"
          name="Deck"
          description="Pfeiltasten, P öffnet die Moderationsansicht"
          meta="HTML · EN"
          href="/workshops/datenbereitschaft-fuer-ki/slides.html"
          actionLabel="Öffnen"
          external
          hrefLang="en"
        />
        <MaterialRow
          icon="download"
          name="Readiness-Kit"
          meta="ZIP · 1,1 MB"
          href="/workshops/datenbereitschaft-fuer-ki/data-readiness-kit.zip"
          actionLabel="Laden"
          download
        />
      </MaterialList>,
    );
    const list = screen.getByRole("list", { name: "Material" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(/Öffnen: Deck/);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("hreflang", "en");
    expect(links[0]).toHaveClass("min-h-11", "after:absolute", "after:inset-0");
    expect(links[1]).toHaveAttribute("download", "");
    expect(screen.getByRole("heading", { level: 3, name: "Deck" })).toBeInTheDocument();
    expect(screen.getByText("HTML · EN")).toHaveClass("border-border");
  });
});

describe("GlobeLines and CoverBand", () => {
  it("projects the view centre to the middle and hides the far side", () => {
    const view = { centerLat: 36, centerLon: 10, radius: 500 };
    const centre = projectPoint(36, 10, view);
    expect(centre.x).toBeCloseTo(0);
    expect(centre.y).toBeCloseTo(0);
    expect(centre.visible).toBe(true);
    expect(projectPoint(-36, -170, view).visible).toBe(false);
    // North is up: Berlin sits above the centre in SVG coordinates.
    expect(projectPoint(52.5, 13.4, view).y).toBeLessThan(0);
  });

  it("draws the graticule as elliptical arcs and Germany as a closed outline", () => {
    const view = { centerLat: 36, centerLon: 10, radius: 500 };
    const graticule = graticulePath(view, 10);
    // 17 parallels and 18 great circles through the poles, one arc each at most.
    expect((graticule.match(/A/g) ?? []).length).toBeGreaterThanOrEqual(30);
    expect(graticule).not.toMatch(/NaN|Infinity/);
    const germany = outlinePath(GERMANY_OUTLINE, view);
    expect(germany).toMatch(/^M.+Z$/);
    expect(outlinePath(GERMANY_OUTLINE, { centerLat: -50, centerLon: -170, radius: 500 })).toBe("");
  });

  it("keeps the globe decorative and under about 6 KB of markup", () => {
    const markup = renderToStaticMarkup(<GlobeLines />);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('data-werk-globe-country="DE"');
    expect(markup).toContain("#f2f1ee");
    expect(markup.length).toBeLessThan(6500);
    expect(renderToStaticMarkup(<GlobeLines highlightGermany={false} />)).not.toContain("data-werk-globe-country");
  });

  it("renders the cover band as an in-flow graphit section with a hidden-on-phone globe", () => {
    const { container } = render(
      <CoverBand labelledBy="cover-title">
        <h1 id="cover-title">Sind deine Daten bereit für KI?</h1>
      </CoverBand>,
    );
    const section = container.querySelector("section");
    expect(section).toHaveClass("dark-section", "relative", "overflow-hidden");
    expect(section).toHaveAttribute("aria-labelledby", "cover-title");
    expect(screen.getByRole("region", { name: "Sind deine Daten bereit für KI?" })).toBe(section);
    const globe = container.querySelector("[data-cover-globe]");
    expect(globe).toHaveAttribute("aria-hidden", "true");
    expect(globe).toHaveClass("hidden", "md:block", "pointer-events-none");
    // The heading comes after the decorative layer in the DOM, never inside it.
    expect(globe?.querySelector("h1")).toBeNull();
    expect(section?.className).not.toMatch(/100vw|-mx-/);
  });

  it("drops the globe on request", () => {
    const { container } = render(
      <CoverBand globe={false}>
        <p>Hub</p>
      </CoverBand>,
    );
    expect(container.querySelector("[data-cover-globe]")).toBeNull();
  });
});
