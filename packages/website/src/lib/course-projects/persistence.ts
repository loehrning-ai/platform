import {
  MAX_EXERCISE_SUMMARY_BYTES,
  truncateToByteLength,
} from "@/lib/progress/types";
import type { CourseSlug } from "@/lib/course/types";
import type {
  CourseProjectArtifactState,
  CourseProjectArtifactValue,
  CourseProjectEngineKind,
} from "./types";
import {
  COURSE_PROJECT_EXECUTION_RECEIPTS,
  COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS,
  COURSE_PROJECT_STAGE_IDS,
  getCourseProjectExecutionReceipt,
} from "./types";

const ENVELOPE_PREFIX = "@cp1:";
const MAX_ARTIFACT_FIELDS = 20;
const MAX_FIELD_KEY_BYTES = 32;
const MAX_FIELD_STRING_BYTES = 160;
const MAX_ARRAY_ITEMS = 6;
const MAX_ARRAY_ITEM_BYTES = 48;
const MAX_SUMMARY_BYTES = 160;
const COMPACT_EXECUTION_RECEIPTS = Object.values(
  COURSE_PROJECT_EXECUTION_RECEIPTS,
);
const COMPACT_LOCAL_LEARNING_RECEIPTS = Object.values(
  COURSE_PROJECT_LOCAL_LEARNING_RECEIPTS,
);
const COMPACT_PROVIDER_MODELS = [
  "anthropic/claude-haiku-4.5",
  "google/gemini-2.5-flash-lite",
] as const;
const ENGINE_KINDS = new Set<CourseProjectEngineKind>([
  "prompt",
  "repo",
  "data",
  "case",
]);

const FIELD_PRIORITY: Readonly<
  Record<CourseProjectEngineKind, readonly string[]>
> = {
  prompt: [
    "stages",
    "executionReceipt",
    "learningReceipt",
    "privacyConfirmed",
    "goalReady",
    "contextReady",
    "constraintsReady",
    "variant",
    "secondaryReady",
    "approvalGate",
    "stopCondition",
    "handoffDefined",
    "twoOutputEvidence",
    "comparisonDecision",
    "claimReviewCode",
    "rubricScores",
    "evaluation",
    "providerEvidence",
    "completionMode",
    "providerFailureClass",
    "providerModel",
    "budget",
  ],
  repo: [
    "stages",
    "executionReceipt",
    "specReady",
    "sandboxAttested",
    "attestationContract",
    "workspace",
    "commandSequence",
    "baselineFailed",
    "postfixPassed",
    "checksPassed",
    "diffScoped",
  ],
  data: [
    "stages",
    "variant",
    "planValid",
    "failureInjected",
    "executionVerified",
    "executionReceipt",
    "testsPassed",
    "failureObserved",
    "decision",
    "noteReady",
    "safeMetricCompared",
    "leakageDetected",
    "peekingDetected",
    "reconciled",
    "idempotent",
    "lateBackfilled",
    "sloBreached",
    "recovered",
    "zeroLoss",
  ],
  case: ["stages", "executionReceipt", "responses", "sources", "review"],
};
const ARTIFACT_TRIMMED_FIELD = "artifactTrimmed";
const ALLOWED_FIELD_KEYS: Readonly<
  Record<CourseProjectEngineKind, ReadonlySet<string>>
> = Object.freeze({
  prompt: new Set([...FIELD_PRIORITY.prompt, ARTIFACT_TRIMMED_FIELD]),
  repo: new Set([...FIELD_PRIORITY.repo, ARTIFACT_TRIMMED_FIELD]),
  data: new Set([...FIELD_PRIORITY.data, ARTIFACT_TRIMMED_FIELD]),
  case: new Set([...FIELD_PRIORITY.case, ARTIFACT_TRIMMED_FIELD]),
});

interface StoredEnvelope {
  readonly s?: string;
  readonly k: CourseProjectEngineKind;
  readonly f: Readonly<Record<string, CourseProjectArtifactValue>>;
}

export interface ParsedCourseProjectProgress {
  readonly summary: string | null;
  readonly artifact: CourseProjectArtifactState | null;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function storageSafeText(value: string): string {
  return value.replace(/\p{Cc}/gu, " ");
}

function normalizeFieldValue(
  value: CourseProjectArtifactValue,
): CourseProjectArtifactValue {
  if (typeof value === "string") {
    return truncateToByteLength(storageSafeText(value), MAX_FIELD_STRING_BYTES);
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) =>
        truncateToByteLength(storageSafeText(item), MAX_ARRAY_ITEM_BYTES),
      );
  }
  return value;
}

