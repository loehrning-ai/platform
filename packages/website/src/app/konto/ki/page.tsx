import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { MCP_ENDPOINT_PATH, MCP_HELP_PATH } from "@/lib/mcp/config";
import { reportApiError } from "@/lib/observability/api-error";
import { getAgentRuntimeFeatures } from "@/lib/runtime-features";
import { absoluteUrl } from "@/lib/seo/entity";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import { fetchAccountLlmKeySummary } from "@/lib/llm-keys/store";
import {
  fetchAgentAccessEvents,
  fetchAgentTokens,
  fetchOAuthGrants,
  type AgentAccessEventView,
  type AgentTokenView,
  type OAuthGrantView,
  type RegionOutcome,
} from "./account-agent-data";
import { ACCOUNT_CHAT_PROVIDER } from "./agent-account-contract";
import { ChatWorkbench } from "./chat-workbench";
import { GrantsPanel } from "./grants-panel";
import { AGENT_ACCOUNT_COPY, type AgentAccountCopy } from "./ki-copy";
import type { StoredKeyState } from "./key-form";
import { readLessonContext } from "./lesson-context";
import { formatUtcMoment } from "./moment";
import { TokensPanel } from "./tokens-panel";

/**
 * /konto/ki: everything an account owner needs in order to let their own AI
 * program reach this platform, and everything they need in order to see what
 * it did afterwards.
 *
 * The page is deliberately built from independent regions. Each one is gated
 * on its own readiness predicate and carries its own empty, off, and failure
 * state, so a deployment with the agent surface on and the chat off (or the
 * reverse) renders exactly what it can actually do. Nothing here fails
 * because a neighbouring capability is missing.
 */

const REGION_HEADING_CLASS =
  "scroll-mt-24 text-2xl font-bold tracking-[-0.03em] text-foreground";

interface KontoKiSearchParams {
  readonly lektion?: string | string[];
}

