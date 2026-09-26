"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { matchesSection } from "@/lib/navigation/site-sections";

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

export type MobileTabId = "start" | "lernen" | "praxis" | "konto";

export interface MobileTab {
  readonly id: MobileTabId;
  /** Already localized by the server component through `localizeHref`. */
  readonly href: string;
  /**
   * The unprefixed section prefixes that decide the active state, taken from
   * the site-section table. They are kept separate from `href` because the two
   * legitimately differ: `href` is one locale-prefixed destination
   * (`/en/kurse`), while a tab owns a whole section of canonical paths shared
   * by both locales (`/kurse`, `/ki-fuehrerschein`, `/buecher`, ...).
   */
  readonly matchPaths: readonly string[];
  readonly label: string;
  /** Rendered on the server; decorative, and already `aria-hidden`. */
  readonly icon: ReactNode;
}

/**
 * A tab is active when the current content path is one of its section paths
 * or sits below one. `/` is matched exactly, because every path starts with
 * it. The locale prefix is stripped first so `/en/kurse` and `/kurse` resolve
 * to one tab.
 */
export function isActiveTab(
  matchPaths: readonly string[],
  pathname: string | null | undefined,
): boolean {
  return matchesSection(matchPaths, pathname);
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
      className="flex h-[var(--tabbar-h)] list-none items-stretch transition-opacity duration-[160ms] motion-reduce:transition-none [body:has(#mobile-menu)_&]:opacity-50"
    >
      {tabs.map((tab) => {
        const active = isActiveTab(tab.matchPaths, pathname);
        return (
          <li key={tab.id} className="min-w-0 flex-1">
            {/* The active rule is a 2px ink border that is always present and
                only changes colour, so marking a tab moves no layout. Weight
                (label and icon stroke) and aria-current carry the same state
                without colour, so the current tab reads at a glance. */}
            <Link
              href={tab.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              data-mobile-tab={tab.id}
              data-active={active ? "true" : "false"}
              className={`flex h-full min-h-11 w-full min-w-11 flex-col items-center justify-center gap-1 border-t-2 px-1 transition-colors duration-[120ms] motion-reduce:transition-none ${
                active
                  ? "border-foreground font-semibold text-foreground [&_svg]:stroke-[2.5]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
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
