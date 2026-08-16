import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_LEARNING_CUTOVER_KEY,
  __resetLearningOwnerForTests,
  activateAccountLearningOwner,
  activateAnonymousLearningOwner,
  beginAccountLearningCutoverRecovery,
  clearAccountLearningStorage,
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  getOwnedSessionLearningItem,
  getActiveAccountLearningCutoverEpoch,
  ownedLearningStorageKey,
  prepareAccountLearningStorage,
  removeOwnedLocalLearningItem,
  removeOwnedSessionLearningItem,
  setOwnedLocalLearningItem,
  setOwnedSessionLearningItem,
  setUnknownLearningOwner,
  rotateAccountLearningCutoverForDeletion,
} from "./browser-learning-storage";
import { withAccountDeletionOriginLock } from "./account-deletion-lock";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";
const LOCAL_KEYS = [
  "loehrning-progress-v2",
  "reader:progress:book:chapter",
  "reflect::lesson",
  "slots::lesson",
  "selfrate::lesson",
  "matrix::lesson",
  "plays::lesson",
] as const;
const SESSION_KEYS = [
  "ai-native-exercise-draft-free-response",
  "ai-native-challenge-draft-week-1",
  "ai-native-continue-dismissed",
] as const;
const originalLocalStorage = window.localStorage;
const originalSessionStorage = window.sessionStorage;

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}

type ControlledStorage = {
  readonly storage: Storage;
  readonly rawGetItem: (key: string) => string | null;
  readonly rawSetItem: (key: string, value: string) => void;
  beforeGetItem?: (key: string) => void;
  beforeSetItem?: (key: string, value: string) => void;
  beforeRemoveItem?: (key: string) => void;
};

function controlledStorage(): ControlledStorage {
  const values = new Map<string, string>();
  const control = {
    rawGetItem: (key: string) => values.get(key) ?? null,
    rawSetItem: (key: string, value: string) => {
      values.set(key, value);
    },
  } as ControlledStorage;
  Object.defineProperty(control, "storage", {
    value: {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => {
        control.beforeGetItem?.(key);
        return values.get(key) ?? null;
      },
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => {
        control.beforeRemoveItem?.(key);
        values.delete(key);
      },
      setItem: (key: string, value: string) => {
        control.beforeSetItem?.(key, value);
        values.set(key, String(value));
      },
    } satisfies Storage,
  });
  return control;
}

function accountKey(accountId: string, key: string): string {
  const derived = ownedLearningStorageKey(key, {
    kind: "account",
    accountId,
    generation: 0,
  });
  if (!derived) throw new Error("Expected an account-owned key");
  return derived;
}

type PersistedCutover = {
  readonly version: number;
  readonly lineage: string;
  readonly generation: number;
  readonly minimumGeneration: number;
  readonly epoch: string;
  readonly phase: string;
  readonly retiredAccounts: readonly {
    readonly accountHash: string;
    readonly minimumGeneration: number;
  }[];
  readonly legacyCutovers: readonly {
    readonly generation: number;
    readonly epoch: string;
  }[];
};

function readCutover(): PersistedCutover {
  return JSON.parse(
    window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
  ) as PersistedCutover;
}

function accountEnvelope(cutover: PersistedCutover, value: string): string {
  return JSON.stringify({
    version: 2,
    storageLineage: cutover.lineage,
    storageGeneration: cutover.generation,
    value,
  });
}

function seedReadyCutover(storage = window.localStorage): void {
  storage.setItem(
    ACCOUNT_LEARNING_CUTOVER_KEY,
    JSON.stringify({
      version: 3,
      lineage: "test-storage-lineage",
      generation: 1,
      minimumGeneration: 1,
      epoch: "test-cutover-epoch",
      phase: "ready",
      retiredAccounts: [],
      legacyCutovers: [],
    }),
  );
}

async function rotateUnderLock(accountId: string): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => rotateAccountLearningCutoverForDeletion(accountId, lease),
  );
  expect(result.kind).toBe("acquired");
  return result.kind === "acquired" && result.value;
}

