import type { SoftwareArtifactStatus } from "@/lib/open-source/artifacts";
import type { Locale } from "@/lib/i18n/locale";
import { OPEN_SOURCE_SHARED_COPY } from "@/lib/open-source/display-copy";

/**
 * German labels for the software artifact publication statuses. Shared so the
 * detail guide, the hub card, and the social card all name a status the same
 * way. The duplicate in tests/e2e/route-open-source.spec.ts is intentional: a
 * browser test must hold an expectation independent of this source of truth.
 */
export const STATUS_LABELS = {
  experimental: "Experimentell",
  stable: "Stabil",
  maintenance: "Wartungsmodus",
  archived: "Archiviert",
} as const satisfies Record<SoftwareArtifactStatus, string>;

export function statusLabel(
  status: SoftwareArtifactStatus,
  locale: Locale,
): string {
  return OPEN_SOURCE_SHARED_COPY[locale].statuses[status];
}
