/**
 * A long title may carry a subtitle after a colon ("Titel: Untertitel").
 * No workshop uses one now: the series sets single titles. Surfaces set the part before the colon
 * as the headline and treat the subtitle as a second, smaller line, or drop
 * it visually on a phone row while the accessible name keeps it.
 */
export function splitTitle(title: string): {
  readonly head: string;
  readonly subtitle?: string;
} {
  const at = title.indexOf(": ");
  if (at <= 0) return { head: title };
  return { head: title.slice(0, at), subtitle: title.slice(at + 2) };
}
