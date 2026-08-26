"use client";

/**
 * LegalClaimBadge
 *
 * A small inline badge that appears beneath any lesson section containing
 * a legal claim sourced from the legal registry.
 *
 * Props:
 *   claimId   — must exist in src/lib/legal-registry.ts
 *   shortSource — optional override for the displayed source name
 *
 * Data source: getLegalClaim() from legal-registry.ts (pure synchronous function,
 * works in client components).
 *
 * IMPORTANT: This is a "use client" component because it is imported by
 * section-reader.tsx which is also "use client". Server Components cannot
 * import Client Components directly without passing them as children from a
 * parent RSC.
 *
 * Naming: <LegalClaimBadge> (NOT <StandBadge> — content-freshness governance owns <FreshnessBadge>).
 *
 * Ownership: legal-source governance.
 */

import { Calendar } from "lucide-react";
import { getLegalClaim } from "@/lib/legal-registry";
import type { Locale } from "@/lib/i18n/locale";

const SOURCE_KIND_LABELS: Record<Locale, Record<string, string>> = {
  de: {
    primary: "EUR-Lex (Primärrecht)",
    "official-guidance": "Europäische Kommission",
    secondary: "Sekundärquelle",
  },
  en: {
    primary: "EUR-Lex (primary law)",
    "official-guidance": "European Commission",
    secondary: "Secondary source",
  },
};

interface LegalClaimBadgeProps {
  readonly claimId: string;
  readonly shortSource?: string;
  readonly locale?: Locale;
}

export function LegalClaimBadge({
  claimId,
  shortSource,
  locale = "de",
}: LegalClaimBadgeProps) {
  const claim = getLegalClaim(claimId);

  if (!claim) {
    // Unknown claimId — silently omit in production; log in development
    if (process.env.NODE_ENV === "development") {
      console.warn(`[LegalClaimBadge] Unknown claimId: "${claimId}"`);
    }
    return null;
  }

  // Format "Stand: Monat Jahr" from lastVerified (ISO date string)
  const standDate = (() => {
    try {
      const d = new Date(claim.lastVerified + "T00:00:00Z");
      return d.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return claim.lastVerified;
    }
  })();

  const sourceLabel =
    shortSource ??
    SOURCE_KIND_LABELS[locale][claim.sourceKind] ??
    claim.sourceKind;

  return (
    <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
      <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold">
          {locale === "en" ? "Reviewed:" : "Stand:"}
        </span>{" "}
        {standDate}
        {" · "}
        <span className="font-semibold">
          {locale === "en" ? "Source:" : "Quelle:"}
        </span>{" "}
        {sourceLabel}
      </span>
    </div>
  );
}
