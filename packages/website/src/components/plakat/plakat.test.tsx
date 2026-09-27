import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { render, screen, within } from "@testing-library/react";
import postcss from "postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import {
  CORNER_DOTS,
  motifShapes,
  numeralLayout,
  posterComposition,
  RETIRED_MOTIFS,
  type PosterFormat,
  type PosterNode,
  type PosterViewport,
} from "@/lib/plakat/motifs";
import { OG_PAPER, OgColophon, OgPoster } from "@/lib/plakat/og";
import {
  COURSE_PLAKAT,
  MOTIF_IDS,
  PLAKAT,
  PLAKAT_KEYS,
  WORKSHOP_PLAKAT,
  type MotifId,
  type PlakatKey,
} from "@/lib/plakat/palettes";
import { posterSvg, posterSvgDataUri } from "@/lib/plakat/poster-svg";
import {
  BOLD_ADVANCES,
  BOLD_FIGURE_INK,
  BOLD_KERNING,
  REGULAR_FIGURE_ADVANCES,
  REGULAR_FIGURE_INK,
  REGULAR_FIGURE_KERNING,
  UNITS_PER_EM,
} from "@/lib/plakat/type-metrics";
import {
  CapsLine,
  CornerDots,
  Halftone,
  PlakatBand,
  PosterArt,
  PosterCover,
  PosterNumeral,
  PosterThumb,
  ResultChart,
  type ResultChartData,
} from "./index";
import * as werk from "@/components/werk";
import { ButtonLink } from "@/components/werk/button-link";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";

const PLAKAT_DIR = __dirname;
const WEBSITE = join(PLAKAT_DIR, "..", "..", "..");
const SRC = join(WEBSITE, "src");
const productionSources = readdirSync(PLAKAT_DIR)
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
  .map((file) => ({ file, source: readFileSync(join(PLAKAT_DIR, file), "utf8") }));
const FORMATS: readonly PosterFormat[] = ["portrait", "landscape", "strip"];
const ROLE_CLASSES = new Set(["fill-scene-ground", "fill-scene-ink", "fill-scene-mid"]);

// ─── Geometry helpers: sample SVG paths, place figure ink ─────────────────

type Point = readonly [number, number];
type Box = readonly [left: number, top: number, right: number, bottom: number];

/** Points along a path (M, L, H, V, C, Q, A, Z; absolute and relative), every unit or so. */
function samplePath(d: string): Point[][] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const subpaths: Point[][] = [];
  let points: Point[] = [];
  let index = 0;
  let command = "";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const next = () => Number(tokens[index++]);
  const line = (x2: number, y2: number) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x, y2 - y)));
    for (let step = 1; step <= steps; step++) points.push([x + ((x2 - x) * step) / steps, y + ((y2 - y) * step) / steps]);
    x = x2;
    y = y2;
  };
  const curve = (at: (t: number) => Point, length: number) => {
    const steps = Math.max(8, Math.ceil(length));
    for (let step = 1; step <= steps; step++) points.push(at(step / steps));
    [x, y] = at(1);
  };
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++];
    const relativeCommand = command === command.toLowerCase();
    const ox = relativeCommand ? x : 0;
    const oy = relativeCommand ? y : 0;
    switch (command.toUpperCase()) {
      case "M": {
        if (points.length) subpaths.push(points);
        x = ox + next();
        y = oy + next();
        startX = x;
        startY = y;
        points = [[x, y]];
        command = relativeCommand ? "l" : "L";
        break;
      }
      case "L":
        line(ox + next(), oy + next());
        break;
      case "H":
        line(ox + next(), y);
        break;
      case "V":
        line(x, oy + next());
        break;
      case "C": {
        const [x0, y0] = [x, y];
        const [x1, y1, x2, y2, x3, y3] = [ox + next(), oy + next(), ox + next(), oy + next(), ox + next(), oy + next()];
        curve((t) => {
          const u = 1 - t;
          return [
            u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
            u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
          ];
        }, Math.hypot(x3 - x0, y3 - y0) * 1.6);
        break;
      }
      case "Q": {
        const [x0, y0] = [x, y];
        const [x1, y1, x2, y2] = [ox + next(), oy + next(), ox + next(), oy + next()];
        curve((t) => {
          const u = 1 - t;
          return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2];
        }, Math.hypot(x2 - x0, y2 - y0) * 1.6);
        break;
      }
      case "A": {
        let rx = Math.abs(next());
        let ry = Math.abs(next());
        const phi = (next() * Math.PI) / 180;
        const largeArc = next() === 1;
        const sweep = next() === 1;
        const [x1, y1, x2, y2] = [x, y, ox + next(), oy + next()];
        // SVG 1.1 appendix F.6.5: endpoint to centre parameterisation.
        const cos = Math.cos(phi);
        const sin = Math.sin(phi);
        const dx = (x1 - x2) / 2;
        const dy = (y1 - y2) / 2;
        const px = cos * dx + sin * dy;
        const py = -sin * dx + cos * dy;
        const lambda = (px * px) / (rx * rx) + (py * py) / (ry * ry);
        if (lambda > 1) {
          rx *= Math.sqrt(lambda);
          ry *= Math.sqrt(lambda);
        }
        const sign = largeArc === sweep ? -1 : 1;
        const numerator = rx * rx * ry * ry - rx * rx * py * py - ry * ry * px * px;
        const coefficient = sign * Math.sqrt(Math.max(0, numerator / (rx * rx * py * py + ry * ry * px * px)));
        const cxp = (coefficient * rx * py) / ry;
        const cyp = (-coefficient * ry * px) / rx;
        const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
        const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
        const angle = (ux: number, uy: number, vx: number, vy: number) =>
          Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        const theta = angle(1, 0, (px - cxp) / rx, (py - cyp) / ry);
        let delta = angle((px - cxp) / rx, (py - cyp) / ry, (-px - cxp) / rx, (-py - cyp) / ry);
        if (!sweep && delta > 0) delta -= 2 * Math.PI;
        if (sweep && delta < 0) delta += 2 * Math.PI;
        curve((t) => {
          const a = theta + t * delta;
          return [cos * rx * Math.cos(a) - sin * ry * Math.sin(a) + cx, sin * rx * Math.cos(a) + cos * ry * Math.sin(a) + cy];
        }, Math.abs(delta) * Math.max(rx, ry));
        break;
      }
      case "Z":
        line(startX, startY);
        break;
      default:
        throw new Error(`Unsupported path command ${command}`);
    }
  }
  if (points.length) subpaths.push(points);
  return subpaths;
}

