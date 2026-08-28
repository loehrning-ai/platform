import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";

/*
 * Card — raised paper sheet for the Berlin learning studio.
 *
 * Soft geometry and warm elevation make discovery surfaces inviting. The
 * optional 3px signal still preserves course-track meaning.
 */

export type CardAccent = "kupfer" | "sand" | "amber" | "none";

const ACCENT_BORDER: Record<CardAccent, string> = {
  kupfer: "border-t-[3px] border-t-brand-orange",
  sand: "border-t-[3px] border-t-brand-sand",
  amber: "border-t-[3px] border-t-brand-amber",
  none: "",
};

const ACCENT_TILE: Record<CardAccent, string> = {
  kupfer: "bg-kupfer-mist text-brand-orange",
  sand: "bg-brand-sand/15 text-brand-sand",
  amber: "bg-brand-amber/15 text-brand-amber",
  none: "bg-card-hover text-foreground",
};

interface CardProps {
  readonly href?: string;
  readonly external?: boolean;
  readonly accent?: CardAccent;
  readonly interactive?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
  readonly "aria-label"?: string;
}

export function Card({
  href,
  external,
  accent = "none",
  interactive,
  className,
  children,
  ...rest
}: CardProps) {
  const isInteractive = interactive ?? Boolean(href);
  const classes = cn(
    "group relative flex flex-col rounded-[1.25rem] border border-border/70 bg-card p-4 shadow-card sm:p-6",
    ACCENT_BORDER[accent],
    isInteractive &&
      "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-brand-orange hover:bg-card-hover hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...rest}
      >
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

interface IconTileProps {
  readonly icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  readonly accent?: CardAccent;
  readonly size?: "md" | "lg";
  readonly className?: string;
}

/** Bounded icon marker. Encodes the track hue alongside the Card accent. */
export function IconTile({
  icon: Icon,
  accent = "kupfer",
  size = "md",
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-border/70 shadow-card",
        size === "lg" ? "h-12 w-12" : "h-11 w-11",
        ACCENT_TILE[accent],
        className,
      )}
      aria-hidden="true"
    >
      <Icon
        className={size === "lg" ? "h-6 w-6" : "h-5 w-5"}
        strokeWidth={1.75}
      />
    </span>
  );
}
