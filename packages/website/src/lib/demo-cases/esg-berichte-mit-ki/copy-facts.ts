/**
 * The kit facts the copy pack names in its sentences, filled in on the server
 * when the pack is built. A sentence writes {=haTotal}, never "40": the value
 * comes from the kit rows (kit.ts, lockstep-tested against the zips), the
 * ledger or the demo's own limits, so a changed kit changes every sentence.
 * The {=name} slots never collide with the {name} slots fmt.t fills on the
 * client from a scene's live values.
 */
import type { Locale } from "@/lib/i18n/locale";
import { figures, formatNumber, longDate, shortDate } from "./figures";
import { ACCIDENTS, BIO, BOTTLE, CERT_LINE, CLAIM_SAVING, DECLARATION, DRAFT_LINE, FILE_IDS, HEADCOUNT, PROFILE_TANK_LINE, PV, SEPTEMBER_INVOICE, STROM, YEAR } from "./kit";
import { LEDGER } from "./ledger";
import { MAX_BYTES, MAX_ROWS as MAX_FILE_ROWS } from "./own-csv";
import { MAX_ROWS as MAX_ANSWERS, MAX_SENTENCE } from "./own";

/** The invoice the electricity file books twice (EL-25-10). */
function doubledInvoice(): string {
  const seen = new Set<string>();
  for (const row of STROM) {
    if (seen.has(row.invoice)) return row.invoice;
    seen.add(row.invoice);
  }
  return "";
}

export function copyFacts(locale: Locale): Readonly<Record<string, string>> {
  const f = (value: number, digits = 0) => formatNumber(value, locale, digits);
  const [invoiceYear, invoiceMonth] = SEPTEMBER_INVOICE.month.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(invoiceYear, invoiceMonth, 0)).getUTCDate();
  const group = (id: "fragebogen" | "werbung" | "bank") => String(LEDGER.filter((row) => row.group === id).length);
  const kit = figures(locale);
  return {
    year: String(YEAR),
    prevYear: String(YEAR - 1),
    firstFineYear: String(DECLARATION.firstYear),
    haCertified: String(BIO.haCertified),
    haTotal: String(BIO.haTotal),
    haRest: String(BIO.haTotal - BIO.haCertified),
    banDate: kit.banDate ?? "",
    renewal: kit.renewal ?? "",
    validUntilShort: shortDate(BIO.validUntil),
    stichtagShort: kit.stichtagShort ?? "",
    declared: longDate(DECLARATION.date, locale),
    lineBody: String(CERT_LINE.body),
    lineScope: String(CERT_LINE.scope),
    draftInventedLine: String(DRAFT_LINE.invented),
    draftStatusLine: String(DRAFT_LINE.status),
    draftFigureLine: String(DRAFT_LINE.figure),
    tankLine: String(PROFILE_TANK_LINE),
    invoiceId: SEPTEMBER_INVOICE.invoice,
    doubledInvoice: doubledInvoice(),
    meterOld: f(SEPTEMBER_INVOICE.meterOld),
    meterNew: f(SEPTEMBER_INVOICE.meterNew),
    kwhSeptember: f(SEPTEMBER_INVOICE.kwh),
    tariff: f(SEPTEMBER_INVOICE.tariff, 2),
    totalMkd: f(SEPTEMBER_INVOICE.totalMkd),
    totalMkdCents: f(SEPTEMBER_INVOICE.totalMkd, 2),
    periodFrom: shortDate({ year: invoiceYear, month: invoiceMonth, day: 1 }),
    periodTo: shortDate({ year: invoiceYear, month: invoiceMonth, day: lastDay }),
    fileCount: String(FILE_IDS.length),
    questions: group("fragebogen"),
    claims: group("werbung"),
    fields: group("bank"),
    answers: String(LEDGER.length),
    savingPercent: String(CLAIM_SAVING.percent),
    bottleGrams: String(BOTTLE.grams),
    recycledPercent: String(BOTTLE.recycledPercent),
    waterM3: kit.waterM3 ?? "",
    headcount: String(HEADCOUNT.total),
    accidents: String(ACCIDENTS.employees),
    pvYield: f(PV.yieldMwh),
    payback: f(PV.investmentMkd / (PV.yieldMwh * 1000 * PV.tariff), 1),
    monthsInYear: "12",
    monthsCovered: kit.months ?? "",
    mwh12: kit.mwh12 ?? "",
    maxMb: f(MAX_BYTES / 1_000_000),
    maxFileRows: f(MAX_FILE_ROWS),
    maxSentence: f(MAX_SENTENCE),
    maxAnswers: f(MAX_ANSWERS),
    monthFormats: `${YEAR}-01, 01.${YEAR} ${locale === "de" ? "oder" : "or"} Jan ${YEAR}`,
  };
}

/** Fills every {=name} slot; an unknown name is a bug in the pack and throws. */
export function fillFacts<T>(value: T, facts: Readonly<Record<string, string>>): T {
  if (typeof value === "string")
    return value.replace(/\{=(\w+)\}/g, (_whole, key: string) => {
      const fact = facts[key];
      if (fact === undefined) throw new Error(`copy: unknown kit fact {=${key}}`);
      return fact;
    }) as T;
  if (Array.isArray(value)) return value.map((item) => fillFacts(item, facts)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillFacts(item, facts)])) as T;
  return value;
}
