import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  EXPECTED_HISTORICAL_VERSIONS,
  verifyMigrationsTracked,
} from "../verify-migrations-tracked.mjs";

async function fixture() {
  return mkdtemp(path.join(os.tmpdir(), "loehrning-migrations-"));
}

function historicalDocFixtureContent() {
  return `# fixture\n\n${EXPECTED_HISTORICAL_VERSIONS.join("\n")}\n`;
}

test("passes for validly named files with the full historical exception list documented", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(
    path.join(dir, "20260728190500_a_real_migration.sql"),
    "select 1;",
  );
  await writeFile(
    path.join(dir, "HISTORICAL_FILELESS_MIGRATIONS.md"),
    historicalDocFixtureContent(),
  );

  const { errors, trackedFileCount } = await verifyMigrationsTracked(dir);
  assert.deepEqual(errors, []);
  assert.equal(trackedFileCount, 1);
});

test("rejects a malformed migration filename", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "not-a-timestamp.sql"), "select 1;");
  await writeFile(
    path.join(dir, "HISTORICAL_FILELESS_MIGRATIONS.md"),
    historicalDocFixtureContent(),
  );

  const { errors } = await verifyMigrationsTracked(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not match/);
});

test("rejects a duplicate migration timestamp", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "20260728190500_first.sql"), "select 1;");
  await writeFile(path.join(dir, "20260728190500_second.sql"), "select 1;");
  await writeFile(
    path.join(dir, "HISTORICAL_FILELESS_MIGRATIONS.md"),
    historicalDocFixtureContent(),
  );

  const { errors } = await verifyMigrationsTracked(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate migration timestamp/);
});

test("rejects a missing historical-exceptions doc", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "20260728190500_a.sql"), "select 1;");

  const { errors } = await verifyMigrationsTracked(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /is missing/);
});

test("rejects a historical-exceptions doc silently missing a version", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "20260728190500_a.sql"), "select 1;");
  const incomplete = EXPECTED_HISTORICAL_VERSIONS.slice(1).join("\n");
  await writeFile(
    path.join(dir, "HISTORICAL_FILELESS_MIGRATIONS.md"),
    `# fixture\n\n${incomplete}\n`,
  );

  const { errors } = await verifyMigrationsTracked(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], new RegExp(EXPECTED_HISTORICAL_VERSIONS[0]));
});

test("ignores non-.sql files and subdirectories", async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "20260728190500_a.sql"), "select 1;");
  await writeFile(path.join(dir, "README.md"), "notes");
  await mkdir(path.join(dir, "subdir"));
  await writeFile(
    path.join(dir, "HISTORICAL_FILELESS_MIGRATIONS.md"),
    historicalDocFixtureContent(),
  );

  const { errors, trackedFileCount } = await verifyMigrationsTracked(dir);
  assert.deepEqual(errors, []);
  assert.equal(trackedFileCount, 1);
});
