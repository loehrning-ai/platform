import { isProtectedRoute, isPublicRoute } from "@/lib/crawl/contract";

export function isPublicPlatformPath(pathname: string): boolean {
  return isPublicRoute(pathname);
}

export function isProtectedPlatformPath(pathname: string): boolean {
  return isProtectedRoute(pathname);
}

// The 4 native certified courses' lesson content requires login (see
// PROTECTED_PATHS in src/lib/crawl/contract.ts) — every other course stays
// optional-account per policy D1. Used by middleware to pick the login
// page's "kurs-login" messaging over the generic redirect reason.
const GATED_COURSE_PREFIXES = [
  "/ki-fuehrerschein/kurs",
  "/eu-ai-act-kurs/kurs",
  "/ai-native/kurs",
  "/ki-und-gesellschaft/kurs",
] as const;

export function isGatedCoursePath(pathname: string): boolean {
  return GATED_COURSE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function sanitizeNextPath(value: string | null): string {
  const fallback = "/konto";
  if (!value || !value.startsWith("/")) return fallback;

  // WHATWG URL parsing normalizes backslashes into slashes. Without rejecting
  // them first, a value such as `/\\evil.example` becomes a cross-origin URL.
  // Encoded slash/backslash and control characters are rejected as well so a
  // second decode cannot change the redirect's authority or path semantics.
  if (
    value.includes("\\") ||
    hasControlCharacter(value) ||
    /%(?:25)*(?:00|0a|0d|2f|5c)/i.test(value)
  ) {
    return fallback;
  }

  try {
    const internalOrigin = "https://redirect.invalid";
    const parsed = new URL(value, internalOrigin);
    if (parsed.origin !== internalOrigin) return fallback;
    if (parsed.pathname === "/login" || parsed.pathname.startsWith("/login/")) {
      return fallback;
    }
    if (parsed.pathname === "/auth" || parsed.pathname.startsWith("/auth/")) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
