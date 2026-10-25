import {
  autoplayAllowed,
  nextToPlay,
  viewportRatio,
  type PlateState,
} from "@/lib/open-source/specimen-clock";

/** Every 5 %: the ratio is recomputed against the viewport on each step. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * The page's own reserves for the sticky header and, below lg, the fixed tab
 * bar (globals.css sets them as scroll padding). A stage under either is not
 * in view, so the observer's root shrinks by both.
 */
function reserves(): { top: number; bottom: number } {
  const style = getComputedStyle(document.documentElement);
  const px = (value: string) => Math.max(Number.parseFloat(value) || 0, 0);
  return {
    top: px(style.scrollPaddingTop),
    bottom: px(style.scrollPaddingBottom),
  };
}

/** What a specimen plate exposes to the page-wide conductor. */
export interface ConductedPlate {
  readonly id: string;
  readonly number: number;
  readonly el: HTMLElement;
  /** Advance one animation frame; false once the plate is idle. */
  tick(now: number): boolean;
  /** Tape rewind, then play once. */
  autoplay(): void;
  pause(): void;
  resume(): void;
  toRest(): void;
  state(): Omit<PlateState, "id" | "number" | "ratio">;
}

interface Entry {
  readonly plate: ConductedPlate;
  ratio: number;
  /** Paused by leaving the view or hiding the tab, resumes on return. */
  held: boolean;
}

/**
 * One page-wide conductor for every specimen plate: one IntersectionObserver,
 * one visibility listener, one reduced-motion query and one rAF loop that runs
 * only while a plate moves. It decides which plate autoplays next.
 */
class SpecimenConductor {
  private readonly entries = new Map<string, Entry>();
  private observer: IntersectionObserver;
  /** The reserves the observer was built with, as `top/bottom`. */
  private margins = "";
  private readonly reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  private frame = 0;
  private resizeTimer = 0;

  constructor() {
    this.observer = this.buildObserver();
    // Rotation, a resize across lg (the tab bar comes or goes) or a new
    // page's styles change the reserves: rebuild the observer with them.
    window.addEventListener("resize", () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.refreshMargins(), 150);
    });
    document.addEventListener("visibilitychange", () => {
      for (const entry of this.entries.values()) {
        if (document.hidden && entry.plate.state().running) {
          entry.plate.pause();
          entry.held = true;
        }
      }
      this.relay();
    });
    this.reducedMotion.addEventListener("change", () => {
      if (this.reducedMotion.matches) this.restAll();
    });
    window.addEventListener("beforeprint", () => this.restAll());
  }

  private buildObserver(): IntersectionObserver {
    const { top, bottom } = reserves();
    this.margins = `${top}/${bottom}`;
    return new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const entry = this.find(record.target);
          if (!entry) continue;
          entry.ratio = record.isIntersecting
            ? viewportRatio({
                visible: record.intersectionRect.height,
                target: record.boundingClientRect.height,
                root:
                  record.rootBounds?.height ?? window.innerHeight - top - bottom,
              })
            : 0;
          if (entry.ratio < 0.1 && entry.plate.state().running) {
            entry.plate.pause();
            entry.held = true;
          }
        }
        this.relay();
      },
      {
        rootMargin: `-${top}px 0px -${bottom}px 0px`,
        threshold: THRESHOLDS,
      },
    );
  }

  /** Rebuild the observer when the header or tab bar reserve changed. */
  private refreshMargins(): void {
    const { top, bottom } = reserves();
    if (`${top}/${bottom}` === this.margins) return;
    this.observer.disconnect();
    this.observer = this.buildObserver();
    for (const entry of this.entries.values()) this.observer.observe(entry.plate.el);
  }

  register(plate: ConductedPlate): () => void {
    // A client navigation may arrive with other reserves.
    this.refreshMargins();
    this.entries.set(plate.id, { plate, ratio: 0, held: false });
    this.observer.observe(plate.el);
    return () => {
      this.observer.unobserve(plate.el);
      this.entries.delete(plate.id);
    };
  }

  get reduced(): boolean {
    return this.reducedMotion.matches;
  }

  /** Start the frame loop; it stops by itself once every plate is idle. */
  wake(): void {
    if (this.frame) return;
    const loop = (now: number) => {
      // Cleared first: a plate that finishes inside this frame relays to the
      // next one, whose wake() must be able to request the following frame.
      this.frame = 0;
      let active = false;
      for (const entry of this.entries.values()) {
        if (entry.plate.tick(now)) active = true;
      }
      if (active && !this.frame) this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  /** A plate started by hand: every other running plate pauses. */
  claim(id: string): void {
    for (const entry of this.entries.values()) {
      entry.held = false;
      if (entry.plate.id !== id && entry.plate.state().running) {
        entry.plate.pause();
      }
    }
  }

  /**
   * Hand autoplay to the next plate, if the page allows it. A plate that
   * was held by leaving the view resumes from where it stopped.
   */
  relay(): void {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (
      !autoplayAllowed({
        reducedMotion: this.reducedMotion.matches,
        saveData: connection?.saveData === true,
        hidden: document.hidden,
      })
    ) {
      return;
    }
    const states = [...this.entries.values()].map(
      (entry): PlateState => ({
        id: entry.plate.id,
        number: entry.plate.number,
        ratio: entry.ratio,
        ...entry.plate.state(),
      }),
    );
    const entry = this.entries.get(nextToPlay(states) ?? "");
    if (!entry) return;
    if (entry.held) {
      entry.held = false;
      entry.plate.resume();
    } else {
      entry.plate.autoplay();
    }
    this.wake();
  }

  private restAll(): void {
    for (const entry of this.entries.values()) {
      entry.held = false;
      entry.plate.toRest();
    }
  }

  private find(target: Element): Entry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.plate.el === target) return entry;
    }
    return undefined;
  }
}

let conductor: SpecimenConductor | null = null;

export function getSpecimenConductor(): SpecimenConductor {
  conductor ??= new SpecimenConductor();
  return conductor;
}
