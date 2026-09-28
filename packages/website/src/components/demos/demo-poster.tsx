import type { ReactNode } from "react";
import { cx } from "@/components/werk/cx";

/*
 * Demo previews as small flat IDEA posters (SPEC §3.12), not UI mock-ups.
 *
 * Grammar: a Kreide ground (the `plakat-idea` scope around the art), one
 * solid Kobalt mass that names the demo's shape (a table, a page, a pipeline,
 * a chart, a gauge) and one Himbeere shape. No text, no grey bars, no
 * hairlines: every Kobalt line is 8 units or thicker in the 400 x 300 box,
 * 3px or more on a desktop tile.
 *
 * The art is decorative (aria-hidden): the tile's heading and link carry the
 * name. Himbeere never touches Kobalt (1.85:1, it vibrates): a Kreide gap of
 * at least 10 units keeps them apart. Because the Himbeere shape carries no
 * meaning, hue is never the only cue for anything.
 *
 * The composition sits in the central 300 x 300 square (x 50 to 350), so the
 * same drawing crops cleanly to a square thumbnail with `slice`.
 */

const INK = "fill-scene-ink";
const MID = "fill-scene-mid";
const INK_STROKE = "fill-none stroke-scene-ink";
const MID_STROKE = "fill-none stroke-scene-mid";
const GROUND_STROKE = "stroke-scene-ground";

function Excel() {
  const cells: ReactNode[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const mark = row === 1 && col === 2;
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={78 + col * 64}
          y={66 + row * 46}
          width={52}
          height={34}
          className={mark ? MID : INK}
        />,
      );
    }
  }
  return <>{cells}</>;
}

function Word() {
  return (
    <>
      <path
        className={INK}
        fillRule="evenodd"
        d="M100 40H260V260H100Z M120 78H240V90H120Z M120 104H240V116H120Z M120 130H240V142H120Z M120 156H240V168H120Z M120 182H200V194H120Z"
      />
      <circle cx="305" cy="222" r="32" className={MID} />
    </>
  );
}

function Pipeline() {
  return (
    <>
      <rect x="64" y="122" width="56" height="56" className={INK} />
      <rect x="120" y="144" width="52" height="12" className={INK} />
      <rect x="172" y="122" width="56" height="56" className={INK} />
      <rect x="228" y="144" width="40" height="12" className={INK} />
      <circle cx="310" cy="150" r="30" className={MID} />
    </>
  );
}

function Agent() {
  return (
    <>
      <path
        d="M200 150L96 70M200 150L304 70M200 150L96 230"
        strokeWidth="10"
        className={INK_STROKE}
      />
      <path d="M200 150L268 203" strokeWidth="10" className={INK_STROKE} />
      <circle cx="200" cy="150" r="44" className={INK} />
      <rect x="76" y="50" width="40" height="40" className={INK} />
      <rect x="284" y="50" width="40" height="40" className={INK} />
      <rect x="76" y="210" width="40" height="40" className={INK} />
      <rect x="284" y="214" width="40" height="40" className={MID} />
    </>
  );
}

function Graph() {
  return (
    <>
      <path
        d="M90 90L200 70L310 110M90 90L130 210L250 220M200 70L250 220M310 110L250 220M250 220L284 222"
        strokeWidth="8"
        className={INK_STROKE}
      />
      <circle cx="90" cy="90" r="22" className={INK} />
      <circle cx="200" cy="70" r="22" className={INK} />
      <circle cx="310" cy="110" r="22" className={INK} />
      <circle cx="130" cy="210" r="22" className={INK} />
      <circle cx="250" cy="220" r="22" className={INK} />
      <path d="M320 196L346 222L320 248L294 222Z" className={MID} />
    </>
  );
}

function Rag() {
  return (
    <>
      <rect x="112" y="44" width="120" height="160" strokeWidth="6" className={cx(INK, GROUND_STROKE)} />
      <rect x="96" y="60" width="120" height="160" strokeWidth="6" className={cx(INK, GROUND_STROKE)} />
      <path
        className={INK}
        fillRule="evenodd"
        d="M80 76H200V236H80Z M96 104H184V114H96Z M96 128H184V138H96Z M96 152H160V162H96Z"
      />
      <circle cx="292" cy="186" r="40" className={MID} />
      <path d="M262 206L248 242L282 222Z" className={MID} />
    </>
  );
}

