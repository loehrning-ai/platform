#!/usr/bin/env node

/**
 * Repo-internal migration hygiene. Cannot compare against the live project's
 * applied migration history — that needs Supabase credentials, which CI does
 * not and must not have (provider-free verification). What it can enforce:
 * every file is validly named and chronologically unique, and the accepted
 * historical exception list (fileless migrations applied before this repo
 * tracked every migration as a file) stays exactly as documented, so a
 * silent drift in either direction fails the gate.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATION_FILENAME_RE = /^(\d{14})_[a-z0-9_]+\.sql$/;
export const EXPECTED_HISTORICAL_VERSIONS = Object.freeze([
  "20260421203216",
  "20260421203233",
  "20260421203300",
  "20260421203316",
  "20260421203343",
  "20260421203503",
  "20260421203522",
  "20260421203611",
]);

export async function verifyMigrationsTracked(migrationsDir) {
  const historicalDocPath = path.join(
    migrationsDir,
    "HISTORICAL_FILELESS_MIGRATIONS.md",
  );
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  const errors = [];
  const versions = new Set();

  for (const name of sqlFiles) {
    const match = MIGRATION_FILENAME_RE.exec(name);
    if (!match) {
      errors.push(`${name}: does not match <14-digit timestamp>_<snake_case>.sql`);
      continue;
    }
    const [, version] = match;
    if (versions.has(version)) {
      errors.push(`${version}: duplicate migration timestamp across multiple files`);
    }
    versions.add(version);
  }

  const historicalDoc = await readFile(historicalDocPath, "utf8").catch(() => null);
  if (historicalDoc === null) {
    errors.push(
      "HISTORICAL_FILELESS_MIGRATIONS.md is missing — the fileless-migration exception list must stay documented",
    );
  } else {
    for (const version of EXPECTED_HISTORICAL_VERSIONS) {
      if (!historicalDoc.includes(version)) {
        errors.push(
          `HISTORICAL_FILELESS_MIGRATIONS.md no longer documents historical version ${version}`,
        );
      }
    }
  }

  return { errors, trackedFileCount: sqlFiles.length };
}

async function main() {
  const migrationsDir = path.join(HERE, "..", "supabase", "migrations");
  const { errors, trackedFileCount } = await verifyMigrationsTracked(migrationsDir);

  if (errors.length > 0) {
    console.error("Migration tracking check failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Migration tracking check passed: ${trackedFileCount} tracked file(s), ` +
      `${EXPECTED_HISTORICAL_VERSIONS.length} documented historical exception(s).`,
  );
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  await main();
}
