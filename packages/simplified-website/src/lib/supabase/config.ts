export function getSupabasePublicConfig(): {
  readonly url: string;
  readonly publishableKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) return null;

  // Startup sanity check: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL should point
  // to the same Supabase project. The CSP in next.config.ts uses
  // NEXT_PUBLIC_SUPABASE_URL to pin the exact origin; a mismatch means the server
  // client silently targets a different project than the browser client.
  // This is a non-fatal warning; some edge builds use only NEXT_PUBLIC_SUPABASE_URL.
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== process.env.SUPABASE_URL
  ) {
    console.warn(
      "[supabase/config] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL differ: " +
      "ensure both point to the same project for CSP correctness.",
    );
  }

  return { url, publishableKey };
}

export function hasSupabasePublicConfig(): boolean {
  return getSupabasePublicConfig() !== null;
}

