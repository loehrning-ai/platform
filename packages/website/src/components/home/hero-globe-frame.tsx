import {
  CX,
  CY,
  KUPFER,
  LC,
  PHONE_VIEW,
  phoneComposition,
  R,
  WARM,
} from "@/components/home/hero-network-geometry";
import { svgElement } from "@/components/home/static-svg";

/** The same thickening as the live phone globe (hero-network.tsx). */
const STROKE = 2.4;
const ID = "hf";

/** Two decimals: invisible at phone scale, a third of the bytes of three. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The frame's inner markup, from the once-computed phone composition. */
export function globeFrameMarkup(): string {
  const frame = phoneComposition();
  const defs = svgElement(
    "defs",
    {},
    svgElement(
      "radialGradient",
      { id: `${ID}-volume`, cx: "38%", cy: "30%", r: "72%" },
      [
        ["0%", "0.012"],
        ["58%", "0.02"],
        ["84%", "0.055"],
        ["100%", "0.11"],
      ]
        .map(([offset, opacity]) =>
          svgElement("stop", {
            offset,
            "stop-color": WARM,
            "stop-opacity": opacity,
          }),
        )
        .join(""),
    ) +
      svgElement(
        "pattern",
        {
          id: `${ID}-hatch`,
          patternUnits: "userSpaceOnUse",
          width: "6",
          height: "6",
          patternTransform: "rotate(45) scale(2)",
        },
        svgElement("line", {
          x1: "0",
          y1: "0",
          x2: "0",
          y2: "6",
          stroke: KUPFER,
          "stroke-width": "0.85",
        }),
      ),
  );
  // Shared paint sits on the groups, so each path carries only its geometry
  // and its depth: the frame is paid for twice in the page (the HTML and the
  // RSC payload).
  const grid = svgElement(
    "g",
    { stroke: LC, "stroke-linecap": "round", "stroke-linejoin": "round" },
    frame.grid.front
      .map((s) =>
        svgElement("path", {
          d: s.d,
          "stroke-opacity": round2(0.06 + s.dp * 0.16),
          "stroke-width": round2((0.45 + s.dp * 0.4) * STROKE),
        }),
      )
      .join(""),
  );
  const fill = svgElement(
    "g",
    { fill: `url(#${ID}-hatch)`, "fill-opacity": 0.1 },
    frame.countryFill.map((s) => svgElement("path", { d: s.d })).join(""),
  );
  const country = svgElement(
    "g",
    {
      stroke: KUPFER,
      "stroke-width": 2 * STROKE,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    frame.country
      .map((s) =>
        svgElement("path", {
          d: s.d,
          "stroke-opacity": round2(0.13 + s.dp * 0.05),
        }),
      )
      .join(""),
  );
  return (
    defs +
    svgElement("circle", { cx: CX, cy: CY, r: R, fill: `url(#${ID}-volume)` }) +
    svgElement("circle", {
      cx: CX,
      cy: CY,
      r: R + 1,
      stroke: WARM,
      "stroke-opacity": 0.12,
      "stroke-width": 3.6,
    }) +
    grid +
    fill +
    country +
    svgElement("circle", {
      cx: CX,
      cy: CY,
      r: R,
      stroke: LC,
      "stroke-opacity": 0.04,
      "stroke-width": 0.3,
    })
  );
}

/**
 * The phone hero's globe at first paint, drawn on the server: the thin ink
 * graticule and the Kupfer outlines of the paper hero, centred on Berlin,
 * inside the phone window (PHONE_VIEW) only.
 *
 * It is the globe for everyone below lg until the live globe takes over
 * (phone-globe.tsx), and the whole globe for reduced motion, reduced data
 * and Save-Data, who download nothing more. It uses the live globe's
 * geometry, framing and paint, so the takeover changes nothing but the
 * motion. Decorative: the slot around it is aria-hidden. Its content is
 * static markup (static-svg.ts), so hydration never walks its paths.
 */
export function HeroGlobeFrame() {
  return (
    <svg
      data-home-globe-ssr=""
      viewBox={`${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: globeFrameMarkup() }}
    />
  );
}
