import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import postcss, { type AtRule, type Container, type Declaration, type Rule } from "postcss";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WORKSHOP_PAGE_COPY } from "@/app/workshops/workshop-copy";
import { trackMaterialOpened } from "@/lib/analytics/events";
import { PLAKAT, PLAKAT_KEYS, workshopPlakat } from "@/lib/plakat/palettes";
import { getWorkshops } from "@/lib/workshops";
import { workshopStage } from "@/lib/workshop-stage";
import { ActionCards } from "./action-cards";

vi.mock("@/lib/analytics/events", () => ({ trackMaterialOpened: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(trackMaterialOpened).mockReset();
});

const CSS = readFileSync(join(__dirname, "action-cards.css"), "utf8");
const ROOT = postcss.parse(CSS);
const NO_PREFERENCE = "prefers-reduced-motion: no-preference";
const REDUCE = "prefers-reduced-motion: reduce";
const MOVING = new Set([
  "transform",
  "translate",
  "rotate",
  "scale",
  "opacity",
  "stroke-dashoffset",
  "animation-timing-function",
]);

function inside(node: Container | undefined, media: string): boolean {
  for (let parent = node; parent; parent = parent.parent as Container | undefined) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media" && (parent as AtRule).params.includes(media)) {
      return true;
    }
  }
  return false;
}

function declarations(match: (declaration: Declaration) => boolean): Declaration[] {
  const found: Declaration[] = [];
  ROOT.walkDecls((declaration) => {
    if (match(declaration)) found.push(declaration);
  });
  return found;
}

