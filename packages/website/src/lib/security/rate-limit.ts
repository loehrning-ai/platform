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

type UsageBudgetArgs = RateLimitArgs & {
  /** Positive integer units reserved atomically from the bounded window. */
  readonly cost: number;
};

export type PairedUsageBudgetArgs = {
  readonly callerKey: string;
  readonly globalKey: string;
  readonly windowSeconds: number;
  readonly callerMax: number;
  readonly globalMax: number;
  /** Positive integer units reserved from both windows or neither. */
  readonly cost: number;
};

export type MultiRateLimitEntry = Readonly<{
  key: string;
  max: number;
}>;

type MultiRateLimitArgs = Readonly<{
  entries: readonly MultiRateLimitEntry[];
  windowSeconds: number;
}>;

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
      (typeof error === "object" &&
        error !== null &&
        Reflect.get(error, "code") === "RATE_LIMIT_UNAVAILABLE")
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
    console.warn(
      "[rate-limit] client creation failed; using development fallback",
      {
        reason: "missing-client",
      },
    );
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
        console.warn(
          "[rate-limit] invalid RPC response; using development fallback",
          {
            reason: "invalid-response",
          },
        );
      }
    } catch (error) {
      if (isRateLimitUnavailableError(error)) throw error;
      if (process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-throw");
      }
      console.warn(
        "[rate-limit] Supabase unreachable; using development fallback",
        {
          reason: "rpc-throw",
        },
      );
    }
  }
  if (process.env.NODE_ENV === "production") {
    productionUnavailable("missing-client");
  }
  return consumeInMemory(args);
}

/**
 * Atomically reserve multiple units from a durable budget window. Production
 * requires the `usage_budget_consume` service-role RPC; development may use
 * the same process-local fallback as the request limiter.
 */
