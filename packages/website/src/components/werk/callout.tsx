import type { ReactNode } from "react";
import { cx } from "./cx";
import { Pictogram, type PictogramName } from "./pictogram";

export type CalloutVariant = "note" | "gap" | "boundary";

export type CalloutProps = {
  readonly children: ReactNode;
  readonly variant?: CalloutVariant;
  readonly title?: ReactNode;
  /** Defaults: none for note, gap for gap, shield for boundary. */
  readonly icon?: PictogramName | null;
  readonly className?: string;
};

const DEFAULT_ICON: Record<CalloutVariant, PictogramName | null> = {
  note: null,
  gap: "gap",
  boundary: "shield",
};

/**
 * Callout without a left bar or coloured fill.
 * - note: hairline box on Bogen for short context;
 * - gap: dashed ink box for data limits and known gaps;
 * - boundary: no box, a caption line with the shield (privacy, access).
 * At most one boxed callout per section.
 */
export function Callout({
  children,
  variant = "note",
  title,
  icon,
  className,
}: CalloutProps) {
  const glyph = icon === undefined ? DEFAULT_ICON[variant] : icon;

  if (variant === "boundary") {
    return (
      <p
        data-callout="boundary"
        className={cx("flex items-start gap-2 text-caption text-muted-foreground", className)}
      >
        {glyph ? <Pictogram name={glyph} className="mt-0.5 size-4" /> : null}
        <span>{children}</span>
      </p>
    );
  }

  return (
    <div
      data-callout={variant}
      className={cx(
        "flex gap-3 px-5 py-4 text-body",
        variant === "gap"
          ? "border border-dashed border-foreground bg-transparent"
          : "border border-hairline bg-card",
        className,
      )}
    >
      {glyph ? <Pictogram name={glyph} className="mt-1 size-5" /> : null}
      <div className="min-w-0">
        {title ? <p className="text-label text-foreground">{title}</p> : null}
        <div className={cx("text-foreground", title ? "mt-1" : undefined)}>{children}</div>
      </div>
    </div>
  );
}
