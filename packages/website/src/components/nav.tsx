"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { cx as cn } from "@/components/werk/cx";
import { AuthStatus } from "@/components/auth/auth-status";
import { GITHUB_ORG } from "@/lib/seo/entity";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import {
  GLOBAL_NAVIGATION_COPY,
  type GlobalNavigationCopy,
} from "@/lib/i18n/global-copy";
import {
  localizeHref,
  parseLocalePathname,
  type Locale,
} from "@/lib/i18n/locale";
import { useLocale } from "@/components/i18n/locale-context";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { setNavModalOpen } from "@/lib/a11y/nav-modal-state";
import {
  NAV_MENU_INERT_ATTRIBUTE,
  setSharedInertOwner,
} from "@/lib/a11y/shared-inert";
import {
  LEARNING_ROUTES,
  PRACTICE_ROUTES,
  matchesSection,
} from "@/lib/navigation/site-sections";

type NavigationLabel = keyof GlobalNavigationCopy;

interface NavItem {
  readonly href: string;
  readonly label: NavigationLabel;
}

// Navigation follows the learner's task, not the site's content types.
// Individual course cards remain on the hub, where their sequence and access
// facts can be explained without turning the header into a catalog.
const lernenNavItems: readonly NavItem[] = [
  { href: "/kurse", label: "allCourses" },
  { href: "/kurse#lernpfad", label: "foundations" },
  { href: "/kurse#tiefer-gehen", label: "technicalCourses" },
  { href: "/ki-check", label: "aiCheck" },
  { href: "/buecher", label: "learningBooks" },
];

// Praxis is what you try and reuse: the workshops, the applied examples and
// the open-source material. The footer's Praxis column and the Praxis tab
// hold the same three.
const praxisNavItems: readonly NavItem[] = [
  { href: "/workshops", label: "workshops" },
  { href: "/demos", label: "appliedExamples" },
  { href: "/open-source", label: "openSource" },
];

// Which group is current comes from the site-section table, the same one
// that marks the companion tab bar, so the two never disagree about a page.
const primaryLinks: readonly NavItem[] = [
  { href: "/blog", label: "blog" },
  { href: "/ueber-mich", label: "aboutTim" },
];

const NO_SCRIPT_DIRECT_ITEMS: readonly NavItem[] = [
  ...primaryLinks,
  { href: "/login", label: "login" },
];

type DropdownId = "lernen" | "praxis" | null;

/**
 * The current destination inside a menu: a small ink square plus a weight
 * change, so the state never rests on colour alone. The square hangs in the
 * row's left gutter, so row text lines up with its group label and marking a
 * row moves nothing. The row that renders it must be `relative`.
 */
function ActiveMarker({ active }: { readonly active: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-nav-active-marker={active ? "true" : undefined}
      className={cn(
        "absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2",
        active ? "bg-foreground" : "bg-transparent",
      )}
    />
  );
}

/**
 * A cell in the phone sheet's two-column link grid. Each cell reaches one
 * gutter to the left (the sheet's px-4 / sm:px-6 for the first column, the
 * column gap for the second), so its text starts on the column edge, in line
 * with the group label, and the current-page square hangs in that gutter. The
 * focus ring is drawn inside the cell because the scrolling sheet clips
 * anything outside it. The links are body size in ink, a step above their
 * small muted group labels, so the sheet reads as destinations under
 * headings rather than one grey block.
 */
const MOBILE_CELL_CLASS =
  "relative -ml-4 flex min-h-11 min-w-0 items-center gap-2 py-1 pl-4 pr-2 text-base leading-snug text-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:bg-card-hover focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none sm:-ml-6 sm:pl-6";

/**
 * The grid fills column by column, so a group reads down the left column
 * first and the tab order follows the eye. Static classes, one per row count
 * the menu uses, so Tailwind sees every one of them.
 */
const MOBILE_GRID_ROWS: Readonly<Record<number, string>> = {
  1: "grid-rows-1",
  2: "grid-rows-2",
  3: "grid-rows-3",
};

/**
 * From sm (landscape phones, tablets) the groups stand side by side as three
 * single-column lists, so the sheet is only as tall as its longest group and
 * never scrolls inside a 390px-high landscape screen. Portrait phones keep
 * the stacked two-column grids.
 */
const MOBILE_GRID_CLASS =
  "grid grid-flow-col grid-cols-2 gap-x-4 sm:grid-flow-row sm:grid-cols-1 sm:grid-rows-none sm:gap-x-6";

const MOBILE_GROUPS_CLASS = "sm:grid sm:grid-cols-3 sm:gap-x-6";

