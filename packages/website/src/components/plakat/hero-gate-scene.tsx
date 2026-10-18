import type { ReactNode } from "react";
import "./hero-gate.css";

/**
 * "The gate": the scene of Workshop 05 (where your data goes).
 *
 * A prompt leaves a laptop as a small message card, reaches a ring with three
 * lamps and the lamp decides. Public text passes (green). A card with names
 * stops, is read and passes with its names covered (amber). A card with a key
 * is turned back (red). Past the ring the cards land in a cloud, and stations
 * circle it: the vendor says chats are stored in one place and may be
 * processed in several. The scene says that in shapes only; no word is drawn,
 * so it can never state more than the page does.
 *
 * Pure SVG with class names, no id, no gradient, no filter, no script. Every
 * colour is a scene token (hero-gate.css maps the classes). The base styles
 * are the finished still frame; hero-gate.css plays the story over them under
 * `prefers-reduced-motion: no-preference` only. One viewBox (600 x 500), one
 * layout: the flow runs left to right along y = 300, from the laptop through
 * the ring to the cloud. The scene contract is in docs/experience-system.md,
 * "Workshop stage and scenes".
 */

type Point = readonly [x: number, y: number];

/** Centre of a card at the start of the lane (hidden behind the laptop). */
const START: Point = [118, 300];
/** Length of the lane from the start to the landing point. */
const LANE = 352;
/** Distance of the ring plane from the start (half the lane). */
const RING_U = 176;
/** Ring radius along the flow (thin) and across it (wide). */
const RING_A = 26;
const RING_B = 96;
/** The lamp housing sits above the ring. */
const LAMP_DY = -150;
const SCREEN = { x: 58, y: 261, w: 120, h: 78 } as const;
const CLOUD: Point = [470, 300];
const ORBIT = { inner: 86, outer: 116 } as const;
const SPOT = [200, 172, 144, 116, 90, 66] as const;
const WARM = [118, 90, 62] as const;
const DUST: readonly (readonly [number, number, number])[] = [
  [76, 96, 2.6],
  [188, 118, 2.2],
  [420, 84, 2.8],
  [540, 134, 2.2],
  [86, 424, 2.4],
  [250, 446, 2.8],
  [404, 436, 2.2],
  [534, 418, 2.6],
];

const round = (value: number): number => Math.round(value * 10) / 10;

const CLOUD_PATH = "M-54 34A26 26 0 0 1-60-17A34 34 0 0 1 0-30A40 40 0 0 1 60-12A26 26 0 0 1 54 34Z";

