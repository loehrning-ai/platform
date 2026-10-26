/**
 * The texts the visitor takes home, rendered from the kit's own templates:
 * the project instructions with their audit values, a gap request per gap
 * (templates/gap-request.md, or its German twin), and the gap list as
 * Markdown. Pure.
 */

import { OWNERS, type AuditContext, type Item } from "./case";
import { formatLongDe, formatLongEn, formatShort } from "./dates";
import type { Evaluation, TestId } from "./evidence";
import { kitText } from "./kit";

export interface InstructionValues {
  readonly customerFull: string;
  readonly audit: string;
  readonly windowStart: string;
  readonly requestFile: string;
  /** True for the kit's own case: the line then says it is fictional training material. */
  readonly fictional: boolean;
}

export const VARDAR_VALUES: InstructionValues = {
  customerFull: "Tannwald Haustechnik GmbH",
  audit: "2026-12-10",
  windowStart: "2025-12-10",
  requestFile: "request_tannwald.md",
  fictional: true,
};

/**
 * The project instructions with the customer, the dates and the request file of this audit:
 * project-instructions.md in English, de/projektanweisungen.md in German.
 */
export function renderInstructions(values: InstructionValues, locale: "de" | "en" = "en"): string {
  if (locale === "de") {
    const note = values.fictional ? " Erfundenes Übungsmaterial." : "";
    return kitText("de/projektanweisungen.md")
      .replace(
        /^Audit: .*$/m,
        `Audit: ${values.customerFull}, Lieferantenaudit am ${formatLongDe(values.audit)}. Prüfzeitraum ab ${formatLongDe(values.windowStart)}.${note}`,
      )
      .replace("gegen den 10. Dezember 2026", `gegen den ${formatLongDe(values.audit)}`)
      .replace("nur aus request_tannwald.md", `nur aus ${values.requestFile}`);
  }
  const note = values.fictional ? " Fictional training material." : "";
  return kitText("project-instructions.md")
    .replace(
      /^Audit: .*$/m,
      `Audit: ${values.customerFull}, supplier audit on ${formatLongEn(values.audit)}. Evidence window from ${formatLongEn(values.windowStart)}.${note}`,
    )
    .replace("against 10 December 2026", `against ${formatLongEn(values.audit)}`)
    .replace("only from request_tannwald.md", `only from ${values.requestFile}`);
}

const TEST_WORD: Readonly<Record<"de" | "en", Readonly<Record<TestId, string>>>> = {
  de: { date: "ZEITRAUM", approval: "FREIGABE", scope: "UMFANG", quote: "ZITAT" },
  en: { date: "PERIOD", approval: "APPROVAL", scope: "SCOPE", quote: "QUOTE" },
};

/** The one sentence after "It fails ...:" for an evaluation, in the template's language. */
export function failSentence(result: Evaluation, locale: "de" | "en"): string {
  const { tests } = result;
  const first = result.failed[0];
  const de = locale === "de";
  if (first === "date" && tests.date.uncoveredDays > 0)
    return de ? `"${tests.quote.quote}", davor ${tests.date.uncoveredDays} Tage ohne Regel` : `"${tests.quote.quote}", so ${tests.date.uncoveredDays} days before it have no rule`;
  if (first === "date") return de ? `freigegeben am ${formatShort(tests.date.used?.iso ?? "", "de")}, nächste Prüfung war fällig` : `approved ${tests.date.used?.iso}, its next review was due before the window`;
  if (first === "approval") return de ? `im Kopf steht "Approved by: (open)"` : `its header says "Approved by: (open)"`;
  if (first === "scope")
    return de ? `"${tests.quote.quote}", die anderen ${tests.scope.missingSystems.length} Systeme fehlen` : `"${tests.quote.quote}", the other ${tests.scope.missingSystems.length} systems are missing`;
  if (tests.quote.kind === "part") return de ? `in der Zeile "${tests.quote.quote}" sind ${tests.quote.missingParts.join(" und ")} leer` : `in the row "${tests.quote.quote}" ${tests.quote.missingParts.join(" and ")} are empty`;
  if (tests.quote.figures.unique !== undefined)
    return de
      ? `"${tests.quote.quote}", geschult sind ${tests.quote.figures.unique}, nötig sind ${tests.quote.figures.needed}`
      : `"${tests.quote.quote}", ${tests.quote.figures.unique} are trained, ${tests.quote.figures.needed} are needed`;
  return de ? `der Nachweis sagt "${tests.quote.quote}" und keine andere Datei zeigt einen` : `the record says "${tests.quote.quote}" and no other file shows one`;
}

/** Short German or English names for what closes a gap, used in the subject line. */
const SUBJECT_DOC: Readonly<Record<string, { readonly de: string; readonly en: string }>> = {
  R2: { de: "Übermittlungsgrundlage im Register", en: "transfer basis in the register" },
  R3: { de: "Aufstellung der KI-Nutzung", en: "record of AI use" },
  R4: { de: "Prüfung der Admin-Konten", en: "admin account review" },
  R5: { de: "Schulungsnachweis", en: "training record" },
  R7: { de: "Protokoll eines Wiederherstellungstests", en: "restore test record" },
  R8: { de: "freigegebene Richtlinie", en: "approved policy" },
};

