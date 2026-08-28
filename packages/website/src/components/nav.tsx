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

const praxisNavItems: readonly NavItem[] = [
  { href: "/workshops", label: "workshops" },
  { href: "/demos", label: "appliedExamples" },
];

const lernenPaths = [
  "/kurse",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ai-native",
  "/ki-und-gesellschaft",
  "/ki-check",
  "/buecher",
];

const praxisPaths = ["/demos", "/workshops"];
const primaryLinks = [
  { href: "/blog", label: "blog" },
  { href: "/open-source", label: "openSource" },
  { href: "/ueber-mich", label: "aboutTim" },
] as const;

type DropdownId = "lernen" | "praxis" | null;

function NoScriptMobileGroup({
  label,
  items,
  locale,
  copy,
}: {
  readonly label: string;
  readonly items: readonly NavItem[];
  readonly locale: Locale;
  readonly copy: GlobalNavigationCopy;
}) {
  return (
    <div className="border-t border-border pt-3">
      <p className="font-ui-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
        {label}
      </p>
      <div className="mt-1 flex flex-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={localizeHref(item.href, locale)}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-sm text-foreground"
          >
            {copy[item.label]}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Scroll-driven brand mark ───────────────────────────────────────────── */

const LOCKUP_FONT_STACK =
  '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';

function LogoWordmark({
  scrollY,
  locale,
  homeLabel,
}: {
  readonly scrollY: MotionValue<number>;
  readonly locale: Locale;
  readonly homeLabel: string;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const iconRotate = useTransform(scrollY, [0, 160], [0, -8]);
  const leadingLOpacity = useTransform(scrollY, [40, 120], [1, 0]);
  const leadingLScale = useTransform(scrollY, [40, 120], [1, 0]);
  const remainderOffset = useTransform(scrollY, [40, 120], [0, -22]);

  return (
    <Link
      href={localizeHref("/", locale)}
      prefetch={false}
      className="inline-flex min-h-11 min-w-0 shrink items-center outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <m.div
        data-logo-mark
        className="mr-3 flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl border border-foreground/40 bg-brand-orange shadow-[3px_3px_0_var(--color-brand-acid)]"
        aria-hidden="true"
        style={{
          rotate: prefersReducedMotion ? 0 : iconRotate,
        }}
      >
        <span
          className="text-lg leading-none text-background"
          style={{
            fontFamily: LOCKUP_FONT_STACK,
            fontWeight: 900,
          }}
        >
          L
        </span>
      </m.div>

      <span
        data-logo-wordmark
        aria-hidden="true"
        className="hidden whitespace-nowrap text-[22px] uppercase text-foreground sm:flex"
        style={{
          letterSpacing: "-0.035em",
          fontFamily: LOCKUP_FONT_STACK,
          fontWeight: 900,
        }}
      >
        <m.span
          data-logo-wordmark-leading-l
          className="inline-block w-[14px] origin-right overflow-hidden"
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
  const hrefPathname = (href: string) => href.split(/[?#]/, 1)[0] || "/";
  const isActivePath = (href: string) => {
    if (href.includes("#")) return false;
    const target = hrefPathname(href);
    return routePathname === target || routePathname.startsWith(target + "/");
  };
  const isCurrentPage = (href: string) =>
    !href.includes("#") && routePathname === hrefPathname(href);
  const isLernenActive = lernenPaths.some(
    (p) => routePathname === p || routePathname.startsWith(p + "/"),
  );
  const isPraxisActive = praxisPaths.some(
    (p) => routePathname === p || routePathname.startsWith(p + "/"),
  );

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
    const toInert = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main, footer, [data-nav-header-row], .no-js-mobile-nav",
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
                      "flex min-h-11 items-center border-l-[3px] px-3 py-2 text-sm outline-none transition-[background-color,border-color,color] duration-150 hover:bg-card-hover focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange motion-reduce:transition-none",
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

  // The mobile dialog uses the same task groups as desktop.
  function renderMobileGroup(label: string, items: readonly NavItem[]) {
    return (
      <section className="border-t border-border pt-3">
        <p className="font-ui-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {label}
        </p>
        <div className="mt-1 flex flex-col">
          {items.map((item) => {
            const itemLabel = copy[item.label];
            return (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                aria-current={isCurrentPage(item.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-l-[3px] px-3 text-sm text-muted-foreground transition-[background-color,border-color,color] duration-150 hover:bg-card-hover hover:text-foreground motion-reduce:transition-none",
                  isActivePath(item.href) &&
                    "border-brand-orange text-foreground",
                  !isActivePath(item.href) && "border-transparent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                {itemLabel}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <nav
      aria-label={copy.mainNavigation}
      className="no-js-primary-nav fixed top-0 z-50 w-full px-2 pt-2 text-foreground sm:px-3"
    >
      <div
        data-nav-header-row
        className="mx-auto flex h-12 max-w-6xl items-center justify-between rounded-2xl border border-border/60 bg-background/85 px-3 shadow-card backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 sm:px-5"
      >
        <LogoWordmark scrollY={scrollY} locale={locale} homeLabel={copy.home} />

        {/* Interactive desktop navigation. The no-script stylesheet hides
            these dropdown triggers and exposes the complete static link list
            below instead. */}
        <div className="js-desktop-nav hidden items-center gap-3 lg:flex xl:gap-4">
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
                "inline-flex min-h-11 items-center border-b-[3px] px-1 text-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-muted-foreground outline-none transition-[background-color,border-color,color] duration-150 hover:border-border hover:bg-brand-lilac/45 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Github size={17} aria-hidden="true" />
          </a>

          <AuthStatus />
        </div>

        {/* Keep the locale control visible in the top bar on small screens.
            The no-script stylesheet also exposes this compact group on wide
            screens while hiding its inert menu button. */}
        <div className="js-compact-nav flex items-center gap-1 lg:hidden">
          <LanguageSwitch />
          <button
            type="button"
            ref={mobileToggleRef}
            onClick={openMobileMenu}
            tabIndex={mobileOpen ? -1 : undefined}
            aria-hidden={mobileOpen || undefined}
            className={cn(
              "js-mobile-nav-toggle inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl p-2 text-muted-foreground outline-none transition-colors duration-150 hover:bg-brand-lilac/45 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
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
          <noscript> stylesheet. */}
      <div className="no-js-mobile-nav mt-2 hidden rounded-2xl border border-border/70 bg-paper px-4 py-4 shadow-card sm:px-6 lg:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          <NoScriptMobileGroup
            label={copy.learning}
            items={lernenNavItems}
            locale={locale}
            copy={copy}
          />
          <NoScriptMobileGroup
            label={copy.practice}
            items={praxisNavItems}
            locale={locale}
            copy={copy}
          />
        </div>
        <div className="mt-3 flex flex-col border-t border-border pt-2">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={localizeHref(link.href, locale)}
              prefetch={false}
              className="inline-flex min-h-11 items-center text-sm font-medium text-foreground"
            >
              {copy[link.label]}
            </Link>
          ))}
          <a
            href={GITHUB_ORG.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground"
          >
            <Github size={16} aria-hidden="true" />
            GitHub
          </a>
          <Link
            href={localizeHref("/login", locale)}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-sm font-medium text-foreground"
          >
            {copy.login}
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence
        onExitComplete={() => {
          setMobileDialogLocked(false);
        }}
      >
        {mobileOpen && (
          <m.div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={copy.mainNavigation}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="mt-2 overscroll-contain rounded-2xl border border-border/70 bg-paper shadow-card-hover lg:hidden"
          >
            <div className="flex max-h-[calc(100dvh-4rem)] flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors duration-150 hover:bg-brand-pink/45 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  aria-label={copy.closeMenu}
                >
                  <X size={19} aria-hidden="true" />
                </button>
                <LanguageSwitch />
              </div>
              {renderMobileGroup(copy.learning, lernenNavItems)}
              {renderMobileGroup(copy.practice, praxisNavItems)}
              <div className="flex flex-col border-t border-border pt-2">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={localizeHref(link.href, locale)}
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isCurrentPage(link.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center border-l-[3px] px-3 text-sm font-medium text-muted-foreground transition-[background-color,border-color,color] duration-150 hover:bg-card-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                      isActivePath(link.href)
                        ? "border-brand-orange text-foreground"
                        : "border-transparent",
                    )}
                  >
                    {copy[link.label]}
                  </Link>
                ))}
                <a
                  href={GITHUB_ORG.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-11 items-center gap-2 border-l-[3px] border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-card-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  <Github size={16} aria-hidden="true" />
                  GitHub
                </a>
                <AuthStatus mobile onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
