import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import {
  courseOutcomeCoverage,
  coveredCourseOutcomes,
} from "@/lib/courses/competencies";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import type { UnifiedProgress } from "@/lib/progress/types";
import { ProgressSyncNotice } from "@/components/auth/progress-sync-notice";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { isAgentAccessReady } from "@/lib/provider-readiness";
import { ACCOUNT_COPY } from "./account-copy";
import {
  KONTO_SECTION_IDS,
  buildAccountCourses,
  groupCoveredOutcomes,
  isCourseLevel,
  isCourseSort,
  orderCatalog,
  selectNextCourse,
  type CourseSort,
} from "./sections/account-data";
import { WeiterlernenSection } from "./sections/weiterlernen";
import { MeineKurseSection } from "./sections/meine-kurse";
import { WerkzeugeSection } from "./sections/werkzeuge";
import {
  WERKZEUGE_COPY,
  WERKZEUGE_SECTION_ID,
} from "./sections/werkzeuge-copy";
import { DEINE_KI_SECTION_ID, DeineKiSection } from "./sections/deine-ki";
import { AGENT_ACCESS_COPY } from "./sections/region-copy";
import { TeilnahmebestaetigungenSection } from "./sections/teilnahmebestaetigungen";
import { KontoVerwaltenSection } from "./sections/verwalten";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(ACCOUNT_COPY[locale].metadata);
}

interface KontoSearchParams {
  readonly level?: string;
  readonly sort?: string;
}

