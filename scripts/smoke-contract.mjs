/** The small blocking suite: one real capability in each supported locale. */
export const SMOKE_CAPABILITIES = Object.freeze([
  "navigation", "learning", "workshop-w04", "workshop-w05", "reader",
  "glossary", "accessibility-home", "accessibility-reader", "accessibility-demo", "http-contract",
]);
export const SMOKE_TAGS = Object.freeze(
  ["de", "en"].flatMap((locale) => SMOKE_CAPABILITIES.map((capability) => `@smoke-${capability}-${locale}`)),
);
export const MOBILE_SMOKE_BATCHES = 5;

export function expectedSmokeTags(shard = null) {
  if (!shard) return [...SMOKE_TAGS];
  const { current, total } = shard;
  if (total !== MOBILE_SMOKE_BATCHES || !Number.isInteger(current) || current < 1 || current > total) {
    throw new Error(`Smoke batching requires one of 1/${MOBILE_SMOKE_BATCHES} through ${MOBILE_SMOKE_BATCHES}/${MOBILE_SMOKE_BATCHES}`);
  }
  const size = SMOKE_TAGS.length / total;
  return SMOKE_TAGS.slice((current - 1) * size, current * size);
}

/** Reject a green-looking run that omitted, skipped, retried or expected a failure. */
export function smokeContractFailures(cases, shard = null) {
  const failures = [];
  const expected = expectedSmokeTags(shard);
  const observed = [];
  for (const item of cases) {
    const tags = item.tags.filter((tag) => tag.startsWith("@smoke-"));
    if (tags.length !== 1) failures.push(`${item.title}: requires exactly one smoke capability tag`);
    observed.push(...tags);
    if (item.expectedStatus !== "passed") failures.push(`${item.title}: expected ${item.expectedStatus}, not a passing test`);
    if (item.outcome !== "expected" || item.results.length !== 1 || item.results[0]?.status !== "passed" || item.results[0]?.retry !== 0) {
      failures.push(`${item.title}: must pass once without a retry, skip or flaky verdict`);
    }
  }
  for (const tag of expected) {
    const count = observed.filter((value) => value === tag).length;
    if (count !== 1) failures.push(`${tag}: expected one passing case, found ${count}`);
  }
  for (const tag of observed) if (!expected.includes(tag)) failures.push(`Unexpected smoke capability: ${tag}`);
  return failures;
}
