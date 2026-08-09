"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { useLocale } from "./locale-context";

interface LanguageSwitchProps {
  readonly className?: string;
}

interface SwitchLinksProps extends LanguageSwitchProps {
  readonly locale: ReturnType<typeof useLocale>;
  readonly pathname: string;
  readonly suffix: string;
}

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
        "inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-background p-1",
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
            aria-current={active ? "true" : undefined}
            aria-label={active ? `${label}, ${copy.language}` : actionLabel}
            className={cn(
              "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-card-hover hover:text-foreground",
            )}
          >
            {targetLocale.toUpperCase()}
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
    return () => {
      window.removeEventListener("hashchange", updateSuffix);
      window.removeEventListener("popstate", updateSuffix);
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
