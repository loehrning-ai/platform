import "server-only";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The web page reads the repository-root policy directly during static
 * generation. No second policy copy can drift from the file contributors
 * review in the repository.
 */
export function readRootLicensePolicy(): {
  readonly markdown: string;
  readonly sha256: string;
} {
  const policyPath = resolve(process.cwd(), "..", "..", "LICENSE_POLICY.md");
  const markdown = readFileSync(policyPath, "utf8");

  return {
    markdown,
    sha256: createHash("sha256").update(markdown).digest("hex"),
  };
}
