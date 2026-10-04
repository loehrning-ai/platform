// ─── Lesson engine: exercise-prop validation for the lab widgets ─────
//
// Course authors only write JSON. These checks catch authoring mistakes
// before a learner meets them: dangling ids, unreachable goals, formulas
// that do not parse, results nobody can reach. `validateEngineLesson`
// runs them for every lab kind; content tests run that for every lesson.

import { compileExpression, evaluateCondition } from "./expression";

type Props = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

function checkFormula(
  source: string,
  known: ReadonlySet<string>,
  where: string,
  problems: string[],
): void {
  try {
    const compiled = compileExpression(source);
    const unknown = compiled.variables.filter((name) => !known.has(name));
    if (unknown.length) {
      problems.push(`${where}: unknown variable(s) ${unknown.join(", ")}`);
    }
  } catch (error) {
    problems.push(`${where}: formula does not parse (${(error as Error).message})`);
  }
}

function bucketSort(props: Props, problems: string[]): void {
  const buckets = records(props.buckets);
  const items = records(props.items);
  if (buckets.length < 2) problems.push("bucket-sort: needs at least 2 buckets");
  if (items.length < 3) problems.push("bucket-sort: needs at least 3 items");
  const bucketIds = new Set(buckets.map((bucket) => str(bucket.id)));
  for (const dupe of duplicates(buckets.map((bucket) => str(bucket.id)))) {
    problems.push(`bucket-sort: duplicate bucket ${dupe}`);
  }
  for (const dupe of duplicates(items.map((item) => str(item.id)))) {
    problems.push(`bucket-sort: duplicate item ${dupe}`);
  }
  for (const item of items) {
    if (!bucketIds.has(str(item.bucket))) {
      problems.push(`bucket-sort: item ${str(item.id)} points to unknown bucket ${str(item.bucket)}`);
    }
    if (!str(item.text) || !str(item.why)) {
      problems.push(`bucket-sort: item ${str(item.id)} needs text and why`);
    }
  }
  for (const bucket of buckets) {
    if (!items.some((item) => item.bucket === bucket.id)) {
      problems.push(`bucket-sort: bucket ${str(bucket.id)} has no item`);
    }
  }
  if (props.layout !== undefined && props.layout !== "grid" && props.layout !== "pyramid") {
    problems.push(`bucket-sort: layout must be "grid" or "pyramid"`);
  }
}

function claimChecker(props: Props, problems: string[]): void {
  const sources = records(props.sources);
  const claims = records(props.claims);
  const draft = records(props.draft);
  const sourceIds = new Set(sources.map((source) => str(source.id)));
  const claimIds = claims.map((claim) => str(claim.id));
  const referenced = draft.map((segment) => str(segment.claimId)).filter(Boolean);
  if (claims.length < 2) problems.push("claim-checker: needs at least 2 claims");
  for (const dupe of duplicates(claimIds)) problems.push(`claim-checker: duplicate claim ${dupe}`);
  for (const dupe of duplicates(referenced)) problems.push(`claim-checker: claim ${dupe} appears twice in the draft`);
  for (const id of claimIds) {
    if (!referenced.includes(id)) problems.push(`claim-checker: claim ${id} is not in the draft`);
  }
  for (const id of referenced) {
    if (!claimIds.includes(id)) problems.push(`claim-checker: draft references unknown claim ${id}`);
  }
  for (const claim of claims) {
    const verdict = str(claim.verdict);
    if (!["supported", "contradicted", "missing"].includes(verdict)) {
      problems.push(`claim-checker: claim ${str(claim.id)} has invalid verdict ${verdict}`);
    }
    if (verdict !== "missing" && !sourceIds.has(str(claim.sourceId))) {
      problems.push(`claim-checker: claim ${str(claim.id)} needs a known sourceId`);
    }
    if (verdict !== "missing" && claim.evidence !== undefined) {
      const source = sources.find((entry) => entry.id === claim.sourceId);
      if (source && !str(source.text).includes(str(claim.evidence))) {
        problems.push(`claim-checker: evidence for ${str(claim.id)} is not a quote from source ${str(claim.sourceId)}`);
      }
    }
    if (!str(claim.why)) problems.push(`claim-checker: claim ${str(claim.id)} needs why`);
  }
}

