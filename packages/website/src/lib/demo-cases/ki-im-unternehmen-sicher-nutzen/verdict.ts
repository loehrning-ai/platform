import { isCustomerKind } from "./redact";
import type { AccountId, CiteId, Hit, TodoId, Verdict } from "./types";

/*
 * The traffic light. Sources only: workshop slide 7 (green public, amber
 * company tool with names out, red secrets anywhere or customer data on a
 * personal account), ANSWERS.md mission 3 and facts 4, 7, 10, 13. Amber is
 * the best a company account reaches; green only on the visitor's own
 * statement that the text is public; "open" is what the material does not say.
 */
export interface VerdictInput {
  /** Hits that would still go along: kept ones and those not yet blacked out. */
  readonly live: readonly Hit[];
  readonly account: AccountId;
  readonly publicText: boolean;
  /** The clean text, searched for company-form words the detector cannot clear. */
  readonly clean: string;
}

const COMPANY_FORM = /\b(?:GmbH|AG|DOOEL|Ltd|Inc)\b/;

export function verdict({ live, account, publicText, clean }: VerdictInput): Verdict {
  const liveSecret = live.filter((hit) => hit.kind === "secret").length;
  const liveCustomer = live.filter((hit) => isCustomerKind(hit.kind)).length;
  const enterprise = account === "enterprise";
  const make = (
    light: Verdict["light"],
    reason: Verdict["reason"],
    todo: readonly TodoId[],
    cites: readonly CiteId[],
  ): Verdict => ({ light, reason, todo, cites, enterpriseNote: enterprise && (light === "red" || light === "amber") });

  if (liveSecret > 0) return make("red", "secret", ["changeKey"], ["deck07", "answers3"]);
  if (account === "personal" && liveCustomer > 0) {
    return make("red", "customerOnPersonal", ["namesOut"], ["deck07", 10]);
  }
  if (publicText && liveCustomer === 0) return make("green", "publicText", [], ["deck07"]);
  if (account === "personal") return make("open", "personalClean", [], [10]);
  if (liveCustomer > 0) return make("amber", "companyRaw", ["namesOut", "personReads"], ["deck07", "answers3"]);
  const todo: TodoId[] = ["contract", "personReads"];
  if (COMPANY_FORM.test(clean)) todo.push("companyNames");
  return make("amber", "companyClean", todo, ["deck07", "answers3"]);
}

export interface CiteWords {
  readonly slide: string;
  readonly mission: string;
  readonly fact: string;
}

/** "Folie 7 · Mission 3 · Fakt 10" in a fixed order. */
export function citeLine(cites: readonly CiteId[], words: CiteWords): string {
  const parts: string[] = [];
  if (cites.includes("deck07")) parts.push(`${words.slide} 7`);
  if (cites.includes("answers3")) parts.push(`${words.mission} 3`);
  const facts = cites.filter((cite): cite is Exclude<CiteId, string> => typeof cite === "number");
  for (const fact of [...facts].sort((a, b) => a - b)) parts.push(`${words.fact} ${fact}`);
  return parts.join(" · ");
}
