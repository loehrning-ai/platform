import * as Sentry from "@sentry/nextjs";
import {
  errorOnlySentryIntegrations,
  prepareSentryEvent,
  prepareSentrySpan,
} from "./src/lib/observability/sentry-privacy";
import { redactSentryCredentials } from "./src/lib/observability/sentry-redaction";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Credentials leave first, the allowlist runs second. Same reasoning as the
 * Node boundary: an Authorization header now exists on real requests, and
 * removing it must not depend on what `prepareSentryEvent` keeps.
 */
function safeSentryEvent<T extends object>(event: T): T | null {
  const redacted = redactSentryCredentials(event);
  return redacted === null ? null : prepareSentryEvent(redacted);
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampler: () => 0,
    integrations: errorOnlySentryIntegrations,
    maxBreadcrumbs: 0,
    sendClientReports: false,
    sendDefaultPii: false,
    beforeSend: (event) => safeSentryEvent(event),
    beforeSendTransaction: (event) => safeSentryEvent(event),
    beforeSendSpan: (span) => prepareSentrySpan(span),
  });
}
