import type { CSSProperties, PointerEventHandler } from "react";
import type { Rect } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/treemap";

/**
 * The patterns and gradients a record pebble needs, once per SVG: the rework
 * hatch, the specular rim (light from the top left) and the inner shade at
 * the bottom edge. `ids` makes them unique per SVG.
 */
export function PebbleDefs({ ids }: { readonly ids: string }) {
  return (
    <>
      <pattern id={`hatch-${ids}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" className="w02-hatch-ground" />
        <line x1="0" y1="0" x2="0" y2="4" className="w02-hatch-line" />
      </pattern>
      <linearGradient id={`rim-${ids}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`shade-${ids}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.5" stopColor="#121212" stopOpacity="0" />
        <stop offset="1" stopColor="#121212" stopOpacity="0.3" />
      </linearGradient>
    </>
  );
}

/**
 * One quality record as a small piece of glass, drawn in SVG without any
 * backdrop filter: the body at 0.85 (filled for scrap, the hatch inside for
 * rework), an inner shade at the bottom and a specular rim. Solid mode keeps
 * the body only. Pointer handlers go on the body.
 */
export function GlassPebble({
  rect,
  scrap,
  ids,
  flat,
  lifted,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  readonly rect: Rect;
  readonly scrap: boolean;
  readonly ids: string;
  readonly flat: boolean;
  readonly lifted?: boolean;
  readonly style?: CSSProperties;
  readonly onPointerDown?: PointerEventHandler<SVGRectElement>;
  readonly onPointerMove?: PointerEventHandler<SVGRectElement>;
  readonly onPointerUp?: PointerEventHandler<SVGRectElement>;
  readonly onPointerCancel?: PointerEventHandler<SVGRectElement>;
}) {
  const r = Math.min(3, rect.w / 3, rect.h / 3);
  return (
    <g className="w02-pebble-glass" style={style}>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={r}
        className="w02-pebble-body"
        data-scrap={scrap ? "" : undefined}
        data-lifted={lifted ? "" : undefined}
        fill={scrap ? undefined : `url(#hatch-${ids})`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      {flat ? null : (
        <>
          <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={r} fill={`url(#shade-${ids})`} className="w02-pebble-deco" />
          <rect
            x={rect.x + 0.5}
            y={rect.y + 0.5}
            width={Math.max(0, rect.w - 1)}
            height={Math.max(0, rect.h - 1)}
            rx={Math.max(0, r - 0.5)}
            fill="none"
            stroke={`url(#rim-${ids})`}
            className="w02-pebble-rim w02-pebble-deco"
          />
        </>
      )}
    </g>
  );
}