function normalizeFields(
  engineKind: CourseProjectEngineKind,
  fields: CourseProjectArtifactState["fields"],
): Record<string, CourseProjectArtifactValue> {
  const normalized: Record<string, CourseProjectArtifactValue> = {};
  const orderedKeys = [...FIELD_PRIORITY[engineKind], ARTIFACT_TRIMMED_FIELD];
  for (const rawKey of orderedKeys) {
    if (Object.keys(normalized).length >= MAX_ARTIFACT_FIELDS) break;
    if (!Object.hasOwn(fields, rawKey)) continue;
    const value = fields[rawKey];
    const key = truncateToByteLength(
      storageSafeText(rawKey.trim()),
      MAX_FIELD_KEY_BYTES,
    );
    if (!key || Object.hasOwn(normalized, key)) continue;
    if (
      rawKey === "learningReceipt" &&
      !COMPACT_LOCAL_LEARNING_RECEIPTS.includes(
        value as (typeof COMPACT_LOCAL_LEARNING_RECEIPTS)[number],
      )
    ) {
      continue;
    }
    normalized[key] = normalizeFieldValue(value);
  }
  return normalized;
}

function encodeEnvelope(
  summary: string | null,
  engineKind: CourseProjectEngineKind,
  fields: Readonly<Record<string, CourseProjectArtifactValue>>,
): string {
  const storedFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (
        key === "stages" &&
        Array.isArray(value) &&
        value.length === COURSE_PROJECT_STAGE_IDS.length &&
        value.every((entry, index) => entry === COURSE_PROJECT_STAGE_IDS[index])
      ) {
        return [key, true];
      }
      if (key === "executionReceipt" && typeof value === "string") {
        const index = COMPACT_EXECUTION_RECEIPTS.indexOf(
          value as (typeof COMPACT_EXECUTION_RECEIPTS)[number],
        );
        if (index >= 0) return [key, index];
      }
      if (key === "learningReceipt" && typeof value === "string") {
        const index = COMPACT_LOCAL_LEARNING_RECEIPTS.indexOf(
          value as (typeof COMPACT_LOCAL_LEARNING_RECEIPTS)[number],
        );
        if (index >= 0) return [key, index];
      }
      if (key === "providerModel" && typeof value === "string") {
        const index = COMPACT_PROVIDER_MODELS.indexOf(
          value as (typeof COMPACT_PROVIDER_MODELS)[number],
        );
        if (index >= 0) return [key, index];
      }
      if (key === "providerEvidence") {
        if (value === "success") return [key, true];
        if (value === "none") return [key, false];
      }
      if (key === "completionMode") {
        if (value === "provider-success") return [key, true];
        if (value === "degraded-policy") return [key, false];
      }
      return [key, value];
    }),
  ) as Readonly<Record<string, CourseProjectArtifactValue>>;
  const envelope: StoredEnvelope = {
    ...(summary ? { s: summary } : {}),
    k: engineKind,
    f: storedFields,
  };
  return `${ENVELOPE_PREFIX}${JSON.stringify(envelope)}`;
}

function shrinkString(value: string, minimumBytes: number): string {
  const currentBytes = byteLength(value);
  if (currentBytes <= minimumBytes) return value;
  return truncateToByteLength(
    value,
    Math.max(minimumBytes, Math.floor(currentBytes * 0.75)),
  );
}

/**
 * Serialize a compact, valid JSON envelope that cannot be corrupted by the
 * progress store's 500-byte summary cap. Long free-form values are reduced
 * deterministically; booleans, numbers, keys, and as many fields as possible
 * are retained so rehydration still restores meaningful engine state.
 */
