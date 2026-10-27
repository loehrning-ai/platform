"use client";

import {
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "@/components/werk/cx";
import type { GlasMaterial, GlasTone } from "@/lib/glas";
import { GLAS_PRIORITY } from "./budget";
import { InsideGlasContext, useLiveSlot } from "./glas-root";

export type GlasShape = "card" | "capsule" | "fixed" | "stage";

export interface GlasPanelProps extends Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children"> {
  readonly as?: ElementType;
  readonly material?: Exclude<GlasMaterial, "clear"> | "clear";
  readonly shape?: GlasShape;
  /** 2 (default) or 3 for things that float highest (sheets, the lens). */
  readonly elevation?: 2 | 3;
  /**
   * Live-filter priority (GLAS_PRIORITY or a number), or false for a surface
   * that never uses a live filter. Over budget a surface is painted in frost.
   */
  readonly live?: number | false;
  /** Overrides the root tone for this surface (a dark dock over a light stage). */
  readonly tone?: GlasTone;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly panelRef?: Ref<HTMLElement>;
  /** "in" or "out": materializes (opacity, scale, turning specular), never by filter. */
  readonly appear?: "in" | "out";
  readonly [data: `data-${string}`]: string | undefined;
}

/** Sets --glas-ox/--glas-oy: the surface's offset inside its stage, so a frost copy of the field lines up. */
function useFrostOffset(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const stage = element.closest<HTMLElement>(".glas-stage");
    if (!stage) return;
    const measure = () => {
      const a = element.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      element.style.setProperty("--glas-ox", `${Math.round(a.left - b.left)}px`);
      element.style.setProperty("--glas-oy", `${Math.round(a.top - b.top)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * One glass surface: rim zone, reading plate, specular ring and elevation
 * (glass-spec 4.1). Children of a glass surface are fills; a GlasPanel inside
 * another is drawn as a fill automatically (never glass on glass).
 */
export function GlasPanel({
  as,
  material = "regular",
  shape = "card",
  elevation = 2,
  live = GLAS_PRIORITY.panel,
  tone,
  className,
  style,
  children,
  panelRef,
  appear,
  ...rest
}: GlasPanelProps) {
  const Element = as ?? "div";
  const nested = useContext(InsideGlasContext);
  const ref = useRef<HTMLElement | null>(null);
  const isLive = useLiveSlot(ref, nested || material === "clear" ? false : live);
  useFrostOffset(ref);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
    if (typeof panelRef === "function") panelRef(node);
    else if (panelRef && typeof panelRef === "object") (panelRef as { current: HTMLElement | null }).current = node;
  };
  return (
    <InsideGlasContext.Provider value>
      <Element
        ref={setRef}
        className={cx("glas", className)}
        data-material={material}
        data-shape={shape === "card" ? undefined : shape}
        data-elevation={elevation === 3 ? "3" : undefined}
        data-tone={tone}
        data-live={isLive ? "on" : "off"}
        data-nested={nested ? "" : undefined}
        data-appear={appear}
        style={style}
        {...rest}
      >
        {children}
      </Element>
    </InsideGlasContext.Provider>
  );
}

/**
 * Apple's GlassEffectContainer: one glass surface for a cluster of controls
 * (the dock). Its children are fills, so the cluster costs one filter.
 */
export function GlasGroup({
  label,
  className,
  children,
  live = GLAS_PRIORITY.dock,
  ...rest
}: Omit<GlasPanelProps, "role" | "aria-label"> & { readonly label: string }) {
  return (
    <GlasPanel role="group" aria-label={label} live={live} className={cx("glas-group", className)} {...rest}>
      {children}
    </GlasPanel>
  );
}
