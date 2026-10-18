import type { ReactNode } from "react";

/**
 * "The gate": the hero scene of Workshop 05 (where your data goes).
 *
 * A prompt leaves a laptop as a small message card, reaches a ring with three
 * lamps and the lamp decides. Public text passes (green). A card with names
 * stops, is read and passes with its names covered (amber). A card with a key
 * is turned back (red). Past the ring the cards land in a cloud, and four
 * stations circle it: the vendor says chats are stored in one place and may
 * be processed in several. The scene says that in shapes only; no word is
 * drawn, so it can never state more than the page does.
 *
 * Pure SVG with class names, no id, no gradient, no filter, no script. Every
 * colour is a scene token (hero-motion.css maps the classes). The base styles
 * are the finished still frame; hero-motion.css plays the story over them
 * under `prefers-reduced-motion: no-preference` only.
 *
 * Two layouts share one set of keyframes. The flow axis is "u" (from the
 * laptop to the cloud) and the cross axis is "v": portrait flows down
 * (viewBox 400 x 500, the lg column), landscape flows right (viewBox 640 x
 * 360, the phone row). `at(u, v)` places a point in either.
 */

export type GateVariant = "portrait" | "landscape";

type Point = readonly [x: number, y: number];

interface GateLayout {
  readonly width: number;
  readonly height: number;
  readonly flow: "down" | "right";
  /** Centre of a card at the start of the lane (hidden behind the laptop). */
  readonly start: Point;
  /** Length of the lane from the start to the landing point. */
  readonly lane: number;
  /** Distance of the ring plane from the start (half the lane). */
  readonly ringU: number;
  /** Ring radius along the flow (thin) and across it (wide). */
  readonly ringA: number;
  readonly ringB: number;
  /** Cross offset of the lamp housing from the lane. */
  readonly lampV: number;
  /** Laptop: centre of the screen on the cross axis is the start; top-left of the screen box. */
  readonly screen: { readonly x: number; readonly y: number };
  readonly cloud: { readonly centre: Point; readonly scale: number };
  readonly orbit: { readonly inner: number; readonly outer: number };
  readonly numeral: { readonly x: number; readonly y: number; readonly size: number };
  readonly spot: readonly number[];
  readonly warm: readonly number[];
}

const LAYOUTS: Readonly<Record<GateVariant, GateLayout>> = {
  portrait: {
    width: 400,
    height: 500,
    flow: "down",
    start: [200, 106],
    lane: 300,
    ringU: 150,
    ringA: 24,
    ringB: 76,
    lampV: 122,
    screen: { x: 138, y: 38 },
    cloud: { centre: [200, 438], scale: 1 },
    orbit: { inner: 116, outer: 172 },
    numeral: { x: -10, y: 322, size: 330 },
    spot: [210, 184, 158, 132, 106, 80],
    warm: [150, 112, 76],
  },
  landscape: {
    width: 640,
    height: 360,
    flow: "right",
    start: [96, 198],
    lane: 444,
    ringU: 222,
    ringA: 22,
    ringB: 72,
    lampV: -112,
    screen: { x: 38, y: 158 },
    cloud: { centre: [562, 202], scale: 0.9 },
    orbit: { inner: 104, outer: 156 },
    numeral: { x: 150, y: 330, size: 300 },
    spot: [250, 222, 194, 166, 138, 110],
    warm: [140, 106, 72],
  },
};

const round = (value: number): number => Math.round(value * 10) / 10;

function at(layout: GateLayout, u: number, v: number): Point {
  const [x, y] = layout.start;
  return layout.flow === "down" ? [round(x + v), round(y + u)] : [round(x + u), round(y + v)];
}

/** The two halves of the ring: the entry half sits behind a card, the exit half in front. */
function ringArcs(layout: GateLayout): { readonly back: string; readonly front: string } {
  const [cx, cy] = at(layout, layout.ringU, 0);
  const { ringA: a, ringB: b } = layout;
  if (layout.flow === "down") {
    return {
      back: `M${cx - b} ${cy}A${b} ${a} 0 0 1 ${cx + b} ${cy}`,
      front: `M${cx - b} ${cy}A${b} ${a} 0 0 0 ${cx + b} ${cy}`,
    };
  }
  return {
    back: `M${cx} ${cy - b}A${a} ${b} 0 0 0 ${cx} ${cy + b}`,
    front: `M${cx} ${cy - b}A${a} ${b} 0 0 1 ${cx} ${cy + b}`,
  };
}