describe("<ActionCards>", () => {
  for (const locale of ["de", "en"] as const) {
    for (const workshop of getWorkshops(locale)) {
      it(`${locale}/${workshop.slug}: two cards, each one real link with the right href, name and download attribute`, () => {
        const plakat = workshopPlakat(workshop.slug)!.plakat;
        const copy = WORKSHOP_PAGE_COPY[locale].detail;
        const stage = workshopStage(workshop, locale);
        const { container } = render(<ActionCards workshop={workshop} locale={locale} plakat={plakat} />);

        const list = container.querySelector("ul[data-workshop-actions]")!;
        const items = list.querySelectorAll(":scope > li");
        expect(items).toHaveLength(2);
        const cards = [...container.querySelectorAll("[data-action-card]")];
        expect(cards.map((card) => card.getAttribute("data-action-card"))).toEqual([stage.a!.kind, stage.b!.kind]);
        for (const card of cards) {
          expect(card).toHaveClass("ac-card", `plakat-${plakat}`);
          expect(card.querySelector(".ac-pic")).toHaveAttribute("aria-hidden", "true");
          // The picture never carries a link, text or focus.
          expect(card.querySelector(".ac-pic")!.querySelectorAll("a, button, [tabindex], text")).toHaveLength(0);
        }
        expect(cards[0]).not.toHaveClass("ac-card-b");
        expect(cards[1]).toHaveClass("ac-card-b");

        // Card A.
        const linkA = within(cards[0] as HTMLElement).getByRole("link");
        expect(linkA).toHaveAttribute("href", stage.a!.href);
        expect(linkA).toHaveAttribute("hreflang", stage.a!.material.language);
        expect(linkA).toHaveAccessibleName(`${copy.stage[stage.a!.kind]}: ${workshop.topic}`);
        expect(linkA).toHaveClass("ac-link");
        if (stage.a!.material.kind === "html") {
          expect(linkA).not.toHaveAttribute("download");
          expect(linkA).not.toHaveAttribute("target");
        }
        expect(cards[0]).toHaveTextContent(stage.a!.meta);

        // Card B.
        const links = within(cards[1] as HTMLElement).getAllByRole("link");
        const linkB = links[0];
        expect(linkB).toHaveAttribute("href", stage.b!.href);
        expect(linkB).toHaveClass("ac-link");
        if (stage.b!.download) {
          // Bare download attribute: the file keeps its published name.
          expect(linkB).toHaveAttribute("download", "");
          expect(linkB).toHaveAccessibleName(
            `${copy.stage.kit}: ${workshop.topic}, ZIP, ${stage.b!.material.sizeLabel}`,
          );
        } else {
          expect(linkB).not.toHaveAttribute("download");
          expect(linkB).toHaveAccessibleName(`${copy.stage[stage.b!.kind]}: ${workshop.topic}`);
        }
        expect(cards[1]).toHaveTextContent(stage.b!.meta);

        // One small secondary link, only for a kit with a kit page.
        if (stage.b!.kitPageHref) {
          expect(links).toHaveLength(2);
          expect(links[1]).toHaveAttribute("href", stage.b!.kitPageHref);
          expect(links[1]).toHaveAccessibleName(copy.kitPageAction);
          expect(links[1]).toHaveClass("ac-secondary");
          expect(links[1]).not.toHaveAttribute("download");
          expect(within(cards[0] as HTMLElement).getAllByRole("link")).toHaveLength(1);
        } else {
          expect(links).toHaveLength(1);
        }
        // Two main links and at most one secondary: every link target reachable.
        expect(container.querySelectorAll("a")).toHaveLength(stage.b!.kitPageHref ? 3 : 2);
      });
    }
  }

  it("names the four actions in German and English", () => {
    expect(WORKSHOP_PAGE_COPY.de.detail.stage).toMatchObject({
      slides: "Folien ansehen",
      lab: "Labor öffnen",
      kit: "Kit herunterladen",
      case: "Fall ansehen",
    });
    expect(WORKSHOP_PAGE_COPY.en.detail.stage).toMatchObject({
      slides: "View the slides",
      lab: "Open the lab",
      kit: "Download the kit",
      case: "See the case",
    });
  });

  it("shows the workshop's own poster cover on the top slide, lazily and without alt text", () => {
    const workshop = getWorkshops("en").find((entry) => entry.slug === "esg-berichte-mit-ki")!;
    const { container } = render(<ActionCards workshop={workshop} locale="en" plakat={workshopPlakat(workshop.slug)!.plakat} />);
    const image = container.querySelector(".ac-frame-top img.ac-cover")!;
    expect(image).toHaveAttribute("src", "/workshops/esg-berichte-mit-ki/assets/plakat-cover.svg");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("width", "400");
    expect(image).toHaveAttribute("height", "500");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(container.querySelectorAll(".ac-frame")).toHaveLength(3);
    expect(container.querySelector(".ac-progress")).not.toBeNull();
  });

  it("draws the kit, lab and case pictures from inline SVG with the parts the brief names", () => {
    const [w01, w02] = [
      getWorkshops("en").find((entry) => entry.slug === "ki-prognosen-einschaetzen")!,
      getWorkshops("en").find((entry) => entry.slug === "geschaeftsberichte-mit-ki-lesen")!,
    ];
    const lab = render(<ActionCards workshop={w01} locale="en" plakat="lemons" />);
    expect(lab.container.querySelectorAll(".ac-pic-lab .ac-knob")).toHaveLength(1);
    expect(lab.container.querySelectorAll(".ac-pic-lab .ac-forecast")).toHaveLength(1);
    expect(lab.container.querySelectorAll(".ac-pic-case .ac-bar")).toHaveLength(3);
    expect(lab.container.querySelectorAll(".ac-pic-case .ac-marker")).toHaveLength(1);
    lab.unmount();
    const kit = render(<ActionCards workshop={w02} locale="en" plakat="idea" />);
    expect(kit.container.querySelectorAll(".ac-pic-kit .ac-chip")).toHaveLength(4);
    expect(kit.container.querySelectorAll(".ac-pic-kit .ac-flap, .ac-pic-kit .ac-box, .ac-pic-kit .ac-arrow")).toHaveLength(3);
    for (const svg of kit.container.querySelectorAll("svg.ac-svg")) {
      expect(svg).toHaveAttribute("viewBox", "0 0 256 160");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg.querySelectorAll("[id], defs, filter, linearGradient, radialGradient, text")).toHaveLength(0);
    }
  });

  it("counts a main-link open by workshop and file kind, as the old band buttons did", () => {
    const workshop = getWorkshops("en").find((entry) => entry.slug === "geschaeftsberichte-mit-ki-lesen")!;
    render(<ActionCards workshop={workshop} locale="en" plakat="idea" />);
    const link = screen.getByRole("link", { name: /^View the slides/ });
    link.addEventListener("click", (event) => event.preventDefault());
    link.click();
    expect(trackMaterialOpened).toHaveBeenCalledWith("geschaeftsberichte-mit-ki-lesen", "html");
  });
});