function inputDomains(inputs: Record<string, unknown>[]): Map<string, number[]> {
  const domains = new Map<string, number[]>();
  for (const input of inputs) {
    const id = str(input.id);
    const type = str(input.type);
    if (type === "select") {
      domains.set(id, records(input.options).map((option) => Number(option.value)));
    } else if (type === "toggle") {
      domains.set(id, [0, 1]);
    } else {
      const min = Number(input.min ?? 0);
      const max = Number(input.max ?? 100);
      const steps = 24;
      const values = Array.from({ length: steps + 1 }, (_, index) => min + ((max - min) * index) / steps);
      values.push(Number(input.default));
      domains.set(id, values);
    }
  }
  return domains;
}

function calculator(props: Props, problems: string[]): void {
  const inputs = records(props.inputs);
  const outputs = records(props.outputs);
  if (!inputs.length) problems.push("calculator: needs inputs");
  if (!outputs.length) problems.push("calculator: needs outputs");
  const known = new Set<string>();
  for (const input of inputs) {
    const id = str(input.id);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id)) problems.push(`calculator: input id "${id}" must be an identifier`);
    if (known.has(id)) problems.push(`calculator: duplicate id ${id}`);
    known.add(id);
    if (typeof input.default !== "number") problems.push(`calculator: input ${id} needs a numeric default`);
    if (input.type === "select" && !records(input.options).length) {
      problems.push(`calculator: select ${id} needs options`);
    }
  }
  for (const output of outputs) {
    const id = str(output.id);
    checkFormula(str(output.formula), known, `calculator output ${id}`, problems);
    if (known.has(id)) problems.push(`calculator: duplicate id ${id}`);
    known.add(id);
  }
  const chart = isRecord(props.chart) ? props.chart : null;
  for (const bar of records(chart?.bars)) {
    checkFormula(str(bar.formula), known, `calculator bar ${str(bar.label)}`, problems);
  }
  for (const verdict of records(props.verdicts)) {
    checkFormula(str(verdict.when), known, `calculator verdict ${str(verdict.title)}`, problems);
  }
  const goals = records(props.goals);
  for (const goal of goals) {
    checkFormula(str(goal.when), known, `calculator goal ${str(goal.id)}`, problems);
  }
  // Every goal must be reachable with some combination of input values.
  if (goals.length && problems.length === 0) {
    const domains = [...inputDomains(inputs).entries()];
    const combos = domains.reduce<number>((count, [, values]) => count * values.length, 1);
    if (combos <= 20000) {
      const reached = new Set<string>();
      const walk = (index: number, values: Record<string, number>) => {
        if (index === domains.length) {
          const scope: Record<string, number> = { ...values };
          for (const output of outputs) {
            try {
              scope[str(output.id)] = Number(compileExpression(str(output.formula)).evaluate(scope));
            } catch {
              scope[str(output.id)] = Number.NaN;
            }
          }
          for (const goal of goals) {
            if (evaluateCondition(str(goal.when), scope)) reached.add(str(goal.id));
          }
          return;
        }
        const [id, options] = domains[index];
        for (const value of options) walk(index + 1, { ...values, [id]: value });
      };
      walk(0, {});
      for (const goal of goals) {
        if (!reached.has(str(goal.id))) problems.push(`calculator: goal ${str(goal.id)} is unreachable`);
      }
    }
  }
}

function thresholdLab(props: Props, problems: string[]): void {
  const groups = records(props.groups);
  if (groups.length !== 2) problems.push("threshold-lab: needs exactly 2 groups");
  for (const group of groups) {
    const rate = Number(group.baseRate);
    if (!(rate > 0 && rate < 1)) problems.push(`threshold-lab: group ${str(group.id)} baseRate must be between 0 and 1`);
  }
  const known = new Set([
    "t_a", "t_b", "split", "fpr_a", "fpr_b", "fnr_a", "fnr_b", "ppv_a", "ppv_b", "sel_a", "sel_b",
  ]);
  for (const goal of records(props.goals)) {
    checkFormula(str(goal.when), known, `threshold-lab goal ${str(goal.id)}`, problems);
  }
}

