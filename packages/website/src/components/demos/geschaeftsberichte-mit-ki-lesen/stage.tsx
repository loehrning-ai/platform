import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { RULER, STAGE, blocks, cutX, groupLabels, meanLabelOpacity, meanY, rulerX, totalLabelOpacity } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/geometry";
import { MAX_CUT, MIN_CUT, REPORT_CUT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { fill, formatMoney, formatNumber, formatPercent } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/format";
import { clamp, northwind } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/logic";
import { atCut, blend, lerp, smoothstep, type Scene } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/motion";

type StagePack = Pick<DemoPack, "locale" | "money" | "stage">;

/** The nine weeks as blocks: two month towers (total) or a row of equal blocks (per week), with the cut line. */
export function Chart({ scene, pack }: { readonly scene: Scene; readonly pack: StagePack }) {
  const { cutF, m, rise, s } = scene;
  const list = blocks(cutF, m, rise, s);
  const groupsAt = groupLabels(cutF, m, rise, s);
  // The totals belong to the towers: they appear once the weeks have gathered.
  const totalOp = totalLabelOpacity(m) * smoothstep(0.85, 1, rise) * smoothstep(0.8, 1, s);
  const meanOp = meanLabelOpacity(m) * smoothstep(0.85, 1, rise);
  const line = cutX(cutF);
  const labelOpacity = smoothstep(0.85, 1, rise);
  // Week tags ride with their blocks but step aside while blocks are in flight (gathering, or the move to the weekly row).
  const flight = (x: number) => Math.min(1, Math.sin(Math.PI * clamp(x, 0, 1)) * 2.4);
  const tagOpacity = (1 - flight(s)) * (1 - flight(m / 0.6));
  const nameOpacity = 1 - clamp(Math.abs(cutF - 4) * 3, 0, 1);
  const money = (eur: number) => formatMoney(eur, pack.locale, pack.money);
  const sides = [
    { key: "a", group: groupsAt.a, name: pack.stage.monthA, x1: STAGE.pad, x2: line - 3, cls: "mg-fill-l" },
    { key: "b", group: groupsAt.b, name: pack.stage.monthB, x1: line + 3, x2: STAGE.width - STAGE.pad, cls: "mg-fill-r" },
  ] as const;
  return (
    <svg className="mg-svg" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} role="img" aria-label={pack.stage.chartAlt} focusable="false">
      <path className="mg-axis" d={`M${STAGE.pad} ${STAGE.base + 0.5}H${STAGE.width - STAGE.pad}`} />
      {list.map((block) => (
        <rect
          key={block.index}
          className={block.left ? "mg-fill-l" : "mg-fill-r"}
          x={block.x}
          y={block.y}
          width={block.w}
          height={Math.max(0, block.h)}
          shapeRendering="crispEdges"
        />
      ))}
      {list.map((block) =>
        block.h >= 13 ? (
          <text key={`w${block.index}`} className="mg-svg-text mg-wk" x={block.x + block.w / 2} y={block.y + block.h - 5} textAnchor="middle" opacity={tagOpacity}>
            {`W${block.index + 1}`}
          </text>
        ) : null,
      )}
      {scene.flash > 0 && list[REPORT_CUT] && (
        <rect
          className="mg-flash"
          x={list[REPORT_CUT].x - 3}
          y={list[REPORT_CUT].y - 3}
          width={list[REPORT_CUT].w + 6}
          height={list[REPORT_CUT].h + 6}
          opacity={scene.flash}
        />
      )}
      {sides.map(({ key, group, x1, x2, cls }) => (
        <g key={key}>
          <path
            className={`mg-level ${cls}`}
            d={`M${x1} ${meanY(group.mean)}H${x2}`}
            opacity={meanOp}
          />
          <text className="mg-svg-text" x={group.x} y={group.top - 8} textAnchor="middle" opacity={totalOp}>
            {money(group.total)}
          </text>
          <text
            className="mg-svg-text"
            x={group.x}
            y={Math.min(group.top, meanY(group.mean)) - 8}
            textAnchor="middle"
            opacity={meanOp}
          >
            {fill(pack.stage.mean, { v: money(group.mean) })}
          </text>
        </g>
      ))}
      <path className="mg-cut" d={`M${line} ${STAGE.top + 2}V${STAGE.base + 8}`} />
      {sides.map(({ key, group, name }) => (
        <g key={`${key}-l`} opacity={labelOpacity}>
          <text className="mg-svg-text mg-svg-name" x={group.x} y={STAGE.base + 21} textAnchor="middle" opacity={nameOpacity}>
            {name}
          </text>
          <text className="mg-svg-text mg-svg-sub" x={group.x} y={STAGE.base + 38} textAnchor="middle">
            {fill(pack.stage.weekCount, { n: group.n })}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** The headline and per-week numbers at a float cut. Pure; the single source of the giant number. */
export function numberAt(scene: Scene): number {
  return lerp(atCut(northwind.headline, scene.cutF), atCut(northwind.perUnit, scene.cutF), blend(scene.m));
}

export function unitsGrowthAt(scene: Scene): number {
  return atCut(northwind.unitsPerUnit, scene.cutF);
}

/** The axis, the possible range as a band, and one tick per cut the visitor has seen. */
export function Ruler({
  scene,
  visited,
  pack,
}: {
  readonly scene: Scene;
  readonly visited: readonly number[];
  readonly pack: Pick<DemoPack, "locale" | "stage">;
}) {
  const em = blend(scene.m);
  const span = northwind.span();
  const lo = lerp(span.head[0], span.per[0], em);
  const hi = lerp(span.head[1], span.per[1], em);
  const current = Math.round(clamp(scene.cutF, MIN_CUT, MAX_CUT));
  const at = (k: number) => rulerX(lerp(northwind.headline(k), northwind.perUnit(k), em));
  const labels = [-0.5, 0, 1] as const;
  const axis = RULER.axisY;
  // The range is written straight above its own band, so the words and the shape are one thing.
  const bandMid = (rulerX(lo) + rulerX(hi)) / 2;
  const spanAt = clamp(bandMid, 100, RULER.width - 100);
  const spanText = fill(pack.stage.spanHead, {
    a: formatPercent(lo, pack.locale, { digits: 1 }),
    b: formatPercent(hi, pack.locale, { digits: 1 }),
  });
  return (
    <svg className="mg-svg mg-ruler" viewBox={`0 0 ${RULER.width} ${RULER.height}`} aria-hidden="true" focusable="false">
      <path className="mg-axis" d={`M${RULER.pad} ${axis}H${RULER.width - RULER.pad}`} />
      <text className="mg-svg-text mg-span-text" data-testid="span" x={spanAt} y={axis - 19} textAnchor="middle">
        {spanText}
      </text>
      <rect
        className="mg-band"
        x={rulerX(lo)}
        y={axis - 11}
        width={Math.max(3, rulerX(hi) - rulerX(lo))}
        height={22}
      />
      {labels.map((value) => (
        <g key={value}>
          <path className="mg-axis" d={`M${rulerX(value)} ${axis - 6}V${axis + 6}`} />
          <text className="mg-svg-text" x={rulerX(value)} y={axis + 27} textAnchor="middle">
            {value === 0 ? "0" : `${formatNumber(value * 100, pack.locale, { sign: true })}\u202f%`}
          </text>
        </g>
      ))}
      {visited
        .filter((k) => k !== current)
        .map((k) => (
          // The tick of the second cut of the opening pass is always drawn; it shows once the pass has put it there, or at
          // once under reduced motion (demo.css), where the hero states both numbers.
          <path key={k} className="mg-tick" data-seed={k === 5 && !scene.tick5 ? "" : undefined} d={`M${at(k)} ${axis - 11}V${axis + 11}`} />
        ))}
      <path className="mg-tick mg-tick-now" d={`M${at(current)} ${axis - 15}V${axis + 15}`} />
    </svg>
  );
}
