import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  GLOBAL_ACTIVITY_FLOOR,
  MIN_REPORTABLE_COUNT,
  readAdminAggregates,
  type AdminAggregates,
  type AdminTotalMetric,
  type ReportableCount,
} from "@/lib/admin/analytics-aggregates";
import {
  readVercelAnalytics,
  type AnalyticsBreakdownRow,
  type AnalyticsSection,
  type VercelAnalytics,
} from "@/lib/admin/vercel-analytics";
import { requireAdminUser } from "@/lib/auth/admin-identity";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { reportApiError } from "@/lib/observability/api-error";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { STATISTIK_COPY, type StatistikPageCopy } from "./statistik-copy";

/**
 * /konto/statistik: operating statistics for the platform owner only.
 *
 * INVARIANTS
 * - Server Component only. No client component lives in this directory, so no
 *   figure is ever serialized into props at a client boundary, and there is
 *   no JSON endpoint behind the page.
 * - The owner gate runs before anything else. Only the `admin` state reads
 *   figures; both readers re-check the gate themselves.
 * - A denied visitor and a deployment without a configured owner both get the
 *   ordinary 404, so the page's existence is never confirmed to anyone else.
 * - A signed-in owner whose sign-in is older than the allowed window gets a
 *   panel, not a redirect: the login page sends a signed-in visitor straight
 *   back to `next`, so a redirect would only bounce between the two pages.
 * - No host or origin is derived from the request. Every link is a fixed
 *   internal path.
 * - Nothing links here. The page is reached by typing its address, so it is
 *   never prefetched and never enters another visitor's router payload.
 *   Authentication pre-gating, private/no-store headers and the sitemap
 *   exclusion come from the protected /konto/:path* crawl contract entry.
 */

export const dynamic = "force-dynamic";

const STATISTIK_PATH = "/konto/statistik";

const HEADING_CLASS =
  "text-2xl font-bold tracking-[-0.03em] text-foreground";
const SUBHEADING_CLASS = "text-base font-bold text-foreground";
const MUTED_TEXT_CLASS = "text-sm leading-relaxed text-muted-foreground";
const PANEL_CLASS = "mt-6 rounded-md border border-border bg-card p-5";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(STATISTIK_COPY[locale].metadata);
}

function loginHref(locale: Locale): string {
  const statistikHref = localizeHref(STATISTIK_PATH, locale);
  return localizeHref(`/login?next=${statistikHref}`, locale);
}

function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

function courseTitles(locale: Locale): ReadonlyMap<string, string> {
  return new Map(
    localizeCatalog(COURSE_CATALOG, locale).map((course) => [
      course.slug,
      course.title,
    ]),
  );
}

