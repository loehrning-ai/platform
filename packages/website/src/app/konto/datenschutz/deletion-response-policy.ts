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
  // The connected resume editor refused its own pre-delete cleanup
  // (src/app/api/account/delete/route.ts). That answer is returned before
  // any session is revoked and before deleteUser(), so the account
  // provably still exists and a later retry is exactly right. Without
  // this entry the page would read it as an indeterminate deletion and
  // tell the learner not to try again, which is the opposite of the truth.
  cv_engine_cleanup_unavailable: 503,
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
