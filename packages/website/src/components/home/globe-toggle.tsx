"use client";

/**
 * A globe's pause control: a quiet 44px target (no frame, a small glyph at
 * reduced contrast), a fixed localized name and a pressed state, so the name
 * says what the button does and aria-pressed says whether it is on.
 *
 * The phone variant drives the horizon renderer; the desktop variant drives
 * the projection globe (aria-controls names it). Each is rendered only while
 * its globe moves, so it never reads as a second action.
 */
export function GlobeToggle({
  variant,
  paused,
  label,
  onToggle,
  controls,
}: {
  readonly variant: "phone" | "desktop";
  readonly paused: boolean;
  readonly label: string;
  readonly onToggle: () => void;
  readonly controls?: string;
}) {
  return (
    <button
      type="button"
      data-home-globe-toggle={variant === "phone" ? "" : undefined}
      data-hero-globe-toggle={variant === "desktop" ? "" : undefined}
      aria-label={label}
      aria-pressed={paused}
      aria-controls={controls}
      onClick={onToggle}
      className={
        variant === "phone" ? "globe-toggle phone-globe-toggle" : "globe-toggle"
      }
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {paused ? (
          <path d="M5 3v10l8-5z" fill="currentColor" />
        ) : (
          <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}
