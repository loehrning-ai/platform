"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  DEFAULT_PRACTICE_MODEL_ID,
  PRACTICE_MODEL_IDS,
  type PracticeModelId,
} from "@/app/api/ai-native/practice/types";
import type {
  CourseProjectArtifactState,
  CourseProjectEngineProps,
} from "@/lib/course-projects/types";
import {
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
  hasCourseProjectLearningEvidence,
  isCourseProjectLocalLearningFailureClass,
} from "@/lib/course-projects/types";

import {
  EngineFrame,
  EvidenceItem,
  LAB_BUTTON,
  LAB_BUTTON_SECONDARY,
  LAB_INPUT,
  VerifyPanel,
} from "./engine-ui";

type RunState = "idle" | "loading" | "success" | "error";
type PromptVariant = "workflow" | "grounding" | "operator";
type ComparisonDecision = "" | "a-stronger" | "b-stronger" | "equivalent";
type ClaimEvidenceSource =
  "" | "source-a" | "source-b" | "source-c" | "conflict" | "gap";
type RedlineDecision = "" | "retain" | "qualify" | "remove";
type ClaimReview = Readonly<{
  source: ClaimEvidenceSource;
  decision: RedlineDecision;
}>;
type RubricDimension = "factuality" | "completeness" | "calibration" | "format";
type RubricScores = Readonly<Record<RubricDimension, number>>;
type RubricComparison = Readonly<{
  responseA: RubricScores;
  responseB: RubricScores;
}>;
type ProviderFailureKind =
  | "policy-disabled"
  | "policy-not-ready"
  | "auth"
  | "validation"
  | "quota"
  | "provider"
  | "network"
  | "malformed-response";

type ProviderFailure = {
  kind: ProviderFailureKind;
  message: string;
  supportsDegradedCompletion: boolean;
};

type PracticeCompletePayload = {
  mode?: unknown;
  text?: unknown;
  error?: unknown;
  code?: unknown;
  model?: unknown;
  provider?: unknown;
};

type ValidatedPracticeCompletion = {
  text: string;
  model: PracticeModelId;
  provider: "anthropic" | "google";
};

type ActiveProviderRequest = {
  epoch: number;
  fingerprint: string;
  controller: AbortController;
};

const AUTH_FAILURE_ERRORS = new Set([
  "auth_unavailable",
  "auth_not_configured",
  "unauthorized",
]);
const QUOTA_FAILURE_ERRORS = new Set([
  "Das Nutzungsbudget ist nicht konfiguriert.",
  "Das Nutzungsbudget ist vorübergehend nicht verfügbar.",
  "Das Tagesbudget für Modell-Tokens ist erreicht.",
  "The usage budget is not configured.",
  "The usage budget is temporarily unavailable.",
  "The daily model-token budget is exhausted.",
  "Das Provider-Budget ist ausgeschöpft.",
  "The provider budget is exhausted.",
]);
const PROVIDER_BY_MODEL: Readonly<
  Record<PracticeModelId, ValidatedPracticeCompletion["provider"]>
> = {
  "anthropic/claude-haiku-4.5": "anthropic",
  "google/gemini-2.5-flash-lite": "google",
};

const COMPARISON_DECISIONS = new Set<ComparisonDecision>([
  "a-stronger",
  "b-stronger",
  "equivalent",
]);
const CLAIM_SOURCE_CODES: Readonly<
  Record<Exclude<ClaimEvidenceSource, "">, number>
> = {
  "source-a": 1,
  "source-b": 2,
  "source-c": 3,
  conflict: 4,
  gap: 5,
};
const CLAIM_SOURCES_BY_CODE: Readonly<Record<string, ClaimEvidenceSource>> = {
  "1": "source-a",
  "2": "source-b",
  "3": "source-c",
  "4": "conflict",
  "5": "gap",
};
const REDLINE_CODES: Readonly<Record<Exclude<RedlineDecision, "">, number>> = {
  retain: 1,
  qualify: 2,
  remove: 3,
};
const REDLINES_BY_CODE: Readonly<Record<string, RedlineDecision>> = {
  "1": "retain",
  "2": "qualify",
  "3": "remove",
};
const RUBRIC_DIMENSIONS: readonly RubricDimension[] = [
  "factuality",
  "completeness",
  "calibration",
  "format",
];
const EMPTY_CLAIM_REVIEW: ClaimReview = { source: "", decision: "" };
const EMPTY_RUBRIC: RubricScores = {
  factuality: 0,
  completeness: 0,
  calibration: 0,
  format: 0,
};
const EMPTY_RUBRIC_COMPARISON: RubricComparison = {
  responseA: EMPTY_RUBRIC,
  responseB: EMPTY_RUBRIC,
};
const EXPECTED_CLAIM_REVIEWS: readonly ClaimReview[] = [
  { source: "conflict", decision: "qualify" },
  { source: "source-c", decision: "retain" },
  { source: "gap", decision: "remove" },
];

const GROUNDING_SOURCE_PACKET: Readonly<Record<"de" | "en", string>> = {
  de: [
    "Quelle A · Kuratorennotiz (Entwurf): Eröffnung für den 12. Oktober geplant; nicht freigegeben.",
    "Quelle B · Raumreservierung: Galerie für den 19. Oktober reserviert; Eröffnungstermin ungeklärt.",
    "Quelle C · Konservierungsprotokoll: Objekt 1986 in die Sammlung aufgenommen; Herkunft nicht dokumentiert.",
  ].join("\n"),
  en: [
    "Source A · Curator note (draft): opening planned for 12 October; not approved.",
    "Source B · Venue booking: gallery reserved for 19 October; opening date unresolved.",
    "Source C · Conservation log: object entered the collection in 1986; origin not documented.",
  ].join("\n"),
};

function parseComparisonDecision(value: unknown): ComparisonDecision {
  return typeof value === "string" &&
    COMPARISON_DECISIONS.has(value as ComparisonDecision)
    ? (value as ComparisonDecision)
    : "";
}

function parseClaimReview(value: unknown): readonly ClaimReview[] {
  if (!Number.isSafeInteger(value)) {
    return [EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW];
  }
  const encoded = String(value);
  if (!/^[1-5][1-3][1-5][1-3][1-5][1-3]$/.test(encoded)) {
    return [EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW];
  }

  const parsed = [0, 2, 4].map((offset): ClaimReview => {
    const source = CLAIM_SOURCES_BY_CODE[encoded[offset] ?? ""] ?? "";
    const decision = REDLINES_BY_CODE[encoded[offset + 1] ?? ""] ?? "";
    return {
      source,
      decision,
    };
  });

  return parsed.every((entry) => entry.source && entry.decision)
    ? parsed
    : [EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW, EMPTY_CLAIM_REVIEW];
}

function encodeClaimReviews(reviews: readonly ClaimReview[]): number {
  if (
    reviews.length !== 3 ||
    reviews.some(({ source, decision }) => !source || !decision)
  ) {
    return 0;
  }
  return Number(
    reviews
      .map(
        ({ source, decision }) =>
          `${CLAIM_SOURCE_CODES[source as Exclude<ClaimEvidenceSource, "">]}${REDLINE_CODES[decision as Exclude<RedlineDecision, "">]}`,
      )
      .join(""),
  );
}

function parseRubricScores(value: unknown): RubricComparison {
  if (!Number.isSafeInteger(value)) return EMPTY_RUBRIC_COMPARISON;
  const digits = String(value);
  if (!/^[1-4]{8}$/.test(digits)) return EMPTY_RUBRIC_COMPARISON;
  return {
    responseA: {
      factuality: Number(digits[0]),
      completeness: Number(digits[1]),
      calibration: Number(digits[2]),
      format: Number(digits[3]),
    },
    responseB: {
      factuality: Number(digits[4]),
      completeness: Number(digits[5]),
      calibration: Number(digits[6]),
      format: Number(digits[7]),
    },
  };
}

function encodeRubricScores(scores: RubricComparison): number {
  return Number(
    (["responseA", "responseB"] as const)
      .flatMap((response) =>
        RUBRIC_DIMENSIONS.map((dimension) => scores[response][dimension]),
      )
      .join(""),
  );
}

function rubricComparisonIsComplete(scores: RubricComparison): boolean {
  return (["responseA", "responseB"] as const).every((response) =>
    RUBRIC_DIMENSIONS.every((dimension) => {
      const score = scores[response][dimension];
      return Number.isSafeInteger(score) && score >= 1 && score <= 4;
    }),
  );
}

