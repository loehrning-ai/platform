"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type RefObject,
} from "react";
import type { GlasMode, GlasTone } from "@/lib/glas";
import { allocateLiveLayers, budgetForWidth, countLiveBackdropLayers, type LiveClaim } from "./budget";
import { frameVerdict } from "./frame-monitor";
import { usePrefersReducedMotion } from "./use-spring";
import "./glas.css";

/** localStorage key of the "Weniger Glas" choice. */
export const LESS_GLASS_KEY = "glas:less";
/** sessionStorage key of a slow frame verdict (kept for the session). */
export const SLOW_FRAMES_KEY = "glas:slow-frames";

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Private windows and blocked storage: the choice lasts for this page view.
  }
}

/** The live-slot store: who claims a filter, who may use one. */
class LiveStore {
  private claims = new Map<string, { priority: number; element: HTMLElement | null; visible: boolean }>();
  private live: ReadonlySet<string> = new Set();
  private listeners = new Set<() => void>();
  private observer: IntersectionObserver | null = null;
  enabled = false;
  reserved = 0;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  isLive = (id: string) => this.live.has(id);

  claim(id: string, priority: number, element: HTMLElement | null): () => void {
    this.claims.set(id, { priority, element, visible: false });
    if (element && typeof IntersectionObserver !== "undefined") {
      this.observer ??= new IntersectionObserver((entries) => {
        for (const entry of entries) {
          for (const [, claim] of this.claims) {
            if (claim.element === entry.target) claim.visible = entry.isIntersecting;
          }
        }
        this.recompute();
      });
      this.observer.observe(element);
    }
    this.recompute();
    return () => {
      if (element) this.observer?.unobserve(element);
      this.claims.delete(id);
      this.recompute();
    };
  }

  recompute = () => {
    let next: ReadonlySet<string> = new Set();
    if (this.enabled && typeof window !== "undefined") {
      const claims: LiveClaim[] = [];
      for (const [id, claim] of this.claims) {
        const box = claim.element?.getBoundingClientRect();
        claims.push({ id, priority: claim.priority, visible: claim.visible, area: box ? box.width * box.height : 0 });
      }
      next = allocateLiveLayers(claims, {
        budget: budgetForWidth(window.innerWidth),
        reserved: this.reserved,
        viewportArea: window.innerWidth * window.innerHeight,
      });
    }
    const same = next.size === this.live.size && [...next].every((id) => this.live.has(id));
    if (same) return;
    this.live = next;
    for (const listener of [...this.listeners]) listener();
  };

  dispose() {
    this.observer?.disconnect();
    this.observer = null;
  }
}

export interface GlasContextValue {
  readonly tone: GlasTone;
  readonly mode: GlasMode;
  readonly reducedMotion: boolean;
  readonly lessGlass: boolean;
  readonly setLessGlass: (on: boolean) => void;
  /** Call when a drag starts: the first drag on a page samples frame times (frame monitor). */
  readonly noteDrag: () => void;
  readonly store: LiveStore;
  /** Where sheets render (inside the root, outside any stage). */
  readonly portal: RefObject<HTMLDivElement | null>;
}

const GlasContext = createContext<GlasContextValue | null>(null);
/** True inside a glass surface: a nested panel is drawn as a fill (never glass on glass). */
export const InsideGlasContext = createContext(false);

export function useGlas(): GlasContextValue {
  const value = useContext(GlasContext);
  if (!value) throw new Error("Glas components need a <GlasRoot> (the v4 demo page renders one)");
  return value;
}

/** The solid triggers: reduced transparency, more contrast, forced colours, no backdrop-filter. */
function useSolidMedia(): boolean {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const queries = ["(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)", "(forced-colors: active)"].map((query) =>
      window.matchMedia(query),
    );
    const supported =
      typeof CSS !== "undefined" && typeof CSS.supports === "function"
        ? CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)")
        : false;
    const update = () => setSolid(!supported || queries.some((query) => query.matches));
    update();
    for (const query of queries) query.addEventListener?.("change", update);
    return () => {
      for (const query of queries) query.removeEventListener?.("change", update);
    };
  }, []);
  return solid;
}

