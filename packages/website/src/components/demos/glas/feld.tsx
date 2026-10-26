"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import type { GlasTone } from "@/lib/glas";
import { frostImage, type Feld } from "./feld-math";
import { useGlas } from "./glas-root";
import { createSpring, type SpringHandle } from "./use-spring";

function Pool({ pool, reducedMotion }: { readonly pool: Feld["pools"][number]; readonly reducedMotion: boolean }) {
  const track = useRef<HTMLDivElement | null>(null);
  const springs = useRef<{ x: SpringHandle; y: SpringHandle } | null>(null);
  const position = useRef({ x: pool.x, y: pool.y });

  useLayoutEffect(() => {
    const apply = () => {
      const element = track.current;
      if (element) element.style.translate = `${(position.current.x * 100).toFixed(3)}% ${(position.current.y * 100).toFixed(3)}%`;
    };
    const moving = (on: boolean) => {
      if (on) track.current?.setAttribute("data-moving", "");
      else track.current?.removeAttribute("data-moving");
    };
    springs.current = {
      x: createSpring(pool.x, "smooth", (value) => {
        position.current.x = value;
        apply();
      }, () => moving(false)),
      y: createSpring(pool.y, "smooth", (value) => {
        position.current.y = value;
        apply();
      }, () => moving(false)),
    };
    apply();
    return () => {
      springs.current?.x.stop();
      springs.current?.y.stop();
    };
    // Created once; later positions go through the springs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = springs.current;
    if (!handle) return;
    track.current?.setAttribute("data-moving", "");
    handle.x.to(pool.x, { immediate: reducedMotion });
    handle.y.to(pool.y, { immediate: reducedMotion });
  }, [pool.x, pool.y, reducedMotion]);

  return (
    <div ref={track} className="glas-pool-track">
      <div
        className="glas-pool"
        style={{ "--pool-colour": pool.colour, "--pool-alpha": pool.alpha, "--pool-size": pool.size } as CSSProperties}
      />
    </div>
  );
}

/**
 * The stage: the backdrop root of a demo (glass-spec 3). It paints the field
 * (ground and pools, moved by transform as a function of state), then the
 * data, then whatever glass floats on it. Nothing between the stage and its
 * glass may set opacity, filter, mask, clip-path or blend: fade a card, never
 * the stage.
 */
export function GlasStage({
  feld,
  tone,
  label,
  className,
  style,
  children,
  as = "div",
  stageRef,
  ...rest
}: {
  readonly stageRef?: (element: HTMLElement | null) => void;
  readonly [data: `data-${string}`]: string | undefined;
  readonly feld: Feld;
  /** Overrides the root tone for this stage. */
  readonly tone?: GlasTone;
  /** Accessible name of the stage (it becomes a figure when given). */
  readonly label?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly as?: "div" | "figure" | "section";
}) {
  const { reducedMotion } = useGlas();
  const ref = useRef<HTMLElement | null>(null);
  const Element = as;

  // The frost copy follows the stage size and the settled pool positions.
  const signature = feld.pools.map((pool) => `${pool.colour}${pool.alpha}${pool.x}${pool.y}${pool.size}`).join("|") + feld.ground;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => {
      const box = element.getBoundingClientRect();
      if (box.width === 0) return;
      element.style.setProperty("--glas-feld-image", frostImage(feld, box.width, box.height));
      element.style.setProperty("--glas-feld-w", `${Math.round(box.width)}px`);
      element.style.setProperty("--glas-feld-h", `${Math.round(box.height)}px`);
    };
    paint();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
    // signature covers every field value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <Element
      ref={(node: HTMLElement | null) => {
        ref.current = node;
        stageRef?.(node);
      }}
      className={cx("glas-stage", className)}
      {...rest}
      data-tone={tone}
      aria-label={label}
      style={{ "--glas-feld-ground": feld.ground, ...style } as CSSProperties}
    >
      <div className="glas-feld" aria-hidden="true">
        {feld.pools.map((pool, index) => (
          <Pool key={index} pool={pool} reducedMotion={reducedMotion} />
        ))}
      </div>
      {children}
    </Element>
  );
}
