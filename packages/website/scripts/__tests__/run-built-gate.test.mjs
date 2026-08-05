import assert from "node:assert/strict";
import test from "node:test";
import { executeBuiltGate } from "../run-built-gate.mjs";

function receipt(overrides = {}) {
  return {
    version: 2,
    algorithm: "sha256",
    buildId: "build-one",
    fileCount: 10,
    inputDigest: "input-one",
    environmentDigest: "environment-one",
    artifactFileCount: 20,
    artifactDigest: "artifact-one",
    toolchain: { nodeVersion: "test" },
    ...overrides,
  };
}

test("verifies before and after a successful built gate", () => {
  let verificationCount = 0;
  let spawnCount = 0;
  const status = executeBuiltGate({
    args: ["probe", "one"],
    verify: () => {
      verificationCount += 1;
      return receipt();
    },
    spawn: (command, args) => {
      spawnCount += 1;
      assert.equal(command, "probe");
      assert.deepEqual(args, ["one"]);
      return { status: 0 };
    },
    logError: () => {},
  });
  assert.equal(status, 0);
  assert.equal(spawnCount, 1);
  assert.equal(verificationCount, 2);
});

test("still verifies after a failed child command", () => {
  let verificationCount = 0;
  const status = executeBuiltGate({
    args: ["probe"],
    verify: () => {
      verificationCount += 1;
      return receipt();
    },
    spawn: () => ({ status: 7 }),
    logError: () => {},
  });
  assert.equal(status, 7);
  assert.equal(verificationCount, 2);
});

test("a postflight receipt failure overrides a green child", () => {
  let verificationCount = 0;
  const status = executeBuiltGate({
    args: ["probe"],
    verify: () => {
      verificationCount += 1;
      if (verificationCount === 2) throw new Error("stale");
      return receipt();
    },
    spawn: () => ({ status: 0 }),
    logError: () => {},
  });
  assert.equal(status, 1);
  assert.equal(verificationCount, 2);
});

test("a failed preflight prevents the child from starting", () => {
  let spawned = false;
  const status = executeBuiltGate({
    args: ["probe"],
    verify: () => {
      throw new Error("stale");
    },
    spawn: () => {
      spawned = true;
      return { status: 0 };
    },
    logError: () => {},
  });
  assert.equal(status, 1);
  assert.equal(spawned, false);
});

test("rejects a different valid build installed during the gate", () => {
  let verificationCount = 0;
  const errors = [];
  const status = executeBuiltGate({
    args: ["probe"],
    verify: () => {
      verificationCount += 1;
      return receipt({
        buildId: verificationCount === 1 ? "build-one" : "build-two",
        artifactDigest:
          verificationCount === 1 ? "artifact-one" : "artifact-two",
      });
    },
    spawn: () => ({ status: 0 }),
    logError: (message) => errors.push(message),
  });
  assert.equal(status, 1);
  assert.equal(verificationCount, 2);
  assert.match(errors.join("\n"), /build identity changed/);
});
