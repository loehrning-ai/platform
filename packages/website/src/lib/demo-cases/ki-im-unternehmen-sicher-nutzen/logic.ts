import { CARD_TEMPLATES, EMPTY_SLOT, type CardTemplates } from "./copy";
import * as core from "./core";
import { textFor } from "./pack";
import { ACCOUNTS, SCENES } from "./scenes";
import type {
  Account,
  AccountId,
  AccountKind,
  CardInput,
  DemoLocale,
  DialState,
  RouteKey,
  Scene,
  SceneResult,
} from "./types";

/*
 * The bilingual face of the logic, for server code and tests: the same
 * functions as core.ts, addressed by locale. The client island never imports
 * this file; it calls core.ts with the one-language text from pack.ts.
 */

export {
  ACCOUNT_KIND,
  BUCKET_SCENES,
  BUCKETS,
  FRIDAY_KEY,
  LIGHTS,
  RANK,
  ROUTE_KEYS,
  cleanInput,
  contentOption,
  fmt,
  fridayJudge,
  goalOf,
  goalReached,
  initialState,
  judge,
  lightFor,
  stateLight,
  type Cards,
  type EmptySlot,
  type FixParts,
  type Segment,
  type SegmentKind,
} from "./core";

export function accountKind(account: AccountId): AccountKind {
  return core.ACCOUNT_KIND[account];
}

export function routeFor(account: AccountId): Account {
  return ACCOUNTS[account];
}

export function routeDiff(
  from: AccountId,
  to: AccountId,
): { changed: RouteKey[]; same: RouteKey[] } | "unknown" {
  return core.routeDiff(ACCOUNTS, from, to);
}

export function routeSentence(from: AccountId, to: AccountId, locale: DemoLocale): string {
  return core.routeSentence(textFor(locale), from, to);
}

export function fixParts(scene: Scene, state: DialState, locale: DemoLocale): core.FixParts {
  return core.fixParts(textFor(locale), scene.id, state);
}

export function fixLine(scene: Scene, state: DialState, locale: DemoLocale): string {
  return core.fixLine(textFor(locale), scene.id, state);
}

export function ledgerSummary(results: readonly SceneResult[], locale: DemoLocale) {
  return core.ledgerSummary(textFor(locale), results);
}

export function templateSegments(
  template: string,
  input: CardInput,
  locale: DemoLocale,
): readonly core.Segment[] {
  return core.templateSegments(template, input, EMPTY_SLOT[locale]);
}

export function fillTemplate(template: string, input: CardInput, locale: DemoLocale): string {
  return core.fillTemplate(template, input, EMPTY_SLOT[locale]);
}

export function cardTemplates(locale: DemoLocale): CardTemplates {
  return CARD_TEMPLATES[locale];
}

export function cards(input: CardInput, locale: DemoLocale): core.Cards {
  return core.cards(textFor(locale), input);
}

export function ownerOrSlot(input: CardInput, locale: DemoLocale): string {
  return core.ownerOrSlot(textFor(locale), input);
}

export function ruleEvidence(results: readonly SceneResult[]) {
  return core.ruleEvidence(SCENES, results);
}

export function ruleEvidenceLine(results: readonly SceneResult[], locale: DemoLocale): string {
  return core.ruleEvidenceLine(textFor(locale), results);
}
