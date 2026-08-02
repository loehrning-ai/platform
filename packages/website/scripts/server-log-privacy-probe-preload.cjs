"use strict";

/**
 * Test-only preload for the production Next subprocess probe.
 *
 * It does not add, remove, or replace process listeners. It waits until the
 * compiled instrumentation hook exposes the installed privacy-boundary state,
 * then exercises Next's existing uncaughtException and unhandledRejection
 * handlers with fixed canaries.
 */

if (process.env.SERVER_LOG_PRIVACY_PROBE === "1") {
  const STATE_SYMBOL = Symbol.for("loehrning.server-log-privacy.v1");
  const probeCanary = (kind, suffix) =>
    ["LOEHRNING", "SERVER", "LOG", kind, "CANARY", suffix].join("_");
  const ERROR_CANARY = probeCanary("ERROR", "7f41f4d6b58a");
  const PRIMITIVE_CANARY = probeCanary("PRIMITIVE", "129c3e8ad470");
  const SAFE_REQUEST_ID = "123e4567-e89b-42d3-a456-426614174042";
  const DONE_LINE = '{"event":"server-log-privacy-probe-done"}';
  const TIMEOUT_LINE = '{"event":"server-log-privacy-probe-timeout"}';

  const deadline = Date.now() + 20_000;
  const interval = setInterval(() => {
    const state = globalThis[STATE_SYMBOL];
    if (
      state &&
      state.installed === true &&
      typeof state.guardedError === "function" &&
      console.error === state.guardedError &&
      typeof state.writeSafeApiErrorLog === "function"
    ) {
      clearInterval(interval);

      state.writeSafeApiErrorLog({
        route: "/api/progress",
        step: "unhandled",
        requestId: SAFE_REQUEST_ID,
        errorName: "Error",
        errorCode: "unknown",
        status: 500,
        ignoredSecret: ERROR_CANARY,
      });

      // Let Next finish its current initialization turn before exercising the
      // process handlers it already owns.
      setTimeout(() => {
        Promise.reject(PRIMITIVE_CANARY);
      }, 250);
      setTimeout(() => {
        throw new Error(ERROR_CANARY);
      }, 500);
      setTimeout(() => {
        process.stdout.write(`${DONE_LINE}\n`);
      }, 900);
      return;
    }

    if (Date.now() >= deadline) {
      clearInterval(interval);
      process.stdout.write(`${TIMEOUT_LINE}\n`);
    }
  }, 25);
}
