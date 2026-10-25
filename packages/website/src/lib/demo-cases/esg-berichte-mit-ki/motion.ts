/**
 * Every moving frame of the demo as a pure function of one progress value t
 * in [0, 1]. Values outside are clamped, t = 1 is the frame a visitor with
 * reduced motion sees at once, and counters are whole numbers on every frame.
 */
import { BIO, SEPTEMBER_INVOICE, STICHTAG, STROM } from "./kit";
import { LEDGER, VSME } from "./ledger";
import { daysBetween, roundTo, sumDistinct } from "./rules";

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** The site's soft ease (out cubic). No overshoot: statuses never bounce. */
export const ease = (x: number) => 1 - (1 - clamp01(x)) ** 3;

/** Local progress of the window [a, b] inside t, eased. */
export function seg(t: number, a: number, b: number): number {
  return ease((clamp01(t) - a) / (b - a));
}

/** Days the certificate had expired on the reference date: 46. */
export const EXPIRED_DAYS = daysBetween(BIO.validUntil, STICHTAG);

export interface ProbeFrame {
  /** 0 to 1 each: the check is being shown; 1 = its mark is set. */
  readonly zitat: number;
  readonly zeitraum: number;
  readonly umfang: number;
  readonly stand: number;
  /** The validity ruler drawn, 0 to 1, then the overshoot past the end date. */
  readonly ruler: number;
  readonly overshoot: number;
  /** Whole days counted up to EXPIRED_DAYS. */
  readonly days: number;
  /** Hectare cells filled, 0 to 12 of 40. */
  readonly cells: number;
  readonly verdict: number;
}

/** Probe 1, the certificate against "Zertifizierte Bio-Weinberge" (3,6 s). */
export function probeAt(t: number): ProbeFrame {
  const zeitraum = seg(t, 0.12, 0.4);
  const overshoot = seg(t, 0.26, 0.4);
  const umfang = seg(t, 0.4, 0.66);
  return {
    zitat: seg(t, 0, 0.12),
    zeitraum,
    umfang,
    stand: seg(t, 0.66, 0.84),
    ruler: seg(t, 0.12, 0.26),
    overshoot,
    days: Math.round(EXPIRED_DAYS * overshoot),
    cells: Math.round(BIO.haCertified * umfang),
    verdict: seg(t, 0.84, 1),
  };
}

/** One of sentences 2 to 4, after the bet (1,6 s): checks one by one, then the verdict. */
export function verdictAt(t: number) {
  return {
    checks: [seg(t, 0, 0.25), seg(t, 0.2, 0.45), seg(t, 0.4, 0.65), seg(t, 0.6, 0.85)] as const,
    verdict: seg(t, 0.8, 1),
  };
}

/** The folder sweep (6 s): row i is set at i / 21 x 0.85, then the tally. */
export function sweepAt(t: number) {
  const x = clamp01(t);
  const set = Math.min(LEDGER.length, Math.floor((x / 0.85) * LEDGER.length + 1e-9));
  return { set, tally: seg(x, 0.85, 1) };
}

const BEFORE_KWH = sumDistinct(STROM);
const AFTER_KWH = BEFORE_KWH + SEPTEMBER_INVOICE.kwh;

/** The cascade after "Rechnung ablegen" (8 s). */
export function cascadeAt(t: number) {
  const x = clamp01(t);
  const insert = seg(x, 0.25, 0.4);
  /** Rows Q1, Q2, C5, F2, F3, F4 in ledger order, one each 0.08 from 0.40. */
  const rows = Math.min(6, Math.max(0, Math.floor((x - 0.4) / 0.08 + 1e-9) + (x >= 0.4 ? 1 : 0)));
  return {
    move: seg(x, 0, 0.12),
    meter: seg(x, 0.12, 0.25),
    insert,
    months: insert >= 1 ? 12 : 11,
    /** MWh with one decimal on every frame. */
    totalMwh: roundTo((BEFORE_KWH + (AFTER_KWH - BEFORE_KWH) * insert) / 1000, 1),
    rows,
    summary: seg(x, 0.88, 1),
  };
}

/** The VSME tile of electricity: 0 of 4 before, 1 of 4 after (B3). */
export const B3 = VSME.find((entry) => entry.id === "B3")!;
