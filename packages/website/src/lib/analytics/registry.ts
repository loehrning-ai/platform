/**
 * Product-event registry: the single source of truth for every app-authored
 * event this platform may send to Vercel Web Analytics.
 *
 * DECISION. The platform sends a small, closed set of named usage events on
 * the Vercel Web Analytics transport that is already mounted for pageviews.
 * Every event carries at most two properties with the fixed keys `subject`
 * and `facet`. Both values are lowercase slugs drawn from the closed
 * vocabularies declared below, and nothing else can leave the browser: the
 * dispatcher drops any event name that is not declared here, any key other
 * than `subject` / `facet`, and any value that is not a declared member of
 * that event's vocabulary. Only string literals are declared in this file, so
 * a score, a count, a duration or a flag is not representable.
 *
 * The copy describing this decision to visitors is section 5 (usage events,
 * recipient, legal basis, device-storage assessment) and section 10
 * (retention) of the privacy notice at /datenschutz and its English mirror.
 *
 * LOAD-BEARING INVARIANT. No declared value is joinable to a learning account.
 * Three blocks of the account privacy centre in
 * src/app/konto/datenschutz/datenschutz-client.tsx are true only while that
 * holds: the Art. 20 export enumeration, the Art. 17 deletion scope and the
 * residue disclosure. The moment any event carries an identifier, an e-mail
 * address, free text or another account-linkable value, all three become false
 * at the same time, and so does section 5 of the privacy notice.
 *
 * REJECTED ALTERNATIVE. A first-party counter store in Supabase (a counter
 * table, an ingestion route, a scheduled job and a service-role write surface)
 * was costed and rejected: it would add a second complete feature gate beside
 * a working one, and a browser flush to a first-party route attaches the
 * Supabase session cookie to every request by construction.
 *
 * CLIENT BUNDLES. Vocabularies that exist elsewhere in the codebase (course
 * slugs, demo slugs, workshop slugs, the demo CTA targets) are mirrored here as
 * literals so importing this file never pulls course content, the demo
 * catalogue or the workshop catalogue into a client bundle. The contract test
 * imports the real modules and fails on any drift.
 */

/** Lowercase slug shape every declared and every dispatched value must match. */
export const SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,47}$/;

/** The only property keys any event may carry. */
export const ANALYTICS_PROP_KEYS = ["subject", "facet"] as const;
export type AnalyticsPropKey = (typeof ANALYTICS_PROP_KEYS)[number];

/** Mirror of COURSE_SLUGS in src/lib/course/types.ts. */
export const ANALYTICS_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ai-native",
  "ki-und-gesellschaft",
  "data-engineering-fundamentals",
  "data-science",
  "data-infrastructure",
  "codex",
  "claude",
  "ai-native-operator",
] as const;
export type AnalyticsCourseSlug = (typeof ANALYTICS_COURSE_SLUGS)[number];

/**
 * Courses whose lessons share one route with a `#lesson=` fragment, so a path
 * pageview cannot tell lessons apart. Only these emit `lesson_reached`; every
 * other course has one route per lesson and is read from pageviews instead.
 */
export const ANALYTICS_BLOCK_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ki-und-gesellschaft",
] as const;
export type AnalyticsBlockCourseSlug =
  (typeof ANALYTICS_BLOCK_COURSE_SLUGS)[number];

/** Mirror of the demo slugs in src/lib/demos.ts. */
export const ANALYTICS_DEMO_SLUGS = [
  "excel",
  "word",
  "outbound-workflow",
  "agent-pipeline",
  "n8n-supply-chain",
  "rag-vertragsassistent",
  "rechnung-zu-sap",
  "prompt-scanner",
  "cost-drift-observability",
  "fine-tune-playground",
  "roi-rechner",
  "llm-observability",
] as const;
export type AnalyticsDemoSlug = (typeof ANALYTICS_DEMO_SLUGS)[number];

/** Mirror of the workshop slugs in src/lib/workshops.ts. */
export const ANALYTICS_WORKSHOP_SLUGS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "datenbereitschaft-fuer-ki",
] as const;
export type AnalyticsWorkshopSlug = (typeof ANALYTICS_WORKSHOP_SLUGS)[number];

/** Mirror of WorkshopMaterial["kind"] in src/lib/workshops.ts. */
export const ANALYTICS_MATERIAL_KINDS = ["html", "zip", "csv"] as const;
export type AnalyticsMaterialKind = (typeof ANALYTICS_MATERIAL_KINDS)[number];