export function serializeCourseProjectProgress(
  summary: string | null,
  artifact: CourseProjectArtifactState,
): string {
  let compactSummary = summary?.trim()
    ? truncateToByteLength(storageSafeText(summary.trim()), MAX_SUMMARY_BYTES)
    : null;
  const fields = normalizeFields(artifact.engineKind, artifact.fields);
  let encoded = encodeEnvelope(compactSummary, artifact.engineKind, fields);

  while (byteLength(encoded) > MAX_EXERCISE_SUMMARY_BYTES) {
    let changed = false;

    for (const [key, value] of Object.entries(fields)) {
      if (
        key !== "executionReceipt" &&
        key !== "learningReceipt" &&
        typeof value === "string" &&
        byteLength(value) > 32
      ) {
        fields[key] = shrinkString(value, 32);
        changed = true;
      } else if (Array.isArray(value)) {
        const next = value.map((item) => shrinkString(item, 20));
        if (next.some((item, index) => item !== value[index])) {
          fields[key] = next;
          changed = true;
        }
      }
    }

    if (!changed && compactSummary) {
      const next = shrinkString(compactSummary, 16);
      if (next !== compactSummary) {
        compactSummary = next;
        changed = true;
      }
    }

    if (!changed) {
      const keys = Object.keys(fields);
      if (keys.length > 1) {
        delete fields[keys[keys.length - 1]];
        changed = true;
      }
    }

    if (!changed) break;
    encoded = encodeEnvelope(compactSummary, artifact.engineKind, fields);
  }

  if (byteLength(encoded) <= MAX_EXERCISE_SUMMARY_BYTES) return encoded;

  // Defensive last resort for hostile control/escape-heavy strings. Keep the
  // engine identity and a truthful rehydration marker rather than returning
  // JSON that the progress store would truncate into an invalid envelope.
  return encodeEnvelope(
    compactSummary
      ? truncateToByteLength(storageSafeText(compactSummary), 48)
      : null,
    artifact.engineKind,
    { artifactTrimmed: true },
  );
}

function isArtifactValue(value: unknown): value is CourseProjectArtifactValue {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") {
    return (
      byteLength(value) <= MAX_FIELD_STRING_BYTES &&
      storageSafeText(value) === value
    );
  }
  return (
    Array.isArray(value) &&
    value.length <= MAX_ARRAY_ITEMS &&
    value.every(
      (item) =>
        typeof item === "string" &&
        byteLength(item) <= MAX_ARRAY_ITEM_BYTES &&
        storageSafeText(item) === item,
    )
  );
}

/** Parse both the current envelope and historical plain-text summaries. */
export function parseCourseProjectProgress(
  storedSummary: string | undefined,
  expectedEngineKind?: CourseProjectEngineKind,
): ParsedCourseProjectProgress {
  if (!storedSummary) return { summary: null, artifact: null };
  if (!storedSummary.startsWith(ENVELOPE_PREFIX)) {
    return { summary: storedSummary, artifact: null };
  }

  try {
    if (byteLength(storedSummary) > MAX_EXERCISE_SUMMARY_BYTES) {
      return { summary: null, artifact: null };
    }
    const parsed = JSON.parse(storedSummary.slice(ENVELOPE_PREFIX.length)) as {
      s?: unknown;
      k?: unknown;
      f?: unknown;
    };
    const envelopeKeys = Object.keys(parsed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      envelopeKeys.some((key) => key !== "s" && key !== "k" && key !== "f") ||
      (Object.hasOwn(parsed, "s") &&
        (typeof parsed.s !== "string" ||
          !parsed.s.trim() ||
          byteLength(parsed.s) > MAX_SUMMARY_BYTES ||
          storageSafeText(parsed.s) !== parsed.s)) ||
      typeof parsed.k !== "string" ||
      !ENGINE_KINDS.has(parsed.k as CourseProjectEngineKind) ||
      (expectedEngineKind !== undefined && parsed.k !== expectedEngineKind) ||
      typeof parsed.f !== "object" ||
      parsed.f === null ||
      Array.isArray(parsed.f)
    ) {
      return { summary: null, artifact: null };
    }

    const entries = Object.entries(parsed.f);
    const engineKind = parsed.k as CourseProjectEngineKind;
    if (
      entries.length === 0 ||
      entries.length > MAX_ARTIFACT_FIELDS ||
      entries.some(
        ([key, value]) =>
          !key.trim() ||
          byteLength(key) > MAX_FIELD_KEY_BYTES ||
          storageSafeText(key) !== key ||
          !ALLOWED_FIELD_KEYS[engineKind].has(key) ||
          !isArtifactValue(value) ||
          (key === "learningReceipt" &&
            !(
              (typeof value === "number" &&
                Number.isSafeInteger(value) &&
                COMPACT_LOCAL_LEARNING_RECEIPTS[value] !== undefined) ||
              (typeof value === "string" &&
                COMPACT_LOCAL_LEARNING_RECEIPTS.includes(
                  value as (typeof COMPACT_LOCAL_LEARNING_RECEIPTS)[number],
                ))
            )),
      )
    ) {
      return { summary: null, artifact: null };
    }

    const expandedEntries = entries.map(([key, value]) => {
      if (key === "stages" && value === true) {
        return [key, [...COURSE_PROJECT_STAGE_IDS]] as const;
      }
      if (
        key === "executionReceipt" &&
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        COMPACT_EXECUTION_RECEIPTS[value]
      ) {
        return [key, COMPACT_EXECUTION_RECEIPTS[value]] as const;
      }
      if (
        key === "learningReceipt" &&
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        COMPACT_LOCAL_LEARNING_RECEIPTS[value]
      ) {
        return [key, COMPACT_LOCAL_LEARNING_RECEIPTS[value]] as const;
      }
      if (
        key === "providerModel" &&
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        COMPACT_PROVIDER_MODELS[value]
      ) {
        return [key, COMPACT_PROVIDER_MODELS[value]] as const;
      }
      if (key === "providerEvidence" && typeof value === "boolean") {
        return [key, value ? "success" : "none"] as const;
      }
      if (key === "completionMode" && typeof value === "boolean") {
        return [key, value ? "provider-success" : "degraded-policy"] as const;
      }
      return [key, value] as const;
    });

    return {
      summary:
        typeof parsed.s === "string" && parsed.s.trim() ? parsed.s : null,
      artifact: {
        version: 1,
        engineKind,
        fields: Object.fromEntries(expandedEntries) as Readonly<
          Record<string, CourseProjectArtifactValue>
        >,
      },
    };
  } catch {
    return { summary: null, artifact: null };
  }
}

