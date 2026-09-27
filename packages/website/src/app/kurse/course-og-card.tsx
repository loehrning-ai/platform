import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import {
  OG_COLOPHON_HEIGHT,
  OG_FONT_FAMILY,
  OG_PAPER,
  OG_SIZE,
  OgColophon,
  OgPoster,
} from "@/lib/plakat/og";
import { PLAKAT, type CoursePlakat } from "@/lib/plakat/palettes";

/**
 * The course social cards (Werkzeichnung v2, SPEC §3.15): the track's scene
 * as the ground, one caps line, the title at poster size with -0.04em
 * tracking, one 28px subtitle, the course poster on the right at the full
 * height above the Kalkweiß colophon strip with the header's L tile. The
 * /kurse card stays paper (SPEC §2.3) and shows four track posters instead. Colours come from PLAKAT and PAPER; nothing else is a hex here.
 */

const INSET = 64;
/** The poster's height is the card above the strip; its width follows 4:5. */
const POSTER_HEIGHT = OG_SIZE.height - OG_COLOPHON_HEIGHT;
const POSTER_WIDTH = Math.round((POSTER_HEIGHT * 4) / 5);

// The site face from src/fonts, read on the Node runtime (the cards are
// prerendered). The card is set in 700 and 400.
let fontData: Promise<{ bold: Buffer; regular: Buffer }> | undefined;
export async function courseOgFonts() {
  fontData ??= Promise.all([
    readFile(join(process.cwd(), "src/fonts/LoehrningSans-Bold.ttf")),
    readFile(join(process.cwd(), "src/fonts/LoehrningSans-Regular.ttf")),
  ]).then(([bold, regular]) => ({ bold, regular }));
  const { bold, regular } = await fontData;
  return [
    { name: OG_FONT_FAMILY, data: bold, weight: 700 as const, style: "normal" as const },
    { name: OG_FONT_FAMILY, data: regular, weight: 400 as const, style: "normal" as const },
  ];
}

interface CardText {
  readonly caps: string;
  readonly title: string;
  readonly subtitle: string;
  /** The colophon's right-hand line, such as the route. */
  readonly trailing: string;
  /** Title size in px; the default suits two short lines. */
  readonly titleSize?: number;
}

function TextColumn({
  caps,
  title,
  subtitle,
  titleSize = 80,
  ink,
}: CardText & { readonly ink: string }): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        padding: `64px 40px 0 ${INSET}px`,
        color: ink,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {caps}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1.35,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

/** A course card in its track's scene, with the course poster on the right. */
export function CourseOgCard({
  scene,
  ...text
}: CardText & { readonly scene: CoursePlakat }): ReactElement {
  const palette = PLAKAT[scene.plakat];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: palette.ground,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", height: POSTER_HEIGHT }}>
        <TextColumn {...text} ink={palette.ink} />
        <OgPoster
          plakat={scene.plakat}
          motif={scene.motif}
          numeral={scene.numeral}
          width={POSTER_WIDTH}
        />
      </div>
      <OgColophon trailing={text.trailing} inset={INSET} />
    </div>
  );
}

/** The /kurse art column: the workshop cards' 504 × 630 poster slot. */
const CATALOG_ART_WIDTH = 504;
const CATALOG_TEXT_COLUMN = OG_SIZE.width - CATALOG_ART_WIDTH;

/**
 * The /kurse card: paper, like the page, with the track posters as a 2 × 2
 * series filling the full-height art column on the right, where the workshop
 * and course cards place their one poster (the Grundlagenpfad's "01" first).
 * The colophon strip sits under the text column below a 2px ink rule.
 */
export function CatalogOgCard({
  posters,
  ...text
}: CardText & { readonly posters: readonly [CoursePlakat, CoursePlakat, CoursePlakat, CoursePlakat] }): ReactElement {
  const width = CATALOG_ART_WIDTH / 2;
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG_PAPER.kalkweiss,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: CATALOG_TEXT_COLUMN, flexShrink: 0 }}>
        <div style={{ display: "flex", flexGrow: 1 }}>
          <TextColumn {...text} ink={OG_PAPER.druckschwarz} />
        </div>
        <div style={{ display: "flex", borderTop: `2px solid ${OG_PAPER.druckschwarz}` }}>
          <OgColophon trailing={text.trailing} inset={INSET} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", width: CATALOG_ART_WIDTH, height: OG_SIZE.height }}>
        {posters.map((poster) => (
          <OgPoster
            key={poster.motif}
            plakat={poster.plakat}
            motif={poster.motif}
            numeral={poster.numeral}
            width={width}
          />
        ))}
      </div>
    </div>
  );
}
