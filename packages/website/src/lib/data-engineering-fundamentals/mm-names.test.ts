import { describe, it, expect } from "vitest";
import { MM_MAP, mmNames } from "./mm-names";

describe("mmNames (plan 011 stage 2)", () => {
  it("defaults to the real/vendor term (index 0), matching the shipped app's unreachable-internalMode default", () => {
    const N = mmNames();
    expect(N.kafka).toBe("Kafka");
    expect(N.snowflake).toBe("Snowflake");
    expect(N.airflow).toBe("Airflow");
    expect(N.waitForSignal).toBe("ExternalTaskSensor");
    expect(N.dqOperator).toBe("ExpectationSuite");
  });

  it("resolves the generic term (index 1) when internalMode is explicitly true", () => {
    const N = mmNames(true);
    expect(N.kafka).toBe("Event Bus");
    expect(N.airflow).toBe("Scheduler");
  });

  it("covers every MM_MAP key", () => {
    const N = mmNames();
    expect(Object.keys(N).sort()).toEqual(Object.keys(MM_MAP).sort());
  });
});
