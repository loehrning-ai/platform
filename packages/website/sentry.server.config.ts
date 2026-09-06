import * as Sentry from "@sentry/nextjs";
import {
  errorOnlySentryIntegrations,
  prepareSentryEvent,
  prepareSentrySpan,
} from "./src/lib/observability/sentry-privacy";
import { redactSentryCredentials } from "./src/lib/observability/sentry-redaction";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Credentials leave first, the allowlist runs second.
 *
 * The agent endpoint accepts bearer credentials, so an Authorization header
 * now exists on real requests to this application. Removing it is a rule of
 * its own and must not depend on `prepareSentryEvent` happening to omit
 * whatever field a future SDK version attaches a request to.
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
    // Error diagnosis only. Filtering Http also prevents the Node SDK's
    // request-session envelopes, which do not pass through beforeSend.
    tracesSampler: () => 0,
    integrations: (defaults) => [
      ...errorOnlySentryIntegrations(defaults),
      // Preserve per-request scope isolation without request spans, request
      // bodies, outgoing breadcrumbs/trace headers, or session envelopes.
      Sentry.httpIntegration({
        breadcrumbs: false,
        spans: false,
        tracePropagation: false,
        trackIncomingRequestsAsSessions: false,
        disableIncomingRequestSpans: true,
        maxIncomingRequestBodySize: "none",
        ignoreIncomingRequestBody: () => true,
      }),
    ],
    maxBreadcrumbs: 0,
    includeLocalVariables: false,
    sendClientReports: false,
    sendDefaultPii: false,
    beforeSend: (event) => safeSentryEvent(event),
    beforeSendTransaction: (event) => safeSentryEvent(event),
    beforeSendSpan: (span) => prepareSentrySpan(span),
  });
}
