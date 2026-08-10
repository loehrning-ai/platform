import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENT_ROOT = join(__dirname, "../../components/data-science");
const SOURCE_ROOTS = [
  join(COMPONENT_ROOT, "chapters"),
  join(COMPONENT_ROOT, "simulators"),
] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() &&
      path.endsWith(".tsx") &&
      !path.endsWith(".test.tsx")
      ? [path]
      : [];
  });
}

const sources = SOURCE_ROOTS.flatMap(sourceFiles).map((path) => ({
  path,
  text: readFileSync(path, "utf8"),
}));

const removedClaims = [
  "A/B is how you learn",
  "Power is how fast",
  "80% is standard",
  "Below 50% and you're gambling",
  "at least 1 full week",
  "2 is safer",
  "~25%",
  "9 times out of 10",
  "9 von 10",
  "20–60%",
  "~22-30%",
  "Shadow mode first (2 weeks)",
  "Zuerst Shadow-Modus (2 Wochen)",
  "guarantees identical transformations",
  "Skew is structurally impossible",
  "F > 10 for valid IV",
  "EU AI Act Art. 13",
  "model is 20%",
  "Modell umfasst 20%",
  "PSI > 0.2 means retrain",
  "Rollback drills quarterly",
  "Always fit scaler",
  "perfectly fitted to training set",
  "When it crosses zero for good",
  "CIs beat p-values",
] as const;

describe("data-science claim hygiene", () => {
  it.each(removedClaims)(
    "does not reintroduce unsupported copy: %s",
    (claim) => {
      const offenders = sources
        .filter((source) => source.text.includes(claim))
        .map((source) => source.path.replace(`${COMPONENT_ROOT}/`, ""));
      expect(offenders).toEqual([]);
    },
  );

  it("keeps the shared local teaching-model limitation attached to every Panel", () => {
    const primitives = readFileSync(
      join(COMPONENT_ROOT, "shared/primitives.tsx"),
      "utf8",
    );
    const disclosure = readFileSync(
      join(COMPONENT_ROOT, "shared/simulation-disclosure.tsx"),
      "utf8",
    );

    expect(primitives).toContain("<SimulationDisclosure />");
    expect(disclosure).toContain(
      "does not estimate, validate, or certify a production system",
    );
    expect(disclosure).toContain(
      "schätzt, validiert oder zertifiziert kein Produktionssystem",
    );
  });
});