function Packet({ kind, className }: { readonly kind: "public" | "names" | "key"; readonly className: string }): ReactNode {
  const [x, y] = START;
  // Speed lines trail behind the card, against the flow.
  const lines = [-9, 0, 9].map((v, index) => {
    const length = index === 1 ? 30 : 18;
    return <path key={v} d={`M-24 ${v}L${-24 - length} ${v}`} className="hm-speed" />;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`hm-packet ${className}`}>
        <g transform="scale(1.5)">
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

export function GateScene(): ReactNode {
  const ringX = START[0] + RING_U;
  const ringY = START[1];
  const endX = START[0] + LANE;
  const endY = START[1];
  const [cloudX, cloudY] = CLOUD;
  const lampR = 11;
  const lampGap = 32;
  const housingX = ringX;
  const housingY = ringY + LAMP_DY;
  const housingW = lampGap * 2 + lampR * 2 + 20;
  const housingH = 38;
  const lampXs = [-1, 0, 1].map((step) => round(housingX + step * lampGap));
  const nodes: readonly { readonly p: Point; readonly c: string }[] = [
    { p: orbitPoint(CLOUD, ORBIT.inner, 235), c: "hm-node" },
    { p: orbitPoint(CLOUD, ORBIT.inner, 292), c: "hm-node" },
    { p: orbitPoint(CLOUD, ORBIT.inner, 338), c: "hm-node" },
    { p: orbitPoint(CLOUD, ORBIT.outer, 262), c: "hm-node hm-node-far" },
    { p: orbitPoint(CLOUD, ORBIT.outer, 322), c: "hm-node hm-node-far" },
  ];
  const barX = SCREEN.x + 17;
  const barY = SCREEN.y + 20;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-hero-motion="gate"
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="hm-root block size-full"
    >
      {/* Far layer: the spotlight, the warm glow behind the cloud, the orbit and the dust. */}
      <g className="hm-layer hm-layer-far">
        <g>
          {SPOT.map((radius) => (
            <circle key={radius} cx={ringX} cy={ringY} r={radius} className="hm-spot" />
          ))}
        </g>
        <g>
          {WARM.map((radius) => (
            <circle key={radius} cx={cloudX} cy={cloudY} r={radius} className="hm-warm-disc" />
          ))}
        </g>
        <g className="hm-orbit">
          <circle cx={cloudX} cy={cloudY} r={ORBIT.inner} className="hm-orbit-ring" />
          <circle cx={cloudX} cy={cloudY} r={ORBIT.outer} className="hm-orbit-ring hm-orbit-ring-far" />
          {nodes.map(({ p, c }, index) => (
            <circle key={index} cx={p[0]} cy={p[1]} r={index < 3 ? 5.5 : 4} className={c} />
          ))}
        </g>
        <g className="hm-dust">
          {DUST.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="hm-dust-dot" />
          ))}
        </g>
      </g>

      {/* Mid layer: the lane, the ring and its lamps, the cloud, the laptop. */}
      <g className="hm-layer hm-layer-mid">
        <path d={`M${START[0]} ${START[1]}L${endX} ${endY}`} className="hm-pipe" />
        <path d={`M${START[0]} ${START[1]}L${endX} ${endY}`} className="hm-route" />

        {/* The ring, entry half behind the cards; what the gate shows inside it. */}
        <path d={`M${ringX} ${ringY - RING_B}A${RING_A} ${RING_B} 0 0 0 ${ringX} ${ringY + RING_B}`} className="hm-ring hm-ring-back" />
        <g className="hm-scan">
          <path d={`M${ringX} ${ringY - RING_B + 10}V${ringY + RING_B - 10}`} className="hm-scan-glow" />
          <path d={`M${ringX} ${ringY - RING_B + 10}V${ringY + RING_B - 10}`} className="hm-scan-line" />
        </g>
      </g>

      {/* Near layer: three message cards (public text, names, a key). */}
      <g className="hm-layer hm-layer-near">
        <Packet kind="public" className="hm-p1" />
        <Packet kind="names" className="hm-p2" />
        <Packet kind="key" className="hm-p3" />
      </g>

      {/* The ring, exit half in front of the cards. */}
      <path d={`M${ringX} ${ringY - RING_B}A${RING_A} ${RING_B} 0 0 1 ${ringX} ${ringY + RING_B}`} className="hm-ring hm-ring-front" />

      {/* The lamps: green, amber, red, with a wire to the ring. */}
      <g>
        <path d={`M${ringX} ${ringY - RING_B}L${housingX} ${housingY + housingH / 2}`} className="hm-wire" />
        <rect
          x={round(housingX - housingW / 2)}
          y={round(housingY - housingH / 2)}
          width={housingW}
          height={housingH}
          rx={housingH / 2}
          className="hm-housing"
        />
        <Lamp kind="go" x={lampXs[0]} y={housingY} r={lampR} />
        <Lamp kind="check" x={lampXs[1]} y={housingY} r={lampR} />
        <Lamp kind="stop" x={lampXs[2]} y={housingY} r={lampR} />
      </g>

      {/* The cloud, with a ripple ring where a card lands. */}
      <g className="hm-cloud">
        <g transform={`translate(${cloudX} ${cloudY})`}>
          <path d={CLOUD_PATH} className="hm-cloud-shape" />
          <path d="M-34 6A22 22 0 0 1-8 -12" className="hm-cloud-line" />
        </g>
      </g>

      {/* The laptop the cards come out of. */}
      <g>
        <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx="9" className="hm-screen" />
        <g className="hm-typing">
          <path d={`M${barX} ${barY}H${barX + 70}`} className="hm-typing-line" />
          <path d={`M${barX} ${barY + 16}H${barX + 50}`} className="hm-typing-line" />
          <path d={`M${barX} ${barY + 32}H${barX + 60}`} className="hm-typing-line" />
        </g>
        <rect x={SCREEN.x - 10} y={SCREEN.y + SCREEN.h - 2} width={SCREEN.w + 20} height="10" rx="5" className="hm-base" />
      </g>
    </svg>
  );
}
