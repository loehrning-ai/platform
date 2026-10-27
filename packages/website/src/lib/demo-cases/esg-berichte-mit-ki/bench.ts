/**
 * Scene 2, the workbench: the file cannot change, the claim can. The visitor
 * picks what the claim covers (all vineyards or 12 of 40 ha), where it
 * stands (shelf card or website) and the Stichtag; benchProbe runs the four
 * checks of nachweisprobe.md (lines 5 to 16, 20 to 27) on that claim. Pure,
 * table-tested in bench.test.ts.
 */
import { daysLeft, days } from "./figures";
import { BIO } from "./kit";
import { addDays, BAN_DATE, compareDates, daysBetween, weakest, type CalendarDate, type Status } from "./rules";

export type BenchScope = "alle" | "teil";
export type BenchPlace = "regalkarte" | "website";

export interface BenchInput {
  readonly scope: BenchScope;
  readonly place: BenchPlace;
  readonly stichtag: CalendarDate;
}

/** The four checks of the card, in its order. */
export const CHECKS = ["zitat", "zeitraum", "umfang", "freigabe"] as const;
export type CheckId = (typeof CHECKS)[number];

/** Which caption explains the state (copy pack keys). */
export type BenchCaption = "allBanned" | "allBeforeBan" | "partShelf" | "partWebExpired" | "partWebValid";

export interface BenchResult {
  readonly checks: Readonly<Record<CheckId, Status>>;
  /** The weakest check decides. */
  readonly status: Status;
  /** A claim on a consumer surface may only go out when it is covered (nachweisprobe.md line 27). */
  readonly mayGoOut: boolean;
  /** A claim about the whole that is true for a part, on or after the ban date (4b). */
  readonly banned: boolean;
  readonly caption: BenchCaption;
  /** The certificate has expired on the Stichtag. */
  readonly expired: boolean;
  /** Days expired (0 while valid). */
  readonly days: number;
  /** Days still valid (0 once expired). */
  readonly daysLeft: number;
  /** The Stichtag lies after the booked renewal inspection. */
  readonly pastRenewal: boolean;
  /** The claim speaks for the cellar too (a card next to every wine). */
  readonly cellarClaimed: boolean;
  /** Hectares the claim speaks for. */
  readonly claimedHa: number;
}

export function benchProbe({ scope, place, stichtag }: BenchInput): BenchResult {
  const expired = days(stichtag) > 0;
  const cellarClaimed = place === "regalkarte";
  const umfang: Status = scope === "alle" || cellarClaimed ? "luecke" : "belegt";
  const zeitraum: Status = expired ? "schwach" : "belegt";
  const checks = { zitat: "belegt", zeitraum, umfang, freigabe: "belegt" } as const satisfies Record<CheckId, Status>;
  const status = weakest(Object.values(checks));
  const banned = scope === "alle" && compareDates(stichtag, BAN_DATE) >= 0;
  const caption: BenchCaption =
    scope === "alle" ? (banned ? "allBanned" : "allBeforeBan") : cellarClaimed ? "partShelf" : expired ? "partWebExpired" : "partWebValid";
  return {
    checks,
    status,
    mayGoOut: status === "belegt" && !banned,
    banned,
    caption,
    expired,
    days: Math.max(0, days(stichtag)),
    daysLeft: Math.max(0, daysLeft(stichtag)),
    pastRenewal: compareDates(stichtag, BIO.renewalBooked) > 0,
    cellarClaimed,
    claimedHa: scope === "alle" ? BIO.haTotal : BIO.haCertified,
  };
}

/** The Stichtag slider runs in days from 01.09.2025 to 31.12.2026. */
export const SLIDER_START: CalendarDate = BIO.validFrom;
export const SLIDER_END: CalendarDate = { year: 2026, month: 12, day: 31 };
export const SLIDER_MAX = daysBetween(SLIDER_START, SLIDER_END);

export const dateAt = (offset: number): CalendarDate => addDays(SLIDER_START, offset);
export const offsetOf = (date: CalendarDate): number => daysBetween(SLIDER_START, date);

/** The ticks on the ruler: end of validity, ban list in force, the kit's Stichtag, renewal booked. */
export const TICKS = {
  validUntil: offsetOf(BIO.validUntil),
  banDate: offsetOf(BAN_DATE),
  renewal: offsetOf(BIO.renewalBooked),
} as const;