export async function consumeUsageBudget(
  args: UsageBudgetArgs,
): Promise<boolean> {
  if (
    !Number.isSafeInteger(args.cost) ||
    args.cost < 1 ||
    args.cost > 1_000_000 ||
    !Number.isSafeInteger(args.max) ||
    args.max < 1 ||
    args.max > 2_000_000_000
  ) {
    throw new RateLimitUnavailableError();
  }

  let supabase: ReturnType<typeof tryCreateServiceClient>;
  try {
    supabase = tryCreateServiceClient();
  } catch {
    if (process.env.NODE_ENV === "production") {
      productionUnavailable("missing-client");
    }
    return consumeInMemoryCost(args);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("usage_budget_consume", {
        _key: args.key,
        _window_s: args.windowSeconds,
        _max: args.max,
        _cost: args.cost,
      });
      if (!error && typeof data === "boolean") return data;
      if (error) {
        if (process.env.NODE_ENV === "production") {
          productionUnavailable("rpc-error", error.code);
        }
      } else if (process.env.NODE_ENV === "production") {
        productionUnavailable("invalid-response");
      }
    } catch (error) {
      if (isRateLimitUnavailableError(error)) throw error;
      if (process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-throw");
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    productionUnavailable("missing-client");
  }
  return consumeInMemoryCost(args);
}

/**
 * Reserve the same units from caller and deployment-wide budgets in one
 * transaction. Production requires the service-role-only paired RPC so a
 * refusal or backend failure can never debit just one side of the ledger.
 */
export async function consumePairedUsageBudget(
  args: PairedUsageBudgetArgs,
): Promise<boolean> {
  if (!isValidPairedUsageBudget(args)) {
    throw new RateLimitUnavailableError();
  }

  let supabase: ReturnType<typeof tryCreateServiceClient>;
  try {
    supabase = tryCreateServiceClient();
  } catch {
    if (process.env.NODE_ENV === "production") {
      productionUnavailable("missing-client");
    }
    return consumeInMemoryPair(args);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("usage_budget_consume_pair", {
        _caller_key: args.callerKey,
        _global_key: args.globalKey,
        _window_s: args.windowSeconds,
        _caller_max: args.callerMax,
        _global_max: args.globalMax,
        _cost: args.cost,
      });
      if (!error && typeof data === "boolean") return data;
      if (error) {
        if (process.env.NODE_ENV === "production") {
          productionUnavailable("rpc-error", error.code);
        }
      } else if (process.env.NODE_ENV === "production") {
        productionUnavailable("invalid-response");
      }
    } catch (error) {
      if (isRateLimitUnavailableError(error)) throw error;
      if (process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-throw");
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    productionUnavailable("missing-client");
  }
  return consumeInMemoryPair(args);
}

/**
 * Reserve one request from every applicable scope in one transaction. A
 * rejected user/IP/global combination mutates no counter, preventing a later
 * scope from poisoning an earlier scope's quota.
 */
export async function consumeMultiRateLimit(
  args: MultiRateLimitArgs,
): Promise<boolean> {
  if (!isValidMultiRateLimit(args)) throw new RateLimitUnavailableError();

  let supabase: ReturnType<typeof tryCreateServiceClient>;
  try {
    supabase = tryCreateServiceClient();
  } catch {
    if (process.env.NODE_ENV === "production") {
      productionUnavailable("missing-client");
    }
    return consumeInMemoryMulti(args);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("rate_limit_consume_multi", {
        _keys: args.entries.map((entry) => entry.key),
        _window_s: args.windowSeconds,
        _maxes: args.entries.map((entry) => entry.max),
      });
      if (!error && typeof data === "boolean") return data;
      if (error && process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-error", error.code);
      }
      if (!error && process.env.NODE_ENV === "production") {
        productionUnavailable("invalid-response");
      }
    } catch (error) {
      if (isRateLimitUnavailableError(error)) throw error;
      if (process.env.NODE_ENV === "production") {
        productionUnavailable("rpc-throw");
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    productionUnavailable("missing-client");
  }
  return consumeInMemoryMulti(args);
}

function consumeInMemory({ key, windowSeconds, max }: RateLimitArgs): boolean {
  return consumeInMemoryCost({ key, windowSeconds, max, cost: 1 });
}

function consumeInMemoryCost({
  key,
  windowSeconds,
  max,
  cost,
}: UsageBudgetArgs): boolean {
  const now = Date.now();
  const existing = inMemory.get(key);
  if (!existing || now > existing.reset) {
    inMemory.set(key, { count: cost, reset: now + windowSeconds * 1000 });
    return cost <= max;
  }
  if (existing.count > max - cost) return false;
  existing.count += cost;
  return true;
}

function isValidPairedUsageBudget(args: PairedUsageBudgetArgs): boolean {
  return (
    args.callerKey.length >= 1 &&
    args.callerKey.length <= 256 &&
    args.globalKey.length >= 1 &&
    args.globalKey.length <= 256 &&
    args.callerKey !== args.globalKey &&
    Number.isSafeInteger(args.windowSeconds) &&
    args.windowSeconds >= 1 &&
    args.windowSeconds <= 2_678_400 &&
    Number.isSafeInteger(args.callerMax) &&
    args.callerMax >= 1 &&
    args.callerMax <= 2_000_000_000 &&
    Number.isSafeInteger(args.globalMax) &&
    args.globalMax >= 1 &&
    args.globalMax <= 2_000_000_000 &&
    Number.isSafeInteger(args.cost) &&
    args.cost >= 1 &&
    args.cost <= 1_000_000
  );
}

function consumeInMemoryPair(args: PairedUsageBudgetArgs): boolean {
  const now = Date.now();
  const caller = inMemory.get(args.callerKey);
  const global = inMemory.get(args.globalKey);
  const callerCount = !caller || now > caller.reset ? 0 : caller.count;
  const globalCount = !global || now > global.reset ? 0 : global.count;

  if (
    callerCount > args.callerMax - args.cost ||
    globalCount > args.globalMax - args.cost
  ) {
    return false;
  }

  inMemory.set(args.callerKey, {
    count: callerCount + args.cost,
    reset: callerCount === 0 ? now + args.windowSeconds * 1000 : caller!.reset,
  });
  inMemory.set(args.globalKey, {
    count: globalCount + args.cost,
    reset: globalCount === 0 ? now + args.windowSeconds * 1000 : global!.reset,
  });
  return true;
}

function isValidMultiRateLimit(args: MultiRateLimitArgs): boolean {
  if (
    !Number.isSafeInteger(args.windowSeconds) ||
    args.windowSeconds < 1 ||
    args.windowSeconds > 2_678_400 ||
    args.entries.length < 1 ||
    args.entries.length > 4
  ) {
    return false;
  }
  const keys = new Set<string>();
  return args.entries.every((entry) => {
    if (
      entry.key.length < 1 ||
      entry.key.length > 256 ||
      keys.has(entry.key) ||
      !Number.isSafeInteger(entry.max) ||
      entry.max < 1 ||
      entry.max > 2_000_000_000
    ) {
      return false;
    }
    keys.add(entry.key);
    return true;
  });
}

function consumeInMemoryMulti(args: MultiRateLimitArgs): boolean {
  const now = Date.now();
  const snapshots = args.entries.map((entry) => {
    const existing = inMemory.get(entry.key);
    return {
      ...entry,
      existing,
      count: !existing || now > existing.reset ? 0 : existing.count,
    };
  });
  if (snapshots.some((entry) => entry.count >= entry.max)) return false;
  for (const entry of snapshots) {
    inMemory.set(entry.key, {
      count: entry.count + 1,
      reset:
        entry.count === 0
          ? now + args.windowSeconds * 1000
          : entry.existing!.reset,
    });
  }
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
  return candidate && candidate.length <= 64 && /^[0-9a-f:.]+$/i.test(candidate)
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
  const secret = decodeRateLimitHmacSecret(process.env.RATE_LIMIT_HMAC_SECRET);
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
      JSON.stringify([
        RATE_LIMIT_KEY_FORMAT_VERSION,
        kind,
        namespace,
        identity,
      ]),
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
