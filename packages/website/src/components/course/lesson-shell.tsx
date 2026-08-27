"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { m } from "framer-motion";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { MotionProvider } from "@/components/motion-provider";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import {
  hasSharedInertOwner,
  LESSON_DRAWER_INERT_ATTRIBUTE,
  setSharedInertOwner,
} from "@/lib/a11y/shared-inert";
import { cn } from "@/lib/utils";

export const LESSON_SHELL_SIDEBAR_STORAGE_KEY =
  "loehrning:lesson-shell:sidebar:v1";

export type LessonShellContentMode = "reading" | "stage" | "workspace";

const CONTENT_WIDTH_CLASS: Record<LessonShellContentMode, string> = {
  reading: "max-w-3xl",
  stage: "max-w-[1600px]",
  workspace: "max-w-[1600px]",
};

function readPersistedSidebarState(): boolean {
  try {
    return (
      window.localStorage.getItem(LESSON_SHELL_SIDEBAR_STORAGE_KEY) ===
      "collapsed"
    );
  } catch {
    return false;
  }
}

function persistSidebarState(collapsed: boolean): void {
  try {
    window.localStorage.setItem(
      LESSON_SHELL_SIDEBAR_STORAGE_KEY,
      collapsed ? "collapsed" : "expanded",
    );
  } catch {
    // Storage can be unavailable in private or policy-restricted contexts.
    // The in-memory control remains fully functional for the current page.
  }
}

interface DrawerInertRecord {
  readonly element: HTMLElement;
  readonly hadIndependentInert: boolean;
}

let lessonDrawerScrollLocks = 0;
let lessonDrawerPriorBodyOverflow = "";
let lessonDrawerPriorRootOverflow = "";

function acquireLessonDrawerScrollLock(): () => void {
  if (lessonDrawerScrollLocks === 0) {
    lessonDrawerPriorBodyOverflow = document.body.style.overflow;
    lessonDrawerPriorRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  lessonDrawerScrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lessonDrawerScrollLocks = Math.max(0, lessonDrawerScrollLocks - 1);
    if (lessonDrawerScrollLocks === 0) {
      document.body.style.overflow = lessonDrawerPriorBodyOverflow;
      document.documentElement.style.overflow = lessonDrawerPriorRootOverflow;
    }
  };
}

function collectDrawerBackground(drawer: HTMLElement): HTMLElement[] {
  const elements = new Set<HTMLElement>();
  let branch: HTMLElement = drawer;

  while (branch.parentElement) {
    const parent = branch.parentElement;
    for (const sibling of parent.children) {
      if (
        sibling instanceof HTMLElement &&
        sibling !== branch &&
        !sibling.contains(drawer) &&
        !sibling.hasAttribute("data-sidebar-backdrop")
      ) {
        elements.add(sibling);
      }
    }
    if (parent === document.body) break;
    branch = parent;
  }

  return Array.from(elements);
}

/**
 * Shared, structure-agnostic lesson workspace chrome: a persistent,
 * collapsible desktop rail at lg+, an accessible drawer below lg, and a main
 * surface whose width follows the lesson's content mode. It knows nothing
 * about lessons — `sidebar`/`children` are opaque ReactNode slots — so course
 * readers can share navigation behavior without sharing content rendering.
 * `navOpen`/`onNavOpenChange` remain controlled so the caller owns when the
 * mobile drawer closes (for example, after lesson selection).
 */
export interface LessonShellProps {
  /** Rendered in both the collapsible desktop rail and the mobile drawer. */
  readonly sidebar: ReactNode;
  /** Main content area. */
  readonly children: ReactNode;
  readonly navOpen: boolean;
  readonly onNavOpenChange: (open: boolean) => void;
  /** aria-label for the mobile drawer's dialog role. */
  readonly navLabel: string;
  /** id shared between the toggle's aria-controls and the drawer element. */
  readonly navId?: string;
  readonly openNavLabel?: string;
  readonly closeNavLabel?: string;
  /** Width contract for the learning surface. Defaults to the simulator-friendly stage. */
  readonly contentMode?: LessonShellContentMode;
  readonly collapseNavLabel?: string;
  readonly expandNavLabel?: string;
  /** Produces unique ID namespaces when the same sidebar renders twice. */
  readonly renderSidebar?: (instance: "desktop" | "mobile") => ReactNode;
}

