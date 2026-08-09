"use client";

import * as Sentry from "@sentry/nextjs";

export const CLIENT_BOUNDARY_IDS = [
  "app-root",
  "app-global",
  "app-blog",
  "app-books",
  "demos-index",
  "demos-detail",
  "ai-native-course",
  "ai-native-module",
  "ai-native-lesson",
  "ai-native-operator-course",
  "ai-native-operator-module",
  "ai-native-operator-lesson",
  "eu-ai-act-course",
  "eu-ai-act-block",
  "ki-fuehrerschein-course",
  "ki-fuehrerschein-block",
  "ki-und-gesellschaft-course",
  "ki-und-gesellschaft-block",
  "wie-ki-funktioniert",
  "data-engineering-chapter",
  "ai-native-exercise",
  "workshop-quiz",
  "codex-course",
  "claude-course",
  "data-infrastructure-course",
  "data-science-course",
  "data-science-chapter",
] as const;

export type ClientBoundaryId = (typeof CLIENT_BOUNDARY_IDS)[number];

const CLIENT_BOUNDARY_ID_SET = new Set<string>(CLIENT_BOUNDARY_IDS);
const UNKNOWN_BOUNDARY_ID = "unknown-client-boundary";
const REPORT_MESSAGE = "client-boundary-failure";
const MAX_NEXT_DIGEST = 0xffff_ffff;

/**
 * Next generates App Router error digests from an unsigned 32-bit string hash.
 * Accept only that canonical decimal representation; arbitrary free text must
 * never be promoted into telemetry or recovery UI as a correlation ID.
 */
export function validatedNextDigest(error: unknown): string | undefined {
  let candidate: unknown;
  try {
    if (
      error === null ||
      (typeof error !== "object" && typeof error !== "function")
    ) {
      return undefined;
    }
    candidate = (error as { readonly digest?: unknown }).digest;
  } catch {
    return undefined;
  }

  if (
    typeof candidate !== "string" ||
    !/^(?:0|[1-9]\d{0,9})$/.test(candidate)
  ) {
    return undefined;
  }

  const numericDigest = Number(candidate);
  return Number.isInteger(numericDigest) && numericDigest <= MAX_NEXT_DIGEST
    ? candidate
    : undefined;
}

/**
 * Report a client recovery-boundary failure without forwarding the original
 * thrown value. The isolated Sentry scope is cleared before adding the two
 * allowlisted correlation fields, so messages, stacks, breadcrumbs, user data,
 * prompts, tokens, and form values cannot be inherited from the failing scope.
 */
export function reportClientBoundaryError(
  boundaryId: ClientBoundaryId,
  error: unknown,
): void {
  const safeBoundaryId = CLIENT_BOUNDARY_ID_SET.has(boundaryId)
    ? boundaryId
    : UNKNOWN_BOUNDARY_ID;
  const digest = validatedNextDigest(error);
  const metadata = Object.freeze({
    boundaryId: safeBoundaryId,
    ...(digest ? { nextDigest: digest } : {}),
  });

  // Keep the console signal useful for local diagnosis without serializing the
  // thrown value. Strict browser tests intentionally fail on this safe signal.
  console.error(`[${REPORT_MESSAGE}]`, metadata);

  try {
    Sentry.withScope((scope) => {
      scope.clear();
      scope.setLevel("error");
      scope.setTag("client.boundary", safeBoundaryId);
      if (digest) scope.setTag("next.digest", digest);
      Sentry.captureMessage(REPORT_MESSAGE);
    });
  } catch {
    // Telemetry must never break the recovery boundary. Do not log the SDK
    // failure: its error could itself contain transport or configuration data.
  }
}
