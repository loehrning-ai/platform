/**
 * Mark a response that was produced by code this app does not own (an SDK, a
 * transport) as private to the one caller it was built for.
 *
 * The body is passed through as a stream, never buffered, so a Server-Sent
 * Events answer keeps streaming. Only the cache headers change:
 *
 * - `Cache-Control` becomes `private, no-store`. A `no-transform` the producer
 *   asked for survives, because it is what keeps intermediaries from
 *   buffering or recompressing an event stream. Every other directive the
 *   producer set is dropped rather than merged: a `public` or `max-age` next to
 *   `no-store` would only invite a cache to disagree about which one wins.
 * - Each named request header is merged into `Vary`, so a cache that ignores
 *   `no-store` still cannot serve one caller's answer to another.
 */
export function withPrivateNoStore(
  response: Response,
  options: Readonly<{ vary?: readonly string[] }> = {},
): Response {
  const headers = new Headers(response.headers);
  const producerDirectives = (headers.get("Cache-Control") ?? "")
    .split(",")
    .map((directive) => directive.trim().toLowerCase());
  headers.set(
    "Cache-Control",
    producerDirectives.includes("no-transform")
      ? "private, no-store, no-transform"
      : "private, no-store",
  );
  for (const name of options.vary ?? []) {
    mergeVary(headers, name);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Add one field name to `Vary` without duplicating it and without narrowing
 * an existing `Vary: *`, which already varies on everything.
 */
export function mergeVary(headers: Headers, name: string): void {
  const existing = (headers.get("Vary") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    existing.includes("*") ||
    existing.some((entry) => entry.toLowerCase() === name.toLowerCase())
  ) {
    return;
  }
  headers.set("Vary", [...existing, name].join(", "));
}