const CLOUD_PATH = "M-54 34A26 26 0 0 1-60-17A34 34 0 0 1 0-30A40 40 0 0 1 60-12A26 26 0 0 1 54 34Z";

function Packet({ kind, layout, className }: { readonly kind: "public" | "names" | "key"; readonly layout: GateLayout; readonly className: string }): ReactNode {
  const [x, y] = layout.start;
  const down = layout.flow === "down";
  // Speed lines trail behind the card, against the flow.
  const lines = [-9, 0, 9].map((v, index) => {
    const length = index === 1 ? 30 : 18;
    const from = down ? [v, -24] : [-24, v];
    const to = down ? [v, -24 - length] : [-24 - length, v];
    return <path key={v} d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} className="hm-speed" />;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`hm-packet ${className}`}>
        <g transform="scale(1.18)">
          {lines}
          <rect x="-22" y="-17" width="44" height="34" rx="8" className="hm-card" />
          {kind === "public" ? <path d="M-13-8H13M-13 0H5M-13 8H13" className="hm-glyph" /> : null}
          {kind === "names" ? (
            <>
              <circle cx="-11" cy="-5" r="4.4" className="hm-glyph-fill" />
              <path d="M-18 10A7 6 0 0 1-4 10Z" className="hm-glyph-fill" />
              <path d="M1-7H14M1 1H14M1 9H10" className="hm-glyph" />
              <g className="hm-cover">
                <rect x="-19" y="-12" width="38" height="7.5" rx="3" className="hm-cover-bar" />
                <rect x="-19" y="-3.5" width="38" height="7.5" rx="3" className="hm-cover-bar" />
                <rect x="-19" y="5" width="38" height="7.5" rx="3" className="hm-cover-bar" />
              </g>
            </>
          ) : null}
          {kind === "key" ? (
            <>
              <circle cx="-9" cy="0" r="6" className="hm-glyph-ring" />
              <path d="M-3 0H15M9 0V6M14 0V5" className="hm-glyph" />
            </>
          ) : null}
        </g>
      </g>
    </g>
  );
}

function Lamp({ kind, x, y, r }: { readonly kind: "go" | "check" | "stop"; readonly x: number; readonly y: number; readonly r: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} className="hm-lamp-well" />
      <g className={`hm-lamp hm-lamp-${kind}`}>
        <circle r={r * 2.3} className="hm-halo hm-halo-wide" />
        <circle r={r * 1.6} className="hm-halo" />
        {kind === "go" ? (
          <>
            <circle r={r} className="hm-disc-go" />
            <path d={`M${-r * 0.45} ${r * 0.05}L${-r * 0.1} ${r * 0.4}L${r * 0.5} ${-r * 0.35}`} className="hm-lamp-glyph hm-lamp-glyph-paper" />
          </>
        ) : null}
        {kind === "check" ? (
          <>
            <circle r={r} className="hm-disc-check" />
            <path d={`M${-r * 0.45} 0H${r * 0.45}`} className="hm-lamp-glyph hm-lamp-glyph-ink" />
          </>
        ) : null}
        {kind === "stop" ? (
          <>
            <circle r={r} className="hm-disc-stop" />
            <path d={`M${-r * 0.38} ${-r * 0.38}L${r * 0.38} ${r * 0.38}M${r * 0.38} ${-r * 0.38}L${-r * 0.38} ${r * 0.38}`} className="hm-lamp-glyph hm-lamp-glyph-paper" />
          </>
        ) : null}
      </g>
    </g>
  );
}

function orbitPoint(centre: Point, radius: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  return [round(centre[0] + radius * Math.cos(angle)), round(centre[1] + radius * Math.sin(angle))];
}