export default async function KontoPage({
  searchParams,
}: {
  readonly searchParams: Promise<KontoSearchParams>;
}) {
  const [locale, auth, params] = await Promise.all([
    getRequestLocale(),
    getAuthenticatedUser(),
    searchParams,
  ]);
  const activeLevel = isCourseLevel(params.level) ? params.level : undefined;
  const activeSort: CourseSort = isCourseSort(params.sort)
    ? params.sort
    : "step";
  const { configured, user, error: authError } = auth;
  const copy = ACCOUNT_COPY[locale];
  const courses = localizeCatalog(COURSE_CATALOG, locale);
  // An auth-backend outage returns {configured:true, user:null, error} — the
  // same shape as "logged out" minus the error. Redirecting on it signs a
  // signed-in learner out of a page they are still entitled to see, so the
  // outage is rendered instead.
  if (authError) {
    reportApiError({ route: "/konto", step: "auth-get-user", error: authError });
  }
  if (configured && !user && !authError) {
    const accountHref = localizeHref("/konto", locale);
    redirect(localizeHref(`/login?next=${accountHref}`, locale));
  }

  const authUnavailable = Boolean(authError);
  let progress: UnifiedProgress | null = null;
  let updatedAt: string | null = null;
  let progressUnavailable = authUnavailable;
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({
      route: "/konto",
      step: "auth-create-client",
      error,
    });
    supabase = null;
    progressUnavailable = true;
  }
  if (user && !supabase) progressUnavailable = true;
  // The account's ONE read. Every region below receives derived props, so no
  // region can turn a page render into a request waterfall.
  if (supabase && user) {
    const fetched = await fetchUnifiedProgressForUser(supabase, user.id);
    if (fetched.ok) {
      progress = fetched.result.progress;
      updatedAt = fetched.result.updatedAt;
    } else {
      progressUnavailable = true;
    }
  }

  const courseState = buildAccountCourses(courses, progress);
  const coursesDone = courseState.filter((entry) => entry.recordEarned).length;
  const nextCourse = selectNextCourse(courseState);
  const catalogState = orderCatalog(courseState, activeLevel, activeSort);
  const myCourses = catalogState.filter((entry) => entry.started);
  const availableCourses = catalogState.filter((entry) => !entry.started);
  const earnedRecords = courseState.filter((entry) => entry.recordEarned);

  const { covered: coveredCount, total: totalOutcomes } =
    courseOutcomeCoverage(progress);
  const coveredByCourse = groupCoveredOutcomes(
    courses,
    coveredCourseOutcomes(progress, locale),
  );

  // Only offer anchors to regions that actually render, in the order they
  // render. Weiterlernen, Werkzeuge and Konto verwalten survive an outage; the
  // course and record regions do not, so linking to them would strand the
  // learner mid-page. Werkzeuge always renders a card, in its source-only
  // state when no hosted tool is configured, so it always carries an anchor.
  // Deine KI renders nothing until agent access is ready, so its anchor is
  // offered under exactly the predicate the region itself checks.
  //
  // Both region labels are the regions' own headings rather than a second
  // string in account-copy.ts, so a nav entry can never name a heading the
  // learner does not find on arrival.
  // `key` names each destination for the `data-konto-tab` hook on its link,
  // which the swipeable tab strip below lg uses to settle on a region.
  const sectionLinks: readonly {
    readonly key: string;
    readonly href: string;
    readonly label: string;
  }[] = [
    {
      key: "weiterlernen",
      href: `#${KONTO_SECTION_IDS.weiterlernen}`,
      label: copy.continueHeading,
    },
    ...(progressUnavailable
      ? []
      : [
          {
            key: "kurse",
            href: `#${KONTO_SECTION_IDS.kurse}`,
            label: copy.coursesHeading,
          },
        ]),
    {
      key: "werkzeuge",
      href: `#${WERKZEUGE_SECTION_ID}`,
      label: WERKZEUGE_COPY[locale].heading,
    },
    ...(isAgentAccessReady()
      ? [
          {
            key: "deine-ki",
            href: `#${DEINE_KI_SECTION_ID}`,
            label: AGENT_ACCESS_COPY[locale].heading,
          },
        ]
      : []),
    ...(progressUnavailable
      ? []
      : [
          {
            key: "nachweise",
            href: `#${KONTO_SECTION_IDS.nachweise}`,
            label: copy.recordsHeading,
          },
        ]),
    {
      key: "verwalten",
      href: `#${KONTO_SECTION_IDS.verwalten}`,
      label: copy.sectionSettings,
    },
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {authUnavailable
                ? copy.authUnavailableIdentity
                : copy.signedIn(user?.email ?? copy.localIdentity)}
            </p>
          </div>
          {authUnavailable ? null : (
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {copy.logout}
                <LogOut size={14} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {/* Persistent account navigation over the regions below. Deliberately
            not sticky: the site nav is already `fixed top-0 z-50`, so a second
            sticky bar would stack on it. Its accessible name is distinct from
            privacyNavigationLabel so getByRole("navigation", { name: "Account
            privacy" }) stays a single match. */}
        <nav
          aria-label={copy.sectionNavigationLabel}
          data-konto-section-nav
          className="mt-6 border-y border-border"
        >
          {/* Below lg the links form one swipeable tab strip: every section
              stays reachable in a single 44px row that scrolls and settles by
              touch or by moving focus, and `data-konto-tab` names each
              destination for the account workbench to hook into. The strip
              keeps 4px of padding all round so the focus ring is not clipped
              by the scroll box. Snapping is `proximity`, not `mandatory`:
              three to five tabs share the viewport at 390px, so there is no
              page to enforce, and mandatory would jerk the strip to a tab
              edge on every small drag. From lg the links wrap as before. */}
          <div
            data-konto-tabs
            className="flex snap-x snap-proximity items-center gap-x-1 overflow-x-auto overscroll-x-contain scroll-px-1 px-1 py-1 [scrollbar-width:none] lg:flex-wrap lg:gap-y-1 lg:overflow-visible lg:px-0"
          >
            {sectionLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                data-konto-tab={item.key}
                className="inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange lg:shrink lg:whitespace-normal"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* A stopped or exhausted background sync leaves the record below
            stale on other devices. It was previously announced only on
            /konto/datenschutz, which a learner reading their record never
            passes through. */}
        <ProgressSyncNotice locale={locale} />

        <WeiterlernenSection
          copy={copy}
          locale={locale}
          progressUnavailable={progressUnavailable}
          authUnavailable={authUnavailable}
          coursesDone={coursesDone}
          courseCount={COURSE_CATALOG.length}
          coveredCount={coveredCount}
          totalOutcomes={totalOutcomes}
          updatedAt={updatedAt}
          nextCourse={nextCourse}
        />

        {progressUnavailable ? null : (
          <MeineKurseSection
            copy={copy}
            locale={locale}
            activeLevel={activeLevel}
            activeSort={activeSort}
            myCourses={myCourses}
            availableCourses={availableCourses}
          />
        )}

        {/* Both regions take the locale the page already resolved. Werkzeuge
            renders its source-only card in the same pass with it, instead of
            resolving the request locale a second time behind its own boundary,
            and Deine KI would otherwise print German copy on /en/konto once
            agent access is enabled.

            Werkzeuge also takes the account id from the verified user above,
            which is what filters its documents read to a single owner. The
            prop is required, so this page cannot quietly stop passing it, and
            it is null in exactly the states the read above leaves without a
            session (an auth outage, or a deployment with no auth at all), in
            which case the region reads nothing at all. */}
        <WerkzeugeSection locale={locale} userId={user?.id ?? null} />

        <DeineKiSection locale={locale} />

        {progressUnavailable ? null : (
          <TeilnahmebestaetigungenSection
            copy={copy}
            locale={locale}
            earnedRecords={earnedRecords}
            coveredCount={coveredCount}
            totalOutcomes={totalOutcomes}
            coveredByCourse={coveredByCourse}
          />
        )}

        <KontoVerwaltenSection copy={copy} locale={locale} />
      </div>
    </section>
  );
}