/**
 * Certificate/progress trust boundary for the compact project envelope.
 * Historical plain-text summaries remain readable, but never count as
 * artifact evidence.
 */
export function hasValidCourseProjectArtifact(
  storedSummary: string | undefined,
  expectedEngineKind: CourseProjectEngineKind,
  courseSlug: CourseSlug,
): boolean {
  const artifact = parseCourseProjectProgress(
    storedSummary,
    expectedEngineKind,
  ).artifact;
  if (!artifact) return false;

  return hasRequiredArtifactEvidence(artifact, courseSlug);
}

function fieldsAreTrue(
  fields: CourseProjectArtifactState["fields"],
  names: readonly string[],
): boolean {
  return names.every((name) => fields[name] === true);
}

function hasSameStringMembers(
  value: CourseProjectArtifactValue | undefined,
  expected: readonly string[],
): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    new Set(value).size === expected.length &&
    expected.every((item) => value.includes(item))
  );
}

function hasExactStringSequence(
  value: CourseProjectArtifactValue | undefined,
  expected: readonly string[],
): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((entry, index) => entry === expected[index])
  );
}

const PROMPT_EVALUATIONS = {
  "ai-native": "workflow",
  claude: "grounding",
  "ai-native-operator": "intervene",
} as const satisfies Partial<Readonly<Record<CourseSlug, string>>>;

const PROMPT_MODELS = new Set([
  "anthropic/claude-haiku-4.5",
  "google/gemini-2.5-flash-lite",
]);
const CLAUDE_COMPARISON_DECISIONS = new Set([
  "a-stronger",
  "b-stronger",
  "equivalent",
]);
const EXPECTED_CLAUDE_CLAIM_REVIEW_CODE = 423153;

function rubricSupportsComparison(value: unknown, decision: string): boolean {
  if (!Number.isSafeInteger(value) || !/^[1-4]{8}$/.test(String(value))) {
    return false;
  }
  const scores = [...String(value)].map(Number);
  const responseA = scores.slice(0, 4).reduce((sum, score) => sum + score, 0);
  const responseB = scores.slice(4).reduce((sum, score) => sum + score, 0);
  return decision === "equivalent"
    ? responseA === responseB
    : decision === "a-stronger"
      ? responseA > responseB
      : decision === "b-stronger" && responseB > responseA;
}

const DATA_VARIANTS = {
  "data-science": "experiment",
  "data-engineering-fundamentals": "pipeline",
  "data-infrastructure": "control-room",
} as const satisfies Partial<Readonly<Record<CourseSlug, string>>>;

const DATA_EXECUTION_EVIDENCE = {
  "data-science": {
    receipt: "ds-leakage-v1:node24",
    decision: "publish-safe-with-limits",
    flags: ["safeMetricCompared", "leakageDetected", "peekingDetected"],
  },
  "data-engineering-fundamentals": {
    receipt: "de-events-v1:node24",
    decision: "isolate-backfill-reconcile",
    flags: ["reconciled", "idempotent", "lateBackfilled"],
  },
  "data-infrastructure": {
    receipt: "di-partition-v1:node24",
    decision: "isolate-replay-verify-slo",
    flags: ["sloBreached", "recovered", "zeroLoss"],
  },
} as const satisfies Partial<
  Readonly<
    Record<
      CourseSlug,
      {
        readonly receipt: string;
        readonly decision: string;
        readonly flags: readonly string[];
      }
    >
  >
>;

