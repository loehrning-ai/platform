import { GraduationCap, Home, UserRound, Wrench } from "lucide-react";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
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
 * The earlier signed-in shortcut pointed the Werkzeuge tab at
 * `/konto#werkzeuge`. Nothing on the account page carries that id, so it landed
 * at the top of `/konto` - the Konto tab's own destination - while this tab went
 * on claiming `/open-source` as the surface it marks active. The public tools
 * surface is the honest destination for both audiences, and the signed-in
 * workbench stays one tap away on the Konto tab.
 */
export function buildMobileTabs(locale: Locale): readonly MobileTab[] {
  // Every label, this landmark's accessible name included, comes from
  // GLOBAL_NAVIGATION_COPY. `start` / `courses` / `tools` are the short
  // tab-bar forms recorded there; `home` and `allCourses` are the long ones
  // the desktop menu uses and do not fit a quarter of a 320px viewport.
  const globalCopy = GLOBAL_NAVIGATION_COPY[locale];
  const iconClassName = "size-5 shrink-0";

  return [
    {
      id: "start",
      href: localizeHref("/", locale),
      matchPath: "/",
      label: globalCopy.start,
      icon: <Home aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "kurse",
      href: localizeHref("/kurse", locale),
      matchPath: "/kurse",
      label: globalCopy.courses,
      icon: <GraduationCap aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "werkzeuge",
      href: localizeHref("/open-source", locale),
      matchPath: "/open-source",
      label: globalCopy.tools,
      icon: <Wrench aria-hidden="true" className={iconClassName} />,
    },
    {
      id: "konto",
      href: localizeHref("/konto", locale),
      matchPath: "/konto",
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
 */
const TAB_BAR_CLASS_NAME = [
  "fixed inset-x-0 bottom-0 z-40",
  "border-t border-border bg-background",
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
