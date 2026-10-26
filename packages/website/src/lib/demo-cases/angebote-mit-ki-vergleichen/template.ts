/**
 * The kit's comparison template (vorlagen/vergleichsbasis.md), filled in this tab from the model on the
 * stage, as rotfaden's demo does (fillTemplate in assets/demo/demo.js): the table block gets one column
 * per offer in the template's own row order, the basis block the kit's basis (or blanks for the
 * visitor's own lines), the result block the sentences, or the missing line when the model is
 * incomplete. The template is German, so the filled file is German on both pages.
 */
import { fill, fmtEur, type StackModel } from "./stack";

/** The words the filled file uses; German, like the template. */
export const TEMPLATE_WORDS = {
  line: "Zeile",
  total: "Summe",
  notGiven: "nicht angegeben",
  missingCell: "fehlt",
  open: "offen",
  basisOpen: "offen",
  missing: "{option} nennt keine Zeile {line}. Bevor jemand vergleicht, fehlt diese Zahl.",
  missingMore: "Dazu {n} weitere fehlende Zeilen.",
} as const;

const block = (name: string) => new RegExp(`<!--\\s*rotfaden:${name}\\s*-->([\\s\\S]*?)<!--\\s*\\/rotfaden:${name}\\s*-->`, "g");

/** The first missing line, and how many more: the sentence that stands where a result would. */
export function missingSentence(model: StackModel, words: { readonly missing: string; readonly missingMore: string } = TEMPLATE_WORDS): string {
  const first = model.missing[0];
  if (!first) return "";
  const more = model.missing.length - 1;
  return fill(words.missing, { option: first.option, line: first.line }) + (more > 0 ? ` ${fill(words.missingMore, { n: more })}` : "");
}

function table(model: StackModel, inner: string): string {
  const named = inner
    .split("\n")
    .map((row) => row.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length > 2 && cells[1] && !/^:?-+:?$/.test(cells[1]))
    .map((cells) => cells[1]!)
    .slice(1)
    .filter((line) => !/^(summe|total|sum)$/i.test(line));
  const rows = [...named, ...model.lines.filter((line) => !named.includes(line))];
  const head = `| ${TEMPLATE_WORDS.line} | ${model.options.map((option) => option.name).join(" | ")} |`;
  const rule = `|---|${model.options.map(() => "---:").join("|")}|`;
  const body = rows.map(
    (line) =>
      `| ${line} | ${model.options
        .map((option) =>
          !model.lines.includes(line) ? TEMPLATE_WORDS.notGiven : option.missing.includes(line) ? TEMPLATE_WORDS.missingCell : fmtEur(option.lines[line] ?? 0, "de"),
        )
        .join(" | ")} |`,
  );
  const total = `| ${TEMPLATE_WORDS.total} | ${model.options.map((option) => (option.missing.length ? TEMPLATE_WORDS.open : fmtEur(option.total, "de"))).join(" | ")} |`;
  return [head, rule, ...body, total].join("\n");
}

/** The placeholders of the template, from the model (German money format). */
export function templateVars(model: StackModel, question: string): Readonly<Record<string, string>> {
  return {
    question,
    winner: model.winner.name,
    winner_total: fmtEur(model.winner.total, "de"),
    runner: model.runner.name,
    runner_total: fmtEur(model.runner.total, "de"),
    gap: fmtEur(model.gap, "de"),
    headline_winner: model.headWinner.name,
    decider: model.decider,
  };
}

export function fillTemplate(
  text: string,
  model: StackModel,
  vars: Readonly<Record<string, string>>,
  basis: readonly string[] | null,
): string {
  let out = text.replace(block("table"), (_all, inner: string) => table(model, inner));
  out = out.replace(block("basis"), (_all, inner: string) =>
    basis && basis.length > 0 ? basis.map((line) => `- ${line}`).join("\n") : inner.replace(/^\n+|\n+$/g, "").replace(/_{3,}/g, TEMPLATE_WORDS.basisOpen),
  );
  out = out.replace(block("result"), (_all, inner: string) => (model.complete ? inner.replace(/^\n+|\n+$/g, "") : missingSentence(model)));
  return out.replace(/\{\{(\w+)\}\}/g, (all, key: string) => (Object.hasOwn(vars, key) ? vars[key]! : all));
}
