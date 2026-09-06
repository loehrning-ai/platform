/**
 * Named failures for the platform side of the cv-engine coordination.
 *
 * Every one of these is thrown or reported, never returned to a browser: the
 * account routes answer with a short stable error code instead. The names
 * exist so a server log or a Sentry event says which step of the coordination
 * refused, without carrying a database message that could contain learner text.
 */
import "server-only";

/** The service-role compatibility probe did not answer with a usable row. */
export class CvEngineSchemaProbeError extends Error {
  readonly code = "CV_ENGINE_SCHEMA_PROBE_FAILED";

  constructor(cause?: unknown) {
    super("cv-engine schema compatibility probe did not answer");
    this.name = "CvEngineSchemaProbeError";
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * cv-engine's schema is present, but the deletion transition it owns is not
 * callable. Deleting the platform account in that state would cascade the
 * tool's rows away and leave its rendered PDFs behind with nothing left to
 * find them by, so the account routes refuse instead.
 */
export class CvEngineDetachUnavailableError extends Error {
  readonly code = "CV_ENGINE_DETACH_UNAVAILABLE";

  constructor() {
    super(
      "cv-engine is provisioned but its account deletion transition is not callable",
    );
    this.name = "CvEngineDetachUnavailableError";
  }
}

/** The deletion transition was called and refused or could not be reached. */
export class CvEngineDetachFailedError extends Error {
  readonly code = "CV_ENGINE_DETACH_FAILED";

  constructor(cause?: unknown) {
    super("cv-engine account deletion transition failed");
    this.name = "CvEngineDetachFailedError";
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * The transition answered, but not with the evidence its contract promises.
 * An unrecognised answer is treated exactly like a refusal: it cannot be shown
 * to have queued the artefact cleanup.
 */
export class CvEngineDetachEvidenceError extends Error {
  readonly code = "CV_ENGINE_DETACH_EVIDENCE";

  constructor() {
    // Says nothing about the payload: it describes one learner's documents.
    super("cv-engine account deletion transition returned invalid evidence");
    this.name = "CvEngineDetachEvidenceError";
  }
}

/** A learner's cv-engine documents could not be read for the data export. */
export class CvEngineDocumentReadError extends Error {
  readonly code = "CV_ENGINE_DOCUMENT_READ_FAILED";

  constructor(reason: string, cause?: unknown) {
    super(`cv-engine document export read failed: ${reason}`);
    this.name = "CvEngineDocumentReadError";
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * PostgREST error codes are the only provider detail the observability layer
 * accepts, and it re-validates them. Narrowing here keeps anything else -
 * a database message, a row, an email - from being offered to it at all.
 */
export function postgrestErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  try {
    const code = Reflect.get(error, "code");
    return typeof code === "string" && /^PGRST[0-9]{3}$/.test(code)
      ? code
      : undefined;
  } catch {
    return undefined;
  }
}
