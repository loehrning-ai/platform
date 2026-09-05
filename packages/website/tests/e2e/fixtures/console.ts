import type { Page } from "@playwright/test";

/**
 * The one browser-error gate for the end-to-end suite.
 *
 * Every spec that claims "this route logs no console error" collects through
 * `collectBrowserErrors` and asserts on `meaningfulBrowserErrors`. Both console
 * `error` messages and uncaught page errors are captured; anything that is not
 * matched by an entry in BENIGN_BROWSER_ERRORS below fails the calling test.
 *
 * The allowlist is deliberately the whole story. Before this module each spec
 * carried its own copy of the collector plus, in three of them, its own private
 * exclusion, so the real question ("what browser noise does this project agree
 * to tolerate, and why?") had no single answer. It does now: the three entries
 * below are the complete set, each one is scoped to an exact engine plus an
 * exact message shape, and each one states why it is not a defect.
 *
 * Adding an entry is a deliberate act. An entry that cannot name a reason, or
 * that would match a class of messages rather than one known message, does not
 * belong here: widen the allowlist and every spec in the suite stops catching
 * that failure at once.
 */

/** Where a captured error came from. */
export type BrowserErrorSource = "console" | "pageerror";

/** Source position a console message points at. */
export interface BrowserErrorLocation {
  readonly url: string;
  readonly line: number;
  readonly column: number;
}

export interface CapturedBrowserError {
  readonly source: BrowserErrorSource;
  readonly text: string;
  /** Console messages carry a location; uncaught page errors do not. */
  readonly location: BrowserErrorLocation | null;
}

/**
 * Per-call facts an allowlist entry may need. Nothing here is inferred: an
 * entry that needs a value the caller did not supply must not match, so a spec
 * never silently inherits another spec's tolerance.
 */
export interface BrowserErrorGateContext {
  /**
   * The document URL this test deliberately navigated to. Supply it only when
   * the navigation is expected to return a non-200 status, which is the sole
   * case in which the browser's own document-load error is not a defect.
   */
  readonly expectedDocumentUrl?: string;
}

/** Everything an allowlist entry is allowed to look at. */
interface BrowserErrorGateScope extends BrowserErrorGateContext {
  /** "chromium", "webkit", "firefox", or UNKNOWN_ENGINE. */
  readonly engine: string;
}

interface BenignBrowserError {
  /** Stable identifier, so a reviewer can talk about one entry. */
  readonly id: string;
  /** Why this exact message is not a defect. */
  readonly reason: string;
  readonly matches: (
    error: CapturedBrowserError,
    scope: BrowserErrorGateScope,
  ) => boolean;
}

/**
 * Used when the engine behind a page cannot be read (a persistent or connected
 * context exposes no Browser). Every entry below is engine-scoped, so an
 * unknown engine filters nothing: the gate fails closed, never open.
 */
const UNKNOWN_ENGINE = "unknown";

const WEBKIT_SPURIOUS_TLS_HANDSHAKE_WARNING =
  "Failed to load resource: Error performing TLS handshake: An unexpected TLS packet was received.";

const CHROMIUM_DOCUMENT_404_ERROR =
  "Failed to load resource: the server responded with a status of 404 (Not Found)";

/**
 * WebKit reports an aborted Next.js RSC prefetch as an uncaught page error with
 * this exact shape (note the leading slash: WebKit prints the URL without its
 * scheme). Exported because two route specs attach their own narrow pageerror
 * listener inside a per-route loop and reuse this predicate rather than
 * restating the pattern.
 */
const WEBKIT_RSC_PREFETCH_CANCELLATION =
  /^\/localhost:\d+\/[^\s]+[?&]_rsc=[A-Za-z0-9_-]+ due to access control checks\.$/u;

export function isWebKitRscPrefetchCancellation(message: string): boolean {
  return WEBKIT_RSC_PREFETCH_CANCELLATION.test(message);
}

/**
 * The complete allowlist. Three entries, three engines-plus-shapes, three
 * reasons. Anything not listed here fails the calling spec.
 */
