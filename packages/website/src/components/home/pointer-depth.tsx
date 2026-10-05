"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type PointerEvent } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** The steepest tilt a card takes under the pointer, in degrees. */
export const POINTER_DEPTH_MAX_TILT = 4;

type DepthTag = "ol" | "ul";

type PointerDepthListProps<Tag extends DepthTag> = {
  readonly as: Tag;
} & ComponentPropsWithoutRef<Tag>;

function resetCard(card: HTMLElement) {
  card.style.removeProperty("--depth-rx");
  card.style.removeProperty("--depth-ry");
}

/**
 * Hover depth for a list of cards: under a mouse, the card below the pointer
 * tilts a few degrees towards it and a soft light follows the pointer across
 * its ground. One delegated listener on the list, one write per frame, CSS
 * variables only, so the server markup is the resting card. Touch and pen
 * never tilt anything; reduced motion keeps the light and drops the tilt
 * (and the cards' motion-reduce:transform-none holds them flat regardless).
 */
export function PointerDepthList<Tag extends DepthTag>({
  as,
  children,
  ...props
}: PointerDepthListProps<Tag>) {
  const frameRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const card = target.closest<HTMLElement>("[data-depth-card]");
    if (!card || !event.currentTarget.contains(card)) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
      card.style.setProperty("--depth-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--depth-y", `${(y * 100).toFixed(1)}%`);
      if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches) {
        resetCard(card);
        return;
      }
      const tilt = POINTER_DEPTH_MAX_TILT * 2;
      card.style.setProperty("--depth-rx", `${((0.5 - y) * tilt).toFixed(2)}deg`);
      card.style.setProperty("--depth-ry", `${((x - 0.5) * tilt).toFixed(2)}deg`);
    });
  };

  const onPointerOut = (event: PointerEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const card = target.closest<HTMLElement>("[data-depth-card]");
    if (!card) return;
    const next = event.relatedTarget;
    if (next instanceof Node && card.contains(next)) return;
    cancelAnimationFrame(frameRef.current);
    resetCard(card);
  };

  const List = as as DepthTag;
  return (
    <List
      {...(props as ComponentPropsWithoutRef<DepthTag>)}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
    >
      {children}
    </List>
  );
}