function comparisonMatchesRubric(
  decision: ComparisonDecision,
  scores: RubricComparison,
): boolean {
  if (!decision || !rubricComparisonIsComplete(scores)) return false;
  const total = (response: keyof RubricComparison) =>
    RUBRIC_DIMENSIONS.reduce(
      (sum, dimension) => sum + scores[response][dimension],
      0,
    );
  const responseATotal = total("responseA");
  const responseBTotal = total("responseB");
  return decision === "equivalent"
    ? responseATotal === responseBTotal
    : decision === "a-stronger"
      ? responseATotal > responseBTotal
      : responseBTotal > responseATotal;
}

function claimReviewsAreCorrect(reviews: readonly ClaimReview[]): boolean {
  return EXPECTED_CLAIM_REVIEWS.every(
    (expected, index) =>
      reviews[index]?.source === expected.source &&
      reviews[index]?.decision === expected.decision,
  );
}

const GOAL_PATTERN =
  /\b(ziel|aufgabe|erstelle|entwirf|analysiere|prüfe|vergleiche|goal|task|create|draft|design|analy[sz]e|evaluate|compare)\b/i;
const CONSTRAINT_PATTERN =
  /\b(muss|darf|keine|nicht mehr als|maximal|mindestens|format|constraint|must|should|do not|never|at most|no more than|output)\b/i;

function expectedProviderForModel(
  model: PracticeModelId,
): ValidatedPracticeCompletion["provider"] {
  return PROVIDER_BY_MODEL[model];
}

function validatePracticeCompletion(
  payload: PracticeCompletePayload | null,
  selectedModel: PracticeModelId,
): ValidatedPracticeCompletion | null {
  const expectedProvider = expectedProviderForModel(selectedModel);
  if (
    payload?.mode !== "complete" ||
    typeof payload.text !== "string" ||
    payload.text.trim().length === 0 ||
    payload.model !== selectedModel ||
    payload.provider !== expectedProvider
  ) {
    return null;
  }

  return {
    text: payload.text,
    model: selectedModel,
    provider: expectedProvider,
  };
}