beforeEach(async () => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: memoryStorage(),
  });
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
  __resetLearningOwnerForTests("unknown");
  expect(await prepareAccountLearningStorage()).toBe(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: originalLocalStorage,
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: originalSessionStorage,
  });
});

describe("browser learning storage ownership", () => {
  it("uses secure random bytes when randomUUID is unavailable", async () => {
    window.localStorage.removeItem(ACCOUNT_LEARNING_CUTOVER_KEY);
    let nextByte = 0x11;
    const getRandomValues = vi.fn((target: Uint8Array) => {
      target.fill(nextByte);
      nextByte += 1;
      return target;
    });
    vi.stubGlobal("crypto", { getRandomValues } as unknown as Crypto);

    expect(await prepareAccountLearningStorage()).toBe(true);
    expect(readCutover()).toMatchObject({
      epoch: "11".repeat(16),
      lineage: "12".repeat(16),
      phase: "ready",
    });
    expect(getRandomValues).toHaveBeenCalledTimes(2);
  });

  it("fails closed when secure randomness is unavailable", async () => {
    window.localStorage.removeItem(ACCOUNT_LEARNING_CUTOVER_KEY);
    vi.stubGlobal("crypto", {} as Crypto);

    expect(await prepareAccountLearningStorage()).toBe(false);
    expect(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY),
    ).toBeNull();
  });

  it("fails closed while identity is unknown", () => {
    window.localStorage.setItem(LOCAL_KEYS[0], "anonymous-local");
    window.sessionStorage.setItem(SESSION_KEYS[0], "anonymous-session");

    expect(getOwnedLocalLearningItem(LOCAL_KEYS[0])).toBeNull();
    expect(getOwnedSessionLearningItem(SESSION_KEYS[0])).toBeNull();
    expect(setOwnedLocalLearningItem(LOCAL_KEYS[1], "blocked")).toBe(false);
    expect(setOwnedSessionLearningItem(SESSION_KEYS[1], "blocked")).toBe(false);
    expect(window.localStorage.getItem(LOCAL_KEYS[1])).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEYS[1])).toBeNull();
  });

  it("keeps anonymous, account A, and account B local and session data disjoint", () => {
    activateAnonymousLearningOwner();
    for (const key of LOCAL_KEYS) {
      expect(setOwnedLocalLearningItem(key, `anonymous:${key}`)).toBe(true);
    }
    for (const key of SESSION_KEYS) {
      expect(setOwnedSessionLearningItem(key, `anonymous:${key}`)).toBe(true);
    }

    activateAccountLearningOwner(ACCOUNT_A);
    for (const key of LOCAL_KEYS) {
      expect(setOwnedLocalLearningItem(key, `a:${key}`)).toBe(true);
    }
    for (const key of SESSION_KEYS) {
      expect(setOwnedSessionLearningItem(key, `a:${key}`)).toBe(true);
    }

    setUnknownLearningOwner();
    expect(getOwnedLocalLearningItem(LOCAL_KEYS[0])).toBeNull();
    expect(getOwnedSessionLearningItem(SESSION_KEYS[0])).toBeNull();

    activateAccountLearningOwner(ACCOUNT_B);
    for (const key of LOCAL_KEYS) {
      expect(getOwnedLocalLearningItem(key)).toBeNull();
      expect(setOwnedLocalLearningItem(key, `b:${key}`)).toBe(true);
    }
    for (const key of SESSION_KEYS) {
      expect(getOwnedSessionLearningItem(key)).toBeNull();
      expect(setOwnedSessionLearningItem(key, `b:${key}`)).toBe(true);
    }

    activateAccountLearningOwner(ACCOUNT_A);
    for (const key of LOCAL_KEYS) {
      expect(getOwnedLocalLearningItem(key)).toBe(`a:${key}`);
    }
    for (const key of SESSION_KEYS) {
      expect(getOwnedSessionLearningItem(key)).toBe(`a:${key}`);
    }

    activateAnonymousLearningOwner();
    for (const key of LOCAL_KEYS) {
      expect(getOwnedLocalLearningItem(key)).toBe(`anonymous:${key}`);
    }
    for (const key of SESSION_KEYS) {
      expect(getOwnedSessionLearningItem(key)).toBe(`anonymous:${key}`);
    }
  });

  it("clears exactly the confirmed account namespace", () => {
    for (const key of LOCAL_KEYS) {
      window.localStorage.setItem(key, `anonymous:${key}`);
      window.localStorage.setItem(accountKey(ACCOUNT_A, key), `a:${key}`);
      window.localStorage.setItem(accountKey(ACCOUNT_B, key), `b:${key}`);
    }
    for (const key of SESSION_KEYS) {
      window.sessionStorage.setItem(key, `anonymous:${key}`);
      window.sessionStorage.setItem(accountKey(ACCOUNT_A, key), `a:${key}`);
      window.sessionStorage.setItem(accountKey(ACCOUNT_B, key), `b:${key}`);
    }

    clearAccountLearningStorage(ACCOUNT_A);

    for (const key of LOCAL_KEYS) {
      expect(
        window.localStorage.getItem(accountKey(ACCOUNT_A, key)),
      ).toBeNull();
      expect(window.localStorage.getItem(accountKey(ACCOUNT_B, key))).toBe(
        `b:${key}`,
      );
      expect(window.localStorage.getItem(key)).toBe(`anonymous:${key}`);
    }
    for (const key of SESSION_KEYS) {
      expect(
        window.sessionStorage.getItem(accountKey(ACCOUNT_A, key)),
      ).toBeNull();
      expect(window.sessionStorage.getItem(accountKey(ACCOUNT_B, key))).toBe(
        `b:${key}`,
      );
      expect(window.sessionStorage.getItem(key)).toBe(`anonymous:${key}`);
    }
  });

  it("rejects stale component writes and removals after an owner switch", () => {
    const accountA = activateAccountLearningOwner(ACCOUNT_A);
    setOwnedLocalLearningItem("reflect::lesson", "a-local");
    setOwnedSessionLearningItem("ai-native-exercise-draft-lesson", "a-session");

    activateAccountLearningOwner(ACCOUNT_B);
    setOwnedLocalLearningItem("reflect::lesson", "b-local");
    setOwnedSessionLearningItem("ai-native-exercise-draft-lesson", "b-session");

    expect(
      setOwnedLocalLearningItem(
        "reflect::lesson",
        "stale-a-local",
        accountA.generation,
      ),
    ).toBe(false);
    expect(
      setOwnedSessionLearningItem(
        "ai-native-exercise-draft-lesson",
        "stale-a-session",
        accountA.generation,
      ),
    ).toBe(false);
    expect(
      removeOwnedLocalLearningItem("reflect::lesson", accountA.generation),
    ).toBe(false);
    expect(
      removeOwnedSessionLearningItem(
        "ai-native-exercise-draft-lesson",
        accountA.generation,
      ),
    ).toBe(false);

    expect(getOwnedLocalLearningItem("reflect::lesson")).toBe("b-local");
    expect(getOwnedSessionLearningItem("ai-native-exercise-draft-lesson")).toBe(
      "b-session",
    );
  });

  it("retires only A's generation while preserving B and anonymous data", async () => {
    activateAnonymousLearningOwner();
    expect(setOwnedLocalLearningItem("anonymous-key", "anonymous")).toBe(true);

    activateAccountLearningOwner(ACCOUNT_A);
    expect(setOwnedLocalLearningItem("progress", "account-a")).toBe(true);
    expect(setOwnedSessionLearningItem("draft", "draft-a")).toBe(true);

    activateAccountLearningOwner(ACCOUNT_B);
    expect(setOwnedLocalLearningItem("progress", "account-b")).toBe(true);
    expect(setOwnedSessionLearningItem("draft", "draft-b")).toBe(true);
    const oldEpoch = getActiveAccountLearningCutoverEpoch();
    expect(oldEpoch).not.toBeNull();

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);
    const cutover = readCutover();
    expect(cutover).toMatchObject({ version: 3, phase: "ready" });
    expect(cutover.epoch).not.toBe(oldEpoch);

    // B's loaded context was not retired by A's deletion.
    expect(getOwnedLocalLearningItem("progress")).toBe("account-b");
    expect(setOwnedLocalLearningItem("progress", "account-b-in-flight")).toBe(
      true,
    );

    activateAccountLearningOwner(ACCOUNT_B);
    expect(getOwnedLocalLearningItem("progress")).toBe("account-b-in-flight");
    expect(getOwnedSessionLearningItem("draft")).toBe("draft-b");

    activateAccountLearningOwner(ACCOUNT_A);
    expect(getOwnedLocalLearningItem("progress")).toBeNull();
    expect(getOwnedSessionLearningItem("draft")).toBeNull();

    activateAnonymousLearningOwner();
    expect(getOwnedLocalLearningItem("anonymous-key")).toBe("anonymous");
  });

  it("does not overwrite a concurrent next-generation value when set interleaves with deletion cutover", async () => {
    const local = controlledStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: local.storage,
    });
    seedReadyCutover(local.storage);

    const result = await withAccountDeletionOriginLock(
      { ifAvailable: false },
      (lease) => {
        activateAccountLearningOwner(ACCOUNT_B);
        expect(setOwnedLocalLearningItem("progress", "before")).toBe(true);
        const target = accountKey(ACCOUNT_B, "progress");
        let targetReads = 0;
        local.beforeGetItem = (key) => {
          if (key !== target || (targetReads += 1) !== 2) return;
          expect(
            rotateAccountLearningCutoverForDeletion(ACCOUNT_A, lease),
          ).toBe(true);
          const next = readCutover();
          local.rawSetItem(
            target,
            accountEnvelope(next, "concurrent-next-generation"),
          );
        };

        expect(setOwnedLocalLearningItem("progress", "stale-write")).toBe(
          false,
        );
        local.beforeGetItem = undefined;

        expect(local.rawGetItem(target)).toBe(
          accountEnvelope(readCutover(), "concurrent-next-generation"),
        );
        activateAccountLearningOwner(ACCOUNT_B);
        expect(getOwnedLocalLearningItem("progress")).toBe(
          "concurrent-next-generation",
        );
      },
    );
    expect(result.kind).toBe("acquired");
  });

  it("does not remove a concurrent next-generation value when remove interleaves with deletion cutover", async () => {
    const local = controlledStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: local.storage,
    });
    seedReadyCutover(local.storage);

    const result = await withAccountDeletionOriginLock(
      { ifAvailable: false },
      (lease) => {
        activateAccountLearningOwner(ACCOUNT_B);
        expect(setOwnedLocalLearningItem("progress", "before")).toBe(true);
        const target = accountKey(ACCOUNT_B, "progress");
        let targetReads = 0;
        local.beforeGetItem = (key) => {
          if (key !== target || (targetReads += 1) !== 2) return;
          expect(
            rotateAccountLearningCutoverForDeletion(ACCOUNT_A, lease),
          ).toBe(true);
          const next = readCutover();
          local.rawSetItem(
            target,
            accountEnvelope(next, "concurrent-next-generation"),
          );
        };

        expect(removeOwnedLocalLearningItem("progress")).toBe(false);
        local.beforeGetItem = undefined;

        expect(local.rawGetItem(target)).toBe(
          accountEnvelope(readCutover(), "concurrent-next-generation"),
        );
        activateAccountLearningOwner(ACCOUNT_B);
        expect(getOwnedLocalLearningItem("progress")).toBe(
          "concurrent-next-generation",
        );
      },
    );
    expect(result.kind).toBe("acquired");
  });

  it("removes an exact stale write from the account retired during its set", async () => {
    const local = controlledStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: local.storage,
    });
    seedReadyCutover(local.storage);

    const result = await withAccountDeletionOriginLock(
      { ifAvailable: false },
      (lease) => {
        activateAccountLearningOwner(ACCOUNT_A);
        expect(setOwnedLocalLearningItem("progress", "private-before")).toBe(
          true,
        );
        const target = accountKey(ACCOUNT_A, "progress");
        let interrupted = false;
        local.beforeSetItem = (key) => {
          if (key !== target || interrupted) return;
          interrupted = true;
          expect(
            rotateAccountLearningCutoverForDeletion(ACCOUNT_A, lease),
          ).toBe(true);
        };

        expect(setOwnedLocalLearningItem("progress", "stale-private")).toBe(
          false,
        );
        local.beforeSetItem = undefined;

        expect(local.rawGetItem(target)).toBeNull();
        expect(readCutover()).toMatchObject({
          version: 3,
          phase: "ready",
        });
      },
    );
    expect(result.kind).toBe("acquired");
  });

  it("upgrades a legacy v1 ready marker before account access", async () => {
    const legacyEpoch = "legacy-cutover-epoch";
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 1,
        epoch: legacyEpoch,
        phase: "ready",
      }),
    );
    window.localStorage.setItem(
      accountKey(ACCOUNT_B, "progress"),
      JSON.stringify({
        version: 1,
        cutoverEpoch: legacyEpoch,
        value: "legacy-account-b",
      }),
    );

    expect(await prepareAccountLearningStorage()).toBe(true);
    activateAccountLearningOwner(ACCOUNT_B);

    expect(readCutover()).toMatchObject({
      version: 3,
      generation: 1,
      phase: "ready",
    });
    expect(getOwnedLocalLearningItem("progress")).toBe("legacy-account-b");
  });

  it("migrates raw account values before normalizing a ready v1 marker", async () => {
    const legacyEpoch = "legacy-raw-cutover-epoch";
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 1,
        epoch: legacyEpoch,
        phase: "ready",
      }),
    );
    window.localStorage.setItem(
      accountKey(ACCOUNT_A, "progress"),
      "raw-local-progress",
    );
    window.sessionStorage.setItem(
      accountKey(ACCOUNT_A, "draft"),
      "raw-session-draft",
    );

    expect(await prepareAccountLearningStorage()).toBe(true);
    activateAccountLearningOwner(ACCOUNT_A);

    expect(getOwnedLocalLearningItem("progress")).toBe("raw-local-progress");
    expect(getOwnedSessionLearningItem("draft")).toBe("raw-session-draft");
    expect(readCutover()).toMatchObject({
      version: 3,
      lineage: legacyEpoch,
      phase: "ready",
    });
  });

  it("normalizes a maximum-length v1 epoch without producing an invalid lineage", async () => {
    const legacyEpoch = "x".repeat(200);
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 1,
        epoch: legacyEpoch,
        phase: "ready",
      }),
    );

    expect(await prepareAccountLearningStorage()).toBe(true);
    expect(readCutover()).toMatchObject({
      version: 3,
      lineage: legacyEpoch,
      epoch: legacyEpoch,
      phase: "ready",
    });
  });

  it("resumes an interrupted deletion rotation under the same lock protocol", async () => {
    activateAccountLearningOwner(ACCOUNT_A);
    expect(setOwnedLocalLearningItem("progress", "private-local")).toBe(true);
    expect(setOwnedSessionLearningItem("draft", "private-session")).toBe(true);
    const nativeSetItem = window.localStorage.setItem.bind(window.localStorage);
    let deniedReady = false;
    vi.spyOn(window.localStorage, "setItem").mockImplementation(
      (key, value) => {
        if (key === ACCOUNT_LEARNING_CUTOVER_KEY) {
          const candidate = JSON.parse(value) as { phase?: unknown };
          if (candidate.phase === "ready" && !deniedReady) {
            deniedReady = true;
            throw new DOMException("interrupted", "QuotaExceededError");
          }
        }
        nativeSetItem(key, value);
      },
    );

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(false);
    expect(readCutover().phase).toBe("recovery-in-progress");
    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);

    expect(readCutover().phase).toBe("ready");
    expect(
      window.localStorage.getItem(accountKey(ACCOUNT_A, "progress")),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem(accountKey(ACCOUNT_A, "draft")),
    ).toBeNull();
  });

  it("falls back to a global floor at retirement capacity and keeps replay idempotent", async () => {
    const retiredAccounts = Array.from({ length: 128 }, (_, index) => ({
      accountId: `retired-${index}`,
      minimumGeneration: index + 1,
    }));
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 2,
        lineage: "bounded-retirement-lineage",
        generation: 128,
        minimumGeneration: 1,
        epoch: "bounded-retirement-epoch",
        phase: "ready",
        retiredAccounts,
        legacyCutovers: [{ generation: 1, epoch: "legacy-cutover-epoch" }],
      }),
    );
    window.localStorage.setItem(
      accountKey(ACCOUNT_B, "progress"),
      accountEnvelope(readCutover(), "account-b"),
    );
    window.localStorage.setItem("anonymous-progress", "keep");

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);
    const rotated = readCutover();
    expect(rotated).toMatchObject({
      generation: 129,
      minimumGeneration: 129,
      phase: "ready",
      legacyCutovers: [],
      retiredAccounts: [
        {
          accountHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          minimumGeneration: 129,
        },
      ],
    });
    expect(
      window.localStorage.getItem(accountKey(ACCOUNT_B, "progress")),
    ).toBeNull();
    expect(window.localStorage.getItem("anonymous-progress")).toBe("keep");

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);
    expect(readCutover().generation).toBe(129);
  });

  it("resets bounded retirement metadata during global malformed recovery and refuses generation wrap", async () => {
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 2,
        lineage: "global-recovery-lineage",
        generation: 8,
        minimumGeneration: 1,
        epoch: "global-recovery-epoch",
        phase: "ready",
        retiredAccounts: [{ accountId: ACCOUNT_A, minimumGeneration: 7 }],
        legacyCutovers: [{ generation: 1, epoch: "legacy-cutover-epoch" }],
      }),
    );
    const recovery = await withAccountDeletionOriginLock(
      { ifAvailable: false },
      (lease) => beginAccountLearningCutoverRecovery(lease),
    );
    expect(recovery.kind).toBe("acquired");
    expect(readCutover()).toMatchObject({
      generation: 9,
      minimumGeneration: 9,
      phase: "recovery-in-progress",
      retiredAccounts: [],
      legacyCutovers: [],
    });

    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 2,
        lineage: "generation-limit-lineage",
        generation: Number.MAX_SAFE_INTEGER,
        minimumGeneration: 1,
        epoch: "generation-limit-epoch",
        phase: "ready",
        retiredAccounts: [],
        legacyCutovers: [],
      }),
    );
    expect(await rotateUnderLock(ACCOUNT_A)).toBe(false);
    const refusedRecovery = await withAccountDeletionOriginLock(
      { ifAvailable: false },
      (lease) => beginAccountLearningCutoverRecovery(lease),
    );
    expect(refusedRecovery).toEqual({ kind: "acquired", value: null });
    expect(readCutover().generation).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("treats a malformed cutover as a fail-closed owner boundary", () => {
    window.localStorage.setItem(ACCOUNT_LEARNING_CUTOVER_KEY, "{not-json");

    const owner = activateAccountLearningOwner(ACCOUNT_A);

    expect(owner.kind).toBe("unknown");
    expect(setOwnedLocalLearningItem("progress", "blocked")).toBe(false);
    expect(
      window.localStorage.getItem(accountKey(ACCOUNT_A, "progress")),
    ).toBeNull();
  });

  it("returns false and preserves the value when durable removal is denied", () => {
    activateAnonymousLearningOwner();
    expect(setOwnedLocalLearningItem("mission", "complete")).toBe(true);
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("storage denied");
    });

    expect(
      removeOwnedLocalLearningItem(
        "mission",
        getLearningOwnerContext().generation,
      ),
    ).toBe(false);
    expect(getOwnedLocalLearningItem("mission")).toBe("complete");
  });

  it("returns true when an owner-scoped value is already absent", () => {
    activateAnonymousLearningOwner();
    expect(
      removeOwnedLocalLearningItem(
        "missing",
        getLearningOwnerContext().generation,
      ),
    ).toBe(true);
  });
});
