/**
 * The kit's figures as data (crvena-zemja-nachweisprobe.zip, German edition,
 * and crvena-zemja-esg-kit.zip, English edition: the same lines in both).
 * Plain data, both languages, no server-only import, so the client demo and
 * the tests read the same rows. kit.test.ts reads both zips and fails when a
 * row here drifts from the file it quotes.
 */
import type { BillRow, CalendarDate } from "./rules";

/** The reference date of the exercise (projektanweisungen.md). */
export const STICHTAG: CalendarDate = { year: 2026, month: 10, day: 16 };
/** The reporting year of all three requests. */
export const YEAR = 2025;

/** The 13 files in ordner/ (files/), in the kit's order of the folder rail. */
export const FILE_IDS = [
  "strom",
  "entwurf",
  "bio",
  "kompensation",
  "wasser",
  "firmenprofil",
  "flaschen",
  "personal",
  "arbeitsschutz",
  "richtlinien",
  "pv",
  "regeln",
  "vsme",
] as const;
export type FileId = (typeof FILE_IDS)[number];

/** Kit file names per edition: ordner/<de> and files/<en>. */
export const FILE_NAMES: Readonly<Record<FileId, { readonly de: string; readonly en: string }>> = {
  strom: { de: "strom_2025.csv", en: "electricity_2025.csv" },
  entwurf: { de: "strom_zusammenfassung_entwurf.txt", en: "electricity_summary_draft.txt" },
  bio: { de: "bio_zertifikat_weinberg.txt", en: "organic_certificate_vineyard.txt" },
  kompensation: { de: "kompensation_2025.txt", en: "carbon_offsets_2025.txt" },
  wasser: { de: "wasser_2025.csv", en: "water_2025.csv" },
  firmenprofil: { de: "firmenprofil.md", en: "company_profile.md" },
  flaschen: { de: "flaschen.csv", en: "bottles.csv" },
  personal: { de: "personal_2025.csv", en: "headcount_2025.csv" },
  arbeitsschutz: { de: "arbeitsschutz_2025.txt", en: "health_safety_2025.txt" },
  richtlinien: { de: "richtlinien_und_compliance.txt", en: "policies_and_compliance.txt" },
  pv: { de: "pv_angebot_2026.txt", en: "solar_offer_2026.txt" },
  regeln: { de: "regeln_werbeaussagen.md", en: "green_claims_rules.md" },
  vsme: { de: "vsme_basismodul.md", en: "vsme_basic_module.md" },
};

/** The kit folder of each edition inside its zip. */
export const KIT_ROOT = {
  de: "crvena-zemja-nachweisprobe/ordner/",
  en: "crvena-zemja-esg-kit/files/",
} as const;

const bill = (month: string, invoice: string, amount: number, line: number): BillRow => ({ month, invoice, amount, line });

/** strom_2025.csv lines 3 to 14, kWh. September is missing, EL-25-10 is booked twice (e-invoice and scan). */
export const STROM: readonly BillRow[] = [
  bill("2025-01", "EL-25-01", 21400, 3),
  bill("2025-02", "EL-25-02", 19800, 4),
  bill("2025-03", "EL-25-03", 20600, 5),
  bill("2025-04", "EL-25-04", 19200, 6),
  bill("2025-05", "EL-25-05", 22500, 7),
  bill("2025-06", "EL-25-06", 26800, 8),
  bill("2025-07", "EL-25-07", 30400, 9),
  bill("2025-08", "EL-25-08", 32100, 10),
  bill("2025-10", "EL-25-10", 38700, 11),
  bill("2025-10", "EL-25-10", 38700, 12),
  bill("2025-11", "EL-25-11", 25300, 13),
  bill("2025-12", "EL-25-12", 22900, 14),
];

/** nachreichung/rechnung-EL-25-09.png, the late invoice, as the demo draws it. */
export const SEPTEMBER_INVOICE = {
  month: "2025-09",
  invoice: "EL-25-09",
  kwh: 41200,
  meterOld: 1284350,
  meterNew: 1325550,
  tariff: 9.5,
  totalMkd: 391400,
  /** The line it takes in strom_2025.csv once filed: between August (10) and October (11). */
  line: 11,
} as const;

/** wasser_2025.csv lines 3 to 14, m³: twelve bills, the clean file. */
export const WASSER: readonly BillRow[] = [
  bill("2025-01", "W-25-01", 210, 3),
  bill("2025-02", "W-25-02", 190, 4),
  bill("2025-03", "W-25-03", 230, 5),
  bill("2025-04", "W-25-04", 260, 6),
  bill("2025-05", "W-25-05", 280, 7),
  bill("2025-06", "W-25-06", 300, 8),
  bill("2025-07", "W-25-07", 320, 9),
  bill("2025-08", "W-25-08", 410, 10),
  bill("2025-09", "W-25-09", 980, 11),
  bill("2025-10", "W-25-10", 870, 12),
  bill("2025-11", "W-25-11", 340, 13),
  bill("2025-12", "W-25-12", 240, 14),
];

/** bio_zertifikat_weinberg.txt (organic_certificate_vineyard.txt) lines 4 and 6 to 9. */
export const BIO = {
  /** Line 4: the inspection body's code. */
  controlBody: "XX-BIO-000",
  validFrom: { year: 2025, month: 9, day: 1 },
  validUntil: { year: 2026, month: 8, day: 31 },
  /** Line 9: the renewal inspection is booked, not done. */
  renewalBooked: { year: 2026, month: 10, day: 22 },
  haCertified: 12,
  haTotal: 40,
} as const;

/** The line numbers of the certificate the demo connects to (the same in both editions). */
export const CERT_LINE = { title: 3, body: 4, operator: 5, scope: 6, from: 7, until: 8, renewal: 9, rest: 10, cellar: 11 } as const;
/** Line 1 of every kit file: "Erfundene Übungsdaten..." (the certificate's line 2 is empty). */
export const CERT_LINES = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** strom_zusammenfassung_entwurf.txt: line 3 says it is an unchecked draft, line 5 holds the figure. */
export const DRAFT_LINE = { status: 3, figure: 5 } as const;
/** firmenprofil.md line 16: tank cooling peaks in September and October. */
export const PROFILE_TANK_LINE = 16;
/** anfragen/2-werbeaussagen.md line 10: claim 3, "Regalkarte, alle Weine". */
export const CLAIM_LINE = 10;

/** pv_angebot_2026.txt lines 8 and 9; the tariff from strom_2025.csv. */
export const PV = { yieldMwh: 180, investmentMkd: 8_550_000, tariff: 9.5 } as const;

/** questionnaire line 12: energy data must cover 95 % of the year. */
export const COVERAGE_RULE = 0.95;
