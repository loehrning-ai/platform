import { Suspense, use } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { DEFAULT_LOCALE, localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { reportApiError } from "@/lib/observability/api-error";
import { OPEN_SOURCE_TOOL_ARTIFACTS } from "@/lib/open-source/artifacts";
import {
  cvEngineHostedOrigin,
  isCvEngineHostedReady,
} from "@/lib/provider-readiness";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import {
  WERKZEUGE_COPY,
  WERKZEUGE_SECTION_ID,
  type CvEngineDocuments,
  type WerkzeugeCopy,
} from "./werkzeuge-copy";

/**
 * ─── Werkzeuge: the tools a learner opens with their own account ──
 *
 * One card today, the cv-engine, in one of three states:
 *
 *   source-only   the shipping default. `isCvEngineHostedReady()` is false, so
 *                 the card offers the repository and the self-host guide and
 *                 makes no claim about a hosted instance at all. Both links are
 *                 the same ones /open-source publishes, so nothing here
 *                 advertises a capability the deployment does not have.
 *   hosted        the origin and its dated review are configured AND the
 *                 deployment answers its health endpoint. The card adds the
 *                 learner's own document count and last edit, read from
 *                 `public.documents` on the cookie-bound client AND filtered
 *                 in application code to the account id the page verified,
 *                 and the one-click open control.
 *   unreachable   configured, but the health probe did not answer. The card
 *                 says so, keeps the document numbers, and keeps the two links
 *                 that always work. The open control is withheld: a handoff
 *                 into a deployment that is down can only fail.
 *
 * OPENING IS A FORM, NOT A LINK. The open control submits a plain same-origin
 * POST to `/konto/werkzeuge/cv-engine/oeffnen`, no fields, no JavaScript. That
 * route mints a one-time sign-in token for the hosted tool, and a GET would let
 * a prefetch, a crawler or a shared URL burn that token silently. The route
 * ships with the hosted cv-engine work and answers 404 while the capability
 * is off, which is also the only state in which this card would not render the
 * form: both sides sit behind the same readiness predicate.
 *
 * TWO WAYS IN, ONE RENDERED TREE. `WerkzeugeSection` takes a required
 * `userId` and an optional `locale`. With the locale, and with the hosted
 * tool off, there is nothing to await: the source-only region renders in the
 * same pass as the rest of the page, with no boundary, and a react-dom test
 * sees it exactly as a learner does. That is what konto/page.tsx gets today,
 * because it holds the resolved locale already. Without one the region
 * resolves the locale itself behind a Suspense boundary. Both paths produce
 * the same markup; only the hosted state, which has two reads to wait for,
 * always streams behind the boundary.
 *
 * WHY use() AND NOT AN ASYNC COMPONENT: `async function WerkzeugeRegion` is
 * the tidier form and it cannot be used here. The page's own DOM tests mount
 * the whole tree konto/page.tsx returns with react-dom, which rejects an async
 * component outright ("is an async Client Component. Only Server Components
 * can be async"), and that lands as a console error in a suite that treats
 * console errors as failures. Suspending on a passed-in promise is accepted by
 * both renderers, so it is the form that keeps the tree mountable.
 *
 * What react-dom then shows is the fallback and nothing else: measured, the
 * loader runs exactly once and the boundary never settles there, so it does
 * not loop or re-read either. Only the server renderer, which retries the
 * suspended task with the same element, resolves it. That is why the loader
 * and the view are exported separately: every data path is asserted against
 * `loadWerkzeugeRegion` and every rendered state against `WerkzeugeRegionView`,
 * and a page-level test that wants to see the region must pass the locale.
 *
 * NOTHING HERE MAY THROW. A failed documents query is reported once through
 * the project's one structured, privacy-guarded sink and the card degrades to
 * the state without document numbers: a learner's account page must not
 * become a 500 over a card about a side tool.
 */

/** Same-origin handoff endpoint. Documented contract: POST, no fields. */
export const CV_ENGINE_HANDOFF_ACTION = "/konto/werkzeuge/cv-engine/oeffnen";

const HEALTH_PATH = "/healthz";
const HEALTH_TIMEOUT_MS = 2_500;
/** Milliseconds one probe result, reachable or not, stands for every render. */
const HEALTH_CACHE_MS = 60_000;
/** The title is learner-authored, so it is bounded before it reaches a layout. */
const MAX_DOCUMENT_TITLE_LENGTH = 80;

/**
 * Primary control rendered as a native submit button. BrandButton renders
 * `type="button"` and cannot submit a form; this mirrors its primary look with
 * the same 44px minimum height and without decorative lift.
 */
const OPEN_BUTTON_CLASS =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-brand-orange bg-brand-orange px-4 py-2 text-center text-xs font-semibold tracking-[-0.01em] text-white hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background";

interface CvEngineTool {
  readonly sourceHref: string;
  readonly guideHref: string;
}

type CvEngineState =
  | { readonly kind: "source-only" }
  | {
      readonly kind: "hosted";
      readonly origin: string;
      readonly documents: CvEngineDocuments;
    }
  | { readonly kind: "unreachable"; readonly documents: CvEngineDocuments };

export interface WerkzeugeRegionState {
  readonly locale: Locale;
  readonly tool: CvEngineTool | null;
  readonly cvEngine: CvEngineState;
}

/**
 * Repository and guide links come from the published open-source registry, so
 * this card can never point at a different repository or route than
 * /open-source does for the same tool.
 */
function readCvEngineTool(): CvEngineTool | null {
  const artifact = OPEN_SOURCE_TOOL_ARTIFACTS.find(
    (candidate) => candidate.slug === "cv-engine",
  );
  return artifact
    ? { sourceHref: artifact.source.href, guideHref: artifact.href }
    : null;
}

function boundedTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_DOCUMENT_TITLE_LENGTH
    ? `${trimmed.slice(0, MAX_DOCUMENT_TITLE_LENGTH)}...`
    : trimmed;
}

