import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { LOGIN_COPY } from "./login-copy";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(LOGIN_COPY[locale].metadata);
}

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly next?: string; readonly reason?: string }>;
}) {
  const [params, locale, auth] = await Promise.all([
    searchParams,
    getRequestLocale(),
    getAuthenticatedUser(),
  ]);
  const next = localizeHref(
    sanitizeNextPath(params.next ?? "/konto"),
    locale,
  );
  const { configured, user, error: authError } = auth;
  const runtime = getRuntimeFeatures();
  const copy = LOGIN_COPY[locale];

  const accountReady = configured && runtime.account && !authError;
  const magicLinkReady = accountReady && runtime.magicLink;
  const googleReady = accountReady && runtime.google;
  const loginAvailable = magicLinkReady || googleReady;
  if (accountReady && user) redirect(next);

  return (
    <section className="min-h-[calc(100svh-4rem)] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-16">
          <div className="min-w-0">
            <div className="h-[3px] w-24 bg-brand-orange sm:w-28" />
            <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange sm:mt-8 sm:tracking-[0.18em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl break-words text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
              {authError
                ? copy.heading.outage
                : loginAvailable
                  ? copy.heading.available
                  : copy.heading.unavailable}
            </h1>
            <p className="mt-6 max-w-2xl break-words text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.introduction.publicAccess}{" "}
              {authError
                ? copy.introduction.outage
                : loginAvailable
                  ? copy.introduction.available
                  : accountReady
                    ? copy.introduction.methodsUnavailable
                    : copy.introduction.accountUnavailable}{" "}
              {copy.introduction.records}
            </p>
            {params.reason ? (
              <div
                role="alert"
                className="mt-7 max-w-2xl break-words border-l-4 border-brand-orange bg-card p-4 text-sm leading-relaxed text-muted-foreground sm:p-5"
              >
                {loginReasonMessage(params.reason, loginAvailable, locale)}
              </div>
            ) : null}
          </div>
          <LoginForm
            next={next}
            accountReady={accountReady}
            magicLinkReady={magicLinkReady}
            googleReady={googleReady}
            turnstileSiteKey={runtime.turnstileSiteKey}
            locale={locale}
            unavailableReason={
              authError
                ? "outage"
                : configured && !runtime.account
                  ? "configuration"
                  : accountReady && !loginAvailable
                    ? "methods"
                    : "disabled"
            }
          />
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
