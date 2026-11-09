/**
 * The clock rule of the demo, one function shared with the deck (public/workshops/audit-vorbereitung-mit-ki/
 * lib/w05-clock.js, pinned by clock-rule.test.ts). The general rule asks for three working days between
 * the notice and the visit, counted strictly between the two dates. Whether the day of the notice itself
 * counts is open, so the case one day short of the rule is "unclear", not "short". Pure and free of the
 * kit, so the client demo may import it.
 */

/** Working days the general rule asks for between the notice and the inspection. */
export const NOTICE_WORKING_DAYS = 3;

export type ClockVerdict = "short" | "unclear" | "fits";

/** Short below need - 1, unclear at need - 1 (the notice day may count), fits from need. */
export function clockVerdict(workingBetween: number, need: number = NOTICE_WORKING_DAYS): ClockVerdict {
  if (workingBetween >= need) return "fits";
  return workingBetween === need - 1 ? "unclear" : "short";
}
