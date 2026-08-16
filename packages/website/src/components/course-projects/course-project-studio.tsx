"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type JSX,
} from "react";
import type { CourseSlug } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  COURSE_PROJECT_STAGE_LABELS,
  COURSE_PROJECT_STAGE_IDS,
  deriveCompletedCourseProjectStages,
  getCourseLessonMissions,
  getCourseProjectConfig,
  getCourseProjectDraftStorageKey,
  getCourseProjectExecutionReceipt,
  getCourseProjectLocalLearningReceipt,
  getLessonMissionDefinition,
  hasAppliedProjectCompletion,
  hasCompletedAllCourseProjectStages,
  hasCourseProjectExecutionEvidence,
  hasCourseProjectLearningEvidence,
  hasValidCourseProjectArtifact,
  normalizeCompletedLessonMissionIds,
  parseCourseProjectProgress,
  parseCourseProjectDraft,
  serializeCourseProjectProgress,
  serializeCourseProjectDraft,
  type CourseProjectArtifactState,
  type CourseProjectEngineKind,
  type CourseProjectEngineProps,
  type CourseProjectLearningReceipt,
  type LessonMissionId,
} from "@/lib/course-projects";
import type { Locale } from "@/lib/i18n/locale";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  removeOwnedLocalLearningItem,
  setOwnedLocalLearningItem,
} from "@/lib/progress/browser-learning-storage";
import { useLearningOwnerGeneration } from "@/lib/progress/use-learning-owner-generation";
import { getLessonMissionStorageKey } from "@/lib/course-projects/storage-keys";
import {
  hasCompletedLessonMission,
  parseLessonMissionState,
} from "@/lib/course-projects/lesson-mission-persistence";
import { getLessonMissionProfile } from "@/lib/course-projects/lesson-missions";
import {
  bindLessonMission,
  type AuthoredLessonMissionContext,
} from "@/lib/course-projects/lesson-mission-binding";
import {
  getCourseSlice,
  getExerciseResult,
  saveExerciseResultWithCheckpoint,
  subscribe,
} from "@/lib/progress";

import { CourseWorkspaceFrame } from "./course-workspace-frame";
import { LessonMissionControl } from "./lesson-mission-control";
import { getCourseProjectStageIndex } from "./project-stage";
import { RetrievalQueue } from "./retrieval-queue";

export interface CourseProjectStudioProps {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly locale: Locale;
  /** Minimal authored metadata from the active lesson already loaded by its route. */
  readonly lessonContext: AuthoredLessonMissionContext;
}

const ENGINE_COMPONENTS: Readonly<
  Record<CourseProjectEngineKind, ComponentType<CourseProjectEngineProps>>
> = {
  prompt: dynamic<CourseProjectEngineProps>(
    () => import("./engines/prompt-lab"),
    { ssr: false, loading: EngineLoading },
  ),
  repo: dynamic<CourseProjectEngineProps>(() => import("./engines/repo-lab"), {
    ssr: false,
    loading: EngineLoading,
  }),
  data: dynamic<CourseProjectEngineProps>(() => import("./engines/data-lab"), {
    ssr: false,
    loading: EngineLoading,
  }),
  case: dynamic<CourseProjectEngineProps>(() => import("./engines/case-lab"), {
    ssr: false,
    loading: EngineLoading,
  }),
};

const MEANINGFUL_ARTIFACT_FIELDS: Readonly<
  Record<CourseProjectEngineKind, readonly string[]>
> = {
  prompt: [
    "goalReady",
    "contextReady",
    "constraintsReady",
    "secondaryReady",
    "approvalGate",
    "stopCondition",
    "handoffDefined",
    "budget",
    "evaluation",
  ],
  repo: ["specReady"],
  data: ["failureInjected", "decision"],
  case: ["responses", "sources"],
};

/**
 * Projects an engine artifact onto controls and actions that alter the
 * synthetic exercise itself. Consent, form-readiness, free-form drafts, model
 * selection, and static variant fields are deliberately excluded: changing
 * any of them cannot satisfy the lesson's Manipulate gate.
 */
export function getMeaningfulArtifactFingerprint(
  artifact: CourseProjectArtifactState,
): string {
  const fields = MEANINGFUL_ARTIFACT_FIELDS[artifact.engineKind];
  return JSON.stringify([
    artifact.version,
    artifact.engineKind,
    fields.map((field) => [field, artifact.fields[field] ?? null]),
  ]);
}