describe("action-cards.css", () => {
  it("keeps every animation, transition and keyframe under no-preference", () => {
    const moving = declarations((declaration) => /^(?:animation|transition)/.test(declaration.prop));
    expect(moving.length).toBeGreaterThan(10);
    for (const declaration of moving) {
      const parent = declaration.parent as Container;
      expect(inside(parent, NO_PREFERENCE) || inside(parent, REDUCE), `${(parent as Rule).selector}: ${declaration.prop}`).toBe(true);
    }
    ROOT.walkAtRules("keyframes", (rule) => {
      expect(inside(rule.parent as Container, NO_PREFERENCE), rule.params).toBe(true);
    });
  });

  it("stops everything under reduce, so the still frame is what shows", () => {
    const reduce: AtRule[] = [];
    ROOT.walkAtRules("media", (rule) => {
      if (rule.params.includes(REDUCE)) reduce.push(rule);
    });
    expect(reduce).toHaveLength(1);
    expect(reduce[0].toString()).toMatch(/animation:\s*none\s*!important/);
    expect(reduce[0].toString()).toMatch(/transition:\s*none\s*!important/);
  });

  it("moves only transform, opacity and stroke-dashoffset, and hints will-change on two parts only", () => {
    ROOT.walkAtRules("keyframes", (rule) => {
      rule.walkDecls((declaration) => {
        expect(MOVING.has(declaration.prop), `${rule.params}: ${declaration.prop}`).toBe(true);
      });
    });
    for (const declaration of declarations((d) => d.prop === "transition" && !inside(d.parent as Container, REDUCE))) {
      expect(declaration.value, declaration.value).toMatch(/^transform\b/);
    }
    const hints = declarations((declaration) => declaration.prop === "will-change");
    expect(hints).toHaveLength(1);
    expect((hints[0].parent as Rule).selectors.map((selector) => selector.trim())).toEqual([".ac-frame-top", ".ac-arrow"]);
    const rulesOnly = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rulesOnly).not.toMatch(/\bfilter\b|backdrop-filter|gradient\(|\bblur\b|box-shadow|text-shadow/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS).not.toMatch(/[–—]/);
  });

  it("has hard edges and a 2px scene-line border, card B inverted, colours from tokens only", () => {
    expect(declarations((d) => d.prop === "border-radius").every((d) => d.value === "0")).toBe(true);
    const card = ROOT.nodes.find((node) => node.type === "rule" && (node as Rule).selector === ".ac-card") as Rule;
    const decl = (rule: Rule, prop: string) => {
      let value = "";
      rule.walkDecls(prop, (d) => {
        value = d.value;
      });
      return value;
    };
    expect(decl(card, "border")).toBe("2px solid var(--color-scene-line)");
    expect(decl(card, "--ac-bg")).toBe("var(--color-scene-ground)");
    expect(decl(card, "--ac-fg")).toBe("var(--color-scene-ink)");
    const inverted = ROOT.nodes.find((node) => node.type === "rule" && (node as Rule).selector === ".ac-card.ac-card-b") as Rule;
    expect(decl(inverted, "--ac-bg")).toBe("var(--color-scene-ink)");
    expect(decl(inverted, "--ac-fg")).toBe("var(--color-scene-ground)");
    expect(declarations((d) => /^--ac-(?:fg|bg|mid)$/.test(d.prop)).every((d) => /^var\(--color-scene-(?:ink|ground|mid)\)$/.test(d.value))).toBe(true);
  });

  it("keeps a 44px target on the main link and the secondary link, and stretches the main one over the card", () => {
    expect(CSS).toMatch(/\.ac-link \{[^}]*min-height:\s*2\.75rem/s);
    expect(CSS).toMatch(/\.ac-secondary \{[^}]*min-height:\s*2\.75rem/s);
    expect(CSS).toMatch(/\.ac-link::after \{[^}]*position:\s*absolute;[^}]*inset:\s*0/s);
    expect(CSS).toMatch(/outline:\s*3px solid var\(--ac-ring\);\s*outline-offset:\s*2px/);
  });

  it("reads at 4.5:1 or more in every scene, on card A and on the inverted card B", () => {
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((at) => {
        const c = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const key of PLAKAT_KEYS) {
      const { ground, ink } = PLAKAT[key];
      const [light, dark] = [luminance(ground), luminance(ink)].sort((x, y) => y - x);
      // The pair is symmetric: ink on ground (card A) and ground on ink (card B).
      expect((light + 0.05) / (dark + 0.05), key).toBeGreaterThanOrEqual(4.5);
    }
  });
});