/** Apply "translate(x y) rotate(deg)" (the only transforms motifs use). */
function transformPoint([px, py]: Point, transform?: string): Point {
  if (!transform) return [px, py];
  const translate = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(transform);
  const rotate = /rotate\(([-\d.]+)\)/.exec(transform);
  const angle = rotate ? (Number(rotate[1]) * Math.PI) / 180 : 0;
  const rx = px * Math.cos(angle) - py * Math.sin(angle);
  const ry = px * Math.sin(angle) + py * Math.cos(angle);
  return [rx + Number(translate?.[1] ?? 0), ry + Number(translate?.[2] ?? 0)];
}

/** Map a point through a nested viewport (meet, exact aspect, as motifs.ts builds them). */
function throughViewport([px, py]: Point, viewport: PosterViewport): Point {
  const [vx, vy, vw, vh] = viewport.viewBox.split(" ").map(Number);
  const scale = Math.min(Number(viewport.width) / vw, Number(viewport.height) / vh);
  return [Number(viewport.x) + (px - vx) * scale, Number(viewport.y) + (py - vy) * scale];
}

/** Every shape of a composition in canvas units, with its role. Strip canvases are taken at their 400-unit width. */
function placedShapes(composition: ReturnType<typeof posterComposition>): { role: string; outline: Point[][] }[] {
  const out: { role: string; outline: Point[][] }[] = [];
  const walk = (node: PosterNode, maps: PosterViewport[]) => {
    if (node.kind === "shapes") {
      for (const shape of node.shapes) {
        if (shape.d.startsWith("M-2000")) continue; // the oversized ground
        const outline = samplePath(shape.d).map((subpath) =>
          subpath.map((point) =>
            maps.reduceRight((current, viewport) => throughViewport(current, viewport), transformPoint(point, shape.transform)),
          ),
        );
        out.push({ role: shape.role, outline });
      }
    } else if (node.kind === "viewport") {
      // The strip's full-size anchoring canvas is the identity at 400 units.
      const identity = node.viewport.width === "100%";
      for (const child of node.children) walk(child, identity ? maps : [...maps, node.viewport]);
    }
  };
  for (const node of composition.children) walk(node, []);
  return out;
}