function decisionWizard(props: Props, problems: string[]): void {
  const nodes = records(props.nodes);
  const results = records(props.results);
  const nodeIds = new Set(nodes.map((node) => str(node.id)));
  const resultIds = new Set(results.map((result) => str(result.id)));
  const start = str(props.start);
  if (!nodeIds.has(start)) problems.push(`decision-wizard: start ${start} is not a node`);
  for (const dupe of duplicates(nodes.map((node) => str(node.id)))) problems.push(`decision-wizard: duplicate node ${dupe}`);
  const reachableResults = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (visited.has(id) || depth > 50) return;
    visited.add(id);
    const node = nodes.find((entry) => entry.id === id);
    for (const option of records(node?.options)) {
      const next = str(option.next);
      const result = str(option.result);
      if (Boolean(next) === Boolean(result)) {
        problems.push(`decision-wizard: option "${str(option.label)}" in ${id} needs exactly one of next/result`);
      }
      if (next && !nodeIds.has(next)) problems.push(`decision-wizard: option in ${id} points to unknown node ${next}`);
      if (result && !resultIds.has(result)) problems.push(`decision-wizard: option in ${id} points to unknown result ${result}`);
      if (result) reachableResults.add(result);
      if (next) visit(next, depth + 1);
    }
  };
  visit(start, 0);
  for (const node of nodeIds) {
    if (!visited.has(node)) problems.push(`decision-wizard: node ${node} is unreachable`);
  }
  for (const result of resultIds) {
    if (!reachableResults.has(result)) problems.push(`decision-wizard: result ${result} is unreachable`);
  }
  for (const scenario of records(props.scenarios)) {
    if (!resultIds.has(str(scenario.expected))) {
      problems.push(`decision-wizard: scenario ${str(scenario.id)} expects unknown result ${str(scenario.expected)}`);
    }
  }
}

function livePromptAb(props: Props, problems: string[]): void {
  const variants = records(props.variants);
  if (variants.length !== 2) problems.push("live-prompt-ab: needs exactly 2 variants");
  for (const variant of variants) {
    if (!str(variant.prompt) || !str(variant.recorded)) {
      problems.push("live-prompt-ab: every variant needs a prompt and a recorded output");
    }
  }
  const rubric = records(props.rubric);
  if (rubric.length < 2) problems.push("live-prompt-ab: needs at least 2 rubric criteria");
  for (const criterion of rubric) {
    const expected = isRecord(criterion.expected) ? criterion.expected : null;
    if (typeof expected?.a !== "boolean" || typeof expected?.b !== "boolean") {
      problems.push(`live-prompt-ab: criterion ${str(criterion.id)} needs expected.a and expected.b booleans`);
    }
  }
}

function docBuilder(props: Props, problems: string[]): void {
  const fields = records(props.fields);
  const template = str(props.template);
  if (!str(props.filename).endsWith(".md")) problems.push("doc-builder: filename must end in .md");
  const ids = new Set(fields.map((field) => str(field.id)));
  for (const match of template.matchAll(/\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g)) {
    if (!ids.has(match[1])) problems.push(`doc-builder: template uses unknown field ${match[1]}`);
  }
  for (const field of fields) {
    if (!template.includes(`{{${str(field.id)}}}`)) {
      problems.push(`doc-builder: field ${str(field.id)} is not used in the template`);
    }
    if (["select", "checkboxes"].includes(str(field.type)) && !Array.isArray(field.options)) {
      problems.push(`doc-builder: field ${str(field.id)} needs options`);
    }
  }
}

