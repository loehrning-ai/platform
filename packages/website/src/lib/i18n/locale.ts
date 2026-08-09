export const SUPPORTED_LOCALES = ["de", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";
export const LOCALE_REQUEST_HEADER = "x-loehrning-locale";

const INTERNAL_ORIGIN = "https://locale.invalid";
const INVALID_INTERNAL_PATH = "/__invalid-locale-path__";
const UNPREFIXED_MACHINE_PATHS = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/site.webmanifest",
]);

export interface ParsedLocalePathname {
  readonly locale: Locale;
  readonly pathname: string;
  readonly explicitLocale: Locale | null;
  readonly valid: boolean;
}

export interface LocaleAlternates {
  readonly canonical: string;
  readonly languages?: Readonly<Record<string, string>>;
}

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}

function containsUnsafePathSyntax(value: string): boolean {
  return (
    value.includes("\\") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    }) ||
    /%(?:25)*(?:00|0a|0d|2f|5c)/i.test(value)
  );
}

/**
 * Parses a request pathname without ever collapsing malformed input onto a
 * public route. Middleware treats `valid: false` as a terminal bad request.
 */
export function parseLocalePathname(pathname: string): ParsedLocalePathname {
  if (
    pathname.length === 0 ||
    pathname.length > 2_048 ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    containsUnsafePathSyntax(pathname)
  ) {
    return {
      locale: DEFAULT_LOCALE,
      pathname: INVALID_INTERNAL_PATH,
      explicitLocale: null,
      valid: false,
    };
  }

  for (const locale of SUPPORTED_LOCALES) {
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const stripped = pathname.slice(prefix.length) || "/";
      return {
        locale,
        pathname: stripped,
        explicitLocale: locale,
        valid: true,
      };
    }
  }

  return {
    locale: DEFAULT_LOCALE,
    pathname,
    explicitLocale: null,
    valid: true,
  };
}

/**
 * Returns the content pathname shared by the default and prefixed locale URLs.
 * Client components use it before comparisons so `/en/kurse` and `/kurse`
 * address the same localized content route.
 */
export function canonicalLocalePathname(
  pathname: string | null | undefined,
): string | null {
  if (typeof pathname !== "string") return null;
  const parsed = parseLocalePathname(pathname);
  return parsed.valid ? parsed.pathname : null;
}

function parseSafeInternalHref(href: string): URL | null {
  if (
    href.length === 0 ||
    href.length > 2_048 ||
    !href.startsWith("/") ||
    href.startsWith("//") ||
    containsUnsafePathSyntax(href)
  ) {
    return null;
  }

  try {
    const parsed = new URL(href, INTERNAL_ORIGIN);
    if (
      parsed.origin !== INTERNAL_ORIGIN ||
      !parsed.pathname.startsWith("/") ||
      parsed.pathname.startsWith("//")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Builds a locale-preserving internal href. The default German locale stays
 * unprefixed; English uses `/en`. Arbitrary origins and ambiguous path syntax
 * fall back to the locale root rather than becoming navigation targets.
 */
export function localizeHref(href: string, locale: Locale): string {
  const parsed = parseSafeInternalHref(href);
  const fallback = locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  if (!parsed) return fallback;

  const localePath = parseLocalePathname(parsed.pathname);
  if (!localePath.valid) return fallback;

  const pathname =
    locale === DEFAULT_LOCALE
      ? localePath.pathname
      : localePath.pathname === "/"
        ? `/${locale}`
        : `/${locale}${localePath.pathname}`;
  return `${pathname}${parsed.search}${parsed.hash}`;
}

/** Routes that remain single, unprefixed infrastructure endpoints. */
export function isUnprefixedLocalePath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/_next" ||
    pathname.startsWith("/_next/") ||
    pathname === "/schema" ||
    pathname.startsWith("/schema/") ||
    UNPREFIXED_MACHINE_PATHS.has(pathname)
  );
}

/**
 * Infrastructure for page metadata. Callers must pass only locales whose page
 * content has reviewed parity. A German-only page never emits an English
 * hreflang claim.
 */
export function buildLocaleAlternates(
  pathname: string,
  availableLocales: readonly Locale[],
): LocaleAlternates {
  const parsed = parseSafeInternalHref(pathname);
  if (!parsed) return { canonical: "/" };

  const canonicalPath = localizeHref(
    `${parsed.pathname}${parsed.search}${parsed.hash}`,
    DEFAULT_LOCALE,
  );
  const uniqueLocales = SUPPORTED_LOCALES.filter((locale) =>
    availableLocales.includes(locale),
  );

  if (!uniqueLocales.includes("de") || uniqueLocales.length < 2) {
    return { canonical: canonicalPath };
  }

  return {
    canonical: canonicalPath,
    languages: {
      de: canonicalPath,
      en: localizeHref(canonicalPath, "en"),
      "x-default": canonicalPath,
    },
  };
}
