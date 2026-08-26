"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type JSX,
  type Ref,
} from "react";
import type { CourseSlug } from "@/lib/course/types";
import {
  createEmptyLessonMissionState,
  getLessonMissionStorageKey,
  hasCompletedLessonMission,
  hasLessonMissionInteraction,
  parseLessonMissionState,
  serializeLessonMissionState,
  type LessonMissionState,
} from "@/lib/course-projects/lesson-mission-persistence";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  removeOwnedLocalLearningItem,
  setOwnedLocalLearningItem,
} from "@/lib/progress/browser-learning-storage";
import { useLearningOwnerGeneration } from "@/lib/progress/use-learning-owner-generation";
import {
  getLessonMissionMisconception,
  type LessonMissionChoice,
  type LessonMissionProfile,
  type LessonMissionProbe,
} from "@/lib/course-projects/lesson-missions";
import type { BoundLessonMission } from "@/lib/course-projects/lesson-mission-binding";
import {
  getRetrievalIntervalDays,
  isRetrievalDue,
  scheduleRetrievalAttempt,
} from "@/lib/course-projects/retrieval-schedule";
import type {
  CourseProjectLearningReceipt,
  CourseProjectStage,
} from "@/lib/course-projects/types";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { LessonMissionFrame } from "./lesson-mission-frame";

const STEP_IDS = [
  "predict",
  "manipulate",
  "run",
  "inspect",
  "revise",
  "retrieve",
  "transfer",
] as const;

const BEATS = [
  { id: "commit", firstStep: 0, lastStep: 0 },
  { id: "test", firstStep: 1, lastStep: 3 },
  { id: "revise", firstStep: 4, lastStep: 6 },
] as const;

const RETRIEVAL_RECALL_MIN_LENGTH = 12;
const RETRIEVAL_RECALL_MAX_LENGTH = 280;

const MISSION_COPY = {
  de: {
    eyebrow: "Lektionsmission",
    title: "Signalstrecke",
    stage: "Projektphase",
    objective: "Aktueller Auftrag",
    expectedEvidence: "Gesuchter Beleg",
    progress: "Phasen abgeschlossen",
    collapse: "Signalstrecke einklappen",
    expand: "Signalstrecke ausklappen",
    localBoundary:
      "Gespeichert werden nur feste Auswahl-IDs, Abrufzähler und Fälligkeitszeitpunkte in diesem Browser. Geschriebene Abrufe und Notizen werden weder gespeichert noch gesendet.",
    syntheticOnly: "Nur synthetischen Kontext verwenden.",
    locked: "Vorherige Phase zuerst abschließen",
    current: "aktuell",
    currentStep: "Aktueller Schritt",
    stepComplete: "abgeschlossen",
    stepIncomplete: "offen",
    stepLocked: "gesperrt",
    complete: "Lektionsschleife geschlossen",
    ownerRequired:
      "Aktiviere den lokalen Lernmodus, bevor du diese Mission startest.",
    stageLocked:
      "Diese Projektphase ist gesperrt. Schließe zuerst die vorherigen Projektphasen ab.",
    correct: "Signal trägt.",
    incorrect: "Signal trägt noch nicht.",
    continue: "Nächstes Signal",
    reveal: "Prognose festlegen und Signal aufdecken",
    committed: "Festgelegte Prognose",
    revealed: "Aufgedecktes Störsignal",
    predictionHint:
      "Lege dich vor der Beobachtung fest. Die Auswahl wird nach dem Aufdecken gesperrt; revidiert wird später mit Evidenz.",
    predictionHintCompact:
      "Vor der Beobachtung festlegen; danach ist die Auswahl gesperrt.",
    openWorkspace: "Instrument öffnen",
    workspaceOpen: "Instrument offen",
    manipulateRequired:
      "Ändere mindestens eine bereitgestellte Steuerung im Instrument. Das Öffnen allein zählt nicht als Manipulation.",
    manipulated: "Eine Instrumentänderung wurde für diese Lektion erkannt.",
    runRequired:
      "Führe jetzt die sichtbare, begrenzte Ausführungsaktion im Instrument aus. Nur ein erfolgreicher fester Beleg öffnet die Evidenzprüfung.",
    runInstrument: "Instrument zur Ausführung öffnen",
    runComplete: "Erfolgreicher Ausführungsbeleg für diese Lektion erkannt.",
    retrievalRecall: "Regel aus dem Gedächtnis",
    retrievalRecallPrompt:
      "Rekonstruiere die entscheidende Regel schriftlich, bevor Antwortoptionen oder Begründungen erscheinen.",
    retrievalRecallHint:
      "12 bis 280 Zeichen. Dieser Abruf bleibt nur im Arbeitsspeicher dieser Seite.",
    retrievalRecallCommit: "Abruf festlegen und Optionen öffnen",
    retrievalRecallCommitted:
      "Schriftlicher Abruf festgelegt. Jetzt die Regel prüfen.",
    firstRetrievalChoice: "Erste Abrufauswahl",
    retrievalChoiceLocked:
      "Die Auswahl dieses Versuchs ist gesperrt und kann nicht umgeschaltet werden.",
    misconception: "Fehlvorstellung erkannt",
    repairRetrieval: "Reparaturabruf beginnen",
    retrievalDue: "Der nächste Abruf ist jetzt fällig.",
    nextRetrieval: "Nächstes Abrufintervall",
    day: "Tag",
    days: "Tage",
    retrievalAttempts: "Abrufversuche",
    scratch: "Temporäre Revisionsnotiz",
    scratchHint:
      "Optional, maximal 280 Zeichen. Bleibt nur im Arbeitsspeicher dieser Seite.",
    transferCase: "Neuer Fall",
    reset: "Lektionsmission zurücksetzen",
    resetLocked: "Zurücksetzen nach Projektverifikation gesperrt",
    resetLabel:
      "Nur die lokal gespeicherten Auswahl-IDs dieser Lektionsmission löschen",
    resetFailed:
      "Zurücksetzen fehlgeschlagen: Der gespeicherte Missionsstand konnte nicht sicher gelöscht werden. Der bisherige Stand bleibt erhalten.",
    steps: {
      predict: "Prognose",
      manipulate: "Manipulieren",
      run: "Ausführen",
      inspect: "Evidenz",
      revise: "Revision",
      retrieve: "Abruf",
      transfer: "Transfer",
    },
    beats: {
      commit: "Festlegen",
      test: "Testen",
      revise: "Revidieren",
    },
  },
  en: {
    eyebrow: "Lesson mission",
    title: "Signal circuit",
    stage: "Project phase",
    objective: "Current assignment",
    expectedEvidence: "Evidence target",
    progress: "beats complete",
    collapse: "Collapse signal circuit",
    expand: "Expand signal circuit",
    localBoundary:
      "Only fixed choice IDs, retrieval counts, and due timestamps are stored in this browser. Written recall and scratch notes are neither saved nor sent.",
    syntheticOnly: "Use synthetic context only.",
    locked: "Complete the previous beat first",
    current: "current",
    currentStep: "Current step",
    stepComplete: "complete",
    stepIncomplete: "incomplete",
    stepLocked: "locked",
    complete: "Lesson loop closed",
    ownerRequired: "Activate local learning before starting this mission.",
    stageLocked:
      "This project phase is locked. Complete the preceding project stages first.",
    correct: "Signal holds.",
    incorrect: "Signal does not hold yet.",
    continue: "Next signal",
    reveal: "Commit prediction and reveal signal",
    committed: "Committed prediction",
    revealed: "Revealed failure signal",
    predictionHint:
      "Commit before observing. The choice locks after reveal; revision happens later against evidence.",
    predictionHintCompact: "Commit before observing; the choice then locks.",
    openWorkspace: "Open instrument",
    workspaceOpen: "Instrument open",
    manipulateRequired:
      "Change at least one supplied control in the instrument. Opening it alone does not count as manipulation.",
    manipulated: "An instrument change was detected for this lesson.",
    runRequired:
      "Now use the visible bounded run action in the instrument. Only its successful fixed receipt unlocks evidence inspection.",
    runInstrument: "Open instrument to run",
    runComplete: "A successful execution receipt was detected for this lesson.",
    retrievalRecall: "Rule from memory",
    retrievalRecallPrompt:
      "Reconstruct the governing rule in writing before answer options or rationales appear.",
    retrievalRecallHint:
      "12 to 280 characters. This recall remains only in this page's memory.",
    retrievalRecallCommit: "Commit recall and open options",
    retrievalRecallCommitted:
      "Written recall committed. Now check the governing rule.",
    firstRetrievalChoice: "First retrieval choice",
    retrievalChoiceLocked:
      "This attempt's choice is locked and cannot be switched.",
    misconception: "Misconception detected",
    repairRetrieval: "Begin repair retrieval",
    retrievalDue: "The next retrieval is due now.",
    nextRetrieval: "Next retrieval interval",
    day: "day",
    days: "days",
    retrievalAttempts: "retrieval attempts",
    scratch: "Temporary revision note",
    scratchHint:
      "Optional, 280 characters maximum. It remains only in this page's memory.",
    transferCase: "New case",
    reset: "Reset lesson mission",
    resetLocked: "Reset locked after project verification",
    resetLabel:
      "Clear only the locally stored choice IDs for this lesson mission",
    resetFailed:
      "Reset failed: the stored mission state could not be removed safely. The prior state remains intact.",
    steps: {
      predict: "Predict",
      manipulate: "Manipulate",
      run: "Run",
      inspect: "Inspect",
      revise: "Revise",
      retrieve: "Retrieve",
      transfer: "Transfer",
    },
    beats: {
      commit: "Commit",
      test: "Test",
      revise: "Revise",
    },
  },
} as const;

