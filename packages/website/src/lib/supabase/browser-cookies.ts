import type { CookieMethodsBrowser, CookieOptions } from "@supabase/ssr";
import { boundAuthCookieOptions } from "./config";

/** RFC 6265 cookie-name token characters. */
const COOKIE_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

type BrowserCookie = { readonly name: string; readonly value: string };

function decodeCookieValue(raw: string): string {
  const unquoted =
    raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')
      ? raw.slice(1, -1)
      : raw;
  try {
    return decodeURIComponent(unquoted);
  } catch {
    return unquoted;
  }
}

/** Parses a `document.cookie` string; the first occurrence of a name wins. */
export function parseDocumentCookies(header: string): BrowserCookie[] {
  const seen = new Set<string>();
  return header.split(";").flatMap((pair) => {
    const separator = pair.indexOf("=");
    if (separator <= 0) return [];
    const name = pair.slice(0, separator).trim();
    if (!name || seen.has(name)) return [];
    seen.add(name);
    return [{ name, value: decodeCookieValue(pair.slice(separator + 1).trim()) }];
  });
}

/** A path must not end the attribute or carry a control character. */
function hasUnsafePathCharacter(path: string): boolean {
  return Array.from(path).some((character) => {
    const code = character.charCodeAt(0);
    return character === ";" || code < 0x20 || code === 0x7f;
  });
}

function sameSiteAttribute(sameSite: CookieOptions["sameSite"]): string | null {
  if (sameSite === true || sameSite === "strict") return "Strict";
  if (sameSite === "lax") return "Lax";
  if (sameSite === "none") return "None";
  return null;
}

/**
 * Serializes one cookie write for `document.cookie`. `httpOnly` is omitted
 * because a script cannot set it. Throws on a name or lifetime that would
 * produce a malformed or injected attribute list.
 */
export function serializeDocumentCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  if (!COOKIE_NAME_PATTERN.test(name)) {
    throw new Error("Refusing to write a cookie with an invalid name.");
  }
  const attributes = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) {
    if (!Number.isFinite(options.maxAge)) {
      throw new Error("Refusing to write a cookie with an unreadable lifetime.");
    }
    attributes.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }
  if (options.domain) {
    if (!COOKIE_NAME_PATTERN.test(options.domain)) {
      throw new Error("Refusing to write a cookie with an invalid domain.");
    }
    attributes.push(`Domain=${options.domain}`);
  }
  if (options.path) {
    if (hasUnsafePathCharacter(options.path)) {
      throw new Error("Refusing to write a cookie with an invalid path.");
    }
    attributes.push(`Path=${options.path}`);
  }
  if (options.expires) attributes.push(`Expires=${options.expires.toUTCString()}`);
  const sameSite = sameSiteAttribute(options.sameSite);
  if (sameSite) attributes.push(`SameSite=${sameSite}`);
  if (options.secure) attributes.push("Secure");
  if (options.partitioned) attributes.push("Partitioned");
  return attributes.join("; ");
}

/**
 * The `document.cookie` adapter for the browser auth client.
 *
 * Without an adapter @supabase/ssr writes `document.cookie` itself with its
 * 400-day lifetime, which the configured `cookieOptions.maxAge` cannot
 * shorten. Every write here passes through `boundAuthCookieOptions`, so the
 * browser client keeps the same 30-day bound as the server writers.
 */
export function createBrowserAuthCookieMethods(): CookieMethodsBrowser {
  return {
    getAll() {
      if (typeof document === "undefined") return [];
      return parseDocumentCookies(document.cookie);
    },
    setAll(cookiesToSet) {
      if (typeof document === "undefined") {
        throw new Error(
          "The browser auth client cannot write cookies outside a browser.",
        );
      }
      cookiesToSet.forEach(({ name, value, options }) => {
        document.cookie = serializeDocumentCookie(
          name,
          value,
          boundAuthCookieOptions(options),
        );
      });
    },
  };
}
