"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { GlasIcon, type GlasIconName } from "./icons";

export type GlasChipKind = "file" | "filter" | "status";

/**
 * Chip (glass-spec 4.7), 32 tall with a 44px hit area. file: a kit file name
 * in the mono face with a document icon; it opens or downloads that file.
 * filter: selectable, selected is Druckschwarz with a check. status: not
 * interactive ("Darstellung", "Erfundenes Beispiel", "Aufgezeichnet am ...").
 * Inside glass a chip is a fill; standing alone on the field pass glass.
 */
export function GlasChip({
  kind = "status",
  selected,
  icon,
  onClick,
  href,
  download,
  glass,
  className,
  children,
  label,
}: {
  readonly kind?: GlasChipKind;
  readonly selected?: boolean;
  readonly icon?: GlasIconName;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly href?: string;
  readonly download?: string | boolean;
  /** Thin glass (standing alone on the field); default is a fill. */
  readonly glass?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
  /** Accessible name when the visible text is not enough. */
  readonly label?: string;
}) {
  const leading = icon ?? (kind === "file" ? "doc" : kind === "filter" && selected ? "check" : undefined);
  const classes = cx("glas-chip", glass && "glas", className);
  const data = {
    "data-kind": kind,
    "data-selected": selected ? "" : undefined,
    "data-material": glass ? "thin" : undefined,
    "data-shape": glass ? "capsule" : undefined,
    "data-live": glass ? "off" : undefined,
  };
  const body = (
    <>
      {leading ? <GlasIcon name={leading} /> : null}
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} download={download === true ? "" : download || undefined} className={classes} aria-label={label} {...data}>
        {body}
      </a>
    );
  }
  if (onClick || kind === "filter") {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        aria-pressed={kind === "filter" ? Boolean(selected) : undefined}
        aria-label={label}
        {...data}
      >
        {body}
      </button>
    );
  }
  return (
    <span className={classes} aria-label={label} {...data}>
      {body}
    </span>
  );
}