export interface LessonMissionControlProps {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly locale: Locale;
  readonly mission: BoundLessonMission;
  readonly projectStage: CourseProjectStage;
  readonly projectStageIndex: number;
  readonly projectStageUnlocked?: boolean;
  readonly workspaceId: string;
  readonly workspaceActive: boolean;
  /** Monotonic count of meaningful, bounded engine-state changes. */
  readonly instrumentRevision: number;
  readonly executionReceipt: CourseProjectLearningReceipt | null;
  /** Monotonic count of successful engine runs in this studio mount. */
  readonly executionRevision: number;
  readonly missionResetEnabled?: boolean;
  readonly resetAt?: string | null;
  /** The lesson title owns H1 unless a custom route already rendered one. */
  readonly missionHeadingLevel?: 1 | 2;
  onOpenWorkspace(): void;
  onMissionComplete?(): void;
  onMissionReset?(): void;
  onRetrievalScheduleChange?(): void;
}

function selectedLabel(
  choices: readonly LessonMissionChoice[],
  selectedId: string | null,
  locale: Locale,
): string | null {
  return (
    choices.find((entry) => entry.id === selectedId)?.label[locale] ?? null
  );
}

function getStepCompletion(
  state: LessonMissionState,
  profile: LessonMissionProfile,
  executionReceipt: CourseProjectLearningReceipt | null,
): readonly boolean[] {
  const predictionComplete = state.predictionId !== null && state.revealed;
  const manipulationComplete =
    predictionComplete && state.workspaceOpened && state.manipulated;
  const executionComplete =
    manipulationComplete &&
    executionReceipt !== null &&
    state.executionReceipt === executionReceipt;
  const evidenceComplete =
    executionComplete && state.evidenceId === profile.evidence.correctId;
  const revisionComplete =
    evidenceComplete && state.revisionId === profile.revision.correctId;
  const retrievalComplete =
    revisionComplete &&
    state.retrievalMastered &&
    state.retrievalId === profile.retrieval.correctId;
  const transferComplete =
    retrievalComplete && state.transferId === profile.transfer.correctId;

  return [
    predictionComplete,
    manipulationComplete,
    executionComplete,
    evidenceComplete,
    revisionComplete,
    retrievalComplete,
    transferComplete,
  ];
}

function getFirstIncompleteStep(completion: readonly boolean[]): number {
  const firstIncomplete = completion.findIndex((done) => !done);
  return firstIncomplete < 0 ? STEP_IDS.length - 1 : firstIncomplete;
}

function getBeatTargetStep(
  beat: (typeof BEATS)[number],
  completion: readonly boolean[],
): number {
  for (let step = beat.firstStep; step <= beat.lastStep; step += 1) {
    if (!completion[step]) return step;
  }
  return beat.lastStep;
}

function isBeatComplete(
  beat: (typeof BEATS)[number],
  completion: readonly boolean[],
): boolean {
  for (let step = beat.firstStep; step <= beat.lastStep; step += 1) {
    if (!completion[step]) return false;
  }
  return true;
}

