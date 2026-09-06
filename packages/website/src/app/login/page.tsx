import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { LOGIN_COPY, type LoginUnavailableReason } from "./login-copy";
import { LoginForm } from "./login-form";

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

  const accountValuePanel = (
    <section
      aria-labelledby="login-account-value"
      data-login-account-value
      className="min-w-0 border border-border bg-card p-4 sm:p-5"
    >
      <h2
        id="login-account-value"
        className="break-words text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl"
      >
        {copy.accountValue.heading}
      </h2>
      <p className="mt-2 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">
        {copy.accountValue.lead}
      </p>
      <ol className="mt-5 grid gap-4">
        {copy.accountValue.items.map((item, index) => (
          <li
            key={item.title}
            className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
          >
            <span
              aria-hidden="true"
              className="font-mono text-xs font-bold tracking-[0.08em] text-brand-orange"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="break-words text-base font-bold leading-snug tracking-[-0.01em] text-foreground">
                {item.title}
              </p>
              <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <ul className="mt-5 grid gap-2 border-t border-border pt-4">
        {[copy.accountValue.records, copy.accountValue.control].map((line) => (
          <li
            key={line}
            className="grid min-w-0 grid-cols-[0.75rem_minmax(0,1fr)] gap-2 text-sm leading-relaxed text-foreground"
          >
            <span aria-hidden="true" className="text-brand-orange">
              /
            </span>
            <span className="min-w-0 break-words">{line}</span>
          </li>
        ))}
      </ul>
      {/* Fail-closed honesty: the tools and AI regions of the account only
          appear once this deployment has them configured, so the panel says so
          instead of advertising a region that may render nothing. */}
      <p className="mt-4 break-words border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
        {copy.accountValue.availability}
      </p>
      {/* Stated before signing in, not discovered after: anonymous progress is
          never merged into an account (see store.ts), so a learner who studied
          signed-out would otherwise meet an empty dashboard with no warning. */}
      <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
        {copy.accountValue.localNote}
      </p>
    </section>
  );

  const publicAccessPanel = (
    <section
      aria-labelledby="login-public-access"
      data-login-public-access
      className="min-w-0 border border-border bg-background p-4 sm:p-5"
    >
      <h2
        id="login-public-access"
        className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange"
      >
        {copy.publicAccess.heading}
      </h2>
      <p className="mt-3 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">
        {copy.publicAccess.lead}
      </p>
      <ul className="mt-2 grid min-w-0 gap-0 sm:grid-cols-2 sm:gap-x-6">
        {copy.publicAccess.links.map((link) => (
          <li key={link.path} className="min-w-0">
            <Link
              href={localizeHref(link.path, locale)}
              className="group flex min-h-11 min-w-0 flex-col justify-center gap-0.5 border-b border-border py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground underline-offset-4 group-hover:text-brand-orange group-hover:underline">
                {link.label}
              </span>{" "}
              {/* The space keeps the accessible name from running the label
                  into its note. A white-space-only flex item is not rendered,
                  so the two rows stay flush. */}
              <span className="block break-words text-sm leading-snug text-muted-foreground">
                {link.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <section className="min-h-[calc(100svh-4rem)] py-8 sm:py-10">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="min-w-0 border-b border-border pb-6">
          <div className="h-[3px] w-16 bg-brand-orange" />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl break-words text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.04em] text-foreground">
            {authError
              ? copy.heading.outage
              : loginAvailable
                ? copy.heading.available
                : copy.heading.unavailable}
          </h1>
          <p className="mt-4 max-w-2xl break-words text-base leading-relaxed text-muted-foreground">
            {copy.introduction.publicAccess}{" "}
            {loginAvailable
              ? copy.introduction.available
              : unavailableReason === "outage"
                ? copy.introduction.outage
                : unavailableReason === "configuration"
                  ? copy.introduction.configuration
                  : unavailableReason === "methods"
                    ? copy.introduction.methodsUnavailable
                    : copy.introduction.accountUnavailable}{" "}
            {copy.introduction.records}
          </p>
        </header>
        {params.reason ? (
          <div
            role="alert"
            className="mt-6 max-w-2xl break-words border border-border border-l-[3px] border-l-brand-orange bg-card p-4 text-sm leading-relaxed text-muted-foreground"
          >
            {loginReasonMessage(params.reason, loginAvailable, locale)}
          </div>
        ) : null}
        {loginAvailable ? (
          <div
            data-login-layout="split"
            className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-10"
          >
            {/* The form leads on narrow screens: a visitor who opened /login
                came to sign in, and the value panel is the argument, not the
                task. On large screens the argument sits left of the form. */}
            <div className="order-2 min-w-0 lg:order-1">
              {accountValuePanel}
            </div>
            <div className="order-1 min-w-0 lg:order-2">{loginForm}</div>
          </div>
        ) : (
          <div
            data-login-layout="single"
            className="mt-8 grid min-w-0 max-w-3xl gap-6"
          >
            <section
              aria-labelledby="login-status-heading"
              data-login-status={unavailableReason}
              className="min-w-0 border border-border border-l-[3px] border-l-brand-orange bg-card p-4 sm:p-5"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                {unavailableCopy.status}
              </p>
              <h2
                id="login-status-heading"
                className="mt-3 break-words text-lg font-bold leading-snug tracking-[-0.02em] text-foreground sm:text-xl"
              >
                {unavailableCopy.headline}
              </h2>
              <p className="mt-2 max-w-prose break-words text-sm leading-relaxed text-muted-foreground">
                {unavailableCopy.body}
              </p>
              <p className="mt-4 max-w-prose break-words border-t border-border pt-4 text-sm leading-relaxed text-foreground">
                {unavailableCopy.next}
              </p>
            </section>
            {loginForm}
            {publicAccessPanel}
            {accountValuePanel}
          </div>
        )}
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
