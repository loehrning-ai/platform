import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_DELETION_ORIGIN_LOCK_NAME,
  type AccountDeletionLockLease,
  isAccountDeletionOriginLockLeaseActive,
  withAccountDeletionOriginLock,
} from "./account-deletion-lock";
import {
  ACCOUNT_LEARNING_CUTOVER_KEY,
  __resetLearningOwnerForTests,
  prepareAccountLearningStorage,
  rotateAccountLearningCutoverForDeletion,
} from "./browser-learning-storage";

function deferred(): {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
} {
  let resolve!: () => void;
  return {
    promise: new Promise<void>((settle) => {
      resolve = settle;
    }),
    resolve,
  };
}

function queuedLockManager(): LockManager {
  let held = false;
  const waiters: Array<() => void> = [];

  const request = vi.fn(
    <T>(
      name: string,
      options: LockOptions,
      callback: (lock: Lock | null) => T | PromiseLike<T>,
    ): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const run = () => {
          held = true;
          void Promise.resolve(
            callback({ name, mode: "exclusive" } as Lock),
          ).then(resolve, reject).finally(() => {
            held = false;
            waiters.shift()?.();
          });
        };
        if (!held) {
          run();
        } else if (options.ifAvailable) {
          void Promise.resolve(callback(null)).then(resolve, reject);
        } else {
          waiters.push(run);
        }
      }),
  );

  return { request } as unknown as LockManager;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  __resetLearningOwnerForTests("unknown");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("account deletion origin lock", () => {
  it("fails closed when the Web Locks API is unavailable", async () => {
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: undefined,
    });

    await expect(
      withAccountDeletionOriginLock({ ifAvailable: false }, () => true),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("serializes queued recovery, rejects immediate contention, and expires its unforgeable lease", async () => {
    const manager = queuedLockManager();
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: manager,
    });
    const gate = deferred();
    const order: string[] = [];
    let capturedLease: AccountDeletionLockLease | null = null;

    const first = withAccountDeletionOriginLock(
      { ifAvailable: false },
      async (lease) => {
        capturedLease = lease;
        expect(isAccountDeletionOriginLockLeaseActive(lease)).toBe(true);
        order.push("first-start");
        await gate.promise;
        order.push("first-end");
        return "first";
      },
    );
    const second = withAccountDeletionOriginLock(
      { ifAvailable: false },
      () => {
        order.push("second");
        return "second";
      },
    );
    const immediate = withAccountDeletionOriginLock(
      { ifAvailable: true },
      () => {
        order.push("should-not-run");
        return "unexpected";
      },
    );

    await expect(immediate).resolves.toEqual({ kind: "contended" });
    expect(order).toEqual(["first-start"]);
    gate.resolve();

    await expect(first).resolves.toEqual({
      kind: "acquired",
      value: "first",
    });
    await expect(second).resolves.toEqual({
      kind: "acquired",
      value: "second",
    });
    expect(order).toEqual(["first-start", "first-end", "second"]);
    expect(capturedLease).not.toBeNull();
    expect(
      isAccountDeletionOriginLockLeaseActive(capturedLease!),
    ).toBe(false);
    expect(
      isAccountDeletionOriginLockLeaseActive(
        {} as AccountDeletionLockLease,
      ),
    ).toBe(false);
    expect(
      rotateAccountLearningCutoverForDeletion(
        "account-a",
        capturedLease!,
      ),
    ).toBe(false);
    expect(
      rotateAccountLearningCutoverForDeletion(
        "account-a",
        {} as AccountDeletionLockLease,
      ),
    ).toBe(false);
    expect(manager.request).toHaveBeenCalledWith(
      ACCOUNT_DELETION_ORIGIN_LOCK_NAME,
      { mode: "exclusive" },
      expect.any(Function),
    );
  });

  it("serializes competing marker preparation and different-account rotations into one lineage", async () => {
    const manager = queuedLockManager();
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: manager,
    });

    await expect(
      Promise.all([
        prepareAccountLearningStorage(),
        prepareAccountLearningStorage(),
      ]),
    ).resolves.toEqual([true, true]);
    const prepared = JSON.parse(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
    ) as {
      lineage: string;
      generation: number;
      retiredAccounts: unknown[];
    };
    expect(prepared).toMatchObject({
      generation: 1,
      retiredAccounts: [],
    });

    const [accountA, accountB] = await Promise.all([
      withAccountDeletionOriginLock({ ifAvailable: false }, (lease) =>
        rotateAccountLearningCutoverForDeletion("account-a", lease),
      ),
      withAccountDeletionOriginLock({ ifAvailable: false }, (lease) =>
        rotateAccountLearningCutoverForDeletion("account-b", lease),
      ),
    ]);
    expect(accountA).toEqual({ kind: "acquired", value: true });
    expect(accountB).toEqual({ kind: "acquired", value: true });

    const rotated = JSON.parse(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
    ) as {
      lineage: string;
      generation: number;
      retiredAccounts: Array<{ accountHash: string }>;
    };
    expect(rotated.lineage).toBe(prepared.lineage);
    expect(rotated.generation).toBe(3);
    expect(rotated.retiredAccounts).toHaveLength(2);
    expect(
      rotated.retiredAccounts.every(({ accountHash }) =>
        /^[a-f0-9]{64}$/.test(accountHash),
      ),
    ).toBe(true);
    expect(
      new Set(
        rotated.retiredAccounts.map(({ accountHash }) => accountHash),
      ).size,
    ).toBe(2);
    expect(JSON.stringify(rotated.retiredAccounts)).not.toContain("account-a");
    expect(JSON.stringify(rotated.retiredAccounts)).not.toContain("account-b");
  });
});
