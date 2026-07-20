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
 * Run automatically as a prebuild and precontent:lint step:
 *   bun run registry:export
 *
 * Ownership: legal-source governance
 */

import { writeFileSync, mkdirSync } from "node:fs";
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

writeFileSync(outputPath, JSON.stringify(sortedDates, null, 2) + "\n", "utf-8");
console.log(`Exported ${sortedDates.length} approved date strings to src/lib/legal-registry.json`);
console.log("Dates:", sortedDates.join(", "));