/** The numeral's ink as boxes: figures of its weight from the measured ink bands, pen advanced as Chromium sets SVG text. */
function numeralInk(composition: ReturnType<typeof posterComposition>): { boxes: Box[]; fontSize: number } | null {
  const find = (nodes: readonly PosterNode[]): Extract<PosterNode, { kind: "numeral" }> | null => {
    for (const node of nodes) {
      if (node.kind === "numeral") return node;
      if (node.kind === "viewport") {
        const found = find(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  const numeral = find(composition.children);
  if (!numeral) return null;
  const { x, y, fontSize, letterSpacing, fontWeight } = numeral.layout;
  const [advances, kerning, figureInk] =
    fontWeight === 400
      ? [REGULAR_FIGURE_ADVANCES, REGULAR_FIGURE_KERNING, REGULAR_FIGURE_INK]
      : [BOLD_ADVANCES, BOLD_KERNING, BOLD_FIGURE_INK];
  const scale = fontSize / UNITS_PER_EM;
  const boxes: Box[] = [];
  let pen = x;
  const figures = [...numeral.text];
  figures.forEach((figure, index) => {
    if (index > 0) pen += (kerning[figures[index - 1] + figure] ?? 0) * scale;
    for (const [top, bottom, left, right] of figureInk[figure]) {
      boxes.push([pen + left * scale, y + top * scale, pen + right * scale, y + bottom * scale]);
    }
    pen += advances[figure] * scale + letterSpacing;
  });
  return { boxes, fontSize };
}

function distanceToBox([px, py]: Point, [left, top, right, bottom]: Box): number {
  const dx = Math.max(left - px, 0, px - right);
  const dy = Math.max(top - py, 0, py - bottom);
  return Math.hypot(dx, dy);
}

function insidePolygon([px, py]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Smallest distance between the numeral's ink and the shapes of a role, 0 on overlap. */
function clearance(composition: ReturnType<typeof posterComposition>, role: string): number {
  const ink = numeralInk(composition);
  if (!ink) return Infinity;
  let smallest = Infinity;
  for (const shape of placedShapes(composition).filter((candidate) => candidate.role === role)) {
    for (const subpath of shape.outline) {
      for (const box of ink.boxes) {
        const corners: Point[] = [
          [box[0], box[1]],
          [box[2], box[1]],
          [box[0], box[3]],
          [box[2], box[3]],
        ];
        if (corners.some((corner) => insidePolygon(corner, subpath))) return 0;
        for (const point of subpath) smallest = Math.min(smallest, distanceToBox(point, box));
      }
    }
  }
  return smallest;
}

// ─── Rendering helpers ──────────────────────────────────────────────────────

function renderPoster(plakat: PlakatKey, motif: MotifId, numeral: string | null, format: PosterFormat) {
  const { container } = render(<PosterArt plakat={plakat} motif={motif} numeral={numeral} format={format} />);
  const svg = container.querySelector("svg[data-poster]");
  if (!svg) throw new Error("no poster");
  return svg;
}

const POSTERS = [
  ...Object.entries(WORKSHOP_PLAKAT).map(([slug, entry], index) => ({
    id: slug,
    plakat: entry.plakat as PlakatKey,
    motif: entry.motif as MotifId,
    numeral: `0${index + 1}`,
  })),
  ...Object.entries(COURSE_PLAKAT).map(([id, entry]) => ({
    id,
    plakat: entry.plakat as PlakatKey,
    motif: entry.motif as MotifId,
    numeral: entry.numeral as string | null,
  })),
];

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("plakat primitives: source contract", () => {
  it.each(productionSources)("$file stays square, flat, server-safe and token-only", ({ source }) => {
    expect(source).not.toMatch(/\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/);
    expect(source).not.toMatch(/\bshadow-/);
    expect(source).not.toMatch(/\buppercase\b/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/tracking-\[-0\.0[2-9]/);
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source).not.toMatch(/\b100vw\b/);
    expect(source).not.toMatch(/[\u2013\u2014]/);
    // Colours come from tokens; raw hex lives in globals.css and palettes.ts.
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    // Never an /alpha on a scene colour: Tailwind's fallback would use the :root hex.
    expect(source).not.toMatch(/\b(?:bg|text|border|fill|stroke|decoration|outline|ring)-scene-[a-z-]+\/\d/);
    // No gradients or blur on posters. The chart hatch is a hard-stop
    // repeating pattern, not a fade.
    expect(source).not.toMatch(/\bbg-gradient|\bbg-linear-|(?<!repeating-)linear-gradient|radial-gradient|\bblur-/);
  });

  it("keeps the geometry free of retired UI-icon motifs", () => {
    const motifsSource = readFileSync(join(SRC, "lib/plakat/motifs.ts"), "utf8");
    for (const retired of RETIRED_MOTIFS) {
      expect(MOTIF_IDS as readonly string[]).not.toContain(retired);
      expect(motifsSource).not.toMatch(new RegExp(`\\b${retired}:\\s*\\(`));
    }
  });
});

describe("PosterArt", () => {
  it.each(MOTIF_IDS)("draws %s in the three role classes only, in every format", (motif) => {
    for (const plakat of PLAKAT_KEYS) {
      for (const format of FORMATS) {
        const svg = renderPoster(plakat, motif, "01", format);
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg).toHaveAttribute("focusable", "false");
        expect(svg).toHaveClass(`plakat-${plakat}`);
        const paths = svg.querySelectorAll("path");
        expect(paths.length).toBeGreaterThan(1);
        for (const path of paths) {
          const classes = path.getAttribute("class")?.split(" ") ?? [];
          expect(classes, `${motif} ${format}`).toHaveLength(1);
          expect(ROLE_CLASSES.has(classes[0]), `${motif} ${format}: ${classes[0]}`).toBe(true);
          expect(path.hasAttribute("fill")).toBe(false);
          expect(path.hasAttribute("stroke")).toBe(false);
        }
        expect(svg.querySelector("linearGradient, radialGradient, filter, image, foreignObject")).toBeNull();
      }
    }
  });

  it("carries the numeral with its ground keyline, in the palette's weight and role", () => {
    for (const plakat of PLAKAT_KEYS) {
      for (const format of FORMATS) {
        const svg = renderPoster(plakat, "disc", "03", format);
        const numeral = svg.querySelector("text[data-poster-numeral-text]");
        expect(numeral?.textContent).toBe("03");
        const layout = numeralLayout(plakat, format);
        expect(numeral).toHaveAttribute("paint-order", "stroke fill");
        expect(numeral).toHaveAttribute("stroke-width", String(layout.keyline));
        expect(layout.keyline).toBeCloseTo(layout.fontSize * 0.05, 1);
        expect(numeral).toHaveClass("stroke-scene-ground", PLAKAT[plakat].numRole === "mid" ? "fill-scene-mid" : "fill-scene-ink");
        expect(numeral).toHaveAttribute("font-weight", String(PLAKAT[plakat].numWeight));
        const tracking = PLAKAT[plakat].numWeight === 400 ? -0.05 : -0.065;
        expect(Number(numeral?.getAttribute("letter-spacing"))).toBeCloseTo(tracking * layout.fontSize, 0);
      }
    }
    expect(renderPoster("autumn", "leaves", "04", "portrait").querySelector("text")).toHaveAttribute("font-weight", "400");
  });

  it("draws no numeral where there is no sequence (SPEC D9)", () => {
    for (const [id, entry] of Object.entries(COURSE_PLAKAT)) {
      const svg = renderPoster(entry.plakat, entry.motif, entry.numeral, "portrait");
      expect(svg.querySelector("text") !== null, id).toBe(entry.numeral !== null);
    }
    const technical = Object.values(COURSE_PLAKAT).filter((entry) => entry.plakat !== "lemons");
    expect(technical.length).toBe(6);
    expect(technical.every((entry) => entry.numeral === null)).toBe(true);
  });

  it("sets the IDEA corner dots on portrait and landscape posters, never on a strip", () => {
    const count = (svg: Element) => svg.querySelectorAll("path").length;
    const base = motifShapes("pie").length + 1; // shapes plus the ground
    expect(count(renderPoster("idea", "pie", null, "portrait"))).toBe(base + CORNER_DOTS.length);
    expect(count(renderPoster("idea", "pie", null, "landscape"))).toBe(base + 4);
    expect(count(renderPoster("idea", "pie", null, "strip"))).toBe(base);
    expect(count(renderPoster("lemons", "fan", null, "portrait"))).toBe(motifShapes("fan").length + 1);
    const { container } = render(<PosterArt plakat="idea" motif="pie" cornerDots={false} />);
    expect(container.querySelectorAll("path")).toHaveLength(base);
  });

  it("keeps every poster three colours: ground, ink and mid", () => {
    for (const poster of POSTERS) {
      const svg = posterSvg({ plakat: poster.plakat, motif: poster.motif, numeral: poster.numeral });
      const fills = new Set([...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((match) => match[1]));
      const { ground, ink, mid } = PLAKAT[poster.plakat];
      const roles: readonly string[] = [ground, ink, mid];
      expect([...fills].every((fill) => roles.includes(fill)), poster.id).toBe(true);
    }
  });

  it("holds the Himbeere numeral at least 0.12em from every Kobalt shape (SPEC §3.5)", () => {
    const idea = POSTERS.filter((poster) => poster.plakat === "idea" && poster.numeral);
    expect(idea.map((poster) => poster.id)).toEqual(["geschaeftsberichte-mit-ki-lesen"]);
    for (const poster of idea) {
      for (const format of FORMATS) {
        const composition = posterComposition({ ...poster, format });
        const ink = numeralInk(composition);
        const gap = clearance(composition, "ink");
        expect(gap, `${poster.id} ${format}: ${gap.toFixed(1)} units`).toBeGreaterThanOrEqual(0.12 * (ink?.fontSize ?? 0));
      }
    }
  });

  it("holds every numeral, bold and the light autumn 04, inside the 4.5% margin", () => {
    // A numeral may cross a shape (bloom's "03" over the sun, 4.24:1): the
    // keyline cuts the gap. Only Himbeere against Kobalt needs clearance.
    const numbered = POSTERS.filter((candidate) => candidate.numeral);
    expect(new Set(numbered.map((poster) => PLAKAT[poster.plakat].numWeight))).toEqual(new Set([400, 700]));
    for (const poster of numbered) {
      for (const format of ["portrait", "landscape"] as const) {
        const ink = numeralInk(posterComposition({ ...poster, format }));
        if (!ink) throw new Error("no numeral");
        const width = format === "portrait" ? 400 : 800;
        const left = Math.min(...ink.boxes.map((box) => box[0]));
        const top = Math.min(...ink.boxes.map((box) => box[1]));
        expect(left, `${poster.id} ${format}`).toBeGreaterThanOrEqual(width * 0.045);
        expect(top, `${poster.id} ${format}`).toBeGreaterThanOrEqual(width * 0.045);
      }
    }
  });

  it("lets every portrait motif bleed off at least one edge", () => {
    // The EU AI Act ring of twelve is whole by design in the reference
    // geometry (spec-work/plakat-motifs.mjs); every other motif is cut.
    for (const motif of MOTIF_IDS.filter((id) => id !== "ring")) {
      const composition = posterComposition({ plakat: "lemons", motif, cornerDots: false });
      const points = placedShapes(composition).flatMap((shape) => shape.outline.flat());
      const bleeds =
        points.some(([x]) => x <= 0.5 || x >= 399.5) || points.some(([, y]) => y <= 0.5 || y >= 499.5);
      expect(bleeds, motif).toBe(true);
    }
  });

  it("never cuts a workshop motif at the strip's top edge, which sits inside the band", () => {
    for (const { motif } of Object.values(WORKSHOP_PLAKAT)) {
      const composition = posterComposition({ plakat: "lemons", motif, format: "strip" });
      const top = Math.min(...placedShapes(composition).flatMap((shape) => shape.outline.flat().map(([, y]) => y)));
      expect(top, motif).toBeGreaterThan(0);
    }
  });
});

describe("PosterThumb and PosterCover", () => {
  it("renders a decorative 4:5 poster box in the named size", () => {
    const { container } = render(
      <>
        <PosterThumb plakat="lemons" motif="disc" numeral="01" size="xs" />
        <PosterThumb plakat="idea" motif="quarter" size="sm" />
        <PosterThumb plakat="bloom" motif="slab" />
        <PosterCover plakat="autumn" motif="leaves" numeral="04" />
      </>,
    );
    const thumbs = container.querySelectorAll("[data-poster-thumb]");
    expect(thumbs).toHaveLength(4);
    expect(thumbs[0]).toHaveClass("w-16", "aspect-[4/5]");
    expect(thumbs[1]).toHaveClass("w-[4.5rem]", "sm:w-20", "lg:w-24");
    expect(thumbs[2]).toHaveClass("w-20");
    expect(thumbs[3]).toHaveClass("w-full");
    for (const thumb of thumbs) {
      expect(thumb).toHaveAttribute("aria-hidden", "true");
      expect(thumb.querySelector("[tabindex], a, button, img")).toBeNull();
    }
    expect(thumbs[3].querySelector("svg")).toHaveClass("plakat-autumn");
    expect(thumbs[3].querySelector("text")?.textContent).toBe("04");
    // Kreide on Kalkweiß is 1.05:1: only the IDEA poster draws a Kobalt edge.
    expect(thumbs[1]).toHaveClass("after:border", "after:border-kobalt");
    for (const index of [0, 2, 3]) expect(thumbs[index]?.className).not.toContain("after:border");
  });

  it("gives the four workshops four distinct scenes", () => {
    const { container } = render(
      <>
        {Object.values(WORKSHOP_PLAKAT).map((entry, index) => (
          <PosterCover key={entry.motif} plakat={entry.plakat} motif={entry.motif} numeral={`0${index + 1}`} />
        ))}
      </>,
    );
    const scenes = [...container.querySelectorAll("svg[data-poster]")].map((svg) => svg.getAttribute("data-poster"));
    expect(new Set(scenes).size).toBe(4);
  });
});

describe("PlakatBand", () => {
  it("scopes the band to its scene and keeps the cover hooks", () => {
    render(
      <PlakatBand
        plakat="autumn"
        labelledBy="band-title"
        art={<PosterNumeral value={4} plakat="autumn" />}
        artPhone={<PosterNumeral value={4} plakat="autumn" format="strip" />}
      >
        <CapsLine>Workshops · 4 Fälle</CapsLine>
        <h1 id="band-title" className="poster-title">
          Workshops mit Fall und Vorlage.
        </h1>
      </PlakatBand>,
    );
    const band = screen.getByRole("region", { name: "Workshops mit Fall und Vorlage." });
    expect(band.tagName).toBe("SECTION");
    expect(band).toHaveClass("plakat-autumn", "relative", "isolate", "overflow-hidden");
    expect(band).toHaveAttribute("data-cover-band", "");
    expect(band).toHaveAttribute("data-plakat", "autumn");
    const art = band.querySelector("[data-plakat-art]");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art).toHaveClass("hidden", "lg:block", "w-[min(36vw,30rem)]");
    const phone = band.querySelector("[data-plakat-art-phone]");
    expect(phone).toHaveAttribute("aria-hidden", "true");
    expect(phone).toHaveClass("h-32", "lg:hidden", "pl-4", "sm:pl-6");
    const content = band.querySelector(".\\@container");
    expect(content).toHaveClass("lg:pr-[calc(min(36vw,30rem)+3rem)]", "max-w-[75rem]");
    // The H1 never sits under the art: art is outside the content column.
    expect(content?.contains(art)).toBe(false);
  });

  it("marks the band's own corners with the IDEA dots on request", () => {
    const { container } = render(
      <PlakatBand plakat="idea" cornerDots>
        <p>Text</p>
      </PlakatBand>,
    );
    const band = container.querySelector("section");
    const dots = band?.querySelectorAll(":scope > svg[data-corner-dots]") ?? [];
    expect(dots).toHaveLength(4);
    for (const dot of dots) expect(dot).not.toHaveClass("hidden");
    expect(band?.querySelector(".\\@container svg[data-corner-dots]")).toBeNull();
    // The top dots end 20px down; the caps line starts 36px down on phones.
    expect(band?.querySelector(".\\@container")).toHaveClass("pt-9", "sm:pt-10", "lg:py-16");
    expect(band?.querySelector(".\\@container")).not.toHaveClass("pt-5");
    const { container: plain } = render(
      <PlakatBand plakat="idea">
        <p>Text</p>
      </PlakatBand>,
    );
    expect(plain.querySelector("svg[data-corner-dots]")).toBeNull();
  });

  it("keeps the bottom band dots off a phone strip numeral (no \".02\")", () => {
    const { container } = render(
      <PlakatBand
        plakat="idea"
        cornerDots
        art={<PosterArt plakat="idea" motif="pie" numeral="02" format="portrait" cornerDots={false} />}
        artPhone={<PosterArt plakat="idea" motif="pie" numeral="02" format="strip" />}
      >
        <p>Text</p>
      </PlakatBand>,
    );
    const band = container.querySelector("section") as HTMLElement;
    const dots = [...band.querySelectorAll(":scope > svg[data-corner-dots]")];
    expect(dots.map((dot) => dot.getAttribute("data-corner"))).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
    for (const dot of dots) {
      const bottom = dot.getAttribute("data-corner")?.startsWith("bottom");
      // Below lg a bottom dot would sit on the strip's baseline; from lg the strip is gone.
      if (bottom) expect(dot).toHaveClass("hidden", "lg:block");
      else expect(dot).not.toHaveClass("hidden");
    }
  });

  it("puts a spacer in place of the phone art when there is none", () => {
    const { container } = render(
      <PlakatBand plakat="idea">
        <p>Text</p>
      </PlakatBand>,
    );
    const band = container.querySelector("section");
    expect(band?.querySelector("[data-plakat-art], [data-plakat-art-phone]")).toBeNull();
    expect(band?.lastElementChild).toHaveClass("h-6", "lg:hidden");
    expect(band?.querySelector(".\\@container")).not.toHaveClass("lg:pr-[calc(min(36vw,30rem)+3rem)]");
    expect(band?.querySelector(".\\@container")).toHaveClass("pt-5", "sm:pt-10");
  });

  it("is re-exported from the Werkzeichnung kit", () => {
    for (const name of [
      "PlakatBand",
      "PosterArt",
      "PosterThumb",
      "PosterCover",
      "PosterNumeral",
      "CapsLine",
      "CornerDots",
      "Halftone",
      "ResultChart",
    ]) {
      expect(werk, name).toHaveProperty(name);
    }
  });
});

describe("CapsLine, CornerDots, PosterNumeral and Halftone", () => {
  it("renders the caps line from sentence-case DOM text, with an optional hairline arrow", () => {
    const { container } = render(
      <div className="plakat-idea">
        <CapsLine arrow>Praxisbeispiele · im Browser</CapsLine>
      </div>,
    );
    // Each " · " part is its own unbreakable run, so the line is read whole.
    const caps = container.querySelector(".plakat-caps");
    expect(caps?.textContent).toBe("Praxisbeispiele · im Browser");
    // A line breaks only between parts; the dot opens its part, so a wrapped
    // part's dot sits in the clipped start box, never at a line end.
    expect(
      Array.from(caps?.querySelectorAll(".whitespace-nowrap") ?? [], (part) => part.textContent),
    ).toEqual(["Praxisbeispiele", " · im Browser"]);
    const arrow = caps?.querySelector("svg[data-caps-arrow]");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveAttribute("width", "64");
    expect(arrow?.querySelector("path")).toHaveAttribute("stroke-width", "1.5");
    expect(arrow).toHaveClass("stroke-scene-ink");
  });

  it("sets .plakat-caps only inside a scene (SPEC §8.3)", () => {
    const users = sourceFiles(SRC).filter(
      (file) =>
        !file.includes("/components/plakat/") &&
        /\bplakat-caps\b|<CapsLine\b/.test(readFileSync(file, "utf8")) &&
        !file.endsWith(".css") &&
        !/\.test\.tsx?$/.test(file),
    );
    for (const file of users) {
      const source = readFileSync(file, "utf8");
      expect(
        /<PlakatBand\b|plakatClass\(|\bplakat-(?:lemons|idea|bloom|autumn)\b|data-plakat-band/.test(source),
        `${relative(WEBSITE, file)} sets a caps line outside a scene`,
      ).toBe(true);
    }
    const { container } = render(
      <PlakatBand plakat="bloom">
        <CapsLine>Workshop 03 · Daten</CapsLine>
      </PlakatBand>,
    );
    expectCapsInsideScene(container);
    const { container: paper } = render(
      <section>
        <CapsLine>Workshop 03 · Daten</CapsLine>
      </section>,
    );
    expect(() => expectCapsInsideScene(paper)).toThrow(/outside a scene/);
  });

  it("draws the band's four corner dots as four small SVGs, 16px in, in the ink", () => {
    const { container } = render(<CornerDots />);
    const dots = container.querySelectorAll("svg[data-corner-dots]");
    expect(dots).toHaveLength(4);
    const places: Record<string, readonly string[]> = {
      "top-left": ["top-3", "left-3"],
      "top-right": ["top-3", "right-3"],
      "bottom-left": ["bottom-3", "left-3"],
      "bottom-right": ["bottom-3", "right-3"],
    };
    for (const dot of dots) {
      // An 8px box 12px in: the centre is 16px in, and no dot box covers the
      // band's text, so axe can still check its contrast.
      expect(dot).toHaveAttribute("aria-hidden", "true");
      expect(dot).toHaveClass("absolute", "size-2", "pointer-events-none", ...places[dot.getAttribute("data-corner") ?? ""]);
      expect(dot).not.toHaveClass("inset-0");
      expect(dot).toHaveAttribute("viewBox", "0 0 8 8");
      const circle = dot.querySelector("circle");
      expect(circle).toHaveAttribute("r", "4");
      expect(circle).toHaveClass("fill-scene-ink");
    }
    const { container: top } = render(<CornerDots corners="top" className="lg:hidden" />);
    const topDots = [...top.querySelectorAll("svg[data-corner-dots]")];
    expect(topDots.map((dot) => dot.getAttribute("data-corner"))).toEqual(["top-left", "top-right"]);
    for (const dot of topDots) expect(dot).toHaveClass("lg:hidden");
  });

  it("sets the key numeral in the meaningful-mark colour at the palette's weight", () => {
    const { container } = render(
      <>
        <PosterNumeral value={4} plakat="autumn" />
        <PosterNumeral value={4} plakat="lemons" format="strip" />
      </>,
    );
    const [band, strip] = container.querySelectorAll("svg[data-poster-numeral]");
    expect(band).toHaveAttribute("aria-hidden", "true");
    expect(band).toHaveClass("plakat-autumn");
    expect(band.querySelector("text")).toHaveClass("fill-scene-mark", "text-[26rem]");
    expect(band.querySelector("text")).toHaveAttribute("font-weight", "400");
    expect(band.querySelector("text")).toHaveAttribute("text-anchor", "end");
    expect(strip.querySelector("text")).toHaveClass("text-[13rem]");
    expect(strip.querySelector("text")).toHaveAttribute("font-weight", "700");
    expect(band.querySelector("text")?.textContent).toBe("4");
  });

  it.each(["demos", "blog"] as const)("masks one %s halftone image with the scene ink", (field) => {
    const { container } = render(<Halftone field={field} />);
    const halftone = container.querySelector(`[data-halftone="${field}"]`);
    expect(halftone).toHaveAttribute("aria-hidden", "true");
    expect(halftone).toHaveClass("bg-scene-ink", `[mask-image:url(/plakat/halftone-${field}.png)]`, "[mask-size:cover]");
    expect(halftone?.querySelector("circle, svg")).toBeNull();
    const file = join(WEBSITE, "public", "plakat", `halftone-${field}.png`);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(120_000);
    const manifest = JSON.parse(readFileSync(join(WEBSITE, "..", "..", "ASSET_MANIFEST.json"), "utf8")) as {
      assets: { path: string; source: string; license: string; owner: string }[];
    };
    const row = manifest.assets.find((asset) => asset.path === `packages/website/public/plakat/halftone-${field}.png`);
    expect(row).toMatchObject({
      owner: "Tim Löhr",
      source: "generated by scripts/plakat/build-halftone.mjs",
      license: "LicenseRef-Loehrning-Brand",
    });
  });
});

describe("ResultChart", () => {
  const chart: ResultChartData = {
    heading: "Was der Fall zeigt",
    caption: "t CO₂e, Scope 1 und 2, erfundene Zahlen",
    note: "",
    unit: "t CO₂e",
    bars: [
      { label: "Vorjahr 2024", value: 2017.5, display: "2.017,5 t", kind: "reference" },
      { label: "KI-Antwort 2025", value: 1866.5, display: "1.866,5 t", note: "sechs Fehler, 7,5 % weniger", kind: "answer" },
      { label: "Belegtabelle 2025", value: 1915.2, display: "1.915,2 t", kind: "correct" },
    ],
  };

  it("keeps labels and values as text and the bars decorative, on one scale", () => {
    render(<ResultChart chart={chart} plakat="autumn" />);
    const figure = screen.getByRole("figure");
    expect(within(figure).getByRole("heading", { level: 3, name: "Was der Fall zeigt" })).toBeInTheDocument();
    expect(figure.querySelector("figcaption")?.textContent).toBe(chart.caption);
    const rows = within(figure).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    for (const [index, row] of rows.entries()) {
      expect(row).toHaveTextContent(chart.bars[index].label);
      expect(row).toHaveTextContent(chart.bars[index].display);
      const fill = row.querySelector("[data-result-bar-fill]") as HTMLElement;
      expect(fill.parentElement).toHaveAttribute("aria-hidden", "true");
      expect(Number.parseFloat(fill.style.width)).toBeCloseTo((chart.bars[index].value / 2017.5) * 100, 3);
    }
  });

  it("tells the series apart by pattern and label, not hue (SPEC §3.11)", () => {
    render(<ResultChart chart={chart} plakat="autumn" />);
    const fills = [...document.querySelectorAll("[data-result-bar-fill]")];
    expect(fills[0]).toHaveClass("bg-rost");
    expect(fills[2]).toHaveClass("bg-rost");
    expect(fills[1]).toHaveClass("border-2", "border-rost");
    expect(fills[1].className).toMatch(/repeating-linear-gradient\(135deg,var\(--color-rost\)_0_2px,transparent_2px_6px\)/);
    expect(screen.getByText("sechs Fehler, 7,5 % weniger")).toHaveClass("text-ocker-tief");
    for (const plakat of PLAKAT_KEYS) {
      const markup = renderToStaticMarkup(<ResultChart chart={chart} plakat={plakat} />);
      expect(markup, plakat).toMatch(/repeating-linear-gradient/);
    }
  });
});

describe("Mennige stays out of a scene (SPEC §8.3)", () => {
  it("keeps paper fills off the scene button recipes", () => {
    for (const recipe of Object.values(BUTTON_CLASSES.scene)) {
      expect(recipe).not.toMatch(/\b(?:bg-mennige|bg-kupfer|text-paper)\b/);
    }
  });

  it("uses no paper primary and no Mennige fill next to a scene button in files that render a PlakatBand", () => {
    for (const file of productionTsx()) {
      const source = readFileSync(file, "utf8");
      const label = relative(WEBSITE, file);
      if (/<PlakatBand\b/.test(source)) {
        expect(source, label).not.toMatch(/BUTTON_CLASSES\.paper\.primary/);
      }
      for (const match of source.matchAll(/className="([^"]*)"/g)) {
        const classes = match[1].split(/\s+/);
        if (classes.includes("bg-scene-ink") || classes.includes("border-scene-ink")) {
          expect(classes, label).not.toEqual(expect.arrayContaining(["bg-mennige"]));
          expect(classes, label).not.toEqual(expect.arrayContaining(["bg-kupfer"]));
          expect(classes, label).not.toEqual(expect.arrayContaining(["text-paper"]));
        }
      }
      expect(sceneButtonViolations(source), label).toEqual([]);
    }
  });

  it("catches a paper button inside a band and a paper fill on a scene button", () => {
    // Each case is a way to put a Mennige edge on Rost (1.07) or Ultramarin (2.21).
    const band = (inner: string) => `<PlakatBand plakat="autumn">\n  <h1>Titel</h1>\n  ${inner}\n</PlakatBand>`;
    expect(sceneButtonViolations(band('<ButtonLink href="/deck">Deck öffnen</ButtonLink>'))).toHaveLength(1);
    expect(sceneButtonViolations(band('<ButtonLink tone="scene" href="/deck">Deck öffnen</ButtonLink>'))).toEqual([]);
    expect(sceneButtonViolations(band('<a className={BUTTON_CLASSES.paper.secondary} href="/deck">Deck</a>'))).toHaveLength(1);
    expect(sceneButtonViolations(band('<span className="bg-mennige" />'))).toHaveLength(1);
    expect(
      sceneButtonViolations('<ButtonLink tone="scene" className="bg-mennige text-paper" href="/deck">Deck</ButtonLink>'),
    ).toHaveLength(1);
    expect(sceneButtonViolations('<a className={cx(BUTTON_CLASSES.scene.primary, "bg-kupfer")} href="/deck">Deck</a>')).toHaveLength(1);
    // A course header band on a scene page counts as a band.
    expect(
      sceneButtonViolations('<header data-plakat-band="">\n  <header>x</header>\n  <ButtonLink href="/a">A</ButtonLink>\n</header>\n<ButtonLink href="/b">B</ButtonLink>'),
    ).toHaveLength(1);
    // A paper button on the paper below the band is allowed (one Mennige button per paper page).
    expect(sceneButtonViolations(`${band('<ButtonLink tone="scene" href="/a">A</ButtonLink>')}\n<ButtonLink href="/b">B</ButtonLink>`)).toEqual([]);
  });

  it("finds no Mennige fill and no paper label rendered inside a lemons or autumn scene", () => {
    for (const plakat of ["lemons", "autumn"] as const) {
      const { container } = render(
        <PlakatBand plakat={plakat}>
          <ButtonLink tone="scene" href="/deck">
            Deck öffnen
          </ButtonLink>
        </PlakatBand>,
      );
      expectNoMennigeInScene(container);
      const { container: broken } = render(
        <PlakatBand plakat={plakat}>
          <ButtonLink href="/deck">Deck öffnen</ButtonLink>
        </PlakatBand>,
      );
      expect(() => expectNoMennigeInScene(broken), plakat).toThrow(/inside a lemons or autumn scene/);
      // tailwind-merge keeps the later fill, so a className cannot rescue a scene button.
      const { container: overridden } = render(
        <PlakatBand plakat={plakat}>
          <ButtonLink tone="scene" className="bg-mennige" href="/deck">
            Deck öffnen
          </ButtonLink>
        </PlakatBand>,
      );
      expect(() => expectNoMennigeInScene(overridden), plakat).toThrow(/bg-mennige/);
    }
    const { container: page } = render(
      <div data-plakat-page="autumn">
        <header data-plakat-band="">
          <span className="bg-mennige" />
        </header>
        <span className="bg-mennige" />
      </div>,
    );
    expect(() => expectNoMennigeInScene(page)).toThrow(/bg-mennige/);
    page.querySelector("header span")?.remove();
    // The paper below a band keeps its Mennige.
    expect(() => expectNoMennigeInScene(page)).not.toThrow();
  });
});

describe("posterSvg and the OG pieces", () => {
  it("draws the same composition with PLAKAT hex values, decorative and keylined", () => {
    const svg = posterSvg({ plakat: "idea", motif: "pie", numeral: "02" });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 400 500"/);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain(`fill="${PLAKAT.idea.mid}" stroke="${PLAKAT.idea.ground}"`);
    expect(svg).toContain('paint-order="stroke fill"');
    expect(svg.match(/<path /g)).toHaveLength(renderPoster("idea", "pie", null, "portrait").querySelectorAll("path").length);
    expect(posterSvgDataUri({ plakat: "autumn", motif: "leaves" })).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
    const strip = posterSvg({ plakat: "autumn", motif: "leaves", numeral: "04", format: "strip", width: 390, height: 128 });
    expect(strip).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="390" height="128"/);
  });

  it("holds the colophon's paper colours equal to the @theme tokens", () => {
    const tokens = new Map<string, string>();
    postcss.parse(readFileSync(join(SRC, "app/globals.css"), "utf8")).walkAtRules("theme", (rule) => {
      rule.walkDecls((declaration) => {
        if (!tokens.has(declaration.prop)) tokens.set(declaration.prop, declaration.value.trim().toLowerCase());
      });
    });
    expect(OG_PAPER.kalkweiss).toBe(tokens.get("--color-background"));
    expect(OG_PAPER.mennige).toBe(tokens.get("--color-mennige"));
    expect(OG_PAPER.bogen).toBe(tokens.get("--color-paper"));
    expect(OG_PAPER.druckschwarz).toBe(tokens.get("--color-foreground"));
  });

  it("builds the colophon from the real header lockup: the 38px Mennige tile and the ink wordmark", () => {
    const markup = renderToStaticMarkup(<OgColophon trailing="Workshop 04 · kostenlos" />);
    expect(markup).toContain("width:38px;height:38px");
    expect(markup).toContain(`background:${OG_PAPER.mennige}`);
    expect(markup).toContain(`background:${OG_PAPER.kalkweiss}`);
    expect(markup).toContain(">L</div>");
    expect(markup).toContain(">loehrning.ai</div>");
    expect(markup).toContain("letter-spacing:-0.015em");
    expect(markup).toContain("height:80px");
    expect(markup).toContain("Workshop 04 · kostenlos");
  });

  it("sets an OG poster's numeral where the poster sets it", () => {
    const markup = renderToStaticMarkup(<OgPoster plakat="lemons" motif="fan" numeral="01" width={504} />);
    expect(markup).toContain("width:504px;height:630px");
    expect(markup).toContain(`color:${PLAKAT.lemons.ink}`);
    expect(markup).toContain("background-image:url(&quot;data:image/svg+xml");
    expect(markup).toContain(">01</div>");
  });

  it("keylines the OG numeral in the ground, under the fill, as the SVG poster does (SPEC §3.5)", () => {
    const { container } = render(<OgPoster plakat="bloom" motif="dome" numeral="03" width={400} />);
    const keyline = container.querySelector('[data-og-numeral="keyline"]') as HTMLElement;
    const fill = container.querySelector('[data-og-numeral="fill"]') as HTMLElement;
    expect(keyline.nextElementSibling).toBe(fill);
    const layout = numeralLayout("bloom", "portrait");
    expect(keyline.style.getPropertyValue("-webkit-text-stroke")).toBe(`${layout.keyline}px ${PLAKAT.bloom.ground}`);
    expect(renderToStaticMarkup(<OgPoster plakat="bloom" motif="dome" numeral="03" width={400} />)).toContain(
      `color:${PLAKAT.bloom.ground}`,
    );
    for (const property of ["left", "top", "font-size", "letter-spacing", "font-weight"]) {
      expect(keyline.style.getPropertyValue(property), property).toBe(fill.style.getPropertyValue(property));
    }
    expect(keyline.textContent).toBe("03");
    expect(fill.textContent).toBe("03");
  });

  it("loads poster-svg.ts in plain Node, as the static generators do", () => {
    const out = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "const { posterSvg } = await import('./src/lib/plakat/poster-svg.ts'); process.stdout.write(posterSvg({ plakat: 'autumn', motif: 'leaves', numeral: '04' }).slice(0, 4));",
      ],
      { cwd: WEBSITE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    expect(out).toBe("<svg");
  });

  it("keeps raw hex out of src/lib/plakat outside palettes.ts and the generated metrics", () => {
    const libDir = join(SRC, "lib", "plakat");
    const files = readdirSync(libDir).filter(
      (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !["palettes.ts", "type-metrics.ts"].includes(file),
    );
    expect(files).toContain("og.tsx");
    for (const file of files) {
      expect(readFileSync(join(libDir, file), "utf8"), file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});

function productionTsx(): string[] {
  return sourceFiles(SRC).filter((path) => /\.tsx$/.test(path) && !/\.test\.tsx$/.test(path));
}

/** The source span of a JSX element, from its opening tag to its matching close. */
function elementSpan(source: string, start: number, tag: string): string {
  const pattern = new RegExp(`<${tag}\\b[^>]*?(/?)>|</${tag}>`, "g");
  pattern.lastIndex = start;
  let depth = 0;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    if (match[0].startsWith("</")) depth -= 1;
    else if (match[1] !== "/") depth += 1;
    if (depth === 0) return source.slice(start, match.index + match[0].length);
  }
  return source.slice(start);
}

/** Band spans: every `<PlakatBand>` and every element carrying `data-plakat-band`. */
function bandSpans(source: string): string[] {
  const spans: string[] = [];
  for (const match of source.matchAll(/<PlakatBand\b/g)) spans.push(elementSpan(source, match.index, "PlakatBand"));
  for (const match of source.matchAll(/<([A-Za-z][\w.]*)\b[^>]*?\bdata-plakat-band\b/g)) {
    spans.push(elementSpan(source, match.index, match[1]));
  }
  return spans;
}

const PAPER_FILL = /\b(?:bg-mennige|bg-kupfer|text-paper)\b/;

/**
 * Ways to put a Mennige edge on a scene ground (SPEC §1.3 and §8.3):
 * a ButtonLink without tone="scene" or a paper button recipe inside a band,
 * any Mennige or Kupfer fill or paper label inside a band, and a paper fill
 * written next to a scene button (tailwind-merge keeps the later fill).
 */
function sceneButtonViolations(source: string): string[] {
  const found: string[] = [];
  for (const span of bandSpans(source)) {
    for (const button of span.matchAll(/<ButtonLink\b[^>]*>/g)) {
      if (!/\btone=(?:"scene"|\{"scene"\})/.test(button[0])) found.push(`paper ButtonLink in a band: ${button[0]}`);
    }
    for (const recipe of span.matchAll(/BUTTON_CLASSES\.paper\.\w+/g)) found.push(`paper recipe in a band: ${recipe[0]}`);
    for (const fill of span.matchAll(/\b(?:bg-mennige|bg-kupfer|text-paper)\b/g)) found.push(`paper fill in a band: ${fill[0]}`);
  }
  for (const button of source.matchAll(/<ButtonLink\b[^>]*>/g)) {
    if (/\btone=(?:"scene"|\{"scene"\})/.test(button[0]) && PAPER_FILL.test(button[0])) {
      found.push(`paper fill on a scene ButtonLink: ${button[0]}`);
    }
  }
  for (const call of source.matchAll(/cx\(([^()]*BUTTON_CLASSES\.scene[^()]*)\)/g)) {
    if (PAPER_FILL.test(call[1])) found.push(`paper fill on a scene recipe: ${call[0]}`);
  }
  return [...new Set(found)];
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:tsx?|css)$/.test(entry.name) ? [path] : [];
  });
}
