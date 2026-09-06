/**
 * Is cv-engine's schema present in this Supabase project?
 *
 * The resume tool keeps its own tables, functions and PDF bookkeeping inside
 * the same project as the learning platform. Both lineages are applied
 * separately, so at any moment this deployment may be talking to a project
 * where cv-engine's objects exist, or to one where they do not: a preview
 * branch, a fresh local stack, or production before the tool's migrations were
 * replayed. Platform code therefore never assumes either state. It asks.
 *
 * PostgREST answers that question in the error code of the very call that
 * needed the object, which is the runtime equivalent of
 * `to_regprocedure('public.<name>()') is null` without a second round trip:
 *
 *   PGRST202  the function is not in the schema cache
 *   PGRST205  the relation is not in the schema cache
 *   42883     Postgres undefined_function, when the call reached the database
 *   42P01     Postgres undefined_table, likewise
 *
 * Everything else is a real failure and must stay one. A denied privilege
 * (42501), an exhausted connection pool, a timeout, or an unexposed schema
 * (PGRST106) all mean "cv-engine may well be here and we could not reach it",
 * which is the opposite of absence and must never be silently skipped.
 */
import "server-only";

const MISSING_FUNCTION_CODES: ReadonlySet<string> = new Set([
  "PGRST202",
  "42883",
]);

const MISSING_RELATION_CODES: ReadonlySet<string> = new Set([
  "PGRST205",
  "42P01",
]);

/**
 * Reads `error.code` without trusting the object it came from. Supabase errors
 * are plain objects, but a rejected promise can carry anything at all,
 * including a proxy whose getter throws.
 */
function databaseErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  try {
    const code = Reflect.get(error, "code");
    return typeof code === "string" ? code : null;
  } catch {
    return null;
  }
}

/** True only when the named function does not exist in this project. */
export function isMissingFunctionError(error: unknown): boolean {
  const code = databaseErrorCode(error);
  return code !== null && MISSING_FUNCTION_CODES.has(code);
}

/** True only when the named table or view does not exist in this project. */
export function isMissingRelationError(error: unknown): boolean {
  const code = databaseErrorCode(error);
  return code !== null && MISSING_RELATION_CODES.has(code);
}
