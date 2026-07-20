import * as Sentry from "@sentry/nextjs";
import {
  isCertificateVerificationUrl,
  prepareSentryEvent,
  prepareSentrySpan,
} from "./src/lib/observability/sentry-privacy";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampler: ({ name, normalizedRequest, inheritOrSampleWith }) =>
      isCertificateVerificationUrl(name) ||
      isCertificateVerificationUrl(normalizedRequest?.url)
        ? 0
        : inheritOrSampleWith(0.1),
    // sendDefaultPii: false suppresses event.user.ip_address.
    // The beforeSend hook below additionally strips event.request.env.REMOTE_ADDR
    // which the Next.js SDK captures independently of sendDefaultPii.
    // Together these ensure IP addresses are never transmitted to Sentry.
    // DPA acceptance evidence remains a production launch gate.
    sendDefaultPii: false,
    beforeSend: (event) => prepareSentryEvent(event),
    beforeSendTransaction: (event) => prepareSentryEvent(event),
    beforeSendSpan: (span) => prepareSentrySpan(span),
  });
}
