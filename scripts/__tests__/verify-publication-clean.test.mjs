import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  findPublicationResidue,
  verifyPublicationClean,
} from "../verify-publication-clean.mjs";

async function fixture() {
  return mkdtemp(path.join(os.tmpdir(), "loehrning-publication-clean-"));
}

test("accepts source and tracked environment examples", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src", "index.ts"), "export {};\n");
  await writeFile(path.join(root, ".env.example"), "TOKEN=<placeholder>\n");
  await writeFile(
    path.join(root, "tests.env.local.example"),
    "TOKEN=<placeholder>\n",
  );

  await assert.doesNotReject(() => verifyPublicationClean(root));
  assert.deepEqual(await findPublicationResidue(root), []);
});

test("reports generated directories, Git metadata, secrets, and excluded specs", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  for (const directory of [
    ".git",
    "node_modules",
    "packages/simplified-website/.next",
    "packages/simplified-website/tests/e2e/.auth",
  ]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  await mkdir(path.join(root, "packages/simplified-website/tests/e2e"), {
    recursive: true,
  });
  await writeFile(path.join(root, ".env.local"), "TOKEN=secret\n");
  await writeFile(
    path.join(root, "packages/simplified-website/tests/e2e/_local.spec.ts"),
    "export {};\n",
  );

  assert.deepEqual(await findPublicationResidue(root), [
    ".env.local",
    ".git/",
    "node_modules/",
    "packages/simplified-website/.next/",
    "packages/simplified-website/tests/e2e/_local.spec.ts",
    "packages/simplified-website/tests/e2e/.auth/",
  ]);
  await assert.rejects(
    () => verifyPublicationClean(root),
    /Publication tree contains generated, secret-bearing, or unsafe residue/,
  );
});

test("reports the complete cache, credential, and local-runtime residue boundary", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  for (const directory of [
    ".auth",
    ".aws",
    ".kube",
    ".ssh",
    ".swc",
    ".venv",
    "build",
    "dist",
    "venv",
  ]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  await mkdir(path.join(root, ".docker"), { recursive: true });
  for (const file of [
    ".dockercfg",
    ".git",
    ".git-credentials",
    ".netrc",
    ".npmrc",
    ".pypirc",
    "credentials.json",
    "debug.log",
    "id_ed25519",
    "kubeconfig",
    "module.pyc",
    "private.pem",
    "service-account-prod.json",
    ".docker/config.json",
  ]) {
    await writeFile(path.join(root, file), "obvious-publication-residue\n");
  }

  const findings = await findPublicationResidue(root);
  for (const expected of [
    ".auth/",
    ".aws/",
    ".docker/config.json",
    ".dockercfg",
    ".git",
    ".git-credentials",
    ".kube/",
    ".netrc",
    ".npmrc",
    ".pypirc",
    ".ssh/",
    ".swc/",
    ".venv/",
    "build/",
    "credentials.json",
    "debug.log",
    "dist/",
    "id_ed25519",
    "kubeconfig",
    "module.pyc",
    "private.pem",
    "service-account-prod.json",
    "venv/",
  ]) {
    assert.ok(
      findings.includes(expected),
      `missing residue finding: ${expected}`,
    );
  }
});
