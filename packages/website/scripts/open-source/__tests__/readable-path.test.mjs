import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GENERIC_BASE64_RE,
  hasBase64SecretShape,
  isReadableRelativeFilePath,
} from "../export-denylist.mjs";

function flaggedTokens(line) {
  return [...line.matchAll(GENERIC_BASE64_RE)]
    .filter((match) => hasBase64SecretShape(match[0]))
    .filter((match) => !isReadableRelativeFilePath(match[0], line.slice(match.index + match[0].length)));
}

test("kit file paths in recordings are not secrets", () => {
  for (const line of [
    '      "path": "vardar-audit-kit-de/ordner/infosec-policy_v3_FINAL.md",',
    '    "source": "crvena-zemja-nachweisprobe/nachreichung/rechnung-EL-25-09.png",',
    "cat P/R6_Vorfaelle/incident-log_2026_extract-Tannwald.csv &",
    "write evidence_pack/00_evidence-index_INTERNAL.md << EOF",
  ]) {
    assert.deepEqual(flaggedTokens(line).map((m) => m[0]), [], line);
  }
});

test("secret-shaped tokens stay flagged, also when they look like a path", () => {
  // Built at run time so this file itself carries no secret-shaped literal.
  const run = "aB3dE5fG7h".repeat(5);
  const kit = ["vardar-audit-kit", "folder"].join("/");
  for (const line of [
    `key = "${run}"`,
    `ref = "${run.slice(0, 20)}/${run.slice(20)}.md"`,
    `ref = "folder/${"Xk9Lm2Qp".repeat(5)}.txt"`,
    `ref = "${kit}/infosec-policy_v3_FINAL.md${"x2Q".repeat(2)}"`,
    `ref = "${kit}/infosec-policy_v3_FINAL_${"Notes".repeat(2)}"`,
  ]) {
    assert.equal(flaggedTokens(line).length, 1, line);
  }
});
