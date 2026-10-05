"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { m } from "framer-motion";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { MotionProvider } from "@/components/motion-provider";
import {
  ReaderFocusBar,
  type ReaderFocusBarAction,
} from "@/components/learning/reader-focus-bar";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import {
  hasSharedInertOwner,
  LESSON_DRAWER_INERT_ATTRIBUTE,
  setSharedInertOwner,
} from "@/lib/a11y/shared-inert";
import { cx } from "@/components/werk/cx";
import { coursePlakat, type PlakatKey } from "@/lib/plakat/palettes";

/**
 * Course routes and their `COURSE_PLAKAT` ids, longest prefix first. Lessons
 * stay paper; only the lesson H1 and the Kopflinien take the track's scene
 * line (SPEC §2.3, §3.13). The shell's slots are opaque, so the scene comes
 * from the route unless a reader passes `courseId`.
 */
const LESSON_COURSE_ROUTES: readonly (readonly [prefix: string, courseId: string])[] = [
  ["/kurse/open-source/ai-native-operator", "ai-native-operator"],
  ["/kurse/open-source/data-engineering-fundamentals", "data-engineering-fundamentals"],
  ["/kurse/open-source/data-infrastructure", "data-infrastructure"],
  ["/kurse/open-source/data-science", "data-science"],
  ["/ki-fuehrerschein", "ki-fuehrerschein"],
  ["/ki-und-gesellschaft", "ki-und-gesellschaft"],
  ["/eu-ai-act-kurs", "eu-ai-act-kurs"],
  ["/ai-native/kurs", "ai-native"],
];

/** The track scene of a lesson route (with or without the /en prefix), if any. */
export function lessonScene(
  pathname: string | null | undefined,
  courseId?: string,
): PlakatKey | undefined {
  if (courseId) return coursePlakat(courseId)?.plakat;
  if (!pathname) return undefined;
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const match = LESSON_COURSE_ROUTES.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return match ? coursePlakat(match[1])?.plakat : undefined;
}

const WERK_ICON_BUTTON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-transparent text-foreground outline-none transition-colors duration-150 hover:border-foreground hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

const APP_ICON_BUTTON =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-lab-sm ring-1 ring-lab-line outline-none transition-colors duration-150 hover:bg-lab-accent-soft focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none";

export const LESSON_SHELL_SIDEBAR_STORAGE_KEY =
  "loehrning:lesson-shell:sidebar:v1";

export type LessonShellContentMode = "reading" | "stage" | "workspace";

/**
 * What a course reader adds to the compact reader bar below lg: where the
 * learner is in the course and how to continue. The shell owns the bar itself,
 * its geometry and its fallback control; this is the enrichment only a course
 * reader can supply, because only it knows the lesson order and the next step.
 */
