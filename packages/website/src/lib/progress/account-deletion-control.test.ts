import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_LEARNING_CUTOVER_KEY,
  ACCOUNT_LEARNING_STORAGE_PREFIX,
} from "./browser-learning-storage";
import {
  ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS,
  ACCOUNT_DELETION_CONTROL_KEY,
  ACCOUNT_DELETION_CLEANUP_KEY_PREFIX,
  ACCOUNT_DELETION_RECOVERY_KEY,
  ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
  __resetAccountDeletionControlForTests,
  beginAccountDeletion,
  cancelAccountDeletion,
  confirmAccountDeletion,
  getAccountDeletionControlState,
  recoverMalformedAccountDeletionControl,
  releaseConfirmedAccountDeletion,
  resumeMalformedAccountDeletionRecovery,
  subscribeAccountDeletionControl,
} from "./account-deletion-control";
import { withAccountDeletionOriginLock } from "./account-deletion-lock";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

function ensureLocalStorage(): void {
  const existingPrototype = Object.getPrototypeOf(
    window.localStorage,
  ) as Partial<Storage> | null;
  if (
    typeof existingPrototype?.setItem === "function" &&
    typeof existingPrototype.removeItem === "function"
  ) {
    return;
  }

  const values = new Map<string, string>();
  class MemoryStorage implements Storage {
    get length() {
      return values.size;
    }

    clear(): void {
      values.clear();
    }

    getItem(key: string): string | null {
      return values.get(key) ?? null;
    }

    key(index: number): string | null {
      return Array.from(values.keys())[index] ?? null;
    }

    removeItem(key: string): void {
      values.delete(key);
    }

    setItem(key: string, value: string): void {
      values.set(key, String(value));
    }
  }

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
}

async function confirmUnderLock(
  epoch: string,
  accountId: string,
): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => confirmAccountDeletion(epoch, accountId, lease),
  );
  expect(result.kind).toBe("acquired");
  return result.kind === "acquired" && result.value;
}