function readStringField(row: unknown, field: string): string | null {
  if (typeof row !== "object" || row === null) return null;
  const value = Reflect.get(row, field);
  return typeof value === "string" ? value : null;
}

/**
 * Count one learner's documents and describe their most recent one.
 *
 * THE OWNER PREDICATE IS THIS APPLICATION'S, NOT ONLY THE DATABASE'S. The
 * query goes out on the cookie-bound client, so `auth.uid()` scopes it under
 * RLS, AND it carries an explicit `user_id` filter for the account the page
 * already verified. Both, deliberately: `documents` belongs to the hosted
 * cv-engine deployment and no migration in this repository defines it, so this
 * project cannot prove its policies. A table reachable here with RLS off, or
 * with a `USING (true)` policy, would otherwise print a cross-tenant row count
 * and somebody else's document title on a learner's account page. The same
 * `user_id` column is what the DSGVO export filters on
 * (api/account/export/owned-rows.ts), so this is the repository's standing
 * assumption about the table rather than a new one.
 *
 * `userId` is required, not optional, so no call site can reach the unfiltered
 * read: the caller that has no verified id must degrade instead of asking.
 *
 * The table may not exist in this project at all, which is why every failure
 * path ends in the same degraded value rather than an exception.
 * `reportApiError` is the sink for those failures on purpose: it is the one
 * channel whose output is sanitized and guarded by the server log privacy
 * boundary, and a bare console.warn would open a second, unguarded one.
 */
async function readCvEngineDocuments(
  userId: string,
): Promise<CvEngineDocuments> {
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({ route: "/konto", step: "auth-create-client", error });
    return { kind: "unavailable" };
  }
  if (!supabase) return { kind: "unavailable" };

  let result;
  try {
    result = await supabase
      .from("documents")
      .select("title, updated_at", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);
  } catch (error) {
    reportApiError({ route: "/konto", step: "supabase-read", error });
    return { kind: "unavailable" };
  }
  if (result.error) {
    reportApiError({
      route: "/konto",
      step: "supabase-read",
      error: result.error,
    });
    return { kind: "unavailable" };
  }

  const rows: readonly unknown[] = Array.isArray(result.data) ? result.data : [];
  const updatedAt = readStringField(rows[0], "updated_at");
  return {
    kind: "ready",
    count:
      typeof result.count === "number" && result.count >= 0
        ? result.count
        : rows.length,
    latest: updatedAt
      ? { title: boundedTitle(readStringField(rows[0], "title")), updatedAt }
      : null,
  };
}

interface HealthProbe {
  readonly reachable: Promise<boolean>;
  readonly expiresAt: number;
}

/**
 * One health probe per origin per minute, whatever it answers.
 *
 * The RESULT is remembered, not the HTTP response: a deployment that is down
 * produces a thrown request, and remembering only the successes would make
 * every account render on a bad day wait out the timeout again. Concurrent
 * renders share the pending probe, so a burst of visits costs one request.
 *
 * This is deliberately module state rather than the framework data cache. The
 * value is one boolean about somebody else's deployment; a per-instance memo
 * with a hard expiry is the whole requirement, and it behaves identically in
 * every runtime the region can render in.
 */
