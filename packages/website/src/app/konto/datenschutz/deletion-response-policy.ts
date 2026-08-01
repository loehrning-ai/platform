const DEFINITE_DELETE_FAILURES: Readonly<Record<string, number>> = {
  unsupported_media_type: 415,
  auth_unavailable: 503,
  auth_not_configured: 503,
  unauthorized: 401,
  payload_too_large: 413,
  invalid_owner_binding: 400,
  account_owner_mismatch: 409,
  reauthentication_required: 403,
  rate_limit_exceeded: 429,
  rate_limit_unavailable: 503,
  admin_client_unavailable: 503,
  delete_failed: 500,
};

export function isDefiniteDeleteFailure(
  errorCode: unknown,
  status: number,
): errorCode is string {
  return (
    typeof errorCode === "string" &&
    DEFINITE_DELETE_FAILURES[errorCode] === status
  );
}
