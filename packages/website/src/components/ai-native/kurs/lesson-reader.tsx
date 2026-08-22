"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { LegalClaimBadge } from "@/components/legal-claim-badge";
import { LessonQuiz } from "@/components/course/kurs/lesson-quiz";
import {
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
  markLessonCompleted,
  isLessonCompleted,
  getReadSectionIds,
  areAllModuleLessonsCompleted,
  notifyModuleCompleted,
} from "@/lib/ai-native/progress";
import type {
  AiNativeLesson,
  AiNativeModule,
  Widget,
  ModuleId,
} from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";

export function canAdvanceLessonSection(
  readSectionIds: ReadonlySet<string>,
  currentSectionId: string | undefined,
): boolean {
  return currentSectionId !== undefined && readSectionIds.has(currentSectionId);
}

export function areLessonSectionsReady(
  sectionIds: readonly string[],
  persistedReadSectionIds: ReadonlySet<string>,
): boolean {
  return sectionIds.every((sectionId) =>
    persistedReadSectionIds.has(sectionId),
  );
}

export type AiNativeProjectStatus =
  | "verified-project"
  | "legacy-capstone"
  | "pending";

export function resolveAiNativeProjectStatus(
  appliedProjectCompleted: boolean,
  legacyCapstoneSubmitted: boolean,
): AiNativeProjectStatus {
  if (appliedProjectCompleted) return "verified-project";
  if (legacyCapstoneSubmitted) return "legacy-capstone";
  return "pending";
}
import { subscribe } from "@/lib/progress/store";
import { LessonDemoLinks } from "@/components/course/lesson-demo-links";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";

