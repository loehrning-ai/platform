import {
  installProductionServerLogPrivacyBoundary,
  writeRedactedServerErrorMarker,
} from "@/lib/observability/server-log-privacy";

export async function register(): Promise<void> {
  installProductionServerLogPrivacyBoundary();

  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    }
  } catch {
    // Optional telemetry must fail open without exposing the SDK/configuration
    // error through Next's raw production console path.
    writeRedactedServerErrorMarker();
  }
}

export async function onRequestError(
  ...args: Parameters<
    (typeof import("@sentry/nextjs"))["captureRequestError"]
  >
): Promise<void> {
  if (!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN)) return;
  try {
    const { captureRequestError } = await import("@sentry/nextjs");
    captureRequestError(...args);
  } catch {
    // The request response must not depend on an optional telemetry client.
    writeRedactedServerErrorMarker();
  }
}
