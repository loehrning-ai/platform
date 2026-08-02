/**
 * Cross-worker rate limiter.
 *
 * Production path
 * ---------------
 * Backed by a Supabase RPC `rate_limit_consume(_key, _window_s, _max)` that
 * atomically upserts a row in `public.rate_limits` and returns whether the
 * caller is within budget. Since Supabase Postgres is a single source of
 * truth, every Vercel edge region / worker consults the same counter — no
 * more "in-memory Map resets on cold start, attacker hits 50 regions
 * in parallel" blindspot.
 *
 * Fallback
 * --------
 * When Supabase is not configured (local dev, previews without env vars)
 * we fall back to a per-worker in-memory Map. This is NOT cross-worker and
 * is only acceptable in development.
 *
 * Trusted client IP
 * -----------------
 * `trustedClientIp()` reads Vercel's `x-vercel-forwarded-for` only when the
 * process is an attested Vercel runtime. Vercel documents this as its stable
 * copy of the client address even when another proxy overwrites
 * `x-forwarded-for`. No proxy-specific header is trusted off-platform.
 *
 * Persistence boundary
 * --------------------
 * Routes must pass `hashedClientRateLimitKey()` to the durable limiter. It
 * binds a trusted client IP to a route namespace and stores only a keyed,
 * versioned HMAC-SHA-256 pseudonymous identifier, never the raw address. The
 * identifier remains personal data for privacy purposes and is handled as such
 * in the public notice.
 */
import "server-only";

import { decodeRateLimitHmacSecret } from "@/lib/security/rate-limit-secret.mjs";
import { tryCreateServiceClient } from "@/lib/supabase/server";

type RateLimitArgs = {
  readonly key: string;
  readonly windowSeconds: number;
  readonly max: number;
};

const inMemory = new Map<string, { count: number; reset: number }>();

export class RateLimitUnavailableError extends Error {
  readonly code = "RATE_LIMIT_UNAVAILABLE";

  constructor() {
    super("Durable rate-limit protection unavailable");
    this.name = "RateLimitUnavailableError";
  }
}

export function isRateLimitUnavailableError(
  error: unknown,
): error is RateLimitUnavailableError {
  try {
    return (
      error instanceof RateLimitUnavailableError ||
      (
        typeof error === "object" &&
        error !== null &&
        Reflect.get(error, "code") === "RATE_LIMIT_UNAVAILABLE"
      )
    );
  } catch {
    return false;
  }
}

function safeProviderCode(code: unknown): string | undefined {
  return typeof code === "string" && /^PGRST[0-9]{3}$/.test(code)
    ? code
    : undefined;
}

function productionUnavailable(
  reason: "missing-client" | "rpc-error" | "rpc-throw" | "invalid-response",
  code?: unknown,
): never {
  console.warn("[rate-limit] durable backend unavailable", {
    reason,
    ...(safeProviderCode(code) ? { code: safeProviderCode(code) } : {}),
  });
  throw new RateLimitUnavailableError();
}

export async function consumeRateLimit(args: RateLimitArgs): Promise<boolean> {
  let supabase: ReturnType<typeof tryCreateServiceClient>;
  try {
    supabase = tryCreateServiceClient();
  } catch {
    if (process.env.NODE_ENV === "production") {
      productionUnavailable("missing-client");
    }
    console.warn("[rate-limit] client creation failed; using development fallback", {
      reason: "missing-client",
    });
    return consumeInMemory(args);
  }
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("rate_limit_consume", {
        _key: args.key,
        _window_s: args.windowSeconds,
        _max: args.max,
      });
      if (!error && typeof data === "boolean") return data;
      if (error) {
        if (process.env.NODE_ENV === "production") {
          productionUnavailable("rpc-error", error.code);
        }
        console.warn("[rate-limit] RPC failed; using development fallback", {
          reason: "rpc-error",
          ...(safeProviderCode(error.code)
            ? { code: safeProviderCode(error.code) }
            : {}),
        });
      } else if (process.env.NODE_ENV === "production") {
        productionUnavailable("invalid-response");
      } else {
        console.warn("[rate-limit] invalid RPC response; using development fallback", {
          reason: "invalid-response",
        });
      }
    } catch (error) {
      if (isRateLimitUnavailableError(error)) throw error;
      if (process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-throw");
      }
      console.warn("[rate-limit] Supabase unreachable; using development fallback", {
        reason: "rpc-throw",
      });
    }
  }
  if (process.env.NODE_ENV === "production") {
    productionUnavailable("missing-client");
  }
  return consumeInMemory(args);
}

