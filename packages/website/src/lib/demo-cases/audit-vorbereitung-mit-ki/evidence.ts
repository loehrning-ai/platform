/**
 * The four tests and the status, in the order and with the words Workshop 04 uses (esg-nachweise):
 * quote, period, scope, approval, then covered, weak or gap. The words themselves come from the kit
 * (vocab.ts). A part that fails the quote or the scope, or a record that shows the rule broken, is a
 * gap; a failed period or approval on a paper that exists is weak; otherwise covered. The weakest part
 * counts. The test id "date" is the period test. Pure; evidence-lockstep.test.ts holds the order and
 * the words together with Workshop 04.
 */

import { boundOf } from "./bound";

export type TestId = "date" | "approval" | "scope" | "quote";
export const TEST_ORDER: readonly TestId[] = ["quote", "date", "scope", "approval"];
export type Status = "covered" | "weak" | "gap";
export const STATUS_ORDER: readonly Status[] = ["covered", "weak", "gap"];

/** True where the test holds. */
export type Tests = Readonly<Record<TestId, boolean>>;

/** The status rule: the same as the oracle's and the one the skill teaches. */
export function statusOf(tests: Tests, broken = false): Status {
  if (broken || !tests.quote || !tests.scope) return "gap";
  if (!tests.date || !tests.approval) return "weak";
  return "covered";
}

/** The oracle writes its status in capitals; the demo keys its words in lower case. */
export function statusKey(status: "COVERED" | "WEAK" | "GAP"): Status {
  return status === "COVERED" ? "covered" : status === "WEAK" ? "weak" : "gap";
}

/** The oracle's test names (period) to the demo's ids (date). */
export function testsOf(result: { readonly quote: boolean; readonly period: boolean; readonly scope: boolean; readonly approval: boolean }): Tests {
  return { quote: result.quote, date: result.period, scope: result.scope, approval: result.approval };
}

/**
 * What the visitor's own paper can reach, from the tests they say hold. Their word is no proof, so it
 * never reaches covered (bound.ts): "open" means still to be read by a person with the skill.
 */
export function ownStatus(ticked: ReadonlySet<TestId>): "gap" | "weak" | "open" {
  const bound = boundOf({ hasCandidate: true, date: ticked.has("date"), approval: ticked.has("approval"), notMet: !ticked.has("quote") || !ticked.has("scope") });
  return bound === "notMet" ? "gap" : bound === "weak" ? "weak" : "open";
}
