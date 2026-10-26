/**
 * "Unsere Prüfung": does a recorded answer contain the totals the engine computes? A plain string
 * search for the formatted number (German "24.910", English "24,910") with no digit or separator
 * around it, run on the server over each take with Brandtwerk's rates. Never an error mark: a total
 * that is not there is reported as not there.
 */
import { fmtEur, type Lang } from "./stack";

export interface CheckItem {
  readonly option: string;
  readonly cents: number;
  readonly found: boolean;
}

/** The grouped whole-euro number without the currency sign ("24.910" / "24,910"). */
export function bareAmount(cents: number, lang: Lang): string {
  return fmtEur(cents, lang).replace(/[€\s\u00a0]/g, "");
}

export function amountInText(text: string, cents: number, lang: Lang): boolean {
  const bare = bareAmount(cents, lang).replace(/[.,]/g, (separator) => `\\${separator}`);
  return new RegExp(`(?<![\\d.,])${bare}(?![\\d]|[.,]\\d)`).test(text);
}

export function checkAnswer(text: string, totals: readonly { readonly option: string; readonly cents: number }[], lang: Lang): readonly CheckItem[] {
  return totals.map((total) => ({ ...total, found: amountInText(text, total.cents, lang) }));
}
