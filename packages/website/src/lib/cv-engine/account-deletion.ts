/**
 * Deletion order between the platform account and the cv-engine account.
 *
 * The resume tool stores its documents, its rendered PDF bookkeeping and its
 * pending artefact cleanup inside this same Supabase project, and every one of
 * those tables hangs off `auth.users` with `on delete cascade`. So the order of
 * two operations decides whether a deletion is complete or merely invisible:
 *
 *   auth user deleted first   every cv-engine row disappears in the cascade.
 *                             The rendered PDFs in object storage are never
 *                             queued, the D+30 purge worker never sees the
 *                             account, and the files stay behind with nothing
 *                             left in the database that names them.
 *
 *   transition called first   cv-engine stamps the profile, copies every live
 *                             artefact into its cleanup queue, drops the
 *                             artefact rows and soft-deletes the documents in
 *                             one transaction. The cascade that follows then
 *                             removes rows the tool has already accounted for,
 *                             and its worker still has the queue.
 *
 * This module runs the second order, and refuses the deletion outright when it
 * cannot. Three states, all of them explicit:
 *
 *   not provisioned  cv-engine's migrations were never replayed here. There is
 *                    nothing to coordinate and the platform deletion proceeds.
 *   detached         the transition ran (or had already run for this account).
 *   failed           anything else, including a schema that is present but
 *                    whose transition cannot be called. The caller must abort.
 *
 * Two clients, because the two calls have genuinely different callers. The
 * compatibility probe is a service-role function that reports only aggregate
 * booleans and is granted to `service_role` alone. The transition takes no
 * arguments, derives its owner from `auth.uid()`, and is granted to
 * `authenticated` alone, so it has to be called with the learner's own verified
 * session. A service-role call would arrive with no `auth.uid()` and be
 * rejected as unauthenticated, which is why passing the privileged client to
 * both would look correct and delete nothing.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CvEngineDetachEvidenceError,
  CvEngineDetachFailedError,
  CvEngineDetachUnavailableError,
  CvEngineSchemaProbeError,
  postgrestErrorCode,
} from "./errors";
import { isMissingFunctionError } from "./schema-presence";

/**
 * Read-only, service-role compatibility probe. Its own definition performs the
 * `to_regprocedure` lookups, so its answer is authoritative about which of
 * cv-engine's runtime functions exist and are executable, and its absence is
 * authoritative about the schema never having been replayed here.
 */
export const CV_ENGINE_SCHEMA_CONTRACT_RPC = "release_schema_contract";

/** The transition that must run before the platform deletes the auth user. */
export const CV_ENGINE_DETACH_RPC =
  "request_account_deletion_with_artifact_detach";

/** Answers cv-engine's transition contract promises. Anything else is a fault. */
const ACCEPTED_DETACH_STATUSES: ReadonlySet<string> = new Set([
  "requested",
  "already_requested",
]);

export type CvEngineSchemaProbe =
  | { readonly status: "absent" }
  | { readonly status: "available" }
  | {
      readonly status: "failed";
      readonly error: Error;
      readonly providerCode?: string;
    };

export type CvEngineAccountDetachResult =
  | { readonly status: "not-provisioned" }
  | {
      readonly status: "detached";
      readonly requestedAt: string | null;
      readonly artifactCount: number;
      readonly alreadyRequested: boolean;
    }
  | {
      readonly status: "failed";
      readonly error: Error;
      readonly providerCode?: string;
    };

/**
 * PostgREST returns `returns table` functions as an array of rows and scalar
 * functions as the value itself. Both shapes are accepted; anything that is not
 * an object is not evidence.
 */
function firstRecord(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  return typeof candidate === "object" &&
    candidate !== null &&
    !Array.isArray(candidate)
    ? (candidate as Record<string, unknown>)
    : null;
}

function readField(record: Record<string, unknown>, key: string): unknown {
  try {
    return Reflect.get(record, key);
  } catch {
    return undefined;
  }
}

