"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_COOKIE_OPTIONS, getSupabasePublicConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const config = getSupabasePublicConfig();
  if (!config) return null;

  browserClient = createBrowserClient(config.url, config.publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
  });
  return browserClient;
}

