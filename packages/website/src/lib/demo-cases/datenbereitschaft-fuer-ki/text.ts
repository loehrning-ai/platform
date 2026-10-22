/** Receipt sentences of demo 03: rule texts filled with their params, per locale. */
import { fill, joinList, type DemoText } from "./copy-shared";
import { formatValue, formatValueLong, rateParts } from "./format";
import type {
  Blank,
  DefinitionRequest,
  Lock,
  Receipt,
  Row,
  TriageCard,
  TriageReceipt,
} from "./model";

/** The visible label of one option of one blank in one request. */
export function optionLabel(request: DefinitionRequest, blank: Blank, value: string, text: DemoText): string {
  switch (blank) {
    case "kind":
      return (request.id === "05" ? text.kind05 : text.kind)[value as keyof DemoText["kind"]].label;
    case "grain":
      return text.grain[value as keyof DemoText["grain"]];
    case "period":
      return text.period[value as keyof DemoText["period"]];
    case "base":
      return request.id === "05"
        ? text.base05[value as keyof DemoText["base05"]]
        : text.base03[value as keyof DemoText["base03"]];
    case "combine":
      return text.combine[value as keyof DemoText["combine"]];
    case "table":
      return value;
  }
}

export function rowLabel(row: Row, text: DemoText): string {
  return text.rowLabels[row.label];
}

/** "Apr 334.675 €" or "Enterprise 4 von 40 = 10,0 %". */
export function rowText(row: Row, text: DemoText): string {
  return `${rowLabel(row, text)} ${formatValueLong(row.value, text.locale)}`;
}

export function rowsText(rows: readonly Row[], text: DemoText): string {
  return rows.length === 0 ? text.noRows : rows.map((row) => rowText(row, text)).join(" · ");
}

/** The why sentence of a definition receipt. */
export function ruleText(receipt: Receipt, request: DefinitionRequest, text: DemoText): string {
  const template = text.rules[receipt.rule];
  const params = receipt.params;
  switch (receipt.rule) {
    case "incomplete":
      return fill(template, { blanks: (params.blanks ?? []).map((blank) => text.legends[blank]).join(" ") });
    case "contradiction":
      return fill(template, {
        grain: params.grain ? optionLabel(request, "grain", params.grain, text) : "",
        period: params.period ? optionLabel(request, "period", params.period, text) : "",
      });
    case "levelSummed":
    case "notARate":
      return fill(template, { value: params.value ? formatValue(params.value, text.locale) : "" });
    case "baseJoiners":
    case "baseEnd":
      return fill(template, params.value ? rateParts(params.value, text.locale) : {});
    default:
      return template;
  }
}

export function noteText(receipt: Receipt, text: DemoText): string | undefined {
  return receipt.note ? text.rules[receipt.note] : undefined;
}

/** The polite live line after a run. */
export function liveText(receipt: Receipt, request: DefinitionRequest, text: DemoText): string {
  const verdict = text.verdicts[receipt.verdict];
  if (receipt.verdict === "open") {
    return fill(text.liveOpen, { n: request.id, r: receipt.attempt, verdict, why: ruleText(receipt, request, text) });
  }
  return fill(text.live, { n: request.id, r: receipt.attempt, verdict, value: rowsText(receipt.rows, text) });
}

function lockSentence(lock: Lock, text: DemoText): { lock: string; lockWhy: string } {
  const why = lock === "postgresRole" ? "" : text.lockWhy[lock];
  return { lock: text.locks[lock].label, lockWhy: why };
}

/** The one or two why lines of a triage receipt. */
export function triageTexts(receipt: TriageReceipt, text: DemoText): string[] {
  return receipt.rules.map((rule) => {
    const template = text.triageRules[rule];
    switch (rule) {
      case "tIncomplete":
        return fill(template, { what: text.incompleteCard[receipt.params.open ?? "behavior"] });
      case "tR02Lock":
        return receipt.params.lock ? fill(template, lockSentence(receipt.params.lock, text)) : template;
      case "tF01Missing":
        return fill(template, {
          list: joinList((receipt.params.missing ?? []).map((tick) => text.tickShort[tick]), text),
        });
      case "tF01Invented":
        return fill(template, {
          list: joinList((receipt.params.invented ?? []).map((tick) => text.tickShort[tick]), text),
        });
      default:
        return template;
    }
  });
}

export function liveCardText(card: TriageCard, receipt: TriageReceipt, text: DemoText): string {
  return fill(text.liveCard, { id: card, r: receipt.attempt, verdict: text.verdicts[receipt.verdict] });
}

/** The short path read out in the room: "loehrning.ai/demos/datenbereitschaft-fuer-ki#anfrage-03". */
export function shortPath(anchor: string, text: DemoText): string {
  return `loehrning.ai${text.locale === "en" ? "/en" : ""}/demos/datenbereitschaft-fuer-ki#${anchor}`;
}