const MOBILE_SECTION_CLASS =
  "border-t border-hairline pt-2 first:border-t-0 sm:border-t-0";

/* ─── Brand lockup ───────────────────────────────────────────────────────── */

/**
 * One static lockup: the Mennige square with a paper L, then the wordmark in
 * the site face, 700, at the headline tracking floor. It is the only Mennige
 * mark in the chrome and it matches the footer's wordmark. Nothing rotates,
 * collapses or moves on scroll.
 */
function LogoWordmark({
  locale,
  homeLabel,
  onNavigate,
}: {
  readonly locale: Locale;
  readonly homeLabel: string;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link
      href={localizeHref("/", locale)}
      prefetch={false}
      onClick={onNavigate}
      className="inline-flex min-h-11 min-w-0 shrink items-center outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        data-logo-mark
        aria-hidden="true"
        className="mr-3 flex size-[38px] shrink-0 items-center justify-center bg-mennige"
      >
        <span className="text-lg font-bold leading-none text-paper">L</span>
      </span>
      <span
        data-logo-wordmark
        aria-hidden="true"
        translate="no"
        className="inline whitespace-nowrap text-[1.25rem] font-bold leading-none tracking-[-0.015em] text-foreground"
      >
        loehrning.ai
      </span>
      <span className="sr-only">loehrning.ai - {homeLabel}</span>
    </Link>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────────────────── */

export function Nav() {
  const locale = useLocale();
  const copy = GLOBAL_NAVIGATION_COPY[locale];
  const pathname = usePathname() ?? "";
  const parsedPathname = parseLocalePathname(pathname || "/");
  const routePathname = parsedPathname.valid ? parsedPathname.pathname : "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDialogLocked, setMobileDialogLocked] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const restoreMobileToggleAfterExit = useRef(false);
  const openMobileMenu = useCallback(() => {
    setMobileDialogLocked(true);
    setMobileOpen(true);
  }, []);
  const closeMobileMenu = useCallback(() => {
    restoreMobileToggleAfterExit.current = true;
    setMobileOpen(false);
  }, []);
  const mobileMenuRef = useFocusTrap<HTMLDivElement>(
    mobileOpen,
    closeMobileMenu,
    { restoreFocus: false },
  );
  // The sheet's header row repeats the compact bar: the brand link, the
  // account link, then the close button exactly where the menu button was.
  // The trap focuses the first control in DOM order; this effect runs after
  // it and hands initial focus to the close button, where it has always
  // landed.
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mobileOpen) mobileCloseRef.current?.focus();
  }, [mobileOpen]);
  const hrefPathname = (href: string) => href.split(/[?#]/, 1)[0] || "/";
  const isActivePath = (href: string) => {
    if (href.includes("#")) return false;
    const target = hrefPathname(href);
    return routePathname === target || routePathname.startsWith(target + "/");
  };
  const isCurrentPage = (href: string) =>
    !href.includes("#") && routePathname === hrefPathname(href);
  const isLernenActive = matchesSection(LEARNING_ROUTES, routePathname);
  const isPraxisActive = matchesSection(PRACTICE_ROUTES, routePathname);

  function openMenu(id: DropdownId) {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(id);
  }

  function closeMenu() {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  }

  useEffect(() => {
    return () => clearTimeout(dropdownTimeout.current);
  }, []);

  // Escape closes the desktop dropdown. The mobile dialog is handled by the
  // focus trap below so it has one keyboard listener and reliable restoration.
  useEffect(() => {
    if (openDropdown === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openDropdown]);

  // Keep the document behind the mobile dialog out of the accessibility tree
  // and lock body scroll until its exit animation has removed the dialog.
  useLayoutEffect(() => {
    setNavModalOpen(mobileDialogLocked);
    if (!mobileDialogLocked) {
      if (restoreMobileToggleAfterExit.current) {
        restoreMobileToggleAfterExit.current = false;
        mobileToggleRef.current?.focus();
      }
      return;
    }
    // Every landmark outside the dialog leaves the accessibility tree, the
    // companion shell's own fixed surfaces included. The bottom tab bar is a
    // second navigation landmark that the dialog covers rather than replaces,
    // so it is neutralised through its `data-mobile-tab-bar` hook. The query
    // simply finds nothing on a route that renders no tab bar.
    const toInert = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main, footer, [data-nav-header-row], .no-js-mobile-nav, [data-mobile-tab-bar]",
      ),
    );
    for (const el of toInert) {
      setSharedInertOwner(el, NAV_MENU_INERT_ATTRIBUTE, true);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      for (const el of toInert) {
        setSharedInertOwner(el, NAV_MENU_INERT_ATTRIBUTE, false);
      }
      document.body.style.overflow = previousOverflow;
      setNavModalOpen(false);
    };
  }, [mobileDialogLocked]);

  // Route changes and pointer/focus leaving a desktop disclosure both settle
  // the navigation state. A disclosure must never remain expanded after the
  // user has moved elsewhere on the page.
  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (openDropdown === null) return;
    function closeWhenOutside(event: PointerEvent | FocusEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-nav-dropdown]")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("focusin", closeWhenOutside);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("focusin", closeWhenOutside);
    };
  }, [openDropdown]);

  // ── WAI-ARIA disclosure keyboard support ──
  // Trigger: ArrowDown/ArrowUp opens the menu and moves focus to the
  // first/last item. Inside the menu: ArrowDown/ArrowUp cycle, Home/End
  // jump, Escape closes and returns focus to the trigger, Tab closes.
  const lernenTriggerRef = useRef<HTMLButtonElement>(null);
  const lernenMenuRef = useRef<HTMLDivElement>(null);
  const praxisTriggerRef = useRef<HTMLButtonElement>(null);
  const praxisMenuRef = useRef<HTMLDivElement>(null);
  const pendingMenuFocus = useRef<"first" | "last" | null>(null);

  function menuRefFor(id: Exclude<DropdownId, null>) {
    if (id === "praxis") return praxisMenuRef;
    return lernenMenuRef;
  }

  function triggerRefFor(id: Exclude<DropdownId, null>) {
    if (id === "praxis") return praxisTriggerRef;
    return lernenTriggerRef;
  }

  function menuItemsOf(menu: HTMLElement | null): HTMLElement[] {
    if (!menu) return [];
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[data-nav-menu-item]:not([aria-disabled="true"])',
      ),
    );
  }

  // Focus the first/last dropdown link once a menu opened via keyboard.
  useEffect(() => {
    if (openDropdown === null || pendingMenuFocus.current === null) return;
    const items = menuItemsOf(menuRefFor(openDropdown).current);
    const target =
      pendingMenuFocus.current === "last" ? items[items.length - 1] : items[0];
    target?.focus();
    pendingMenuFocus.current = null;
  }, [openDropdown]);

  function handleTriggerKeyDown(id: Exclude<DropdownId, null>) {
    return (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const edge = e.key === "ArrowUp" ? "last" : "first";
      if (openDropdown === id) {
        const items = menuItemsOf(menuRefFor(id).current);
        const target = edge === "last" ? items[items.length - 1] : items[0];
        target?.focus();
      } else {
        pendingMenuFocus.current = edge;
        openMenu(id);
      }
    };
  }

  function handleMenuKeyDown(id: Exclude<DropdownId, null>) {
    return (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const items = menuItemsOf(menuRefFor(id).current);
      if (items.length === 0) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          items[(idx + 1) % items.length]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          items[idx <= 0 ? items.length - 1 : idx - 1]?.focus();
          break;
        case "Home":
          e.preventDefault();
          items[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case "Escape":
          e.preventDefault();
          setOpenDropdown(null);
          triggerRefFor(id).current?.focus();
          break;
        case "Tab":
          // Let the browser move focus on; the menu must not linger open.
          setOpenDropdown(null);
          break;
      }
    };
  }

  // One desktop disclosure renderer keeps keyboard, focus, and ARIA behaviour
  // identical across the three task groups.
  function renderDropdown(
    id: Exclude<DropdownId, null>,
    label: string,
    items: readonly NavItem[],
    menuId: string,
    active: boolean,
  ) {
    const triggerRef = triggerRefFor(id);
    const menuRef = menuRefFor(id);
    return (
      <div
        data-nav-dropdown={id}
        className="relative"
        onMouseEnter={() => openMenu(id)}
        onMouseLeave={closeMenu}
      >
        <button
          type="button"
          ref={triggerRef}
          aria-controls={menuId}
          aria-expanded={openDropdown === id}
          aria-current={active ? "true" : undefined}
          onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
          onKeyDown={handleTriggerKeyDown(id)}
          className={cn(
            "relative inline-flex min-h-11 cursor-pointer items-center gap-1 border-y-2 border-t-transparent px-1 text-sm font-medium outline-none transition-colors duration-[120ms] hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
            active
              ? "border-b-foreground text-foreground"
              : "border-b-transparent text-muted-foreground",
          )}
        >
          {label}
          <ChevronDown
            size={13}
            aria-hidden="true"
            className={cn(
              "transition-transform duration-150 motion-reduce:transition-none",
              openDropdown === id && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {/* The sheet sizes to its longest row. It sits 16px left of the
              trigger so each row's text starts under the trigger label, with
              the current-row square hanging in the row's gutter. */}
          {openDropdown === id && (
            <m.div
              ref={menuRef}
              id={menuId}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.12 }}
              className="absolute -left-4 top-full mt-2 w-max min-w-48 border border-foreground bg-card py-1 shadow-overlay"
              onKeyDown={handleMenuKeyDown(id)}
            >
              {items.map((item) => {
                const itemLabel = copy[item.label];
                return (
                  <Link
                    key={item.href}
                    href={localizeHref(item.href, locale)}
                    prefetch={false}
                    data-nav-menu-item
                    onClick={() => setOpenDropdown(null)}
                    aria-current={isCurrentPage(item.href) ? "page" : undefined}
                    className={cn(
                      // inset-ring, never ring-inset: with the --color-inset
                      // token, Tailwind v4 also reads `ring-inset` as a ring
                      // colour (Beton) and it wins over ring-brand-orange.
                      "relative flex min-h-11 items-center py-2 pl-5 pr-3 text-sm outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none",
                      isActivePath(item.href)
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ActiveMarker active={isActivePath(item.href)} />
                    <span>{itemLabel}</span>
                  </Link>
                );
              })}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // The mobile dialog uses the same task groups as desktop, each as a
  // two-column grid of 44px cells, so the whole menu fits a 320x568 screen
  // above the tab bar without scrolling inside the sheet. The no-script
  // fallback renders the same groups, without the close handler.
  function renderMobileGroup(
    label: string | null,
    items: readonly NavItem[],
    onNavigate?: () => void,
  ) {
    return (
      <section className={MOBILE_SECTION_CLASS}>
        {label === null ? (
          // The direct links carry no heading. From sm their column still
          // starts on the same line as its neighbours' first cells.
          <p aria-hidden="true" className="hidden text-caption sm:block">
            {"\u00a0"}
          </p>
        ) : (
          <p className="text-caption text-muted-foreground">{label}</p>
        )}
        <div
          className={cn(
            MOBILE_GRID_CLASS,
            MOBILE_GRID_ROWS[Math.ceil(items.length / 2)],
          )}
        >
          {items.map((item) => {
            const itemLabel = copy[item.label];
            return (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                prefetch={false}
                onClick={onNavigate}
                aria-current={isCurrentPage(item.href) ? "page" : undefined}
                className={cn(
                  MOBILE_CELL_CLASS,
                  isActivePath(item.href) && "font-semibold",
                )}
              >
                <ActiveMarker active={isActivePath(item.href)} />
                {itemLabel}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  function renderMobileGroups(
    directItems: readonly NavItem[],
    onNavigate?: () => void,
  ) {
    return (
      <div className={MOBILE_GROUPS_CLASS}>
        {renderMobileGroup(copy.learning, lernenNavItems, onNavigate)}
        {renderMobileGroup(copy.practice, praxisNavItems, onNavigate)}
        {renderMobileGroup(null, directItems, onNavigate)}
      </div>
    );
  }

  return (
    // One flat paper band at every width. It is flush with the top edge of the
    // viewport and exactly as tall as the offset <main> reserves:
    // --nav-h-compact below lg, --nav-h from lg. A hairline separates it from
    // the page; there is no pill, no inset and no shadow. The side padding is
    // the page gutter (px-4, sm:px-6), and from lg it lines the wordmark and
    // the Login edge up with the 75rem content column (144..1296 at 1440)
    // while the band itself stays full bleed.
    <nav
      aria-label={copy.mainNavigation}
      className="no-js-primary-nav fixed top-0 z-50 w-full text-foreground"
    >
      <div
        data-nav-header-row
        className="flex h-[var(--nav-h-compact)] w-full items-center justify-between border-b border-hairline bg-background px-4 sm:px-6 lg:h-[var(--nav-h)] lg:px-[max(1.5rem,calc(50%_-_36rem))]"
      >
        <LogoWordmark locale={locale} homeLabel={copy.home} />

        {/* Interactive desktop navigation. The no-script stylesheet hides
            these dropdown triggers and exposes the complete static link list
            below instead. Two groups, as in the blueprint: the site's places
            start after the wordmark, and the utilities (language, GitHub,
            login) sit at the right behind a hairline, so the active language
            never reads as a sixth current page. */}
        <div className="js-desktop-nav hidden lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-between lg:gap-6 lg:pl-10">
          <div className="flex items-center gap-4">
            {renderDropdown(
              "lernen",
              copy.learning,
              lernenNavItems,
              "lernen-nav-menu",
              isLernenActive,
            )}
            {renderDropdown(
              "praxis",
              copy.practice,
              praxisNavItems,
              "praxis-nav-menu",
              isPraxisActive,
            )}
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={localizeHref(link.href, locale)}
                prefetch={false}
                aria-current={
                  routePathname === hrefPathname(link.href) ? "page" : undefined
                }
                className={cn(
                  "inline-flex min-h-11 items-center border-y-2 border-t-transparent px-1 text-sm font-medium transition-colors duration-[120ms] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                  isActivePath(link.href)
                    ? "border-b-foreground text-foreground"
                    : "border-b-transparent text-muted-foreground",
                )}
              >
                {copy[link.label]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-hairline pl-4">
            <LanguageSwitch />

            {/* Site navigation points at the organisation that publishes this
                platform, not at the maintainer's personal account. Tim's own
                profile stays on /ueber-mich, where it belongs. */}
            <a
              href={GITHUB_ORG.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.githubOrganisation}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              <Github size={17} aria-hidden="true" />
            </a>

            <AuthStatus />
          </div>
        </div>

        {/* The compact bar carries three controls and no fourth: the brand
            lockup above, one link to the other language, and the menu button
            that opens the complete navigation. Everything else lives inside
            that dialog, so the row (155 + 44 + 4 + 44px) stays inside 320px
            with the whole wordmark and every target keeps its 44px.
            The no-script stylesheet also exposes this compact group on wide
            screens while hiding its inert menu button. */}
        <div className="js-compact-nav flex items-center gap-1 lg:hidden">
          {/* Hidden, like the menu button, while the sheet is open. The sheet
              covers this bar and carries no second switch: the language is
              one tap away here once the menu closes. */}
          <LanguageSwitch
            compact
            className={mobileOpen ? "invisible" : undefined}
          />
          <button
            type="button"
            ref={mobileToggleRef}
            onClick={openMobileMenu}
            tabIndex={mobileOpen ? -1 : undefined}
            aria-hidden={mobileOpen || undefined}
            className={cn(
              "js-mobile-nav-toggle inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center p-2 text-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
              mobileOpen && "pointer-events-none invisible",
            )}
            aria-label={copy.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Complete server-rendered navigation for browsers without scripting.
          It remains hidden during normal operation and replaces the
          interactive desktop/mobile controls through the layout's
          <noscript> stylesheet. It is the menu sheet's own grid. Sign-in
          joins the direct links here, because at desktop widths without
          scripting neither the tab bar nor the desktop cluster shows. */}
      <div className="no-js-mobile-nav hidden border-b border-hairline bg-background px-4 pb-2 sm:px-6 lg:hidden">
        {renderMobileGroups(NO_SCRIPT_DIRECT_ITEMS)}
      </div>

      {/* Mobile menu. A full-width sheet that lies over the compact bar, so
          its close button sits exactly where the menu button was and the
          thumb opens and closes in one place. It ends above the tab bar band
          at every width, so the tab bar is never covered, and the scrim
          behind it closes the menu on a tap outside the sheet. */}
      <AnimatePresence
        onExitComplete={() => {
          setMobileDialogLocked(false);
        }}
      >
        {mobileOpen && (
          <m.div
            key="mobile-menu-scrim"
            aria-hidden="true"
            data-mobile-menu-scrim
            onClick={closeMobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-foreground/20 lg:hidden"
          />
        )}
        {mobileOpen && (
          <m.div
            key="mobile-menu"
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={copy.mainNavigation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-0 flex max-h-[calc(100dvh-var(--tabbar-band-h))] flex-col overscroll-contain border-b border-foreground bg-card shadow-overlay lg:hidden"
          >
            {/* The bar again, on the sheet: same height token, same gutter,
                same brand link. The account link takes the place of the
                language switch, and the close button the menu button's. */}
            <div
              data-mobile-menu-header
              className="flex h-[var(--nav-h-compact)] shrink-0 items-center justify-between gap-2 border-b border-hairline px-4 sm:px-6"
            >
              <LogoWordmark
                locale={locale}
                homeLabel={copy.home}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="flex shrink-0 items-center gap-1">
                <AuthStatus
                  variant="quiet"
                  onNavigate={() => setMobileOpen(false)}
                />
                <button
                  type="button"
                  ref={mobileCloseRef}
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center p-2 text-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none"
                  aria-label={copy.closeMenu}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-2 sm:px-6">
              {renderMobileGroups(primaryLinks, () => setMobileOpen(false))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
