/**
 * The target of a deep link, from `location.hash`: "#strom" is "strom",
 * "#%C3%BC" is "ü". A malformed escape (a shared link cut short, "#%E0%A4%A")
 * is no target at all, never an error.
 */
export function hashTarget(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw === "") return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