function piiRedactor(props: Props, problems: string[]): void {
  const segments = records(props.segments);
  if (!segments.some((segment) => str(segment.pii))) problems.push("pii-redactor: needs at least one pii segment");
  if (!segments.some((segment) => !segment.pii && str(segment.text).trim())) {
    problems.push("pii-redactor: needs at least one safe segment");
  }
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function timelineCheck(props: Props, problems: string[]): void {
  const milestones = records(props.milestones);
  const questions = records(props.questions);
  if (milestones.length < 2) problems.push("timeline-check: needs at least 2 milestones");
  if (questions.length < 2) problems.push("timeline-check: needs at least 2 questions");
  for (const dupe of duplicates(milestones.map((entry) => str(entry.id)))) {
    problems.push(`timeline-check: duplicate milestone ${dupe}`);
  }
  for (const dupe of duplicates(questions.map((entry) => str(entry.id)))) {
    problems.push(`timeline-check: duplicate question ${dupe}`);
  }
  const ids = new Set(milestones.map((entry) => str(entry.id)));
  for (const milestone of milestones) {
    if (!isIsoDay(str(milestone.date))) {
      problems.push(`timeline-check: milestone ${str(milestone.id)} needs an ISO date (YYYY-MM-DD)`);
    }
    if (!str(milestone.title)) problems.push(`timeline-check: milestone ${str(milestone.id)} needs a title`);
  }
  for (const question of questions) {
    if (!ids.has(str(question.milestone))) {
      problems.push(`timeline-check: question ${str(question.id)} points to unknown milestone ${str(question.milestone)}`);
    }
    if (!str(question.text) || !str(question.why)) {
      problems.push(`timeline-check: question ${str(question.id)} needs text and why`);
    }
  }
  if (props.today !== undefined && !isIsoDay(str(props.today))) {
    problems.push("timeline-check: today must be an ISO date (YYYY-MM-DD)");
  }
}

function sequenceOrder(props: Props, problems: string[]): void {
  const steps = records(props.steps);
  if (steps.length < 3) problems.push("sequence-order: needs at least 3 steps");
  for (const dupe of duplicates(steps.map((step) => str(step.id)))) {
    problems.push(`sequence-order: duplicate step ${dupe}`);
  }
  for (const step of steps) {
    if (!str(step.id) || !str(step.text) || !str(step.why)) {
      problems.push(`sequence-order: step ${str(step.id)} needs id, text and why`);
    }
  }
}

function triageMatrix(props: Props, problems: string[]): void {
  const items = records(props.items);
  if (items.length < 4) problems.push("triage-matrix: needs at least 4 items");
  for (const dupe of duplicates(items.map((item) => str(item.id)))) {
    problems.push(`triage-matrix: duplicate item ${dupe}`);
  }
  for (const item of items) {
    const id = str(item.id);
    if (!str(item.text) || !str(item.why)) problems.push(`triage-matrix: item ${id} needs text and why`);
    const reference = isRecord(item.reference) ? item.reference : {};
    for (const axis of ["f", "c", "k"]) {
      const value = reference[axis];
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 3) {
        problems.push(`triage-matrix: item ${id} reference.${axis} must be 1, 2 or 3`);
      }
    }
  }
  if (props.score !== undefined) {
    checkFormula(str(props.score), new Set(["f", "c", "k"]), "triage-matrix score", problems);
  }
  if (props.pick !== undefined) {
    const pick = Number(props.pick);
    if (!Number.isInteger(pick) || pick < 1 || pick >= items.length) {
      problems.push("triage-matrix: pick must be at least 1 and below the item count");
    }
  }
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function scenarioRun(props: Props, problems: string[]): void {
  const steps = records(props.steps);
  const cases = records(props.cases);
  const metrics = records(props.metrics);
  if (!steps.some((step) => step.optional !== false)) problems.push("scenario-run: needs at least one switchable step");
  if (cases.length < 2) problems.push("scenario-run: needs at least 2 cases");
  if (!str(props.goalLabel) || !str(props.successTitle)) {
    problems.push("scenario-run: needs goalLabel and successTitle");
  }
  const stepIds = new Set<string>();
  for (const step of steps) {
    const id = str(step.id);
    if (!IDENTIFIER.test(id)) problems.push(`scenario-run: step id "${id}" must be an identifier`);
    if (stepIds.has(id)) problems.push(`scenario-run: duplicate step ${id}`);
    stepIds.add(id);
    if (!str(step.label)) problems.push(`scenario-run: step ${id} needs a label`);
  }
  const known = new Set(stepIds);
  const caseIds = new Set<string>();
  for (const entry of cases) {
    const id = str(entry.id);
    if (!IDENTIFIER.test(id)) problems.push(`scenario-run: case id "${id}" must be an identifier`);
    if (caseIds.has(id)) problems.push(`scenario-run: duplicate case ${id}`);
    caseIds.add(id);
    if (!str(entry.label) || !str(entry.text) || !str(entry.passText) || !str(entry.failText)) {
      problems.push(`scenario-run: case ${id} needs label, text, passText and failText`);
    }
    checkFormula(str(entry.pass), stepIds, `scenario-run case ${id}`, problems);
  }
  for (const id of caseIds) known.add(`ok_${id}`);
  for (const name of ["passed", "total", "active"]) known.add(name);
  for (const metric of metrics) {
    const id = str(metric.id);
    checkFormula(str(metric.formula), known, `scenario-run metric ${id}`, problems);
    if (known.has(id)) problems.push(`scenario-run: duplicate id ${id}`);
    known.add(id);
  }
  checkFormula(str(props.goal), known, "scenario-run goal", problems);
  if (problems.length) return;

  // The goal must be reachable, and the default switches must not reach it.
  const switchable = steps.filter((step) => step.optional !== false);
  if (switchable.length > 12) {
    problems.push("scenario-run: at most 12 switchable steps");
    return;
  }
  const evaluate = (values: Record<string, number>): boolean => {
    const scope: Record<string, number> = {};
    let active = 0;
    for (const step of steps) {
      const on = step.optional === false ? 1 : values[str(step.id)] ? 1 : 0;
      scope[str(step.id)] = on;
      if (step.optional !== false && on) active += 1;
    }
    let passed = 0;
    for (const entry of cases) {
      const ok = evaluateCondition(str(entry.pass), scope);
      scope[`ok_${str(entry.id)}`] = ok ? 1 : 0;
      if (ok) passed += 1;
    }
    scope.passed = passed;
    scope.total = cases.length;
    scope.active = active;
    for (const metric of metrics) {
      try {
        scope[str(metric.id)] = Number(compileExpression(str(metric.formula)).evaluate(scope));
      } catch {
        scope[str(metric.id)] = Number.NaN;
      }
    }
    return evaluateCondition(str(props.goal), scope);
  };
  const defaults = Object.fromEntries(switchable.map((step) => [str(step.id), step.default ? 1 : 0]));
  if (evaluate(defaults)) problems.push("scenario-run: the default switches already meet the goal");
  let reachable = false;
  for (let mask = 0; mask < 2 ** switchable.length && !reachable; mask += 1) {
    const values = Object.fromEntries(
      switchable.map((step, index) => [str(step.id), (mask >> index) & 1]),
    );
    reachable = evaluate(values);
  }
  if (!reachable) problems.push("scenario-run: the goal is unreachable");
}

const VALIDATORS: Readonly<Record<string, (props: Props, problems: string[]) => void>> = {
  "bucket-sort": bucketSort,
  "claim-checker": claimChecker,
  calculator,
  "threshold-lab": thresholdLab,
  "decision-wizard": decisionWizard,
  "live-prompt-ab": livePromptAb,
  "doc-builder": docBuilder,
  "pii-redactor": piiRedactor,
  "timeline-check": timelineCheck,
  "sequence-order": sequenceOrder,
  "triage-matrix": triageMatrix,
  "scenario-run": scenarioRun,
};

/** Validate the props of one exercise. Non-lab kinds are not checked here. */
export function validateExerciseProps(kind: string, props: Props): string[] {
  const validator = VALIDATORS[kind];
  if (!validator) return [];
  const problems: string[] = [];
  validator(props, problems);
  return problems;
}
