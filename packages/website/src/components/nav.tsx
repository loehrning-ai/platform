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
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  BookOpen,
  LayoutDashboard,
  Pencil,
  Presentation,
  type LucideIcon,
} from "lucide-react";
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
  readonly icon: LucideIcon;
}

interface AkademieItem extends NavItem {
  readonly badge?: string;
  readonly disabled?: boolean;
}

// Navigation follows the learner's task, not the site's content types.
// Individual course cards remain on the hub, where their sequence and access
// facts can be explained without turning the header into a catalog.
const lernenNavItems: readonly AkademieItem[] = [
  { href: "/kurse", label: "allCourses", icon: Sparkles },
  { href: "/kurse#lernpfad", label: "foundations", icon: GraduationCap },
  { href: "/kurse#tiefer-gehen", label: "technicalCourses", icon: Zap },
  { href: "/ki-check", label: "aiCheck", icon: MapPin },
  { href: "/buecher", label: "learningBooks", icon: BookOpen },
];

const praxisNavItems: readonly AkademieItem[] = [
  { href: "/workshops", label: "workshops", icon: Presentation },
  { href: "/demos", label: "appliedExamples", icon: LayoutDashboard },
];

const wissenNavItems: readonly AkademieItem[] = [
  { href: "/wie-ki-funktioniert", label: "howAiWorks", icon: Sparkles },
  { href: "/blog", label: "blog", icon: Pencil },
  { href: "/bekannte-grenzen", label: "knownLimits", icon: ShieldCheck },
  { href: "/ueber-die-plattform", label: "aboutPlatform", icon: Users },
  { href: "/ueber-mich", label: "aboutTim", icon: GraduationCap },
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
const wissenPaths = [
  "/wie-ki-funktioniert",
  "/blog",
  "/bekannte-grenzen",
  "/ueber-die-plattform",
  "/ueber-mich",
];

const primaryLinks = [{ href: "/open-source", label: "openSource" }] as const;

type DropdownId = "lernen" | "praxis" | "wissen" | null;

function NoScriptMobileGroup({
  label,
  items,
  locale,
  copy,
}: {
  readonly label: string;
  readonly items: readonly AkademieItem[];
  readonly locale: Locale;
  readonly copy: GlobalNavigationCopy;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col">
        {items
          .filter((item) => !item.disabled)
          .map((item) => (
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

/* ─── Scroll-driven logo with icon mark ──────────────────────────────────── */

// Original hardcoded values from the pre-rebrand mark — --color-brand-orange
// has since been redarkened for WCAG AA (#C4431A -> #a5370f), so this keeps the
// original hex rather than the token, which now points at a different color.
const LOGO_ORIGINAL_ORANGE = "#C4431A";
const LOGO_ORIGINAL_INK = "#0B0908";

// The lockup deliberately does NOT go through `--font-sans`. That token leads
// with the brand face, which ships weights 400-700 and loads
// `font-display: optional` with no preload, so on a cold visit it is skipped and
// the chain lands on the generated `loehrningSans Fallback` face —
// `local("Arial")` declared at weight 400. A 900-weight lockup therefore
// rendered as thin Arial in production.
//
// These are all locally installed families, so the lockup costs no bytes and no
// request. That is the constraint, not a preference: the business site reaches
// its black cut through a Geist Sans webfont, and importing that here added 68KB
// on the critical path of every route, which pushed `largest-contentful-paint`
// past its 4500ms Lighthouse budget on /ai-native (4729ms),
// /blog/eu-ai-act-grundlagen (4707ms) and /kurse/open-source/data-science
// (4861ms). Lighthouse simulates ~1.6Mbps, where 68KB is ~340ms of link time.
// Arial Black is a real 900-weight face on macOS and Windows rather than a
// synthesized one; elsewhere the chain degrades to a bolded grotesque.
// Subsetting Geist to the lockup's ten glyphs would be ~3KB and match the
// business site exactly, but THIRD_PARTY_NOTICES.md states Geist "is installed
// from the package lock and is not checked into this repository", and the SIL
// OFL reserved-font-name clause covers a subset. That is a licensing decision,
// not a styling one.
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
  /* Icon: shrinks + rotates on scroll */
  const iconSize = useTransform(scrollY, [0, 160], [40, 26]);
  const iconGap = useTransform(scrollY, [0, 160], [16, 5]);
  const iconRotate = useTransform(scrollY, [0, 160], [0, -8]);
  const iconBorder = useTransform(
    scrollY,
    [0, 100, 160],
    [
      `2px solid ${LOGO_ORIGINAL_INK}`,
      `2px solid ${LOGO_ORIGINAL_INK}`,
      `2px solid ${LOGO_ORIGINAL_ORANGE}`,
    ],
  );
  const iconShadow = useTransform(
    scrollY,
    [0, 160],
    [`3px 3px 0px ${LOGO_ORIGINAL_INK}`, `1px 1px 0px ${LOGO_ORIGINAL_ORANGE}`],
  );
  const iconFontSize = useTransform(scrollY, [0, 160], [20, 13]);

  /* Wordmark: size + tracking tighten */
  const wordmarkSize = useTransform(scrollY, [0, 160], [24, 17]);
  const wordmarkTracking = useTransform(scrollY, [0, 160], [-0.05, -0.02]);
  const wordmarkLetterSpacing = useTransform(
    wordmarkTracking,
    (value) => `${value}em`,
  );

  /* The "L" in LOEHRNING collapses — icon takes over */
  const lOpacity = useTransform(scrollY, [40, 120], [1, 0]);
  const lWidth = useTransform(scrollY, [40, 120], [14, 0]);

  /* The "." in the icon fades out as it merges with the wordmark. Width
     collapses over the same range as opacity — the dot is an inline sibling
     of "L" inside a `justify-content: center` box, so fading it to
     `opacity: 0` alone left its layout width in place, which kept "L" off
     centre (reading as if the square clipped its left side once rotated). */
  const dotOpacity = useTransform(scrollY, [60, 130], [1, 0]);
  const dotWidth = useTransform(scrollY, [60, 130], ["0.4em", "0em"]);

  return (
    /* No clip on this box. The square's rotated bounding box and its hard
       offset shadow both grow past the flex item's edges, so an `overflow-hidden`
       here sliced the corner off the mark as it turned. Containment now sits on
       the wordmark, which is the part that can actually outgrow the row. */
    <Link
      href={localizeHref("/", locale)}
      prefetch={false}
      className="inline-flex min-h-11 min-w-0 shrink items-center outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <m.div
        className="flex flex-shrink-0 items-center justify-center"
        aria-hidden="true"
        style={{
          width: iconSize,
          height: iconSize,
          marginRight: iconGap,
          rotate: iconRotate,
          border: iconBorder,
          boxShadow: iconShadow,
          backgroundColor: LOGO_ORIGINAL_ORANGE,
        }}
      >
        {/* The dot stays in flow, as it does on the business site. Taking it
            out with `position: absolute` left the mark centring the bare "L",
            pushing the visible "L." off-centre inside the square. */}
        <m.span
          className="leading-none text-background"
          style={{
            fontSize: iconFontSize,
            fontFamily: LOCKUP_FONT_STACK,
            fontWeight: 900,
          }}
        >
          L
          <m.span
            className="inline-block overflow-hidden"
            style={{ opacity: dotOpacity, width: dotWidth }}
          >
            .
          </m.span>
        </m.span>
      </m.div>

      {/* Hidden below sm. The restored lockup is ~225px of fixed-size type, and
          this nav also carries the DE/EN control that the pre-rebrand one did
          not, so together they overflowed a 320px viewport by 59px. That is
          what the responsive containment suites caught. The mark alone carries
          the brand at that width; the full lockup returns at sm. */}
      <m.span
        aria-hidden="true"
        className="hidden overflow-hidden whitespace-nowrap uppercase text-foreground sm:flex"
        style={{
          transformOrigin: "left center",
          fontSize: wordmarkSize,
          letterSpacing: wordmarkLetterSpacing,
          fontFamily: LOCKUP_FONT_STACK,
          fontWeight: 900,
        }}
      >
        <m.span
          className="inline-block overflow-hidden"
          style={{ width: lWidth, opacity: lOpacity }}
        >
          L
        </m.span>
        <span>
          OEHRNING
          <span style={{ marginLeft: "0.06em", letterSpacing: "0.05em" }}>
            .AI
          </span>
        </span>
      </m.span>
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
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const navHeight = useTransform(scrollY, [0, 160], [64, 52]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 80);
  });

  const hrefPathname = (href: string) => href.split(/[?#]/, 1)[0] || "/";
  const isActivePath = (href: string) => {
    const target = hrefPathname(href);
    return routePathname === target || routePathname.startsWith(target + "/");
  };
  const isLernenActive = lernenPaths.some(
    (p) => routePathname === p || routePathname.startsWith(p + "/"),
  );
  const isPraxisActive = praxisPaths.some(
    (p) => routePathname === p || routePathname.startsWith(p + "/"),
  );
  const isWissenActive = wissenPaths.some(
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
  const wissenTriggerRef = useRef<HTMLButtonElement>(null);
  const wissenMenuRef = useRef<HTMLDivElement>(null);
  const pendingMenuFocus = useRef<"first" | "last" | null>(null);

  function menuRefFor(id: Exclude<DropdownId, null>) {
    if (id === "praxis") return praxisMenuRef;
    if (id === "wissen") return wissenMenuRef;
    return lernenMenuRef;
  }

  function triggerRefFor(id: Exclude<DropdownId, null>) {
    if (id === "praxis") return praxisTriggerRef;
    if (id === "wissen") return wissenTriggerRef;
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
    items: readonly AkademieItem[],
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
            "inline-flex min-h-11 cursor-pointer items-center gap-1 px-1 text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
          <ChevronDown
            size={13}
            className={cn(
              "transition-transform duration-200",
              openDropdown === id && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {openDropdown === id && (
            <m.div
              ref={menuRef}
              id={menuId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-card-hover"
              aria-label={label}
              onKeyDown={handleMenuKeyDown(id)}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const itemLabel = copy[item.label];
                const targetPathname = hrefPathname(item.href);
                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      data-nav-menu-item
                      aria-disabled="true"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted cursor-default"
                    >
                      <Icon size={15} />
                      <span>{itemLabel}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-card-hover px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={localizeHref(item.href, locale)}
                    prefetch={false}
                    data-nav-menu-item
                    onClick={() => setOpenDropdown(null)}
                    aria-current={
                      routePathname === targetPathname ? "page" : undefined
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-card-hover focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                      routePathname === targetPathname ||
                        routePathname.startsWith(targetPathname + "/")
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon size={15} />
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
  function renderMobileGroup(label: string, items: readonly AkademieItem[]) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
          {items.map((item) => {
            const Icon = item.icon;
            const itemLabel = copy[item.label];
            const targetPathname = hrefPathname(item.href);
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="inline-flex items-center gap-2 text-sm text-muted"
                >
                  <Icon size={14} />
                  {itemLabel}
                  {item.badge && (
                    <span className="rounded-full bg-card-hover px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted">
                      {item.badge}
                    </span>
                  )}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                aria-current={isActivePath(item.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  (routePathname === targetPathname ||
                    routePathname.startsWith(targetPathname + "/")) &&
                    "text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Icon size={14} />
                {itemLabel}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <nav
      aria-label={copy.mainNavigation}
      className={cn(
        "no-js-primary-nav fixed top-0 z-50 w-full transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border bg-background/98 text-foreground backdrop-blur-sm"
          : "border-b border-transparent bg-background/80 text-foreground backdrop-blur-sm",
      )}
    >
      <m.div
        data-nav-header-row
        className="mx-auto flex max-w-6xl items-center justify-between px-6"
        style={{ height: navHeight }}
      >
        <LogoWordmark scrollY={scrollY} locale={locale} homeLabel={copy.home} />

        {/* Interactive desktop navigation. The no-script stylesheet hides
            these dropdown triggers and exposes the complete static link list
            below instead. */}
        <div className="js-desktop-nav hidden items-center gap-4 lg:flex xl:gap-6">
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
          {renderDropdown(
            "wissen",
            copy.knowledge,
            wissenNavItems,
            "wissen-nav-menu",
            isWissenActive,
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
                "inline-flex min-h-11 items-center px-1 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActivePath(link.href)
                  ? "text-foreground"
                  : "text-muted-foreground",
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-card-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Github size={17} aria-hidden="true" />
          </a>

          <AuthStatus />
        </div>

        {/* Keep the locale control visible in the top bar on small screens.
            It remains reachable without opening the navigation dialog. */}
        <div className="flex items-center gap-1 lg:hidden">
          <LanguageSwitch />
          <button
            type="button"
            ref={mobileToggleRef}
            onClick={openMobileMenu}
            tabIndex={mobileOpen ? -1 : undefined}
            aria-hidden={mobileOpen || undefined}
            className={cn(
              "js-mobile-nav-toggle inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              mobileOpen && "pointer-events-none invisible",
            )}
            aria-label={copy.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>
      </m.div>

      {/* Complete server-rendered navigation for browsers without scripting.
          It remains hidden during normal operation and replaces the
          interactive desktop/mobile controls through the layout's
          <noscript> stylesheet. */}
      <div className="no-js-mobile-nav hidden border-b border-border bg-background px-6 py-6 lg:hidden">
        <div className="grid gap-5 sm:grid-cols-2">
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
          <NoScriptMobileGroup
            label={copy.knowledge}
            items={wissenNavItems}
            locale={locale}
            copy={copy}
          />
        </div>
        <div className="mt-4 flex flex-col border-t border-border pt-3">
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="overscroll-contain border-b border-border bg-background lg:hidden"
          >
            <div className="flex max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-y-auto overscroll-contain px-6 py-6">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="ml-auto inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={copy.closeMenu}
              >
                <X size={19} aria-hidden="true" />
              </button>
              <LanguageSwitch className="self-start" />
              {renderMobileGroup(copy.learning, lernenNavItems)}
              {renderMobileGroup(copy.practice, praxisNavItems)}
              {renderMobileGroup(copy.knowledge, wissenNavItems)}

              <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={localizeHref(link.href, locale)}
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActivePath(link.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActivePath(link.href) && "text-foreground",
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
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