beforeEach(() => {
  ensureLocalStorage();
  window.localStorage.clear();
  window.sessionStorage.clear();
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: {
      request: vi.fn(
        async (
          name: string,
          _options: LockOptions,
          callback: (lock: Lock | null) => unknown,
        ) =>
          callback({
            name,
            mode: "exclusive",
          } as Lock),
      ),
    },
  });
  __resetAccountDeletionControlForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("account deletion control", () => {
  it("persists a pending epoch, confirms only that epoch, and notifies subscribers", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAccountDeletionControl(listener);

    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(epoch.length).toBeGreaterThanOrEqual(8);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch,
      accountId: ACCOUNT_A,
    });
    const pending = JSON.parse(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
    ) as Record<string, unknown>;
    expect(pending).toEqual({
      version: 2,
      generation: 1,
      phase: "pending",
      epoch,
      accountId: ACCOUNT_A,
      createdAt: expect.any(Number),
      expiresAt: null,
    });

    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(cancelAccountDeletion(epoch)).toBe(false);
    expect(listener).toHaveBeenLastCalledWith({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    unsubscribe();
  });

  it("resumes only the matching pending epoch and writes a monotonic cancellation tombstone", () => {
    const epoch = beginAccountDeletion(ACCOUNT_A)!;

    expect(cancelAccountDeletion("stale-deletion-epoch")).toBe(false);
    expect(getAccountDeletionControlState().phase).toBe("pending");
    expect(cancelAccountDeletion(epoch)).toBe(true);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    const cancelled = JSON.parse(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
    ) as {
      createdAt: number;
      expiresAt: number;
    } & Record<string, unknown>;
    expect(cancelled).toEqual({
      version: 2,
      generation: 1,
      phase: "cancelled",
      epoch,
      accountId: ACCOUNT_A,
      createdAt: expect.any(Number),
      expiresAt: expect.any(Number),
    });
    expect(cancelled.expiresAt - cancelled.createdAt).toBe(
      ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
    );
  });

  it("accepts a persisted terminal state after bounded clock rollback without extending its expiry", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    const expiresAt = createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS;
    const epoch = "11111111-1111-4111-8111-111111111111";
    const persisted = JSON.stringify({
      version: 2,
      generation: 1,
      phase: "released",
      epoch,
      accountId: ACCOUNT_A,
      createdAt,
      expiresAt,
    });
    vi.setSystemTime(createdAt - ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, persisted);

    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(await recoverMalformedAccountDeletionControl()).toBe(false);
    expect(window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY)).toBe(
      persisted,
    );

    __resetAccountDeletionControlForTests();
    vi.setSystemTime(createdAt - ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS - 1);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, persisted);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: "invalid-persisted-deletion-state",
      accountId: null,
    });

    __resetAccountDeletionControlForTests();
    vi.setSystemTime(expiresAt);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, persisted);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
  });

  it("fails closed before DELETE when the pending marker cannot be stored durably", () => {
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeSetItem = storagePrototype.setItem;
    vi.spyOn(storagePrototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === ACCOUNT_DELETION_CONTROL_KEY) {
        throw new DOMException("storage denied", "QuotaExceededError");
      }
      nativeSetItem.call(this, key, value);
    });

    expect(beginAccountDeletion(ACCOUNT_A)).toBeNull();
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({ phase: "pending" }),
    );
  });

  it("does not publish confirmation through memory or BroadcastChannel when durable storage fails", async () => {
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    const durablePending = window.localStorage.getItem(
      ACCOUNT_DELETION_CONTROL_KEY,
    );
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeSetItem = storagePrototype.setItem;
    vi.spyOn(storagePrototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === ACCOUNT_DELETION_CONTROL_KEY) {
        throw new DOMException("storage denied", "QuotaExceededError");
      }
      nativeSetItem.call(this, key, value);
    });

    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(false);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY)).toBe(
      durablePending,
    );
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({ phase: "confirmed" }),
    );
  });

  it("reports release failure and retains the durable confirmed barrier when cleanup storage fails", async () => {
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeSetItem = storagePrototype.setItem;
    vi.spyOn(storagePrototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === cleanupKey) {
        throw new DOMException("storage denied", "QuotaExceededError");
      }
      nativeSetItem.call(this, key, value);
    });

    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(false);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
      ).phase,
    ).toBe("confirmed");
    expect(window.localStorage.getItem(cleanupKey)).toBeNull();
  });

  it("repairs and expires a durable cleanup ledger when the scalar release write is interrupted", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeSetItem = storagePrototype.setItem;
    let releaseWrites = 0;
    const setItemSpy = vi
      .spyOn(storagePrototype, "setItem")
      .mockImplementation(function (this: Storage, key, value) {
        releaseWrites += 1;
        if (releaseWrites === 2) {
          throw new DOMException("interrupted", "QuotaExceededError");
        }
        nativeSetItem.call(this, key, value);
      });

    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    expect(getAccountDeletionControlState().phase).toBe("cleanup");
    setItemSpy.mockRestore();
    const persistedEntries = Array.from(
      { length: window.localStorage.length },
      (_, index) => {
        const key = window.localStorage.key(index)!;
        return [key, window.localStorage.getItem(key)!] as const;
      },
    );

    __resetAccountDeletionControlForTests();
    for (const [key, value] of persistedEntries) {
      window.localStorage.setItem(key, value);
    }
    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    const repairedEntries = Array.from(
      { length: window.localStorage.length },
      (_, index) => {
        const key = window.localStorage.key(index)!;
        return [key, window.localStorage.getItem(key)!] as const;
      },
    );

    __resetAccountDeletionControlForTests();
    for (const [key, value] of repairedEntries) {
      window.localStorage.setItem(key, value);
    }
    vi.setSystemTime(createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    subscribeAccountDeletionControl(() => {});
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(
      Array.from({ length: window.localStorage.length }, (_, index) =>
        window.localStorage.key(index),
      ).filter((key) => key?.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX)),
    ).toEqual([]);
    expect(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY),
    ).not.toBeNull();
  });

  it("receives a confirmed deletion from another tab through the storage contract", () => {
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    const epoch = "11111111-1111-4111-8111-111111111111";
    const persisted = JSON.stringify({
      version: 1,
      generation: 1,
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: persisted,
      }),
    );

    expect(getAccountDeletionControlState()).toEqual({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(listener).toHaveBeenLastCalledWith({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
  });

  it("fails closed when another tab writes a malformed marker", () => {
    subscribeAccountDeletionControl(() => {});

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: "{not-json",
      }),
    );

    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: "invalid-persisted-deletion-state",
      accountId: null,
    });
  });

  it("makes confirmation dominate a concurrent cancellation, while a verified release dominates both", async () => {
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    const confirmed = {
      version: 1,
      generation: 1,
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    };
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify(confirmed),
      }),
    );

    expect(cancelAccountDeletion(epoch)).toBe(false);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          ...confirmed,
          phase: "cancelled",
        }),
      }),
    );
    expect(getAccountDeletionControlState()).toEqual({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
      ).phase,
    ).toBe("confirmed");

    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
  });

  it("retains a released account cleanup tombstone for suspended tabs", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    const released = window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY);

    __resetAccountDeletionControlForTests();
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, released ?? "");

    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    expect(listener).toHaveBeenLastCalledWith({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    const cleanup = JSON.parse(
      window.localStorage.getItem(
        `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`,
      ) ?? "null",
    ) as {
      version: number;
      createdAt: number;
      expiresAt: number;
    } | null;
    // This test restores only the scalar marker above. The independent cleanup
    // ledger is covered by the cross-account replay tests below.
    expect(cleanup).toBeNull();
  });

  it("replays a finite cleanup tombstone before expiry and purges it with the released scalar at expiry", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const persistedEntries = Array.from(
      { length: window.localStorage.length },
      (_, index) => {
        const key = window.localStorage.key(index)!;
        return [key, window.localStorage.getItem(key)!] as const;
      },
    );
    const cleanup = JSON.parse(
      window.localStorage.getItem(cleanupKey) ?? "",
    ) as {
      version: number;
      createdAt: number;
      expiresAt: number;
    };
    expect(cleanup).toMatchObject({
      version: 2,
      createdAt,
      expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
    });

    __resetAccountDeletionControlForTests();
    for (const [key, value] of persistedEntries) {
      window.localStorage.setItem(key, value);
    }
    vi.setSystemTime(createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS - 1);
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });

    const entriesBeforeExpiry = Array.from(
      { length: window.localStorage.length },
      (_, index) => {
        const key = window.localStorage.key(index)!;
        return [key, window.localStorage.getItem(key)!] as const;
      },
    );
    __resetAccountDeletionControlForTests();
    for (const [key, value] of entriesBeforeExpiry) {
      window.localStorage.setItem(key, value);
    }
    vi.setSystemTime(createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS);

    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    subscribeAccountDeletionControl(() => {});
    expect(window.localStorage.getItem(cleanupKey)).toBeNull();
  });

  it("accepts a cleanup marker after bounded clock rollback and preserves its original expiry", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    const expiresAt = createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS;
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const epoch = "11111111-1111-4111-8111-111111111111";
    const persisted = JSON.stringify({
      version: 2,
      epoch,
      accountId: ACCOUNT_A,
      createdAt,
      expiresAt,
    });
    vi.setSystemTime(createdAt - ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS);
    window.localStorage.setItem(cleanupKey, persisted);
    const listener = vi.fn();

    subscribeAccountDeletionControl(listener);

    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(await recoverMalformedAccountDeletionControl()).toBe(false);
    expect(window.localStorage.getItem(cleanupKey)).toBe(persisted);

    __resetAccountDeletionControlForTests();
    vi.setSystemTime(expiresAt);
    window.localStorage.setItem(cleanupKey, persisted);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    expect(window.localStorage.getItem(cleanupKey)).toBeNull();
  });

  it("rejects cleanup markers whose declared lifetime exceeds the retention contract", () => {
    const createdAt = Date.UTC(2026, 6, 29, 12);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    window.localStorage.setItem(
      cleanupKey,
      JSON.stringify({
        version: 2,
        epoch: "11111111-1111-4111-8111-111111111111",
        accountId: ACCOUNT_A,
        createdAt,
        expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS + 1,
      }),
    );

    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: "invalid-persisted-deletion-cleanup",
      accountId: null,
    });
  });

  it("migrates a legacy cleanup marker once and assigns a finite expiry", () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const epoch = "11111111-1111-4111-8111-111111111111";
    window.localStorage.setItem(
      cleanupKey,
      JSON.stringify({
        version: 1,
        epoch,
        accountId: ACCOUNT_A,
      }),
    );
    const listener = vi.fn();

    subscribeAccountDeletionControl(listener);

    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(JSON.parse(window.localStorage.getItem(cleanupKey) ?? "")).toEqual({
      version: 2,
      epoch,
      accountId: ACCOUNT_A,
      createdAt,
      expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
    });
  });

  it("replays account A cleanup after account B replaces the scalar request", async () => {
    const epochA = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epochA, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epochA)).toBe(true);
    const epochB = beginAccountDeletion(ACCOUNT_B)!;

    const persistedEntries = Array.from(
      { length: window.localStorage.length },
      (_, index) => {
        const key = window.localStorage.key(index)!;
        return [key, window.localStorage.getItem(key)!] as const;
      },
    );
    expect(
      persistedEntries.some(([key]) =>
        key.startsWith(ACCOUNT_DELETION_CLEANUP_KEY_PREFIX),
      ),
    ).toBe(true);

    __resetAccountDeletionControlForTests();
    for (const [key, value] of persistedEntries) {
      window.localStorage.setItem(key, value);
    }

    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup",
      epoch: epochA,
      accountId: ACCOUNT_A,
    });
    expect(listener).toHaveBeenLastCalledWith({
      phase: "pending",
      epoch: epochB,
      accountId: ACCOUNT_B,
    });
  });

  it("keeps a malformed cleanup ledger fail-closed after an idle scalar state", () => {
    const damagedKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}damaged`;
    window.localStorage.setItem(damagedKey, "{not-json");
    const listener = vi.fn();

    subscribeAccountDeletionControl(listener);

    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: "invalid-persisted-deletion-cleanup",
      accountId: null,
    });
    expect(listener).toHaveBeenLastCalledWith({
      phase: "pending",
      epoch: "invalid-persisted-deletion-cleanup",
      accountId: null,
    });

    const scalarEpoch = "11111111-1111-4111-8111-111111111111";
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          version: 1,
          generation: 1,
          phase: "pending",
          epoch: scalarEpoch,
          accountId: ACCOUNT_A,
        }),
      }),
    );
    expect(listener).toHaveBeenLastCalledWith({
      phase: "pending",
      epoch: "invalid-persisted-deletion-cleanup",
      accountId: null,
    });
    expect(getAccountDeletionControlState().epoch).toBe(
      "invalid-persisted-deletion-cleanup",
    );

    window.localStorage.removeItem(damagedKey);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: damagedKey,
        oldValue: "{not-json",
        newValue: null,
      }),
    );
    expect(listener).toHaveBeenLastCalledWith({
      phase: "pending",
      epoch: scalarEpoch,
      accountId: ACCOUNT_A,
    });
  });

  it("never gives a sibling caller an active deletion epoch or lets its failed acquisition cancel the owner", () => {
    const epoch = beginAccountDeletion(ACCOUNT_A);

    expect(epoch).not.toBeNull();
    const siblingEpoch = beginAccountDeletion(ACCOUNT_A);
    expect(siblingEpoch).toBeNull();
    expect(beginAccountDeletion(ACCOUNT_B)).toBeNull();
    expect(
      cancelAccountDeletion(
        siblingEpoch ?? "unacquired-sibling-deletion-epoch",
      ),
    ).toBe(false);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch,
      accountId: ACCOUNT_A,
    });
  });

  it("refuses a durable sibling request even when this tab missed its storage event and cached idle", () => {
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    const siblingEpoch =
      "sibling-request-epoch-11111111-1111-4111-8111-111111111111";
    window.localStorage.setItem(
      ACCOUNT_DELETION_CONTROL_KEY,
      JSON.stringify({
        version: 2,
        generation: 1,
        phase: "pending",
        epoch: siblingEpoch,
        accountId: ACCOUNT_A,
        createdAt: Date.now(),
        expiresAt: null,
      }),
    );

    expect(beginAccountDeletion(ACCOUNT_A)).toBeNull();
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: siblingEpoch,
      accountId: ACCOUNT_A,
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
      ),
    ).toMatchObject({
      phase: "pending",
      epoch: siblingEpoch,
      accountId: ACCOUNT_A,
    });
  });

  it("refuses to wrap the persisted deletion generation", () => {
    const createdAt = Date.now();
    const persisted = JSON.stringify({
      version: 2,
      generation: Number.MAX_SAFE_INTEGER,
      phase: "released",
      epoch: "maximum-generation-epoch",
      accountId: ACCOUNT_A,
      createdAt,
      expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
    });
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, persisted);

    expect(beginAccountDeletion(ACCOUNT_A)).toBeNull();
    expect(window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY)).toBe(
      persisted,
    );
  });

  it("refuses to promote a stale same-account epoch after another request wins", async () => {
    const losingEpoch = beginAccountDeletion(ACCOUNT_A)!;
    const electedEpoch = "zzzzzzzz-zzzz-4zzz-8zzz-zzzzzzzzzzzz";

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          version: 1,
          generation: 1,
          phase: "pending",
          epoch: electedEpoch,
          accountId: ACCOUNT_A,
        }),
      }),
    );
    expect(getAccountDeletionControlState().epoch).toBe(electedEpoch);

    expect(await confirmUnderLock(losingEpoch, ACCOUNT_A)).toBe(false);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: electedEpoch,
      accountId: ACCOUNT_A,
    });
  });

  it("persists one account's cleanup without overwriting another account's concurrent deletion marker", async () => {
    const epochA = beginAccountDeletion(ACCOUNT_A)!;
    const listener = vi.fn();
    const unsubscribe = subscribeAccountDeletionControl(listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          version: 1,
          generation: 1,
          phase: "pending",
          epoch: "zzzzzzzz-zzzz-4zzz-8zzz-zzzzzzzzzzzz",
          accountId: ACCOUNT_B,
        }),
      }),
    );

    expect(await confirmUnderLock(epochA, ACCOUNT_A)).toBe(true);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "pending",
      epoch: "zzzzzzzz-zzzz-4zzz-8zzz-zzzzzzzzzzzz",
      accountId: ACCOUNT_B,
    });
    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup",
      epoch: epochA,
      accountId: ACCOUNT_A,
    });
    expect(listener).toHaveBeenLastCalledWith({
      phase: "pending",
      epoch: "zzzzzzzz-zzzz-4zzz-8zzz-zzzzzzzzzzzz",
      accountId: ACCOUNT_B,
    });
    const cleanup = JSON.parse(
      window.localStorage.getItem(
        `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`,
      ) ?? "",
    ) as {
      createdAt: number;
      expiresAt: number;
    } & Record<string, unknown>;
    expect(cleanup).toEqual({
      version: 2,
      epoch: epochA,
      accountId: ACCOUNT_A,
      createdAt: expect.any(Number),
      expiresAt: expect.any(Number),
    });
    expect(cleanup.expiresAt - cleanup.createdAt).toBe(
      ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY) ?? "",
      ).generation,
    ).toBe(1);
    unsubscribe();
  });

  it("serializes pending, confirmed, and cleanup announcements for every subscriber", async () => {
    const first: string[] = [];
    const second: string[] = [];
    const unsubscribeFirst = subscribeAccountDeletionControl((state) => {
      if (state.phase === "idle") return;
      first.push(state.phase);
    });
    const unsubscribeSecond = subscribeAccountDeletionControl((state) => {
      if (state.phase !== "idle") second.push(state.phase);
    });

    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);

    expect(first).toEqual(["pending", "confirmed", "cleanup"]);
    expect(second).toEqual(["pending", "confirmed", "cleanup"]);
    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("actively expires released scalar and cleanup markers across the browser timer limit", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;

    await vi.advanceTimersByTimeAsync(ACCOUNT_DELETION_TOMBSTONE_TTL_MS);

    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(window.localStorage.getItem(cleanupKey)).toBeNull();
    expect(listener).toHaveBeenLastCalledWith({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
  });

  it("retries physical expiry after temporary storage removal failure", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    subscribeAccountDeletionControl(() => {});
    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(await releaseConfirmedAccountDeletion(epoch)).toBe(true);
    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeRemoveItem = storagePrototype.removeItem;
    const removeSpy = vi
      .spyOn(storagePrototype, "removeItem")
      .mockImplementation(function (this: Storage, key) {
        if (key === ACCOUNT_DELETION_CONTROL_KEY || key === cleanupKey) {
          return;
        }
        nativeRemoveItem.call(this, key);
      });

    await vi.advanceTimersByTimeAsync(ACCOUNT_DELETION_TOMBSTONE_TTL_MS);
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).not.toBeNull();
    expect(window.localStorage.getItem(cleanupKey)).not.toBeNull();

    removeSpy.mockRestore();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(window.localStorage.getItem(cleanupKey)).toBeNull();
  });

  it("actively expires the finite recovery notice without weakening the cutover", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    vi.setSystemTime(createdAt);
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 2,
        epoch: "durable-cutover-epoch",
        phase: "ready",
      }),
    );
    window.localStorage.setItem(
      ACCOUNT_DELETION_RECOVERY_KEY,
      JSON.stringify({
        version: 1,
        epoch: "recovery-notice-epoch",
        createdAt,
        expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
      }),
    );
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);

    await vi.advanceTimersByTimeAsync(ACCOUNT_DELETION_TOMBSTONE_TTL_MS);

    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY),
    ).toBeNull();
    expect(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY),
    ).not.toBeNull();
    expect(listener).toHaveBeenLastCalledWith({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
  });

  it("accepts a recovery marker after bounded clock rollback and preserves its original expiry", async () => {
    vi.useFakeTimers();
    const createdAt = Date.UTC(2026, 6, 29, 12);
    const expiresAt = createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS;
    const persisted = JSON.stringify({
      version: 1,
      epoch: "recovery-notice-epoch",
      createdAt,
      expiresAt,
    });
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 2,
        epoch: "durable-cutover-epoch",
        phase: "ready",
      }),
    );
    vi.setSystemTime(createdAt - ACCOUNT_DELETION_CLOCK_SKEW_ALLOWANCE_MS);
    window.localStorage.setItem(ACCOUNT_DELETION_RECOVERY_KEY, persisted);
    const listener = vi.fn();

    subscribeAccountDeletionControl(listener);

    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup-all",
      epoch: "recovery-notice-epoch",
      accountId: null,
    });
    expect(await recoverMalformedAccountDeletionControl()).toBe(false);
    expect(window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY)).toBe(
      persisted,
    );

    __resetAccountDeletionControlForTests();
    vi.setSystemTime(expiresAt);
    window.localStorage.setItem(ACCOUNT_DELETION_RECOVERY_KEY, persisted);
    expect(getAccountDeletionControlState()).toEqual({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY),
    ).toBeNull();
    expect(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY),
    ).not.toBeNull();
  });

  it("does not invoke a listener removed earlier in the same delivery snapshot", () => {
    const removed = vi.fn();
    let unsubscribeRemoved = () => {};
    const unsubscribeFirst = subscribeAccountDeletionControl((state) => {
      if (state.phase === "pending") unsubscribeRemoved();
    });
    unsubscribeRemoved = subscribeAccountDeletionControl(removed);
    removed.mockClear();

    beginAccountDeletion(ACCOUNT_A);

    expect(removed).not.toHaveBeenCalled();
    unsubscribeFirst();
  });

  it("durably links malformed recovery to its cutover and retries an interrupted final ready write", async () => {
    const accountLocal = `${ACCOUNT_LEARNING_STORAGE_PREFIX}account-a:progress`;
    window.localStorage.setItem(accountLocal, "private-local");
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, "{not-json");
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    listener.mockClear();

    const storagePrototype = Object.getPrototypeOf(
      window.localStorage,
    ) as Storage;
    const nativeSetItem = storagePrototype.setItem;
    let readyWrites = 0;
    vi.spyOn(storagePrototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === ACCOUNT_LEARNING_CUTOVER_KEY) {
        const candidate = JSON.parse(value) as { phase?: unknown };
        if (candidate.phase === "ready") {
          readyWrites += 1;
          if (readyWrites === 1) {
            throw new DOMException("storage denied", "QuotaExceededError");
          }
        }
      }
      nativeSetItem.call(this, key, value);
    });

    expect(await recoverMalformedAccountDeletionControl()).toBe(false);

    const recovery = JSON.parse(
      window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY) ?? "",
    ) as {
      version: number;
      epoch: string;
      cutoverEpoch: string;
    };
    expect(recovery).toMatchObject({
      version: 2,
      epoch: expect.any(String),
      cutoverEpoch: expect.any(String),
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
      ),
    ).toMatchObject({
      epoch: recovery.cutoverEpoch,
      phase: "recovery-in-progress",
    });
    expect(window.localStorage.getItem(accountLocal)).toBeNull();
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(listener).toHaveBeenCalledWith({
      phase: "cleanup-all",
      epoch: recovery.epoch,
      accountId: null,
    });

    expect(
      await resumeMalformedAccountDeletionRecovery(
        "different-recovery-epoch",
      ),
    ).toBe(false);
    expect(
      await resumeMalformedAccountDeletionRecovery(recovery.epoch),
    ).toBe(true);
    expect(readyWrites).toBe(2);
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
      ),
    ).toMatchObject({
      epoch: recovery.cutoverEpoch,
      phase: "ready",
    });
  });

  it("recovers an unidentifiable marker through a durable global cutover without deleting anonymous data", async () => {
    const accountLocal = `${ACCOUNT_LEARNING_STORAGE_PREFIX}account-a:progress`;
    const accountSession = `${ACCOUNT_LEARNING_STORAGE_PREFIX}account-b:draft`;
    window.localStorage.setItem("anonymous-progress", "keep-local");
    window.sessionStorage.setItem("anonymous-draft", "keep-session");
    window.localStorage.setItem(accountLocal, "private-local");
    window.sessionStorage.setItem(accountSession, "private-session");
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, "{not-json");
    const listener = vi.fn();
    subscribeAccountDeletionControl(listener);
    listener.mockClear();

    expect(await recoverMalformedAccountDeletionControl()).toBe(true);

    expect(window.localStorage.getItem(accountLocal)).toBeNull();
    expect(window.sessionStorage.getItem(accountSession)).toBeNull();
    expect(window.localStorage.getItem("anonymous-progress")).toBe(
      "keep-local",
    );
    expect(window.sessionStorage.getItem("anonymous-draft")).toBe(
      "keep-session",
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
      ),
    ).toMatchObject({
      version: 3,
      phase: "ready",
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_DELETION_RECOVERY_KEY) ?? "",
      ),
    ).toMatchObject({
      version: 2,
      cutoverEpoch: expect.any(String),
      createdAt: expect.any(Number),
      expiresAt: expect.any(Number),
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "cleanup-all" }),
    );
    expect(listener).toHaveBeenLastCalledWith({
      phase: "idle",
      epoch: null,
      accountId: null,
    });
  });
});
