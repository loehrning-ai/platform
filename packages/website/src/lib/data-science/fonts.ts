import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

// ─── Self-hosted fonts (plan 012 stage 2) ─────────────────────────────
//
// The source (`index.html`) loads all three families from
// fonts.googleapis.com in one request:
//   family=Inter:wght@400;500;600;700;800;900
//   &family=Instrument+Serif:ital@0;1
//   &family=JetBrains+Mono:wght@400;500;600;700
//
// Ported to next/font/google self-hosting with the identical weight/style
// matrix — zero runtime requests to fonts.googleapis.com/fonts.gstatic.com.
// Each font exposes its family via a CSS custom property (`variable`); the
// scoped stylesheet (`.ds-v8-scope`, stage 3) points its own
// `--font-sans`/`--font-serif`/`--font-mono` tokens at these variables, so
// no component needs to import these fonts directly.

export const dsInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--ds-font-inter",
});

// Instrument Serif on Google Fonts ships a single weight (400); the source
// requests both styles (ital@0;1 = normal + italic) of that one weight —
// the hero title's italic emphasis (`<em>`) depends on the italic style
// actually loading, not falling back silently to a synthetic-italic system
// serif (verified via live QA, not just a successful build).
export const dsInstrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--ds-font-instrument-serif",
});

export const dsJetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--ds-font-jetbrains-mono",
});

/**
 * Combined className applied to this course's route-tree root element, so
 * every one of the three CSS custom properties above is available to the
 * scoped stylesheet everywhere under it.
 */
export const DS_FONT_VARIABLES = [
  dsInter.variable,
  dsInstrumentSerif.variable,
  dsJetBrainsMono.variable,
].join(" ");
