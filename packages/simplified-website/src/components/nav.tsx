"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
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
  Github,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthStatus } from "@/components/auth/auth-status";
import { TIM_ENTITY } from "@/lib/seo/entity";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

interface AkademieItem extends NavItem {
  readonly badge?: string;
  readonly disabled?: boolean;
}

// Course-only dropdown: an entry aid (KI-Check), the hub, then the
// four certified courses in learning-path order. "Open Source" was removed from
// here — it is not a course and already has its own top-level link, so it no
// longer appears twice.
const akademieNavItems: readonly AkademieItem[] = [
  { href: "/ki-check", label: "KI-Check", icon: MapPin },
  { href: "/kurse", label: "Alle Kurse", icon: Sparkles },
  { href: "/ki-fuehrerschein", label: "KI-Führerschein", icon: GraduationCap },
  { href: "/ki-und-gesellschaft", label: "KI und Gesellschaft", icon: Users },
  { href: "/eu-ai-act-kurs", label: "EU AI Act Kurs", icon: ShieldCheck },
  { href: "/ai-native", label: "AI-Native Arbeitskurs", icon: Zap },
];

const akademiePaths = [
  "/kurse",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ai-native",
  "/ki-und-gesellschaft",
];

const primaryLinks = [
  { href: "/open-source", label: "Open Source" },
  { href: "/workshops", label: "Workshops" },
  { href: "/blog", label: "Blog" },
] as const;

type DropdownId = "akademie" | null;

/* ─── Scroll-driven logo with icon mark ──────────────────────────────────── */

import { EASE_OUT_EXPO as EASE } from "@/lib/animations";

