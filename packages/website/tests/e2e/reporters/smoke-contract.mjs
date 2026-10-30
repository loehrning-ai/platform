import { smokeContractFailures } from "../../../../../scripts/smoke-contract.mjs";

/** Playwright's normal reporters retain diagnostics; this one enforces coverage. */
export default class SmokeContractReporter {
  onBegin(config, suite) {
    this.shard = config.shard;
    this.suite = suite;
  }

  async onEnd() {
    if (!this.suite) {
      console.error("Smoke capability contract failed: suite was not collected.");
      return { status: "failed" };
    }
    const failures = smokeContractFailures(this.suite.allTests().map((item) => ({
      title: item.titlePath().join(" > "),
      tags: item.tags,
      expectedStatus: item.expectedStatus,
      outcome: item.outcome(),
      results: item.results.map((result) => ({ status: result.status, retry: result.retry })),
    })), this.shard);
    if (failures.length) {
      console.error(`Smoke capability contract failed:\n${failures.join("\n")}`);
      return { status: "failed" };
    }
    console.log(`Smoke capability contract passed: ${this.suite.allTests().length} cases, no skips or retries.`);
  }
}
