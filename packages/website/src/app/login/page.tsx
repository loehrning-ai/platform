import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AnalyticsLoginAvailability } from "@/lib/analytics/registry";
import { LoginScene } from "@/components/login/login-scene";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { LOGIN_COPY, type LoginUnavailableReason } from "./login-copy";
import { LoginForm } from "./login-form";
import { LoginGateSignal } from "./login-gate-signal";
import "./login-scene.css";

/**
 * Which method families the page offers: the email link, OAuth (Google or
 * GitHub), both, or neither. Reported alongside a gate reason only.
 */
function loginAvailabilityFor(
  magicLinkReady: boolean,
  oauthReady: boolean,
): AnalyticsLoginAvailability {
  if (magicLinkReady && oauthReady) return "all";
  if (oauthReady) return "oauth_only";
  if (magicLinkReady) return "magic_only";
  return "none";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(LOGIN_COPY[locale].metadata);
}

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly next?: string;
    readonly reason?: string;
  }>;
}) {
  const [params, locale, auth] = await Promise.all([
    searchParams,
    getRequestLocale(),
    getAuthenticatedUser(),
  ]);
  const next = localizeHref(sanitizeNextPath(params.next ?? "/konto"), locale);
  const { configured, user, error: authError } = auth;
  const runtime = getRuntimeFeatures();
  const copy = LOGIN_COPY[locale];

  const accountReady = configured && runtime.account && !authError;
  const magicLinkReady = accountReady && runtime.magicLink;
  const googleReady = accountReady && runtime.google;
  // GitHub is optional and independently attested. `runtime.github` can be
  // absent on an older feature snapshot, so it is coerced rather than trusted.
  const githubReady = accountReady && runtime.github === true;
  const loginAvailable = magicLinkReady || googleReady || githubReady;
  const loginAvailability = loginAvailabilityFor(
    magicLinkReady,
    googleReady || githubReady,
  );
  if (accountReady && user) redirect(next);

  // Four disjoint machine states, never collapsed into one "not available".
  // A learner reading this page has to be able to tell a transient outage from
  // a deployment that never had accounts, because only one of the two is worth
  // waiting for.
  const unavailableReason: LoginUnavailableReason = authError
    ? "outage"
    : configured && !runtime.account
      ? "configuration"
      : accountReady && !loginAvailable
        ? "methods"
        : "disabled";

  const loginForm = (
    <LoginForm
      next={next}
      accountReady={accountReady}
      magicLinkReady={magicLinkReady}
      googleReady={googleReady}
      githubReady={githubReady}
      turnstileSiteKey={runtime.turnstileSiteKey}
      locale={locale}
      unavailableReason={unavailableReason}
    />
  );

  const unavailableCopy = copy.unavailable[unavailableReason];

  // Kept under the card, compact: the three things an account adds and the
  // local-progress note. Stated before signing in, not discovered after:
  // anonymous progress is never merged into an account on its own (see
  // store.ts), so a learner who studied signed-out would otherwise meet an
  // empty dashboard with no warning.
  const accountValuePanel = (
    <section
      aria-labelledby="login-account-value"
      data-login-account-value
      className="login-subpanel login-rise min-w-0 px-4 py-3.5 text-left"
      data-rise="5"
    >
      <h2
        id="login-account-value"
        className="text-[13px] font-medium text-muted-foreground"
      >
        {copy.accountValue.heading}
      </h2>
      <ul className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1.5">
        {copy.accountValue.items.map((item) => (
          <li
            key={item}
            className="flex min-w-0 items-baseline gap-2 text-sm font-medium leading-snug text-foreground"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 translate-y-[-1px] rounded-[2px] bg-brand-orange"
            />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 break-words border-t border-hairline pt-2.5 text-[13px] leading-relaxed text-muted-foreground">
        {copy.accountValue.localNote}
      </p>
    </section>
  );

  const publicAccessPanel = (
    <section
      aria-labelledby="login-public-access"
      data-login-public-access
      className="login-subpanel login-rise min-w-0 px-4 py-3 text-left"
      data-rise="5"
    >
      <h2
        id="login-public-access"
        className="pt-1 text-[13px] font-medium text-muted-foreground"
      >
        {copy.publicAccess.heading}
      </h2>
      <ul className="mt-1 grid min-w-0 gap-x-4 sm:grid-cols-2">
        {copy.publicAccess.links.map((link) => (
          <li key={link.path} className="min-w-0">
            <Link
              href={localizeHref(link.path, locale)}
              className="group flex min-h-11 min-w-0 flex-col justify-center gap-0.5 rounded-lg py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <span className="text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
                {link.label}
              </span>{" "}
              {/* The space keeps the accessible name from running the label
                  into its note. A white-space-only flex item is not rendered,
                  so the two rows stay flush. */}
              <span className="block break-words text-[13px] leading-snug text-muted-foreground">
                {link.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <section data-login-scene className="login-scene">
      <LoginScene pauseLabel={copy.scene.pauseMotion} />
      {/* One centred column: the card, then one quiet panel under it. On a
          phone the sign-in task therefore always comes first. */}
      <div className="login-scene-content mx-auto flex min-h-[calc(100svh-var(--nav-h-compact))] w-full min-w-0 max-w-[27rem] flex-col justify-center gap-4 px-4 pb-10 pt-16 sm:pt-20 lg:min-h-[calc(100svh-var(--nav-h))] lg:py-14">
        <div
          data-login-layout={loginAvailable ? "form" : "status"}
          className="grid min-w-0 gap-4"
        >
          <div className="login-card login-rise min-w-0 px-5 pb-6 pt-8 sm:px-7">
            <header className="min-w-0 text-center">
              <div
                aria-hidden="true"
                className="login-logo login-rise mx-auto mb-[18px]"
                data-rise="1"
              >
                <span className="text-2xl font-black leading-none">L</span>
              </div>
              <h1
                className="login-rise break-words text-[1.375rem] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground"
                data-rise="2"
              >
                {authError
                  ? copy.heading.outage
                  : loginAvailable
                    ? copy.heading.available
                    : copy.heading.unavailable}
              </h1>
              <p
                className="login-rise mt-2 break-words text-sm leading-relaxed text-muted-foreground"
                data-rise="2"
              >
                {loginAvailable
                  ? copy.introduction.available
                  : `${copy.introduction.publicAccess} ${
                      unavailableReason === "outage"
                        ? copy.introduction.outage
                        : unavailableReason === "configuration"
                          ? copy.introduction.configuration
                          : unavailableReason === "methods"
                            ? copy.introduction.methodsUnavailable
                            : copy.introduction.accountUnavailable
                    }`}
              </p>
            </header>
            {params.reason ? (
              <div
                role="alert"
                className="login-rise mt-5 break-words rounded-xl border border-hairline border-l-[3px] border-l-brand-orange bg-white/[0.04] px-3.5 py-3 text-left text-sm leading-relaxed text-muted-foreground"
                data-rise="3"
              >
                {loginReasonMessage(params.reason, loginAvailable, locale)}
                {/* No reason, no event: the /login pageview is the denominator. */}
                <LoginGateSignal
                  reason={params.reason}
                  loginAvailability={loginAvailability}
                />
              </div>
            ) : null}
            {loginAvailable ? null : (
              <section
                aria-labelledby="login-status-heading"
                data-login-status={unavailableReason}
                className="login-rise mt-5 min-w-0 rounded-xl border border-hairline border-l-[3px] border-l-brand-orange bg-white/[0.04] px-3.5 py-3 text-left"
                data-rise="3"
              >
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-orange">
                  {unavailableCopy.status}
                </p>
                <h2
                  id="login-status-heading"
                  className="mt-2 break-words text-base font-semibold leading-snug text-foreground"
                >
                  {unavailableCopy.headline}
                </h2>
                {unavailableCopy.body ? (
                  <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                    {unavailableCopy.body}
                  </p>
                ) : null}
                <p className="mt-2 break-words border-t border-hairline pt-2 text-sm leading-relaxed text-foreground">
                  {unavailableCopy.next}
                </p>
              </section>
            )}
            <div className="login-rise mt-6 min-w-0 text-left" data-rise="4">
              {loginForm}
            </div>
          </div>
          {loginAvailable ? accountValuePanel : publicAccessPanel}
        </div>
      </div>
    </section>
  );
}

function loginReasonMessage(
  reason: string,
  loginAvailable: boolean,
  locale: Locale,
): React.ReactNode {
  const copy = LOGIN_COPY[locale].reason;
  const coursesHref = localizeHref("/kurse", locale);

  if (
    !loginAvailable &&
    (reason === "progress-save" ||
      reason === "kurs-login" ||
      reason === "auth-not-configured")
  ) {
    return (
      <>
        {copy.accountUnavailable}{" "}
        <Link
          href={coursesHref}
          className="font-medium text-foreground underline underline-offset-4 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {copy.accountUnavailableLink}
        </Link>
      </>
    );
  }

  switch (reason) {
    case "progress-save":
      return (
        <>
          {copy.progressSave}{" "}
          <Link
            href={coursesHref}
            className="font-medium text-foreground underline underline-offset-4 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {copy.progressSaveLink}
          </Link>
        </>
      );
    case "kurs-login":
      return (
        <>
          {copy.courseLogin}{" "}
          <Link
            href={coursesHref}
            className="font-medium text-foreground underline underline-offset-4 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {copy.courseLoginLink}
          </Link>
        </>
      );
    case "anderes-geraet":
      return copy.otherDevice;
    case "abgelaufen":
      return copy.expired;
    case "ungueltig":
      return copy.invalid;
    case "auth-not-configured":
      return copy.authNotConfigured;
    case "auth-unavailable":
      return copy.authUnavailable;
    case "missing-code":
      return copy.missingCode;
    case "invalid-link":
      return copy.invalidLink;
    case "untrusted-origin":
      return copy.untrustedOrigin;
    case "invalid-code-format":
      return copy.invalidCodeFormat;
    default:
      return copy.fallback;
  }
}
