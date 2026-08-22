import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { DATA_WORKSPACE_FILES } from "./data-workspace-fixtures";

const execFileAsync = promisify(execFile);

async function importFixture<T>(sourceName: string): Promise<T> {
  const source = Object.values(DATA_WORKSPACE_FILES)
    .flat()
    .find((file) => file.path.endsWith(`/src/${sourceName}`))?.content;
  if (!source) throw new Error(`missing fixture source: ${sourceName}`);
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  return import(url) as Promise<T>;
}

describe("executable data workspace fixtures", () => {
  it("derives leakage, peeking, and the safe metric comparison from generated rows", async () => {
    const fixture = await importFixture<{
      executeExperiment(): Record<string, unknown>;
    }>("experiment.mjs");

    expect(fixture.executeExperiment()).toMatchObject({
      rowsRead: 249,
      controlN: 120,
      treatmentN: 118,
      missingRows: 11,
      controlRatePct: 42,
      safeTreatmentRatePct: 47,
      leakedTreatmentRatePct: 64,
      safeEffectPoints: 5,
      leakageInflationPoints: 17,
      interimLooks: 5,
      leakageDetected: true,
    });
  });

  it("executes duplicate rejection, late backfill, reconciliation, and replay", async () => {
    const fixture = await importFixture<{
      executePipeline(): Record<string, unknown>;
    }>("backfill.mjs");

    expect(fixture.executePipeline()).toMatchObject({
      inputEvents: 117,
      acceptedEvents: 102,
      duplicateEvents: 14,
      invalidEvents: 1,
      lateEvents: 8,
      firstOutput: 94,
      backfillOutput: 102,
      replayOutput: 102,
      reconciled: true,
      idempotent: true,
    });
  });

  it("executes the incident and verifies zero-loss recovery below the SLO", async () => {
    const fixture = await importFixture<{
      executeRecovery(): Record<string, unknown>;
    }>("control-room.mjs");

    expect(fixture.executeRecovery()).toMatchObject({
      peakBacklog: 9200,
      failureP95Ms: 684,
      recoveryP95Ms: 210,
      sloTargetMs: 250,
      failureDuplicateRatePct: 14.2,
      recoveryDuplicateRatePct: 0.8,
      dataLoss: 0,
      costMultiple: 2.4,
      sloBreached: true,
      recovered: true,
    });
  });

  it("contains generated fixtures only and no connector or credential surface", () => {
    const serialized = JSON.stringify(DATA_WORKSPACE_FILES);
    expect(serialized).not.toMatch(
      /(?:api[_-]?key|credential|authorization|fetch\(|https?:\/\/)/i,
    );
    expect(
      Object.values(DATA_WORKSPACE_FILES).every((files) => files.length === 3),
    ).toBe(true);
  });

  it.each(Object.entries(DATA_WORKSPACE_FILES))(
    "runs the actual %s source and its two invariant tests as separate Node processes",
    async (_workspace, files) => {
      const directory = await mkdtemp(join(tmpdir(), "course-data-workspace-"));
      try {
        for (const file of files) {
          const target = join(
            directory,
            relative("/vercel/sandbox/workspace", file.path),
          );
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, file.content, "utf8");
        }
        const sourceFile = files.find((file) => file.path.includes("/src/"));
        if (!sourceFile) throw new Error("missing executable fixture source");
        const sourceRun = await execFileAsync(
          process.execPath,
          [relative("/vercel/sandbox/workspace", sourceFile.path)],
          { cwd: directory, timeout: 10_000 },
        );
        expect(() => JSON.parse(sourceRun.stdout.trim())).not.toThrow();

        const testRun = await execFileAsync(process.execPath, ["--test"], {
          cwd: directory,
          timeout: 10_000,
        });
        expect(testRun.stderr).toBe("");
        expect(testRun.stdout).toMatch(/(?:^|\s)pass\s+2(?:\s|$)/u);
        expect(testRun.stdout).toMatch(/(?:^|\s)fail\s+0(?:\s|$)/u);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );
});
