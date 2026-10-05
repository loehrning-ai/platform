"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { URL_STATE_CHANGE_EVENT } from "@/lib/navigation/url-state";
import { useLocale } from "./locale-context";

interface LanguageSwitchProps {
  readonly className?: string;
}

interface SwitchLinksProps extends LanguageSwitchProps {
  readonly locale: ReturnType<typeof useLocale>;
  readonly pathname: string;
  readonly suffix: string;
}

/**
 * The DE/EN pill: a paper capsule with an acid chip behind the current
 * language and a cobalt underline under it, so the state never rests on
 * colour alone (aria-current carries it for assistive technology).
 *
 * Each link is a full 44px target. The chips are drawn 3px inside that target,
 * which keeps the capsule at 46px, inside the 48px header row, while the
 * visible chip keeps its breathing room from the capsule's border.
 */
function SwitchLinks({
  className,
  locale,
  pathname,
  suffix,
}: SwitchLinksProps) {
  const copy = GLOBAL_NAVIGATION_COPY[locale];

  return (
    <div
      role="group"
      aria-label={copy.language}
      data-language-switch
      className={cn(
        "relative isolate inline-flex min-h-11 shrink-0 items-center overflow-hidden rounded-xl border border-foreground/15 bg-paper",
        className,
      )}
    >
      {(["de", "en"] as const).map((targetLocale) => {
        const active = targetLocale === locale;
        const label = targetLocale === "de" ? copy.german : copy.english;
        const actionLabel =
          targetLocale === "de" ? copy.switchToGerman : copy.switchToEnglish;
        return (
          // Locale is resolved in the root Server Component. A full document
          // navigation guarantees that every locale-scoped server component
          // and provider is reconstructed from the destination URL.
          <a
            key={targetLocale}
            href={`${localizeHref(pathname, targetLocale)}${suffix}`}
            aria-current={active ? "page" : undefined}
            // The accessible name starts with the visible "DE"/"EN", so
            // speech input can target the link by what it shows.
            aria-label={
              active
                ? `${targetLocale.toUpperCase()}, ${label}, ${copy.language}`
                : actionLabel
            }
            hrefLang={targetLocale}
            className={cn(
              // inset-ring, never ring-inset: with the --color-inset theme
              // token, Tailwind v4 also reads `ring-inset` as a ring colour
              // and it wins over the intended one.
              "group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[0.6rem] px-2 font-ui-mono text-xs font-bold uppercase tracking-[0.08em] outline-none transition-colors duration-150 focus-visible:z-10 focus-visible:inset-ring-2 focus-visible:inset-ring-brand-cobalt motion-reduce:transition-none",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              data-language-chip={active ? "active" : undefined}
              className={cn(
                "absolute inset-[3px] -z-10 rounded-[0.5rem] transition-colors duration-150 motion-reduce:transition-none",
                active
                  ? "bg-brand-acid/85"
                  : "bg-transparent group-hover:bg-brand-pink/45",
              )}
            />
            {targetLocale.toUpperCase()}
            {active ? (
              <span
                aria-hidden="true"
                data-language-underline
                className="absolute bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-brand-cobalt"
              />
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const [suffix, setSuffix] = useState("");

  useEffect(() => {
    const updateSuffix = () => {
      setSuffix(`${window.location.search}${window.location.hash}`);
    };
    updateSuffix();
    window.addEventListener("hashchange", updateSuffix);
    window.addEventListener("popstate", updateSuffix);
    window.addEventListener(URL_STATE_CHANGE_EVENT, updateSuffix);
    return () => {
      window.removeEventListener("hashchange", updateSuffix);
      window.removeEventListener("popstate", updateSuffix);
      window.removeEventListener(URL_STATE_CHANGE_EVENT, updateSuffix);
    };
  }, [pathname]);

  // The server and first client render use the same two concrete anchors.
  // Query and fragment state only update their href attributes after hydration;
  // no Suspense fallback or template replacement can move the root cursor.
  return (
    <SwitchLinks
      className={className}
      locale={locale}
      pathname={pathname}
      suffix={suffix}
    />
  );
}
