import type { Locale } from "@/lib/i18n/locale";

// ─── Canonical course URL ──────────────────────────────────────────────────

export const AI_NATIVE_URL = "/ai-native";

// ─── Trust Signals (landing boundary column) ───────────────────────────────

export const AI_NATIVE_TRUST_SIGNALS: readonly string[] = [
  "Von Tim Löhr kuratiert und öffentlich dokumentiert.",
  "Jede Lektion nennt ihre Quellen: Studien, OWASP und EU-Recht.",
  "Übungen mit erfundenen Daten, unabhängig von einem bestimmten Werkzeug.",
];

export const AI_NATIVE_TRUST_SIGNALS_EN: readonly string[] = [
  "Curated by Tim Löhr and documented on this public platform.",
  "Every lesson names its sources: studies, OWASP and EU law.",
  "Exercises use invented data and do not depend on a particular tool.",
];

export function getAiNativeTrustSignals(locale: Locale): readonly string[] {
  return locale === "en"
    ? AI_NATIVE_TRUST_SIGNALS_EN
    : AI_NATIVE_TRUST_SIGNALS;
}
