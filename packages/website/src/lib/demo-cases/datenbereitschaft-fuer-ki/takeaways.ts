/**
 * The three things the visitor takes away, generated from their numbers:
 * a definition (text or YAML), the question for the AI or a person, and the
 * one careful sentence for the board pack. Pure; the words come in as a pack.
 */
import type { Locale } from "@/lib/i18n/locale";
import { formatNumber } from "./format";
import type { DemoPack } from "./pack";
import { slugify } from "./parse";
import { formatters, ratio, type Reading, type Series } from "./series";
import { fill, joinList } from "./text";

export interface Takeaways {
  readonly definitionText: string;
  readonly definitionYaml: string;
  readonly questionAi: string;
  readonly questionHuman: string;
  readonly board: string;
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

function definitionText(series: Series, take: DemoPack["take"]): string {
  const kind = series.definesAs;
  // Only the workshop example may say "April bis Juni 2026"; visitor numbers say how many months they typed.
  const typed = series.months.length;
  const scope = series.isExample ? take.scopeExample : fill(take.scopeVisitor, { n: typed });
  return [
    fill(take.defMetric, { name: series.name, unit: series.unit ? ` (${series.unit})` : "" }),
    kind === "level" ? take.defKindLevel : kind === "change" ? take.defKindChange : take.defKindUnclear,
    fill(take.defGrain, { scope }),
    fill(take.defTable, { table: series.table }),
    kind === "level" ? take.defCheckLevel : kind === "change" ? take.defCheckChange : take.defCheckUnclear,
  ].join("\n");
}

/** Only keys of the kit's semantic-template/metric.yml: slug, model, aggregation, result_grain, unit, limitations. */
function definitionYaml(series: Series, take: DemoPack["take"]): string {
  const kind = series.definesAs;
  const slug = slugify(series.name);
  const quote = (text: string) => (/^[[\]{}&*!|>'"%@`#,]/.test(text) ? `"${text}"` : text);
  const lines = [`slug: ${slug}`, `model: ${quote(series.table)}`];
  lines.push(
    kind === "level"
      ? `aggregation: snapshot        ${take.yamlAggLevel}`
      : kind === "change"
        ? `aggregation: movement        ${take.yamlAggChange}`
        : `aggregation: "[snapshot / movement]"  ${take.yamlAggUnclear}`,
  );
  lines.push("result_grain: monthly");
  if (series.unit) lines.push(`unit: ${series.unit}`);
  if (kind === "level") lines.push("limitations:", `  - ${fill(take.yamlLimit, { slug })}`);
  return lines.join("\n");
}

/**
 * The board sentence explains the reading the lever shows, but only while both readings rest on
 * numbers the visitor typed. Without a start the other reading would rest on an invented zero
 * (an end level of "0 + sum"), so the sentence stays with what was entered and says nothing about an end.
 */
function board(series: Series, take: DemoPack["take"], locale: Locale, reading: Reading | null): string {
  const bothTyped = series.startNote !== "zero" && series.valuesKind !== "unclear";
  const kind = bothTyped && reading ? reading : series.valuesKind;
  const entered = kind === "level" ? series.levels : series.changes;
  const { num } = formatters(series, locale);
  const list = joinList(entered.map(num), take.and);
  if (kind === "unclear") return fill(take.boardUnclear, { list });
  if (kind === "level") {
    const levels = series.levels ?? [];
    return fill(take.boardLevel, {
      list,
      sumLevels: num(sum(levels)),
      ratio: formatNumber(ratio(series) ?? 0, locale, 2),
      last: num(levels[levels.length - 1] ?? 0),
    });
  }
  const total = sum(entered);
  const period = entered.length === 3 ? take.periodQuarter : take.periodOther;
  if (series.startNote === "zero") return fill(take.boardChangeNoStart, { list, sum: num(total), period });
  return fill(take.boardChangeStart, {
    list,
    sum: num(total),
    period,
    start: num(series.startLevel),
    end: num(series.startLevel + total),
  });
}

/** `reading` is the reading the lever shows; it picks the board sentence for a series that has both. */
export function buildTakeaways(entered: Series, pack: DemoPack, reading: Reading | null = null): Takeaways {
  const { take } = pack;
  // An empty field becomes a visible [placeholder], never a silent gap.
  const series = { ...entered, name: entered.name || take.placeholderName, table: entered.table || take.placeholderTable };
  return {
    definitionText: definitionText(series, take),
    definitionYaml: definitionYaml(series, take),
    questionAi: fill(take.askAi, { name: series.name }),
    questionHuman: fill(take.askHuman, { name: series.name }),
    board: board(series, take, pack.locale, reading),
  };
}

/** The three chosen variants with their headings, as one block of text. */
export function joinAll(
  pack: DemoPack,
  takeaways: Takeaways,
  choice: { readonly yaml: boolean; readonly human: boolean },
): string {
  const [first, second, third] = pack.take.blockTitles;
  return [
    `${first}\n${choice.yaml ? takeaways.definitionYaml : takeaways.definitionText}`,
    `${second}\n${choice.human ? takeaways.questionHuman : takeaways.questionAi}`,
    `${third}\n${takeaways.board}`,
  ].join("\n\n");
}
