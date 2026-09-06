import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n/locale";
import {
  __resetLearningOwnerForTests,
  activateAnonymousLearningOwner,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { useLessonReaderBar } from "./use-lesson-reader-bar";
import { ReaderFocusBar } from "@/components/learning/reader-focus-bar";
import { LESSON_MISSION_OPEN_TASK_EVENT } from "@/components/course-projects/focus-mission-target";

const state = vi.hoisted(() => ({
  completed: false,
  listeners: new Set<() => void>(),
}));
vi.mock("@/lib/progress/store", () => ({
  subscribe: (listener: () => void) => {
    state.listeners.add(listener);
    listener();
    return () => state.listeners.delete(listener);
  },
}));
vi.mock("@/lib/progress/completion-evidence", () => ({
  isEvidenceBackedLessonCompleted: () => state.completed,
}));

const scroll = vi.fn();
function Harness({
  locale = "de", lessonId = "mental-model", missionComplete = false,
  mission = true, collapsed = false,
}: { readonly locale?: Locale; readonly lessonId?: string;
  readonly missionComplete?: boolean; readonly mission?: boolean; readonly collapsed?: boolean }) {
  const reader = useLessonReaderBar({
    courseSlug: "claude", lessonId, ordinal: 1, total: 12, locale,
    next: { kind: "link", label: locale === "de" ? "Weiter" : "Next",
      href: locale === "de" ? "/next" : "/en/next" },
  });
  return <>
    <div ref={reader.contentRef}>
      {mission ? <section data-lesson-mission="claude" data-mission-complete={String(missionComplete)} data-mission-collapsed={String(collapsed)}>
        <div hidden={collapsed}><div data-mission-current-panel><h2 tabIndex={-1}>Current decision</h2></div></div>
      </section> : null}
      <details data-lesson-reference>
        <summary>Reference</summary>
        <section data-lesson-proof-checkpoint="open">
          <h2>Remaining task</h2><p>Review the sections before the transfer.</p>
          <textarea disabled aria-label="Transfer" />
        </section>
      </details>
    </div>
    <ReaderFocusBar {...reader.bar} action={reader.bar.next} />
  </>;
}

beforeEach(() => {
  __resetLearningOwnerForTests("anonymous");
  state.completed = false;
  state.listeners.clear();
  scroll.mockClear();
  HTMLElement.prototype.scrollIntoView = scroll;
});

describe("course-owned reader continuation", () => {
  it.each(["de", "en"] as const)("states position and delegates only the real task to its controlled mission (%s)", (locale) => {
    render(<Harness locale={locale} collapsed />);
    const openMission = vi.fn();
    document.querySelector("[data-lesson-mission]")!.addEventListener(LESSON_MISSION_OPEN_TASK_EVENT, openMission);
    expect(screen.getByText(locale === "de" ? "Lektion 1 von 12" : "Lesson 1 of 12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: locale === "de" ? "Aufgabe öffnen" : "Open task" }));
    expect(openMission).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Current decision", hidden: true })).not.toHaveFocus();
    expect(scroll).not.toHaveBeenCalled();
    expect(document.querySelector("[data-mission-current-panel]")?.parentElement).toHaveAttribute("hidden");
    expect(document.querySelector("details")).not.toHaveAttribute("open");
    expect(state.completed).toBe(false);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each([true, false])("opens the real checkpoint without enabling or completing it (mission=%s)", (mission) => {
    render(<Harness mission={mission} missionComplete />);
    fireEvent.click(screen.getByRole("button", { name: "Aufgabe öffnen" }));
    expect(document.querySelector("details")).toHaveAttribute("open");
    expect(document.querySelector("[data-lesson-proof-checkpoint]")).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Transfer" })).toBeDisabled();
    expect(scroll).toHaveBeenLastCalledWith({ block: "start", behavior: "instant" });
    expect(state.completed).toBe(false);
  });

  it("switches to next only after persisted evidence, and back after reset/rejected persistence", () => {
    render(<Harness />);
    act(() => state.listeners.forEach((listener) => listener()));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    act(() => { state.completed = true; state.listeners.forEach((listener) => listener()); });
    expect(screen.getByRole("link", { name: "Weiter" })).toHaveAttribute("href", "/next");
    expect(scroll).not.toHaveBeenCalled();
    act(() => { state.completed = false; state.listeners.forEach((listener) => listener()); });
    expect(screen.getByRole("button", { name: "Aufgabe öffnen" })).toBeInTheDocument();
  });

  it("never presents a stale owner's completed next action", () => {
    state.completed = true;
    render(<Harness />);
    expect(screen.getByRole("link", { name: "Weiter" })).toBeInTheDocument();
    act(() => { setUnknownLearningOwner(); });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    // A resolved replacement generation still cannot borrow the previous
    // subscription snapshot before its own persisted state arrives.
    act(() => { activateAnonymousLearningOwner(); });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    act(() => { state.completed = false; state.listeners.forEach((listener) => listener()); });
    expect(screen.getByRole("button", { name: "Aufgabe öffnen" })).toBeInTheDocument();
    expect(scroll).not.toHaveBeenCalled();
  });

  it("does not carry a completed snapshot across lesson identity or refresh", () => {
    state.completed = true;
    const view = render(<Harness />);
    expect(screen.getByRole("link", { name: "Weiter" })).toBeInTheDocument();
    state.completed = false;
    view.rerender(<Harness lessonId="anatomy" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    view.unmount();
    render(<Harness lessonId="anatomy" />);
    expect(screen.getByRole("button", { name: "Aufgabe öffnen" })).toBeInTheDocument();
    expect(scroll).not.toHaveBeenCalled();
  });
});
