/** Only learner events request this handoff; restored evidence must not scroll. */
export function focusMissionTarget(element: HTMLElement | null): void {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "center", behavior: "instant" });

  // A long result may not fit in the remaining phone band. Keep its heading
  // and first explanation below the actual sticky chrome, never behind it.
  const top = Math.max(
    0,
    ...Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-nav-header-row], [data-lesson-shell-mobile-toolbar]",
      ),
      (node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.height > 0 ? bounds.bottom : 0;
      },
    ),
  );
  const bounds = element.getBoundingClientRect();
  if (bounds.top < top + 8) {
    window.scrollBy({ top: bounds.top - top - 8, behavior: "instant" });
  }
}
/** Reader chrome requests a controlled task reveal, never a completion action. */
export const LESSON_MISSION_OPEN_TASK_EVENT = "loehrning:mission-open-task";
