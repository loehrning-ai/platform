import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  auditDependencyLicenses,
  verifyDependencyLicenses,
} from "../audit-dependency-licenses.mjs";

async function fixture() {
  return mkdtemp(path.join(os.tmpdir(), "loehrning-license-audit-"));
}

async function addPackage(root, locator, manifest, licenseText = null) {
  const packageRoot = path.join(
    root,
    ".bun",
    locator,
    "node_modules",
    ...manifest.name.split("/"),
  );
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    path.join(packageRoot, "package.json"),
    `${JSON.stringify(manifest)}\n`,
  );
  if (licenseText) {
    await writeFile(path.join(packageRoot, "LICENSE"), licenseText);
  }
}

test("accepts declared, file-only, and exact reviewed conditional-license packages", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await addPackage(root, "plain@1.0.0", {
    name: "plain",
    version: "1.0.0",
    license: "MIT",
  });
  await addPackage(
    root,
    "file-only@2.0.0",
    { name: "file-only", version: "2.0.0" },
    "MIT License\n",
  );
  await addPackage(root, "sharp-libvips@1.2.4", {
    name: "@img/sharp-libvips-linux-x64",
    version: "1.2.4",
    license: "LGPL-3.0-or-later",
  });
  await addPackage(root, "sentry-cli@2.58.6", {
    name: "@sentry/cli-linux-x64",
    version: "2.58.6",
    license: "FSL-1.1-MIT",
  });

  assert.deepEqual(await verifyDependencyLicenses(root), {
    packageCount: 4,
    findings: [],
    fileOnly: ["file-only@2.0.0"],
    reviewRequired: [
      "@img/sharp-libvips-linux-x64@1.2.4 (LGPL-3.0-or-later; optional prebuilt image-processing runtime)",
      "@sentry/cli-linux-x64@2.58.6 (FSL-1.1-MIT; optional build-time Sentry CLI; excluded from the source tree)",
    ],
  });
});

test("rejects missing coverage and strong-copyleft or source-available expressions", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await addPackage(root, "unknown@1.0.0", {
    name: "unknown",
    version: "1.0.0",
  });
  await addPackage(root, "blocked@1.0.0", {
    name: "blocked",
    version: "1.0.0",
    license: "AGPL-3.0-only",
  });
  await addPackage(root, "unreviewed-weak@1.0.0", {
    name: "unreviewed-weak",
    version: "1.0.0",
    license: "LGPL-3.0-only",
  });
  await addPackage(root, "unreviewed-fsl@1.0.0", {
    name: "unreviewed-fsl",
    version: "1.0.0",
    license: "FSL-1.1-MIT",
  });

  const result = await auditDependencyLicenses(root);
  assert.equal(result.findings.length, 4);
  await assert.rejects(
    () => verifyDependencyLicenses(root),
    /Dependency license audit failed/,
  );
});