function getBeatIndexForStep(step: number): number {
  const beatIndex = BEATS.findIndex(
    (beat) => step >= beat.firstStep && step <= beat.lastStep,
  );
  return beatIndex < 0 ? 0 : beatIndex;
}

function clearRetrievalRecord(state: LessonMissionState): LessonMissionState {
  return {
    ...state,
    retrievalId: null,
    retrievalMastered: false,
    retrievalFirstChoiceId: null,
    retrievalAttemptCount: 0,
    retrievalSuccessLevel: 0,
    retrievalLastAttemptAt: null,
    retrievalNextDueAt: null,
    retrievalMisconceptionId: null,
    revisionId: null,
    transferId: null,
  };
}

function getRetrievalScheduleSignature(state: LessonMissionState): string {
  return [
    state.retrievalAttemptCount,
    state.retrievalSuccessLevel,
    state.retrievalLastAttemptAt ?? "",
    state.retrievalNextDueAt ?? "",
  ].join(":");
}

interface ChoiceProbeProps {
  readonly probe: LessonMissionProbe;
  readonly locale: Locale;
  readonly selectedId: string | null;
  readonly correctCopy: string;
  readonly incorrectCopy: string;
  readonly feedback?: string;
  readonly locked?: boolean;
  readonly headingRef?: Ref<HTMLHeadingElement>;
  readonly headingLevel: 2 | 3;
  onSelect(id: string): void;
}

