/**
 * Owner account id for the operating statistics, parsed from the server-only
 * LOEHRNING_ADMIN_USER_ID variable.
 *
 * This module deliberately has no Node built-in and no `server-only` import:
 * provider-readiness depends on it, and provider-readiness is reached from
 * route handlers that run on the Edge runtime, which cannot resolve `node:`
 * modules. The gate itself, with its constant-time comparison, stays in
 * admin-identity.ts.
 */

const ADMIN_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * The configured owner account id, or null unless the value is a lowercase
 * canonical UUID. Anything else (a flag, a wildcard, a contact address, an
 * uppercase UUID) leaves the surface disabled.
 */
export function configuredAdminUserId(): string | null {
  const value = process.env.LOEHRNING_ADMIN_USER_ID?.trim();
  return value && ADMIN_USER_ID_PATTERN.test(value) ? value : null;
}