const CASE_EVIDENCE = {
  "ki-fuehrerschein": {
    responses: [
      "private-segment:remove",
      "unsupported-claim:uncertain",
      "review-step:review",
    ],
    sources: ["product-note", "review-policy"],
    review: [
      "boundary:supported-only",
      "uncertainty:no-measurement",
      "escalation:human-approval",
      "next-evidence:approved-measurement",
    ],
  },
  "ki-und-gesellschaft": {
    responses: ["claim:claim", "observation:signal", "stakeholders:hold"],
    sources: ["origin", "city"],
    review: [
      "boundary:claim-not-fact",
      "uncertainty:cause-unknown",
      "escalation:hold-correct",
      "next-evidence:independent-source",
    ],
  },
  "eu-ai-act-kurs": {
    responses: ["system-boundary:impact", "roles:map", "legal-evidence:open"],
    sources: ["system-card", "primary-law"],
    review: [
      "boundary:provisional-role-risk",
      "uncertainty:open-facts-law",
      "escalation:legal-owner-review",
      "next-evidence:dated-primary-source",
    ],
  },
} as const satisfies Partial<
  Readonly<
    Record<
      CourseSlug,
      {
        readonly responses: readonly string[];
        readonly sources: readonly string[];
        readonly review: readonly string[];
      }
    >
  >
>;

function hasRequiredArtifactEvidence(
  artifact: CourseProjectArtifactState,
  courseSlug: CourseSlug,
): boolean {
  const fields = artifact.fields;
  if (!hasExactStringSequence(fields.stages, COURSE_PROJECT_STAGE_IDS)) {
    return false;
  }
  if (
    fields.executionReceipt !== getCourseProjectExecutionReceipt(courseSlug)
  ) {
    return false;
  }
  if (artifact.engineKind === "prompt") {
    const expectedEvaluation =
      PROMPT_EVALUATIONS[courseSlug as keyof typeof PROMPT_EVALUATIONS];
    if (
      !expectedEvaluation ||
      fields.variant !== courseSlug ||
      !fieldsAreTrue(fields, [
        "privacyConfirmed",
        "goalReady",
        "contextReady",
        "constraintsReady",
        "approvalGate",
        "stopCondition",
        "handoffDefined",
      ])
    ) {
      return false;
    }

    if (
      fields.completionMode !== "provider-success" ||
      fields.providerEvidence !== "success" ||
      (fields.providerFailureClass !== undefined &&
        fields.providerFailureClass !== "none") ||
      typeof fields.providerModel !== "string" ||
      !PROMPT_MODELS.has(fields.providerModel)
    ) {
      return false;
    }

    if (courseSlug === "claude") {
      return (
        fields.twoOutputEvidence === true &&
        typeof fields.comparisonDecision === "string" &&
        CLAUDE_COMPARISON_DECISIONS.has(fields.comparisonDecision) &&
        fields.claimReviewCode === EXPECTED_CLAUDE_CLAIM_REVIEW_CODE &&
        rubricSupportsComparison(fields.rubricScores, fields.comparisonDecision)
      );
    }

    return (
      fields.secondaryReady === true && fields.evaluation === expectedEvaluation
    );
  }

  if (artifact.engineKind === "repo") {
    return (
      courseSlug === "codex" &&
      fields.attestationContract === "pipeline-quality-v1" &&
      fields.workspace === "pipeline-quality" &&
      fields.commandSequence === "canonical" &&
      fieldsAreTrue(fields, [
        "specReady",
        "sandboxAttested",
        "baselineFailed",
        "postfixPassed",
        "checksPassed",
        "diffScoped",
      ])
    );
  }

  if (artifact.engineKind === "data") {
    const expectedVariant =
      DATA_VARIANTS[courseSlug as keyof typeof DATA_VARIANTS];
    const expectedEvidence =
      DATA_EXECUTION_EVIDENCE[
        courseSlug as keyof typeof DATA_EXECUTION_EVIDENCE
      ];
    return Boolean(
      expectedVariant &&
      expectedEvidence &&
      fields.variant === expectedVariant &&
      fields.executionReceipt === expectedEvidence.receipt &&
      fields.decision === expectedEvidence.decision &&
      fieldsAreTrue(fields, [
        "planValid",
        "failureInjected",
        "executionVerified",
        "testsPassed",
        "failureObserved",
        "noteReady",
        ...expectedEvidence.flags,
      ]),
    );
  }

  const expected = CASE_EVIDENCE[courseSlug as keyof typeof CASE_EVIDENCE];
  return Boolean(
    expected &&
    hasSameStringMembers(fields.responses, expected.responses) &&
    hasSameStringMembers(fields.sources, expected.sources) &&
    hasSameStringMembers(fields.review, expected.review),
  );
}
