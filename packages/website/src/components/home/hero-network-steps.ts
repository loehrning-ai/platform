/**
 * Shared step/journey data for the homepage hero.
 *
 * Lives outside hero-network.tsx so the journey data remains independent of
 * the heavy projection math and COUNTRY_POLYLINES_3D dataset. HeroNetwork is
 * loaded only for desktop viewports; this module stays available to tests and
 * future non-visual consumers without pulling in that projection code.
 * hero-network.tsx re-exports STEPS for backward compatibility.
 */

// `rLat` / `rLon` are optional rotation overrides — when present, the globe
// rotates to those coords instead of the city's. Used for SF where we want
// the entire USA visible on the right side of the disc (i.e. away from the
// headline on the left), so we rotate to the Atlantic edge of the country.
export interface Step {
  readonly lat: number;
  readonly lon: number;
  readonly word: string;
  readonly city: string;
  readonly rLat?: number;
  readonly rLon?: number;
}

// 6 locations spread ~60° apart for dramatic cross-globe rotation. Each beat
// labels one phase of the public resource journey. The cities are visual
// variety; the WORDS carry the narrative.
export const STEPS: readonly Step[] = [
  { lat: 52.5,  lon: 13.4,                  word: "Kurse",             city: "BERLIN" },
  { lat: -23.5, lon: -46.6,                 word: "Bücher",            city: "SÃO PAULO" },
  { lat: 39.9,  lon: 116.4,                 word: "Open Source",       city: "PEKING" },
  { lat: 37.8,  lon: -122.4, rLon: -82,     word: "Demos",             city: "SAN FRANCISCO" },
  { lat: 19.1,  lon: 72.9,                  word: "EU AI Act",         city: "MUMBAI" },
  { lat: 35.7,  lon: 139.7,                 word: "Blog",              city: "TŌKYŌ" },
];

const ENGLISH_STEP_WORDS = [
  "Courses",
  "Books",
  "Open Source",
  "Demos",
  "EU AI Act",
  "Blog",
] as const;

const ENGLISH_STEP_CITIES = [
  "BERLIN",
  "SÃO PAULO",
  "BEIJING",
  "SAN FRANCISCO",
  "MUMBAI",
  "TŌKYŌ",
] as const;

export function heroNetworkSteps(locale: Locale): readonly Step[] {
  if (locale === "de") return STEPS;
  return STEPS.map((step, index) => ({
    ...step,
    word: ENGLISH_STEP_WORDS[index],
    city: ENGLISH_STEP_CITIES[index],
  }));
}
import type { Locale } from "@/lib/i18n/locale";
