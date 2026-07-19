import type { SoftwareArtifactStatus } from "@/lib/open-source/artifacts";

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
