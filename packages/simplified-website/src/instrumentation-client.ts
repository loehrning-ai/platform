import * as Sentry from "@sentry/nextjs";
import {
  currentBrowserHref,
  isCertificateVerificationUrl,
  prepareSentryBreadcrumb,
  prepareSentryEvent,
  prepareSentrySpan,
} from "@/lib/observability/sentry-privacy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampler: () =>
      isCertificateVerificationUrl(currentBrowserHref()) ? 0 : 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: (event) => prepareSentryEvent(event, currentBrowserHref()),
    beforeSendTransaction: (event) =>
      prepareSentryEvent(event, currentBrowserHref()),
    beforeBreadcrumb: (breadcrumb) =>
      prepareSentryBreadcrumb(breadcrumb, currentBrowserHref()),
    beforeSendSpan: (span) => prepareSentrySpan(span, currentBrowserHref()),
  });
}

export const onRouterTransitionStart = (
  ...args: Parameters<typeof Sentry.captureRouterTransitionStart>
) => {
  if (isCertificateVerificationUrl(currentBrowserHref())) return;
  return Sentry.captureRouterTransitionStart(...args);
};