export const BENIGN_BROWSER_ERRORS: readonly BenignBrowserError[] =
  Object.freeze([
    {
      id: "webkit-spurious-tls-handshake-warning",
      reason:
        "WebKit's TLS stack occasionally logs a handshake warning for a request that still succeeds. Observed on CI against unrelated routes (/, /buecher) with no reproducing user-facing symptom. Scoped to WebKit, to a console message, and to this exact string: a real WebKit network failure does not produce this text and still fails the gate.",
      matches: (error, scope) =>
        scope.engine === "webkit" &&
        error.source === "console" &&
        error.text === WEBKIT_SPURIOUS_TLS_HANDSHAKE_WARNING,
    },
    {
      id: "chromium-expected-document-404",
      reason:
        "Chromium logs a console error for the document response itself whenever a navigation returns 404. A spec that asserts a 404 route renders its not-found UI has therefore asked for that response on purpose. Scoped to Chromium, to a console message at the top of the document (line 0, column 0), to this exact string, and to the exact URL the caller passed as expectedDocumentUrl: a 404 on any subresource, or on any other document, still fails the gate.",
      matches: (error, scope) =>
        scope.engine === "chromium" &&
        error.source === "console" &&
        error.text === CHROMIUM_DOCUMENT_404_ERROR &&
        scope.expectedDocumentUrl !== undefined &&
        error.location !== null &&
        error.location.url === scope.expectedDocumentUrl &&
        error.location.line === 0 &&
        error.location.column === 0,
    },
    {
      id: "webkit-rsc-prefetch-cancellation",
      reason:
        "A production Next.js Link cancels its speculative same-origin RSC prefetch when the router navigates away first. WebKit surfaces that cancellation as an uncaught page error instead of a silent abort. The request was never needed and nothing user-facing depends on it. Scoped to WebKit, to an uncaught page error, and to the exact cancelled-prefetch shape, which requires an _rsc query parameter: a genuine WebKit script error does not match and still fails the gate.",
      matches: (error, scope) =>
        scope.engine === "webkit" &&
        error.source === "pageerror" &&
        isWebKitRscPrefetchCancellation(error.text),
    },
  ]);

/** A live capture attached to one page. */
export interface BrowserErrorLog {
  /** Engine that produced the messages, read once when the log was attached. */
  readonly engine: string;
  /** Immutable snapshot of everything captured so far. */
  readonly captured: () => readonly CapturedBrowserError[];
}

function detectEngine(page: Page): string {
  return page.context().browser()?.browserType().name() ?? UNKNOWN_ENGINE;
}

/**
 * Start capturing console errors and uncaught page errors from `page`. Attach
 * this before the navigation under test, or the first messages are lost.
 */
export function collectBrowserErrors(page: Page): BrowserErrorLog {
  const engine = detectEngine(page);
  const captured: CapturedBrowserError[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location();
    captured.push(
      Object.freeze({
        source: "console" as const,
        text: message.text(),
        location: Object.freeze({
          url: location.url,
          line: location.line,
          column: location.column,
        }),
      }),
    );
  });

  page.on("pageerror", (error) => {
    captured.push(
      Object.freeze({
        source: "pageerror" as const,
        text: error.message,
        location: null,
      }),
    );
  });

  return Object.freeze({
    engine,
    captured: () => Object.freeze([...captured]),
  });
}

/**
 * Everything captured so far that the allowlist does not excuse. An empty
 * result is the passing case; assert on it directly so a failure prints the
 * offending messages.
 */
export function meaningfulBrowserErrors(
  log: BrowserErrorLog,
  context: BrowserErrorGateContext = {},
): readonly CapturedBrowserError[] {
  const scope: BrowserErrorGateScope = {
    engine: log.engine,
    expectedDocumentUrl: context.expectedDocumentUrl,
  };
  return Object.freeze(
    log
      .captured()
      .filter(
        (error) =>
          !BENIGN_BROWSER_ERRORS.some((benign) => benign.matches(error, scope)),
      ),
  );
}

/** One readable line per error, for an assertion message. */
export function formatBrowserErrors(
  errors: readonly CapturedBrowserError[],
): string {
  return errors
    .map((error) =>
      error.location === null
        ? `${error.source}: ${error.text}`
        : `${error.source}: ${error.text} (${error.location.url}:${error.location.line}:${error.location.column})`,
    )
    .join("\n");
}