function classifyProviderFailure(
  locale: "de" | "en",
  options: {
    status: number | null;
    serverError?: unknown;
    serverCode?: unknown;
    malformedResponse?: boolean;
  },
): ProviderFailure {
  const {
    status,
    serverError,
    serverCode,
    malformedResponse = false,
  } = options;
  const serverErrorText =
    typeof serverError === "string" ? serverError.trim() : "";
  const serverErrorCode =
    typeof serverCode === "string" ? serverCode.trim() : "";
  const messages =
    locale === "de"
      ? {
          policyDisabled:
            "Der Live-Provider ist durch eine explizite Kursrichtlinie deaktiviert.",
          policyNotReady:
            "Das gewählte Modell ist durch eine explizite Kursrichtlinie noch nicht freigegeben.",
          auth: "Authentifizierung oder Zugriff ist fehlgeschlagen. Der Provider wurde nicht ausgeführt.",
          validation:
            "Die Anfrage wurde abgelehnt. Es wurde keine Provider-Evidenz erzeugt.",
          quota:
            "Ein Nutzungs- oder Providerbudget ist erreicht. Es wurde keine Provider-Evidenz erzeugt.",
          provider:
            "Der Upstream-Providerlauf ist fehlgeschlagen. Es wurde keine Provider-Evidenz erzeugt.",
          network:
            "Die Practice-API ist nicht erreichbar. Es wurde keine Provider-Evidenz erzeugt.",
          malformed:
            "Die Provider-Antwort war fehlerhaft. Es wurde keine Provider-Evidenz übernommen.",
        }
      : {
          policyDisabled:
            "The live provider is disabled by an explicit course policy.",
          policyNotReady:
            "The selected model is not enabled yet by an explicit course policy.",
          auth: "Authentication or access failed. The provider was not run.",
          validation:
            "The request was rejected. No provider evidence was produced.",
          quota:
            "A usage or provider budget was exhausted. No provider evidence was produced.",
          provider:
            "The upstream provider run failed. No provider evidence was produced.",
          network:
            "The practice API is unreachable. No provider evidence was produced.",
          malformed:
            "The provider response was malformed. No provider evidence was accepted.",
        };

  if (malformedResponse) {
    return {
      kind: "malformed-response",
      message: messages.malformed,
      supportsDegradedCompletion: false,
    };
  }
  if (status === null) {
    return {
      kind: "network",
      message: messages.network,
      supportsDegradedCompletion: false,
    };
  }
  if (status === 503 && serverErrorCode === "practice_disabled") {
    return {
      kind: "policy-disabled",
      message: messages.policyDisabled,
      supportsDegradedCompletion: true,
    };
  }
  if (status === 503 && serverErrorCode === "model_not_allowed") {
    return {
      kind: "policy-not-ready",
      message: messages.policyNotReady,
      supportsDegradedCompletion: true,
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    AUTH_FAILURE_ERRORS.has(serverErrorText)
  ) {
    return {
      kind: "auth",
      message: messages.auth,
      supportsDegradedCompletion: false,
    };
  }
  if (status === 400 || status === 413 || status === 415 || status === 422) {
    return {
      kind: "validation",
      message: messages.validation,
      supportsDegradedCompletion: false,
    };
  }
  if (
    status === 402 ||
    status === 429 ||
    QUOTA_FAILURE_ERRORS.has(serverErrorText)
  ) {
    return {
      kind: "quota",
      message: messages.quota,
      supportsDegradedCompletion: false,
    };
  }
  if (status === 502) {
    return {
      kind: "malformed-response",
      message: messages.malformed,
      supportsDegradedCompletion: false,
    };
  }
  return {
    kind: "provider",
    message: messages.provider,
    supportsDegradedCompletion: false,
  };
}

function restoredProviderFailure(
  locale: "de" | "en",
  kind: ProviderFailureKind,
): ProviderFailure {
  if (kind === "policy-disabled" || kind === "policy-not-ready") {
    return classifyProviderFailure(locale, {
      status: 503,
      serverCode:
        kind === "policy-not-ready" ? "model_not_allowed" : "practice_disabled",
    });
  }
  if (kind === "auth") {
    return classifyProviderFailure(locale, { status: 401 });
  }
  if (kind === "quota") {
    return classifyProviderFailure(locale, { status: 429 });
  }
  if (kind === "network") {
    return classifyProviderFailure(locale, { status: null });
  }
  return classifyProviderFailure(locale, {
    status:
      kind === "validation" ? 400 : kind === "malformed-response" ? 502 : 500,
  });
}

export default function PromptLab({
  config,
  locale,
  initialArtifact,
  verificationEnabled = true,
  onMeaningfulInteraction,
  onExecutionReceipt,
  onArtifactChange,
  onVerified,
}: CourseProjectEngineProps) {
  const contextId = useId();
  const promptId = useId();
  const secondaryPromptId = useId();
  const modelId = useId();
  const privacyId = useId();
  const requestEpoch = useRef(0);
  const activeRequest = useRef<ActiveProviderRequest | null>(null);
  const variant: PromptVariant =
    config.courseSlug === "claude"
      ? "grounding"
      : config.courseSlug === "ai-native-operator"
        ? "operator"
        : "workflow";
  const executionReceipt = getCourseProjectExecutionReceipt(config.courseSlug);
  const localLearningReceipt = getCourseProjectLocalLearningReceipt(
    config.courseSlug as "ai-native" | "claude" | "ai-native-operator",
  );
  const initialFields =
    initialArtifact?.engineKind === "prompt" ? initialArtifact.fields : {};
  const initialProviderEvidence =
    initialFields.providerEvidence === "success" ? "success" : "none";
  const initialLocalFailureKind = isCourseProjectLocalLearningFailureClass(
    initialFields.providerFailureClass,
  )
    ? (initialFields.providerFailureClass as ProviderFailureKind)
    : null;
  const initialLocalLearning = hasCourseProjectLearningEvidence(
    initialArtifact,
    config.courseSlug,
    localLearningReceipt,
  );
  const initialDegradedFailureKind =
    initialFields.completionMode === "degraded-policy" &&
    (initialFields.providerFailureClass === "policy-disabled" ||
      initialFields.providerFailureClass === "policy-not-ready")
      ? initialFields.providerFailureClass
      : null;
  const initialDegradedCompletion = initialDegradedFailureKind !== null;
  const [context, setContext] = useState("");
  const [prompt, setPrompt] = useState("");
  const [secondaryPrompt, setSecondaryPrompt] = useState("");
  const [restoredSecondaryReady, setRestoredSecondaryReady] = useState(
    initialFields.secondaryReady === true ||
      initialFields.twoOutputEvidence === true,
  );
  const [restoredStructure, setRestoredStructure] = useState(
    initialFields.goalReady === true &&
      initialFields.contextReady === true &&
      initialFields.constraintsReady === true,
  );
  const [privacyConfirmed, setPrivacyConfirmed] = useState(
    initialFields.privacyConfirmed === true,
  );
  const [runState, setRunState] = useState<RunState>(
    initialProviderEvidence === "success"
      ? "success"
      : initialDegradedCompletion || initialLocalLearning
        ? "error"
        : "idle",
  );
  const [providerOutput, setProviderOutput] = useState("");
  const [secondaryProviderOutput, setSecondaryProviderOutput] = useState("");
  const [providerFailure, setProviderFailure] =
    useState<ProviderFailure | null>(
      initialDegradedFailureKind
        ? restoredProviderFailure(locale, initialDegradedFailureKind)
        : initialLocalFailureKind
          ? restoredProviderFailure(locale, initialLocalFailureKind)
          : null,
    );
  const [degradedCompletionAcknowledged, setDegradedCompletionAcknowledged] =
    useState(initialDegradedCompletion);
  const [localLearningCompleted, setLocalLearningCompleted] =
    useState(initialLocalLearning);
  const restoredModel = initialFields.providerModel;
  const [selectedModel, setSelectedModel] = useState<PracticeModelId>(
    typeof restoredModel === "string" &&
      (PRACTICE_MODEL_IDS as readonly string[]).includes(restoredModel)
      ? (restoredModel as PracticeModelId)
      : DEFAULT_PRACTICE_MODEL_ID,
  );
  const [providerIdentity, setProviderIdentity] = useState("");
  const [approvalGate, setApprovalGate] = useState(
    initialFields.approvalGate === true,
  );
  const [stopCondition, setStopCondition] = useState(
    initialFields.stopCondition === true,
  );
  const [handoffDefined, setHandoffDefined] = useState(
    initialFields.handoffDefined === true,
  );
  const [budget, setBudget] = useState(
    typeof initialFields.budget === "number" ? initialFields.budget : 4,
  );
  const [evaluation, setEvaluation] = useState(
    typeof initialFields.evaluation === "string"
      ? initialFields.evaluation
      : "",
  );
  const [comparisonDecision, setComparisonDecision] =
    useState<ComparisonDecision>(() =>
      parseComparisonDecision(initialFields.comparisonDecision),
    );
  const [claimReviews, setClaimReviews] = useState<readonly ClaimReview[]>(() =>
    parseClaimReview(initialFields.claimReviewCode),
  );
  const [rubricScores, setRubricScores] = useState<RubricComparison>(() =>
    parseRubricScores(initialFields.rubricScores),
  );
  const [verified, setVerified] = useState(false);

  const providerInputFingerprint = JSON.stringify({
    context,
    prompt,
    secondaryPrompt: variant === "grounding" ? secondaryPrompt : null,
    selectedModel,
    locale,
    variant,
  });
  const providerInputFingerprintRef = useRef(providerInputFingerprint);
  providerInputFingerprintRef.current = providerInputFingerprint;

  const copy =
    locale === "de"
      ? {
          engine: "Prompt-Labor",
          context: "Arbeitskontext",
          contextHelp:
            "Fakten, Zielgruppe und Ausgangslage. Keine vertraulichen oder personenbezogenen Daten.",
          contextPlaceholder:
            "Beispiel: Ein internes Operations-Team braucht eine prüfbare Entscheidungsnotiz auf Basis synthetischer Vorfalldaten.",
          prompt: "Prompt-Auftrag",
          promptHelp: "Formuliere Ziel, Ausgabeformat und harte Grenzen.",
          promptPlaceholder:
            "Analysiere die Lage. Gib drei priorisierte Maßnahmen als Tabelle aus. Nutze nur den Kontext und markiere Annahmen.",
          localTitle: "Lokale Strukturanalyse · kein Modellaufruf",
          goal: "Explizites Ziel im Prompt",
          contextCheck: "Ausreichender Arbeitskontext",
          constraints: "Format oder Grenzen im Prompt",
          privacyWarning:
            "Keine Namen, Kontaktdaten, Zugangsdaten, Gesundheitsdaten oder unveröffentlichten Unternehmensdaten eingeben.",
          privacyConfirm:
            "Ich bestätige: Die Eingaben sind synthetisch oder zur Veröffentlichung freigegeben.",
          run: "Provider ausführen",
          running: "Provider läuft …",
          model: "Angefragtes Modell",
          modelHelp:
            "Die Auswahl sendet nur eine öffentliche Modell-ID. Die Bereitstellung kann sie ablehnen; API-Schlüssel bleiben ausschließlich auf dem Server.",
          providerTitle: "Provider-Ausgabe · nur echte API-Antwort",
          providerIdle:
            "Noch kein Providerlauf. Die lokale Analyse oben erzeugt keine Modellantwort.",
          failureClass: "Fehlerklasse",
          failureClassLabels: {
            "policy-disabled": "Kursrichtlinie · deaktiviert",
            "policy-not-ready": "Kursrichtlinie · Modell nicht freigegeben",
            auth: "Authentifizierung/Zugriff",
            validation: "Validierung",
            quota: "Nutzungslimit/Budget",
            provider: "Upstream-Provider",
            network: "Netzwerk",
            "malformed-response": "Fehlerhafte Antwort",
          },
          degradedNotice:
            "Herabgestufter Lernpfad: Nur lokale Prompt-Struktur und korrektes Stop-Verhalten werden geprüft. Es liegt keine Provider-Evidenz vor.",
          acknowledgeDegraded: "Herabgestuften Modus bestätigen",
          degradedAcknowledged:
            "Herabgestufter Modus bestätigt · keine Provider-Evidenz",
          localLearningTitle:
            "Lokaler synthetischer Lernlauf · kein Modellaufruf",
          localLearningNotice:
            "Prüft nur die sichtbaren, synthetischen Prompt-Struktur- und Kontrollsignale. Erzeugt keine Antwort und keine Provider-, Projekt- oder Zertifikatsevidenz.",
          runLocalLearning: "Lokalen Lernlauf ausführen",
          localLearningComplete:
            "Lokaler Lernlauf abgeschlossen · nur RUN-Lernsignal",
          operationalFailure:
            "Dieser Betriebsfehler ist keine Evidenz und kann weder Provider-Evidenz noch eine normale Verifizierung erfüllen.",
          partialPrimary:
            "Die primäre Claude-Antwort bleibt sichtbar. Der Quellenvergleich ist fehlgeschlagen; dieser Teilerfolg ist keine vollständige Provider-Evidenz.",
          evidenceStructure: "Ziel, Kontext und Grenzen sind erkennbar",
          evidenceRunSuccess: "Echter Providerlauf erfolgreich",
          evidenceRunDegraded:
            "Richtlinien-Stopp protokolliert · keine Projekt- oder Zertifikatsverifizierung",
          evidenceRunPending:
            "Echte Provider-Evidenz oder Richtlinien-Stopp fehlt",
          ready: "Die Prompt-Evidenz ist vollständig.",
          pending:
            "Struktur vervollständigen und einen echten Providerlauf versuchen.",
          success: "Die Practice-API hat eine Provider-Antwort geliefert.",
          priorSuccess:
            "Ein früherer erfolgreicher API-Lauf ist im Artefakt vermerkt. Die Provider-Ausgabe wird nicht im Lernfortschritt gespeichert.",
          degradedNotVerified:
            "Dieser Richtlinien-Stopp ist ein eigener, nicht gleichwertiger Lernpfad. Er verifiziert weder das Provider-Artefakt noch das Kurszertifikat.",
          stageLocked:
            "Die Projektverifizierung bleibt gesperrt, bis alle fünf Arbeitsphasen abgeschlossen sind.",
          stageEvidence: "Alle fünf Arbeitsphasen sind abgeschlossen",
          verifySummarySuccess:
            "Prompt-Labor verifiziert: Ziel, Kontext und Grenzen geprüft; Providerlauf erfolgreich.",
        }
      : {
          engine: "Prompt lab",
          context: "Working context",
          contextHelp:
            "Facts, audience, and starting point. Do not include confidential or personal data.",
          contextPlaceholder:
            "Example: An internal operations team needs an auditable decision memo based on synthetic incident data.",
          prompt: "Prompt instruction",
          promptHelp: "State the goal, output format, and hard constraints.",
          promptPlaceholder:
            "Analyze the situation. Return three prioritized actions in a table. Use only the context and flag assumptions.",
          localTitle: "Local structure analysis · no model call",
          goal: "Explicit goal in the prompt",
          contextCheck: "Sufficient working context",
          constraints: "Format or constraints in the prompt",
          privacyWarning:
            "Do not enter names, contact details, credentials, health data, or unpublished company data.",
          privacyConfirm:
            "I confirm that the inputs are synthetic or approved for disclosure.",
          run: "Run provider",
          running: "Provider running …",
          model: "Requested model",
          modelHelp:
            "This sends a public model ID only. The deployment may deny it; API keys remain server-side.",
          providerTitle: "Provider output · API response only",
          providerIdle:
            "No provider run yet. The local analysis above does not generate a model answer.",
          failureClass: "Failure class",
          failureClassLabels: {
            "policy-disabled": "Course policy · disabled",
            "policy-not-ready": "Course policy · model not enabled",
            auth: "Authentication/access",
            validation: "Validation",
            quota: "Usage limit/budget",
            provider: "Upstream provider",
            network: "Network",
            "malformed-response": "Malformed response",
          },
          degradedNotice:
            "Degraded learning path: only local prompt structure and correct stop behavior are assessed. No provider evidence exists.",
          acknowledgeDegraded: "Acknowledge degraded mode",
          degradedAcknowledged:
            "Degraded mode acknowledged · no provider evidence",
          localLearningTitle: "Local synthetic learning run · no model call",
          localLearningNotice:
            "Checks only the visible synthetic prompt-structure and control signals. It generates no answer and no provider, project, or certificate evidence.",
          runLocalLearning: "Run local learning check",
          localLearningComplete:
            "Local learning run complete · RUN learning signal only",
          operationalFailure:
            "This operational failure is not evidence and cannot satisfy provider evidence or normal verification.",
          partialPrimary:
            "The primary Claude response remains visible. The grounded comparison failed; this partial success is not complete provider evidence.",
          evidenceStructure: "Goal, context, and constraints are identifiable",
          evidenceRunSuccess: "Real provider run succeeded",
          evidenceRunDegraded:
            "Policy stop recorded · no project or certificate verification",
          evidenceRunPending:
            "Real provider evidence or a policy stop is missing",
          ready: "The prompt evidence is complete.",
          pending: "Complete the structure and attempt a real provider run.",
          success: "The practice API returned a provider response.",
          priorSuccess:
            "A prior successful API run is recorded in the artifact. Provider output is not stored in learning progress.",
          degradedNotVerified:
            "This policy stop is a separate, non-equivalent learning path. It verifies neither the provider artifact nor the course certificate.",
          stageLocked:
            "Project verification remains locked until all five work stages are complete.",
          stageEvidence: "All five work stages are complete",
          verifySummarySuccess:
            "Prompt lab verified: goal, context, and constraints checked; provider run succeeded.",
        };

  const missionCopy =
    locale === "de"
      ? {
          primaryPrompt:
            variant === "grounding"
              ? "Prompt A · Baseline"
              : variant === "operator"
                ? "Delegationsauftrag"
                : "Workflow-Auftrag",
          secondaryPrompt: "Prompt B · quellengebunden",
          secondaryHelp:
            "Gleicher Auftrag, aber mit Quellenbindung, sichtbarer Unsicherheit und Verweigerungsregel.",
          secondaryPlaceholder:
            "Erstelle dieselbe Ausstellungsskizze. Nutze nur Quelle A-C, ordne jeden Claim einer Quelle zu und verweigere unbelegte Aussagen sichtbar.",
          workflowControls:
            variant === "operator"
              ? "Agenten-Kontrollfläche"
              : "Workflow-Kontrollpunkte",
          approval:
            "Menschliche Freigabe vor externer oder schreibender Aktion",
          stop: "Testbares Abbruchkriterium bei fehlender Evidenz oder Qualitätsgrenze",
          handoff:
            variant === "operator"
              ? "Kritiker-Intervention und verantwortliche Übergabe definiert"
              : "Eigentümer, Fallback, Messgröße und Wiederanlauf definiert",
          budget: "Maximales Agentenbudget",
          graph: "Scout → Analyst → Kritiker → Redakteur",
          graphHelp:
            "Jede Rolle erhält nur synthetische Tickets; der Redakteur darf nicht autonom versenden.",
          review: "Run-Evidenz auswerten",
          reviewHelp:
            "Die Auswahl bewertet einen erfolgreichen Providerlauf. Ein expliziter Richtlinien-Stopp öffnet nur einen nicht gleichwertigen, herabgestuften Lernpfad.",
          evaluateWorkflow:
            "Output gegen Freigabe, Abbruchregel, Eigentum und Fallback prüfen",
          evaluateOperator:
            "Fehlerhaften Pfad am Qualitätsgate stoppen und Reviewaufwand/Kosten getrennt erfassen",
          stopUnavailable:
            "Keine Ausgabe erfinden; expliziten Richtlinien-Stopp protokollieren",
          unsafeReview: "Ausgabe ohne Rubrik oder Gate übernehmen",
          missionEvidence:
            variant === "operator"
              ? "Agentengraph, Budget, Freigaben und Intervention belegt"
              : "Freigabe, Abbruch, Übergabe und Output-Rubrik belegt",
          outputA: "Antwort A · echte API-Antwort",
          outputB: "Antwort B · echte API-Antwort",
        }
      : {
          primaryPrompt:
            variant === "grounding"
              ? "Prompt A · baseline"
              : variant === "operator"
                ? "Delegation instruction"
                : "Workflow instruction",
          secondaryPrompt: "Prompt B · grounded",
          secondaryHelp:
            "Same task, now with source grounding, visible uncertainty, and refusal behavior.",
          secondaryPlaceholder:
            "Create the same exhibition outline. Use only sources A-C, map every claim to a source, and visibly refuse unsupported claims.",
          workflowControls:
            variant === "operator"
              ? "Agent control plane"
              : "Workflow control points",
          approval: "Human approval before any external or write action",
          stop: "Testable stop condition for missing evidence or a quality boundary",
          handoff:
            variant === "operator"
              ? "Critic intervention and accountable handoff defined"
              : "Owner, fallback, measure, and restart procedure defined",
          budget: "Maximum agent budget",
          graph: "Scout → Analyst → Critic → Editor",
          graphHelp:
            "Each role receives only synthetic tickets; the editor cannot send autonomously.",
          review: "Assess run evidence",
          reviewHelp:
            "The selection evaluates a successful provider run. An explicit policy stop opens only a separate, non-equivalent degraded learning path.",
          evaluateWorkflow:
            "Check output against approval, stop rule, ownership, and fallback",
          evaluateOperator:
            "Stop the faulty path at the quality gate and separate review effort from cost",
          stopUnavailable: "Invent no output; record the explicit policy stop",
          unsafeReview: "Accept output without a rubric or gate",
          missionEvidence:
            variant === "operator"
              ? "Agent graph, budget, approvals, and intervention evidenced"
              : "Approval, stop, handoff, and output rubric evidenced",
          outputA: "Response A · real API response",
          outputB: "Response B · real API response",
        };

  const groundingCopy =
    locale === "de"
      ? {
          packetTitle: "Synthetisches Quellenpaket · an beide Läufe gesendet",
          packetHelp:
            "Beide Providerläufe erhalten exakt dieses Paket. Der Arbeitskontext ergänzt nur Zielgruppe und Ausgabezweck.",
          deskTitle: "Antwortvergleich und Redlining",
          deskHelp:
            "Bewerte die zwei sichtbaren API-Antworten. Die Auswahl wird als begrenzte Evidenz gespeichert; Antworten und Freitext werden nicht gespeichert.",
          comparison: "Vergleichsurteil",
          comparisonOptions: [
            ["", "Urteil wählen"],
            ["a-stronger", "Antwort A ist bei Quellenbindung stärker"],
            ["b-stronger", "Antwort B ist bei Quellenbindung stärker"],
            ["equivalent", "Kein wesentlicher Unterschied erkennbar"],
          ],
          claimsTitle: "Claim-Evidenz-Matrix",
          claimsHelp:
            "Ordne jeden festen Claim der tragenden Quelle, einem Konflikt oder einer Beleglücke zu. Entscheide dann die Redline.",
          claims: [
            "Claim 1 · Die Ausstellung eröffnet am 12. Oktober.",
            "Claim 2 · Das Objekt kam 1986 in die Sammlung.",
            "Claim 3 · Die Ausstellung senkt den Energieverbrauch um 40 %.",
          ],
          source: "Evidenzstatus",
          sourceOptions: [
            ["", "Evidenz wählen"],
            ["source-a", "Quelle A"],
            ["source-b", "Quelle B"],
            ["source-c", "Quelle C"],
            ["conflict", "Quellenkonflikt"],
            ["gap", "Beleglücke"],
          ],
          decision: "Redline",
          decisionOptions: [
            ["", "Entscheidung wählen"],
            ["retain", "Beibehalten"],
            ["qualify", "Einschränken/Unsicherheit zeigen"],
            ["remove", "Entfernen"],
          ],
          claimCorrect: "Zuordnung und Redline entsprechen dem Quellenpaket.",
          claimIncorrect:
            "Quellenstatus oder Redline widerspricht dem Quellenpaket.",
          rubricTitle: "Vierdimensionale Vergleichsrubrik · Antwort A und B",
          rubricHelp:
            "Bewerte jede Dimension separat: 1 = fehlt oder unbelegt, 2 = wesentliche Lücken, 3 = weitgehend erfüllt, 4 = vollständig erfüllt.",
          rubricDimensions: {
            factuality: "Faktentreue",
            completeness: "Vollständigkeit",
            calibration: "Kalibrierung/Unsicherheit",
            format: "Formatkonformität",
          },
          responseA: "Antwort A",
          responseB: "Antwort B",
          score: "Punktwert",
          scoreOptions: [
            [0, "Punktwert wählen"],
            [1, "1 · fehlt oder unbelegt"],
            [2, "2 · wesentliche Lücken"],
            [3, "3 · weitgehend erfüllt"],
            [4, "4 · vollständig erfüllt"],
          ],
          twoOutputs:
            "Zwei echte Providerantworten liegen für denselben Fall vor",
          comparisonComplete: "Ein sichtbarer Antwortvergleich ist entschieden",
          claimsComplete:
            "Alle drei Claims sind korrekt zugeordnet und redigiert",
          rubricComplete:
            "Beide Antworten sind in allen vier Rubrikdimensionen separat bewertet",
          comparisonMismatch:
            "Das Vergleichsurteil muss mit den Summen der beiden Rubriken übereinstimmen.",
        }
      : {
          packetTitle: "Synthetic source packet · sent to both runs",
          packetHelp:
            "Both provider runs receive this exact packet. Working context adds only the audience and output purpose.",
          deskTitle: "Response comparison and redlining",
          deskHelp:
            "Assess the two visible API responses. Only bounded evidence choices are stored; responses and free text are not stored.",
          comparison: "Comparison verdict",
          comparisonOptions: [
            ["", "Select a verdict"],
            ["a-stronger", "Response A has stronger source discipline"],
            ["b-stronger", "Response B has stronger source discipline"],
            ["equivalent", "No material difference is visible"],
          ],
          claimsTitle: "Claim-evidence matrix",
          claimsHelp:
            "Map each fixed claim to its supporting source, a conflict, or an evidence gap. Then make the redline decision.",
          claims: [
            "Claim 1 · The exhibition opens on 12 October.",
            "Claim 2 · The object entered the collection in 1986.",
            "Claim 3 · The exhibition cuts energy use by 40%.",
          ],
          source: "Evidence status",
          sourceOptions: [
            ["", "Select evidence"],
            ["source-a", "Source A"],
            ["source-b", "Source B"],
            ["source-c", "Source C"],
            ["conflict", "Source conflict"],
            ["gap", "Evidence gap"],
          ],
          decision: "Redline",
          decisionOptions: [
            ["", "Select a decision"],
            ["retain", "Retain"],
            ["qualify", "Qualify/show uncertainty"],
            ["remove", "Remove"],
          ],
          claimCorrect: "Mapping and redline match the source packet.",
          claimIncorrect:
            "Evidence status or redline conflicts with the source packet.",
          rubricTitle: "Four-dimension comparison rubric · Responses A and B",
          rubricHelp:
            "Score each dimension independently: 1 = absent or unsupported, 2 = material gaps, 3 = mostly met, 4 = fully met.",
          rubricDimensions: {
            factuality: "Factuality",
            completeness: "Completeness",
            calibration: "Calibration/uncertainty",
            format: "Format compliance",
          },
          responseA: "Response A",
          responseB: "Response B",
          score: "Score",
          scoreOptions: [
            [0, "Select a score"],
            [1, "1 · absent or unsupported"],
            [2, "2 · material gaps"],
            [3, "3 · mostly met"],
            [4, "4 · fully met"],
          ],
          twoOutputs: "Two real provider responses exist for the same case",
          comparisonComplete: "A visible response comparison is decided",
          claimsComplete: "All three claims are correctly mapped and redlined",
          rubricComplete:
            "Both responses are scored separately across all four rubric dimensions",
          comparisonMismatch:
            "The comparison verdict must agree with the totals of both rubrics.",
        };

  const diagnostics = useMemo(
    () => ({
      goal: prompt.trim().length >= 20 && GOAL_PATTERN.test(prompt),
      context: context.trim().length >= 24,
      constraints: CONSTRAINT_PATTERN.test(prompt),
    }),
    [context, prompt],
  );
  const secondaryReady =
    variant !== "grounding" ||
    restoredSecondaryReady ||
    (secondaryPrompt.trim().length >= 36 &&
      /source|quelle|evidence|beleg/i.test(secondaryPrompt) &&
      /refus|verweig|uncertain|unsicher/i.test(secondaryPrompt));
  const controlsReady = approvalGate && stopCondition && handoffDefined;
  const providerEvidence = runState === "success";
  const twoOutputEvidence =
    variant !== "grounding" ||
    (providerEvidence &&
      ((providerOutput.trim().length > 0 &&
        secondaryProviderOutput.trim().length > 0) ||
        initialFields.twoOutputEvidence === true));
  const comparisonReady =
    variant !== "grounding" ||
    comparisonMatchesRubric(comparisonDecision, rubricScores);
  const claimReviewReady =
    variant !== "grounding" || claimReviewsAreCorrect(claimReviews);
  const rubricReady =
    variant !== "grounding" || rubricComparisonIsComplete(rubricScores);
  const groundingEvidenceReady =
    twoOutputEvidence && comparisonReady && claimReviewReady && rubricReady;
  const degradedCompletionReady =
    runState === "error" &&
    providerFailure?.supportsDegradedCompletion === true &&
    degradedCompletionAcknowledged;
  const localLearningAvailable =
    runState === "error" &&
    providerFailure !== null &&
    isCourseProjectLocalLearningFailureClass(providerFailure.kind);
  const completionOutcomeReady = providerEvidence || degradedCompletionReady;
  const expectedEvaluation = providerEvidence
    ? variant === "grounding"
      ? "grounding"
      : variant === "operator"
        ? "intervene"
        : "workflow"
    : degradedCompletionReady
      ? "stop"
      : "";
  const evaluationReady =
    evaluation === expectedEvaluation && evaluation !== "";
  const missionReady =
    secondaryReady &&
    controlsReady &&
    (variant === "grounding" ? groundingEvidenceReady : evaluationReady);
  const effectiveDiagnostics = restoredStructure
    ? { goal: true, context: true, constraints: true }
    : diagnostics;
  const structureReady =
    effectiveDiagnostics.goal &&
    effectiveDiagnostics.context &&
    effectiveDiagnostics.constraints;
  const evidenceReady =
    privacyConfirmed && structureReady && providerEvidence && missionReady;
  const ready = evidenceReady && verificationEnabled;
  const requestLength = context.length + prompt.length;
  const canRun =
    privacyConfirmed &&
    context.trim().length > 0 &&
    prompt.trim().length > 0 &&
    secondaryReady &&
    controlsReady &&
    requestLength <= 3_800;
  const canRunLocalLearning =
    localLearningAvailable &&
    privacyConfirmed &&
    structureReady &&
    secondaryReady &&
    controlsReady;
  const artifact = useMemo<CourseProjectArtifactState>(
    () => ({
      version: 1,
      engineKind: "prompt",
      fields: {
        privacyConfirmed,
        goalReady: effectiveDiagnostics.goal,
        contextReady: effectiveDiagnostics.context,
        constraintsReady: effectiveDiagnostics.constraints,
        variant: String(config.courseSlug),
        ...(variant !== "grounding" || localLearningCompleted
          ? { secondaryReady }
          : {}),
        approvalGate,
        stopCondition,
        handoffDefined,
        ...(variant === "operator" ? { budget } : {}),
        ...(variant !== "grounding" ? { evaluation } : {}),
        ...(variant === "grounding" && providerEvidence
          ? {
              twoOutputEvidence,
              comparisonDecision,
              claimReviewCode: encodeClaimReviews(claimReviews),
              rubricScores: rubricReady ? encodeRubricScores(rubricScores) : 0,
            }
          : {}),
        providerEvidence: providerEvidence ? "success" : "none",
        executionReceipt: providerEvidence ? executionReceipt : null,
        ...(localLearningCompleted
          ? { learningReceipt: localLearningReceipt }
          : {}),
        completionMode: providerEvidence
          ? "provider-success"
          : localLearningCompleted
            ? "local-learning"
            : degradedCompletionReady
              ? "degraded-policy"
              : "incomplete",
        ...(degradedCompletionReady || localLearningCompleted
          ? { providerFailureClass: providerFailure?.kind ?? "policy-disabled" }
          : {}),
        providerModel: selectedModel,
      },
    }),
    [
      config.courseSlug,
      approvalGate,
      budget,
      effectiveDiagnostics.constraints,
      effectiveDiagnostics.context,
      effectiveDiagnostics.goal,
      evaluation,
      executionReceipt,
      handoffDefined,
      claimReviews,
      comparisonDecision,
      privacyConfirmed,
      providerEvidence,
      providerFailure?.kind,
      degradedCompletionReady,
      localLearningCompleted,
      localLearningReceipt,
      selectedModel,
      secondaryReady,
      rubricReady,
      rubricScores,
      stopCondition,
      twoOutputEvidence,
      variant,
    ],
  );

  useEffect(() => {
    onArtifactChange(artifact);
  }, [artifact, onArtifactChange]);

  useEffect(
    () => () => {
      requestEpoch.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    },
    [],
  );

  function abortProviderRequest() {
    requestEpoch.current += 1;
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
  }

  function invalidateProviderEvidence() {
    abortProviderRequest();
    setRunState("idle");
    setProviderOutput("");
    setSecondaryProviderOutput("");
    setProviderFailure(null);
    setProviderIdentity("");
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
    setComparisonDecision("");
    setClaimReviews([
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
    ]);
    setRubricScores(EMPTY_RUBRIC_COMPARISON);
    setVerified(false);
  }

  function failProviderRun(failure: ProviderFailure) {
    setProviderFailure(failure);
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
    setComparisonDecision("");
    setClaimReviews([
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
    ]);
    setRubricScores(EMPTY_RUBRIC_COMPARISON);
    setRunState("error");
  }

  async function runProvider() {
    if (!canRun || activeRequest.current !== null) return;

    const controller = new AbortController();
    const epoch = requestEpoch.current + 1;
    const fingerprint = providerInputFingerprint;
    requestEpoch.current = epoch;
    activeRequest.current = { controller, epoch, fingerprint };
    const requestIsCurrent = () =>
      requestEpoch.current === epoch &&
      activeRequest.current?.epoch === epoch &&
      activeRequest.current.fingerprint === fingerprint &&
      providerInputFingerprintRef.current === fingerprint;

    setRunState("loading");
    setProviderOutput("");
    setSecondaryProviderOutput("");
    setProviderFailure(null);
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
    setComparisonDecision("");
    setClaimReviews([
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
      EMPTY_CLAIM_REVIEW,
    ]);
    setRubricScores(EMPTY_RUBRIC_COMPARISON);
    setVerified(false);

    const assemble = (instruction: string) =>
      [
        locale === "de"
          ? "Antworte auf Deutsch."
          : "Respond in English. This explicit output-language requirement must be honored.",
        "<working_context>",
        ...(variant === "grounding"
          ? [
              "<synthetic_source_packet>",
              GROUNDING_SOURCE_PACKET[locale],
              "</synthetic_source_packet>",
            ]
          : []),
        context.trim(),
        "</working_context>",
        "<instruction>",
        instruction.trim(),
        "</instruction>",
      ].join("\n");

    try {
      const run = async (instruction: string) => {
        const response = await fetch("/api/ai-native/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "complete",
            prompt: assemble(instruction),
            model: selectedModel,
            locale,
          }),
          signal: controller.signal,
        });
        const payload = (await response
          .json()
          .catch(() => null)) as PracticeCompletePayload | null;
        return { response, payload };
      };
      const primary = await run(prompt);
      if (!requestIsCurrent()) return;
      const { response, payload } = primary;

      if (!response.ok) {
        failProviderRun(
          classifyProviderFailure(locale, {
            status: response.status,
            serverError: payload?.error,
            serverCode: payload?.code,
          }),
        );
        return;
      }

      const primaryCompletion = validatePracticeCompletion(
        payload,
        selectedModel,
      );
      if (!primaryCompletion) {
        failProviderRun(
          classifyProviderFailure(locale, {
            status: response.status,
            malformedResponse: true,
          }),
        );
        return;
      }

      setProviderOutput(primaryCompletion.text);
      setProviderIdentity(
        `${primaryCompletion.provider} · ${primaryCompletion.model}`,
      );
      if (variant === "grounding") {
        const secondary = await run(secondaryPrompt);
        if (!requestIsCurrent()) return;
        if (!secondary.response.ok) {
          failProviderRun(
            classifyProviderFailure(locale, {
              status: secondary.response.status,
              serverError: secondary.payload?.error,
              serverCode: secondary.payload?.code,
            }),
          );
          return;
        }
        const secondaryCompletion = validatePracticeCompletion(
          secondary.payload,
          selectedModel,
        );
        if (!secondaryCompletion) {
          failProviderRun(
            classifyProviderFailure(locale, {
              status: secondary.response.status,
              malformedResponse: true,
            }),
          );
          return;
        }
        setSecondaryProviderOutput(secondaryCompletion.text);
      }
      setRunState("success");
      setLocalLearningCompleted(false);
      onExecutionReceipt?.(executionReceipt);
    } catch {
      if (!requestIsCurrent()) return;
      failProviderRun(
        classifyProviderFailure(locale, {
          status: null,
        }),
      );
    } finally {
      if (activeRequest.current?.epoch === epoch) {
        activeRequest.current = null;
      }
    }
  }

  function runLocalLearningCheck() {
    if (!canRunLocalLearning || localLearningCompleted) return;
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(true);
    setVerified(false);
    onExecutionReceipt?.(localLearningReceipt);
  }

  function verify() {
    if (!ready || verified) return;
    setVerified(true);
    onVerified(copy.verifySummarySuccess, artifact);
  }

  return (
    <EngineFrame config={config} locale={locale} engineLabel={copy.engine}>
      {variant === "grounding" ? (
        <section className="mb-5 border-2 border-foreground bg-brand-orange/[0.08] p-4">
          <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em]">
            {groundingCopy.packetTitle}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {groundingCopy.packetHelp}
          </p>
          <pre className="mt-3 whitespace-pre-wrap border-l-4 border-brand-orange pl-3 font-mono text-xs leading-relaxed">
            {GROUNDING_SOURCE_PACKET[locale]}
          </pre>
        </section>
      ) : null}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
        <div className="min-w-0 space-y-4">
          <div>
            <label htmlFor={contextId} className="text-sm font-black">
              {copy.context}
            </label>
            <p
              id={`${contextId}-help`}
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {copy.contextHelp}
            </p>
            <textarea
              id={contextId}
              aria-describedby={`${contextId}-help`}
              className={`${LAB_INPUT} mt-2 min-h-32 resize-y`}
              value={context}
              maxLength={160}
              placeholder={copy.contextPlaceholder}
              onChange={(event) => {
                onMeaningfulInteraction?.();
                setContext(event.target.value);
                setRestoredStructure(false);
                invalidateProviderEvidence();
              }}
            />
          </div>
          <div>
            <label htmlFor={promptId} className="text-sm font-black">
              {missionCopy.primaryPrompt}
            </label>
            <p
              id={`${promptId}-help`}
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {copy.promptHelp}
            </p>
            <textarea
              id={promptId}
              aria-describedby={`${promptId}-help`}
              className={`${LAB_INPUT} mt-2 min-h-40 resize-y font-mono`}
              value={prompt}
              maxLength={220}
              placeholder={copy.promptPlaceholder}
              onChange={(event) => {
                onMeaningfulInteraction?.();
                setPrompt(event.target.value);
                setRestoredStructure(false);
                invalidateProviderEvidence();
              }}
            />
            <p className="mt-1 text-right font-mono text-[0.68rem] text-muted-foreground">
              {requestLength} / 3,800
            </p>
          </div>
          {variant === "grounding" ? (
            <div>
              <label htmlFor={secondaryPromptId} className="text-sm font-black">
                {missionCopy.secondaryPrompt}
              </label>
              <p
                id={`${secondaryPromptId}-help`}
                className="mt-1 text-xs leading-relaxed text-muted-foreground"
              >
                {missionCopy.secondaryHelp}
              </p>
              <textarea
                id={secondaryPromptId}
                aria-describedby={`${secondaryPromptId}-help`}
                className={`${LAB_INPUT} mt-2 min-h-40 resize-y font-mono`}
                value={secondaryPrompt}
                maxLength={220}
                placeholder={missionCopy.secondaryPlaceholder}
                onChange={(event) => {
                  onMeaningfulInteraction?.();
                  setSecondaryPrompt(event.target.value);
                  setRestoredSecondaryReady(false);
                  invalidateProviderEvidence();
                }}
              />
            </div>
          ) : null}
        </div>

        <aside className="min-w-0 border-2 border-foreground/20 bg-background p-4">
          <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em]">
            {copy.localTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            <EvidenceItem complete={effectiveDiagnostics.goal}>
              {copy.goal}
            </EvidenceItem>
            <EvidenceItem complete={effectiveDiagnostics.context}>
              {copy.contextCheck}
            </EvidenceItem>
            <EvidenceItem complete={effectiveDiagnostics.constraints}>
              {copy.constraints}
            </EvidenceItem>
          </ul>
        </aside>
      </div>

      <fieldset className="mt-5 min-w-0 border-2 border-foreground/20 bg-background p-4">
        <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
          {missionCopy.workflowControls}
        </legend>
        {variant === "operator" ? (
          <div className="mb-4 border-2 border-foreground bg-[#11100f] p-4 text-[#f8f5ee]">
            <p className="font-mono text-xs font-black uppercase tracking-wide text-[#ffb08a]">
              {missionCopy.graph}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#d7d0c4]">
              {missionCopy.graphHelp}
            </p>
            <label className="mt-4 block text-sm font-bold">
              {missionCopy.budget}: {budget}
              <input
                type="range"
                min="2"
                max="8"
                value={budget}
                className="mt-2 block w-full accent-brand-orange"
                onChange={(event) => {
                  onMeaningfulInteraction?.();
                  setBudget(Number(event.target.value));
                  invalidateProviderEvidence();
                }}
              />
            </label>
          </div>
        ) : null}
        <div className="grid min-w-0 gap-2 md:grid-cols-3">
          {[
            ["approval", missionCopy.approval, approvalGate, setApprovalGate],
            ["stop", missionCopy.stop, stopCondition, setStopCondition],
            ["handoff", missionCopy.handoff, handoffDefined, setHandoffDefined],
          ].map(([id, label, checked, setter]) => (
            <label
              key={String(id)}
              className="flex min-w-0 cursor-pointer items-start gap-3 border-2 border-foreground/15 p-3 text-sm font-semibold leading-relaxed"
            >
              <input
                type="checkbox"
                checked={Boolean(checked)}
                className="mt-1 size-4 shrink-0 accent-brand-orange"
                onChange={(event) => {
                  onMeaningfulInteraction?.();
                  (setter as (value: boolean) => void)(event.target.checked);
                  invalidateProviderEvidence();
                }}
              />
              <span className="min-w-0 break-words">{String(label)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="mt-5 border-2 border-amber-800 bg-amber-50 p-4 text-amber-950">
        <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em]">
          {locale === "de"
            ? "Warnung zu sensiblen Daten"
            : "Sensitive-data warning"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed">{copy.privacyWarning}</p>
        <div className="mt-3 flex items-start gap-3">
          <input
            id={privacyId}
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-brand-orange"
            checked={privacyConfirmed}
            onChange={(event) => {
              setPrivacyConfirmed(event.target.checked);
              invalidateProviderEvidence();
            }}
          />
          <label
            htmlFor={privacyId}
            className="text-sm font-semibold leading-relaxed"
          >
            {copy.privacyConfirm}
          </label>
        </div>
      </section>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(15rem,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <label htmlFor={modelId} className="text-sm font-black">
            {copy.model}
          </label>
          <p
            id={`${modelId}-help`}
            className="mt-1 text-xs leading-relaxed text-muted-foreground"
          >
            {copy.modelHelp}
          </p>
          <select
            id={modelId}
            aria-describedby={`${modelId}-help`}
            className={`${LAB_INPUT} mt-2`}
            value={selectedModel}
            onChange={(event) => {
              setSelectedModel(event.target.value as PracticeModelId);
              invalidateProviderEvidence();
            }}
          >
            <option value="anthropic/claude-haiku-4.5">
              Claude Haiku 4.5 · Anthropic
            </option>
            <option value="google/gemini-2.5-flash-lite">
              Gemini 2.5 Flash-Lite · Google
            </option>
          </select>
        </div>
        <button
          type="button"
          className={LAB_BUTTON}
          disabled={!canRun || runState === "loading"}
          onClick={() => void runProvider()}
        >
          {runState === "loading" ? copy.running : copy.run}
        </button>
      </div>

      <section
        aria-labelledby={`${config.id}-provider-output`}
        aria-busy={runState === "loading"}
        className="mt-4 min-w-0 border-2 border-foreground bg-[#11100f] p-4 text-[#f8f5ee]"
      >
        <h3
          id={`${config.id}-provider-output`}
          className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[#ffb08a]"
        >
          {copy.providerTitle}
        </h3>
        <div aria-live="polite" className="mt-3 min-w-0">
          {runState === "success" ? (
            <>
              <p className="text-xs font-bold text-emerald-300">
                {copy.success}
              </p>
              {providerIdentity ? (
                <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wide text-[#aaa195]">
                  {providerIdentity}
                </p>
              ) : null}
              {providerOutput ? (
                variant === "grounding" ? (
                  <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
                    {[
                      [missionCopy.outputA, providerOutput],
                      [missionCopy.outputB, secondaryProviderOutput],
                    ].map(([label, output]) => (
                      <div
                        key={label}
                        className="min-w-0 border border-[#f8f5ee]/25 p-3"
                      >
                        <h4 className="font-mono text-[0.68rem] font-black uppercase tracking-wide text-[#ffb08a]">
                          {label}
                        </h4>
                        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[#f8f5ee]">
                          {output}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words border-l-2 border-emerald-500 pl-3 font-mono text-sm leading-relaxed text-[#f8f5ee]">
                    {providerOutput}
                  </pre>
                )
              ) : (
                <p className="mt-3 border-l-2 border-emerald-500 pl-3 text-sm leading-relaxed text-[#d7d0c4]">
                  {copy.priorSuccess}
                </p>
              )}
            </>
          ) : runState === "error" ? (
            <div className="space-y-4">
              {providerOutput ? (
                <div className="border border-amber-300/50 bg-amber-300/10 p-3">
                  <p className="text-xs font-bold leading-relaxed text-amber-200">
                    {copy.partialPrimary}
                  </p>
                  {providerIdentity ? (
                    <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wide text-[#aaa195]">
                      {providerIdentity}
                    </p>
                  ) : null}
                  <h4 className="mt-3 font-mono text-[0.68rem] font-black uppercase tracking-wide text-[#ffb08a]">
                    {missionCopy.outputA}
                  </h4>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words border-l-2 border-amber-300 pl-3 font-mono text-sm leading-relaxed text-[#f8f5ee]">
                    {providerOutput}
                  </pre>
                </div>
              ) : null}
              <div className="border-l-2 border-destructive pl-3">
                {providerFailure ? (
                  <p className="font-mono text-[0.68rem] font-black uppercase tracking-wide text-[#ffb08a]">
                    {copy.failureClass}:{" "}
                    {copy.failureClassLabels[providerFailure.kind]}
                  </p>
                ) : null}
                <p
                  role="alert"
                  className="mt-2 text-sm leading-relaxed text-destructive"
                >
                  {providerFailure?.message}
                </p>
                {providerFailure?.supportsDegradedCompletion ? (
                  <>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-amber-200">
                      {copy.degradedNotice}
                    </p>
                    <button
                      type="button"
                      className={`${LAB_BUTTON_SECONDARY} mt-3 border-[#f8f5ee]/50 bg-[#11100f] text-[#f8f5ee] hover:border-[#ffb08a] hover:text-[#ffb08a]`}
                      disabled={degradedCompletionAcknowledged}
                      onClick={() => {
                        setLocalLearningCompleted(false);
                        setDegradedCompletionAcknowledged(true);
                        setEvaluation("");
                      }}
                    >
                      {degradedCompletionAcknowledged
                        ? copy.degradedAcknowledged
                        : copy.acknowledgeDegraded}
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#f8f5ee]">
                    {copy.operationalFailure}
                  </p>
                )}
                {localLearningAvailable ? (
                  <div className="mt-4 border border-amber-300/50 bg-amber-300/10 p-3">
                    <p className="font-mono text-[0.68rem] font-black uppercase tracking-wide text-amber-200">
                      {copy.localLearningTitle}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#f8f5ee]">
                      {copy.localLearningNotice}
                    </p>
                    <button
                      type="button"
                      className={`${LAB_BUTTON_SECONDARY} mt-3 border-[#f8f5ee]/50 bg-[#11100f] text-[#f8f5ee] hover:border-[#ffb08a] hover:text-[#ffb08a]`}
                      disabled={!canRunLocalLearning || localLearningCompleted}
                      onClick={runLocalLearningCheck}
                    >
                      {localLearningCompleted
                        ? copy.localLearningComplete
                        : copy.runLocalLearning}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[#d7d0c4]">
              {runState === "loading" ? copy.running : copy.providerIdle}
            </p>
          )}
        </div>
      </section>

      {variant === "grounding" ? (
        <section
          aria-labelledby={`${config.id}-evidence-desk`}
          className="mt-5 min-w-0 border-2 border-foreground p-4 sm:p-5"
        >
          <h3
            id={`${config.id}-evidence-desk`}
            className="font-mono text-xs font-black uppercase tracking-[0.14em]"
          >
            {groundingCopy.deskTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {groundingCopy.deskHelp}
          </p>

          <div className="mt-5 border-2 border-foreground/20 p-4">
            <label
              htmlFor={`${config.id}-comparison`}
              className="text-sm font-black"
            >
              {groundingCopy.comparison}
            </label>
            <select
              id={`${config.id}-comparison`}
              className={`${LAB_INPUT} mt-2`}
              value={comparisonDecision}
              disabled={!twoOutputEvidence}
              onChange={(event) => {
                onMeaningfulInteraction?.();
                setComparisonDecision(event.target.value as ComparisonDecision);
                setVerified(false);
              }}
            >
              {groundingCopy.comparisonOptions.map(([value, label]) => (
                <option key={String(value)} value={String(value)}>
                  {label}
                </option>
              ))}
            </select>
            {comparisonDecision && rubricReady && !comparisonReady ? (
              <p
                role="status"
                className="mt-2 text-xs font-bold text-destructive"
              >
                {groundingCopy.comparisonMismatch}
              </p>
            ) : null}
          </div>

          <fieldset className="mt-4 min-w-0 border-2 border-foreground/20 p-4">
            <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
              {groundingCopy.claimsTitle}
            </legend>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              {groundingCopy.claimsHelp}
            </p>
            <div className="grid min-w-0 gap-3 xl:grid-cols-3">
              {claimReviews.map((review, index) => {
                const expected = EXPECTED_CLAIM_REVIEWS[index];
                const answered = review.source !== "" && review.decision !== "";
                const correct =
                  answered &&
                  review.source === expected?.source &&
                  review.decision === expected?.decision;
                return (
                  <div
                    key={groundingCopy.claims[index]}
                    className="min-w-0 border-2 border-foreground/15 p-3"
                  >
                    <p className="min-h-12 text-sm font-bold leading-relaxed">
                      {groundingCopy.claims[index]}
                    </p>
                    <label className="mt-3 block text-xs font-black">
                      {groundingCopy.source}
                      <select
                        aria-label={`${groundingCopy.claims[index]} · ${groundingCopy.source}`}
                        className={`${LAB_INPUT} mt-1`}
                        value={review.source}
                        disabled={!twoOutputEvidence}
                        onChange={(event) => {
                          onMeaningfulInteraction?.();
                          setClaimReviews((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    source: event.target
                                      .value as ClaimEvidenceSource,
                                  }
                                : entry,
                            ),
                          );
                          setVerified(false);
                        }}
                      >
                        {groundingCopy.sourceOptions.map(([value, label]) => (
                          <option key={String(value)} value={String(value)}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-3 block text-xs font-black">
                      {groundingCopy.decision}
                      <select
                        aria-label={`${groundingCopy.claims[index]} · ${groundingCopy.decision}`}
                        className={`${LAB_INPUT} mt-1`}
                        value={review.decision}
                        disabled={!twoOutputEvidence}
                        onChange={(event) => {
                          onMeaningfulInteraction?.();
                          setClaimReviews((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    decision: event.target
                                      .value as RedlineDecision,
                                  }
                                : entry,
                            ),
                          );
                          setVerified(false);
                        }}
                      >
                        {groundingCopy.decisionOptions.map(([value, label]) => (
                          <option key={String(value)} value={String(value)}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {answered ? (
                      <p
                        role="status"
                        className={`mt-3 text-xs font-bold leading-relaxed ${
                          correct ? "text-risk-green" : "text-destructive"
                        }`}
                      >
                        {correct
                          ? groundingCopy.claimCorrect
                          : groundingCopy.claimIncorrect}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-4 min-w-0 border-2 border-foreground/20 p-4">
            <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
              {groundingCopy.rubricTitle}
            </legend>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              {groundingCopy.rubricHelp}
            </p>
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              {(["responseA", "responseB"] as const).map((response) => (
                <div
                  key={response}
                  className="min-w-0 border-2 border-foreground/15 p-3"
                >
                  <h4 className="font-mono text-[0.68rem] font-black uppercase tracking-wide text-brand-orange-dark">
                    {groundingCopy[response]}
                  </h4>
                  <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                    {RUBRIC_DIMENSIONS.map((dimension) => (
                      <label
                        key={dimension}
                        className="min-w-0 border border-foreground/15 p-3 text-xs font-black"
                      >
                        {groundingCopy.rubricDimensions[dimension]}
                        <span className="sr-only">
                          {" "}
                          · {groundingCopy[response]} · {groundingCopy.score}
                        </span>
                        <select
                          aria-label={`${groundingCopy[response]} · ${groundingCopy.rubricDimensions[dimension]} · ${groundingCopy.score}`}
                          className={`${LAB_INPUT} mt-2`}
                          value={rubricScores[response][dimension]}
                          disabled={!twoOutputEvidence}
                          onChange={(event) => {
                            onMeaningfulInteraction?.();
                            setRubricScores((current) => ({
                              ...current,
                              [response]: {
                                ...current[response],
                                [dimension]: Number(event.target.value),
                              },
                            }));
                            setVerified(false);
                          }}
                        >
                          {groundingCopy.scoreOptions.map(([value, label]) => (
                            <option key={String(value)} value={Number(value)}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </section>
      ) : (
        <fieldset className="mt-5 min-w-0 border-2 border-foreground/20 p-4">
          <legend className="px-2 font-mono text-xs font-black uppercase tracking-[0.14em]">
            {missionCopy.review}
          </legend>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {missionCopy.reviewHelp}
          </p>
          <div className="grid min-w-0 gap-2 md:grid-cols-2">
            {[
              [
                variant === "operator" ? "intervene" : "workflow",
                variant === "operator"
                  ? missionCopy.evaluateOperator
                  : missionCopy.evaluateWorkflow,
              ],
              ["stop", missionCopy.stopUnavailable],
              ["unsafe", missionCopy.unsafeReview],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex min-w-0 cursor-pointer items-start gap-3 border-2 border-foreground/15 p-3 text-sm font-semibold leading-relaxed"
              >
                <input
                  type="radio"
                  name={`${config.id}-evaluation`}
                  value={value}
                  checked={evaluation === value}
                  disabled={!completionOutcomeReady}
                  className="mt-1 size-4 shrink-0 accent-brand-orange"
                  onChange={(event) => {
                    onMeaningfulInteraction?.();
                    setEvaluation(event.target.value);
                    setVerified(false);
                  }}
                />
                <span className="min-w-0 break-words">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <VerifyPanel
        locale={locale}
        ready={ready}
        verified={verified}
        onVerify={verify}
        statusDetail={
          ready
            ? copy.ready
            : evidenceReady && !verificationEnabled
              ? copy.stageLocked
              : degradedCompletionReady
                ? copy.degradedNotVerified
                : runState === "error" &&
                    providerFailure?.supportsDegradedCompletion !== true
                  ? copy.operationalFailure
                  : copy.pending
        }
        criteria={
          <>
            <EvidenceItem complete={structureReady}>
              {copy.evidenceStructure}
            </EvidenceItem>
            <EvidenceItem complete={verificationEnabled}>
              {copy.stageEvidence}
            </EvidenceItem>
            <EvidenceItem complete={providerEvidence}>
              {providerEvidence
                ? copy.evidenceRunSuccess
                : degradedCompletionReady
                  ? copy.evidenceRunDegraded
                  : copy.evidenceRunPending}
            </EvidenceItem>
            {variant === "grounding" ? (
              <>
                <EvidenceItem complete={twoOutputEvidence}>
                  {groundingCopy.twoOutputs}
                </EvidenceItem>
                <EvidenceItem complete={comparisonReady}>
                  {groundingCopy.comparisonComplete}
                </EvidenceItem>
                <EvidenceItem complete={claimReviewReady}>
                  {groundingCopy.claimsComplete}
                </EvidenceItem>
                <EvidenceItem complete={rubricReady}>
                  {groundingCopy.rubricComplete}
                </EvidenceItem>
              </>
            ) : (
              <EvidenceItem complete={missionReady}>
                {missionCopy.missionEvidence}
              </EvidenceItem>
            )}
          </>
        }
      />
    </EngineFrame>
  );
}