function sameCourseProjectArtifact(
  current: CourseProjectArtifactState | null,
  next: CourseProjectArtifactState,
): boolean {
  return current !== null && JSON.stringify(current) === JSON.stringify(next);
}

function reconcileDurableMissionIds(
  courseSlug: CourseSlug,
  completedMissionIds: readonly LessonMissionId[],
  resetAt: string | null,
): readonly LessonMissionId[] {
  const requested = new Set(
    normalizeCompletedLessonMissionIds(courseSlug, completedMissionIds),
  );
  const profile = getLessonMissionProfile(courseSlug);
  return getCourseLessonMissions(courseSlug)
    .filter((mission) => {
      if (!requested.has(mission.id)) return false;
      const state = parseLessonMissionState(
        getOwnedLocalLearningItem(
          getLessonMissionStorageKey(courseSlug, mission.lessonId),
        ),
        profile,
        resetAt,
      );
      return state !== null && hasCompletedLessonMission(state, profile);
    })
    .map((mission) => mission.id);
}

const STUDIO_COPY = {
  de: {
    eyebrow: "Angewandtes Kursprojekt",
    workspace: "Projektwerkstatt",
    artifact: "Lieferobjekt",
    scenario: "Synthetischer Fall",
    safety: "Daten- und Sicherheitsgrenze",
    completion: "Abnahmebedingungen",
    activate: "Werkstatt öffnen",
    activated: "Arbeitsbereich aktiv",
    ready: "Bereit zur Aktivierung",
    done: "Projekt verifiziert",
    pending: "Noch nicht verifiziert",
    progress: "Arbeitsstufen",
    currentStage: "Aktuelle Projektphase",
    objective: "Jetzt bearbeiten",
    evidence: "Erwartete Evidenz",
    completedSummary: "Verifikationsnotiz",
    milestone:
      "Der verifizierte Artefaktstatus ist im Lernfortschritt gespeichert.",
    stageDone: "Phasenmissionen abgeschlossen",
    stageLocked: "Vorherige Projektphase zuerst abschließen",
    verifyLocked:
      "Die Projektabnahme wird erst nach allen fünf abgeschlossenen Phasenmissionen freigeschaltet.",
    persistFailed:
      "Verifizierung nicht gespeichert: Der Lernfortschritt konnte nicht sicher geschrieben werden. Das Artefakt bleibt in dieser Sitzung bearbeitbar.",
  },
  en: {
    eyebrow: "Applied course project",
    workspace: "Project studio",
    artifact: "Deliverable",
    scenario: "Synthetic case",
    safety: "Data and safety boundary",
    completion: "Acceptance criteria",
    activate: "Open studio",
    activated: "Workspace active",
    ready: "Ready to activate",
    done: "Project verified",
    pending: "Not yet verified",
    progress: "Work stages",
    currentStage: "Current project phase",
    objective: "Work on this now",
    evidence: "Expected evidence",
    completedSummary: "Verification note",
    milestone:
      "The verified artifact milestone is stored in learning progress.",
    stageDone: "Stage missions complete",
    stageLocked: "Complete the preceding project stage first",
    verifyLocked:
      "Project acceptance unlocks only after all five stage missions are complete.",
    persistFailed:
      "Verification was not stored: learning progress could not be written safely. The artifact remains editable in this session.",
  },
} as const;

function EngineLoading(): JSX.Element {
  return (
    <div
      className="border-2 border-border bg-background p-6"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm font-semibold">
        Projektwerkstatt wird geladen / Loading project studio
      </span>
      <div aria-hidden="true">
        <div className="mt-4 h-3 w-28 bg-border" />
        <div className="mt-4 h-16 w-full border border-dashed border-border" />
      </div>
    </div>
  );
}

