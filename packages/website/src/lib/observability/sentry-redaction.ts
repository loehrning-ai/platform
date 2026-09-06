/**
 * Credential redaction for everything the error tracker is asked to send.
 *
 * The agent endpoint accepts bearer credentials, so from now on an
 * Authorization header exists on real requests to this application. It must
 * never reach a third party. `prepareSentryEvent` already rebuilds an event
 * from a strict allowlist and would drop a header today, but an allowlist is
 * a decision about what to keep, and a credential deserves a rule about what
 * to remove. This module is that rule, and it runs first, so a future field,
 * an SDK schema change, or an integration that attaches a request cannot
 * reintroduce a token by being added to the allowlist later.
 *
 * It returns a new value and mutates nothing: the SDK keeps whatever it held,
 * and only the copy built here is transmitted.
 */

export const REDACTED_VALUE = "[redacted]";

/** Bounds so a hostile or cyclic payload cannot turn redaction into a hang. */
const MAX_DEPTH = 12;
const MAX_NODES = 5_000;

/**
 * Keys whose value is a credential regardless of shape. Compared after
 * normalisation, so `Authorization`, `authorization`, and `auth_token` all
 * resolve to the same entry.
 */
const CREDENTIAL_KEYS: ReadonlySet<string> = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "authtoken",
  "bearer",
  "cookie",
  "credential",
  "credentials",
  "idtoken",
  "password",
  "personalaccesstoken",
  "privatekey",
  "proxyauthorization",
  "refreshtoken",
  "secret",
  "servicerolekey",
  "sessiontoken",
  "setcookie",
  "token",
  "tokenhash",
  "xapikey",
]);

/**
 * Credential shapes that can appear inside an ordinary string: an HTTP
 * authorization value, a JSON Web Token, or a platform personal access token.
 * Each segment ceiling is high enough that ordinary prose, version numbers,
 * and file names cannot match.
 */
const CREDENTIAL_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, `Bearer ${REDACTED_VALUE}`],
  [/\bBasic\s+[A-Za-z0-9+/]+=*/gi, `Basic ${REDACTED_VALUE}`],
  [/\blat_[A-Za-z0-9_-]{16,}/g, REDACTED_VALUE],
  [
    /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    REDACTED_VALUE,
  ],
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isCredentialKey(key: string): boolean {
  return CREDENTIAL_KEYS.has(normalizeKey(key));
}

/** Replace every credential shape inside one string. */
export function redactCredentialText(value: string): string {
  let result = value;
  for (const [pattern, replacement] of CREDENTIAL_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

interface WalkBudget {
  nodes: number;
}

function redactValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  budget: WalkBudget,
): unknown {
  budget.nodes += 1;
  if (budget.nodes > MAX_NODES || depth > MAX_DEPTH) return REDACTED_VALUE;

  if (typeof value === "string") return redactCredentialText(value);
  if (value === null || typeof value !== "object") {
    // Numbers, booleans, undefined, and symbols cannot carry a credential in
    // a form the transport would transmit as one.
    return typeof value === "symbol" || typeof value === "function"
      ? REDACTED_VALUE
      : value;
  }

  if (seen.has(value)) return REDACTED_VALUE;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1, seen, budget));
  }

  // A non-plain object cannot be rebuilt faithfully without mutating it, and
  // an object this module cannot inspect is exactly the one that must not be
  // forwarded unchecked.
  if (!isPlainObject(value)) return REDACTED_VALUE;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = isCredentialKey(key)
      ? REDACTED_VALUE
      : redactValue(entry, depth + 1, seen, budget);
  }
  return result;
}

/**
 * A credential-free copy of a Sentry event, or null when the payload cannot
 * be inspected safely. Null drops the event: an event that cannot be proven
 * credential-free is not worth transmitting.
 */
export function redactSentryCredentials<T extends object>(
  event: T,
): T | null {
  try {
    const redacted = redactValue(event, 0, new WeakSet<object>(), {
      nodes: 0,
    });
    return redacted !== null && typeof redacted === "object"
      ? (redacted as T)
      : null;
  } catch {
    // A hostile getter or an exotic proxy must fail closed.
    return null;
  }
}
