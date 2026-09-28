import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BUTTON_CLASSES,
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
  PlakatBand,
  QuestionCard,
  Route,
  routeStationState,
  SectionHead,
  StatRow,
  WERK_FONT_SIZES,
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
    // Kobalt is the old site's action fill (the `ink` ButtonLink variant);
    // the other risograph blocks stay out of the primitives.
    expect(source).not.toMatch(/\bbg-brand-(?:acid|sky|pink|peach|teal)\b/);
    // No black grounds in any primitive, not even a pressed chip or a hover.
    // Ink stays for text, lines and the small route marks.
    expect(source).not.toMatch(/\b(?:aria-pressed|hover):bg-foreground\b|\bbg-(?:black|graphit|dark-bg)\b|dark-section/);
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
    expect(cx("text-poster text-scene-ink")).toBe("text-poster text-scene-ink");
  });

  it("registers every @theme type step as a font size", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const theme = css.slice(css.indexOf("@theme {"), css.indexOf("@theme static"));
    const steps = [...theme.matchAll(/^\s*--text-([a-z0-9-]+?):/gm)]
      .map((match) => match[1])
      .filter((name) => !name.includes("--"));
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(WERK_FONT_SIZES as readonly string[], step).toContain(step);
    }
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
    // The Kopflinie is the scene line: ink on paper, the scene's ink below
    // or inside a poster band. The heading keeps the foreground ink.
    expect(header).toHaveClass("border-t-2", "border-scene-line");
    expect(header).not.toHaveClass("border-foreground");
    const heading = screen.getByRole("heading", { level: 2, name: "Material" });
    expect(heading).toHaveAttribute("id", "material");
    expect(heading).toHaveClass("text-fluid-h2", "font-bold", "text-foreground");
    expect(screen.getByText("Kostenlos, ohne Konto")).toHaveClass("text-caption");
    expect(screen.getByText("Alles zum Nacharbeiten.")).toBeInTheDocument();
  });

  it("sets a compact head one step smaller below sm only", () => {
    render(<SectionHead title="Ablauf" size="compact" />);
    const heading = screen.getByRole("heading", { level: 2, name: "Ablauf" });
    expect(heading).toHaveClass("text-[1.375rem]", "sm:text-fluid-h2", "font-bold");
    expect(heading).not.toHaveClass("text-fluid-h2");
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
    expect(container.querySelector("[data-route-rail]")).toBeNull();
  });

  it("offers an opt-in phone rail inside a focusable, labelled group", () => {
    const { container } = render(
      <Route label="Ablauf" stations={stations} mode="description" layout="rail" className="mt-4" />,
    );
    const rail = screen.getByRole("group", { name: "Ablauf" });
    expect(rail).toHaveAttribute("tabindex", "0");
    expect(rail).toHaveClass("overflow-x-auto", "snap-x", "sm:overflow-visible", "mt-4");
    expect(rail.className).toMatch(/focus-visible:outline-\[3px\]/);
    // The list keeps its name and turns into the sm row from sm.
    const list = within(rail).getByRole("list", { name: "Ablauf" });
    expect(list).toHaveClass("flex", "sm:grid", "sm:grid-flow-col", "sm:auto-cols-fr");
    for (const item of within(list).getAllByRole("listitem")) {
      expect(item).toHaveClass("shrink-0", "snap-start");
    }
    // Horizontal segments at every width.
    for (const line of container.querySelectorAll("[data-route-line]")) {
      expect(line).toHaveClass("border-t-2");
      expect(line).not.toHaveClass("border-l-2");
    }
  });

  it("keeps a long route on the rail through tablet widths on request", () => {
    render(
      <Route label="Ablauf" stations={stations} mode="description" layout="rail" railUntil="lg" />,
    );
    const rail = screen.getByRole("group", { name: "Ablauf" });
    expect(rail).toHaveAttribute("data-route-rail", "lg");
    expect(rail).toHaveClass("overflow-x-auto", "sm:-mx-6", "sm:px-6", "lg:overflow-visible", "lg:mx-0");
    expect(rail).not.toHaveClass("sm:overflow-visible");
    const list = within(rail).getByRole("list", { name: "Ablauf" });
    expect(list).toHaveClass("flex", "lg:grid", "lg:auto-cols-fr");
    expect(list).not.toHaveClass("sm:grid");
    for (const item of within(list).getAllByRole("listitem")) {
      expect(item).toHaveClass("w-[9.5rem]", "lg:w-auto");
    }
  });

  it("marks the station a page mirrors in an agenda without turning it into progress", () => {
    const { container } = render(
      <Route label="Ablauf" stations={stations} mode="description" here={1} />,
    );
    const items = within(screen.getByRole("list", { name: "Ablauf" })).getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[1].querySelector("[data-route-here]")).not.toBeNull();
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
    // Solid up to the marked station, dashed from it on.
    const lines = [...container.querySelectorAll("[data-route-line]")].map((line) =>
      line.getAttribute("data-route-line"),
    );
    expect(lines).toEqual(["solid", ...lines.slice(1).map(() => "dashed")]);
    // Still an agenda: every label in ink, no state words.
    for (const item of items) {
      expect(item.querySelector("p")).toHaveClass("text-foreground");
      expect(item).not.toHaveTextContent(/erledigt|aktuell|offen/);
    }
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

  it("sets the sky tone as the pastel sheet, never a graphit ground", () => {
    const { container } = render(<QuestionCard tone="sky" question="Zeige den MRR." />);
    const figure = container.querySelector("figure");
    expect(figure).toHaveClass("border-foreground", "bg-sky-sheet");
    expect(figure?.className).not.toMatch(/dark-section|dark-bg|bg-foreground/);
    expect(container.querySelector("[data-question-card-bar]")).toHaveClass("bg-mennige");
  });

  it("tightens only below sm in the compact density", () => {
    const { container } = render(<QuestionCard tone="sky" density="compact" question="Zeige den MRR." />);
    const figure = container.querySelector("figure");
    expect(figure).toHaveClass("py-3.5", "pl-5", "sm:py-5", "sm:pl-7", "bg-sky-sheet");
    expect(figure).not.toHaveClass("py-5");
    expect(container.querySelector('[data-pictogram="question"]')).toHaveClass("size-6", "sm:size-10");
    expect(container.querySelector("blockquote")).toHaveClass("text-[1.0625rem]", "sm:text-[1.375rem]");
    // The default stays as reviewed.
    const { container: plain } = render(<QuestionCard question="Zeige den MRR." />);
    expect(plain.querySelector("figure")).toHaveClass("py-5", "pl-7");
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

  it("fills the ink variant with the old site's Kobalt, never black", () => {
    render(
      <ButtonLink href="/x" variant="ink">
        Deck öffnen
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Deck öffnen" });
    expect(link).toHaveClass("bg-brand-cobalt", "text-paper", "min-h-11");
    expect(link.className).not.toMatch(/\bbg-(?:foreground|black|dark-bg)\b|hover:bg-muted-foreground/);
    // The graphit tone is retired with the graphit band.
    expect(Object.keys(BUTTON_CLASSES)).toEqual(["paper", "scene"]);
  });

  it("renders the scene tone as the one strong pair of a poster band", () => {
    render(
      <div className="plakat-autumn">
        <ButtonLink href="/workshops/esg-berichte-mit-ki/slides.html" tone="scene">
          Deck öffnen
        </ButtonLink>
        <ButtonLink href="/workshops/esg-berichte-mit-ki/demo.html" tone="scene" variant="secondary">
          Demo starten
        </ButtonLink>
      </div>,
    );
    const primary = screen.getByRole("link", { name: "Deck öffnen" });
    // The scene's button fill and label, a 2px edge in the fill, 48px tall,
    // 17px for the Rost floor. Never a scene-ink fill: Bloom's Aubergine ink
    // reads as a black button.
    expect(primary).toHaveClass(
      "min-h-12",
      "border-2",
      "border-scene-button",
      "bg-scene-button",
      "text-scene-button-text",
      "text-[1.0625rem]",
      "font-semibold",
    );
    expect(primary).not.toHaveClass("bg-scene-ink");
    expect(primary).not.toHaveClass("min-h-11");
    expect(primary).not.toHaveClass("text-[0.9375rem]");
    const secondary = screen.getByRole("link", { name: "Demo starten" });
    expect(secondary).toHaveClass("min-h-12", "border-2", "border-scene-ink", "bg-transparent", "text-scene-ink");
    // Hover fills with the button pair instead of tinting it.
    expect(secondary).toHaveClass("hover:bg-scene-button", "hover:text-scene-button-text");
    expect(secondary).not.toHaveClass("hover:bg-scene-ink");
  });

  it("keeps every scene recipe free of Mennige, paper text, tints and alpha on scene colours", () => {
    for (const [variant, classes] of Object.entries(BUTTON_CLASSES.scene)) {
      expect(classes, variant).not.toMatch(/\b(?:bg|text|border)-(?:mennige|kupfer|brand-orange|paper|white)\b/);
      expect(classes, variant).not.toMatch(/hover:bg-(?!scene-button\b)/);
      // No scene-ink fill at rest or on hover: a dark ink reads as black.
      expect(classes, variant).not.toMatch(/(?:^|\s|:)bg-scene-ink\b/);
      expect(classes, variant).not.toMatch(/scene-[a-z-]+\/\d/);
      expect(classes, variant).toMatch(/\bmin-h-1[12]\b/);
      expect(classes, variant).toContain("text-[1.0625rem]");
      expect(classes, variant).toContain("motion-reduce:transition-none");
    }
    for (const variant of ["primary", "ink", "secondary"] as const) {
      expect(BUTTON_CLASSES.scene[variant]).toMatch(/\bmin-h-12\b/);
      expect(BUTTON_CLASSES.scene[variant]).toMatch(/\bborder-2\b/);
    }
    expect(BUTTON_CLASSES.scene.text).toMatch(/\bmin-h-11\b/);
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
    // Values take the scene line (ink on paper, the scene's ink below a band).
    expect(screen.getByText("26")).toHaveClass("text-num-lg", "tabular-nums", "text-scene-line");
    expect(screen.getByText("Szenen")).toHaveClass("text-label", "text-muted-foreground");
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
    // Ink strokes at low opacity (currentColor, the text ink): the old line
    // globe on paper, never the paper strokes of a graphit band.
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).not.toContain("#f2f1ee");
    expect(markup.length).toBeLessThan(6500);
    expect(renderToStaticMarkup(<GlobeLines highlightGermany={false} />)).not.toContain("data-werk-globe-country");
  });

  it("renders the cover band as an in-flow paper section with a hidden-on-phone globe", () => {
    const { container } = render(
      <CoverBand labelledBy="cover-title">
        <h1 id="cover-title">Sind deine Daten bereit für KI?</h1>
      </CoverBand>,
    );
    const section = container.querySelector("section");
    expect(section).toHaveClass("bg-paper", "text-foreground", "relative", "overflow-hidden");
    expect(section).not.toHaveClass("dark-section");
    expect(section).toHaveAttribute("aria-labelledby", "cover-title");
    expect(screen.getByRole("region", { name: "Sind deine Daten bereit für KI?" })).toBe(section);
    const globe = container.querySelector("[data-cover-globe]");
    expect(globe).toHaveAttribute("aria-hidden", "true");
    expect(globe).toHaveClass("hidden", "md:block", "pointer-events-none");
    // The heading comes after the decorative layer in the DOM, never inside it.
    expect(globe?.querySelector("h1")).toBeNull();
    expect(section?.className).not.toMatch(/100vw|-mx-/);
  });

  it("scopes the poster band that supersedes it to its scene (SPEC §3.1, §8.1)", () => {
    for (const plakat of ["lemons", "idea", "bloom", "autumn"] as const) {
      const { container } = render(
        <PlakatBand plakat={plakat} labelledBy={`band-${plakat}`}>
          <h1 id={`band-${plakat}`}>Titel</h1>
        </PlakatBand>,
      );
      const section = container.querySelector("section");
      expect(section).toHaveClass(`plakat-${plakat}`, "relative", "isolate", "overflow-hidden");
      expect(section).not.toHaveClass("dark-section");
      expect(section).toHaveAttribute("data-cover-band", "");
    }
  });

  it("drops the globe on request", () => {
    const { container } = render(
      <CoverBand globe={false}>
        <p>Hub</p>
      </CoverBand>,
    );
    expect(container.querySelector("[data-cover-globe]")).toBeNull();
  });

  it("adds a cropped phone globe only on request", () => {
    const { container, rerender } = render(
      <CoverBand>
        <p>Hub</p>
      </CoverBand>,
    );
    expect(container.querySelector("[data-cover-globe-phone]")).toBeNull();
    rerender(
      <CoverBand phoneGlobe>
        <p>Hub</p>
      </CoverBand>,
    );
    const phone = container.querySelector("[data-cover-globe-phone]");
    expect(phone).toHaveAttribute("aria-hidden", "true");
    expect(phone).toHaveClass("md:hidden", "pointer-events-none", "-z-10");
    // The Germany trace sits beside the short kicker row, above the H1.
    expect(phone).toHaveClass("-top-24");
  });
});
