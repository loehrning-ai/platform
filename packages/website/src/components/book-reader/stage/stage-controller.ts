/**
 * DOM glue of a chapter stage: reads where the step cards are, derives the
 * state with the pure functions of stage-protocol.ts, and writes it onto the
 * stage element (data-step, --cs-p, the step counter, the Weiter and Zurück
 * buttons) and into the protocol. It is the only script of a stage.
 *
 * It listens to scroll only while the stage is near the viewport, throttles to
 * animation frames, writes nothing when the state did not change, and never
 * touches anything outside the stage element. Static mode (reduced motion, a
 * short screen, the chapter pause switch) writes the finished state once.
 */

import {
  computeScrubState,
  finishedState,
  holdFirstStep,
  publishStageState,
  sameState,
  scrollDeltaForStep,
  type StageState,
  type StepBox,
} from "./stage-protocol";

const REDUCED = "(prefers-reduced-motion: reduce)";
const SHORT = "(max-height: 559px)";

export function startStage(root: HTMLElement, win: Window & typeof globalThis = window): () => void {
  const doc = root.ownerDocument;
  const stepEls = Array.from(root.querySelectorAll<HTMLElement>(".cs-step"));
  const total = stepEls.length;
  if (total === 0) return () => {};
  const pin = root.querySelector<HTMLElement>("[data-cs-pin]");
  const countEl = root.querySelector<HTMLElement>("[data-cs-count]");
  const prevEl = root.querySelector<HTMLElement>('[data-cs="prev"]');
  const nextEl = root.querySelector<HTMLElement>('[data-cs="next"]');
  const pause = doc.querySelector<HTMLInputElement>(".cs-pause-input");
  const media = (query: string): MediaQueryList | null => (typeof win.matchMedia === "function" ? win.matchMedia(query) : null);
  const reduce = media(REDUCED);
  const short = media(SHORT);

  let current: StageState | null = null;
  let frame = 0;
  let listening = false;

  const isStatic = (): boolean => Boolean(reduce?.matches || short?.matches || pause?.checked);

  const readingLine = (): number => {
    if (!pin) return win.innerHeight * 0.55;
    const pinBottom = pin.getBoundingClientRect().bottom;
    const bar = doc.querySelector("[data-reader-focus-bar]");
    const usable = bar && bar.getBoundingClientRect().height > 0 ? bar.getBoundingClientRect().top : win.innerHeight;
    return pinBottom + Math.max(0, usable - pinBottom) / 2;
  };

  /**
   * The reading line once the pin is stuck under the header. A click scrolls toward this line, not toward
   * the live one: before the pin sticks its bottom is lower, which would stop every jump short.
   */
  const settledLine = (): number => {
    if (!pin) return readingLine();
    const stuckTop = typeof win.getComputedStyle === "function" ? Number.parseFloat(win.getComputedStyle(pin).top) : Number.NaN;
    const top = Number.isFinite(stuckTop) ? stuckTop : 0;
    const pinBottom = Number.isFinite(stuckTop) ? Math.min(pin.getBoundingClientRect().bottom, top + pin.offsetHeight) : pin.getBoundingClientRect().bottom;
    const bar = doc.querySelector("[data-reader-focus-bar]");
    const usable = bar && bar.getBoundingClientRect().height > 0 ? bar.getBoundingClientRect().top : win.innerHeight;
    return pinBottom + Math.max(0, usable - pinBottom) / 2;
  };

  const boxes = (): StepBox[] =>
    stepEls.map((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });

  const setNav = (state: StageState): void => {
    const en = (doc.documentElement.getAttribute("lang") ?? "").toLowerCase().startsWith("en");
    if (countEl) countEl.textContent = en ? `Step ${state.step + 1} of ${total}` : `Schritt ${state.step + 1} von ${total}`;
    const wire = (el: HTMLElement | null, target: number, label: string): void => {
      if (!el) return;
      const ok = target >= 0 && target < total;
      el.setAttribute("aria-disabled", ok ? "false" : "true");
      if (ok) el.setAttribute("aria-label", en ? `${label} to step ${target + 1}` : `${label} zu Schritt ${target + 1}`);
    };
    wire(prevEl, state.step - 1, en ? "Back" : "Zurück");
    wire(nextEl, state.step + 1, en ? "Next" : "Weiter");
  };

  const apply = (next: StageState): void => {
    current = next;
    root.dataset["mode"] = next.mode;
    root.dataset["step"] = String(next.step);
    root.style.setProperty("--cs-p", next.progress.toFixed(4));
    setNav(next);
    publishStageState(root, next);
  };

  const update = (): void => {
    frame = 0;
    const next = isStatic() ? finishedState(total) : holdFirstStep(computeScrubState(readingLine(), boxes()));
    if (current === null || !sameState(next, current)) apply(next);
  };

  const schedule = (): void => {
    if (frame === 0) frame = win.requestAnimationFrame(update);
  };

  const listen = (on: boolean): void => {
    if (on === listening) return;
    listening = on;
    if (on) {
      win.addEventListener("scroll", schedule, { passive: true });
      win.addEventListener("resize", schedule, { passive: true });
      schedule();
    } else {
      win.removeEventListener("scroll", schedule);
      win.removeEventListener("resize", schedule);
    }
  };

  const onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cs]") : null;
    if (!target || !root.contains(target)) return;
    if (target.getAttribute("aria-disabled") === "true" || isStatic()) return;
    const index = (current?.step ?? 0) + (target.dataset["cs"] === "next" ? 1 : -1);
    if (index < 0 || index >= total) return;
    const delta = scrollDeltaForStep(index, settledLine(), boxes());
    win.scrollBy({ top: delta, behavior: reduce?.matches ? "auto" : "smooth" });
  };

  let observer: IntersectionObserver | null = null;
  if (typeof win.IntersectionObserver === "function") {
    observer = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) listen(entry.isIntersecting);
      },
      { rootMargin: "200px 0px 200px 0px" },
    );
    observer.observe(root);
  } else {
    listen(true);
  }

  root.addEventListener("click", onClick);
  reduce?.addEventListener("change", schedule);
  short?.addEventListener("change", schedule);
  pause?.addEventListener("change", schedule);
  update();

  return () => {
    observer?.disconnect();
    listen(false);
    if (frame !== 0) win.cancelAnimationFrame(frame);
    root.removeEventListener("click", onClick);
    reduce?.removeEventListener("change", schedule);
    short?.removeEventListener("change", schedule);
    pause?.removeEventListener("change", schedule);
  };
}
