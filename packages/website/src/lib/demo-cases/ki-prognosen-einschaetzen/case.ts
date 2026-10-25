/*
 * The workshop's own launch case, copied from
 * public/workshops/ki-prognosen-einschaetzen/case-study/index.html
 * (`sdmForecastWeeks`, supply cap 1.050). "request" is the store request
 * (Anfrage), not demand. p10 / p90 are the 80 % band ("lower" / "upper"),
 * p50 is the AI median ("ai"). The case is the workshop's fictional launch,
 * not live data and not AI output.
 */
export interface CaseWeek {
  readonly id: string;
  readonly request: number;
  readonly p10: number;
  readonly p50: number;
  readonly p90: number;
}

export const CASE_WEEKS: readonly CaseWeek[] = [
  { id: "W-4", request: 760, p10: 620, p50: 700, p90: 810 },
  { id: "W-3", request: 880, p10: 710, p50: 810, p90: 930 },
  { id: "W-2", request: 1010, p10: 820, p50: 940, p90: 1080 },
  { id: "W-1", request: 1180, p10: 930, p50: 1090, p90: 1250 },
  { id: "Launch", request: 1370, p10: 980, p50: 1180, p90: 1320 },
  { id: "W+1", request: 1210, p10: 920, p50: 1110, p90: 1280 },
  { id: "W+2", request: 980, p10: 790, p50: 930, p90: 1080 },
];

/** Supply cap in every week of the case ("Lager heute"). */
export const CASE_SUPPLY = 1050;
export const LAUNCH_INDEX = 4;
/** The fixed axis of the workshop case, so scrubbing weeks never rescales. */
export const CASE_AXIS: readonly [number, number] = [500, 1500];
/** The Waage the demo starts with: a missed sale weighs 3 leftover units. */
export const DEFAULT_RATIO = 3;
