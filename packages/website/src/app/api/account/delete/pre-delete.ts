import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Work that must finish while the account still exists.
 *
 * `auth.admin.deleteUser()` removes the only owner reference the platform
 * keeps. Anything that has to touch account-owned data outside
 * `public.user_course_progress` and the tables that cascade from `auth.users`
 * therefore has exactly one safe window: after the caller is verified as the
 * owner and rate limited, and before that delete call. Once the identity is
 * gone the data is unreachable and unattributable, so a missed step cannot be
 * repeated afterwards.
 *
 * Register such work as a step in `PRE_DELETE_STEPS` and nowhere else. The
 * delete route runs the list in order, refuses to delete anything when a step
 * fails, and never calls a step after the delete, so new work cannot end up on
 * the wrong side of the irreversible call. The hosted cv-engine's
 * artefact-detach RPC is the first step this list is meant to carry.
 *
 * A step must:
 * - be idempotent, because the route can be retried after a failed attempt;
 * - resolve when its work is durably done, and reject otherwise. A rejection
 *   keeps the account, its sessions, and all of its rows exactly as they were;
 * - use the service-role admin client it is handed, never a cookie-bound one:
 *   the session is revoked moments later and may already be unusable.
 */
export interface PreDeleteContext {
  /** Service-role client; the only client guaranteed to outlive the session. */
  readonly adminClient: SupabaseClient;
  /** Owner id taken from the verified session, never from the request body. */
  readonly userId: string;
}

export interface PreDeleteStep {
  /** Stable, greppable name; appears in the failure report. */
  readonly name: string;
  run(context: PreDeleteContext): Promise<void>;
}

/**
 * The ordered pre-delete steps.
 *
 * Empty today: everything the account currently stores either lives in
 * `public.user_course_progress` and the assessment tables, which cascade from
 * `auth.users`, or is derived from those rows. A capability that stores
 * account-owned data outside that cascade adds its step here.
 */
export const PRE_DELETE_STEPS: readonly PreDeleteStep[] = [];

export type PreDeleteResult =
  | { readonly ok: true; readonly completedSteps: readonly string[] }
  | {
      readonly ok: false;
      readonly failedStep: string;
      readonly completedSteps: readonly string[];
      readonly error: unknown;
    };

/**
 * Run every registered step in order, stopping at the first failure.
 *
 * Never throws: the caller turns a failure into a named, fail-closed response
 * instead of deleting an account whose data was not detached first.
 */
export async function runPreDeleteSteps(
  context: PreDeleteContext,
  steps: readonly PreDeleteStep[] = PRE_DELETE_STEPS,
): Promise<PreDeleteResult> {
  let completedSteps: readonly string[] = [];
  for (const step of steps) {
    try {
      await step.run(context);
    } catch (error) {
      return { ok: false, failedStep: step.name, completedSteps, error };
    }
    completedSteps = [...completedSteps, step.name];
  }
  return { ok: true, completedSteps };
}