function ChoiceProbe({
  probe,
  locale,
  selectedId,
  correctCopy,
  incorrectCopy,
  feedback,
  locked = false,
  headingRef,
  headingLevel,
  onSelect,
}: ChoiceProbeProps): JSX.Element {
  const answered = selectedId !== null;
  const correct = selectedId === probe.correctId;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div>
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="max-w-[62ch] text-balance text-xl font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
      >
        {probe.prompt[locale]}
      </Heading>
      <div
        className="mt-5 grid gap-3"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
        }}
      >
        {probe.choices.map((entry, index) => {
          const selected = entry.id === selectedId;
          return (
            <button
              key={entry.id}
              type="button"
              disabled={locked}
              aria-disabled={locked}
              aria-pressed={selected}
              onClick={() => onSelect(entry.id)}
              className={cn(
                "min-h-14 min-w-0 border-2 p-4 text-left outline-none transition-[border-color,background-color,color,transform] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-brand-orange",
                locked && "cursor-not-allowed opacity-75 hover:translate-y-0",
              )}
            >
              <span
                className={cn(
                  "block font-mono text-xs font-black uppercase tracking-[0.16em]",
                  selected ? "text-[#ffc6aa]" : "text-brand-orange-dark",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-2 block break-words text-sm font-bold leading-relaxed">
                {entry.label[locale]}
              </span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <div
          role="status"
          className={cn(
            "mt-5 border-l-4 p-4 text-sm leading-relaxed",
            correct
              ? "border-risk-green bg-risk-green/10 text-foreground"
              : "border-brand-orange bg-brand-orange/10 text-foreground",
          )}
        >
          <p className="font-black">{correct ? correctCopy : incorrectCopy}</p>
          <p className="mt-1">{feedback ?? probe.rationale[locale]}</p>
        </div>
      ) : null}
    </div>
  );
}

export function LessonMissionControl({
  courseSlug,
  lessonId,
  locale,
  mission,
  projectStage,
  projectStageIndex,
  projectStageUnlocked = true,
  workspaceId,
  workspaceActive,
  instrumentRevision,
  executionReceipt,
  executionRevision,
  missionResetEnabled = true,
  resetAt = null,
  missionHeadingLevel = 1,
  onOpenWorkspace,
  onMissionComplete,
  onMissionReset,
  onRetrievalScheduleChange,
}: LessonMissionControlProps): JSX.Element {
  const { profile, frame } = mission;
  const copy = MISSION_COPY[locale];
  const MissionHeading = missionHeadingLevel === 1 ? "span" : "h2";
  const StepHeading = missionHeadingLevel === 1 ? "h2" : "h3";
  const stepHeadingLevel = missionHeadingLevel === 1 ? 2 : 3;
  const storageKey = getLessonMissionStorageKey(courseSlug, lessonId);
  const headingId = useId();
  const signalId = useId();
  const signalRef = useRef<HTMLDivElement>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const revisionBaselineRef = useRef<number | null>(null);
  const executionBaselineRef = useRef<number | null>(null);
  const executionReceiptRef = useRef(executionReceipt);
  executionReceiptRef.current = executionReceipt;
  const pendingFocusRef = useRef<"signal" | "panel" | null>(null);
  const completionReportedRef = useRef<string | null>(null);
  const retrievalScheduleSignatureRef = useRef<string | null>(null);
  const durablyCompletedStateRef = useRef<string | null>(null);
  const [state, setState] = useState<LessonMissionState>(
    createEmptyLessonMissionState,
  );
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const [loadedResetAt, setLoadedResetAt] = useState<string | null | undefined>(
    undefined,
  );
  const ownerGeneration = useLearningOwnerGeneration();
  const ownerContext = getLearningOwnerContext();
  const ownerReady =
    loadedOwnerGeneration === ownerGeneration &&
    loadedResetAt !== undefined &&
    loadedResetAt === resetAt &&
    ownerContext.generation === ownerGeneration &&
    ownerContext.kind !== "unknown";
  const controlsEnabled = ownerReady && projectStageUnlocked;
  const [activePanel, setActivePanel] = useState(0);
  const [scratch, setScratch] = useState("");
  const [retrievalRecall, setRetrievalRecall] = useState("");
  const [retrievalRecallCommitted, setRetrievalRecallCommitted] =
    useState(false);
  const [retrievalDue, setRetrievalDue] = useState(true);
  const [resetFailed, setResetFailed] = useState(false);

  useEffect(() => {
    setState(createEmptyLessonMissionState());
    setActivePanel(0);
    setScratch("");
    setRetrievalRecall("");
    setRetrievalRecallCommitted(false);
    setRetrievalDue(true);
    setResetFailed(false);
    setLoadedStorageKey(null);
    setLoadedOwnerGeneration(null);
    setLoadedResetAt(undefined);
    let restored: LessonMissionState | null = null;
    if (getLearningOwnerContext().kind !== "unknown") {
      try {
        restored = parseLessonMissionState(
          getOwnedLocalLearningItem(storageKey),
          profile,
          resetAt,
        );
      } catch {
        // Browser storage is optional; the circuit remains session-functional.
      }
    }
    const next = restored ?? createEmptyLessonMissionState();
    revisionBaselineRef.current = null;
    executionBaselineRef.current = null;
    pendingFocusRef.current = null;
    completionReportedRef.current = null;
    retrievalScheduleSignatureRef.current = getRetrievalScheduleSignature(next);
    durablyCompletedStateRef.current = null;
    setState(next);
    setActivePanel(
      getFirstIncompleteStep(
        getStepCompletion(next, profile, executionReceiptRef.current),
      ),
    );
    setScratch("");
    setRetrievalRecall("");
    setRetrievalRecallCommitted(false);
    setRetrievalDue(isRetrievalDue(next.retrievalNextDueAt));
    setLoadedStorageKey(storageKey);
    setLoadedOwnerGeneration(ownerGeneration);
    setLoadedResetAt(resetAt);
  }, [ownerGeneration, profile, resetAt, storageKey]);

  useEffect(() => {
    if (
      !ownerReady ||
      loadedStorageKey !== storageKey ||
      loadedOwnerGeneration !== ownerGeneration
    ) {
      return;
    }
    durablyCompletedStateRef.current = null;
    try {
      if (!hasLessonMissionInteraction(state)) {
        removeOwnedLocalLearningItem(storageKey, ownerGeneration);
        return;
      }
      const serializedState = serializeLessonMissionState(state, resetAt);
      const stored = setOwnedLocalLearningItem(
        storageKey,
        serializedState,
        ownerGeneration,
      );
      const activeOwner = getLearningOwnerContext();
      const durableRaw = stored ? getOwnedLocalLearningItem(storageKey) : null;
      const durableState =
        durableRaw === serializedState
          ? parseLessonMissionState(durableRaw, profile, resetAt)
          : null;
      durablyCompletedStateRef.current =
        activeOwner.generation === ownerGeneration &&
        activeOwner.kind !== "unknown" &&
        durableState !== null &&
        hasCompletedLessonMission(durableState, profile)
          ? serializedState
          : null;
      const scheduleSignature = getRetrievalScheduleSignature(state);
      if (
        stored &&
        retrievalScheduleSignatureRef.current !== scheduleSignature
      ) {
        retrievalScheduleSignatureRef.current = scheduleSignature;
        onRetrievalScheduleChange?.();
      }
    } catch {
      // Fixed-choice progress can remain in memory when storage is unavailable.
    }
  }, [
    loadedOwnerGeneration,
    loadedStorageKey,
    onRetrievalScheduleChange,
    ownerGeneration,
    ownerReady,
    resetAt,
    profile,
    state,
    storageKey,
  ]);

  useEffect(() => {
    if (
      !ownerReady ||
      loadedStorageKey !== storageKey ||
      getLearningOwnerContext().generation !== ownerGeneration
    ) {
      return;
    }
    setState((current) => {
      if (!current.manipulated) {
        executionBaselineRef.current = executionRevision;
        return current;
      }
      if (executionReceipt === null) {
        if (current.executionReceipt === null) return current;
        return clearRetrievalRecord({
          ...current,
          executionReceipt: null,
          evidenceId: null,
        });
      }
      if (current.executionReceipt === executionReceipt) return current;
      if (executionBaselineRef.current === null) {
        executionBaselineRef.current = executionRevision;
        return current;
      }
      if (executionRevision <= executionBaselineRef.current) return current;
      executionBaselineRef.current = executionRevision;
      return clearRetrievalRecord({
        ...current,
        executionReceipt,
        evidenceId: null,
      });
    });
  }, [
    executionReceipt,
    executionRevision,
    loadedStorageKey,
    ownerGeneration,
    ownerReady,
    storageKey,
  ]);

  useEffect(() => {
    if (
      !ownerReady ||
      loadedStorageKey !== storageKey ||
      getLearningOwnerContext().generation !== ownerGeneration
    ) {
      return;
    }
    setState((current) => {
      if (!current.revealed) {
        revisionBaselineRef.current = null;
        executionBaselineRef.current = executionRevision;
        return current;
      }
      if (current.manipulated) return current;
      if (revisionBaselineRef.current === null) {
        revisionBaselineRef.current = instrumentRevision;
        return current;
      }
      if (instrumentRevision <= revisionBaselineRef.current) return current;
      revisionBaselineRef.current = instrumentRevision;
      executionBaselineRef.current = executionRevision;
      return { ...current, workspaceOpened: true, manipulated: true };
    });
  }, [
    instrumentRevision,
    executionRevision,
    loadedStorageKey,
    ownerGeneration,
    ownerReady,
    state.revealed,
    storageKey,
  ]);

  useEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (pendingFocus === "signal" && state.revealed) {
      pendingFocusRef.current = null;
      signalRef.current?.focus();
    } else if (pendingFocus === "panel") {
      pendingFocusRef.current = null;
      panelHeadingRef.current?.focus();
    }
  }, [activePanel, state.revealed]);

  const displayState =
    ownerReady && loadedStorageKey === storageKey
      ? state
      : createEmptyLessonMissionState();
  const displayActivePanel = ownerReady ? activePanel : 0;

  useEffect(() => {
    if (displayActivePanel !== 5) return;
    setRetrievalDue(isRetrievalDue(displayState.retrievalNextDueAt));
  }, [displayActivePanel, displayState.retrievalNextDueAt]);

  const stepCompletion = useMemo(
    () => getStepCompletion(displayState, profile, executionReceipt),
    [displayState, executionReceipt, profile],
  );
  const firstIncompleteStep = getFirstIncompleteStep(stepCompletion);
  const completedCount = stepCompletion.filter(Boolean).length;
  const allComplete = completedCount === STEP_IDS.length;
  const beatCompletion = BEATS.map((beat) =>
    isBeatComplete(beat, stepCompletion),
  );
  const completedBeatCount = beatCompletion.filter(Boolean).length;
  const currentBeatIndex = getBeatIndexForStep(displayActivePanel);
  const currentStepId = STEP_IDS[displayActivePanel] ?? STEP_IDS[0];
  const completionScope = `${storageKey}:${projectStage.id}`;

  useEffect(() => {
    if (
      !allComplete ||
      !hasCompletedLessonMission(displayState, profile) ||
      durablyCompletedStateRef.current !==
        serializeLessonMissionState(displayState, resetAt) ||
      !ownerReady ||
      !projectStageUnlocked ||
      completionReportedRef.current === completionScope
    ) {
      return;
    }
    completionReportedRef.current = completionScope;
    onMissionComplete?.();
  }, [
    allComplete,
    completionScope,
    onMissionComplete,
    ownerReady,
    profile,
    projectStageUnlocked,
    resetAt,
    displayState,
  ]);
  const predictedLabel = selectedLabel(
    profile.predictionChoices,
    displayState.predictionId,
    locale,
  );
  const retrievalMisconception = getLessonMissionMisconception(
    profile.retrieval,
    displayState.retrievalMisconceptionId,
  );
  const firstRetrievalChoice = selectedLabel(
    profile.retrieval.choices,
    displayState.retrievalFirstChoiceId,
    locale,
  );
  const retrievalRecallReady =
    retrievalRecall.trim().length >= RETRIEVAL_RECALL_MIN_LENGTH &&
    retrievalRecall.trim().length <= RETRIEVAL_RECALL_MAX_LENGTH;
  const currentRetrievalCorrect =
    displayState.retrievalId === profile.retrieval.correctId;
  const retrievalNeedsAttempt = !displayState.retrievalMastered || retrievalDue;
  const retrievalIntervalDays = getRetrievalIntervalDays(
    displayState.retrievalSuccessLevel,
  );
  const retrievalIntervalUnit =
    retrievalIntervalDays === 1 ? copy.day : copy.days;

  function updateState(
    updater: (current: LessonMissionState) => LessonMissionState,
  ): void {
    if (
      !ownerReady ||
      loadedStorageKey !== storageKey ||
      getLearningOwnerContext().generation !== ownerGeneration
    ) {
      return;
    }
    setState(updater);
  }

  function continueTo(step: number): void {
    if (activePanel === 5) {
      setRetrievalRecall("");
      setRetrievalRecallCommitted(false);
    }
    pendingFocusRef.current = "panel";
    setActivePanel(Math.min(STEP_IDS.length - 1, step));
  }

  function revealPrediction(): void {
    revisionBaselineRef.current = instrumentRevision;
    executionBaselineRef.current = executionRevision;
    pendingFocusRef.current = "signal";
    setRetrievalRecall("");
    setRetrievalRecallCommitted(false);
    setRetrievalDue(true);
    updateState((current) =>
      clearRetrievalRecord({
        ...current,
        revealed: current.predictionId !== null,
        manipulated: false,
        executionReceipt: null,
        evidenceId: null,
      }),
    );
  }

  function commitRetrievalRecall(): void {
    if (!controlsEnabled || !retrievalRecallReady || !retrievalNeedsAttempt) {
      return;
    }
    updateState((current) => ({
      ...current,
      retrievalId: null,
    }));
    setRetrievalRecallCommitted(true);
  }

  function commitRetrievalChoice(retrievalId: string): void {
    if (
      !controlsEnabled ||
      loadedStorageKey !== storageKey ||
      displayState.retrievalId !== null
    ) {
      return;
    }
    updateState((current) => {
      if (current.retrievalId !== null) return current;
      const correct = retrievalId === profile.retrieval.correctId;
      const schedule = scheduleRetrievalAttempt(
        {
          successLevel: current.retrievalSuccessLevel,
          lastAttemptAt: current.retrievalLastAttemptAt,
          nextDueAt: current.retrievalNextDueAt,
        },
        correct,
      );
      const retrievalMastered = current.retrievalMastered || correct;

      return {
        ...current,
        retrievalId,
        retrievalMastered,
        retrievalFirstChoiceId: current.retrievalFirstChoiceId ?? retrievalId,
        retrievalAttemptCount: Math.min(99, current.retrievalAttemptCount + 1),
        retrievalSuccessLevel: schedule.successLevel,
        retrievalLastAttemptAt: schedule.lastAttemptAt,
        retrievalNextDueAt: schedule.nextDueAt,
        retrievalMisconceptionId: correct
          ? current.retrievalMisconceptionId
          : retrievalId,
        transferId: retrievalMastered ? current.transferId : null,
      };
    });
    setRetrievalDue(retrievalId !== profile.retrieval.correctId);
  }

  function beginRetrievalRepair(): void {
    setRetrievalRecall("");
    setRetrievalRecallCommitted(false);
    setRetrievalDue(true);
  }

  function resetMission(): void {
    if (
      !missionResetEnabled ||
      !ownerReady ||
      loadedStorageKey !== storageKey ||
      getLearningOwnerContext().generation !== ownerGeneration
    ) {
      return;
    }
    const removed = removeOwnedLocalLearningItem(storageKey, ownerGeneration);
    if (!removed) {
      setResetFailed(true);
      return;
    }
    const reset = createEmptyLessonMissionState();
    setState(reset);
    revisionBaselineRef.current = null;
    executionBaselineRef.current = executionRevision;
    completionReportedRef.current = null;
    pendingFocusRef.current = null;
    setActivePanel(0);
    setScratch("");
    setRetrievalRecall("");
    setRetrievalRecallCommitted(false);
    setRetrievalDue(true);
    setResetFailed(false);
    onMissionReset?.();
    retrievalScheduleSignatureRef.current =
      getRetrievalScheduleSignature(reset);
    onRetrievalScheduleChange?.();
  }

  const renderContinue = (nextStep: number) => (
    <button
      type="button"
      onClick={() => continueTo(nextStep)}
      className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-brand-orange px-5 font-mono text-xs font-black uppercase tracking-[0.12em] text-white outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {copy.continue}{" "}
      <span aria-hidden="true" className="ml-2">
        →
      </span>
    </button>
  );

  // overflow-wrap inherits, so declaring it once on the section lets every
  // heading and label inside the mission break. German compounds such as
  // "Promptvariante" and "Grounding-Komparator" are wider than a mission
  // column at high browser zoom, and this section clips rather than scrolls,
  // so without a break they are silently cut off.
  return (
    <section
      id="lesson-mission-control"
      data-lesson-mission={courseSlug}
      data-lesson-id={lessonId}
      data-keyboard-shortcuts="ignore"
      aria-labelledby={headingId}
      className="relative mb-6 min-w-0 scroll-mt-24 overflow-hidden border-2 border-foreground bg-background shadow-[5px_5px_0_0_var(--color-brand-orange)] [overflow-wrap:anywhere]"
    >
      <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-0 border-b-2 border-foreground bg-foreground text-background sm:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 px-4 py-2 sm:px-5">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffc6aa]">
            {copy.eyebrow} ·{" "}
            <span className="hidden sm:inline">{copy.title} · </span>
            {profile.instrument[locale]}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
            <MissionHeading
              id={headingId}
              {...(missionHeadingLevel === 1
                ? { role: "heading", "aria-level": 1 }
                : {})}
              className="[overflow-wrap:anywhere] text-[clamp(1.35rem,3vw,2rem)] font-black leading-none tracking-[-0.04em]"
            >
              {frame.title}
            </MissionHeading>
            <p
              className="pb-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-background/70"
              aria-live="polite"
            >
              {completedBeatCount}/{BEATS.length} {copy.progress}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-background/30 px-1 py-1 sm:border-l-0 sm:border-t sm:px-3 lg:border-l lg:border-t-0">
          <button
            type="button"
            onClick={() =>
              updateState((current) => ({
                ...current,
                collapsed: !current.collapsed,
              }))
            }
            aria-label={displayState.collapsed ? copy.expand : copy.collapse}
            aria-expanded={!displayState.collapsed}
            aria-controls={`${headingId}-body`}
            className="inline-flex h-11 w-11 items-center justify-center border border-background/60 px-0 font-mono text-xs font-black uppercase tracking-[0.12em] text-background outline-none hover:border-[#ffc6aa] hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-[#ffc6aa] sm:h-auto sm:w-auto sm:min-h-11 sm:px-4"
          >
            <span aria-hidden="true" className="text-lg sm:hidden">
              {displayState.collapsed ? "+" : "−"}
            </span>
            <span className="hidden sm:inline">
              {displayState.collapsed ? copy.expand : copy.collapse}
            </span>
          </button>
        </div>
      </header>

      <div id={`${headingId}-body`} hidden={displayState.collapsed}>
        <div className="min-w-0 border-b-2 border-foreground">
          <div className="min-w-0 border-b border-border bg-card p-2 sm:p-4">
            <LessonMissionFrame
              frame={frame}
              locale={locale}
              headingLevel={missionHeadingLevel}
              showHeading={false}
              compactOnMobile
            />
            <details className="mt-2 border-t border-border pt-2">
              <summary className="min-h-11 cursor-pointer py-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
                {copy.stage} · {String(projectStageIndex + 1).padStart(2, "0")}
                /05 · {copy.expectedEvidence}
              </summary>
              <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {copy.objective}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold leading-snug">
                    {projectStage.objective[locale]}
                  </dd>
                </div>
                <div className="border-l-2 border-brand-orange pl-3">
                  <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {copy.expectedEvidence}
                  </dt>
                  <dd className="mt-1 break-words text-sm leading-snug">
                    {projectStage.evidence[locale]}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {copy.syntheticOnly}
              </p>
            </details>
          </div>

          <div className="min-w-0 p-2 sm:p-4">
            <ol
              className="grid min-w-0 grid-cols-3 gap-1"
              aria-label={copy.title}
              aria-describedby={`${headingId}-sequence-help`}
            >
              {BEATS.map((beat, index) => {
                const available =
                  controlsEnabled &&
                  (allComplete || beat.firstStep <= firstIncompleteStep);
                const selected = index === currentBeatIndex;
                const complete = beatCompletion[index] ?? false;
                const label = copy.beats[beat.id];
                const status = complete
                  ? copy.stepComplete
                  : available
                    ? copy.stepIncomplete
                    : copy.stepLocked;
                return (
                  <li key={beat.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={!available}
                      aria-disabled={!available}
                      onClick={() => {
                        if (available) {
                          setActivePanel(
                            getBeatTargetStep(beat, stepCompletion),
                          );
                        }
                      }}
                      aria-current={selected ? "step" : undefined}
                      aria-label={`${label}: ${status}${
                        selected ? `, ${copy.current}` : ""
                      }`}
                      className={cn(
                        "flex min-h-11 w-full min-w-0 items-center justify-center gap-2 border-b-[3px] px-2 py-1.5 text-center outline-none transition-[border-color,color,background-color] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                        selected
                          ? "border-brand-orange bg-foreground text-background"
                          : complete
                            ? "border-risk-green bg-risk-green/10 text-foreground"
                            : available
                              ? "border-brand-orange bg-background text-foreground hover:bg-brand-orange/10"
                              : "cursor-not-allowed border-border bg-card text-foreground/70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-xs font-black",
                          selected
                            ? "border-[#ffc6aa] text-[#ffc6aa]"
                            : complete
                              ? "border-risk-green text-risk-green"
                              : "border-brand-orange text-brand-orange-dark",
                        )}
                        aria-hidden="true"
                      >
                        {complete ? "OK" : String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 max-w-full font-mono text-xs font-black uppercase tracking-[0.06em] [overflow-wrap:anywhere]">
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-2 font-mono text-xs font-black uppercase tracking-[0.1em] text-muted-foreground"
            >
              {copy.currentStep}:{" "}
              {String(displayActivePanel + 1).padStart(2, "0")}/
              {String(STEP_IDS.length).padStart(2, "0")} ·{" "}
              {copy.steps[currentStepId]}
            </p>
            <p id={`${headingId}-sequence-help`} className="sr-only">
              {copy.locked}. {copy.predictionHint}
            </p>
            {!controlsEnabled ? (
              <p
                role="status"
                className="mt-3 border-l-4 border-brand-orange bg-brand-orange/10 p-4 text-sm font-bold leading-relaxed"
              >
                {ownerReady ? copy.stageLocked : copy.ownerRequired}
              </p>
            ) : null}

            <div className="mt-3 min-w-0 border-t-2 border-foreground pt-4">
              {displayActivePanel === 0 ? (
                <div>
                  <StepHeading
                    ref={panelHeadingRef}
                    tabIndex={-1}
                    className="max-w-[62ch] text-balance text-lg font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
                  >
                    {profile.predictionPrompt[locale]}
                  </StepHeading>
                  <p className="mt-2 max-w-[72ch] text-[13px] leading-snug text-muted-foreground sm:mt-3 sm:text-sm sm:leading-relaxed">
                    <span className="sm:hidden">
                      {copy.predictionHintCompact}
                    </span>
                    <span className="hidden sm:inline">
                      {copy.predictionHint}
                    </span>
                  </p>
                  <fieldset
                    className="mt-3 grid gap-3 sm:mt-5"
                    disabled={displayState.revealed || !controlsEnabled}
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
                    }}
                  >
                    <legend className="sr-only">
                      {profile.predictionPrompt[locale]}
                    </legend>
                    {profile.predictionChoices.map((entry, index) => (
                      <label
                        key={entry.id}
                        data-lesson-prediction-choice
                        className={cn(
                          "relative flex min-h-14 min-w-0 cursor-pointer items-start gap-3 border-2 p-3 transition-[border-color,background-color,transform] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-orange has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background sm:p-4",
                          displayState.predictionId === entry.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:-translate-y-0.5 hover:border-brand-orange",
                          displayState.revealed && "cursor-default",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${headingId}-prediction`}
                          value={entry.id}
                          checked={displayState.predictionId === entry.id}
                          onChange={() =>
                            updateState((current) => ({
                              ...current,
                              predictionId: entry.id,
                            }))
                          }
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand-orange)]"
                        />
                        <span className="min-w-0 break-words text-sm font-bold leading-relaxed">
                          <span className="mr-2 font-mono text-xs opacity-70">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {entry.label[locale]}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <div
                    ref={signalRef}
                    id={signalId}
                    tabIndex={-1}
                    hidden={!displayState.revealed}
                    className="mt-5 border-l-4 border-brand-orange bg-brand-orange/10 p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                  >
                    {displayState.revealed ? (
                      <>
                        <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-brand-orange-dark">
                          {copy.committed}: {predictedLabel}
                        </p>
                        <p className="mt-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground">
                          {copy.revealed}
                        </p>
                        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed">
                          {profile.revealedSignal[locale]}
                        </p>
                      </>
                    ) : null}
                  </div>
                  {!displayState.revealed ? (
                    <button
                      type="button"
                      disabled={
                        displayState.predictionId === null || !controlsEnabled
                      }
                      aria-controls={signalId}
                      onClick={revealPrediction}
                      className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-brand-orange px-5 font-mono text-xs font-black uppercase tracking-[0.1em] text-white outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-card disabled:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {copy.reveal}
                    </button>
                  ) : null}
                  {stepCompletion[0] ? renderContinue(1) : null}
                </div>
              ) : null}

              {displayActivePanel === 1 ? (
                <div>
                  <StepHeading
                    ref={panelHeadingRef}
                    tabIndex={-1}
                    className="max-w-[62ch] text-balance text-xl font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
                  >
                    {profile.manipulation[locale]}
                  </StepHeading>
                  <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                    {copy.manipulateRequired}
                  </p>
                  {displayState.manipulated ? (
                    <div
                      role="status"
                      className="mt-5 border-l-4 border-risk-green bg-risk-green/10 p-4 text-sm font-semibold"
                    >
                      {copy.manipulated}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!controlsEnabled}
                    onClick={() => {
                      if (!controlsEnabled) return;
                      updateState((current) => ({
                        ...current,
                        workspaceOpened: true,
                      }));
                      onOpenWorkspace();
                    }}
                    aria-controls={workspaceId}
                    aria-expanded={workspaceActive}
                    className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-foreground px-5 font-mono text-xs font-black uppercase tracking-[0.1em] text-background outline-none hover:border-brand-orange hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {workspaceActive ? copy.workspaceOpen : copy.openWorkspace}:{" "}
                    {profile.instrument[locale]}
                  </button>
                  {stepCompletion[1] ? renderContinue(2) : null}
                </div>
              ) : null}

              {displayActivePanel === 2 ? (
                <div>
                  <StepHeading
                    ref={panelHeadingRef}
                    tabIndex={-1}
                    className="max-w-[62ch] text-balance text-xl font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
                  >
                    {copy.steps.run}: {profile.instrument[locale]}
                  </StepHeading>
                  <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                    {copy.runRequired}
                  </p>
                  {stepCompletion[2] ? (
                    <div
                      role="status"
                      className="mt-5 border-l-4 border-risk-green bg-risk-green/10 p-4 text-sm font-semibold"
                    >
                      {copy.runComplete}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!controlsEnabled}
                    onClick={onOpenWorkspace}
                    aria-controls={workspaceId}
                    aria-expanded={workspaceActive}
                    className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-foreground px-5 font-mono text-xs font-black uppercase tracking-[0.1em] text-background outline-none hover:border-brand-orange hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {copy.runInstrument}: {profile.instrument[locale]}
                  </button>
                  {stepCompletion[2] ? renderContinue(3) : null}
                </div>
              ) : null}

              {displayActivePanel === 3 ? (
                <div>
                  <ChoiceProbe
                    headingLevel={stepHeadingLevel}
                    headingRef={panelHeadingRef}
                    probe={profile.evidence}
                    locale={locale}
                    selectedId={displayState.evidenceId}
                    correctCopy={copy.correct}
                    incorrectCopy={copy.incorrect}
                    onSelect={(evidenceId) => {
                      setRetrievalRecall("");
                      setRetrievalRecallCommitted(false);
                      setRetrievalDue(true);
                      updateState((current) =>
                        clearRetrievalRecord({ ...current, evidenceId }),
                      );
                    }}
                  />
                  {stepCompletion[3] ? renderContinue(4) : null}
                </div>
              ) : null}

              {displayActivePanel === 5 ? (
                <div>
                  {!retrievalRecallCommitted && retrievalNeedsAttempt ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        commitRetrievalRecall();
                      }}
                    >
                      <StepHeading
                        ref={panelHeadingRef}
                        tabIndex={-1}
                        className="max-w-[62ch] text-balance text-xl font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
                      >
                        {copy.retrievalRecall}
                      </StepHeading>
                      <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                        {copy.retrievalRecallPrompt}
                      </p>
                      <label
                        htmlFor={`${headingId}-retrieval-recall`}
                        className="mt-5 block font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground"
                      >
                        {copy.retrievalRecall}
                      </label>
                      <textarea
                        id={`${headingId}-retrieval-recall`}
                        value={retrievalRecall}
                        required
                        minLength={RETRIEVAL_RECALL_MIN_LENGTH}
                        maxLength={RETRIEVAL_RECALL_MAX_LENGTH}
                        autoComplete="off"
                        aria-describedby={`${headingId}-retrieval-recall-hint`}
                        onChange={(event) =>
                          setRetrievalRecall(event.target.value)
                        }
                        className="mt-2 min-h-28 w-full resize-y border-2 border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30"
                      />
                      <p
                        id={`${headingId}-retrieval-recall-hint`}
                        className="mt-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        {copy.retrievalRecallHint} {copy.localBoundary}{" "}
                        {copy.syntheticOnly}
                      </p>
                      <button
                        type="submit"
                        disabled={!controlsEnabled || !retrievalRecallReady}
                        className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-brand-orange px-5 font-mono text-xs font-black uppercase tracking-[0.1em] text-white outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-card disabled:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {copy.retrievalRecallCommit}
                      </button>
                    </form>
                  ) : retrievalRecallCommitted ? (
                    <>
                      <p
                        role="status"
                        className="mb-5 border-l-4 border-foreground bg-card p-4 text-sm font-semibold"
                      >
                        {copy.retrievalRecallCommitted}
                      </p>
                      <ChoiceProbe
                        headingLevel={stepHeadingLevel}
                        headingRef={panelHeadingRef}
                        probe={profile.retrieval}
                        locale={locale}
                        selectedId={displayState.retrievalId}
                        correctCopy={copy.correct}
                        incorrectCopy={copy.misconception}
                        feedback={
                          displayState.retrievalId !== null &&
                          !currentRetrievalCorrect
                            ? retrievalMisconception?.repair[locale]
                            : undefined
                        }
                        locked={displayState.retrievalId !== null}
                        onSelect={commitRetrievalChoice}
                      />
                      {displayState.retrievalId !== null ? (
                        <div className="mt-5 border-2 border-foreground/20 bg-card p-4 text-sm leading-relaxed">
                          <p className="font-black">
                            {copy.firstRetrievalChoice}: {firstRetrievalChoice}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {displayState.retrievalAttemptCount}{" "}
                            {copy.retrievalAttempts}.{" "}
                            {copy.retrievalChoiceLocked}
                          </p>
                        </div>
                      ) : null}
                      {displayState.retrievalId !== null &&
                      !currentRetrievalCorrect ? (
                        <button
                          type="button"
                          onClick={beginRetrievalRepair}
                          className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center text-center [overflow-wrap:anywhere] border-2 border-foreground bg-foreground px-5 font-mono text-xs font-black uppercase tracking-[0.1em] text-background outline-none hover:border-brand-orange hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {copy.repairRetrieval}
                        </button>
                      ) : null}
                      {currentRetrievalCorrect ? (
                        <div
                          role="status"
                          className="mt-5 border-l-4 border-risk-green bg-risk-green/10 p-4 text-sm font-semibold"
                        >
                          {copy.nextRetrieval}: {retrievalIntervalDays}{" "}
                          {retrievalIntervalUnit}.
                        </div>
                      ) : null}
                      {stepCompletion[5] && currentRetrievalCorrect
                        ? renderContinue(6)
                        : null}
                    </>
                  ) : (
                    <div>
                      <StepHeading
                        ref={panelHeadingRef}
                        tabIndex={-1}
                        className="max-w-[62ch] text-balance text-xl font-black leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-2xl"
                      >
                        {copy.retrievalRecall}
                      </StepHeading>
                      <p
                        role="status"
                        className="mt-5 border-l-4 border-risk-green bg-risk-green/10 p-4 text-sm font-semibold"
                      >
                        {retrievalDue
                          ? copy.retrievalDue
                          : `${copy.nextRetrieval}: ${retrievalIntervalDays} ${retrievalIntervalUnit}.`}
                      </p>
                      {stepCompletion[5] ? renderContinue(6) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {displayActivePanel === 4 ? (
                <div>
                  {predictedLabel ? (
                    <p className="mb-5 border-l-4 border-foreground bg-card p-4 text-sm">
                      <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-brand-orange-dark">
                        {copy.committed}
                      </span>
                      <span className="mt-1 block font-bold">
                        {predictedLabel}
                      </span>
                    </p>
                  ) : null}
                  <ChoiceProbe
                    headingLevel={stepHeadingLevel}
                    headingRef={panelHeadingRef}
                    probe={profile.revision}
                    locale={locale}
                    selectedId={displayState.revisionId}
                    correctCopy={copy.correct}
                    incorrectCopy={copy.incorrect}
                    onSelect={(revisionId) =>
                      updateState((current) => ({
                        ...clearRetrievalRecord(current),
                        revisionId,
                      }))
                    }
                  />
                  <div className="mt-5">
                    <label
                      htmlFor={`${headingId}-scratch`}
                      className="font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground"
                    >
                      {copy.scratch}
                    </label>
                    <textarea
                      id={`${headingId}-scratch`}
                      value={scratch}
                      maxLength={280}
                      onChange={(event) => setScratch(event.target.value)}
                      aria-describedby={`${headingId}-scratch-hint`}
                      className="mt-2 min-h-24 w-full resize-y border-2 border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30"
                    />
                    <p
                      id={`${headingId}-scratch-hint`}
                      className="mt-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      {copy.scratchHint} {copy.syntheticOnly}
                    </p>
                  </div>
                  {stepCompletion[4] ? renderContinue(5) : null}
                </div>
              ) : null}

              {displayActivePanel === 6 ? (
                <div>
                  <div className="mb-5 border-2 border-foreground bg-card p-4">
                    <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-brand-orange-dark">
                      {copy.transferCase}
                    </p>
                    <p className="mt-2 max-w-[72ch] text-sm leading-relaxed">
                      {profile.transferScenario[locale]}
                    </p>
                  </div>
                  <ChoiceProbe
                    headingLevel={stepHeadingLevel}
                    headingRef={panelHeadingRef}
                    probe={profile.transfer}
                    locale={locale}
                    selectedId={displayState.transferId}
                    correctCopy={copy.correct}
                    incorrectCopy={copy.incorrect}
                    onSelect={(transferId) =>
                      updateState((current) => ({
                        ...current,
                        transferId,
                      }))
                    }
                  />
                  {allComplete ? (
                    <div
                      role="status"
                      className="mt-5 border-2 border-risk-green bg-risk-green/10 p-5"
                    >
                      <p className="font-black">{copy.complete}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {completedBeatCount}/{BEATS.length} {copy.progress}.{" "}
                        {copy.localBoundary}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={resetMission}
                disabled={!missionResetEnabled}
                title={missionResetEnabled ? copy.resetLabel : copy.resetLocked}
                className="min-h-11 border border-border px-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground outline-none hover:border-brand-orange hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {missionResetEnabled ? copy.reset : copy.resetLocked}
              </button>
            </div>
            {resetFailed ? (
              <p
                role="alert"
                className="mt-3 border-l-4 border-destructive bg-destructive/10 p-3 text-sm font-semibold leading-relaxed text-destructive"
              >
                {copy.resetFailed}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
