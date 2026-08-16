"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import type { Locale } from "@/lib/i18n/locale";
import {
  LEARNING_OWNER_INERT_ATTRIBUTE,
  LESSON_DRAWER_INERT_ATTRIBUTE,
  NAV_MENU_INERT_ATTRIBUTE,
} from "@/lib/a11y/shared-inert";

const MIN_BRIEF_PERCENT = 30;
const MAX_BRIEF_PERCENT = 60;
const DEFAULT_BRIEF_PERCENT = 40;
const MIN_BRIEF_WIDTH_PX = 16 * 16;
const MIN_WORKSPACE_WIDTH_PX = 20 * 16;
const SEPARATOR_WIDTH_PX = 12;
const DOCKED_LAYOUT_MEDIA_QUERY = "(min-width: 1024px)";
const FULLSCREEN_INERT_ATTRIBUTE = "data-course-workspace-inert";
const EXTERNAL_INERT_OWNER_ATTRIBUTES = [
  LEARNING_OWNER_INERT_ATTRIBUTE,
  NAV_MENU_INERT_ATTRIBUTE,
  LESSON_DRAWER_INERT_ATTRIBUTE,
] as const;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
export const COURSE_WORKSPACE_STORAGE_PREFIX = "loehrning:course-workspace:v1:";

interface SplitBounds {
  readonly feasible: boolean;
  readonly minimum: number;
  readonly maximum: number;
}

interface FullscreenEntry {
  readonly node: HTMLElement;
  readonly opener: HTMLElement | null;
  readonly onRequestClose: () => void;
}

interface InertRecord {
  readonly element: HTMLElement;
  readonly hadIndependentInert: boolean;
}

const fullscreenStack: FullscreenEntry[] = [];
let inertBackground: InertRecord[] = [];
let latestExternalBodyOverflow = "";
let previousRootOverflow = "";
let bodyStyleObserver: MutationObserver | null = null;

function getSplitBounds(containerWidth: number | null): SplitBounds {
  if (containerWidth === null || containerWidth <= 0) {
    return {
      feasible: true,
      minimum: MIN_BRIEF_PERCENT,
      maximum: MAX_BRIEF_PERCENT,
    };
  }

  const availableWidth = containerWidth - SEPARATOR_WIDTH_PX;
  if (availableWidth < MIN_BRIEF_WIDTH_PX + MIN_WORKSPACE_WIDTH_PX) {
    return {
      feasible: false,
      minimum: MIN_BRIEF_PERCENT,
      maximum: MAX_BRIEF_PERCENT,
    };
  }

  return {
    feasible: true,
    minimum: Math.max(
      MIN_BRIEF_PERCENT,
      Math.ceil((MIN_BRIEF_WIDTH_PX / availableWidth) * 100),
    ),
    maximum: Math.min(
      MAX_BRIEF_PERCENT,
      Math.floor(
        ((availableWidth - MIN_WORKSPACE_WIDTH_PX) / availableWidth) * 100,
      ),
    ),
  };
}

function clampBriefPercent(
  value: number,
  bounds: SplitBounds = {
    feasible: true,
    minimum: MIN_BRIEF_PERCENT,
    maximum: MAX_BRIEF_PERCENT,
  },
): number {
  return Math.min(bounds.maximum, Math.max(bounds.minimum, Math.round(value)));
}

function isExternallyInert(element: HTMLElement): boolean {
  return EXTERNAL_INERT_OWNER_ATTRIBUTES.some((attribute) =>
    element.hasAttribute(attribute),
  );
}

function releaseInertBackground(): void {
  for (const { element, hadIndependentInert } of inertBackground) {
    element.removeAttribute(FULLSCREEN_INERT_ATTRIBUTE);
    element.toggleAttribute(
      "inert",
      hadIndependentInert || isExternallyInert(element),
    );
  }
  inertBackground = [];
}

