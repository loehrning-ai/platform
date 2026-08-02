import { isSafePublicSupabaseKey } from "./key-classification.mjs";

const SUPABASE_PROJECT_HOST = /^[a-z0-9-]+\.supabase\.co$/i;
const MAX_SUPABASE_ORIGIN_LENGTH = 2048;

export { isSafePublicSupabaseKey };

/**
 * Accept only Supabase's standard hosted project origin. Local loopback is
 * available outside production for the Supabase CLI emulator. This guard runs
 * inside every client factory so bypassing the build preflight cannot redirect
 * browser or service-role credentials to an arbitrary HTTPS endpoint.
 */
export function normalizeSupabaseOrigin(value: string): string | null {
  if (
    value.length === 0 ||
    value.length > MAX_SUPABASE_ORIGIN_LENGTH ||
    value !== value.trim()
  ) {
    return null;
  }
  try {
    const parsed = new URL(value);
    const isLoopback =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]";
    const isLocalDevelopment =
      isLoopback &&
      process.env.NODE_ENV !== "production" &&
      (parsed.protocol === "http:" || parsed.protocol === "https:");
    const isHostedProject =
      parsed.protocol === "https:" &&
      parsed.port === "" &&
      SUPABASE_PROJECT_HOST.test(parsed.hostname);

    if (!isHostedProject && !isLocalDevelopment) return null;
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getSupabasePublicConfig(): {
  readonly url: string;
  readonly publishableKey: string;
} | null {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !publishableKey) return null;

  const url = normalizeSupabaseOrigin(rawUrl);
  if (!url) {
    console.error("[supabase/config] Invalid Supabase URL.");
    return null;
  }
  if (!isSafePublicSupabaseKey(publishableKey)) {
    console.error("[supabase/config] Unsafe public Supabase key.");
    return null;
  }

  // Startup sanity check: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL should point
  // to the same Supabase project. The CSP in next.config.ts uses
  // NEXT_PUBLIC_SUPABASE_URL to pin the exact origin; a mismatch means the server
  // client silently targets a different project than the browser client.
  // If both exist, disagreement is an unsafe split-brain configuration:
  // browser auth and privileged server writes would target different projects.
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_URL &&
    normalizeSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL) !==
      normalizeSupabaseOrigin(process.env.SUPABASE_URL)
  ) {
    console.error(
      "[supabase/config] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL differ: " +
      "refusing to initialize split-project authentication.",
    );
    return null;
  }

  return { url, publishableKey };
}

export function hasSupabasePublicConfig(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Cookie options shared by every @supabase/ssr client. `secure` is gated to
 * production so auth cookies are HTTPS-only in the deployed app, while local
 * http dev (localhost) still sets them. `sameSite: "lax"` matches the library
 * default and is what makes login/logout CSRF-safe. httpOnly is intentionally
 * left at the library default (false) because the browser client reads the token.
 */
export const AUTH_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;
