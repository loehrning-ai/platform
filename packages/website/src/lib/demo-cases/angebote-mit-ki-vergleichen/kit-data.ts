/**
 * The kit files the demo reads, as text, so the page needs no request: the cost lines of the case,
 * the second case and the comparison template. They live in kit-data.json because they are the
 * kit's own data, not copy of this page. kit-lockstep.test.ts asserts each string equals its entry
 * in angebote-vergleichen-kit.zip byte for byte (source: scripts/workshop06/kit).
 */
import DATA from "./kit-data.json";

/** angebote-vergleichen-kit/kostenzeilen.csv */
export const CASE_CSV: string = DATA.case;

/** angebote-vergleichen-kit/fall/zweiter-fall.csv */
export const SECOND_CASE_CSV: string = DATA.second;

/** angebote-vergleichen-kit/vorlagen/vergleichsbasis.md */
export const BASIS_TEMPLATE: string = DATA.template;

/** Paths of the three files inside the zip, for the test and the file chips. */
export const KIT_DATA_PATHS = {
  case: "angebote-vergleichen-kit/kostenzeilen.csv",
  second: "angebote-vergleichen-kit/fall/zweiter-fall.csv",
  template: "angebote-vergleichen-kit/vorlagen/vergleichsbasis.md",
} as const;
