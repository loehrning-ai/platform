export interface ServiceAddress {
  readonly streetAndNumber: string;
  readonly postalCode: string;
  readonly city: string;
  readonly country: string;
}

export interface LegalIdentity {
  readonly providerName: string;
  readonly projectName: string;
  readonly email: string;
  readonly linkedInUrl: string;
  readonly serviceAddress: ServiceAddress | null;
}

/**
 * Single source for the responsible party shown on every legal page.
 * `serviceAddress` is null by explicit operator decision (2026-07-16,
 * re-confirmed 2026-07-20): the operator does not publish a private
 * residential address, and the platform launches with email-first contact
 * only. Never infer this value; if a postal address is published later
 * (e.g. a non-private ladungsfähige Anschrift such as a virtual office —
 * the recommended path for full § 5 DDG compliance), insert it here and
 * the legal pages render it automatically. Until then the launch-gate
 * legal-address e2e tier (RUN_LAUNCH_GATE=1) is expected to fail.
 */
export const LEGAL_IDENTITY: LegalIdentity = {
  providerName: "Tim Löhr",
  projectName: "loehrning.ai",
  email: "tim@loehrning.ai",
  linkedInUrl: "https://www.linkedin.com/in/tim-loehr-821ba8188/",
  serviceAddress: null,
};

export function formatServiceAddress(
  address: ServiceAddress | null = LEGAL_IDENTITY.serviceAddress,
): string | null {
  if (!address) return null;
  return `${address.streetAndNumber}, ${address.postalCode} ${address.city}, ${address.country}`;
}