function collectBackgroundElements(node: HTMLElement): HTMLElement[] {
  const elements = new Set<HTMLElement>();
  let branch: HTMLElement = node;

  while (branch.parentElement) {
    const parent = branch.parentElement;
    for (const sibling of parent.children) {
      if (sibling !== branch && sibling instanceof HTMLElement) {
        elements.add(sibling);
      }
    }
    if (parent === document.body) break;
    branch = parent;
  }

  return Array.from(elements);
}

function synchronizeInertBackground(): void {
  releaseInertBackground();
  const active = fullscreenStack.at(-1);
  if (!active) return;

  inertBackground = collectBackgroundElements(active.node).map((element) => ({
    element,
    hadIndependentInert:
      element.hasAttribute("inert") && !isExternallyInert(element),
  }));
  for (const { element } of inertBackground) {
    element.setAttribute(FULLSCREEN_INERT_ATTRIBUTE, "true");
    element.setAttribute("inert", "");
  }
}

function getFocusableElements(node: HTMLElement): HTMLElement[] {
  return Array.from(
    node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
      element.getAttribute("tabindex") !== "-1",
  );
}

function focusFullscreen(entry: FullscreenEntry): void {
  entry.node.focus({ preventScroll: true });
}

function handleFullscreenKeyDown(event: KeyboardEvent): void {
  const active = fullscreenStack.at(-1);
  if (!active) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    active.onRequestClose();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(active.node);
  if (focusable.length === 0) {
    event.preventDefault();
    focusFullscreen(active);
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const focused = document.activeElement;
  if (!active.node.contains(focused) || focused === active.node) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && focused === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && focused === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleFullscreenFocusIn(event: FocusEvent): void {
  const active = fullscreenStack.at(-1);
  if (!active || active.node.contains(event.target as Node | null)) return;
  focusFullscreen(active);
}

function acquireDocumentLock(): void {
  latestExternalBodyOverflow = document.body.style.overflow;
  previousRootOverflow = document.documentElement.style.overflow;
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  bodyStyleObserver = new MutationObserver(() => {
    if (fullscreenStack.length === 0) return;
    if (document.body.style.overflow !== "hidden") {
      latestExternalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
  });
  bodyStyleObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
  });
  document.addEventListener("keydown", handleFullscreenKeyDown, true);
  document.addEventListener("focusin", handleFullscreenFocusIn, true);
}

function releaseDocumentLock(): void {
  bodyStyleObserver?.disconnect();
  bodyStyleObserver = null;
  if (document.body.style.overflow !== "hidden") {
    latestExternalBodyOverflow = document.body.style.overflow;
  }
  document.body.style.overflow = latestExternalBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
  document.removeEventListener("keydown", handleFullscreenKeyDown, true);
  document.removeEventListener("focusin", handleFullscreenFocusIn, true);
}

function scheduleFocusRestoration(target: HTMLElement | null): void {
  const schedule =
    window.requestAnimationFrame ??
    ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
  schedule(() => {
    const active = fullscreenStack.at(-1);
    if (active) {
      if (target?.isConnected && active.node.contains(target)) {
        target.focus();
      } else {
        focusFullscreen(active);
      }
    } else if (target?.isConnected) {
      target.focus();
    }
  });
}

function registerFullscreen(entry: FullscreenEntry): () => void {
  if (fullscreenStack.length === 0) acquireDocumentLock();
  fullscreenStack.push(entry);
  synchronizeInertBackground();
  focusFullscreen(entry);

  return () => {
    const index = fullscreenStack.lastIndexOf(entry);
    const wasTop = index === fullscreenStack.length - 1;
    if (index >= 0) fullscreenStack.splice(index, 1);
    synchronizeInertBackground();
    if (fullscreenStack.length === 0) releaseDocumentLock();
    if (wasTop) scheduleFocusRestoration(entry.opener);
  };
}

interface WorkspacePreferences {
  readonly version: 1;
  readonly briefCollapsed: boolean;
  readonly docked: boolean;
  readonly briefPercent: number;
}

const FRAME_COPY = {
  de: {
    controls: "Arbeitsbereich-Layout",
    collapse: "Projektbrief einklappen",
    expand: "Projektbrief ausklappen",
    stack: "Bereiche untereinander anordnen",
    dock: "Bereiche nebeneinander andocken",
    enterFullscreen: "Vollbild öffnen",
    exitFullscreen: "Vollbild schließen",
    fullscreenHint: "Escape schließt das Vollbild",
    resize: "Breite des Projektbriefs ändern",
    resized: "Projektbriefbreite",
    brief: "Projektbrief",
    workspace: "Projektarbeitsbereich",
  },
  en: {
    controls: "Workspace layout",
    collapse: "Collapse project brief",
    expand: "Expand project brief",
    stack: "Stack panes",
    dock: "Dock panes side by side",
    enterFullscreen: "Enter full screen",
    exitFullscreen: "Exit full screen",
    fullscreenHint: "Escape exits full screen",
    resize: "Resize project brief",
    resized: "Project brief width",
    brief: "Project brief",
    workspace: "Project workspace",
  },
} as const;

function parsePreferences(raw: string | null): WorkspacePreferences | null {
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<WorkspacePreferences>;
    if (
      candidate.version !== 1 ||
      typeof candidate.briefCollapsed !== "boolean" ||
      typeof candidate.docked !== "boolean" ||
      typeof candidate.briefPercent !== "number" ||
      !Number.isFinite(candidate.briefPercent)
    ) {
      return null;
    }
    return {
      version: 1,
      briefCollapsed: candidate.briefCollapsed,
      docked: candidate.docked,
      briefPercent: clampBriefPercent(candidate.briefPercent),
    };
  } catch {
    return null;
  }
}

