"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { useLocale } from "@/components/i18n/locale-context";

export function AuthStatus({
  mobile = false,
  onNavigate,
}: {
  /** The full-width variant at the foot of the phone menu sheet. */
  readonly mobile?: boolean;
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

  // The cobalt pill of the studio header. It never turns black: hover lifts
  // the pill and deepens its shadow instead of swapping the fill for ink.
  // min-w fits the widest label ("ANMELDEN") so the control keeps its width
  // when the session resolves to "Konto" and nothing beside it shifts. In the
  // desktop header, a desktop-nav container narrower than 44rem (only reached
  // when the page is zoomed while the lg layout still applies) keeps the
  // 44px square and the icon; the label stays in the accessible name.
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      data-auth-status={mobile ? "mobile" : "desktop"}
      className={cn(
        "inline-flex min-h-11 min-w-[7.5rem] items-center justify-center gap-2 rounded-xl border border-brand-cobalt bg-brand-cobalt px-3 py-2 font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-white outline-none transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none",
        mobile
          ? "mt-3 w-full justify-between px-4"
          : "@max-[44rem]/desktop-nav:min-w-11 @max-[44rem]/desktop-nav:px-0",
      )}
    >
      <Icon size={14} aria-hidden="true" />
      <span className={cn(!mobile && "@max-[44rem]/desktop-nav:sr-only")}>
        {label}
      </span>
    </Link>
  );
}