function LogoWordmark({ scrollY }: { scrollY: MotionValue<number> }) {
  /* Icon: shrinks + rotates on scroll */
  const iconSize = useTransform(scrollY, [0, 160], [40, 26]);
  const iconGap = useTransform(scrollY, [0, 160], [16, 5]);
  const iconRotate = useTransform(scrollY, [0, 160], [0, -8]);
  const iconRadius = useTransform(scrollY, [0, 160], [12, 9]);
  const iconBorder = useTransform(
    scrollY,
    [0, 100, 160],
    [
      "1px solid rgba(11,9,8,0.12)",
      "1px solid rgba(11,9,8,0.12)",
      "1px solid rgba(196,67,26,0.35)",
    ],
  );
  const iconShadow = useTransform(
    scrollY,
    [0, 160],
    ["0 6px 16px rgba(11,9,8,0.20)", "0 3px 8px rgba(196,67,26,0.28)"],
  );
  const iconFontSize = useTransform(scrollY, [0, 160], [20, 13]);

  /* Wordmark: size + tracking tighten */
  const wordmarkSize = useTransform(scrollY, [0, 160], [24, 17]);
  const wordmarkTracking = useTransform(scrollY, [0, 160], [-0.05, -0.02]);

  /* The "L" in LOEHRNING collapses — icon takes over */
  const lOpacity = useTransform(scrollY, [40, 120], [1, 0]);
  const lWidth = useTransform(scrollY, [40, 120], [14, 0]);

  /* The "." in the icon fades out as it merges with the wordmark */
  const dotOpacity = useTransform(scrollY, [60, 130], [1, 0]);

  return (
    <Link
      href="/"
      className="flex items-center"
      aria-label="LOEHRNING.AI Startseite"
    >
      <m.div
        className="flex flex-shrink-0 items-center justify-center bg-brand-orange"
        aria-hidden="true"
        style={{
          width: iconSize,
          height: iconSize,
          marginRight: iconGap,
          rotate: iconRotate,
          borderRadius: iconRadius,
          border: iconBorder,
          boxShadow: iconShadow,
        }}
        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <m.span
          className="font-black leading-none text-background"
          style={{ fontSize: iconFontSize }}
        >
          L
          <m.span style={{ opacity: dotOpacity, position: "absolute" }}>
            .
          </m.span>
        </m.span>
      </m.div>

      <m.span
        className="flex uppercase text-foreground"
        style={{
          transformOrigin: "left center",
          fontSize: wordmarkSize,
          letterSpacing: useTransform(wordmarkTracking, (v) => `${v}em`),
          fontFamily: "Inter, var(--font-geist-sans), system-ui, sans-serif",
          fontWeight: 900,
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: EASE }}
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
    </Link>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────────────────── */

export function Nav() {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const navHeight = useTransform(scrollY, [0, 160], [64, 52]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 80);
  });

  const isActivePath = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const isKurseActive = akademiePaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
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

  // Keep the document behind the mobile dialog out of the accessibility tree.
  useEffect(() => {
    if (!mobileOpen) return;
    const toInert = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer"),
    );
    for (const el of toInert) {
      el.setAttribute("inert", "");
    }
    return () => {
      for (const el of toInert) {
        el.removeAttribute("inert");
      }
    };
  }, [mobileOpen]);

  // Mobile dialog focus management: move focus inside, trap Tab/Shift+Tab,
  // close on Escape, and restore focus to the hamburger toggle.
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const restoreMobileToggleAfterExit = useRef(false);
  const closeMobileMenu = useCallback(() => {
    restoreMobileToggleAfterExit.current = true;
    setMobileOpen(false);
  }, []);
  const mobileMenuRef = useFocusTrap<HTMLDivElement>(
    mobileOpen,
    closeMobileMenu,
  );

  // ── WAI-ARIA menu keyboard support (Kurse dropdown) ──
  // Trigger: ArrowDown/ArrowUp opens the menu and moves focus to the
  // first/last item. Inside the menu: ArrowDown/ArrowUp cycle, Home/End
  // jump, Escape closes and returns focus to the trigger, Tab closes.
  const akademieTriggerRef = useRef<HTMLButtonElement>(null);
  const akademieMenuRef = useRef<HTMLDivElement>(null);
  const pendingMenuFocus = useRef<"first" | "last" | null>(null);

  function menuRefFor(_id: Exclude<DropdownId, null>) {
    return akademieMenuRef;
  }

  function triggerRefFor(_id: Exclude<DropdownId, null>) {
    return akademieTriggerRef;
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

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "fixed top-0 z-50 w-full transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border bg-background/98 text-foreground backdrop-blur-sm"
          : "border-b border-transparent bg-background/80 text-foreground backdrop-blur-sm",
      )}
    >
      <m.div
        className="mx-auto flex max-w-6xl items-center justify-between px-6"
        style={{ height: navHeight }}
      >
        <LogoWordmark scrollY={scrollY} />

        {/* Desktop */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-7">
          {/* Kurse dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openMenu("akademie")}
            onMouseLeave={closeMenu}
          >
            <button
              ref={akademieTriggerRef}
              aria-controls="akademie-nav-menu"
              aria-expanded={openDropdown === "akademie"}
              onClick={() =>
                setOpenDropdown(openDropdown === "akademie" ? null : "akademie")
              }
              onKeyDown={handleTriggerKeyDown("akademie")}
              className={cn(
                "inline-flex items-center gap-1 text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isKurseActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Kurse
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200",
                  openDropdown === "akademie" && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {openDropdown === "akademie" && (
                <m.div
                  ref={akademieMenuRef}
                  id="akademie-nav-menu"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-card-hover"
                  aria-label="Kurse"
                  onKeyDown={handleMenuKeyDown("akademie")}
                >
                  {akademieNavItems.map((item) => {
                    const Icon = item.icon;
                    if (item.disabled) {
                      return (
                        <span
                          key={item.label}
                          data-nav-menu-item
                          aria-disabled="true"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted cursor-default"
                        >
                          <Icon size={15} />
                          <span>{item.label}</span>
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
                        href={item.href}
                        data-nav-menu-item
                        onClick={() => setOpenDropdown(null)}
                        aria-current={
                          isActivePath(item.href) ? "page" : undefined
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-card-hover focus-visible:bg-card-hover focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                          pathname === item.href ||
                            pathname.startsWith(item.href + "/")
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon size={15} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActivePath(link.href) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActivePath(link.href)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}

          <a
            href={TIM_ENTITY.personalGithubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Tim auf GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-card-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Github size={17} aria-hidden="true" />
          </a>

          <AuthStatus />
        </div>

        {/* Mobile toggle */}
        <button
          ref={mobileToggleRef}
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
          aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </m.div>

      {/* Mobile menu */}
      <AnimatePresence
        onExitComplete={() => {
          if (!restoreMobileToggleAfterExit.current) return;
          restoreMobileToggleAfterExit.current = false;
          mobileToggleRef.current?.focus();
        }}
      >
        {mobileOpen && (
          <m.div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Hauptnavigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden overscroll-contain border-b border-border bg-background lg:hidden"
          >
            <div className="flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto overscroll-contain px-6 py-6">
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Kurse
                </span>
                <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
                  {akademieNavItems.map((item) => {
                    const Icon = item.icon;
                    if (item.disabled) {
                      return (
                        <span
                          key={item.label}
                          className="inline-flex items-center gap-2 text-sm text-muted"
                        >
                          <Icon size={14} />
                          {item.label}
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
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={
                          isActivePath(item.href) ? "page" : undefined
                        }
                        className={cn(
                          "inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                          (pathname === item.href ||
                            pathname.startsWith(item.href + "/")) &&
                            "text-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        )}
                      >
                        <Icon size={14} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActivePath(link.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActivePath(link.href) && "text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href={TIM_ENTITY.personalGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Github size={16} aria-hidden="true" />
                  GitHub
                </a>
                <AuthStatus mobile />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