/**
 * Does this project carry cv-engine's schema, with its deletion transition
 * callable by the learner's own session?
 *
 * Called with the service-role client, which is the only role the probe is
 * granted to.
 */
export async function probeCvEngineSchema(
  serviceClient: SupabaseClient,
): Promise<CvEngineSchemaProbe> {
  let result: { data: unknown; error: unknown };
  try {
    result = await serviceClient.rpc(CV_ENGINE_SCHEMA_CONTRACT_RPC);
  } catch (error) {
    const providerCode = postgrestErrorCode(error);
    return {
      status: "failed",
      error: new CvEngineSchemaProbeError(error),
      ...(providerCode ? { providerCode } : {}),
    };
  }

  if (result.error) {
    // The probe function is itself part of cv-engine's lineage, so its absence
    // proves the whole schema is absent: there is no half state in which the
    // transition exists without it.
    if (isMissingFunctionError(result.error)) return { status: "absent" };
    const providerCode = postgrestErrorCode(result.error);
    return {
      status: "failed",
      error: new CvEngineSchemaProbeError(result.error),
      ...(providerCode ? { providerCode } : {}),
    };
  }

  const contract = firstRecord(result.data);
  if (!contract) {
    return { status: "failed", error: new CvEngineSchemaProbeError() };
  }
  const executeOk = readField(contract, "authenticated_rpc_execute_ok");
  if (executeOk === true) return { status: "available" };
  if (executeOk === false) {
    // The schema is here and the transition is not. Skipping would strand
    // artefacts; reporting a probe fault would hide why.
    return { status: "failed", error: new CvEngineDetachUnavailableError() };
  }
  return { status: "failed", error: new CvEngineSchemaProbeError() };
}

/**
 * Runs cv-engine's account deletion transition for the signed-in learner.
 *
 * `ownerClient` must be a client bound to that learner's verified session: the
 * transition reads `auth.uid()` and no argument overrides it, so the caller's
 * own owner check is what binds this call to an account.
 */
export async function detachCvEngineAccountArtifacts({
  serviceClient,
  ownerClient,
}: {
  readonly serviceClient: SupabaseClient;
  readonly ownerClient: SupabaseClient;
}): Promise<CvEngineAccountDetachResult> {
  const probe = await probeCvEngineSchema(serviceClient);
  if (probe.status === "absent") return { status: "not-provisioned" };
  if (probe.status === "failed") {
    return {
      status: "failed",
      error: probe.error,
      ...(probe.providerCode ? { providerCode: probe.providerCode } : {}),
    };
  }

  let result: { data: unknown; error: unknown };
  try {
    result = await ownerClient.rpc(CV_ENGINE_DETACH_RPC, {});
  } catch (error) {
    const providerCode = postgrestErrorCode(error);
    return {
      status: "failed",
      error: new CvEngineDetachFailedError(error),
      ...(providerCode ? { providerCode } : {}),
    };
  }
  if (result.error) {
    const providerCode = postgrestErrorCode(result.error);
    return {
      status: "failed",
      error: new CvEngineDetachFailedError(result.error),
      ...(providerCode ? { providerCode } : {}),
    };
  }

  const evidence = firstRecord(result.data);
  if (!evidence) {
    return { status: "failed", error: new CvEngineDetachEvidenceError() };
  }
  const transitionStatus = readField(evidence, "status");
  const artifacts = readField(evidence, "artifacts");
  if (
    typeof transitionStatus !== "string" ||
    !ACCEPTED_DETACH_STATUSES.has(transitionStatus) ||
    !Array.isArray(artifacts)
  ) {
    return { status: "failed", error: new CvEngineDetachEvidenceError() };
  }
  const requestedAt = readField(evidence, "requested_at");

  return {
    status: "detached",
    requestedAt: typeof requestedAt === "string" ? requestedAt : null,
    artifactCount: artifacts.length,
    alreadyRequested: transitionStatus === "already_requested",
  };
}
