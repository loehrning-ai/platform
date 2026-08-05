#!/usr/bin/env node
/**
 * export-registry.mjs
 *
 * Exports approved AI Act date strings from the TypeScript legal registry
 * to a JSON whitelist file (src/lib/legal-registry.json).
 *
 * The content-lint.mjs script reads this JSON file at runtime so it can
 * check for hardcoded date strings in content files without parsing TypeScript.
 *
 * `--check` is non-mutating and is used by build/content gates. Maintainers
 * regenerate deliberately with:
 *   bun run registry:export
 *
 * Ownership: legal-source governance
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// This script runs under plain `node` (see the registry:export script), not
// Bun. The TypeScript import below relies on Node's built-in type stripping,
// which requires Node >= 22.18.
const { LEGAL_CLAIMS, getDisplayDate } = await import("../src/lib/legal-registry.ts");

// Collect all approved German date strings
const approvedDates = new Set();

for (const claim of LEGAL_CLAIMS) {
  // Use displayDateDE if present
  if (claim.displayDateDE) {
    approvedDates.add(claim.displayDateDE);
  }

  // Also add locale-formatted effectiveDate and enforcementDate as fallbacks
  for (const dateField of [claim.effectiveDate, claim.enforcementDate]) {
    if (dateField) {
      const date = new Date(dateField + "T00:00:00Z");
      const formatted = date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      approvedDates.add(formatted);
    }
  }

  // Also add the result of getDisplayDate for completeness
  const displayDate = getDisplayDate(claim.claimId);
  if (displayDate) approvedDates.add(displayDate);
}

const sortedDates = [...approvedDates].sort();
const outputPath = join(ROOT, "src", "lib", "legal-registry.json");
const expectedOutput = JSON.stringify(sortedDates, null, 2) + "\n";
const checkOnly = process.argv.includes("--check");
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== "--check");

if (unexpectedArgs.length > 0) {
  console.error(`Unknown argument(s): ${unexpectedArgs.join(", ")}`);
  process.exit(2);
}

if (checkOnly) {
  const currentOutput = existsSync(outputPath)
    ? readFileSync(outputPath, "utf-8")
    : null;
  if (currentOutput !== expectedOutput) {
    console.error(
      "src/lib/legal-registry.json is stale. Run `bun run registry:export` and review the generated diff.",
    );
    process.exit(1);
  }
  console.log(
    `Verified ${sortedDates.length} approved date strings in src/lib/legal-registry.json.`,
  );
  process.exit(0);
}

writeFileSync(outputPath, expectedOutput, "utf-8");
console.log(`Exported ${sortedDates.length} approved date strings to src/lib/legal-registry.json`);
console.log("Dates:", sortedDates.join(", "));
