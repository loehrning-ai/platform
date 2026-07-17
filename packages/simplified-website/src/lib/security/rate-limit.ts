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
 * `trustedClientIp()` reads Vercel's `x-vercel-forwarded-for` or `x-real-ip`
 * headers rather than the user-controlled `x-forwarded-for`. Those headers
 * are stripped/rewritten by Vercel before the request hits us, so an
 * attacker cannot forge them from outside the network boundary.
 *
 * Persistence boundary
 * --------------------
 * Routes must pass `hashedClientRateLimitKey()` to the durable limiter. It
 * binds a trusted client IP to a route namespace and stores only a SHA-256
 * pseudonymous identifier, never the raw address. The hash remains personal
 * data for privacy purposes and is handled as such in the public notice.
 */
import { tryCreateServiceClient } from "@/lib/supabase/server";

type RateLimitArgs = {
  readonly key: string;
  readonly windowSeconds: number;
  readonly max: number;
};

const inMemory = new Map<string, { count: number; reset: number }>();

export async function consumeRateLimit(args: RateLimitArgs): Promise<boolean> {
  const supabase = tryCreateServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("rate_limit_consume", {
        _key: args.key,
        _window_s: args.windowSeconds,
        _max: args.max,
      });
      if (!error && typeof data === "boolean") return data;
      if (error) {
        console.warn("[rate-limit] RPC failed, using in-memory fallback", {
          code: error.code, message: error.message,
        });
        if (process.env.NODE_ENV === "production") return false;
      }
    } catch (err) {
      console.warn("[rate-limit] Supabase unreachable, using in-memory fallback", {
        message: err instanceof Error ? err.message : String(err),
      });
      if (process.env.NODE_ENV === "production") return false;
    }
  }
  if (process.env.NODE_ENV === "production") return false;
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
 * Resolve the client IP from a Vercel-trusted header chain. Falls back
 * to `unknown` (so rate limits still apply but in a coarse bucket) if none
 * of the trusted headers are present — never trusts `x-forwarded-for`
 * without additional context because clients can set it freely.
 */
export function trustedClientIp(req: Request): string {
  // Vercel's own client-IP headers take precedence. They're set by the
  // edge and stripped from incoming requests so they can't be spoofed.
  const vercelFor = req.headers.get("x-vercel-forwarded-for");
  if (vercelFor) return vercelFor.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // Cloudflare (if ever used in front of Vercel).
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

/**
 * Build a stable, route-scoped pseudonymous key without persisting a raw IP.
 * Web Crypto keeps this helper compatible with both Edge and Node runtimes.
 */
export async function hashedClientRateLimitKey(
  namespace: string,
  req: Request,
): Promise<string> {
  if (!/^[a-z0-9-]{1,64}$/.test(namespace)) {
    throw new Error("Invalid rate-limit namespace");
  }
  const payload = new TextEncoder().encode(
    `${namespace}:${trustedClientIp(req)}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", payload);
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${namespace}:sha256:${hex}`;
}

// Exposed for tests only.
export function __resetInMemoryRateLimit(): void {
  inMemory.clear();
}
