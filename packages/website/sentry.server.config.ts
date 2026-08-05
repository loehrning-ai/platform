import * as Sentry from "@sentry/nextjs";
import {
  errorOnlySentryIntegrations,
  prepareSentryEvent,
  prepareSentrySpan,
} from "./src/lib/observability/sentry-privacy";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

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
    beforeSend: (event) => prepareSentryEvent(event),
    beforeSendTransaction: (event) => prepareSentryEvent(event),
    beforeSendSpan: (span) => prepareSentrySpan(span),
  });
}
