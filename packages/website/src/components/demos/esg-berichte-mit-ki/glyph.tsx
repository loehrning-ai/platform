import type { Status } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";

/**
 * The status as a rounded shape, never colour alone: Belegt is a filled
 * square with a check, Schwach belegt a hatched one, Lücke an open outline in
 * the mark colour. The label is the accessible name; the shape is decoration.
 */
export function StatusGlyph({ status, label, size = 18, className }: { readonly status: Status; readonly label?: string; readonly size?: number; readonly className?: string }) {
  return (
    <svg
      className={`w4-glyph${className ? ` ${className}` : ""}`}
      data-status={status}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {status === "belegt" ? (
        <>
          <rect x="1" y="1" width="16" height="16" rx="5" className="w4-glyph-fill" />
          <path d="M5 9.4l2.6 2.6L13 6.4" className="w4-glyph-check" />
        </>
      ) : status === "schwach" ? (
        <>
          <rect x="1.75" y="1.75" width="14.5" height="14.5" rx="4.5" className="w4-glyph-line" />
          <path d="M4.2 9.8L9.8 4.2M4.2 14.2L14.2 4.2M8.2 14.2L14.2 8.2" className="w4-glyph-hatch" />
        </>
      ) : (
        <rect x="1.75" y="1.75" width="14.5" height="14.5" rx="4.5" className="w4-glyph-gap" />
      )}
    </svg>
  );
}

/** Glyph plus its word, for chips and rows. */
export function StatusLabel({ status, label }: { readonly status: Status; readonly label: string }) {
  return (
    <span className="w4-status" data-status={status}>
      <StatusGlyph status={status} />
      <span>{label}</span>
    </span>
  );
}
