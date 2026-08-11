/**
 * WebKit's TLS stack occasionally logs a spurious handshake warning for a
 * request that still succeeds — observed on CI against unrelated routes
 * (`/`, `/buecher`) with no reproducing user-facing symptom. Filtering it is
 * scoped as narrowly as `edge-states.spec.ts`'s Chromium 404 filter: exact
 * engine, exact text, nothing broader. A real WebKit network failure will not
 * match this string and still fails the gate.
 */
const WEBKIT_SPURIOUS_TLS_HANDSHAKE_WARNING =
  "Failed to load resource: Error performing TLS handshake: An unexpected TLS packet was received.";

export function isKnownBenignConsoleNoise(
  text: string,
  browserName: string,
): boolean {
  return (
    browserName === "webkit" && text === WEBKIT_SPURIOUS_TLS_HANDSHAKE_WARNING
  );
}