function Invoice() {
  return (
    <>
      <path
        className={INK}
        d="M70 50H150V250L140 240L130 250L120 240L110 250L100 240L90 250L80 240L70 250Z"
      />
      <path d="M164 142H206V128L228 150L206 172V158H164Z" className={MID} />
      <rect x="242" y="90" width="40" height="34" className={INK} />
      <rect x="290" y="90" width="40" height="34" className={INK} />
      <rect x="242" y="132" width="40" height="34" className={INK} />
      <rect x="290" y="132" width="40" height="34" className={INK} />
      <rect x="242" y="174" width="40" height="34" className={INK} />
      <rect x="290" y="174" width="40" height="34" className={INK} />
    </>
  );
}

function Scanner() {
  return (
    <>
      <circle cx="180" cy="135" r="62" strokeWidth="18" className={INK_STROKE} />
      <path d="M228 183L296 251" strokeWidth="24" strokeLinecap="square" className={INK_STROKE} />
      <circle cx="180" cy="135" r="24" className={MID} />
    </>
  );
}

function Drift() {
  return (
    <>
      <path d="M64 50V240H340" strokeWidth="10" className={INK_STROKE} />
      <path
        d="M90 214L140 184L190 200L246 146L296 112"
        strokeWidth="12"
        strokeLinejoin="miter"
        className={INK_STROKE}
      />
      <circle cx="326" cy="78" r="18" className={MID} />
    </>
  );
}

function FineTune() {
  return (
    <>
      <rect x="70" y="86" width="260" height="10" className={INK} />
      <rect x="106" y="77" width="28" height="28" className={INK} />
      <rect x="70" y="146" width="150" height="10" className={INK} />
      <rect x="282" y="146" width="48" height="10" className={INK} />
      <circle cx="251" cy="151" r="19" className={MID} />
      <rect x="70" y="206" width="260" height="10" className={INK} />
      <rect x="170" y="197" width="28" height="28" className={INK} />
    </>
  );
}

function Roi() {
  return (
    <>
      <rect x="80" y="180" width="44" height="60" className={INK} />
      <rect x="140" y="140" width="44" height="100" className={INK} />
      <rect x="200" y="100" width="44" height="140" className={INK} />
      <rect x="260" y="50" width="44" height="190" className={MID} />
    </>
  );
}

function Gauge() {
  return (
    <>
      <path d="M90 210A110 110 0 0 1 310 210" strokeWidth="26" className={INK_STROKE} />
      <rect x="70" y="238" width="260" height="12" className={INK} />
      <path d="M200 210L250 152" strokeWidth="12" className={MID_STROKE} />
      <circle cx="200" cy="210" r="16" className={MID} />
    </>
  );
}

const MOTIFS: Readonly<Record<string, () => ReactNode>> = {
  excel: Excel,
  word: Word,
  "outbound-workflow": Pipeline,
  "agent-pipeline": Agent,
  "n8n-supply-chain": Graph,
  "rag-vertragsassistent": Rag,
  "rechnung-zu-sap": Invoice,
  "prompt-scanner": Scanner,
  "cost-drift-observability": Drift,
  "fine-tune-playground": FineTune,
  "roi-rechner": Roi,
  "llm-observability": Gauge,
};

export const DEMO_POSTER_SLUGS = Object.keys(MOTIFS);

export type DemoPosterProps = {
  readonly slug: string;
  /** `meet` keeps the 4:3 drawing whole (tiles); `slice` crops it to a square thumbnail. */
  readonly fit?: "meet" | "slice";
  readonly className?: string;
};

/**
 * The flat poster drawing for one demo. Colours come from the surrounding
 * scene (`plakat-idea`): Kobalt ink, Himbeere mid. Renders nothing for an
 * unknown slug.
 */
export function DemoPoster({ slug, fit = "meet", className }: DemoPosterProps) {
  const Motif = MOTIFS[slug];
  if (!Motif) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-demo-poster={slug}
      viewBox="0 0 400 300"
      preserveAspectRatio={fit === "slice" ? "xMidYMid slice" : "xMidYMid meet"}
      className={cx("block size-full", className)}
    >
      <Motif />
    </svg>
  );
}

/**
 * A compact square demo thumbnail on its own Kreide ground, for phone rows
 * and the home rail (paper surfaces outside a scene).
 */
export function DemoPosterThumb({
  slug,
  className,
}: {
  readonly slug: string;
  readonly className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-demo-poster-thumb=""
      className={cx("plakat-idea block aspect-square shrink-0 overflow-hidden p-1.5", className)}
    >
      <DemoPoster slug={slug} fit="slice" />
    </span>
  );
}