/**
 * AiNativeLessonReader — progressive-disclosure lesson reader.
 *
 * Behavior:
 *   - All sections are server-rendered (for SEO + crawlers).
 *   - On mount, we read localStorage progress and set `currentIndex` to
 *     the first unread section.
 *   - Sections past `currentIndex` are hidden via `data-state="locked"` +
 *     CSS. Each section has a "Gelesen ✓" button that marks it read.
 *   - The "Weiter" button advances to the next section.
 *   - Widget slots render between sections per the lesson's `widgets` array.
 *   - On completion of the last section, we mark the lesson complete +
 *     trigger module-completion detection.
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
          readContinue: "read · continue",
          readerLabel: "Lesson content with keyboard shortcuts",
          section: "Section",
          read: "read",
          keyTakeaway: "Key point",
          markSection: (number: number) => `Mark section ${number} as read`,
          markRead: "Mark as read",
          continue: "Continue",
          finishLesson: "Complete lesson",
          lessonComplete: "Lesson complete",
          progressSaved:
            "Progress is stored for your learning account. You can return later.",
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
          readContinue: "gelesen · weiter",
          readerLabel: "Lektionsinhalt mit Tastenkürzeln",
          section: "Abschnitt",
          read: "gelesen",
          keyTakeaway: "Kernaussage",
          markSection: (number: number) =>
            `Abschnitt ${number} als gelesen markieren`,
          markRead: "Als gelesen markieren",
          continue: "Weiter",
          finishLesson: "Lektion abschließen",
          lessonComplete: "Lektion abgeschlossen",
          progressSaved:
            "Der Fortschritt ist deinem Lernkonto zugeordnet. Du kannst später zurückkehren.",
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
  const [completed, setCompleted] = useState(false);
  const [showModuleBanner, setShowModuleBanner] = useState(false);
  const [quizBestScore, setQuizBestScore] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [legacyCapstoneSubmitted, setLegacyCapstoneSubmitted] = useState(false);
  const [appliedProjectCompleted, setAppliedProjectCompleted] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  // The historical capstone lesson explains the alternative certificate path.
  // Its former self-report control is gone. Historical self-reviews remain a
  // certificate compatibility signal, while the shared studio persists the
  // new verified project as an exact exercise result.
  const isCapstoneLesson = lesson.id === "modul_4_lesson_7";
  const projectStatus = resolveAiNativeProjectStatus(
    appliedProjectCompleted,
    legacyCapstoneSubmitted,
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
      setMounted(true);
      const read = getReadSectionIds(lesson.id);
      setReadSet(read);
      const firstUnread = sections.findIndex((s) => !read.has(s.id));
      setCurrentIndex(firstUnread === -1 ? sections.length - 1 : firstUnread);
      setCompleted(isLessonCompleted(lesson.id));
      setQuizBestScore(getLessonQuizScore("ai-native", lesson.id));
      setLegacyCapstoneSubmitted(isCapstoneSubmitted("ai-native"));
      setAppliedProjectCompleted(isAppliedProjectCompleted("ai-native"));
      setShowModuleBanner(false);
    };
    loadOwnedProgress();
    return subscribe(loadOwnedProgress);
  }, [lesson.id, sections]);

  function markRead(sectionId: string, sectionIndex: number) {
    markSectionRead(module.id as ModuleId, lesson.id, sectionId, sectionIndex);
    setReadSet((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }

  function advance() {
    const section = sections[currentIndex];
    if (!section) return;
    markRead(section.id, currentIndex);
    const nextIdx = Math.min(currentIndex + 1, sections.length - 1);
    setCurrentIndex(nextIdx);
    // Smooth scroll to the newly-revealed section
    setTimeout(() => {
      const el = sectionRefs.current[nextIdx];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
    // If this was the last section → finalize lesson.
    if (currentIndex === sections.length - 1) {
      finalizeLesson();
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
        const currentSection = sections[currentIndex];
        if (!canAdvanceLessonSection(readSet, currentSection?.id)) {
          focusSection(currentIndex);
          break;
        }
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
        const section = sections[currentIndex];
        if (!section) return;
        if (readSet.has(section.id)) advance();
        else markRead(section.id, currentIndex);
        break;
      }
    }
  }

  function finalizeLesson() {
    const persistedReadIds = getReadSectionIds(lesson.id);
    if (
      !areLessonSectionsReady(
        sections.map((section) => section.id),
        persistedReadIds,
      )
    ) {
      return;
    }
    if (isLessonCompleted(lesson.id)) {
      setCompleted(true);
      return;
    }
    markLessonCompleted(lesson.id);
    setCompleted(true);
    // Check if this completes the entire module.
    if (areAllModuleLessonsCompleted(allModuleLessonIds)) {
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
    saveLessonQuizScore("ai-native", lesson.id, score, total);
    setQuizBestScore((prev) =>
      prev && prev.score / prev.total >= score / total
        ? prev
        : { score, total },
    );
  }

  // For server render: always show index 0. Client hydration updates.
  const revealIndex = mounted ? currentIndex : 0;

  return (
    <>
      {/* Keyboard shortcut hint — desktop only, visually subtle. */}
      <div
        aria-hidden="true"
        className="mt-10 hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground md:flex"
      >
        <span>{copy.keyboard}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">
          j
        </kbd>
        <span>{copy.next}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">
          k
        </kbd>
        <span>{copy.previous}</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">
          Space
        </kbd>
        <span>{copy.readContinue}</span>
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

      {/* Sections — all server-rendered; client progressive-reveals */}
      <article
        id="lesson-body"
        tabIndex={0}
        aria-label={copy.readerLabel}
        aria-keyshortcuts="J K ArrowDown ArrowUp Space"
        onKeyDown={handleReaderKeyDown}
        className="mt-14 space-y-14"
        data-current-index={revealIndex}
      >
        {sections.map((section, i) => {
          const isRead = readSet.has(section.id);
          const isLocked = mounted && i > currentIndex;
          const isCurrent = mounted && i === currentIndex;
          return (
            <section
              key={section.id}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
              data-section-index={i}
              data-state={isLocked ? "locked" : isCurrent ? "current" : "done"}
              aria-hidden={isLocked ? "true" : "false"}
              className={cn(
                "transition-opacity duration-500",
                isLocked && "pointer-events-none select-none opacity-0",
              )}
              style={
                isLocked ? { visibility: "hidden", maxHeight: 0 } : undefined
              }
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.section} {String(i + 1).padStart(2, "0")}
                {isRead && (
                  <span className="ml-2 inline-flex items-center gap-1 text-brand-sand">
                    <CheckCircle2 size={11} />
                    <span className="font-mono text-[10px]">{copy.read}</span>
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
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                    {copy.keyTakeaway}
                  </p>
                  <p className="mt-2 text-[16px] font-medium leading-[1.5] tracking-[-0.01em] text-foreground">
                    {section.keyTakeaway}
                  </p>
                </div>
              )}

              {/* Per-section "mark as read" + "Weiter" gate */}
              {isCurrent && (
                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  {!isRead ? (
                    <button
                      type="button"
                      onClick={() => markRead(section.id, i)}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={copy.markSection(i + 1)}
                    >
                      <Circle size={14} />
                      {copy.markRead}
                    </button>
                  ) : (
                    <m.span
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="inline-flex items-center gap-2 text-sm text-brand-sand"
                    >
                      <CheckCircle2 size={14} />
                      {copy.read}
                    </m.span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    <span className="font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground">
                      {i + 1} / {sections.length}
                    </span>
                    {i < sections.length - 1 ? (
                      <button
                        type="button"
                        onClick={advance}
                        disabled={!isRead}
                        className={cn(
                          "inline-flex items-center gap-2 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                          isRead
                            ? "bg-brand-orange text-white shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
                            : "cursor-not-allowed bg-card text-muted-foreground opacity-50",
                        )}
                      >
                        {copy.continue} <ArrowRight size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={advance}
                        disabled={!isRead}
                        className={cn(
                          "inline-flex items-center gap-2 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                          isRead
                            ? "bg-risk-green text-white shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
                            : "cursor-not-allowed bg-card text-muted-foreground opacity-50",
                        )}
                      >
                        {copy.finishLesson} <CheckCircle2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
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
        {completed && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="mt-14 border-t-[3px] border-brand-orange bg-[var(--color-kupfer-mist)] px-6 py-5"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-brand-orange" />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
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
      {mounted && isCapstoneLesson && (
        <div className="mt-14 border-2 border-foreground bg-card/40 p-6 shadow-[4px_4px_0_0_var(--color-foreground)]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
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
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
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
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  {copy.downloadRecord} <ArrowRight size={12} />
                </Link>
                <a
                  href="#course-project-studio"
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-card px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
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
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
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

      {/* Inline lesson quiz — the questions already live in every lesson's
          JSON (BaseLesson.quiz) but were never surfaced in AI-Native.
          Reuses the shared LessonQuiz (shared course architecture). Revealed once the
          reader has worked through the lesson, mirroring the free courses. */}
      {mounted && completed && quiz.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="mt-14 border-2 border-border bg-card/40 p-6"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
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
              bestScore={quizBestScore}
              onComplete={handleQuizComplete}
              locale={locale}
            />
          </div>
        </m.div>
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
            className="mt-14 border-2 border-brand-orange bg-brand-orange/10 p-6 shadow-[4px_4px_0_0_var(--color-foreground)]"
            role="status"
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
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
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
              >
                {copy.overview} <ArrowRight size={12} />
              </Link>
              {nextLesson && (
                <Link
                  href={localizeHref(
                    `/ai-native/kurs/${module.id}/${nextLesson.id}`,
                    locale,
                  )}
                  className="inline-flex items-center gap-2 border border-foreground bg-transparent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
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
      <nav className="mt-14 grid gap-6 sm:grid-cols-2">
        {prevLesson ? (
          <Link
            href={localizeHref(
              `/ai-native/kurs/${module.id}/${prevLesson.id}`,
              locale,
            )}
            className="group block border-t border-border py-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
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
            className="group block border-t border-border py-5 text-right"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-orange">
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
            className="group block border-t border-border py-5 text-right"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-orange">
              {copy.backModule}
              <ArrowRight size={11} className="ml-1 inline" />
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground">
              {copy.moduleOverview(module.number)}
            </p>
          </Link>
        )}
      </nav>
    </>
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
      <RenderWidget kind={widget.kind} props={widget.props ?? {}} locale={locale} />
    </div>
  );
}