export function CourseProjectStudio({
  courseSlug,
  lessonId,
  locale,
  lessonContext,
}: CourseProjectStudioProps): JSX.Element {
  const config = getCourseProjectConfig(courseSlug);
  const copy = STUDIO_COPY[locale];
  const exerciseId = config.id;
  const checkpointId = `${config.id}:verified`;
  const expectedExecutionReceipt = getCourseProjectExecutionReceipt(courseSlug);
  const expectedLocalLearningReceipt =
    courseSlug === "ai-native" ||
    courseSlug === "claude" ||
    courseSlug === "ai-native-operator"
      ? getCourseProjectLocalLearningReceipt(courseSlug)
      : null;
  const [activated, setActivated] = useState(false);
  const [instrumentRevision, setInstrumentRevision] = useState(0);
  const [executionReceipt, setExecutionReceipt] =
    useState<CourseProjectLearningReceipt | null>(null);
  const [executionRevision, setExecutionRevision] = useState(0);
  const [retrievalScheduleRevision, setRetrievalScheduleRevision] = useState(0);
  const [persistedSummary, setPersistedSummary] = useState<string | null>(null);
  const [persistFailure, setPersistFailure] = useState(false);
  const [artifact, setArtifact] = useState<CourseProjectArtifactState | null>(
    null,
  );
  const [completedMissionIds, setCompletedMissionIds] = useState<
    readonly LessonMissionId[]
  >([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [currentResetAt, setCurrentResetAt] = useState<string | null>(
    () => getCourseSlice(courseSlug).resetAt ?? null,
  );
  const [loadedResetAt, setLoadedResetAt] = useState<string | null | undefined>(
    undefined,
  );
  const ownerGeneration = useLearningOwnerGeneration();
  const ownerContext = getLearningOwnerContext();
  const ownerReady =
    loadedOwnerGeneration === ownerGeneration &&
    loadedResetAt !== undefined &&
    loadedResetAt === currentResetAt &&
    ownerContext.generation === ownerGeneration &&
    ownerContext.kind !== "unknown";
  const workspaceRef = useRef<HTMLDivElement>(null);
  const artifactBaselineRef = useRef<{
    scope: string;
    fingerprint: string | null;
  }>({ scope: "", fingerprint: null });
  const progressBoundaryRef = useRef<{
    ownerGeneration: number;
    resetAt: string | null | undefined;
    projectCompleted: boolean | undefined;
  }>({
    ownerGeneration,
    resetAt: undefined,
    projectCompleted: undefined,
  });
  const artifactScope = config.id;
  const draftStorageKey = getCourseProjectDraftStorageKey(courseSlug);
  const completedStages = useMemo(
    () => deriveCompletedCourseProjectStages(courseSlug, completedMissionIds),
    [courseSlug, completedMissionIds],
  );

  useEffect(() => {
    setActivated(false);
    setInstrumentRevision(0);
    setExecutionReceipt(null);
    setExecutionRevision(0);
    setRetrievalScheduleRevision(0);
    setPersistedSummary(null);
    setPersistFailure(false);
    setArtifact(null);
    setCompletedMissionIds([]);
    setDraftLoaded(false);
    setLoadedResetAt(undefined);
    artifactBaselineRef.current = { scope: "", fingerprint: null };
    progressBoundaryRef.current = {
      ownerGeneration,
      resetAt: getCourseSlice(courseSlug).resetAt ?? null,
      projectCompleted: undefined,
    };
    const resetAt = progressBoundaryRef.current.resetAt ?? null;
    setCurrentResetAt(resetAt);

    let restored = null;
    if (getLearningOwnerContext().kind !== "unknown") {
      try {
        restored = parseCourseProjectDraft(
          getOwnedLocalLearningItem(draftStorageKey),
          courseSlug,
          config.engineKind,
          resetAt,
        );
      } catch {
        // The structured draft remains session-only when storage is unavailable.
      }
    }
    if (restored) {
      const restoredReceipt = hasCourseProjectExecutionEvidence(
        restored.artifact,
        courseSlug,
        expectedExecutionReceipt,
      )
        ? expectedExecutionReceipt
        : hasCourseProjectLearningEvidence(
              restored.artifact,
              courseSlug,
              expectedLocalLearningReceipt,
            )
          ? expectedLocalLearningReceipt
          : null;
      setExecutionReceipt(restoredReceipt);
      setCompletedMissionIds(
        reconcileDurableMissionIds(
          courseSlug,
          restored.completedMissionIds,
          resetAt,
        ),
      );
      setArtifact(restored.artifact);
    }
    setLoadedOwnerGeneration(ownerGeneration);
    setLoadedResetAt(resetAt);
    setDraftLoaded(true);
  }, [
    config.engineKind,
    courseSlug,
    draftStorageKey,
    expectedExecutionReceipt,
    expectedLocalLearningReceipt,
    ownerGeneration,
  ]);

  useEffect(() => {
    return subscribe((snapshot) => {
      const activeOwner = getLearningOwnerContext();
      if (
        activeOwner.generation !== ownerGeneration ||
        activeOwner.kind === "unknown"
      ) {
        return;
      }
      const result = getExerciseResult(
        courseSlug,
        config.progressLessonId,
        exerciseId,
      );
      const persisted = parseCourseProjectProgress(
        result?.summary,
        config.engineKind,
      );
      const projectCompleted = hasAppliedProjectCompletion(
        snapshot,
        courseSlug,
      );
      const resetAt = snapshot.courses?.[courseSlug]?.resetAt ?? null;
      setCurrentResetAt(resetAt);
      const priorBoundary = progressBoundaryRef.current;
      const resetChanged =
        priorBoundary.ownerGeneration === ownerGeneration &&
        priorBoundary.resetAt !== undefined &&
        priorBoundary.resetAt !== resetAt;
      const completionRevoked =
        priorBoundary.ownerGeneration === ownerGeneration &&
        priorBoundary.projectCompleted === true &&
        !projectCompleted;
      progressBoundaryRef.current = {
        ownerGeneration,
        resetAt,
        projectCompleted,
      };
      if (resetChanged || completionRevoked) {
        setLoadedResetAt(undefined);
        setActivated(false);
        setInstrumentRevision(0);
        setExecutionReceipt(null);
        setExecutionRevision(0);
        setRetrievalScheduleRevision(0);
        setArtifact(null);
        setCompletedMissionIds([]);
        setPersistedSummary(null);
        setPersistFailure(false);
        setResetNonce((nonce) => nonce + 1);
        artifactBaselineRef.current = { scope: "", fingerprint: null };
        removeOwnedLocalLearningItem(draftStorageKey, ownerGeneration);
        for (const canonicalLessonId of CANONICAL_LESSON_IDS[courseSlug]) {
          removeOwnedLocalLearningItem(
            getLessonMissionStorageKey(courseSlug, canonicalLessonId),
            ownerGeneration,
          );
        }
        removeOwnedLocalLearningItem(
          getLessonMissionStorageKey(courseSlug, lessonId),
          ownerGeneration,
        );
        setLoadedResetAt(resetAt);
        return;
      }
      if (projectCompleted) {
        setArtifact(persisted.artifact);
        setExecutionReceipt(expectedExecutionReceipt);
        setCompletedMissionIds(
          getCourseLessonMissions(courseSlug).map((mission) => mission.id),
        );
      }
      setPersistedSummary(
        projectCompleted ? (persisted.summary ?? copy.done) : null,
      );
    });
  }, [
    config.engineKind,
    config.progressLessonId,
    copy.done,
    courseSlug,
    draftStorageKey,
    exerciseId,
    expectedExecutionReceipt,
    lessonId,
    ownerGeneration,
  ]);

  useEffect(() => {
    if (!draftLoaded || !ownerReady) return;
    try {
      if (persistedSummary !== null) {
        removeOwnedLocalLearningItem(draftStorageKey, ownerGeneration);
        return;
      }
      if (!activated && completedMissionIds.length === 0 && artifact === null) {
        removeOwnedLocalLearningItem(draftStorageKey, ownerGeneration);
        return;
      }
      setOwnedLocalLearningItem(
        draftStorageKey,
        serializeCourseProjectDraft(
          courseSlug,
          completedMissionIds,
          artifact,
          currentResetAt,
        ),
        ownerGeneration,
      );
    } catch {
      // Bounded fixed-choice evidence can remain in memory for this session.
    }
  }, [
    activated,
    artifact,
    courseSlug,
    currentResetAt,
    draftLoaded,
    draftStorageKey,
    completedMissionIds,
    ownerGeneration,
    ownerReady,
    persistedSummary,
  ]);

  useEffect(() => {
    if (activated && ownerReady) workspaceRef.current?.focus();
  }, [activated, ownerReady]);

  useEffect(() => {
    artifactBaselineRef.current = {
      scope: artifactScope,
      fingerprint: null,
    };
    setInstrumentRevision(0);
  }, [artifactScope]);

  const hasActiveOwnerBoundary = useCallback(() => {
    const activeOwner = getLearningOwnerContext();
    return (
      ownerReady &&
      activeOwner.generation === ownerGeneration &&
      activeOwner.kind !== "unknown" &&
      (getCourseSlice(courseSlug).resetAt ?? null) === currentResetAt
    );
  }, [courseSlug, currentResetAt, ownerGeneration, ownerReady]);

  const handleActivate = () => {
    if (!hasActiveOwnerBoundary()) return;
    const stageIndex = getCourseProjectStageIndex(courseSlug, lessonId);
    if (completedStages.length < stageIndex) return;
    if (activated) {
      workspaceRef.current?.focus();
      return;
    }
    artifactBaselineRef.current = {
      scope: artifactScope,
      fingerprint: null,
    };
    setActivated(true);
  };

  const handleArtifactChange = useCallback(
    (nextArtifact: CourseProjectArtifactState) => {
      if (
        hasActiveOwnerBoundary() &&
        nextArtifact.engineKind === config.engineKind
      ) {
        const boundedArtifact = {
          ...nextArtifact,
          fields: {
            ...nextArtifact.fields,
            stages: completedStages,
          },
        } satisfies CourseProjectArtifactState;
        const hasExecutionEvidence = hasCourseProjectExecutionEvidence(
          boundedArtifact,
          courseSlug,
          expectedExecutionReceipt,
        );
        const hasLocalLearningEvidence = hasCourseProjectLearningEvidence(
          boundedArtifact,
          courseSlug,
          expectedLocalLearningReceipt,
        );
        setExecutionReceipt(
          hasExecutionEvidence
            ? expectedExecutionReceipt
            : hasLocalLearningEvidence
              ? expectedLocalLearningReceipt
              : null,
        );
        const fingerprint = getMeaningfulArtifactFingerprint(boundedArtifact);
        const baseline = artifactBaselineRef.current;
        if (baseline.scope !== artifactScope || baseline.fingerprint === null) {
          artifactBaselineRef.current = {
            scope: artifactScope,
            fingerprint,
          };
        } else if (baseline.fingerprint !== fingerprint) {
          artifactBaselineRef.current = {
            scope: artifactScope,
            fingerprint,
          };
          setInstrumentRevision((revision) => revision + 1);
        }
        setArtifact((current) =>
          sameCourseProjectArtifact(current, boundedArtifact)
            ? current
            : boundedArtifact,
        );
      }
    },
    [
      artifactScope,
      completedStages,
      config.engineKind,
      courseSlug,
      expectedExecutionReceipt,
      expectedLocalLearningReceipt,
      hasActiveOwnerBoundary,
    ],
  );

  const handleMeaningfulInteraction = useCallback(() => {
    if (!hasActiveOwnerBoundary()) return;
    setInstrumentRevision((revision) => revision + 1);
  }, [hasActiveOwnerBoundary]);

  const handleExecutionReceipt = useCallback(
    (receipt: CourseProjectLearningReceipt) => {
      if (
        !hasActiveOwnerBoundary() ||
        (receipt !== expectedExecutionReceipt &&
          receipt !== expectedLocalLearningReceipt)
      ) {
        return;
      }
      setExecutionReceipt(receipt);
      setExecutionRevision((revision) => revision + 1);
    },
    [
      expectedExecutionReceipt,
      expectedLocalLearningReceipt,
      hasActiveOwnerBoundary,
    ],
  );

  const handleVerified = useCallback(
    (summary: string, verifiedArtifact: CourseProjectArtifactState) => {
      if (
        !hasActiveOwnerBoundary() ||
        verifiedArtifact.engineKind !== config.engineKind ||
        !hasCompletedAllCourseProjectStages(courseSlug, completedMissionIds)
      ) {
        return;
      }
      const artifactWithStages: CourseProjectArtifactState = {
        ...verifiedArtifact,
        fields: {
          ...verifiedArtifact.fields,
          stages: [...COURSE_PROJECT_STAGE_IDS],
        },
      };
      const normalizedSummary = summary.trim() || copy.done;
      const serializedProgress = serializeCourseProjectProgress(
        normalizedSummary,
        artifactWithStages,
      );
      if (
        !hasValidCourseProjectArtifact(
          serializedProgress,
          config.engineKind,
          courseSlug,
        )
      ) {
        return;
      }
      const saveResult = saveExerciseResultWithCheckpoint(
        courseSlug,
        config.progressLessonId,
        {
          exerciseId,
          kind: `course-project-${config.engineKind}`,
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: new Date().toISOString(),
          skipped: false,
          summary: serializedProgress,
        },
        checkpointId,
      );
      if (!hasActiveOwnerBoundary()) return;
      if (!saveResult.durable) {
        setPersistFailure(true);
        return;
      }
      setArtifact(artifactWithStages);
      setPersistedSummary(normalizedSummary);
      setPersistFailure(false);
    },
    [
      checkpointId,
      completedMissionIds,
      config.engineKind,
      config.progressLessonId,
      copy.done,
      courseSlug,
      exerciseId,
      hasActiveOwnerBoundary,
    ],
  );

  const Engine = ENGINE_COMPONENTS[config.engineKind];
  const visibleCompletedStages = useMemo(
    () => (ownerReady ? completedStages : []),
    [completedStages, ownerReady],
  );
  const effectiveActivated = ownerReady && activated;
  const done = ownerReady && persistedSummary !== null;
  const currentStageIndex = getCourseProjectStageIndex(courseSlug, lessonId);
  const currentStage = config.stages[currentStageIndex] ?? config.stages[0];
  const currentMission = useMemo(() => {
    try {
      return bindLessonMission(courseSlug, lessonId, locale, lessonContext);
    } catch {
      // Unknown lessons or invalid authored metadata retain the workspace
      // without mission credit, retrieval scheduling, or invented fallback.
      return null;
    }
  }, [courseSlug, lessonContext, lessonId, locale]);
  const currentStageUnlocked =
    ownerReady && visibleCompletedStages.length >= currentStageIndex;
  const verificationEnabled =
    ownerReady &&
    hasCompletedAllCourseProjectStages(courseSlug, completedMissionIds) &&
    hasCourseProjectExecutionEvidence(artifact, courseSlug, executionReceipt);
  const engineArtifact = useMemo(
    () =>
      ownerReady && artifact
        ? {
            ...artifact,
            fields: { ...artifact.fields, stages: visibleCompletedStages },
          }
        : null,
    [artifact, ownerReady, visibleCompletedStages],
  );
  const handleMissionComplete = useCallback(() => {
    if (
      !hasActiveOwnerBoundary() ||
      !currentStageUnlocked ||
      !hasCourseProjectLearningEvidence(artifact, courseSlug, executionReceipt)
    ) {
      return;
    }
    let missionId: LessonMissionId;
    try {
      const mission = getLessonMissionDefinition(courseSlug, lessonId);
      if (mission.stageId !== currentStage.id) return;
      missionId = mission.id;
    } catch {
      return;
    }
    setCompletedMissionIds((current) =>
      current.includes(missionId)
        ? current
        : normalizeCompletedLessonMissionIds(courseSlug, [
            ...current,
            missionId,
          ]),
    );
  }, [
    courseSlug,
    currentStage.id,
    currentStageUnlocked,
    artifact,
    executionReceipt,
    hasActiveOwnerBoundary,
    lessonId,
  ]);

  const handleMissionReset = useCallback(() => {
    if (!hasActiveOwnerBoundary() || persistedSummary !== null) return;
    let missionId: LessonMissionId;
    try {
      missionId = getLessonMissionDefinition(courseSlug, lessonId).id;
    } catch {
      return;
    }
    setCompletedMissionIds((current) =>
      normalizeCompletedLessonMissionIds(
        courseSlug,
        current.filter((entry) => entry !== missionId),
      ),
    );
  }, [courseSlug, hasActiveOwnerBoundary, lessonId, persistedSummary]);

  const handleRetrievalScheduleChange = useCallback(() => {
    setRetrievalScheduleRevision((revision) => revision + 1);
  }, []);

  return (
    <>
      {currentMission ? (
        <>
          <RetrievalQueue
            courseSlug={courseSlug}
            currentLessonId={lessonId}
            locale={locale}
            resetAt={currentResetAt}
            scheduleRevision={retrievalScheduleRevision}
          />
          <LessonMissionControl
            key={`${courseSlug}:${lessonId}:${ownerGeneration}:${resetNonce}`}
            courseSlug={courseSlug}
            lessonId={lessonId}
            locale={locale}
            mission={currentMission}
            projectStage={currentStage}
            projectStageIndex={currentStageIndex}
            projectStageUnlocked={currentStageUnlocked}
            workspaceId={`${config.id}-workspace`}
            workspaceActive={effectiveActivated}
            instrumentRevision={instrumentRevision}
            executionReceipt={executionReceipt}
            executionRevision={executionRevision}
            missionResetEnabled={!done}
            resetAt={currentResetAt}
            onOpenWorkspace={handleActivate}
            onMissionComplete={handleMissionComplete}
            onMissionReset={handleMissionReset}
            onRetrievalScheduleChange={handleRetrievalScheduleChange}
          />
        </>
      ) : null}
      {persistFailure ? (
        <p
          role="alert"
          className="mb-4 border-l-4 border-destructive bg-destructive/10 p-4 text-sm font-semibold leading-relaxed text-destructive"
        >
          {copy.persistFailed}
        </p>
      ) : null}
      <CourseWorkspaceFrame
        id="course-project-studio"
        titleId={`${config.id}-title`}
        title={config.title[locale]}
        storageId={config.id}
        locale={locale}
        projectId={config.id}
        engineKind={config.engineKind}
        header={
          <div className="flex min-w-0 flex-col border-b-2 border-foreground bg-foreground text-background sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 px-4 py-3 sm:px-5">
              <p className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffc6aa] [overflow-wrap:anywhere]">
                {copy.eyebrow} · {config.engineKind}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-2 border-t border-background/30 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] sm:border-l sm:border-t-0 sm:px-5"
              role="status"
              aria-live="polite"
            >
              <span
                className={
                  done ? "h-2 w-2 bg-risk-green" : "h-2 w-2 bg-brand-orange"
                }
                aria-hidden="true"
              />
              {done ? copy.done : copy.pending}
            </div>
          </div>
        }
        brief={
          <header className="min-w-0 p-5 sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <span
                className="font-mono text-[42px] font-black leading-none tracking-[-0.08em] text-brand-orange"
                aria-hidden="true"
              >
                01
              </span>
              <span className="border border-foreground px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">
                {copy.workspace}
              </span>
            </div>
            <h2
              id={`${config.id}-title`}
              className="max-w-[18ch] text-balance text-[clamp(1.75rem,4vw,3.25rem)] font-black leading-[0.96] tracking-[-0.055em] text-foreground"
            >
              {config.title[locale]}
            </h2>
            <p className="mt-5 max-w-[55ch] text-[15px] leading-[1.65] text-muted-foreground">
              {config.mission[locale]}
            </p>

            <dl className="mt-8 border-t-2 border-foreground">
              <div className="grid min-w-0 gap-1 border-b border-border py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange-dark">
                  {copy.artifact}
                </dt>
                <dd className="min-w-0 text-sm font-semibold leading-relaxed [overflow-wrap:anywhere]">
                  {config.artifact[locale]}
                </dd>
              </div>
              <div className="grid min-w-0 gap-1 border-b border-border py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange-dark">
                  {copy.scenario}
                </dt>
                <dd className="min-w-0 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {config.scenario[locale]}
                </dd>
              </div>
            </dl>

            <aside className="mt-6 border-l-4 border-brand-orange bg-card p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange-dark">
                {copy.safety}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                {config.safety[locale]}
              </p>
            </aside>
          </header>
        }
        workspace={
          <div className="min-w-0 p-5 sm:p-7">
            <div
              className="grid min-w-0 gap-6"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
              }}
            >
              <div role="group" aria-label={copy.progress} className="min-w-0">
                <ol
                  className="grid min-w-0 border-l border-t border-foreground"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))",
                  }}
                >
                  {config.stages.map((stage, index) => (
                    <li
                      key={stage.id}
                      aria-current={
                        index === currentStageIndex ? "step" : undefined
                      }
                      className={`min-w-0 border-b border-r border-foreground p-3 ${
                        index === currentStageIndex
                          ? "bg-brand-orange/[0.09] shadow-[inset_0_-3px_0_0_var(--color-brand-orange)]"
                          : index < visibleCompletedStages.length
                            ? "bg-risk-green/10"
                            : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] font-black tracking-[0.12em] text-brand-orange-dark">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="h-px min-w-3 flex-1 bg-border"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                        {COURSE_PROJECT_STAGE_LABELS[stage.id][locale]}
                      </p>
                      <p className="mt-2 text-[11px] leading-[1.45] text-muted-foreground">
                        {stage.evidence[locale]}
                      </p>
                      <p className="mt-3 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-foreground">
                        {index < visibleCompletedStages.length
                          ? copy.stageDone
                          : index > visibleCompletedStages.length
                            ? copy.stageLocked
                            : copy.pending}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="min-w-0 border-2 border-border bg-card p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange-dark">
                  {copy.completion}
                </p>
                <ol className="mt-3 space-y-3">
                  {config.completionCriteria.map((criterion, index) => (
                    <li
                      key={`${config.id}-criterion-${index}`}
                      className="flex min-w-0 gap-3 text-[12px] leading-relaxed"
                    >
                      <span
                        className="font-mono font-black text-brand-orange-dark"
                        aria-hidden="true"
                      >
                        {index + 1}.
                      </span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {criterion[locale]}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <section
              aria-labelledby={`${config.id}-current-stage`}
              className="mt-6 min-w-0 border-2 border-foreground bg-card p-4"
            >
              <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-brand-orange-dark">
                {copy.currentStage} ·{" "}
                {String(currentStageIndex + 1).padStart(2, "0")}/05
              </p>
              <h3
                id={`${config.id}-current-stage`}
                className="mt-2 text-lg font-black"
              >
                {COURSE_PROJECT_STAGE_LABELS[currentStage.id][locale]}
              </h3>
              <dl className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
                <div className="min-w-0 border-l-2 border-brand-orange pl-3">
                  <dt className="font-mono text-[0.65rem] font-black uppercase tracking-wide text-muted-foreground">
                    {copy.objective}
                  </dt>
                  <dd className="mt-1 break-words text-sm leading-relaxed">
                    {currentStage.objective[locale]}
                  </dd>
                </div>
                <div className="min-w-0 border-l-2 border-foreground/30 pl-3">
                  <dt className="font-mono text-[0.65rem] font-black uppercase tracking-wide text-muted-foreground">
                    {copy.evidence}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold leading-relaxed">
                    {currentStage.evidence[locale]}
                  </dd>
                </div>
              </dl>
            </section>

            {!verificationEnabled ? (
              <p className="mt-4 border-l-4 border-brand-orange bg-brand-orange/10 p-4 text-sm font-semibold leading-relaxed">
                {copy.verifyLocked}
              </p>
            ) : null}

            {done ? (
              <div
                className="mt-6 border-2 border-risk-green bg-risk-green/10 p-4"
                role="status"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-risk-green">
                  {copy.completedSummary}
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed">
                  {persistedSummary}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {copy.milestone}
                </p>
              </div>
            ) : null}

            {!effectiveActivated ? (
              <div className="mt-6 flex min-w-0 flex-col gap-4 border-2 border-dashed border-foreground p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange-dark">
                    {copy.ready}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentStage.objective[locale]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={!currentStageUnlocked}
                  aria-controls={`${config.id}-workspace`}
                  aria-expanded={effectiveActivated}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  {copy.activate}
                </button>
              </div>
            ) : (
              <div
                id={`${config.id}-workspace`}
                ref={workspaceRef}
                tabIndex={-1}
                className="mt-6 min-w-0 scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4"
                aria-label={`${copy.activated}: ${config.title[locale]}`}
              >
                <Engine
                  key={`${artifactScope}:${ownerGeneration}:${resetNonce}`}
                  config={config}
                  lessonId={lessonId}
                  locale={locale}
                  initialArtifact={engineArtifact}
                  verificationEnabled={verificationEnabled}
                  onMeaningfulInteraction={handleMeaningfulInteraction}
                  onExecutionReceipt={handleExecutionReceipt}
                  onArtifactChange={handleArtifactChange}
                  onVerified={handleVerified}
                />
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
