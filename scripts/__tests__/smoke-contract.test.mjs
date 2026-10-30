import assert from "node:assert/strict";
import test from "node:test";
import { MOBILE_SMOKE_BATCHES, SMOKE_TAGS, expectedSmokeTags, smokeContractFailures } from "../smoke-contract.mjs";

const passed = (tags = SMOKE_TAGS) => tags.map((tag) => ({
  title: tag, tags: [tag], expectedStatus: "passed", outcome: "expected", results: [{ status: "passed", retry: 0 }],
}));

test("the baseline has bounded capability coverage in both locales", () => {
  assert.equal(SMOKE_TAGS.length, 20);
  assert.equal(new Set(SMOKE_TAGS).size, 20);
  assert.deepEqual(smokeContractFailures(passed()), []);
});

test("mobile batches cover every capability once without overlap", () => {
  const all = [];
  for (let current = 1; current <= MOBILE_SMOKE_BATCHES; current++) {
    const shard = { current, total: MOBILE_SMOKE_BATCHES };
    const tags = expectedSmokeTags(shard);
    assert.equal(tags.length, 4);
    assert.deepEqual(smokeContractFailures(passed(tags), shard), []);
    all.push(...tags);
  }
  assert.deepEqual(all, SMOKE_TAGS);
  assert.throws(() => expectedSmokeTags({ current: 1, total: 2 }), /Smoke batching/);
});

test("missing, duplicate and unexpected capabilities fail", () => {
  assert.match(smokeContractFailures(passed().slice(1)).join("\n"), /found 0/);
  assert.match(smokeContractFailures([...passed(), passed()[0]]).join("\n"), /found 2/);
  assert.match(smokeContractFailures([...passed(), ...passed(["@smoke-unknown-de"])]).join("\n"), /Unexpected/);
});

test("skips, expected failures, flaky passes, retries and absent results fail", () => {
  for (const change of [
    { expectedStatus: "skipped", outcome: "skipped", results: [] },
    { expectedStatus: "failed", results: [{ status: "failed", retry: 0 }] },
    { outcome: "flaky", results: [{ status: "failed", retry: 0 }, { status: "passed", retry: 1 }] },
    { results: [{ status: "passed", retry: 1 }] },
    { results: [] },
  ]) {
    const rows = passed();
    Object.assign(rows[0], change);
    assert.ok(smokeContractFailures(rows).length > 0, JSON.stringify(change));
  }
});