export interface CourseWorkspaceFrameProps {
  readonly id: string;
  readonly titleId: string;
  readonly title: string;
  readonly storageId: string;
  readonly locale: Locale;
  readonly header: ReactNode;
  readonly brief: ReactNode;
  readonly workspace: ReactNode;
  readonly projectId: string;
  readonly engineKind: string;
}

export function CourseWorkspaceFrame({
  id,
  titleId,
  title,
  storageId,
  locale,
  header,
  brief,
  workspace,
  projectId,
  engineKind,
}: CourseWorkspaceFrameProps): JSX.Element {
  const copy = FRAME_COPY[locale];
  const storageKey = `${COURSE_WORKSPACE_STORAGE_PREFIX}${storageId}`;
  const briefId = `${storageId}-brief-pane`;
  const workspaceId = `${storageId}-workspace-pane`;
  const fullscreenHintId = `${storageId}-fullscreen-hint`;
  const frameRef = useRef<HTMLElement>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const fullscreenOpenerRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesTouched, setPreferencesTouched] = useState(false);
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [docked, setDocked] = useState(true);
  const [briefPercent, setBriefPercent] = useState(DEFAULT_BRIEF_PERCENT);
  const [panesWidth, setPanesWidth] = useState<number | null>(null);
  const [dockedLayoutViewport, setDockedLayoutViewport] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const splitBounds = useMemo(() => getSplitBounds(panesWidth), [panesWidth]);
  const effectiveBriefPercent = clampBriefPercent(briefPercent, splitBounds);

  useEffect(() => {
    let stored: WorkspacePreferences | null = null;
    try {
      stored = parsePreferences(window.localStorage.getItem(storageKey));
    } catch {
      // Storage can be disabled by browser privacy settings.
    }
    if (stored) {
      setBriefCollapsed(stored.briefCollapsed);
      setDocked(stored.docked);
      setBriefPercent(stored.briefPercent);
    }
    setPreferencesReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!preferencesReady || !preferencesTouched) return;
    const preferences: WorkspacePreferences = {
      version: 1,
      briefCollapsed,
      docked,
      briefPercent,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Layout persistence is optional; the workspace remains fully functional.
    }
  }, [
    briefCollapsed,
    briefPercent,
    docked,
    preferencesReady,
    preferencesTouched,
    storageKey,
  ]);

  const exitFullscreen = useCallback(() => setFullscreen(false), []);

  const enterFullscreen = useCallback(() => {
    fullscreenOpenerRef.current = fullscreenButtonRef.current;
    setFullscreen(true);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const node = frameRef.current;
    if (!node) return;
    return registerFullscreen({
      node,
      opener: fullscreenOpenerRef.current ?? fullscreenButtonRef.current,
      onRequestClose: exitFullscreen,
    });
  }, [exitFullscreen, fullscreen]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(DOCKED_LAYOUT_MEDIA_QUERY);
    const synchronizeDockedLayoutViewport = (event?: MediaQueryListEvent) => {
      setDockedLayoutViewport(event?.matches ?? mediaQuery.matches);
    };

    synchronizeDockedLayoutViewport();
    mediaQuery.addEventListener("change", synchronizeDockedLayoutViewport);
    return () => {
      mediaQuery.removeEventListener("change", synchronizeDockedLayoutViewport);
    };
  }, []);

  useEffect(() => {
    const panes = panesRef.current;
    if (!panes) return;
    const measure = () => {
      const width = panes.getBoundingClientRect().width;
      if (width > 0) setPanesWidth(width);
    };
    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(panes);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    setBriefPercent((current) => clampBriefPercent(current, splitBounds));
  }, [splitBounds]);

  function updateBriefPercent(next: number) {
    setPreferencesTouched(true);
    setBriefPercent(clampBriefPercent(next, splitBounds));
  }

  function resizeFromClientX(clientX: number) {
    const bounds = panesRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) return;
    const availableWidth = bounds.width - SEPARATOR_WIDTH_PX;
    if (availableWidth <= 0) return;
    updateBriefPercent(
      ((clientX - bounds.left - SEPARATOR_WIDTH_PX / 2) / availableWidth) * 100,
    );
  }

  function handleSeparatorPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.button !== 0) return;
    draggingRef.current = true;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    resizeFromClientX(event.clientX);
  }

  function handleSeparatorPointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (draggingRef.current) resizeFromClientX(event.clientX);
  }

  function handleSeparatorPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleSeparatorLostPointerCapture() {
    draggingRef.current = false;
  }

  function handleSeparatorKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateBriefPercent(briefPercent - 2);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      updateBriefPercent(briefPercent + 2);
    } else if (event.key === "Home") {
      event.preventDefault();
      updateBriefPercent(MIN_BRIEF_PERCENT);
    } else if (event.key === "End") {
      event.preventDefault();
      updateBriefPercent(MAX_BRIEF_PERCENT);
    }
  }

  const splitFeasible = dockedLayoutViewport && splitBounds.feasible;
  const splitActive = docked && !briefCollapsed && splitFeasible;
  const paneGridStyle = splitActive
    ? {
        gridTemplateColumns: `minmax(16rem, ${effectiveBriefPercent}fr) 0.75rem minmax(20rem, ${100 - effectiveBriefPercent}fr)`,
      }
    : undefined;

  return (
    <section
      ref={frameRef}
      id={id}
      tabIndex={fullscreen ? -1 : undefined}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen ? "true" : undefined}
      aria-labelledby={briefCollapsed ? undefined : titleId}
      aria-label={briefCollapsed ? `${copy.workspace}: ${title}` : undefined}
      aria-describedby={fullscreen ? fullscreenHintId : undefined}
      data-course-project={projectId}
      data-engine-kind={engineKind}
      data-fullscreen={fullscreen ? "true" : "false"}
      data-layout={splitActive ? "docked" : "stacked"}
      className={
        fullscreen
          ? "fixed inset-0 z-[100] m-0 flex h-dvh min-w-0 flex-col overflow-hidden border-2 border-foreground bg-background pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-inset"
          : "relative my-10 min-w-0 overflow-hidden border-2 border-foreground bg-background shadow-[7px_7px_0_0_var(--color-foreground)]"
      }
    >
      {header}

      <div
        role="toolbar"
        aria-label={copy.controls}
        className="flex min-w-0 flex-wrap items-center gap-2 border-b-2 border-foreground bg-card px-3 py-2 sm:px-5"
      >
        <button
          type="button"
          aria-controls={briefId}
          aria-expanded={!briefCollapsed}
          className="inline-flex min-h-10 items-center border-2 border-foreground/30 bg-background px-3 py-2 font-mono text-[0.68rem] font-black uppercase tracking-wide hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          onClick={() => {
            setPreferencesTouched(true);
            setBriefCollapsed((current) => !current);
          }}
        >
          {briefCollapsed ? copy.expand : copy.collapse}
        </button>
        <button
          type="button"
          disabled={!splitFeasible || briefCollapsed}
          className="inline-flex min-h-10 items-center border-2 border-foreground/30 bg-background px-3 py-2 font-mono text-[0.68rem] font-black uppercase tracking-wide hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (!splitFeasible || briefCollapsed) return;
            setPreferencesTouched(true);
            setDocked((current) => !current);
          }}
        >
          {splitActive ? copy.stack : copy.dock}
        </button>
        <button
          ref={fullscreenButtonRef}
          type="button"
          className="inline-flex min-h-10 items-center border-2 border-foreground bg-foreground px-3 py-2 font-mono text-[0.68rem] font-black uppercase tracking-wide text-background hover:bg-brand-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:ml-auto"
          onClick={() => (fullscreen ? exitFullscreen() : enterFullscreen())}
        >
          {fullscreen ? copy.exitFullscreen : copy.enterFullscreen}
        </button>
        {fullscreen ? (
          <span
            id={fullscreenHintId}
            className="w-full font-mono text-[0.65rem] font-bold text-muted-foreground sm:w-auto"
          >
            {copy.fullscreenHint}
          </span>
        ) : null}
      </div>

      <div
        ref={panesRef}
        className={`${
          fullscreen
            ? "min-h-0 flex-1 overflow-y-auto lg:overflow-hidden"
            : "min-w-0"
        } ${splitActive ? "min-w-0 lg:grid" : "min-w-0"}`}
        style={paneGridStyle}
      >
        <div
          id={briefId}
          hidden={briefCollapsed}
          role="region"
          aria-label={copy.brief}
          className={`${
            fullscreen
              ? "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
              : "min-w-0"
          } min-w-0 border-b-2 border-foreground ${
            splitActive ? "lg:border-b-0" : ""
          }`}
        >
          {brief}
        </div>

        {splitActive ? (
          <div
            role="separator"
            tabIndex={0}
            aria-label={copy.resize}
            aria-controls={`${briefId} ${workspaceId}`}
            aria-orientation="vertical"
            aria-valuemin={splitBounds.minimum}
            aria-valuemax={splitBounds.maximum}
            aria-valuenow={effectiveBriefPercent}
            aria-valuetext={`${copy.resized}: ${effectiveBriefPercent}%`}
            className="group hidden min-h-full cursor-col-resize touch-none items-stretch justify-center bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-inset lg:flex"
            onKeyDown={handleSeparatorKeyDown}
            onPointerDown={handleSeparatorPointerDown}
            onPointerMove={handleSeparatorPointerMove}
            onPointerUp={handleSeparatorPointerEnd}
            onPointerCancel={handleSeparatorPointerEnd}
            onLostPointerCapture={handleSeparatorLostPointerCapture}
          >
            <span
              className="w-0.5 bg-foreground/35 transition-colors group-hover:bg-brand-orange"
              aria-hidden="true"
            />
          </div>
        ) : null}

        <div
          id={workspaceId}
          role="region"
          aria-label={copy.workspace}
          className={`${
            fullscreen
              ? "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
              : "min-w-0"
          } min-w-0`}
        >
          {workspace}
        </div>
      </div>
    </section>
  );
}
