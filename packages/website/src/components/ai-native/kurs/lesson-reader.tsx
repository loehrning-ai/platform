"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import {
  LessonProofCheckpoint,
  LessonSectionCheckpoint,
} from "@/components/course/lesson-proof-checkpoint";
import { LegalClaimBadge } from "@/components/legal-claim-badge";
import { LessonQuiz } from "@/components/course/kurs/lesson-quiz";
import {
  isEvidenceBackedLessonCompleted,
  recordLessonCompletionEvidenceDurably,
  saveLessonQuizScore,
  getLessonQuizScore,
  isAppliedProjectCompleted,
  isCapstoneSubmitted,
} from "@/lib/progress";
import {
  RenderWidget,
  resolveWidgetsForSlot,
} from "@/components/widgets/registry";
import {
  markSectionRead,
  getReadSectionIds,
  notifyModuleCompleted,
} from "@/lib/ai-native/progress";
import type {
  AiNativeLesson,
  AiNativeModule,
  Widget,
  ModuleId,
} from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";

export function areLessonSectionsReady(
  sectionIds: readonly string[],
  persistedReadSectionIds: ReadonlySet<string>,
): boolean {
  return sectionIds.every((sectionId) =>
    persistedReadSectionIds.has(sectionId),
  );
}

export function canPersistAiNativeLessonCompletion(
  sectionIds: readonly string[],
  persistedReadSectionIds: ReadonlySet<string>,
  hasKnowledgeCheck: boolean,
  knowledgeCheckComplete: boolean,
  appliedProofComplete: boolean,
): boolean {
  if (!areLessonSectionsReady(sectionIds, persistedReadSectionIds)) {
    return false;
  }
  return hasKnowledgeCheck ? knowledgeCheckComplete : appliedProofComplete;
}

export type AiNativeProjectStatus =
  "verified-project" | "legacy-capstone" | "pending";

