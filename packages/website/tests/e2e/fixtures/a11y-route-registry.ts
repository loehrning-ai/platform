import type { Locale } from "../../../src/lib/i18n/locale";

/**
 * Public routes added after the original accessibility sweep was established.
 * Both the axe and structural suites consume this registry so neither suite can
 * claim coverage that the other one does not actually execute.
 */
export const SUPPLEMENTAL_A11Y_ROUTE_GROUPS: Readonly<
  Record<string, readonly string[]>
> = {
  "Lern-Einstieg": [
    "/einstieg",
    "/en/einstieg",
    "/ki-check",
    "/en/ki-check",
  ],
  "Referenz & Wissen": [
    "/neuigkeiten",
    "/en/neuigkeiten",
  ],
  "Hilfe & Konto": ["/hilfe", "/en/hilfe", "/login", "/en/login"],
};

export const SUPPLEMENTAL_A11Y_ROUTE_CASES = Object.values(
  SUPPLEMENTAL_A11Y_ROUTE_GROUPS,
).flatMap((routes) =>
  routes.map((route) => ({
    route,
    locale: (route.startsWith("/en/") ? "en" : "de") as Locale,
  })),
);