export function GateScene({ variant, numeral }: { readonly variant: GateVariant; readonly numeral?: string }): ReactNode {
  const layout = LAYOUTS[variant];
  const down = layout.flow === "down";
  const [startX, startY] = layout.start;
  const [ringX, ringY] = at(layout, layout.ringU, 0);
  const [endX, endY] = at(layout, layout.lane, 0);
  const arcs = ringArcs(layout);
  const rx = down ? layout.ringB : layout.ringA;
  const ry = down ? layout.ringA : layout.ringB;
  const [cloudX, cloudY] = layout.cloud.centre;
  const lampR = down ? 10.5 : 11;
  const lampGap = down ? 29 : 32;
  const [housingX, housingY] = at(layout, layout.ringU, layout.lampV);
  const housingW = down ? 36 : lampGap * 2 + lampR * 2 + 20;
  const housingH = down ? lampGap * 2 + lampR * 2 + 20 : 38;
  const lampCentres: readonly Point[] = [-1, 0, 1].map((step) =>
    down ? [housingX, round(housingY + step * lampGap)] : [round(housingX + step * lampGap), housingY],
  );
  const wireFrom = down ? [ringX + layout.ringB, ringY] : [ringX, ringY + (layout.lampV < 0 ? -layout.ringB : layout.ringB)];
  const wireTo = down ? [housingX - housingW / 2, housingY] : [housingX, housingY + (layout.lampV < 0 ? housingH / 2 : -housingH / 2)];
  const innerOrbit = layout.orbit.inner;
  const outerOrbit = layout.orbit.outer;
  const nodes: readonly { readonly p: Point; readonly c: string }[] = [
    { p: orbitPoint(layout.cloud.centre, innerOrbit, down ? 205 : 235), c: "hm-node hm-node-a" },
    { p: orbitPoint(layout.cloud.centre, innerOrbit, down ? 262 : 292), c: "hm-node hm-node-b" },
    { p: orbitPoint(layout.cloud.centre, innerOrbit, down ? 318 : 338), c: "hm-node" },
    { p: orbitPoint(layout.cloud.centre, innerOrbit, down ? 155 : 190), c: "hm-node" },
    { p: orbitPoint(layout.cloud.centre, outerOrbit, down ? 232 : 262), c: "hm-node hm-node-far" },
    { p: orbitPoint(layout.cloud.centre, outerOrbit, down ? 300 : 322), c: "hm-node hm-node-far" },
  ];
  const dust: readonly (readonly [number, number, number])[] = down
    ? [[48, 150, 2.6], [352, 120, 2.2], [62, 300, 3], [338, 360, 2.4], [88, 224, 2], [318, 238, 2.8]]
    : [[236, 72, 2.4], [420, 70, 2.8], [380, 260, 2.2], [210, 270, 2.6], [510, 56, 2], [600, 300, 2.4]];
  const screenW = 124;
  const screenH = 80;
  const barX = layout.screen.x + 17;
  const barY = layout.screen.y + 20;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="gate"
      data-hero-variant={variant}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="hm-root hm-gate block size-full"
    >
      {/* Far layer: the spotlight, the pale numeral, the warm glow behind the cloud, the orbit and the dust. */}
      <g className="hm-far">
        <g className="hm-in hm-in-disc">
          <g className="hm-breathe">
            {layout.spot.map((radius) => (
              <circle key={radius} cx={ringX} cy={ringY} r={radius} className="hm-spot" />
            ))}
          </g>
        </g>
        {numeral ? (
          <text x={layout.numeral.x} y={layout.numeral.y} fontSize={layout.numeral.size} fontWeight={700} letterSpacing="-0.065em" className="hm-numeral">
            {numeral}
          </text>
        ) : null}
        <g className="hm-warm">
          {layout.warm.map((radius) => (
            <circle key={radius} cx={cloudX} cy={cloudY} r={radius} className="hm-warm-disc" />
          ))}
        </g>
        <g className="hm-orbit">
          <path d={`M${cloudX} ${cloudY}L${nodes[0].p[0]} ${nodes[0].p[1]}`} pathLength={1} className="hm-spoke hm-spoke-a" />
          <path d={`M${cloudX} ${cloudY}L${nodes[1].p[0]} ${nodes[1].p[1]}`} pathLength={1} className="hm-spoke hm-spoke-b" />
          <circle cx={cloudX} cy={cloudY} r={innerOrbit} className="hm-orbit-ring" />
          {nodes.slice(0, 4).map(({ p, c }, index) => (
            <circle key={index} cx={p[0]} cy={p[1]} r={5.5} className={c} />
          ))}
        </g>
        <g className="hm-orbit hm-orbit-far">
          <circle cx={cloudX} cy={cloudY} r={outerOrbit} className="hm-orbit-ring hm-orbit-ring-far" />
          {nodes.slice(4).map(({ p, c }, index) => (
            <circle key={index} cx={p[0]} cy={p[1]} r={4} className={c} />
          ))}
        </g>
        <g className="hm-dust hm-dust-a">
          {dust.slice(0, 3).map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hm-dust-dot" />
          ))}
        </g>
        <g className="hm-dust hm-dust-b">
          {dust.slice(3).map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hm-dust-dot" />
          ))}
        </g>
      </g>

      {/* The lane: a faint pipe under a dashed line that flows towards the cloud. */}
      <g className="hm-in hm-in-fade">
        <path d={`M${startX} ${startY}L${endX} ${endY}`} className="hm-pipe" />
        <path d={`M${startX} ${startY}L${endX} ${endY}`} className="hm-route" />
      </g>

      {/* The ring, entry half behind the cards; what the gate shows inside it. */}
      <path d={arcs.back} pathLength={1} className="hm-ring hm-ring-back hm-in-draw" />
      <ellipse cx={ringX} cy={ringY} rx={rx - 8} ry={ry - 4} className="hm-wash" />
      <ellipse cx={ringX} cy={ringY} rx={rx} ry={ry} className="hm-pulse" />
      <g className="hm-scan">
        <path
          d={down ? `M${ringX - rx + 10} ${ringY}H${ringX + rx - 10}` : `M${ringX} ${ringY - ry + 10}V${ringY + ry - 10}`}
          className="hm-scan-glow"
        />
        <path
          d={down ? `M${ringX - rx + 10} ${ringY}H${ringX + rx - 10}` : `M${ringX} ${ringY - ry + 10}V${ringY + ry - 10}`}
          className="hm-scan-line"
        />
      </g>
      <ellipse cx={ringX} cy={ringY} rx={rx - 6} ry={ry - 3} className="hm-shield" />

      {/* Three message cards: public text, names, a key. */}
      <Packet kind="public" layout={layout} className="hm-p1" />
      <Packet kind="names" layout={layout} className="hm-p2" />
      <Packet kind="key" layout={layout} className="hm-p3" />

      {/* The ring, exit half in front of the cards. */}
      <path d={arcs.front} pathLength={1} className="hm-ring hm-ring-front hm-in-draw hm-in-draw-late" />

      {/* The lamps: green, amber, red, with a wire to the ring. */}
      <g className="hm-in hm-in-pop hm-in-late">
        <path d={`M${wireFrom[0]} ${wireFrom[1]}L${wireTo[0]} ${wireTo[1]}`} className="hm-wire" />
        <rect
          x={round(housingX - housingW / 2)}
          y={round(housingY - housingH / 2)}
          width={housingW}
          height={housingH}
          rx={housingW > housingH ? housingH / 2 : housingW / 2}
          className="hm-housing"
        />
        <Lamp kind="go" x={lampCentres[0][0]} y={lampCentres[0][1]} r={lampR} />
        <Lamp kind="check" x={lampCentres[1][0]} y={lampCentres[1][1]} r={lampR} />
        <Lamp kind="stop" x={lampCentres[2][0]} y={lampCentres[2][1]} r={lampR} />
      </g>

      {/* The cloud, with ripples where a card lands. */}
      <g className="hm-in hm-in-pop hm-in-cloud">
        <g className="hm-cloud">
          <g transform={`translate(${cloudX} ${cloudY}) scale(${layout.cloud.scale})`}>
            <path d={CLOUD_PATH} className="hm-cloud-shape" />
            <path d="M-34 6A22 22 0 0 1-8 -12" className="hm-cloud-line" />
          </g>
        </g>
      </g>
      <ellipse cx={endX} cy={endY} rx={down ? 62 : 16} ry={down ? 16 : 62} className="hm-ripple hm-ripple-1" />
      <ellipse cx={endX} cy={endY} rx={down ? 62 : 16} ry={down ? 16 : 62} className="hm-ripple hm-ripple-2" />

      {/* The laptop the cards come out of. */}
      <g className="hm-in hm-in-rise">
        <rect x={layout.screen.x} y={layout.screen.y} width={screenW} height={screenH} rx="9" className="hm-screen" />
        <rect x={layout.screen.x + 6} y={layout.screen.y + 6} width={screenW - 12} height={screenH - 12} rx="4" className="hm-flash" />
        <path d={`M${barX} ${barY}H${barX + 74}`} className="hm-typing hm-typing-1" />
        <path d={`M${barX} ${barY + 16}H${barX + 52}`} className="hm-typing hm-typing-2" />
        <path d={`M${barX} ${barY + 32}H${barX + 64}`} className="hm-typing hm-typing-3" />
        <path d={`M${barX + 72} ${barY + 28}V${barY + 38}`} className="hm-cursor" />
        <rect
          x={layout.screen.x - 22}
          y={layout.screen.y + screenH - 2}
          width={screenW + 44}
          height="10"
          rx="5"
          className="hm-base"
        />
      </g>
    </svg>
  );
}
