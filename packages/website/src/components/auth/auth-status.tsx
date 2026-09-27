"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { cx as cn } from "@/components/werk/cx";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { useLocale } from "@/components/i18n/locale-context";

export function AuthStatus({
  mobile = false,
  variant = "ticket",
  onNavigate,
}: {
  readonly mobile?: boolean;
  /**
   * `ticket` is the outlined desktop control. `quiet` is a plain text link
   * for the phone menu sheet, where the Konto tab already owns sign-in and
   * the navigation, not the account, should carry the weight.
   */
  readonly variant?: "ticket" | "quiet";
  readonly onNavigate?: () => void;
}) {
  const locale = useLocale();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Provider-free builds must not download and parse the Supabase SDK merely
    // to discover that no browser client can be created.
    if (!hasSupabasePublicConfig()) return;

    let active = true;
    let authStateEventSeen = false;
    let unsubscribe: (() => void) | null = null;

    // Dynamic import keeps the Supabase SDK out of the first-load bundle; the
    // module is only fetched when this effect actually runs in the browser.
    void import("@/lib/supabase/browser")
      .then(({ createBrowserSupabaseClient }) => {
        if (!active) return;
        const supabase = createBrowserSupabaseClient();
        if (!supabase) return;

        void supabase.auth
          .getUser()
          .then(({ data }) => {
            if (active && !authStateEventSeen) {
              setSignedIn(Boolean(data.user));
            }
          })
          .catch(() => {
            // The provider error may contain transport details and must not
            // reach console. Preserve any newer auth-state event rather than
            // overwriting it with this failed initial lookup.
          });
        const { data: subscription } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            authStateEventSeen = true;
            if (active) setSignedIn(Boolean(session?.user));
          },
        );
        unsubscribe = () => subscription.subscription.unsubscribe();
        if (!active) unsubscribe();
      })
      .catch(() => {
        // Chunk/client creation failure is non-fatal for public navigation.
        // Keep the current/default state and suppress the raw loader error.
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const copy = GLOBAL_NAVIGATION_COPY[locale];
  const href = localizeHref(signedIn ? "/konto" : "/login", locale);
  const label = signedIn ? copy.account : copy.login;
  const Icon = signedIn ? UserRound : LogIn;

  if (variant === "quiet") {
    // No border, no fill and no icon: one word in ink on a 44px target, so
    // the sheet header fits the wordmark, this link and the close button in
    // a 320px row. The ring is drawn inside the target, like the close
    // button's beside it.
    return (
      <Link
        href={href}
        prefetch={false}
        onClick={onNavigate}
        data-auth-status="quiet"
        className="inline-flex min-h-11 min-w-11 items-center justify-center px-0.5 text-label text-foreground underline decoration-transparent underline-offset-4 outline-none transition-colors duration-[120ms] hover:bg-card-hover hover:decoration-current focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange motion-reduce:transition-none"
      >
        {label}
      </Link>
    );
  }

  // min-w fits the widest label ("Anmelden") so the control keeps its width
  // when the session resolves to "Konto" and nothing beside it shifts. In the
  // desktop header, a desktop-nav container narrower than 44rem (only reached
  // when the page is zoomed while the lg layout still applies) keeps the
  // 44px square and the icon; the label stays in the accessible name.
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "inline-flex min-h-11 min-w-[7.25rem] items-center justify-center gap-2 border border-foreground bg-transparent px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors duration-[120ms] hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
        mobile
          ? "mt-3 w-full px-4"
          : "@max-[44rem]/desktop-nav:min-w-11 @max-[44rem]/desktop-nav:px-0",
      )}
    >
      <Icon size={14} aria-hidden="true" />
      <span
        className={cn(!mobile && "@max-[44rem]/desktop-nav:sr-only")}
      >
        {label}
      </span>
    </Link>
  );
}
