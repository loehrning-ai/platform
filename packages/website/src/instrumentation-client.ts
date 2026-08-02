import {
  currentBrowserHref,
  errorOnlySentryIntegrations,
  prepareSentryBreadcrumb,
  prepareSentryEvent,
  prepareSentrySpan,
} from "@/lib/observability/sentry-privacy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        // Error diagnosis only. Performance spans, release-health sessions,
        // automatic interaction breadcrumbs, browser/locale context, and replay
        // are outside the declared purpose and bypass or expand event payloads.
        tracesSampler: () => 0,
        integrations: errorOnlySentryIntegrations,
        maxBreadcrumbs: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        sendClientReports: false,
        sendDefaultPii: false,
        beforeSend: (event) => prepareSentryEvent(event, currentBrowserHref()),
        beforeSendTransaction: (event) =>
          prepareSentryEvent(event, currentBrowserHref()),
        beforeBreadcrumb: (breadcrumb) =>
          prepareSentryBreadcrumb(breadcrumb, currentBrowserHref()),
        beforeSendSpan: (span) => prepareSentrySpan(span, currentBrowserHref()),
      });
    })
    // Telemetry bootstrap is optional. A chunk, CSP, or SDK-init failure must
    // not create a second unhandled error or expose loader details in console.
    .catch(() => undefined);
}

export const onRouterTransitionStart = (
  ..._args: Parameters<
    (typeof import("@sentry/nextjs"))["captureRouterTransitionStart"]
  >
) => void _args;
