import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { reportApiError } from "@/lib/observability/api-error";
import { isOAuthServerReady } from "@/lib/provider-readiness";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import {
  readAuthorizationId,
  resolveAuthorizationRequest,
  type ConsentDetails,
} from "./authorization";
import {
  CONSENT_COPY,
  isConsentErrorKind,
  scopeLine,
  type ConsentErrorKind,
  type ConsentPageCopy,
} from "./consent-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(CONSENT_COPY[locale].metadata);
}

const FIELD_LABEL_CLASS =
  "font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange";

/** 44px minimum target, shared by both decision buttons. */
const DECISION_BUTTON_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

function PageShell({
  copy,
  locale,
  eyebrow,
  title,
  children,
}: {
  readonly copy: ConsentPageCopy;
  readonly locale: Locale;
  readonly eyebrow: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6">
        <header className="border-b border-border pb-6">
          <div className="h-[3px] w-16 bg-brand-orange" />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-pretty text-[clamp(1.75rem,3.2vw,2.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-foreground">
            {title}
          </h1>
        </header>
        {children}
        <p className="mt-8 border-t border-border pt-6 text-sm leading-relaxed">
          <Link
            href={localizeHref("/konto", locale)}
            className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.accountLink}
          </Link>
        </p>
      </div>
    </section>
  );
}

function ConsentError({
  copy,
  locale,
  kind,
}: {
  readonly copy: ConsentPageCopy;
  readonly locale: Locale;
  readonly kind: ConsentErrorKind;
}) {
  return (
    <PageShell
      copy={copy}
      locale={locale}
      eyebrow={copy.errorEyebrow}
      title={copy.errorHeading}
    >
      <div
        role="alert"
        className="mt-6 border border-border border-l-[3px] border-l-brand-orange bg-card p-4 sm:p-6"
      >
        <p className="max-w-2xl break-words text-base leading-relaxed text-foreground">
          {copy.errorBodies[kind]}
        </p>
        <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground">
          {copy.errorNextStep}
        </p>
      </div>
    </PageShell>
  );
}

function RequestField({
  label,
  value,
  mono,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3">
      <dt className={FIELD_LABEL_CLASS}>{label}</dt>
      <dd
        className={`min-w-0 break-words text-sm leading-relaxed text-foreground${
          mono ? " font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ConsentScreen({
  copy,
  locale,
  details,
}: {
  readonly copy: ConsentPageCopy;
  readonly locale: Locale;
  readonly details: ConsentDetails;
}) {
  const clientName = details.clientName ?? copy.clientNameUnknown;
  return (
    <PageShell
      copy={copy}
      locale={locale}
      eyebrow={copy.eyebrow}
      title={copy.title}
    >
      <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {copy.introduction(clientName)}
      </p>
      {details.userEmail ? (
        <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
          {copy.signedInAs(details.userEmail)}
        </p>
      ) : null}

      <section
        aria-labelledby="oauth-consent-request"
        className="mt-6 border border-border border-l-[3px] border-l-brand-orange bg-card p-4 sm:p-6"
      >
        <h2
          id="oauth-consent-request"
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
        >
          {copy.requestHeading}
        </h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          <RequestField label={copy.clientNameLabel} value={clientName} />
          <RequestField label={copy.clientIdLabel} value={details.clientId} mono />
          <RequestField
            label={copy.clientSiteLabel}
            value={details.clientSite ?? copy.clientSiteUnknown}
          />
          <RequestField
            label={copy.redirectHostLabel}
            value={details.redirectHost ?? copy.redirectHostUnknown}
            mono
          />
        </dl>
        <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground">
          {copy.redirectHostNote}
        </p>
      </section>

      <section aria-labelledby="oauth-consent-scopes" className="mt-6">
        <h2
          id="oauth-consent-scopes"
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
        >
          {copy.scopesHeading}
        </h2>
        {details.scopes.length > 0 ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {details.scopes.map((scope) => (
              <li
                key={scope}
                className="grid min-w-0 gap-1 py-3 text-sm leading-relaxed"
              >
                <span className="font-mono text-xs text-brand-orange">
                  {scope}
                </span>
                <span className="min-w-0 break-words text-foreground">
                  {scopeLine(scope, copy)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-foreground">
            {copy.noScopes}
          </p>
        )}
        <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground">
          {copy.platformAccess}
        </p>
        <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground">
          {copy.tokenPower}
        </p>
      </section>

      <form
        method="post"
        action="/oauth/consent/entscheidung"
        className="mt-8 border-t border-border pt-6"
      >
        <input
          type="hidden"
          name="authorization_id"
          value={details.authorizationId}
        />
        <input type="hidden" name="sprache" value={locale} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            name="entscheidung"
            value="zustimmen"
            className={`${DECISION_BUTTON_CLASS} border-brand-orange bg-brand-orange text-white hover:border-foreground hover:bg-foreground hover:text-background`}
          >
            {copy.approve}
          </button>
          <button
            type="submit"
            name="entscheidung"
            value="ablehnen"
            className={`${DECISION_BUTTON_CLASS} border-border bg-background text-foreground hover:border-foreground hover:bg-card`}
          >
            {copy.deny}
          </button>
        </div>
        <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-muted-foreground">
          {copy.denyNote}
        </p>
      </form>
    </PageShell>
  );
}

export default async function OAuthConsentPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly authorization_id?: string | string[];
    readonly fehler?: string | string[];
  }>;
}) {
  if (!isOAuthServerReady()) notFound();

  const [params, locale] = await Promise.all([
    searchParams,
    getRequestLocale(),
  ]);
  const copy = CONSENT_COPY[locale];

  // A failed decision is rendered from the redirect that carried it. Asking
  // the authorization server again would only report the same request as
  // consumed, which reads as a different problem than the one that happened.
  if (isConsentErrorKind(params.fehler)) {
    return <ConsentError copy={copy} locale={locale} kind={params.fehler} />;
  }

  // A link that names no usable request is answered before sign-in: signing in
  // would only lead back to this same message.
  const identifier = readAuthorizationId(params.authorization_id);
  if (!identifier.ok) {
    return (
      <ConsentError copy={copy} locale={locale} kind={identifier.error} />
    );
  }

  const auth = await getAuthenticatedUser();
  if (auth.error) {
    reportApiError({ step: "auth-get-user", error: auth.error });
    return (
      <ConsentError copy={copy} locale={locale} kind="backend-unavailable" />
    );
  }
  if (!auth.configured) {
    return (
      <ConsentError copy={copy} locale={locale} kind="backend-unavailable" />
    );
  }
  if (!auth.user) {
    // Sign in first, then come back to the same request. `next` carries the
    // unprefixed path; the login page localizes it for the active locale.
    // URLSearchParams does the escaping, so the request id cannot leak out of
    // the parameter it belongs to.
    const back = new URLSearchParams({
      next: `/oauth/consent?authorization_id=${identifier.authorizationId}`,
    });
    redirect(`${localizeHref("/login", locale)}?${back.toString()}`);
  }

  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({ step: "auth-create-client", error });
    return (
      <ConsentError copy={copy} locale={locale} kind="backend-unavailable" />
    );
  }
  if (!supabase) {
    return (
      <ConsentError copy={copy} locale={locale} kind="backend-unavailable" />
    );
  }

  const request = await resolveAuthorizationRequest(
    supabase,
    identifier.authorizationId,
  );
  if (request.kind === "error") {
    return <ConsentError copy={copy} locale={locale} kind={request.error} />;
  }
  // Already granted for these scopes: the authorization server produced the
  // completed redirect itself, so there is nothing left to consent to.
  if (request.kind === "redirect") redirect(request.url);

  return (
    <ConsentScreen copy={copy} locale={locale} details={request.details} />
  );
}