export interface LessonShellReaderBar {
  /** Visible position, for example "Lektion 3 von 12". */
  readonly position: string;
  /** Spoken position when the visible text is a bare fraction. */
  readonly positionLabel?: string;
  /** The current task, next lesson, or the real terminal assessment/hub. */
  readonly next?: ReaderFocusBarAction;
}

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
  /**
   * Enriches the compact reader bar below lg with the lesson position and the
   * next step. Optional because the shell cannot derive either value: the
   * sidebar it is handed is an opaque ReactNode, there is no lesson context
   * above it, and course readers disagree on whether "next" is a route or an
   * in-page state change. A course reader that knows both should pass them.
   *
   * It is NOT the switch that decides whether the bar exists. Focus mode below
   * removes the mobile tab bar, so the bar is rendered either way and the band
   * the document reserves is never left empty - see the render site.
   */
  readonly readerBar?: LessonShellReaderBar;
  /** Allows the course-owned reader action to focus its own opaque content. */
  readonly contentRef?: Ref<HTMLDivElement>;
  /**
   * Reader focus mode (docs/experience-system.md). On by default: a lesson or
   * chapter reader swaps the tab bar for the compact reader bar below lg.
   *
   * A course landing that borrows the shell only for its desktop rail passes
   * `false`. It is a marketing page, so below lg it keeps the site tab bar and
   * renders no reader bar and no drawer control: the landing's own chapter
   * list is the navigation there. From lg the rail is unchanged.
   */
  readonly readerFocus?: boolean;
  /**
   * The `COURSE_PLAKAT` id whose scene line colours the lesson H1 and the
   * Kopflinien. Optional: without it the shell reads the course from the
   * route; a route outside the course families stays Druckschwarz.
   */
  readonly courseId?: string;
  /**
   * Visual system. "werk" (default) is the Werkzeichnung reader of the
   * technical courses. "app" is the course-app reader of the four
   * Grundlagen courses: warm paper ground with soft brand light, a rounded
   * outline rail, no scene-coloured headings and no Kopflinien.
   */
  readonly look?: "werk" | "app";
  /**
   * Sticky header at the top of the learning column (course-app only), for
   * example the course header with lesson and course progress.
   */
  readonly header?: ReactNode;
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
  readerBar,
  contentRef,
  readerFocus = true,
  courseId,
  look = "werk",
  header,
}: LessonShellProps) {
  const app = look === "app";
  const routeScene = lessonScene(usePathname(), courseId);
  const scene = app ? undefined : routeScene;
  const shellRef = useRef<HTMLDivElement>(null);
  const lastNavOpenerRef = useRef<HTMLElement | null>(null);
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
      // The drawer is opened from the reader bar: its contents button when a
      // reader supplies a next step, otherwise the bar's own action.
      const toggle =
        lastNavOpenerRef.current ??
        shellRef.current?.querySelector<HTMLElement>(
          "[data-reader-focus-navigation], [data-reader-focus-action]",
        ) ??
        null;
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

  // Reader focus mode (docs/experience-system.md, "Reader focus mode"): the
  // attribute is static markup on the wrapper this shell owns inside <main>,
  // so it is in the first response, never toggles, and the mobile tab bar
  // (`body:has([data-reader="focus"])`) is absent from the first paint on.
  // A landing (`readerFocus={false}`) omits it and keeps the tab bar.
  return (
    <div
      ref={shellRef}
      className={cx(
        "flex min-h-[calc(100svh-7rem)] min-w-0 max-w-full overflow-x-clip",
        app ? "course-app-ground" : "bg-background",
      )}
      data-lesson-shell
      data-lesson-look={look}
      data-content-mode={contentMode}
      data-reader={readerFocus ? "focus" : undefined}
      data-plakat-page={scene}
    >
      {/* Desktop sidebar */}
      <aside
        aria-label={navLabel}
        data-lesson-shell-desktop-sidebar
        data-lesson-shell-navigation
        data-collapsed={desktopSidebarCollapsed ? "true" : "false"}
        className={cx(
          app
            ? "hidden shrink-0 self-start overflow-hidden lg:sticky lg:top-[var(--nav-h)] lg:block lg:h-[calc(100svh-var(--nav-h))] lg:py-4 lg:pl-4"
            : "hidden shrink-0 self-start overflow-hidden border-r border-hairline bg-background lg:sticky lg:top-28 lg:block lg:h-[calc(100svh-7rem)]",
          app
            ? desktopSidebarCollapsed
              ? "lg:w-20"
              : "lg:w-80"
            : desktopSidebarCollapsed
              ? "lg:w-14"
              : "lg:w-60",
        )}
      >
        <div
          className={cx(
            "flex h-full min-h-0 flex-col",
            app && "rounded-[28px] border border-lab-line/80 bg-paper/80 shadow-lab",
          )}
        >
          <div
            className={cx(
              "relative flex min-h-14 shrink-0 items-center gap-2 p-2",
              app ? "" : "border-b border-hairline",
              desktopSidebarCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {desktopSidebarCollapsed ? (
              app ? null : (
                <span
                  aria-hidden="true"
                  className="absolute left-0 h-8 w-0.5 bg-foreground"
                />
              )
            ) : (
              <span
                className={cx(
                  "min-w-0 break-words pl-1",
                  app ? "pl-2 text-[15px] font-bold text-foreground" : "text-label text-foreground",
                )}
              >
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
              className={app ? APP_ICON_BUTTON : WERK_ICON_BUTTON}
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
            className={cx(
              "min-h-0 flex-1 overscroll-contain [scrollbar-gutter:stable]",
              desktopSidebarCollapsed
                ? "overflow-hidden p-0"
                : app
                  ? "overflow-y-auto px-2 pb-3"
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
            className={cx(
              "fixed inset-0 z-[60] lg:hidden",
              app ? "bg-[#1b2440]/25" : "bg-sky-wash/80",
            )}
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
              // The drawer reaches three display edges, so it pads itself with
              // the shell's safe-area tokens rather than reading env() here.
              // Same computed inset, one definition point: the tokens carry the
              // 0px fallback that keeps every max() valid, and overriding one on
              // :root moves every fixed shell surface together, which is how the
              // mobile shell suite drives an inset the emulator will not report.
              className={cx(
                "fixed inset-y-0 left-0 z-[70] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain pb-[max(1rem,var(--safe-area-bottom))] pl-[max(1rem,var(--safe-area-left))] pr-3 pt-[max(0.75rem,var(--safe-area-top))] lg:hidden",
                app
                  ? "w-[22rem] rounded-r-[28px] bg-paper shadow-lab-lg"
                  : "w-72 border-r border-hairline bg-background",
              )}
            >
              <div
                className={cx(
                  "mb-3 flex min-h-14 items-center justify-between gap-3 pb-2",
                  app ? "" : "border-b border-hairline",
                )}
              >
                <span
                  className={cx(
                    "min-w-0 break-words",
                    app ? "pl-2 text-[15px] font-bold text-foreground" : "text-label text-foreground",
                  )}
                >
                  {navLabel}
                </span>
                <button
                  type="button"
                  onClick={closeNav}
                  aria-expanded="true"
                  aria-controls={navId}
                  aria-label={closeNavLabel}
                  className={app ? APP_ICON_BUTTON : WERK_ICON_BUTTON}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {renderSidebar?.("mobile") ?? sidebar}
            </m.aside>
          </MotionProvider>
        </>
      )}

      {/* Main content. Below lg there is no sticky toolbar under the compact
          top bar: the reader bar at the bottom edge already carries the
          drawer control, and a second control for the same drawer cost 48px
          of fixed chrome on every phone screen. */}
      <div className="min-w-0 max-w-full flex-1 overflow-x-clip px-4 pb-6 pt-4 sm:px-5 lg:px-6 lg:py-7 xl:px-8">
        {app ? header : null}
        <div
          ref={contentRef}
          data-lesson-shell-content
          data-content-mode={contentMode}
          data-lesson-stage
          // The lesson H1 (an <h1>, or the lesson reference's level-1
          // heading) and the 2px Kopflinien take the scene line (Ultramarin
          // 11.26, Kobalt 7.15, Aubergine 12.57 on Kalkweiß); body, widgets
          // and callouts stay paper and ink. Druckschwarz without a scene.
          className={cx(
            app
              ? "mx-auto w-full min-w-0 overflow-x-clip [&>*]:min-w-0"
              : "mx-auto w-full min-w-0 overflow-x-clip lg:pt-2 [&>*]:min-w-0 [&_h1]:text-scene-line [&_[role=heading][aria-level='1']]:text-scene-line [&_.border-t-2.border-foreground]:border-scene-line",
            CONTENT_WIDTH_CLASS[contentMode],
          )}
        >
          {children}
        </div>
      </div>

      {/* Compact reader bar below lg. A sibling of the drawer, so the drawer's
          inert sweep covers it like the rest of the page.

          In focus mode it is rendered unconditionally, and that is the whole
          point of it: `data-reader="focus"` above removes the mobile tab bar
          below lg, so a shell that rendered no bar here would take the
          phone's only bottom navigation away and put nothing back. The
          chapter reader is the precedent - it renders its bar unconditionally
          too. A landing outside focus mode keeps the tab bar and renders
          neither this bar nor a drawer control.

          The bar is also the only place the drawer opens from below lg. With
          a reader's next step it holds a contents button named `openNavLabel`
          beside that action; without one, the lesson list itself is the
          action, named `navLabel` after its visible text. Like any scripted
          control both carry `js-shell-only` and are removed without
          JavaScript, where the drawer cannot open anyway. */}
      {readerFocus ? (
        <ReaderFocusBar
          tone={app ? "app" : "werk"}
          position={readerBar?.position}
          positionLabel={readerBar?.positionLabel}
          action={
            readerBar?.next ?? {
              kind: "button",
              label: navLabel,
              onSelect: () => {
                lastNavOpenerRef.current = null;
                onNavOpenChange(true);
              },
            }
          }
        >
          {readerBar?.next ? (
            <button
              type="button"
              data-reader-focus-navigation
              aria-label={openNavLabel}
              aria-expanded={navOpen}
              aria-controls={navId}
              onClick={(event) => {
                lastNavOpenerRef.current = event.currentTarget;
                onNavOpenChange(true);
              }}
              className={cx(
                "js-shell-only",
                app
                  ? APP_ICON_BUTTON
                  : "inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border text-foreground outline-none transition-colors duration-150 hover:border-foreground hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-brand-orange motion-reduce:transition-none",
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </ReaderFocusBar>
      ) : null}
    </div>
  );
}