function consumeInMemory({ key, windowSeconds, max }: RateLimitArgs): boolean {
  const now = Date.now();
  const existing = inMemory.get(key);
  if (!existing || now > existing.reset) {
    inMemory.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}

/**
 * Resolve the client IP from Vercel's protected header. Falls back to
 * `unknown` (so rate limits still apply in one coarse bucket) outside an
 * attested Vercel runtime or when the header is malformed.
 *
 * https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
 */
export function trustedClientIp(req: Request): string {
  if (process.env.VERCEL !== "1") return "unknown";
  const vercelFor = req.headers.get("x-vercel-forwarded-for");
  const candidate = vercelFor?.split(",")[0]?.trim();
  return candidate &&
    candidate.length <= 64 &&
    /^[0-9a-f:.]+$/i.test(candidate)
    ? candidate
    : "unknown";
}

type RateLimitIdentityKind = "ip" | "user";

const RATE_LIMIT_KEY_FORMAT_VERSION = "hmac-sha256-v1";

async function keyedRateLimitDigest(
  kind: RateLimitIdentityKind,
  namespace: string,
  identity: string,
): Promise<string> {
  const secret = decodeRateLimitHmacSecret(
    process.env.RATE_LIMIT_HMAC_SECRET,
  );
  if (!secret) throw new RateLimitUnavailableError();

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const payload = new TextEncoder().encode(
      JSON.stringify([RATE_LIMIT_KEY_FORMAT_VERSION, kind, namespace, identity]),
    );
    const digest = await crypto.subtle.sign("HMAC", key, payload);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    throw new RateLimitUnavailableError();
  } finally {
    secret.fill(0);
  }
}

/**
 * Build a stable, route-scoped pseudonymous key without persisting a raw IP.
 * A dedicated server-only HMAC secret prevents offline enumeration of the
 * low-entropy IPv4 address space after a rate-limit table disclosure.
 */
export async function hashedClientRateLimitKey(
  namespace: string,
  req: Request,
): Promise<string> {
  if (!/^[a-z0-9-]{1,64}$/.test(namespace)) {
    throw new Error("Invalid rate-limit namespace");
  }
  const digest = await keyedRateLimitDigest(
    "ip",
    namespace,
    trustedClientIp(req),
  );
  return `${namespace}:ip-${RATE_LIMIT_KEY_FORMAT_VERSION}:${digest}`;
}

/**
 * User-bound quota key for authenticated work. The verified user ID is the
 * entire identity, so changing IP addresses cannot reset the account budget.
 * Routes should pair this with an independent IP-only ceiling when account
 * creation is inexpensive.
 */
export async function hashedAuthenticatedRateLimitKey(
  namespace: string,
  _req: Request,
  userId: string,
): Promise<string> {
  if (!/^[a-z0-9-]{1,64}$/.test(namespace)) {
    throw new Error("Invalid rate-limit namespace");
  }
  if (userId.length < 1 || userId.length > 128) {
    throw new Error("Invalid authenticated rate-limit identity");
  }
  const digest = await keyedRateLimitDigest("user", namespace, userId);
  return `${namespace}:user-${RATE_LIMIT_KEY_FORMAT_VERSION}:${digest}`;
}

// Exposed for tests only.
export function __resetInMemoryRateLimit(): void {
  inMemory.clear();
}