/**
 * Lesson positions inside a course, in canonical order. The position is sent,
 * never the lesson id, so the vocabulary stays closed and course-independent.
 */
export const ANALYTICS_LESSON_ORDINALS = [
  "l01", "l02", "l03", "l04", "l05", "l06", "l07", "l08", "l09", "l10",
  "l11", "l12", "l13", "l14", "l15", "l16", "l17", "l18", "l19", "l20",
  "l21", "l22", "l23", "l24", "l25", "l26", "l27", "l28", "l29", "l30",
  "l31", "l32", "l33", "l34", "l35", "l36", "l37", "l38", "l39",
] as const;
export type AnalyticsLessonOrdinal = (typeof ANALYTICS_LESSON_ORDINALS)[number];

/** Same-origin surface a course start was reached from; external is `direct`. */
export const ANALYTICS_REFERRER_SOURCES = [
  "katalog",
  "ki_check",
  "home",
  "demo",
  "hub",
  "direct",
] as const;
export type AnalyticsReferrerSource =
  (typeof ANALYTICS_REFERRER_SOURCES)[number];

/** Final-exam and record steps of a course. Outcomes are disjoint. */
export const ANALYTICS_COURSE_COMPLETION_STEPS = [
  "exam_blocked",
  "exam_started",
  "exam_unavailable",
  "exam_passed",
  "exam_failed",
  "exam_timeout",
  "record_downloaded",
] as const;
export type AnalyticsCourseCompletionStep =
  (typeof ANALYTICS_COURSE_COMPLETION_STEPS)[number];

export const ANALYTICS_LOGIN_METHODS = ["magic_link", "google", "github"] as const;
export type AnalyticsLoginMethod = (typeof ANALYTICS_LOGIN_METHODS)[number];

export const ANALYTICS_LOGIN_FLOW_STEPS = [
  "started",
  "link_sent",
  "link_failed",
] as const;
export type AnalyticsLoginFlowStep = (typeof ANALYTICS_LOGIN_FLOW_STEPS)[number];

/**
 * The reasons the login page explains, snake_cased. Anything the page does not
 * know maps to `fallback`; the raw query parameter is never sent.
 */
export const ANALYTICS_LOGIN_GATE_REASONS = [
  "progress_save",
  "kurs_login",
  "anderes_geraet",
  "abgelaufen",
  "ungueltig",
  "auth_not_configured",
  "auth_unavailable",
  "missing_code",
  "invalid_link",
  "untrusted_origin",
  "invalid_code_format",
  "fallback",
] as const;
export type AnalyticsLoginGateReason =
  (typeof ANALYTICS_LOGIN_GATE_REASONS)[number];

/** Which sign-in methods the login page offered when the gate was shown. */
export const ANALYTICS_LOGIN_AVAILABILITY = [
  "all",
  "oauth_only",
  "magic_only",
  "none",
] as const;
export type AnalyticsLoginAvailability =
  (typeof ANALYTICS_LOGIN_AVAILABILITY)[number];

export const ANALYTICS_KI_CHECK_STEPS = [
  "started",
  "completed",
  "cta_start",
  "cta_course",
] as const;
export type AnalyticsKiCheckStep = (typeof ANALYTICS_KI_CHECK_STEPS)[number];

export const ANALYTICS_FAILURE_SOURCES = ["progress_sync", "ai_grading"] as const;
export type AnalyticsFailureSource = (typeof ANALYTICS_FAILURE_SOURCES)[number];

/** Mirror of ProgressSyncFailure in src/lib/progress/sync-status.ts. */
export const ANALYTICS_PROGRESS_SYNC_FAILURES = [
  "permanent",
  "retry_exhausted",
  "startup",
] as const;
export type AnalyticsProgressSyncFailure =
  (typeof ANALYTICS_PROGRESS_SYNC_FAILURES)[number];

/** Snake_cased mirror of the AI-grading fallback reasons. */
export const ANALYTICS_AI_GRADING_FAILURES = [
  "provider_not_ready",
  "quota_unavailable",
  "budget_exhausted",
  "rate_limited",
  "network",
  "parse_error",
  "timeout",
  "bad_request",
] as const;
export type AnalyticsAiGradingFailure =
  (typeof ANALYTICS_AI_GRADING_FAILURES)[number];

export const ANALYTICS_ADVANCED_SURFACES = ["agent_token"] as const;
export type AnalyticsAdvancedSurface =
  (typeof ANALYTICS_ADVANCED_SURFACES)[number];