export function resolveAiNativeProjectStatus(
  appliedProjectCompleted: boolean,
  legacyCapstoneSubmitted: boolean,
): AiNativeProjectStatus {
  if (appliedProjectCompleted) return "verified-project";
  if (legacyCapstoneSubmitted) return "legacy-capstone";
  return "pending";
}
import { subscribe } from "@/lib/progress/store";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import {
  getOwnerRequiredHint,
  persistForActiveLearningOwner,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
import { LessonDemoLinks } from "@/components/course/lesson-demo-links";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";

/**
 * AiNativeLessonReader — open lesson reader with explicit evidence gates.
 *
 * Behavior:
 *   - All sections are server-rendered (for SEO + crawlers).
 *   - On mount, we read localStorage progress and set the keyboard focus index
 *     to the first unreviewed section.
 *   - Every section stays visible. Section checkpoints only preserve resume
 *     navigation; they do not establish lesson completion or mastery.
 *   - Widget slots render between sections per the lesson's `widgets` array.
 *   - Completion is recorded only after all section checkpoints plus either a
 *     completed knowledge check or the quizless lesson's transfer proof.
 *
 * Hydration strategy: server renders everything with data-reveal-index=0.
 * Client state changes only after the browser learning owner is verified;
 * pre-hydration storage reads would expose another account on shared devices.
 *
 * See AI-native lesson system.
 */

interface Props {
  readonly module: AiNativeModule;
  readonly lesson: AiNativeLesson;
  readonly prevLesson: AiNativeLesson | null;
  readonly nextLesson: AiNativeLesson | null;
  readonly allModuleLessonIds: readonly string[];
  readonly locale?: Locale;
}

function AiNativeLessonReaderContent({
  module,
  lesson,
  prevLesson,
  nextLesson,
  allModuleLessonIds,
  locale = "de",
}: Props): JSX.Element {
  const copy =
    locale === "en"
      ? {
          keyboard: "Keyboard",
          next: "next",
          previous: "previous",
          reviewShortcut: "review section",
          readerLabel: "Lesson content with keyboard shortcuts",
          lessonNavigationLabel: "Lesson navigation",
          section: "Section",
          keyTakeaway: "Key point",
          lessonComplete: "Navigation checkpoint saved",
          progressSaved:
            "The lesson route is recorded. This is not a mastery assessment or credential.",
          proofPrerequisite: "Confirm every section as reviewed first.",
          capstoneQuestion: "Applied project recorded?",
          capstoneComplete:
            "Your applied project evidence is stored in learning progress. It is not a server-attested completion record and does not replace the workshop quiz.",
          legacyCapstoneQuestion: "Historical capstone self-review recorded",
          legacyCapstoneComplete:
            "Your earlier capstone self-review remains an accepted certificate signal after every lesson is complete. It does not verify the new applied project artifact.",
          downloadRecord: "Download completion record",
          takeQuiz: "Complete workshop quiz",
          capstonePrompt:
            "Complete the course workspace and its verification gate. This status updates only after the project produces a checked artifact.",
          markRubric: "Open applied project",
          selfReport:
            "Reading completion or self-reporting does not satisfy the applied-project requirement.",
          knowledgeCheck: "Knowledge check",
          lessonQuiz: "Short lesson quiz",
          quizIntro: (count: number) =>
            `${count} ${count === 1 ? "question" : "questions"}. Immediate feedback, repeatable. The best result is stored.`,
          moduleComplete: (number: number) => `Module ${number} complete`,
          moduleBody: (count: number) =>
            `All ${count} lessons in this module are complete. Continue to the next module or return to the overview.`,
          overview: "Back to overview",
          nextLesson: "Next lesson",
          previousShort: "Previous",
          nextShort: "Next",
          backModule: "Back to module",
          moduleOverview: (number: number) => `Module ${number} overview`,
        }
      : {
          keyboard: "Tastatur",
          next: "nächster",
          previous: "voriger",
          reviewShortcut: "Abschnitt geprüft",
          readerLabel: "Lektionsinhalt mit Tastenkürzeln",
          lessonNavigationLabel: "Lektionsnavigation",
          section: "Abschnitt",
          keyTakeaway: "Kernaussage",
          lessonComplete: "Navigations-Checkpoint gespeichert",
          progressSaved:
            "Die Lektionsroute ist erfasst. Das ist keine Kompetenzprüfung und kein Nachweis.",
          proofPrerequisite: "Bestätige zuerst jeden Abschnitt als geprüft.",
          capstoneQuestion: "Angewandtes Projekt gespeichert?",
          capstoneComplete:
            "Deine Projektnachweise sind im Lernfortschritt gespeichert. Sie sind kein serverbestätigter Abschlussnachweis und ersetzen das Workshop-Quiz nicht.",
          legacyCapstoneQuestion: "Frühere Capstone-Selbstprüfung gespeichert",
          legacyCapstoneComplete:
            "Deine frühere Capstone-Selbstprüfung bleibt nach Abschluss aller Lektionen als Abschlussweg gültig. Sie bestätigt nicht das neue angewandte Projektartefakt.",
          downloadRecord: "Teilnahmebestätigung herunterladen",
          takeQuiz: "Workshop-Quiz abschließen",
          capstonePrompt:
            "Schließe den Kurs-Workspace und seine Prüfschranke ab. Der Status ändert sich erst, wenn das Projekt ein geprüftes Artefakt erzeugt.",
          markRubric: "Angewandtes Projekt öffnen",
          selfReport:
            "Lesefortschritt oder Selbstbestätigung erfüllen die Projektanforderung nicht.",
          knowledgeCheck: "Verständnis-Check",
          lessonQuiz: "Kurzes Quiz zu dieser Lektion",
          quizIntro: (count: number) =>
            `${count} ${count === 1 ? "Frage" : "Fragen"}. Sofortiges Feedback, beliebig oft wiederholbar. Das beste Ergebnis wird gespeichert.`,
          moduleComplete: (number: number) => `Modul ${number} abgeschlossen`,
          moduleBody: (count: number) =>
            `Alle ${count} Lektionen dieses Moduls sind erledigt. Gehe zum nächsten Modul oder zurück zur Übersicht.`,
          overview: "Zurück zur Übersicht",
          nextLesson: "Nächste Lektion",
          previousShort: "Vorher",
          nextShort: "Nächstes",
          backModule: "Zurück zum Modul",
          moduleOverview: (number: number) => `Modul ${number} Übersicht`,
        };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readSet, setReadSet] = useState<ReadonlySet<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [readyLessonId, setReadyLessonId] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const [completed, setCompleted] = useState(false);
  const [showModuleBanner, setShowModuleBanner] = useState(false);
  const [quizBestScore, setQuizBestScore] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [legacyCapstoneSubmitted, setLegacyCapstoneSubmitted] = useState(false);
  const [appliedProjectCompleted, setAppliedProjectCompleted] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const progressIdentity = `ai-native:${lesson.id}`;
  const readiness = useOwnerAwareProgressReadiness(
    progressIdentity,
    readyLessonId === lesson.id ? progressIdentity : null,
    loadedOwnerGeneration,
  );

  // The historical capstone lesson explains the alternative certificate path.
  // Its former self-report control is gone. Historical self-reviews remain a
  // certificate compatibility signal, while the shared studio persists the
  // new verified project as an exact exercise result.
  const isCapstoneLesson = lesson.id === "modul_4_lesson_7";
  const projectStatus = resolveAiNativeProjectStatus(
    readiness.interactionReady && appliedProjectCompleted,
    readiness.interactionReady && legacyCapstoneSubmitted,
  );

  const sections = lesson.sections;
  const quiz = lesson.quiz ?? [];
  const widgets = useMemo(() => lesson.widgets ?? [], [lesson.widgets]);
  const afterIntroWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "after-intro"),
    [widgets],
  );
  const beforeQuizWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "before-quiz"),
    [widgets],
  );
  const endWidgets = useMemo(
    () => resolveWidgetsForSlot(widgets, "end"),
    [widgets],
  );

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const loadOwnedProgress = () => {
      const owner = getLearningOwnerContext();
      const resolved = owner.kind !== "unknown";
      setMounted(true);
      const read = resolved ? getReadSectionIds(lesson.id) : new Set<string>();
      setReadSet(read);
      const firstUnread = sections.findIndex((s) => !read.has(s.id));
      setCurrentIndex(firstUnread === -1 ? sections.length - 1 : firstUnread);
      const bestScore = resolved
        ? getLessonQuizScore("ai-native", lesson.id)
        : null;
      setCompleted(
        resolved && isEvidenceBackedLessonCompleted("ai-native", lesson.id),
      );
      setQuizBestScore(bestScore);
      setLegacyCapstoneSubmitted(resolved && isCapstoneSubmitted("ai-native"));
      setAppliedProjectCompleted(
        resolved && isAppliedProjectCompleted("ai-native"),
      );
      setShowModuleBanner(false);
      setLoadedOwnerGeneration(owner.generation);
      setReadyLessonId(lesson.id);
    };
    loadOwnedProgress();
    return subscribe(loadOwnedProgress);
  }, [lesson.id, quiz.length, sections]);

  function markReviewed(sectionId: string, sectionIndex: number) {
    if (!readiness.interactionReady) return;
    const persisted = persistForActiveLearningOwner(
      () =>
        markSectionRead(
          module.id as ModuleId,
          lesson.id,
          sectionId,
          sectionIndex,
        ),
      () => getReadSectionIds(lesson.id).has(sectionId),
    );
    if (!persisted) return;
    const persistedReadIds = getReadSectionIds(lesson.id);
    setReadSet(persistedReadIds);

    if (quiz.length > 0 && getLessonQuizScore("ai-native", lesson.id)) {
      finalizeLesson(
        { knowledgeCheckComplete: true, appliedProofComplete: false },
        persistedReadIds,
      );
    }
  }

  function focusSection(idx: number) {
    const el = sectionRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.querySelector<HTMLHeadingElement>("h2")?.focus({ preventScroll: true });
  }

  function handleReaderKeyDown(e: ReactKeyboardEvent<HTMLElement>) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isInteractiveShortcutTarget(e.target, e.currentTarget)) return;

    switch (e.key) {
      case "j":
      case "J":
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, sections.length - 1);
        if (next !== currentIndex) {
          setCurrentIndex(next);
          window.setTimeout(() => focusSection(next), 60);
        }
        break;
      }
      case "k":
      case "K":
      case "ArrowUp": {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        if (prev !== currentIndex) {
          setCurrentIndex(prev);
          window.setTimeout(() => focusSection(prev), 60);
        }
        break;
      }
      case " ": {
        e.preventDefault();
        if (!mounted) return;
        const section = sections[currentIndex];
        if (!section) return;
        if (!readSet.has(section.id)) {
          markReviewed(section.id, currentIndex);
          return;
        }
        const next = Math.min(currentIndex + 1, sections.length - 1);
        if (next !== currentIndex) {
          setCurrentIndex(next);
          window.setTimeout(() => focusSection(next), 60);
        }
        break;
      }
    }
  }

  function finalizeLesson(
    evidence: {
      readonly knowledgeCheckComplete: boolean;
      readonly appliedProofComplete: boolean;
    },
    persistedReadIds = getReadSectionIds(lesson.id),
  ) {
    if (
      !canPersistAiNativeLessonCompletion(
        sections.map((section) => section.id),
        persistedReadIds,
        quiz.length > 0,
        evidence.knowledgeCheckComplete,
        evidence.appliedProofComplete,
      )
    ) {
      return;
    }
    const persisted = recordLessonCompletionEvidenceDurably(
      "ai-native",
      lesson.id,
    );
    if (!persisted) return;
    setCompleted(true);
    // Legacy lesson booleans do not satisfy the new module evidence boundary.
    const moduleEvidenceComplete = allModuleLessonIds.every((moduleLessonId) =>
      isEvidenceBackedLessonCompleted("ai-native", moduleLessonId),
    );
    if (moduleEvidenceComplete) {
      const completedCount = allModuleLessonIds.length;
      notifyModuleCompleted(
        module.id as ModuleId,
        completedCount,
        allModuleLessonIds.length,
      );
      setShowModuleBanner(true);
    }
  }

  function handleQuizComplete(score: number, total: number) {
    const persisted = persistForActiveLearningOwner(
      () => saveLessonQuizScore("ai-native", lesson.id, score, total),
      () => getLessonQuizScore("ai-native", lesson.id) !== null,
    );
    if (!persisted) return;
    const best = getLessonQuizScore("ai-native", lesson.id);
    setQuizBestScore(best);
    if (!best) return;
    finalizeLesson({
      knowledgeCheckComplete: true,
      appliedProofComplete: false,
    });
  }

  // For server render: always show index 0. Client hydration updates.
  const revealIndex = mounted ? currentIndex : 0;

  return (
    <Fragment key={readiness.checkpointKey}>
      {/* Keyboard shortcut hint — desktop only, visually subtle. */}
      <div
        aria-hidden="true"
        className="mt-10 hidden items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground md:flex"
      >
        <span>{copy.keyboard}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-xs text-foreground">
          j
        </kbd>
        <span>{copy.next}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-xs text-foreground">
          k
        </kbd>
        <span>{copy.previous}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-xs text-foreground">
          Space
        </kbd>
        <span>{copy.reviewShortcut}</span>
      </div>

      {/* "after-intro" widget slot (above sections, below voice anchor) */}
      {afterIntroWidgets.length > 0 && (
        <div className="mt-10 space-y-6">
          {afterIntroWidgets.map((w, i) => (
            <WidgetSlot
              key={`intro-${w.kind}-${i}`}
              widget={w}
              label="after-intro"
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* All authored sections remain visible. Checkpoints only retain the
          learner's review position; they never hide content or imply mastery. */}
      <article
        id="lesson-body"
        tabIndex={0}
        aria-label={copy.readerLabel}
        aria-keyshortcuts="J K ArrowDown ArrowUp Space"
        onKeyDown={handleReaderKeyDown}
        className="mt-12 space-y-12"
        data-current-index={revealIndex}
      >
        {sections.map((section, i) => {
          const isRead = readiness.interactionReady && readSet.has(section.id);
          const isCurrent = mounted && i === currentIndex;
          return (
            <section
              key={section.id}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
              data-section-index={i}
              data-state={isRead ? "reviewed" : isCurrent ? "current" : "open"}
              className="scroll-mt-24"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.section} {String(i + 1).padStart(2, "0")}
                {isRead && (
                  <span className="ml-2 inline-flex items-center gap-1 text-brand-sand">
                    <CheckCircle2 size={11} />
                    <span className="font-mono text-xs">
                      {locale === "de" ? "geprüft" : "reviewed"}
                    </span>
                  </span>
                )}
              </p>
              <h2
                tabIndex={-1}
                className="mt-2.5 font-bold leading-[1.15] tracking-[-0.025em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                style={{ fontSize: "clamp(1.5rem, 2.8vw, 2rem)" }}
              >
                {section.title}
              </h2>
              <div className="mt-5">
                <MarkdownRenderer content={section.content} copyable />
                {/* Legal claim badge for sections with registry-sourced legal claims (legal-source governance) */}
                {section.sources?.find((s) => s.claimId) && (
                  <LegalClaimBadge
                    claimId={section.sources.find((s) => s.claimId)!.claimId!}
                  />
                )}
              </div>
              {section.keyTakeaway && (
                <div className="mt-7 border-l-[3px] border-brand-orange bg-[var(--color-kupfer-mist)] px-6 py-5">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                    {copy.keyTakeaway}
                  </p>
                  <p className="mt-2 text-[16px] font-medium leading-[1.5] tracking-[-0.01em] text-foreground">
                    {section.keyTakeaway}
                  </p>
                </div>
              )}
              <div className="mt-6 border-t border-border pt-4">
                <LessonSectionCheckpoint
                  locale={locale}
                  checked={isRead}
                  progressReady={readiness.interactionReady}
                  onCheck={() => markReviewed(section.id, i)}
                />
              </div>
            </section>
          );
        })}
      </article>

      {/* "before-quiz" widget slot */}
      {beforeQuizWidgets.length > 0 && (
        <div className="mt-10 space-y-6">
          {beforeQuizWidgets.map((w, i) => (
            <WidgetSlot
              key={`pre-quiz-${w.kind}-${i}`}
              widget={w}
              label="before-quiz"
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Completed-lesson confirmation */}
      <AnimatePresence>
        {readiness.interactionReady && completed && quiz.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="mt-12 border-t-[3px] border-brand-orange bg-[var(--color-kupfer-mist)] px-6 py-5"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-brand-orange" />
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.lessonComplete}
              </p>
            </div>
            <p className="mt-2 text-[14px] leading-[1.55] text-foreground">
              {copy.progressSaved}
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {/* Capstone rubric completion can unlock the local participation PDF. */}
      {readiness.hydrated && isCapstoneLesson && (
        <div className="mt-12 border-2 border-foreground bg-card/40 p-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            ◆ Capstone
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
            {projectStatus === "verified-project"
              ? copy.capstoneQuestion
              : projectStatus === "legacy-capstone"
                ? copy.legacyCapstoneQuestion
                : copy.capstoneQuestion}
          </h3>
          {projectStatus === "verified-project" ? (
            <>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
                {copy.capstoneComplete}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={localizeHref("/ai-native/kurs/quiz", locale)}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground"
                >
                  {copy.takeQuiz} <ArrowRight size={12} />
                </Link>
              </div>
            </>
          ) : projectStatus === "legacy-capstone" ? (
            <>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
                {copy.legacyCapstoneComplete}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={localizeHref("/ai-native/kurs/zertifikat", locale)}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground"
                >
                  {copy.downloadRecord} <ArrowRight size={12} />
                </Link>
                <a
                  href="#course-project-studio"
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-card px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {copy.markRubric} <CheckCircle2 size={12} />
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
                {copy.capstonePrompt}
              </p>
              <div className="mt-5">
                <a
                  href="#course-project-studio"
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground"
                >
                  {copy.markRubric} <CheckCircle2 size={12} />
                </a>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {copy.selfReport}
              </p>
            </>
          )}
        </div>
      )}

      {/* The knowledge check remains visible independently of section markers.
          Submitting it is the evidence boundary for lesson completion. */}
      {readiness.hydrated && quiz.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="mt-12 border-2 border-border bg-card/40 p-6"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            ◆ {copy.knowledgeCheck}
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
            {copy.lessonQuiz}
          </h3>
          <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
            {copy.quizIntro(quiz.length)}
          </p>
          <div className="mt-6">
            <LessonQuiz
              questions={quiz}
              bestScore={readiness.interactionReady ? quizBestScore : null}
              onComplete={handleQuizComplete}
              locale={locale}
            />
          </div>
        </m.div>
      )}

      {/* The single quizless bonus lesson uses a concrete transfer decision as
          its applied evidence instead of converting section clicks into completion. */}
      {readiness.hydrated && quiz.length === 0 && (
        <div className="mt-12">
          <LessonProofCheckpoint
            key={readiness.checkpointKey}
            locale={locale}
            completed={readiness.interactionReady && completed}
            progressReady={readiness.hydrated}
            prerequisitesMet={
              readiness.ownerReady &&
              areLessonSectionsReady(
                sections.map((section) => section.id),
                readSet,
              )
            }
            prerequisiteHint={
              readiness.ownerReady
                ? copy.proofPrerequisite
                : getOwnerRequiredHint(locale)
            }
            onCommit={() =>
              finalizeLesson({
                knowledgeCheckComplete: false,
                appliedProofComplete: true,
              })
            }
          />
        </div>
      )}

      {/* "end" widget slot */}
      {endWidgets.length > 0 && (
        <div className="mt-10 space-y-6">
          {endWidgets.map((w, i) => (
            <WidgetSlot
              key={`end-${w.kind}-${i}`}
              widget={w}
              label="end"
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Module-complete banner */}
      <AnimatePresence>
        {showModuleBanner && (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="mt-12 border-2 border-brand-orange bg-brand-orange/10 p-6"
            role="status"
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              ◆ {copy.moduleComplete(module.number)}
            </p>
            <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
              {module.title}. <span className="text-brand-orange">✓</span>
            </h3>
            <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
              {copy.moduleBody(allModuleLessonIds.length)}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={localizeHref("/ai-native", locale)}
                className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground"
              >
                {copy.overview} <ArrowRight size={12} />
              </Link>
              {nextLesson && (
                <Link
                  href={localizeHref(
                    `/ai-native/kurs/${module.id}/${nextLesson.id}`,
                    locale,
                  )}
                  className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {copy.nextLesson} <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* The demo catalog binds each demo to a courseSlug + lessonId; this is the
          course those bindings point at, so the edge finally renders both ways. */}
      <LessonDemoLinks
        courseSlug="ai-native"
        lessonId={lesson.id}
        locale={locale}
      />

      {/* Prev / Next */}
      <nav
        aria-label={copy.lessonNavigationLabel}
        className="mt-12 grid gap-6 sm:grid-cols-2"
      >
        {prevLesson ? (
          <Link
            href={localizeHref(
              `/ai-native/kurs/${module.id}/${prevLesson.id}`,
              locale,
            )}
            className="group block min-h-11 border-t border-border py-5"
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <ArrowLeft size={11} className="mr-1 inline" />
              {copy.previousShort} · {prevLesson.number}
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
              {prevLesson.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link
            href={localizeHref(
              `/ai-native/kurs/${module.id}/${nextLesson.id}`,
              locale,
            )}
            className="group block min-h-11 border-t border-border py-5 text-right"
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-orange">
              {copy.nextShort} · {nextLesson.number}
              <ArrowRight size={11} className="ml-1 inline" />
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
              {nextLesson.title}
            </p>
          </Link>
        ) : (
          <Link
            href={localizeHref(`/ai-native/kurs/${module.id}`, locale)}
            className="group block min-h-11 border-t border-border py-5 text-right"
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-orange">
              {copy.backModule}
              <ArrowRight size={11} className="ml-1 inline" />
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground">
              {copy.moduleOverview(module.number)}
            </p>
          </Link>
        )}
      </nav>
    </Fragment>
  );
}

export const AiNativeLessonReader = withMotionProvider(
  AiNativeLessonReaderContent,
);

function WidgetSlot({
  widget,
  label,
  locale,
}: {
  readonly widget: Widget;
  readonly label: string;
  readonly locale: Locale;
}): JSX.Element {
  return (
    <div
      data-widget-slot={label}
      data-widget-kind={widget.kind}
      className="mt-6"
    >
      <RenderWidget
        kind={widget.kind}
        props={widget.props ?? {}}
        locale={locale}
      />
    </div>
  );
}
