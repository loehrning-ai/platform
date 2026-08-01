import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePlaywrightArtifactPath } from "../../tests/e2e/fixtures/playwright-artifact-paths";

function packageFixture(): string {
  return mkdtempSync(path.join(tmpdir(), "loehrning-playwright-package-"));
}

describe("Playwright artifact path boundary", () => {
  it("derives fixed package-local roots and bounded CI descendants", () => {
    const packageRoot = packageFixture();
    try {
      expect(
        resolvePlaywrightArtifactPath({
          value: undefined,
          kind: "output",
          packageRoot,
        }),
      ).toBe(path.join(packageRoot, "test-results"));
      expect(
        resolvePlaywrightArtifactPath({
          value: "blob-report/auth-scaffold",
          kind: "blob",
          packageRoot,
        }),
      ).toBe(path.join(packageRoot, "blob-report", "auth-scaffold"));
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });

  it.each([
    "/",
    "/tmp/arbitrary",
    "..",
    "test-results/..",
    "test-results/../../valuable",
    "other-report/public",
    "test-results\\..\\valuable",
    "test-results/.hidden",
  ])("rejects broad, escaping, or foreign output path %s", (value) => {
    const packageRoot = packageFixture();
    try {
      expect(() =>
        resolvePlaywrightArtifactPath({
          value,
          kind: "output",
          packageRoot,
        }),
      ).toThrow();
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });

  it("rejects symlinked artifact roots and existing non-directories", () => {
    const packageRoot = packageFixture();
    const outside = mkdtempSync(
      path.join(tmpdir(), "loehrning-playwright-outside-"),
    );
    try {
      symlinkSync(outside, path.join(packageRoot, "blob-report"));
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: "blob-report/public",
          kind: "blob",
          packageRoot,
        }),
      ).toThrow(/symlinks/);

      writeFileSync(path.join(packageRoot, "test-results"), "valuable\n");
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: "test-results",
          kind: "output",
          packageRoot,
        }),
      ).toThrow(/non-directories/);
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("allows only fixed children of one real live-auth temp directory", () => {
    const packageRoot = packageFixture();
    const liveDirectory = mkdtempSync(
      path.join(tmpdir(), "loehrning-live-auth-"),
    );
    try {
      expect(
        resolvePlaywrightArtifactPath({
          value: path.join(liveDirectory, "playwright-report"),
          kind: "html",
          packageRoot,
          liveDirectory,
        }),
      ).toBe(path.join(liveDirectory, "playwright-report"));
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: path.join(liveDirectory, "..", "playwright-report"),
          kind: "html",
          packageRoot,
          liveDirectory,
        }),
      ).toThrow(/fixed temp-directory basename/);
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: path.join(liveDirectory, "other-report"),
          kind: "html",
          packageRoot,
          liveDirectory,
        }),
      ).toThrow(/fixed temp-directory basename/);
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
      rmSync(liveDirectory, { recursive: true, force: true });
    }
  });

  it("rejects a symlink masquerading as the owned live-auth directory", () => {
    const packageRoot = packageFixture();
    const outside = mkdtempSync(
      path.join(tmpdir(), "loehrning-live-auth-target-"),
    );
    const liveDirectory = path.join(
      tmpdir(),
      "loehrning-live-auth-symlink1",
    );
    try {
      mkdirSync(path.dirname(liveDirectory), { recursive: true });
      symlinkSync(outside, liveDirectory);
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: path.join(liveDirectory, "blob-report"),
          kind: "blob",
          packageRoot,
          liveDirectory,
        }),
      ).toThrow(/private, real, user-owned|symlink/);
    } finally {
      rmSync(liveDirectory, { force: true });
      rmSync(outside, { recursive: true, force: true });
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });

  it("rejects a shared live-auth directory even when its name is valid", () => {
    const packageRoot = packageFixture();
    const liveDirectory = mkdtempSync(
      path.join(tmpdir(), "loehrning-live-auth-"),
    );
    try {
      chmodSync(liveDirectory, 0o755);
      expect(() =>
        resolvePlaywrightArtifactPath({
          value: path.join(liveDirectory, "test-results"),
          kind: "output",
          packageRoot,
          liveDirectory,
        }),
      ).toThrow(/private.*user-owned/);
    } finally {
      rmSync(liveDirectory, { recursive: true, force: true });
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });
});