const healthProbes = new Map<string, HealthProbe>();

async function fetchCvEngineHealth(origin: string): Promise<boolean> {
  try {
    const response = await fetch(`${origin}${HEALTH_PATH}`, {
      method: "GET",
      redirect: "error",
      headers: { accept: "application/json, text/plain;q=0.9" },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    // An unreachable side tool is a state this card renders, not a platform
    // fault. It fails on every ordinary outage of somebody else's deployment,
    // and reporting each render would bury real errors.
    return false;
  }
}

/** Reachability of the hosted tool, remembered for HEALTH_CACHE_MS. */
export function probeCvEngineHealth(
  origin: string,
  now: number = Date.now(),
): Promise<boolean> {
  const cached = healthProbes.get(origin);
  if (cached && cached.expiresAt > now) return cached.reachable;
  const reachable = fetchCvEngineHealth(origin);
  healthProbes.set(origin, { reachable, expiresAt: now + HEALTH_CACHE_MS });
  return reachable;
}

/** Test seam: forget every remembered probe. */
export function __resetCvEngineHealthProbes(): void {
  healthProbes.clear();
}

/** The hosted origin, or null while the capability is off or misconfigured. */
function hostedOrigin(): string | null {
  return isCvEngineHostedReady() ? cvEngineHostedOrigin() : null;
}

function sourceOnlyState(locale: Locale): WerkzeugeRegionState {
  return {
    locale,
    tool: readCvEngineTool(),
    cvEngine: { kind: "source-only" },
  };
}

/**
 * The locale the caller holds, or the one the request carries.
 *
 * `headers()` rejects outside a request scope, and this runs inside the
 * region's own Suspense boundary, where a rejection escapes to the nearest
 * error boundary and takes the whole account page with it. A card about a side
 * tool must not be able to do that, so it degrades to `DEFAULT_LOCALE` here.
 *
 * The fallback is a guard, not a real code path: konto/page.tsx awaits the
 * same locale before it renders anything, so a request whose headers cannot
 * be read never reaches this region at all. That is also why it is not
 * reported - there is no operational failure to attribute, and the only thing
 * a report could describe is a render environment that cannot serve the page.
 */
async function resolveLocale(locale?: Locale): Promise<Locale> {
  if (locale !== undefined) return locale;
  try {
    return await getRequestLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * Everything the view needs. The locale is resolved from the request only
 * when the caller does not already hold it.
 *
 * `userId` is a required argument and comes from the session the page already
 * verified - never from a route segment, a query parameter or a header, all of
 * which a visitor writes. It is nullable rather than optional because the
 * account page renders for a learner whose auth backend is down and for a
 * deployment with no auth at all, and in both of those there is no verified id
 * to pass. There is no second `auth.getUser()` here on purpose: the account
 * performs one authenticated read and hands every region derived props.
 */
export async function loadWerkzeugeRegion(
  userId: string | null,
  locale?: Locale,
): Promise<WerkzeugeRegionState> {
  const resolvedLocale = await resolveLocale(locale);
  const origin = hostedOrigin();
  if (!origin) return sourceOnlyState(resolvedLocale);

  // No verified id, no query. An unfiltered read is not a fallback for a
  // missing owner, so the card degrades to exactly the state it shows when the
  // table cannot be read - the client is not even created.
  const pendingDocuments: CvEngineDocuments | Promise<CvEngineDocuments> =
    userId ? readCvEngineDocuments(userId) : { kind: "unavailable" };

  // Independent reads, so the card never costs the sum of two latencies.
  const [documents, reachable] = await Promise.all([
    pendingDocuments,
    probeCvEngineHealth(origin),
  ]);
  return {
    locale: resolvedLocale,
    tool: readCvEngineTool(),
    cvEngine: reachable
      ? { kind: "hosted", origin, documents }
      : { kind: "unreachable", documents },
  };
}

function DocumentSummary({
  copy,
  locale,
  documents,
}: {
  readonly copy: WerkzeugeCopy;
  readonly locale: Locale;
  readonly documents: CvEngineDocuments;
}) {
  if (documents.kind === "unavailable") {
    return (
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {copy.documentsUnavailable}
      </p>
    );
  }
  if (documents.count === 0) {
    return (
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {copy.noDocuments}
      </p>
    );
  }
  const editedOn = documents.latest
    ? new Date(documents.latest.updatedAt).toLocaleDateString(
        locale === "de" ? "de-DE" : "en-GB",
      )
    : null;
  const title = documents.latest?.title ?? null;
  return (
    <p className="mt-3 text-sm leading-relaxed text-foreground">
      <span className="font-semibold">
        {copy.documentCount(documents.count)}
      </span>
      {editedOn ? (
        <span className="text-muted-foreground">
          {" · "}
          {title ? copy.lastEditNamed(title, editedOn) : copy.lastEdit(editedOn)}
        </span>
      ) : null}
    </p>
  );
}

function CvEngineCard({
  state,
  copy,
  locale,
  tool,
}: {
  readonly state: CvEngineState;
  readonly copy: WerkzeugeCopy;
  readonly locale: Locale;
  readonly tool: CvEngineTool | null;
}) {
  return (
    <Card accent="sand" className="mt-4">
      <div className="flex items-start gap-3">
        <FileText
          size={20}
          aria-hidden="true"
          className="mt-1 shrink-0 text-brand-orange"
        />
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {copy.cvEngineTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {state.kind === "source-only"
              ? copy.cvEngineSourceBody
              : copy.cvEngineHostedBody}
          </p>
        </div>
      </div>

      {state.kind === "unreachable" ? (
        <p
          role="status"
          className="mt-3 border-l-[3px] border-l-brand-orange bg-kupfer-mist px-3 py-2 text-sm leading-relaxed text-foreground"
        >
          {copy.unreachable}
        </p>
      ) : null}

      {state.kind === "source-only" ? null : (
        <DocumentSummary
          copy={copy}
          locale={locale}
          documents={state.documents}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {state.kind === "hosted" ? (
          <form method="post" action={CV_ENGINE_HANDOFF_ACTION}>
            <button type="submit" className={OPEN_BUTTON_CLASS}>
              {copy.open} <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </form>
        ) : null}
        {tool ? (
          <>
            <BrandButton
              href={tool.sourceHref}
              external
              variant="outline"
              size="sm"
            >
              {copy.source} <ArrowUpRight size={15} aria-hidden="true" />
            </BrandButton>
            <BrandButton
              href={localizeHref(tool.guideHref, locale)}
              variant="outline"
              size="sm"
            >
              {copy.selfHost}
            </BrandButton>
          </>
        ) : null}
      </div>
    </Card>
  );
}

export function WerkzeugeRegionView({
  locale,
  tool,
  cvEngine,
}: WerkzeugeRegionState) {
  const copy = WERKZEUGE_COPY[locale];
  return (
    <section
      id={WERKZEUGE_SECTION_ID}
      aria-labelledby="konto-werkzeuge-heading"
      data-konto-werkzeuge={cvEngine.kind}
      className="mt-12 scroll-mt-24"
    >
      <h2
        id="konto-werkzeuge-heading"
        className="text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
        {copy.heading}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.intro}
      </p>
      <CvEngineCard state={cvEngine} copy={copy} locale={locale} tool={tool} />
    </section>
  );
}

function WerkzeugeRegion({
  pending,
}: {
  readonly pending: Promise<WerkzeugeRegionState>;
}) {
  return <WerkzeugeRegionView {...use(pending)} />;
}

/**
 * The region. With the locale in hand and the hosted tool off there is nothing
 * to await, so the source-only card renders in the same pass as the rest of
 * the page. Otherwise the region's own boundary takes over: without a locale
 * the promise still settles without a network call, and only a deployment with
 * the hosted tool enabled streams the card in behind the two reads it needs.
 *
 * The promise is created here, in a Server Component, and read one level down.
 * That is the supported direction: a Client Component may not create the
 * promise it suspends on, which is also why nothing below this line may be
 * turned into a client island without moving the load out of render.
 *
 * `userId` is a required prop so that the page cannot forget it: the documents
 * read is filtered by owner in application code, and the only id this region
 * accepts is the one the page's own verified session produced. `null` is the
 * honest value when there is no such session, and it degrades the card rather
 * than widening the query.
 */
export function WerkzeugeSection({
  userId,
  locale,
}: {
  readonly userId: string | null;
  readonly locale?: Locale;
}) {
  if (locale !== undefined && hostedOrigin() === null) {
    return <WerkzeugeRegionView {...sourceOnlyState(locale)} />;
  }
  return (
    <Suspense fallback={null}>
      <WerkzeugeRegion pending={loadWerkzeugeRegion(userId, locale)} />
    </Suspense>
  );
}
