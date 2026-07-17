"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function AuthStatus({ mobile = false }: { readonly mobile?: boolean }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user));
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const href = signedIn ? "/konto" : "/login";
  const label = signedIn ? "Konto" : "Login";
  const Icon = signedIn ? UserRound : LogIn;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 border border-foreground px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        mobile && "min-h-[44px] border-border",
      )}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </Link>
  );
}