/**
 * The root of every Glas page (the demo pages and the hub). It sets the tone,
 * picks the render mode (live, frost or solid), runs the live budget and the
 * frame monitor, and owns the "Weniger Glas" choice. Everything Glas sits
 * inside it; nothing outside it can use a --glas- token.
 */
export function GlasRoot({
  tone,
  as,
  className,
  style,
  children,
  initialMode = "live",
  ...rest
}: {
  readonly tone: GlasTone;
  readonly as?: ElementType;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children: ReactNode;
  /** "frost" for pages that never use a live filter (the hub). */
  readonly initialMode?: Exclude<GlasMode, "solid">;
  readonly [data: `data-${string}`]: string | undefined;
}) {
  const Element = as ?? "div";
  const reducedMotion = usePrefersReducedMotion();
  const solid = useSolidMedia();
  const [lessGlass, setLessGlassState] = useState(false);
  const [slowFrames, setSlowFrames] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const store = useMemo(() => new LiveStore(), []);
  const portal = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLessGlassState(readStorage(() => window.localStorage, LESS_GLASS_KEY) === "1");
    setSlowFrames(readStorage(() => window.sessionStorage, SLOW_FRAMES_KEY) === "1");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setSaveData(Boolean(connection?.saveData));
  }, []);

  const setLessGlass = useCallback((on: boolean) => {
    setLessGlassState(on);
    writeStorage(() => window.localStorage, LESS_GLASS_KEY, on ? "1" : null);
  }, []);

  const mode: GlasMode = solid ? "solid" : initialMode === "frost" || lessGlass || slowFrames || saveData ? "frost" : "live";

  // The budget: live only in live mode; the site's own live glass (the desktop nav) is reserved.
  useEffect(() => {
    store.enabled = mode === "live";
    const measure = () => {
      store.reserved = countLiveBackdropLayers(document, "[data-glas]");
      store.recompute();
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", store.recompute, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", store.recompute);
    };
  }, [mode, store]);
  useEffect(() => () => store.dispose(), [store]);

  // The frame monitor: once per page view, during the first two seconds of the first drag.
  const sampled = useRef(false);
  const noteDrag = useCallback(() => {
    if (sampled.current || mode !== "live" || typeof window.requestAnimationFrame !== "function") return;
    sampled.current = true;
    const deltas: number[] = [];
    let start = -1;
    let last = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      if (last >= 0) deltas.push(now - last);
      last = now;
      const verdict = frameVerdict(deltas, now - start);
      if (verdict === "pending") {
        window.requestAnimationFrame(tick);
        return;
      }
      if (verdict === "slow") {
        setSlowFrames(true);
        writeStorage(() => window.sessionStorage, SLOW_FRAMES_KEY, "1");
      }
    };
    window.requestAnimationFrame(tick);
  }, [mode]);

  const value = useMemo<GlasContextValue>(
    () => ({ tone, mode, reducedMotion, lessGlass, setLessGlass, noteDrag, store, portal }),
    [lessGlass, mode, noteDrag, reducedMotion, setLessGlass, store, tone],
  );

  return (
    <GlasContext.Provider value={value}>
      <Element
        ref={rootRef}
        data-glas=""
        data-tone={tone}
        data-glas-mode={mode}
        data-reduced-motion={reducedMotion ? "" : undefined}
        className={className}
        style={style}
        {...rest}
      >
        {children}
        <div ref={portal} data-glas-portal="" />
      </Element>
    </GlasContext.Provider>
  );
}

/**
 * Claims a live filter slot for a surface. Returns true when this surface may
 * paint a live backdrop-filter right now; false means frost (or solid).
 * Pass `priority: false` for a surface that never goes live.
 */
export function useLiveSlot(ref: RefObject<HTMLElement | null>, priority: number | false): boolean {
  const { store } = useGlas();
  const id = useId();
  useEffect(() => {
    if (priority === false) return;
    return store.claim(id, priority, ref.current);
  }, [id, priority, ref, store]);
  return useSyncExternalStore(
    store.subscribe,
    () => (priority === false ? false : store.isLive(id)),
    () => false,
  );
}