function PageShell({
  copy,
  children,
}: {
  readonly copy: StatistikPageCopy;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
        <div className="border-b border-border pb-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
            {copy.title}
          </h1>
          <p className={`mt-3 max-w-2xl ${MUTED_TEXT_CLASS}`}>{copy.intro}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function UnavailablePanel({ copy }: { readonly copy: StatistikPageCopy }) {
  return (
    <div role="alert" className={PANEL_CLASS}>
      <h2 className={SUBHEADING_CLASS}>{copy.unavailableTitle}</h2>
      <p className={`mt-2 ${MUTED_TEXT_CLASS}`}>{copy.unavailableBody}</p>
    </div>
  );
}

function ReauthPanel({
  copy,
  locale,
}: {
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
}) {
  return (
    <div className={PANEL_CLASS} data-testid="statistik-reauth">
      <h2 className={SUBHEADING_CLASS}>{copy.reauthTitle}</h2>
      <p className={`mt-2 ${MUTED_TEXT_CLASS}`}>{copy.reauthBody}</p>
      <p className={`mt-4 ${MUTED_TEXT_CLASS}`}>{copy.reauthSignOutStep}</p>
      <form action="/auth/logout" method="post" className="mt-2">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {copy.reauthSignOut}
          <LogOut size={14} aria-hidden="true" />
        </button>
      </form>
      <p className={`mt-4 ${MUTED_TEXT_CLASS}`}>{copy.reauthSignInStep}</p>
      {/* A plain anchor, not next/link: nothing on this page is prefetched. */}
      <a
        href={loginHref(locale)}
        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-foreground underline underline-offset-4 hover:text-brand-orange"
      >
        {copy.reauthSignIn}
      </a>
    </div>
  );
}

function CountTable({
  caption,
  valueColumn,
  countColumn,
  rows,
  locale,
  monospaceValues = false,
}: {
  readonly caption: string;
  readonly valueColumn: string;
  readonly countColumn: string;
  readonly rows: readonly { readonly label: string; readonly count: number }[];
  readonly locale: Locale;
  readonly monospaceValues?: boolean;
}) {
  return (
    <div className="mt-3 w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-4 font-medium">
              {valueColumn}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {countColumn}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/60">
              <td
                className={`py-2 pr-4 text-foreground ${monospaceValues ? "break-all font-mono text-xs" : ""}`}
              >
                {row.label}
              </td>
              <td className="py-2 text-right tabular-nums text-foreground">
                {formatCount(row.count, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function totalValue(
  value: ReportableCount | undefined,
  copy: StatistikPageCopy,
  locale: Locale,
): string {
  if (value === undefined) return copy.metricUnavailable;
  if (value === "suppressed") return copy.suppressed;
  return formatCount(value, locale);
}

function PlatformFigures({
  aggregates,
  copy,
  locale,
}: {
  readonly aggregates: AdminAggregates;
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
}) {
  if (aggregates.state === "unavailable") {
    return (
      <p role="alert" className={`mt-4 ${MUTED_TEXT_CLASS}`}>
        {copy.platformUnavailable}
      </p>
    );
  }
  if (aggregates.state === "insufficient-data") {
    return (
      <p className={`mt-4 ${MUTED_TEXT_CLASS}`} data-testid="statistik-insufficient">
        {copy.insufficientData}
      </p>
    );
  }

  const titles = courseTitles(locale);
  const totals = Object.entries(copy.totalLabels) as [AdminTotalMetric, string][];
  return (
    <>
      <dl aria-label={copy.totalsLabel} className="mt-4 grid gap-3 sm:grid-cols-2">
        {totals.map(([metric, label]) => (
          <div key={metric} className="rounded-md border border-border bg-card p-4">
            <dt className={MUTED_TEXT_CLASS}>{label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {totalValue(aggregates.totals[metric], copy, locale)}
            </dd>
          </div>
        ))}
      </dl>
      <h3 className={`mt-8 ${SUBHEADING_CLASS}`}>{copy.coursesHeading}</h3>
      {aggregates.courses.length === 0 ? (
        <p className={`mt-3 ${MUTED_TEXT_CLASS}`}>{copy.coursesNone}</p>
      ) : (
        <CountTable
          caption={copy.coursesHeading}
          valueColumn={copy.courseColumn}
          countColumn={copy.countColumn}
          rows={aggregates.courses.map(({ slug, count }) => ({
            label: titles.get(slug) ?? slug,
            count,
          }))}
          locale={locale}
        />
      )}
      {aggregates.coursesIncomplete ? (
        <p className={`mt-3 ${MUTED_TEXT_CLASS}`}>{copy.coursesIncomplete}</p>
      ) : null}
    </>
  );
}

function PlatformSection({
  aggregates,
  copy,
  locale,
}: {
  readonly aggregates: AdminAggregates;
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
}) {
  return (
    <section aria-labelledby="statistik-plattform" className="mt-10">
      <h2 id="statistik-plattform" className={HEADING_CLASS}>
        {copy.platformHeading}
      </h2>
      <PlatformFigures aggregates={aggregates} copy={copy} locale={locale} />
      <ul className={`mt-6 list-disc space-y-1 pl-5 ${MUTED_TEXT_CLASS}`}>
        <li>{copy.accountTotalsNote}</li>
        <li>{copy.ownerRowsNote}</li>
        <li>{copy.thresholdNote(GLOBAL_ACTIVITY_FLOOR, MIN_REPORTABLE_COUNT)}</li>
      </ul>
    </section>
  );
}

function BreakdownBlock({
  heading,
  valueColumn,
  section,
  label,
  copy,
  locale,
  monospaceValues = false,
}: {
  readonly heading: string;
  readonly valueColumn: string;
  readonly section: AnalyticsSection<readonly AnalyticsBreakdownRow[]>;
  readonly label: (value: string) => string;
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
  readonly monospaceValues?: boolean;
}) {
  return (
    <div className="mt-8">
      <h3 className={SUBHEADING_CLASS}>{heading}</h3>
      {section.state === "unavailable" ? (
        <p role="status" className={`mt-3 ${MUTED_TEXT_CLASS}`}>
          {copy.sectionUnavailable}
        </p>
      ) : section.data.length === 0 ? (
        <p className={`mt-3 ${MUTED_TEXT_CLASS}`}>{copy.sectionEmpty}</p>
      ) : (
        <CountTable
          caption={heading}
          valueColumn={valueColumn}
          countColumn={copy.countColumn}
          rows={section.data.map(({ value, count }) => ({
            label: label(value),
            count,
          }))}
          locale={locale}
          monospaceValues={monospaceValues}
        />
      )}
    </div>
  );
}

function ReachFigures({
  analytics,
  copy,
  locale,
}: {
  readonly analytics: VercelAnalytics;
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
}) {
  if (analytics.state === "disabled") {
    return <p className={`mt-4 ${MUTED_TEXT_CLASS}`}>{copy.reachDisabled}</p>;
  }
  if (analytics.state === "not-enabled") {
    return <p className={`mt-4 ${MUTED_TEXT_CLASS}`}>{copy.reachNotEnabled}</p>;
  }

  const titles = courseTitles(locale);
  const courseTitle = (slug: string) => titles.get(slug) ?? slug;
  const identity = (value: string) => value;
  const { totals } = analytics;
  return (
    <>
      <p className={`mt-3 max-w-2xl ${MUTED_TEXT_CLASS}`}>
        {copy.reachIntro(analytics.windowDays)}
      </p>
      {totals.state === "unavailable" ? (
        <p role="status" className={`mt-4 ${MUTED_TEXT_CLASS}`}>
          {copy.sectionUnavailable}
        </p>
      ) : (
        <dl aria-label={copy.reachTotalsLabel} className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              [copy.pageviews, totals.data.pageviews],
              [copy.visitors, totals.data.visitors],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-card p-4">
              <dt className={MUTED_TEXT_CLASS}>{label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {formatCount(value, locale)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <BreakdownBlock
        heading={copy.routesHeading}
        valueColumn={copy.routeColumn}
        section={analytics.routes}
        label={identity}
        copy={copy}
        locale={locale}
        monospaceValues
      />
      <BreakdownBlock
        heading={copy.eventsHeading}
        valueColumn={copy.eventColumn}
        section={analytics.events}
        label={identity}
        copy={copy}
        locale={locale}
        monospaceValues
      />
      <BreakdownBlock
        heading={copy.courseStartsHeading}
        valueColumn={copy.courseColumn}
        section={analytics.courseStarts}
        label={courseTitle}
        copy={copy}
        locale={locale}
      />
      <BreakdownBlock
        heading={copy.lessonCompletionsHeading}
        valueColumn={copy.courseColumn}
        section={analytics.lessonCompletions}
        label={courseTitle}
        copy={copy}
        locale={locale}
      />
      <BreakdownBlock
        heading={copy.courseCompletionStepsHeading}
        valueColumn={copy.stepColumn}
        section={analytics.courseCompletionSteps}
        label={identity}
        copy={copy}
        locale={locale}
        monospaceValues
      />
      <p className={`mt-6 ${MUTED_TEXT_CLASS}`}>
        {copy.reachThresholdNote(MIN_REPORTABLE_COUNT)}
      </p>
    </>
  );
}

function ReachSection({
  analytics,
  copy,
  locale,
}: {
  readonly analytics: VercelAnalytics;
  readonly copy: StatistikPageCopy;
  readonly locale: Locale;
}) {
  return (
    <section aria-labelledby="statistik-reichweite" className="mt-12">
      <h2 id="statistik-reichweite" className={HEADING_CLASS}>
        {copy.reachHeading}
      </h2>
      <ReachFigures analytics={analytics} copy={copy} locale={locale} />
    </section>
  );
}

export default async function KontoStatistikPage() {
  // The gate is the first await: nothing else runs before the request is
  // classified.
  const gate = await requireAdminUser();
  const locale = await getRequestLocale();
  const copy = STATISTIK_COPY[locale];

  if (gate === "denied" || gate === "disabled") notFound();
  if (gate === "signed-out") redirect(loginHref(locale));
  if (gate === "unavailable") {
    reportApiError({
      route: STATISTIK_PATH,
      step: "auth-verify-session",
      error: new Error("admin_gate_unavailable"),
    });
    return (
      <PageShell copy={copy}>
        <UnavailablePanel copy={copy} />
      </PageShell>
    );
  }
  if (gate === "reauth") {
    return (
      <PageShell copy={copy}>
        <ReauthPanel copy={copy} locale={locale} />
      </PageShell>
    );
  }

  const [aggregates, analytics] = await Promise.all([
    readAdminAggregates(),
    readVercelAnalytics({ now: new Date() }),
  ]);
  // Both readers re-check the gate. A null here means that check disagreed,
  // so the page fails closed exactly like a denied visitor.
  if (aggregates === null || analytics === null) notFound();

  return (
    <PageShell copy={copy}>
      <PlatformSection aggregates={aggregates} copy={copy} locale={locale} />
      <ReachSection analytics={analytics} copy={copy} locale={locale} />
    </PageShell>
  );
}
