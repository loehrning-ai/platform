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
    tracesSampler: () => 0,
    integrations: errorOnlySentryIntegrations,
    maxBreadcrumbs: 0,
    sendClientReports: false,
    sendDefaultPii: false,
    beforeSend: (event) => prepareSentryEvent(event),
    beforeSendTransaction: (event) => prepareSentryEvent(event),
    beforeSendSpan: (span) => prepareSentrySpan(span),
  });
}
