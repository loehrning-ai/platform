import { GraduationCap, Home, UserRound, Wrench } from "lucide-react";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  ACCOUNT_ROUTES,
  LEARNING_ROUTES,
  PRACTICE_ROUTES,
} from "@/lib/navigation/site-sections";
import {
  MobileTabBarLinks,
  type MobileTab,
} from "@/components/mobile-tab-bar-links";

/**
 * Bottom tab bar of the mobile companion shell (see docs/experience-system.md,
 * "Mobile Companion Shell").
 *
 * Below `lg` this is the persistent navigation: four destinations, fixed to the
 * bottom edge, `--tabbar-h` tall plus the device inset. At `lg` and above it is
 * `display: none` and the desktop header is unchanged. It renders on the server,
 * so it is present in the first response and nothing about it appears, moves or
 * changes at hydration.
 *
 * It is a second `<nav>` landmark and therefore carries its own accessible name,
 * distinct from the site navigation's "Hauptnavigation".
 */

/**
 * Every destination is a pure function of the locale, and the locale is a pure
 * function of the request path (middleware derives `x-loehrning-locale` from the
 * sanitized pathname and overwrites any inbound value). That is a cache
 * contract, not a simplification.
 *
 * This bar is mounted in the root layout, so it is part of every public
 * document, and `src/proxy.ts` gives public documents `cacheHeaderFor()` from
 * the crawl contract - `public, max-age=3600, s-maxage=3600` - with no
 * `Vary: Cookie`. `Vary: Cookie` is merged only for route-level auth and
 * protected paths. A destination that read the Supabase session cookie would
 * therefore let one shared-cache entry serve either audience the other's
 * variant, and adding `Vary: Cookie` to every public document to compensate
 * would give up the CDN cacheability the crawl surface is built around. Nothing
 * in this subtree may read `cookies()`.
 *
 * An earlier signed-in shortcut pointed a tab at `/konto#werkzeuge`, an id
 * nothing on the account page carries. Every tab now lands on a public page
 * for both audiences, and the signed-in workbench stays one tap away on the
 * Konto tab.
 *
 * The two middle tabs are the header's two task groups, Lernen and Praxis,
 * with the same labels and the same section table behind them, so the
 * header, the menu sheet, the footer and this bar group every page the same
 * way. Lernen lands on the course hub and Praxis on the workshops, the first
 * page of its group. No path belongs to two tabs.
 */
export function buildMobileTabs(locale: Locale): readonly MobileTab[] {
  // Every label, this landmark's accessible name included, comes from
  // GLOBAL_NAVIGATION_COPY. `start` is the short tab-bar form of `home`,
  // which does not fit a quarter of a 320px viewport; `learning` and
  // `practice` are the header's own group labels.
  const globalCopy = GLOBAL_NAVIGATION_COPY[locale];
  const iconClassName = "size-5 shrink-0";

  return [
    {
      id: "start",
      href: localizeHref("/", locale),
      matchPaths: ["/"],
      label: globalCopy.start,
      icon: <Home aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "lernen",
      href: localizeHref("/kurse", locale),
      matchPaths: LEARNING_ROUTES,
      label: globalCopy.learning,
      icon: <GraduationCap aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "praxis",
      href: localizeHref("/workshops", locale),
      matchPaths: PRACTICE_ROUTES,
      label: globalCopy.practice,
      icon: <Wrench aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "konto",
      href: localizeHref("/konto", locale),
      matchPaths: ACCOUNT_ROUTES,
      label: globalCopy.account,
      icon: <UserRound aria-hidden="true" className={iconClassName} />,
    },
  ];
}

/**
 * `lg:hidden` keeps the bar off the desktop layout. The two reader rules are the
 * documented pair of equivalent forms for focus mode: the attribute may sit on
 * the root element, or on the outermost wrapper a reader route owns inside
 * `<main>`. Both are server rendered by the route, so the bar is absent in the
 * first response and never appears and then vanishes.
 *
 * The top hairline is an inset shadow, drawn inside the band rather than on
 * top of it, so the bar is exactly `--tabbar-band-h` tall: the band the body
 * reserves, and not one pixel more over the end of the page.
 *
 * While the menu sheet is open the bar stays visible but inert behind the
 * scrim, and its tab row fades (see MobileTabBarLinks) so it does not look
 * available. The row fades, not the bar, so the bar's paper stays opaque and
 * the page never shows through it.
 */
const TAB_BAR_CLASS_NAME = [
  "fixed inset-x-0 bottom-0 z-40",
  "bg-background shadow-[inset_0_1px_0_var(--color-hairline)]",
  "px-safe pb-safe",
  "lg:hidden",
  "[:root[data-reader=focus]_&]:hidden",
  "[body:has([data-reader=focus])_&]:hidden",
].join(" ");

export async function MobileTabBar() {
  const locale = await getRequestLocale();
  const tabs = buildMobileTabs(locale);

  return (
    <nav
      aria-label={GLOBAL_NAVIGATION_COPY[locale].quickNavigation}
      data-mobile-tab-bar="true"
      className={TAB_BAR_CLASS_NAME}
    >
      <MobileTabBarLinks tabs={tabs} />
    </nav>
  );
}
