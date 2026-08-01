import {
  chmodSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateLiveAuthStorageStatePath } from "../../tests/e2e/fixtures/live-auth-artifacts";

describe("live-auth artifact boundary", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const cleanupPath of cleanupPaths.splice(0)) {
      rmSync(cleanupPath, { force: true, recursive: true });
    }
  });

  it("accepts only the dedicated OS-temporary storage-state shape", () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), "loehrning-live-auth-"),
    );
    cleanupPaths.push(directory);
    chmodSync(directory, 0o700);
    const candidate = path.join(directory, "user.json");
    expect(validateLiveAuthStorageStatePath(candidate)).toBe(
      path.resolve(candidate),
    );
  });

  it("rejects a same-name symlink escape", () => {
    const target = mkdtempSync(path.join(tmpdir(), "live-auth-target-"));
    const link = path.join(
      tmpdir(),
      `loehrning-live-auth-${randomUUID()}`,
    );
    cleanupPaths.push(link, target);
    chmodSync(target, 0o700);
    symlinkSync(target, link, "dir");

    expect(() =>
      validateLiveAuthStorageStatePath(path.join(link, "user.json")),
    ).toThrow(/symlinks/);
  });

  it("rejects a same-name directory with shared permissions", () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), "loehrning-live-auth-"),
    );
    cleanupPaths.push(directory);
    chmodSync(directory, 0o755);

    expect(() =>
      validateLiveAuthStorageStatePath(path.join(directory, "user.json")),
    ).toThrow(/private/);
  });

  it.each([
    ["relative", "tests/e2e/.auth/user.json"],
    ["repository absolute", path.resolve("tests/e2e/.auth/live.json")],
    ["arbitrary temporary file", path.join(tmpdir(), "live-user.json")],
    [
      "wrong filename",
      path.join(tmpdir(), "loehrning-live-auth-a1b2c3", "other.json"),
    ],
    [
      "nested directory",
      path.join(
        tmpdir(),
        "parent",
        "loehrning-live-auth-a1b2c3",
        "user.json",
      ),
    ],
    [
      "missing directory",
      path.join(tmpdir(), "loehrning-live-auth-missing", "user.json"),
    ],
  ])("rejects a %s path", (_label, candidate) => {
    expect(() => validateLiveAuthStorageStatePath(candidate)).toThrow();
  });
});
