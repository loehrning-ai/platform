"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { canonicalLocalePathname } from "@/lib/i18n/locale";

/**
 * The link list of the mobile companion tab bar.
 *
 * This is the smallest possible client island, and it exists for one reason:
 * the App Router keeps the root layout mounted across client navigations, so a
 * server component there computes the active tab exactly once, on the first
 * document, and would then keep pointing at the entry route forever. The active
 * marker has to read the live pathname, and no server API exposes it.
 *
 * Everything else stays on the server. Labels, localized hrefs and the icon
 * elements arrive as props, already rendered, so this island adds nothing to the
 * client bundle beyond `next/link` and the pathname hook, and it ships no icon
 * library. `usePathname()` returns the same value during server rendering as it
 * does after hydration, so the markup is identical on both sides and nothing
 * flips at hydration time.
 */

export type MobileTabId = "start" | "kurse" | "werkzeuge" | "konto";

export interface MobileTab {
  readonly id: MobileTabId;
  /** Already localized by the server component through `localizeHref`. */
  readonly href: string;
  /**
   * The unprefixed content path that decides the active state. It is kept
   * separate from `href` because the two legitimately differ: `href` is already
   * locale-prefixed (`/en/kurse`), while the active state is decided on the
   * canonical content path shared by both locales (`/kurse`).
   */
  readonly matchPath: string;
  readonly label: string;
  /** Rendered on the server; decorative, and already `aria-hidden`. */
  readonly icon: ReactNode;
}

/**
 * A tab is active when the current content path is its own path or sits below
 * it. `/` is matched exactly, because every path starts with it. The locale
 * prefix is stripped first so `/en/kurse` and `/kurse` resolve to one tab.
 */
export function isActiveTab(
  matchPath: string,
  pathname: string | null | undefined,
): boolean {
  const canonical = canonicalLocalePathname(pathname);
  if (canonical === null) return false;
  if (matchPath === "/") return canonical === "/";
  return canonical === matchPath || canonical.startsWith(`${matchPath}/`);
}

export function MobileTabBarLinks({
  tabs,
}: {
  readonly tabs: readonly MobileTab[];
}) {
  const pathname = usePathname();

  return (
    <ul
      data-mobile-tab-row="true"
      className="flex h-[var(--tabbar-h)] list-none items-stretch"
    >
      {tabs.map((tab) => {
        const active = isActiveTab(tab.matchPath, pathname);
        return (
          <li key={tab.id} className="min-w-0 flex-1">
            {/* The active rule is a border that is always present and only
                changes colour, so marking a tab moves no layout. */}
            <Link
              href={tab.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              data-mobile-tab={tab.id}
              data-active={active ? "true" : "false"}
              className={`flex h-full min-h-11 w-full min-w-11 flex-col items-center justify-center gap-1 border-t-2 px-1 ${
                active
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {tab.icon}
              <span className="w-full truncate text-center text-xs leading-tight">
                {tab.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