export function LessonShell({
  sidebar,
  children,
  navOpen,
  onNavOpenChange,
  navLabel,
  navId = "mobile-lesson-nav",
  openNavLabel = "Navigation öffnen",
  closeNavLabel = "Navigation schließen",
  contentMode = "stage",
  collapseNavLabel = "Seitenleiste einklappen",
  expandNavLabel = "Seitenleiste ausklappen",
  renderSidebar,
}: LessonShellProps) {
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const previousNavOpenRef = useRef(navOpen);
  const closeNav = useCallback(() => onNavOpenChange(false), [onNavOpenChange]);
  const drawerRef = useFocusTrap<HTMLElement>(navOpen, closeNav, {
    restoreFocus: false,
  });
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const desktopSidebarId = `${navId}-desktop`;

  // The server and first client render are both expanded. Reading the durable
  // preference after mount avoids a hydration mismatch while preserving the
  // learner's choice for subsequent navigation.
  useEffect(() => {
    setDesktopSidebarCollapsed(readPersistedSidebarState());
  }, []);

  // A drawer opened below lg must not survive a resize into the desktop rail.
  // Otherwise the drawer becomes CSS-hidden while its focus trap and inert
  // sweep continue to lock the visible desktop content.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeDrawerAtDesktop = (
      event: MediaQueryListEvent | MediaQueryList,
    ) => {
      if (event.matches) {
        onNavOpenChange(false);
      }
    };

    if (navOpen) closeDrawerAtDesktop(desktopQuery);
    desktopQuery.addEventListener("change", closeDrawerAtDesktop);
    return () => {
      desktopQuery.removeEventListener("change", closeDrawerAtDesktop);
    };
  }, [navOpen, onNavOpenChange]);

  // Observe the controlled state transition instead of assuming that a click
  // has already committed it. This runs after the layout-effect inert sweep
  // releases the opener, then restores focus on the next frame. Desktop
  // promotion skips the mobile control because it is CSS-hidden at lg+.
  useLayoutEffect(() => {
    const wasOpen = previousNavOpenRef.current;
    previousNavOpenRef.current = navOpen;
    if (!wasOpen || navOpen) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      return;
    }

    let cancelled = false;
    let frame = 0;
    let attempts = 0;
    const restore = () => {
      if (cancelled) return;
      const toggle = toggleButtonRef.current;
      if (toggle?.isConnected && !toggle.closest("[inert]")) {
        toggle.focus();
      }
      attempts += 1;
      if (document.activeElement !== toggle && attempts < 3) {
        frame = window.requestAnimationFrame(restore);
      }
    };
    frame = window.requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [navOpen]);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      persistSidebarState(next);
      return next;
    });
  }, []);

  // Isolate the complete document background, not only siblings inside the
  // lesson shell. Walking the drawer's ancestor chain reaches the global site
  // header, the rest of <main>, and the footer while preserving the backdrop's
  // click-to-close behavior. The explicit owner marker composes with the
  // global navigation and learning-owner locks instead of clearing them.
  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!navOpen || !drawer) return;

    const records: DrawerInertRecord[] = collectDrawerBackground(drawer).map(
      (element) => ({
        element,
        hadIndependentInert:
          element.hasAttribute("inert") && !hasSharedInertOwner(element),
      }),
    );
    for (const { element } of records) {
      setSharedInertOwner(element, LESSON_DRAWER_INERT_ATTRIBUTE, true);
    }

    return () => {
      for (const { element, hadIndependentInert } of records) {
        setSharedInertOwner(element, LESSON_DRAWER_INERT_ATTRIBUTE, false);
        if (hadIndependentInert) element.setAttribute("inert", "");
      }
    };
  }, [navOpen, drawerRef]);

  useLayoutEffect(() => {
    if (!navOpen) return;
    return acquireLessonDrawerScrollLock();
  }, [navOpen]);

  return (
    <div
      className="flex min-h-[calc(100svh-7rem)] min-w-0 max-w-full overflow-x-clip bg-background"
      data-lesson-shell
      data-content-mode={contentMode}
    >
      {/* Desktop sidebar */}
      <aside
        aria-label={navLabel}
        data-lesson-shell-desktop-sidebar
        data-lesson-shell-navigation
        data-collapsed={desktopSidebarCollapsed ? "true" : "false"}
        className={cn(
          "hidden shrink-0 self-start overflow-hidden border-r border-foreground bg-card lg:sticky lg:top-28 lg:block lg:h-[calc(100svh-7rem)]",
          desktopSidebarCollapsed ? "lg:w-14" : "lg:w-60",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div
            className={cn(
              "relative flex min-h-14 shrink-0 items-center gap-2 border-b border-foreground p-2",
              desktopSidebarCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {desktopSidebarCollapsed ? (
              <span
                aria-hidden="true"
                className="absolute left-0 h-8 w-0.5 bg-brand-orange"
              />
            ) : (
              <span className="min-w-0 break-words pl-1 font-mono text-xs font-bold uppercase leading-tight tracking-[0.08em] text-foreground">
                {navLabel}
              </span>
            )}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              aria-expanded={!desktopSidebarCollapsed}
              aria-controls={desktopSidebarId}
              aria-label={
                desktopSidebarCollapsed ? expandNavLabel : collapseNavLabel
              }
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background text-foreground outline-none transition-colors duration-150 hover:border-brand-orange hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              {desktopSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          <div
            id={desktopSidebarId}
            className={cn(
              "min-h-0 flex-1 overscroll-contain [scrollbar-gutter:stable]",
              desktopSidebarCollapsed
                ? "overflow-hidden p-0"
                : "overflow-y-auto p-3",
            )}
          >
            {desktopSidebarCollapsed
              ? null
              : (renderSidebar?.("desktop") ?? sidebar)}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {navOpen && (
        <>
          <div
            data-sidebar-backdrop
            className="fixed inset-0 z-[60] bg-foreground/40 lg:hidden"
            role="presentation"
            onClick={closeNav}
          />
          <MotionProvider>
            <m.aside
              ref={drawerRef}
              id={navId}
              role="dialog"
              aria-modal="true"
              aria-label={navLabel}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-[70] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain border-r border-foreground bg-background pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden"
            >
              <div className="mb-3 flex min-h-14 items-center justify-between gap-3 border-b border-foreground pb-2">
                <span className="min-w-0 break-words border-l-2 border-brand-orange pl-3 font-mono text-xs font-bold uppercase leading-tight tracking-[0.08em] text-foreground">
                  {navLabel}
                </span>
                <button
                  type="button"
                  onClick={closeNav}
                  aria-expanded="true"
                  aria-controls={navId}
                  aria-label={closeNavLabel}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background text-foreground outline-none transition-colors duration-150 hover:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {renderSidebar?.("mobile") ?? sidebar}
            </m.aside>
          </MotionProvider>
        </>
      )}

      {/* Main content */}
      <div className="min-w-0 max-w-full flex-1 overflow-x-clip px-4 py-6 sm:px-5 lg:px-6 lg:py-7 xl:px-8">
        <div
          data-lesson-shell-mobile-toolbar
          className="sticky top-28 z-40 -mx-4 mb-4 flex min-h-14 min-w-0 items-center justify-between gap-3 overflow-hidden border-y border-foreground bg-card px-4 sm:-mx-5 sm:px-5 lg:hidden"
        >
          <span className="min-w-0 break-words border-l-2 border-brand-orange pl-3 font-mono text-xs font-bold uppercase leading-tight tracking-[0.08em] text-foreground">
            {navLabel}
          </span>
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={() => onNavOpenChange(true)}
            tabIndex={navOpen ? -1 : undefined}
            aria-hidden={navOpen || undefined}
            aria-expanded={navOpen}
            aria-controls={navId}
            aria-label={openNavLabel}
            className={`flex h-11 w-11 shrink-0 items-center justify-center border border-foreground bg-brand-orange text-white outline-none transition-colors duration-150 hover:bg-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none lg:hidden ${
              navOpen ? "pointer-events-none invisible" : ""
            }`}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div
          data-lesson-shell-content
          data-content-mode={contentMode}
          data-lesson-stage
          className={cn(
            "mx-auto w-full min-w-0 overflow-x-clip border-t-[3px] border-brand-orange pt-4 [&>*]:min-w-0",
            CONTENT_WIDTH_CLASS[contentMode],
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
