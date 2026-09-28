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
  type ReactNode,
} from "react";
import {
  m,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { cn } from "@/lib/utils";
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
  EXAMPLE_ROUTES,
  LEARNING_ROUTES,
  WORKSHOP_ROUTES,
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

// Praxis is what you try out: the workshops and the applied examples. Open
// Source is a direct link in the header row, as it was in the studio header.
const praxisNavItems: readonly NavItem[] = [
  { href: "/workshops", label: "workshops" },
  { href: "/demos", label: "appliedExamples" },
];

// Which group is current comes from the site-section table, the same one
// that marks the companion tab bar, so the two never disagree about a
// course or workshop page. Open Source has its own link, so the Praxis
// trigger covers only the routes its menu lists.
const PRAXIS_MENU_ROUTES: readonly string[] = [
  ...WORKSHOP_ROUTES,
  ...EXAMPLE_ROUTES,
];

const primaryLinks: readonly NavItem[] = [
  { href: "/blog", label: "blog" },
  { href: "/open-source", label: "openSource" },
  { href: "/ueber-mich", label: "aboutTim" },
];

const NO_SCRIPT_DIRECT_ITEMS: readonly NavItem[] = [
  ...primaryLinks,
  { href: "/login", label: "login" },
];

type DropdownId = "lernen" | "praxis" | null;

/**
 * A row in the phone sheet's link grid. The current page carries the copper
 * rule on its left edge plus ink text, so the state is a shape as well as a
 * colour. The focus ring is drawn inside the row because the scrolling sheet
 * clips anything outside it.
 */
const MOBILE_CELL_CLASS =
  "flex min-h-11 min-w-0 items-center border-l-[3px] px-3 py-1 text-sm leading-snug outline-none transition-[background-color,border-color,color] duration-150 hover:bg-card-hover hover:text-foreground focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none";

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
 * Portrait phones get two-column grids, so the whole menu fits a 320x568
 * screen above the tab bar without scrolling inside the sheet. From sm
 * (landscape phones, tablets) the groups stand side by side as three
 * single-column lists, so the sheet is only as tall as its longest group.
 */
const MOBILE_GRID_CLASS =
  "mt-1 grid grid-flow-col grid-cols-2 gap-x-4 sm:grid-flow-row sm:grid-cols-1 sm:grid-rows-none";

const MOBILE_GROUPS_CLASS = "sm:grid sm:grid-cols-3 sm:gap-x-6";

const MOBILE_SECTION_CLASS =
  "border-t border-border/60 pt-3 first:border-t-0 sm:border-t-0";

const MOBILE_GROUP_LABEL_CLASS =
  "font-ui-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange";

/* ─── Scroll-driven brand mark ───────────────────────────────────────────── */

const LOCKUP_FONT_STACK =
  '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * The studio lockup: the copper L tile and the LOEHRNING.AI wordmark.
 *
 * On scroll the tile tips a few degrees, and the wordmark's own leading L
 * fades and folds away while the rest of the word slides toward the tile, so
 * the tile's L takes its place: "L" + "OEHRNING.AI". The leading L keeps its
 * layout box and only its transform changes, so the header never reflows.
 * The distances are in em, so the move is the same at every wordmark size.
 * Reduced motion keeps the complete lockup static.
 *
 * Below 360px the compact bar shows the tile alone; the language pill and the
 * menu button need the rest of the row.
 */
function LogoWordmark({
  scrollY,
  locale,
  homeLabel,
  onNavigate,
}: {
  readonly scrollY: MotionValue<number>;
  readonly locale: Locale;
  readonly homeLabel: string;
  readonly onNavigate?: () => void;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const iconRotate = useTransform(scrollY, [0, 160], [0, -8]);
  const leadingLOpacity = useTransform(scrollY, [40, 120], [1, 0]);
  const leadingLScale = useTransform(scrollY, [40, 120], [1, 0]);
  const remainderOffset = useTransform(scrollY, [40, 120], ["0em", "-1em"]);

  return (
    <Link
      href={localizeHref("/", locale)}
      prefetch={false}
      onClick={onNavigate}
      // An inset ring: on the flush compact bar an outer ring would lose its
      // top edge to the viewport. The side padding (and the equal negative
      // margin, so the tile does not move) keeps the ring clear of the tile.
      className="-mx-1.5 inline-flex min-h-11 min-w-0 shrink items-center rounded-xl px-1.5 outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange"
    >
      <m.span
        data-logo-mark
        aria-hidden="true"
        className="mr-3 flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-foreground/40 bg-brand-orange"
        style={{ rotate: prefersReducedMotion ? 0 : iconRotate }}
      >
        <span
          className="text-lg leading-none text-background"
          style={{ fontFamily: LOCKUP_FONT_STACK, fontWeight: 900 }}
        >
          L
        </span>
      </m.span>

      <span
        data-logo-wordmark
        aria-hidden="true"
        translate="no"
        className="hidden whitespace-nowrap text-[19px] uppercase leading-none text-foreground min-[360px]:flex min-[390px]:text-[22px]"
        style={{
          letterSpacing: "-0.035em",
          fontFamily: LOCKUP_FONT_STACK,
          fontWeight: 900,
        }}
      >
        <m.span
          data-logo-wordmark-leading-l
          className="inline-block w-[0.64em] origin-right overflow-hidden"
          style={{
            opacity: prefersReducedMotion ? 1 : leadingLOpacity,
            scaleX: prefersReducedMotion ? 1 : leadingLScale,
          }}
        >
          L
        </m.span>
        <m.span
          data-logo-wordmark-remainder
          className="inline-block"
          style={{ x: prefersReducedMotion ? 0 : remainderOffset }}
        >
          OEHRNING<span className="text-brand-orange">.AI</span>
        </m.span>
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
  const { scrollY } = useScroll();
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
  // language pill, then the close button exactly where the menu button was.
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
  const isPraxisActive = matchesSection(PRAXIS_MENU_ROUTES, routePathname);

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
            "relative inline-flex min-h-11 cursor-pointer items-center gap-1 border-b-[3px] px-1 text-sm outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
            active
              ? "border-brand-orange text-foreground"
              : "border-transparent text-muted-foreground",
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
          {openDropdown === id && (
            <m.div
              ref={menuRef}
              id={menuId}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-border/70 bg-paper p-2 shadow-card-hover"
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
                      "flex min-h-11 items-center border-l-[3px] px-3 py-2 text-sm outline-none transition-[background-color,border-color,color] duration-150 hover:bg-card-hover focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none",
                      isActivePath(item.href)
                        ? "border-brand-orange text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
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
  // two-column grid of 44px rows, so the whole menu fits a 320x568 screen
  // above the tab bar without scrolling inside the sheet. The no-script
  // fallback renders the same groups, without the close handler.
  function renderMobileGroup(
    label: string | null,
    items: readonly NavItem[],
    onNavigate?: () => void,
    footer?: ReactNode,
  ) {
    return (
      <section className={MOBILE_SECTION_CLASS}>
        {label === null ? (
          // The direct links carry no heading. From sm their column still
          // starts on the same line as its neighbours' first rows.
          <p
            aria-hidden="true"
            className={cn(MOBILE_GROUP_LABEL_CLASS, "hidden sm:block")}
          >
            {"\u00a0"}
          </p>
        ) : (
          <p className={MOBILE_GROUP_LABEL_CLASS}>{label}</p>
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
                  label === null && "font-medium",
                  isActivePath(item.href)
                    ? "border-brand-orange text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {itemLabel}
              </Link>
            );
          })}
        </div>
        {footer}
      </section>
    );
  }

  function renderMobileGroups(
    directItems: readonly NavItem[],
    onNavigate?: () => void,
    directFooter?: ReactNode,
  ) {
    return (
      <div className={MOBILE_GROUPS_CLASS}>
        {renderMobileGroup(copy.learning, lernenNavItems, onNavigate)}
        {renderMobileGroup(copy.practice, praxisNavItems, onNavigate)}
        {renderMobileGroup(null, directItems, onNavigate, directFooter)}
      </div>
    );
  }

  return (
    // Two shells, one markup tree. Below lg the bar is flush with the top edge
    // of the viewport and exactly --nav-h-compact tall, which is the offset
    // <main> reserves, so page content begins directly under it. From lg the
    // floating glass pill returns: an inset, rounded, softly shadowed studio
    // bar inside the --nav-h band. Both shells are translucent paper, never
    // a dark surface.
    <nav
      aria-label={copy.mainNavigation}
      className="no-js-primary-nav fixed top-0 z-50 w-full text-foreground lg:px-3 lg:pt-2"
    >
      <div
        data-nav-header-row
        className="mx-auto flex h-[var(--nav-h-compact)] max-w-6xl items-center justify-between border-b border-border/60 bg-background/85 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 sm:px-5 lg:h-12 lg:rounded-2xl lg:border-x lg:border-t lg:shadow-card"
      >
        <LogoWordmark scrollY={scrollY} locale={locale} homeLabel={copy.home} />

        {/* Interactive desktop navigation. The no-script stylesheet hides
            these dropdown triggers and exposes the complete static link list
            below instead.
            The cluster is a size container. At real desktop widths it is at
            least 44rem wide (1024px viewport), so nothing below changes. When
            the page is zoomed so far that the layout is narrower than that
            while the lg breakpoint still holds, the gaps tighten, the GitHub
            icon steps back to the footer (which always lists it) and the
            sign-in pill drops to its icon, so nothing runs past the pill. */}
        <div className="js-desktop-nav @container/desktop-nav hidden lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-end">
          <div className="ml-6 flex items-center gap-3 xl:gap-4 @max-[44rem]/desktop-nav:ml-3 @max-[44rem]/desktop-nav:gap-1.5">
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
                  "inline-flex min-h-11 items-center whitespace-nowrap border-b-[3px] px-1 text-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                  isActivePath(link.href)
                    ? "border-brand-orange text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {copy[link.label]}
              </Link>
            ))}

            <LanguageSwitch />

            {/* Site navigation points at the organisation that publishes this
                platform, not at the maintainer's personal account. Tim's own
                profile stays on /ueber-mich, where it belongs. */}
            <a
              href={GITHUB_ORG.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.githubOrganisation}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-muted-foreground outline-none transition-[background-color,border-color,color] duration-150 hover:border-border hover:bg-brand-peach/45 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none @max-[44rem]/desktop-nav:hidden"
            >
              <Github size={17} aria-hidden="true" />
            </a>

            <AuthStatus />
          </div>
        </div>

        {/* The compact bar carries three controls and no fourth: the brand
            link above, the DE/EN pill, and the menu button that opens the
            complete navigation. Everything else lives inside that dialog, so
            the row stays inside 320px and every target keeps its 44px.
            The no-script stylesheet also exposes this compact group on wide
            screens while hiding its inert menu button. */}
        <div className="js-compact-nav flex items-center gap-1 lg:hidden">
          {/* Hidden, like the menu button, while the sheet is open: the
              sheet's own header row carries the same pill in the same
              place. */}
          <LanguageSwitch className={mobileOpen ? "invisible" : undefined} />
          <button
            type="button"
            ref={mobileToggleRef}
            onClick={openMobileMenu}
            tabIndex={mobileOpen ? -1 : undefined}
            aria-hidden={mobileOpen || undefined}
            className={cn(
              "js-mobile-nav-toggle inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl p-2 text-muted-foreground outline-none transition-colors duration-150 hover:bg-brand-peach/45 hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none",
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
      <div className="no-js-mobile-nav mx-2 mt-2 hidden rounded-2xl border border-border/70 bg-paper px-4 pb-3 shadow-card sm:mx-3 sm:px-6 lg:mx-auto lg:max-w-6xl">
        {renderMobileGroups(NO_SCRIPT_DIRECT_ITEMS)}
      </div>

      {/* Mobile menu. A paper sheet that lies over the compact bar, so its
          close button sits exactly where the menu button was and the thumb
          opens and closes in one place. It ends above the tab bar band at
          every width, so the tab bar is never covered, and the paper veil
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
            className="fixed inset-0 bg-background/70 lg:hidden"
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
            className="absolute inset-x-0 top-0 flex max-h-[calc(100dvh-var(--tabbar-band-h))] flex-col overscroll-contain rounded-b-2xl border-b border-border/70 bg-paper shadow-card-hover lg:hidden"
          >
            {/* The bar again, on the sheet: same height token, same gutter,
                same brand link and the same pill, with the close button in
                the menu button's place. */}
            <div
              data-mobile-menu-header
              className="flex h-[var(--nav-h-compact)] shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 sm:px-5"
            >
              <LogoWordmark
                scrollY={scrollY}
                locale={locale}
                homeLabel={copy.home}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="flex shrink-0 items-center gap-1">
                <LanguageSwitch />
                <button
                  type="button"
                  ref={mobileCloseRef}
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl p-2 text-muted-foreground outline-none transition-colors duration-150 hover:bg-brand-pink/45 hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none"
                  aria-label={copy.closeMenu}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6">
              {renderMobileGroups(
                primaryLinks,
                () => setMobileOpen(false),
                <AuthStatus mobile onNavigate={() => setMobileOpen(false)} />,
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