function ActivityRegion({
  copy,
  locale,
  events,
}: {
  readonly copy: AgentAccountCopy;
  readonly locale: Locale;
  readonly events: RegionOutcome<AgentAccessEventView>;
}) {
  if (!events.ok) {
    return (
      <p
        role="alert"
        className="mt-4 text-sm leading-relaxed text-muted-foreground"
      >
        {copy.activityUnavailable}
      </p>
    );
  }
  if (events.items.length === 0) {
    return (
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {copy.activityEmpty}
      </p>
    );
  }
  return (
    <div className="mt-4 w-full overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{copy.activityTableLabel}</caption>
        <thead>
          <tr className="border-b border-border">
            {[
              copy.activityColumnMoment,
              copy.activityColumnClient,
              copy.activityColumnTool,
              copy.activityColumnResult,
              copy.activityColumnDuration,
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="py-2 pr-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.items.map((event) => (
            <tr key={event.id} className="border-b border-border">
              <td className="py-2 pr-4 align-top text-muted-foreground">
                {formatUtcMoment(event.createdAt, locale) ?? event.createdAt}
              </td>
              <td className="py-2 pr-4 align-top font-mono text-xs text-foreground">
                {event.client}
              </td>
              <td className="py-2 pr-4 align-top font-mono text-xs text-foreground">
                {event.tool}
              </td>
              <td className="py-2 pr-4 align-top text-foreground">
                {event.ok ? copy.activityOk : copy.activityFailed}
              </td>
              <td className="py-2 pr-4 align-top text-muted-foreground">
                {copy.activityDuration(event.durationMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConnectionRegion({
  copy,
  locale,
  ready,
}: {
  readonly copy: AgentAccountCopy;
  readonly locale: Locale;
  readonly ready: boolean;
}) {
  return (
    <div className="mt-6 border border-border border-l-[3px] border-l-brand-orange p-4">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {copy.endpointHeading}
      </p>
      {ready ? (
        <>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {copy.endpointBody}
          </p>
          <p className="mt-3 text-sm text-foreground">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {copy.endpointLabel}
              {": "}
            </span>
            <code className="font-mono text-sm text-foreground">
              {absoluteUrl(MCP_ENDPOINT_PATH)}
            </code>
          </p>
          <Link
            href={localizeHref(MCP_HELP_PATH, locale)}
            className="mt-3 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.endpointHelpLink}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 font-semibold text-foreground">
            {copy.endpointOffTitle}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {copy.endpointOffBody}
          </p>
        </>
      )}
    </div>
  );
}

function PageHeader({
  copy,
  locale,
}: {
  readonly copy: AgentAccountCopy;
  readonly locale: Locale;
}) {
  return (
    <div className="border-b border-border pb-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.intro}
      </p>
      <Link
        href={localizeHref("/konto", locale)}
        className="mt-3 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        {copy.backToAccount}
      </Link>
    </div>
  );
}

export default async function KontoKiPage({
  searchParams,
}: {
  readonly searchParams: Promise<KontoKiSearchParams>;
}) {
  const [locale, auth, params] = await Promise.all([
    getRequestLocale(),
    getAuthenticatedUser(),
    searchParams,
  ]);
  const copy = AGENT_ACCOUNT_COPY[locale];
  const { configured, user, error: authError } = auth;

  // An auth-backend outage returns {configured:true, user:null, error}, the
  // same shape as "logged out" minus the error. Redirecting on it would sign
  // a learner out of a page they are still entitled to see.
  if (authError) {
    reportApiError({
      route: "/konto/ki",
      step: "auth-get-user",
      error: authError,
    });
  }
  if (configured && !user && !authError) {
    const target = localizeHref("/konto/ki", locale);
    redirect(localizeHref(`/login?next=${target}`, locale));
  }

  const features = getAgentRuntimeFeatures();

  // Without a verified account there is nothing account-scoped to render, and
  // an empty audit trail would be a lie. Say the account is unreadable and
  // show only what does not depend on it.
  if (!user) {
    return (
      <section className="py-8 sm:py-12">
        <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
          <PageHeader copy={copy} locale={locale} />
          <div
            role="alert"
            className="mt-6 border border-border border-l-[3px] border-l-brand-orange bg-kupfer-mist p-4"
          >
            <p className="font-semibold text-foreground">
              {copy.accountUnavailableTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {copy.accountUnavailableBody}
            </p>
          </div>
          <ConnectionRegion
            copy={copy}
            locale={locale}
            ready={features.agentAccess}
          />
        </div>
      </section>
    );
  }

  const lesson = readLessonContext(params.lektion);

  let supabase: Awaited<ReturnType<typeof createAuthServerClient>> = null;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({ route: "/konto/ki", step: "auth-create-client", error });
  }

  const unavailable = { ok: false, reason: "unavailable" } as const;
  let events: RegionOutcome<AgentAccessEventView> = unavailable;
  let tokens: RegionOutcome<AgentTokenView> = unavailable;
  let grants: RegionOutcome<OAuthGrantView> = unavailable;
  let storedKey: StoredKeyState = {
    hint: null,
    validatedAt: null,
    unavailable: true,
  };

  if (supabase) {
    const [eventsResult, tokensResult, grantsResult, keyResult] =
      await Promise.all([
        fetchAgentAccessEvents(supabase, user.id),
        fetchAgentTokens(supabase, user.id),
        features.oauthServer
          ? fetchOAuthGrants(supabase)
          : Promise.resolve<RegionOutcome<OAuthGrantView>>({
              ok: false,
              reason: "not-configured",
            }),
        features.byoChat
          ? fetchAccountLlmKeySummary(supabase, user.id, ACCOUNT_CHAT_PROVIDER)
          : Promise.resolve({ ok: true as const, summary: null }),
      ]);
    events = eventsResult;
    tokens = tokensResult;
    grants = grantsResult;
    storedKey = keyResult.ok
      ? {
          hint: keyResult.summary?.hint ?? null,
          validatedAt: keyResult.summary?.validatedAt ?? null,
          unavailable: false,
        }
      : { hint: null, validatedAt: null, unavailable: true };
  }

  const sectionLinks: readonly {
    readonly href: string;
    readonly label: string;
  }[] = [
    { href: "#konto-ki-chat", label: copy.sections.chat },
    { href: "#konto-ki-schluessel", label: copy.sections.tokens },
    { href: "#konto-ki-freigaben", label: copy.sections.grants },
    { href: "#konto-ki-aktivitaet", label: copy.sections.activity },
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
        <PageHeader copy={copy} locale={locale} />

        {/* Second navigation on the page: carries its own accessible name so
            it never collides with the site navigation in a role query. */}
        <nav
          aria-label={copy.sectionNavigationLabel}
          data-konto-ki-section-nav
          className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-1 border-y border-border py-1"
        >
          {sectionLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <ConnectionRegion
            copy={copy}
            locale={locale}
            ready={features.agentAccess}
          />

        <h2 id="konto-ki-chat" className={`mt-12 ${REGION_HEADING_CLASS}`}>
          {copy.chatHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {copy.chatIntro}
        </p>
        {features.byoChat ? (
          <ChatWorkbench
            locale={locale}
            ownerId={user.id}
            models={features.byoChatModels}
            initialKey={storedKey}
            lesson={lesson}
          />
        ) : (
          <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange p-4">
            <p className="font-semibold text-foreground">{copy.chatOffTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {copy.chatOffBody}
            </p>
          </div>
        )}

        <h2 id="konto-ki-schluessel" className={`mt-12 ${REGION_HEADING_CLASS}`}>
          {copy.tokensHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {copy.tokensIntro}
        </p>
        <TokensPanel
          locale={locale}
          ownerId={user.id}
          initial={tokens}
          agentAccessReady={features.agentAccess}
        />

        <h2 id="konto-ki-freigaben" className={`mt-12 ${REGION_HEADING_CLASS}`}>
          {copy.grantsHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {copy.grantsIntro}
        </p>
        <GrantsPanel
          locale={locale}
          ownerId={user.id}
          initial={grants}
          oauthServerReady={features.oauthServer}
        />

        <h2 id="konto-ki-aktivitaet" className={`mt-12 ${REGION_HEADING_CLASS}`}>
          {copy.activityHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {copy.activityIntro}
        </p>
        <ActivityRegion copy={copy} locale={locale} events={events} />
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {copy.activityRetention}
        </p>
      </div>
    </section>
  );
}