/** `available` is the denominator that makes a zero `minted` readable. */
export const ANALYTICS_AGENT_TOKEN_STEPS = [
  "available",
  "minted",
  "revoked",
  "failed",
] as const;
export type AnalyticsAgentTokenStep =
  (typeof ANALYTICS_AGENT_TOKEN_STEPS)[number];

/** Mirror of DemoCtaTarget in src/lib/analytics.ts, hyphens kept verbatim. */
export const ANALYTICS_DEMO_CTA_TARGETS = [
  "kurs",
  "lektion",
  "next-demo",
  "pdf-download",
  "copy-link",
  "back-to-gallery",
] as const;
export type AnalyticsDemoCtaTarget = (typeof ANALYTICS_DEMO_CTA_TARGETS)[number];

interface EventVocabulary {
  readonly subject: readonly string[];
  readonly facet?: readonly string[];
}

const EVENT_DEFINITIONS = {
  /** Which course is started, and from which surface. */
  course_started: {
    subject: ANALYTICS_COURSE_SLUGS,
    facet: ANALYTICS_REFERRER_SOURCES,
  },
  /** Drop-off inside the block courses that share one route per block. */
  lesson_reached: {
    subject: ANALYTICS_BLOCK_COURSE_SLUGS,
    facet: ANALYTICS_LESSON_ORDINALS,
  },
  /** Which lesson position is durably completed in which course. */
  lesson_completed: {
    subject: ANALYTICS_COURSE_SLUGS,
    facet: ANALYTICS_LESSON_ORDINALS,
  },
  /** Final exam and course record: outcome labels only, never a score. */
  course_completion: {
    subject: ANALYTICS_COURSE_SLUGS,
    facet: ANALYTICS_COURSE_COMPLETION_STEPS,
  },
  /** Sign-in attempts per method; never the address, never provider detail. */
  login_flow: {
    subject: ANALYTICS_LOGIN_METHODS,
    facet: ANALYTICS_LOGIN_FLOW_STEPS,
  },
  /** Why the login page was shown, against what it could offer. */
  login_gate: {
    subject: ANALYTICS_LOGIN_GATE_REASONS,
    facet: ANALYTICS_LOGIN_AVAILABILITY,
  },
  /** The diagnostic ladder; facet is only the recommended course. */
  ki_check: {
    subject: ANALYTICS_KI_CHECK_STEPS,
    facet: ANALYTICS_COURSE_SLUGS,
  },
  /** Workshop material opened, by workshop and file kind. */
  material_opened: {
    subject: ANALYTICS_WORKSHOP_SLUGS,
    facet: ANALYTICS_MATERIAL_KINDS,
  },
  /** Failures a learner only sees as a notice, by source and reason. */
  platform_failure: {
    subject: ANALYTICS_FAILURE_SOURCES,
    facet: [
      ...ANALYTICS_PROGRESS_SYNC_FAILURES,
      ...ANALYTICS_AI_GRADING_FAILURES,
    ],
  },
  /** Whether the advanced account surface is used once it is offered. */
  advanced_surface: {
    subject: ANALYTICS_ADVANCED_SURFACES,
    facet: ANALYTICS_AGENT_TOKEN_STEPS,
  },
  /** Whether demos convert into a course or dead-end. */
  demo_cta_clicked: {
    subject: ANALYTICS_DEMO_SLUGS,
    facet: ANALYTICS_DEMO_CTA_TARGETS,
  },
} as const satisfies Readonly<Record<string, EventVocabulary>>;

function freezeRegistry<T extends Readonly<Record<string, EventVocabulary>>>(
  definitions: T,
): T {
  for (const vocabulary of Object.values(definitions)) {
    Object.freeze(vocabulary.subject);
    if (vocabulary.facet) Object.freeze(vocabulary.facet);
    Object.freeze(vocabulary);
  }
  return Object.freeze(definitions);
}

export const ANALYTICS_EVENTS = freezeRegistry(EVENT_DEFINITIONS);

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export type AnalyticsSubject<E extends AnalyticsEventName> =
  (typeof ANALYTICS_EVENTS)[E]["subject"][number];

export type AnalyticsFacet<E extends AnalyticsEventName> =
  (typeof ANALYTICS_EVENTS)[E] extends { readonly facet: readonly (infer V)[] }
    ? V
    : never;

export function isAnalyticsEventName(
  name: string,
): name is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENTS, name);
}
