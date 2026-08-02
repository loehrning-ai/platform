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
import { MarkdownRenderer } from "@/components/course/kurs/markdown-renderer";
import { LegalClaimBadge } from "@/components/legal-claim-badge";
import { LessonQuiz } from "@/components/course/kurs/lesson-quiz";
import {
  saveLessonQuizScore,
  getLessonQuizScore,
  markCapstoneSubmitted,
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
import { subscribe } from "@/lib/progress/store";

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
}

export function AiNativeLessonReader({
  module,
  lesson,
  prevLesson,
  nextLesson,
  allModuleLessonIds,
}: Props): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readSet, setReadSet] = useState<ReadonlySet<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showModuleBanner, setShowModuleBanner] = useState(false);
  const [quizBestScore, setQuizBestScore] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [capstoneSubmitted, setCapstoneSubmitted] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  // The capstone brief is the lesson that unlocks the certificate via the
  // capstone path (shared course architecture). Submitting it sets the unified
  // store's capstone flag, which makes `isCertificateEligible("ai-native")`
  // true even without passing the workshop quiz.
  const isCapstoneLesson = lesson.id === "modul_4_lesson_7";

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
      setCapstoneSubmitted(isCapstoneSubmitted("ai-native"));
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

  function handleCapstoneSubmit() {
    markCapstoneSubmitted("ai-native");
    setCapstoneSubmitted(true);
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
        <span>Tastatur</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">j</kbd>
        <span>nächster</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">k</kbd>
        <span>voriger</span>
        <kbd className="rounded-none border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">Space</kbd>
        <span>gelesen · weiter</span>
      </div>

      {/* "after-intro" widget slot (above sections, below voice anchor) */}
      {afterIntroWidgets.length > 0 && (
        <div className="mt-10 space-y-6">
          {afterIntroWidgets.map((w, i) => (
            <WidgetSlot
              key={`intro-${w.kind}-${i}`}
              widget={w}
              label="after-intro"
            />
          ))}
        </div>
      )}

      {/* Sections — all server-rendered; client progressive-reveals */}
      <article
        id="lesson-body"
        tabIndex={0}
        aria-label="Lektionsinhalt mit Tastenkürzeln"
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
              data-state={
                isLocked ? "locked" : isCurrent ? "current" : "done"
              }
              aria-hidden={isLocked ? "true" : "false"}
              className={cn(
                "transition-opacity duration-500",
                isLocked && "pointer-events-none select-none opacity-0",
              )}
              style={isLocked ? { visibility: "hidden", maxHeight: 0 } : undefined}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                Abschnitt {String(i + 1).padStart(2, "0")}
                {isRead && (
                  <span className="ml-2 inline-flex items-center gap-1 text-brand-sand">
                    <CheckCircle2 size={11} />
                    <span className="font-mono text-[10px]">gelesen</span>
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
                    Kern-Insight
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
                      aria-label={`Abschnitt ${i + 1} als gelesen markieren`}
                    >
                      <Circle size={14} />
                      Als gelesen markieren
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
                      Gelesen
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
                        Weiter <ArrowRight size={12} />
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
                        Lektion abschließen <CheckCircle2 size={12} />
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
                Lektion abgeschlossen
              </p>
            </div>
            <p className="mt-2 text-[14px] leading-[1.55] text-foreground">
              Super. Fortschritt ist gespeichert, du kannst jederzeit zurückkommen.
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
            Capstone-Rubrik abgeschlossen?
          </h3>
          {capstoneSubmitted ? (
            <>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
                Deine Capstone-Rubrik ist lokal als vollständig markiert. Damit
                ist die Teilnahmebestätigung freigeschaltet, auch ohne das
                Workshop-Quiz.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/ai-native/kurs/zertifikat"
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  Zertifikat herunterladen <ArrowRight size={12} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
                Hast du einen Workflow nach dem Capstone-Brief anhand der Rubrik
                dokumentiert und geprüft? Markiere die Rubrik als vollständig, um
                die Teilnahmebestätigung freizuschalten. Alternativ reicht das
                bestandene Workshop-Quiz.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCapstoneSubmit}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                >
                  Rubrik als vollständig markieren <CheckCircle2 size={12} />
                </button>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                Damit bestätigst du dir selbst, die Aufgabe durchgearbeitet zu haben. Eine externe Prüfung findet nicht statt.
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
            ◆ Verständnis-Check
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
            Kurzes Quiz zu dieser Lektion
          </h3>
          <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
            {quiz.length} {quiz.length === 1 ? "Frage" : "Fragen"}. Sofortiges
            Feedback, beliebig oft wiederholbar. Dein bestes Ergebnis wird
            gespeichert.
          </p>
          <div className="mt-6">
            <LessonQuiz
              questions={quiz}
              bestScore={quizBestScore}
              onComplete={handleQuizComplete}
            />
          </div>
        </m.div>
      )}

      {/* "end" widget slot */}
      {endWidgets.length > 0 && (
        <div className="mt-10 space-y-6">
          {endWidgets.map((w, i) => (
            <WidgetSlot key={`end-${w.kind}-${i}`} widget={w} label="end" />
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
              ◆ Modul {module.number} abgeschlossen
            </p>
            <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground">
              {module.title}. <span className="text-brand-orange">✓</span>
            </h3>
            <p className="mt-2 max-w-[640px] text-[14.5px] leading-[1.55] text-muted-foreground">
              Alle {allModuleLessonIds.length} Lektionen dieses Moduls erledigt.
              Du kannst jetzt zum nächsten Modul weitergehen, oder ein anderes
              Thema wählen.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/ai-native"
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
              >
                Zurück zur Übersicht <ArrowRight size={12} />
              </Link>
              {nextLesson && (
                <Link
                  href={`/ai-native/kurs/${module.id}/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 border border-foreground bg-transparent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Nächste Lektion <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Prev / Next */}
      <nav className="mt-14 grid gap-6 sm:grid-cols-2">
        {prevLesson ? (
          <Link
            href={`/ai-native/kurs/${module.id}/${prevLesson.id}`}
            className="group block border-t border-border py-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <ArrowLeft size={11} className="mr-1 inline" />
              Vorher · {prevLesson.number}
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
            href={`/ai-native/kurs/${module.id}/${nextLesson.id}`}
            className="group block border-t border-border py-5 text-right"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-orange">
              Nächstes · {nextLesson.number}
              <ArrowRight size={11} className="ml-1 inline" />
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-orange">
              {nextLesson.title}
            </p>
          </Link>
        ) : (
          <Link
            href={`/ai-native/kurs/${module.id}`}
            className="group block border-t border-border py-5 text-right"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-orange">
              Zurück zum Modul
              <ArrowRight size={11} className="ml-1 inline" />
            </p>
            <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground">
              Modul {module.number} Übersicht
            </p>
          </Link>
        )}
      </nav>
    </>
  );
}

function WidgetSlot({
  widget,
  label,
}: {
  readonly widget: Widget;
  readonly label: string;
}): JSX.Element {
  return (
    <div
      data-widget-slot={label}
      data-widget-kind={widget.kind}
      className="mt-6"
    >
      <RenderWidget kind={widget.kind} props={widget.props ?? {}} />
    </div>
  );
}
