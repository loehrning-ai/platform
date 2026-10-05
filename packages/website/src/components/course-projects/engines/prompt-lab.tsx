"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { focusMissionTarget } from "../focus-mission-target";

import {
  DEFAULT_PRACTICE_MODEL_ID,
  PRACTICE_MODEL_IDS,
  PRACTICE_PROVIDER_BY_MODEL,
  type PracticeModelId,
  type PracticeProviderName,
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
type PromptVariant = "workflow" | "operator";
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
  provider: PracticeProviderName;
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

const GOAL_PATTERN =
  /\b(ziel|aufgabe|erstelle|entwirf|analysiere|prüfe|vergleiche|goal|task|create|draft|design|analy[sz]e|evaluate|compare)\b/i;
const CONSTRAINT_PATTERN =
  /\b(muss|darf|keine|nicht mehr als|maximal|mindestens|format|constraint|must|should|do not|never|at most|no more than|output)\b/i;

function expectedProviderForModel(
  model: PracticeModelId,
): ValidatedPracticeCompletion["provider"] {
  return PRACTICE_PROVIDER_BY_MODEL[model];
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
            "Eine Kursrichtlinie hat den Live-Provider deaktiviert.",
          policyNotReady:
            "Eine Kursrichtlinie gibt das gewählte Modell noch nicht frei.",
          auth: "Authentifizierung oder Zugriff ist fehlgeschlagen. Der Provider wurde nicht ausgeführt.",
          validation:
            "Die Anfrage wurde abgelehnt.",
          quota:
            "Ein Nutzungs- oder Providerbudget ist erreicht.",
          provider:
            "Der Upstream-Providerlauf ist fehlgeschlagen.",
          network:
            "Die Practice-API ist nicht erreichbar.",
          malformed:
            "Die Provider-Antwort war fehlerhaft.",
        }
      : {
          policyDisabled:
            "A course policy has disabled the live provider.",
          policyNotReady:
            "A course policy has not enabled the selected model yet.",
          auth: "Authentication or access failed. The provider was not run.",
          validation:
            "The request was rejected.",
          quota:
            "A usage or provider budget is exhausted.",
          provider:
            "The upstream provider run failed.",
          network:
            "The practice API is unreachable.",
          malformed:
            "The provider response was malformed.",
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
  const modelId = useId();
  const privacyId = useId();
  const requestEpoch = useRef(0);
  const activeRequest = useRef<ActiveProviderRequest | null>(null);
  const variant: PromptVariant =
    config.courseSlug === "ai-native-operator" ? "operator" : "workflow";
  const executionReceipt = getCourseProjectExecutionReceipt(config.courseSlug);
  const localLearningReceipt = getCourseProjectLocalLearningReceipt(
    config.courseSlug as "ai-native" | "ai-native-operator",
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
  const localLearningResultRef = useRef<HTMLDivElement>(null);
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
  const [verified, setVerified] = useState(false);

  const providerInputFingerprint = JSON.stringify({
    context,
    prompt,
    selectedModel,
    locale,
    variant,
  });
  const providerInputFingerprintRef = useRef(providerInputFingerprint);
  providerInputFingerprintRef.current = providerInputFingerprint;

  const copy =
    locale === "de"
      ? {
          context: "Arbeitskontext",
          contextHelp: "Fakten, Zielgruppe und Ausgangslage.",
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
            "Meine Eingaben sind synthetisch oder zur Veröffentlichung freigegeben.",
          run: "Provider ausführen",
          running: "Provider läuft …",
          model: "Angefragtes Modell",
          modelHelp:
            "Die Bereitstellung kann das Modell ablehnen. API-Schlüssel bleiben auf dem Server.",
          providerTitle: "Provider-Ausgabe",
          providerIdle:
            "Noch kein Providerlauf.",
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
            "Herabgestufter Lernpfad: Geprüft werden nur Prompt-Struktur und Stop-Verhalten. Es liegt keine Provider-Evidenz vor.",
          acknowledgeDegraded: "Herabgestuften Modus bestätigen",
          degradedAcknowledged:
            "Herabgestufter Modus bestätigt · keine Provider-Evidenz",
          localLearningTitle:
            "Lokaler synthetischer Lernlauf · kein Modellaufruf",
          localLearningNotice:
            "Prüft nur Prompt-Struktur und Kontrollen. Keine Antwort, keine Evidenz für Provider, Projekt oder Teilnahmebestätigung.",
          runLocalLearning: "Lokalen Lernlauf ausführen",
          localLearningComplete:
            "Lokaler Lernlauf abgeschlossen · nur RUN-Lernsignal",
          operationalFailure:
            "Dieser Betriebsfehler ist keine Evidenz und zählt nicht für die Verifizierung.",
          evidenceStructure: "Ziel, Kontext und Grenzen sind erkennbar",
          evidenceRunSuccess: "Echter Providerlauf erfolgreich",
          evidenceRunDegraded:
            "Richtlinien-Stopp protokolliert · zählt nicht für Projekt oder Bestätigung",
          evidenceRunPending:
            "Echte Providerantwort oder Richtlinien-Stopp liegt vor",
          ready: "Die Prompt-Evidenz ist vollständig.",
          pending:
            "Struktur vervollständigen und einen echten Providerlauf versuchen.",
          success: "Die Practice-API hat eine Provider-Antwort geliefert.",
          priorSuccess:
            "Ein früherer erfolgreicher API-Lauf ist vermerkt. Die Provider-Ausgabe wird nicht gespeichert.",
          degradedNotVerified:
            "Dieser Richtlinien-Stopp verifiziert weder das Provider-Artefakt noch das Kurszertifikat.",
          stageLocked:
            "Die Verifizierung öffnet nach allen fünf Projektphasen.",
          stageEvidence: "Alle fünf Projektphasen abgeschlossen",
          verifySummarySuccess:
            "Prompt-Labor verifiziert: Ziel, Kontext und Grenzen geprüft; Providerlauf erfolgreich.",
        }
      : {
          context: "Working context",
          contextHelp: "Facts, audience and starting point.",
          contextPlaceholder:
            "Example: An internal operations team needs an auditable decision memo based on synthetic incident data.",
          prompt: "Prompt instruction",
          promptHelp: "State the goal, output format, and hard constraints.",
          promptPlaceholder:
            "Analyze the situation. Return three prioritized actions in a table. Use only the context and flag assumptions.",
          localTitle: "Local structure analysis · no model call",
          goal: "Goal stated in the prompt",
          contextCheck: "Sufficient working context",
          constraints: "Format or constraints in the prompt",
          privacyWarning:
            "Do not enter names, contact details, credentials, health data, or unpublished company data.",
          privacyConfirm:
            "My inputs are synthetic or approved for disclosure.",
          run: "Run provider",
          running: "Provider running …",
          model: "Requested model",
          modelHelp:
            "The deployment may deny it. API keys stay on the server.",
          providerTitle: "Provider output",
          providerIdle:
            "No provider run yet.",
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
            "Degraded learning path: only prompt structure and stop behavior are checked. No provider evidence exists.",
          acknowledgeDegraded: "Acknowledge degraded mode",
          degradedAcknowledged:
            "Degraded mode acknowledged · no provider evidence",
          localLearningTitle: "Local synthetic learning run · no model call",
          localLearningNotice:
            "Checks only prompt structure and controls. No answer and no provider, project or certificate evidence.",
          runLocalLearning: "Run local learning check",
          localLearningComplete:
            "Local learning run complete · RUN learning signal only",
          operationalFailure:
            "This operational failure is not evidence and does not count toward verification.",
          evidenceStructure: "Goal, context, and constraints are identifiable",
          evidenceRunSuccess: "Real provider run succeeded",
          evidenceRunDegraded:
            "Policy stop recorded · no project or certificate verification",
          evidenceRunPending:
            "Real provider answer or policy stop recorded",
          ready: "The prompt evidence is complete.",
          pending: "Complete the structure and attempt a real provider run.",
          success: "The practice API returned a provider response.",
          priorSuccess:
            "A prior successful API run is recorded. Provider output is not stored.",
          degradedNotVerified:
            "This policy stop verifies neither the provider artifact nor the course certificate.",
          stageLocked:
            "Verification unlocks after all five project stages.",
          stageEvidence: "All five project stages completed",
          verifySummarySuccess:
            "Prompt lab verified: goal, context, and constraints checked; provider run succeeded.",
        };

  const missionCopy =
    locale === "de"
      ? {
          primaryPrompt:
            variant === "operator" ? "Delegationsauftrag" : "Workflow-Auftrag",
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
          review: "Run-Evidenz auswerten",
          reviewHelp:
            "Bewerte die Providerantwort. Bei einem Richtlinien-Stopp bleibt nur der herabgestufte Lernpfad.",
          evaluateWorkflow:
            "Output gegen Freigabe, Abbruchregel, Eigentum und Fallback prüfen",
          evaluateOperator:
            "Fehlerpfad am Qualitätsgate stoppen, Reviewaufwand und Kosten getrennt erfassen",
          stopUnavailable:
            "Keine Ausgabe erfinden; expliziten Richtlinien-Stopp protokollieren",
          unsafeReview: "Ausgabe ohne Rubrik oder Gate übernehmen",
          missionEvidence:
            variant === "operator"
              ? "Agentengraph, Budget, Freigaben und Intervention belegt"
              : "Freigabe, Abbruch, Übergabe und Output-Rubrik belegt",
        }
      : {
          primaryPrompt:
            variant === "operator"
              ? "Delegation instruction"
              : "Workflow instruction",
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
          review: "Assess run evidence",
          reviewHelp:
            "Assess the provider answer. A policy stop leaves only the degraded learning path.",
          evaluateWorkflow:
            "Check output against approval, stop rule, ownership, and fallback",
          evaluateOperator:
            "Stop the faulty path at the quality gate; log review effort and cost apart",
          stopUnavailable: "Invent no output; record the policy stop",
          unsafeReview: "Accept output without a rubric or gate",
          missionEvidence:
            variant === "operator"
              ? "Agent graph, budget, approvals, and intervention evidenced"
              : "Approval, stop, handoff, and output rubric evidenced",
        };

  const diagnostics = useMemo(
    () => ({
      goal: prompt.trim().length >= 20 && GOAL_PATTERN.test(prompt),
      context: context.trim().length >= 24,
      constraints: CONSTRAINT_PATTERN.test(prompt),
    }),
    [context, prompt],
  );
  const controlsReady = approvalGate && stopCondition && handoffDefined;
  const providerEvidence = runState === "success";
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
    ? variant === "operator"
      ? "intervene"
      : "workflow"
    : degradedCompletionReady
      ? "stop"
      : "";
  const evaluationReady =
    evaluation === expectedEvaluation && evaluation !== "";
  const missionReady = controlsReady && evaluationReady;
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
    controlsReady &&
    requestLength <= 3_800;
  const canRunLocalLearning =
    localLearningAvailable &&
    privacyConfirmed &&
    structureReady &&
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
        secondaryReady: true,
        approvalGate,
        stopCondition,
        handoffDefined,
        ...(variant === "operator" ? { budget } : {}),
        evaluation,
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
      privacyConfirmed,
      providerEvidence,
      providerFailure?.kind,
      degradedCompletionReady,
      localLearningCompleted,
      localLearningReceipt,
      selectedModel,
      stopCondition,
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
    setProviderFailure(null);
    setProviderIdentity("");
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
    setVerified(false);
  }

  function failProviderRun(failure: ProviderFailure) {
    setProviderFailure(failure);
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
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
    setProviderFailure(null);
    setDegradedCompletionAcknowledged(false);
    setLocalLearningCompleted(false);
    setEvaluation("");
    setVerified(false);

    const assemble = (instruction: string) =>
      [
        locale === "de"
          ? "Antworte auf Deutsch."
          : "Respond in English. This explicit output-language requirement must be honored.",
        "<working_context>",
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
    // Move before the activated button becomes disabled. The result container
    // survives this update, including in WebKit where disabling drops focus.
    focusMissionTarget(localLearningResultRef.current);
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
    <EngineFrame config={config} locale={locale}>
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
            <p className="mt-1 text-right font-mono text-xs text-muted-foreground">
              {requestLength} / {locale === "de" ? "3.800" : "3,800"}
            </p>
          </div>
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
          <div className="mb-4 border-2 border-foreground bg-inset p-4 text-foreground">
            <p className="font-mono text-xs font-black uppercase tracking-wide text-kupfer-dark">
              {missionCopy.graph}
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
            <option value="openai/gpt-5-mini">GPT-5 mini · OpenAI</option>
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
        className="mt-4 min-w-0 border-2 border-foreground bg-inset p-4 text-foreground"
      >
        <h3
          id={`${config.id}-provider-output`}
          className="font-mono text-xs font-black uppercase tracking-[0.14em] text-kupfer-dark"
        >
          {copy.providerTitle}
        </h3>
        <div aria-live="polite" className="mt-3 min-w-0">
          {runState === "success" ? (
            <>
              <p className="text-xs font-bold text-pass">
                {copy.success}
              </p>
              {providerIdentity ? (
                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {providerIdentity}
                </p>
              ) : null}
              {providerOutput ? (
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words border-l-2 border-pass pl-3 font-mono text-sm leading-relaxed text-foreground">
                  {providerOutput}
                </pre>
              ) : (
                <p className="mt-3 border-l-2 border-pass pl-3 text-sm leading-relaxed text-muted-foreground">
                  {copy.priorSuccess}
                </p>
              )}
            </>
          ) : runState === "error" ? (
            <div className="space-y-4">
              <div className="border-l-2 border-destructive pl-3">
                {providerFailure ? (
                  <p className="font-mono text-xs font-black uppercase tracking-wide text-kupfer-dark">
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
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-risk-yellow">
                      {copy.degradedNotice}
                    </p>
                    <button
                      type="button"
                      className={`${LAB_BUTTON_SECONDARY} mt-3 border-border bg-inset text-foreground hover:border-kupfer-dark hover:text-kupfer-dark`}
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
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-foreground">
                    {copy.operationalFailure}
                  </p>
                )}
                {localLearningAvailable ? (
                  <div
                    ref={localLearningResultRef}
                    tabIndex={-1}
                    role={localLearningCompleted ? "status" : undefined}
                    aria-label={
                      localLearningCompleted
                        ? copy.localLearningComplete
                        : copy.localLearningTitle
                    }
                    data-local-learning-feedback
                    className="mt-4 border border-risk-yellow/50 bg-amber-50 p-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                  >
                    <p className="font-mono text-xs font-black uppercase tracking-wide text-risk-yellow">
                      {copy.localLearningTitle}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {copy.localLearningNotice}
                    </p>
                    <button
                      type="button"
                      className={`${LAB_BUTTON_SECONDARY} mt-3 border-border bg-inset text-foreground hover:border-kupfer-dark hover:text-kupfer-dark`}
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              {runState === "loading" ? copy.running : copy.providerIdle}
            </p>
          )}
        </div>
      </section>

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
              <EvidenceItem complete={missionReady}>
                {missionCopy.missionEvidence}
              </EvidenceItem>
          </>
        }
      />
    </EngineFrame>
  );
}
