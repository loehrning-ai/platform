import { JUDGE_TEXT } from "./copy";
import { createLogic, type EsgLogic } from "./core";
import { FACTS, REASONS, STROM_MONDAY } from "./facts";

/*
 * The demo's logic bound to its full data, both locales: for server code
 * and tests. Client code uses core.ts with the locale pack instead (pack.ts),
 * so the page never ships the other locale.
 */
export * from "./core";

export const ESG_LOGIC: EsgLogic = createLogic({
  facts: FACTS,
  strom: STROM_MONDAY,
  reasons: REASONS,
  text: JUDGE_TEXT,
});

export const { factFor, detailOptions, keyLine, judge, keyStamps } = ESG_LOGIC;
