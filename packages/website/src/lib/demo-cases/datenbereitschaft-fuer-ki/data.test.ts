/** Data parity: every number of demo 03 against the Workshop 03 kit files. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENDING_MRR, FOLDLINE, NET_NEW_MRR, type Month } from "./data";

const KIT = join(__dirname, "../../../../public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit");
const read = (path: string): string => readFileSync(join(KIT, path), "utf8");

function csv(path: string): Record<string, string>[] {
  const [header = "", ...lines] = read(path).trim().split("\n");
  const keys = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [keys[index], value])));
}

describe("FOLDLINE against the kit", () => {
  it("matches ending and net new MRR for March to June 2026", () => {
    const summary = csv("builder/claude/project/mrr_summary_monthly.csv");
    for (const month of ["2026-03", "2026-04", "2026-05", "2026-06"] as Month[]) {
      const row = summary.find((candidate) => candidate.month_start === `${month}-01`);
      expect(row, month).toBeDefined();
      expect(Number(row?.ending_mrr_eur)).toBe(ENDING_MRR[month]);
      expect(Number(row?.net_new_mrr_eur)).toBe(NET_NEW_MRR[month]);
    }
  });

  it("states the recorded answer, the counter-example and the table", () => {
    const facts = read("builder/warehouse/seed/SEED-FACTS.md");
    expect(facts).toContain("−17,595");
    expect(facts).toContain("42,565 − 60,160");
    expect(facts).toContain("−19,960 / 9,775 / 42,565");
    expect(facts).toContain("1,066,140");
    expect(read("semantic-template/metric.yml")).toContain(`model: ${FOLDLINE.table}`);
    expect(42_565 - 60_160).toBe(FOLDLINE.recordedChangeDiff);
  });

  it("never quotes a GENERATED MRR component", () => {
    const source = readFileSync(join(__dirname, "data.ts"), "utf8");
    for (const generated of ["48060", "48_060", "31130", "31_130", "10120", "10_120", "13330", "13_330"]) {
      expect(source).not.toContain(generated);
    }
  });
});