/** The gap request for one WEAK or GAP item, filled into the template (English kit template or its German twin). */
export function renderGapRequest(result: Evaluation, context: AuditContext, template: string, locale: "de" | "en"): string {
  const item: Item = result.item;
  const owner = OWNERS[item.owner];
  const de = locale === "de";
  const day = (iso: string) => (de ? formatShort(iso, "de") : formatLongEn(iso));
  const fileDate = result.tests.date.used?.iso ?? result.doc.date?.iso ?? "";
  const verb = item.closing.verb === "made" ? (de ? "erstellt" : "made") : de ? "freigegeben" : "approved";
  const role = de ? owner.de : `the ${owner.en}`;
  if (de) {
    const slots: Readonly<Record<string, string>> = {
      "[Kunde]": context.customer,
      "[Audit-Datum]": day(context.audit),
      "[Anforderung]": item.id,
      "[Nachweis kurz]": SUBJECT_DOC[item.id]?.de ?? "",
      "[Frist]": day(context.due),
      "[Vorname]": owner.first,
      "[Anforderungstext, wörtlich]": item.request,
      "[Datei]": result.doc.file,
      "[Datum der Datei]": day(fileDate),
      "[ZITAT / ZEITRAUM / UMFANG / FREIGABE]": TEST_WORD.de[result.failed[0] ?? "quote"],
      "[ein Satz mit dem Zitat oder dem leeren Feld]": failSentence(result, "de"),
      "[Nachweis]": item.closing.de,
      "[Beginn des Prüfzeitraums]": day(context.windowStart),
      "[freigegeben / erstellt]": verb,
      "[Rolle]": role,
      "[Systeme, Personen, Zeitraum]": item.closing.coveringDe,
    };
    return Object.entries(slots).reduce((text, [slot, value]) => text.replaceAll(slot, value), template);
  }
  return template
    .replace("[Customer]", context.customer)
    .replace("[customer]", context.customer)
    .replace("[customer]", context.customer)
    .replaceAll("[audit date]", day(context.audit))
    .replaceAll("[item]", item.id)
    .replace("[document]", SUBJECT_DOC[item.id]?.[locale] ?? "")
    .replace("[date]", day(context.due))
    .replace("[owner]", owner.first)
    .replace("[request text, word for word]", item.request)
    .replace("[file]", result.doc.file)
    .replace("[date]", day(fileDate))
    .replace("[QUOTE / PERIOD / SCOPE / APPROVAL]", TEST_WORD[locale][result.failed[0] ?? "quote"])
    .replace("[one sentence with the quote or the empty field]", failSentence(result, locale))
    .replace("[document]", de ? item.closing.de : item.closing.en)
    .replace("[window start]", day(context.windowStart))
    .replace("[approved / made]", verb)
    .replace("[role]", role)
    .replace("[systems, people, period]", de ? item.closing.coveringDe : item.closing.coveringEn)
    .replace("[date]", day(context.due));
}

/** lueckenliste.md: one row per gap and one request each. */
export function renderGapList(results: readonly Evaluation[], context: AuditContext, template: string, locale: "de" | "en"): string {
  const de = locale === "de";
  const gaps = results.filter((result) => result.status !== "covered");
  const head = de
    ? `# Lückenliste: ${context.customer}, Audit am ${formatShort(context.audit, "de")}\n\n| Anforderung | Status | Was fehlt | Was die Lücke schließt | Zuständig | Bis |\n|---|---|---|---|---|---|`
    : `# Gap list: ${context.customer}, audit on ${formatLongEn(context.audit)}\n\n| Item | Status | What is missing | Closing document | Owner | Needed by |\n|---|---|---|---|---|---|`;
  const status = (value: Evaluation["status"]) => (de ? { covered: "BELEGT", weak: "SCHWACH", gap: "LÜCKE" } : { covered: "COVERED", weak: "WEAK", gap: "GAP" })[value];
  const rows = gaps.map((result) => {
    const owner = OWNERS[result.item.owner];
    const missing = `${TEST_WORD[locale][result.failed[0] ?? "quote"]}: ${failSentence(result, locale).replace(/\|/g, "/")}`;
    return `| ${result.item.id} | ${status(result.status)} | ${missing} | ${de ? result.item.closing.de : result.item.closing.en} | ${de ? owner.de : owner.en} | ${de ? formatShort(context.due, "de") : formatLongEn(context.due)} |`;
  });
  const mails = gaps.map((result) => `## ${result.item.id}\n\n${renderGapRequest(result, context, template, locale).trimEnd()}`);
  return `${head}\n${rows.join("\n")}\n\n${mails.join("\n\n")}\n`;
}
