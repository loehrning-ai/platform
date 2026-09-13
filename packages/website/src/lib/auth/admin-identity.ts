import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { hasRecentSessionAuthentication } from "@/app/api/account/delete/recent-authentication";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";

/**
 * Owner identity for the operating statistics at /konto/statistik.
 *
 * INVARIANTS
 * - Authorization compares the verified Supabase Auth subject with exactly one
 *   server-only configured account id. Profile metadata, provider identity
 *   payloads, custom claims and contact addresses are never consulted: the
 *   account holder or an identity provider can change those.
 * - The authenticated user is always resolved first, even when no owner id is
 *   configured, so a disabled deployment and a denied visitor perform the same
 *   backend work.
 * - A backend failure is `unavailable`, never `denied` and never `admin`.
 * - A valid but old session is `reauth`: a long-lived cookie alone is not
 *   enough for a page whose output describes the platform's learners.
 */

const ADMIN_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * How long after an interactive sign-in the owner may open the statistics.
 * One signed-in day keeps ordinary use possible without a fresh sign-in on
 * almost every visit, while a cookie that outlives the day is not sufficient.
 */
export const ADMIN_RECENT_AUTH_MAX_AGE_SECONDS = 24 * 60 * 60;

export type AdminGateState =
  | "admin"
  | "reauth"
  | "denied"
  | "signed-out"
  | "unavailable"
  | "disabled";

/**
 * The configured owner account id, or null unless the value is a lowercase
 * canonical UUID. Anything else (a flag, a wildcard, a contact address, an
 * uppercase UUID) leaves the surface disabled.
 */
export function configuredAdminUserId(): string | null {
  const value = process.env.LOEHRNING_ADMIN_USER_ID?.trim();
  return value && ADMIN_USER_ID_PATTERN.test(value) ? value : null;
}

function matchesConfiguredId(userId: string, adminId: string): boolean {
  const actual = Buffer.from(userId, "utf8");
  const expected = Buffer.from(adminId, "utf8");
  if (actual.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(actual, expected);
}

type ClaimsOutcome =
  | { readonly kind: "claims"; readonly claims: Record<string, unknown> }
  | { readonly kind: "failed" };

async function readSessionClaims(): Promise<ClaimsOutcome> {
  try {
    const client = await createAuthServerClient();
    if (!client) return { kind: "failed" };
    const { data, error } = await client.auth.getClaims();
    if (error || !data?.claims || typeof data.claims !== "object") {
      return { kind: "failed" };
    }
    return {
      kind: "claims",
      claims: data.claims as unknown as Record<string, unknown>,
    };
  } catch {
    return { kind: "failed" };
  }
}

async function resolveAdminGate(): Promise<AdminGateState> {
  let auth: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  try {
    auth = await getAuthenticatedUser();
  } catch {
    return "unavailable";
  }
  if (!auth.configured || auth.error !== undefined) return "unavailable";

  const user = auth.user;
  if (!user || typeof user.id !== "string" || user.id.length === 0) {
    return "signed-out";
  }

  const adminId = configuredAdminUserId();
  if (!adminId) return "disabled";
  if (!matchesConfiguredId(user.id, adminId)) return "denied";

  const outcome = await readSessionClaims();
  if (outcome.kind === "failed") return "unavailable";

  return hasRecentSessionAuthentication(
    outcome.claims,
    user.id,
    Math.floor(Date.now() / 1000),
    ADMIN_RECENT_AUTH_MAX_AGE_SECONDS,
  )
    ? "admin"
    : "reauth";
}

/**
 * Request-scoped owner gate. Never throws; one verification serves the whole
 * server render. Callers must branch on the returned state and render nothing
 * owner-only unless it is exactly `admin`.
 */
export const requireAdminUser = cache(
  (): Promise<AdminGateState> => resolveAdminGate(),
);
