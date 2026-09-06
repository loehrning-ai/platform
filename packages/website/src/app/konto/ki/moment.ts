import type { Locale } from "@/lib/i18n/locale";

/**
 * Timestamp rendering for the agent regions.
 *
 * Deliberately not `toLocaleString`. Two of the three regions render first on
 * the server and are then re-rendered by an island after a mint or a revoke,
 * so a formatter that reads the host time zone would produce one string during
 * the server render and a different one after hydration. Formatting straight
 * off the ISO instant in UTC is stable in both places, and naming the zone in
 * the output keeps it honest rather than pretending to be local time.
 */

const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:?\d{2})$/;

export interface MomentParts {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly hour: string;
  readonly minute: string;
}

/**
 * Normalise any accepted instant to its UTC parts, or refuse it. A value that
 * is not an instant returns null so the caller renders a placeholder instead
 * of an invalid date.
 */
export function utcMomentParts(value: unknown): MomentParts | null {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return null;
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) return null;
  const instant = new Date(milliseconds);
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    year: String(instant.getUTCFullYear()).padStart(4, "0"),
    month: pad(instant.getUTCMonth() + 1),
    day: pad(instant.getUTCDate()),
    hour: pad(instant.getUTCHours()),
    minute: pad(instant.getUTCMinutes()),
  };
}

/** Date only, in the locale's conventional field order. */
export function formatUtcDate(value: unknown, locale: Locale): string | null {
  const parts = utcMomentParts(value);
  if (!parts) return null;
  return locale === "en"
    ? `${parts.year}-${parts.month}-${parts.day}`
    : `${parts.day}.${parts.month}.${parts.year}`;
}

/** Date and minute, always labelled UTC so nobody reads it as local time. */
export function formatUtcMoment(value: unknown, locale: Locale): string | null {
  const parts = utcMomentParts(value);
  if (!parts) return null;
  const date = formatUtcDate(value, locale);
  return `${date}, ${parts.hour}:${parts.minute} UTC`;
}
