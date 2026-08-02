import { createElement } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock, hasSupabasePublicConfigMock } = vi.hoisted(
  () => ({
    createBrowserClientMock: vi.fn(),
    hasSupabasePublicConfigMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: createBrowserClientMock,
}));

vi.mock("@/lib/supabase/config", () => ({
  hasSupabasePublicConfig: hasSupabasePublicConfigMock,
}));

import {
  saveRemoteProgress,
  UserProgressSyncRuntime,
} from "./user-progress-sync-runtime";
import type { UnifiedProgress } from "@/lib/progress/types";
import {
  __resetCacheForTests,
  activateAccountProgress,
  activateAnonymousProgress,
  getAccountProgressStorageKey,
  getUnifiedState,
  replaceUnifiedState,
} from "@/lib/progress/store";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";
import {
  ACCOUNT_LEARNING_CUTOVER_KEY,
  getLearningOwnerContext,
  ownedLearningStorageKey,
  prepareAccountLearningStorage,
  rotateAccountLearningCutoverForDeletion,
} from "@/lib/progress/browser-learning-storage";
import {
  ACCOUNT_DELETION_CLEANUP_KEY_PREFIX,
  ACCOUNT_DELETION_CONTROL_KEY,
  ACCOUNT_DELETION_RECOVERY_KEY,
  ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
  __resetAccountDeletionControlForTests,
  beginAccountDeletion,
  cancelAccountDeletion,
  confirmAccountDeletion,
  getAccountDeletionControlState,
} from "@/lib/progress/account-deletion-control";
import { withAccountDeletionOriginLock } from "@/lib/progress/account-deletion-lock";
import {
  __resetProgressSyncFailureForTests,
  getProgressSyncFailure,
} from "@/lib/progress/sync-status";

const progress: UnifiedProgress = {
  schemaVersion: 3,
  courses: {},
  xp: 0,
  checkpoints: {},
  badges: {},
  streak: { days: 0, last: null },
  lastActivity: "2026-07-28T00:00:00.000Z",
};
const ACCOUNT_A = "learner-1";
const ACCOUNT_B = "learner-2";

function seedAccountProgress(accountId: string, state: UnifiedProgress): void {
  activateAccountProgress(accountId);
  replaceUnifiedState(state);
  activateAnonymousProgress();
}

function expectPrivateProgress(state: UnifiedProgress): void {
  expect(state).toMatchObject({
    xp: 125,
    checkpoints: { "private-learning-checkpoint": true },
  });
}

function readStoredAccountPayload(key: string): string | null {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown;
      value?: unknown;
    };
    return (parsed.version === 1 || parsed.version === 2) &&
      typeof parsed.value === "string"
      ? parsed.value
      : raw;
  } catch {
    return raw;
  }
}

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

let previousLocalStorage: Storage;
let previousSessionStorage: Storage;

function installDeterministicStorage(): void {
  previousLocalStorage = window.localStorage;
  previousSessionStorage = window.sessionStorage;
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: memoryStorage(),
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

async function rotateUnderLock(accountId: string): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => rotateAccountLearningCutoverForDeletion(accountId, lease),
  );
  expect(result.kind).toBe("acquired");
  return result.kind === "acquired" && result.value;
}

beforeEach(async () => {
  createBrowserClientMock.mockReset();
  hasSupabasePublicConfigMock.mockReset();
  hasSupabasePublicConfigMock.mockReturnValue(true);
  installDeterministicStorage();
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
  __resetCacheForTests();
  __resetAccountDeletionControlForTests();
  __resetProgressSyncFailureForTests();
  expect(await prepareAccountLearningStorage()).toBe(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: previousLocalStorage,
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: previousSessionStorage,
  });
});

describe("progress sync response policy", () => {
  it.each([400, 401, 403, 404, 413, 422])(
    "stops retrying permanent HTTP %s responses",
    async (status) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("{}", {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await expect(saveRemoteProgress(ACCOUNT_A, progress)).resolves.toEqual({
        kind: "permanent",
      });
    },
  );

  it("respects Retry-After for rate limiting", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "7",
        },
      }),
    );
    await expect(saveRemoteProgress(ACCOUNT_A, progress)).resolves.toEqual({
      kind: "retry",
      retryAfterMs: 7_000,
    });
  });

  it("retries transient server failures and accepts valid success payloads", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(Response.json({ progress }, { status: 200 }));

    await expect(saveRemoteProgress(ACCOUNT_A, progress)).resolves.toEqual({
      kind: "retry",
    });
    await expect(saveRemoteProgress(ACCOUNT_A, progress)).resolves.toEqual({
      kind: "saved",
      progress,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a server-detected account switch as permanent for that write", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ error: "progress_owner_mismatch" }, { status: 409 }),
      );

    await expect(saveRemoteProgress(ACCOUNT_A, progress)).resolves.toEqual({
      kind: "permanent",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      expectedOwnerId: ACCOUNT_A,
      progress,
    });
  });
});

const UserProgressSync = UserProgressSyncRuntime;

describe("<UserProgressSync>", () => {
  const learnerProgress: UnifiedProgress = {
    ...progress,
    xp: 125,
    checkpoints: { "private-learning-checkpoint": true },
  };

  it("does not load the provider client when public Supabase config is absent", async () => {
    hasSupabasePublicConfigMock.mockReturnValue(false);
    replaceUnifiedState(learnerProgress);
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(createElement(UserProgressSync));
    await Promise.resolve();

    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUnifiedState()).toEqual(learnerProgress);
  });

  it("preserves and uploads local progress when the initial remote read fails", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(
        new Error("private-learning-checkpoint provider-secret"),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: learnerProgress }, { status: 200 }),
      );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(createElement(UserProgressSync));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const putCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PUT",
    );
    expect(putCall).toBeDefined();
    const putBody = JSON.parse(String(putCall?.[1]?.body)) as {
      expectedOwnerId: string;
      progress: UnifiedProgress;
    };
    expect(putBody.expectedOwnerId).toBe(ACCOUNT_A);
    expectPrivateProgress(putBody.progress);
    expectPrivateProgress(getUnifiedState());
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("never merges a remote read labeled for another authenticated owner", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: ACCOUNT_A } },
          error: null,
        }),
      },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const accountBProgress: UnifiedProgress = {
      ...progress,
      xp: 999,
      checkpoints: { "account-b-checkpoint": true },
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_B, progress: accountBProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: learnerProgress }, { status: 200 }),
      );

    render(createElement(UserProgressSync));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expectPrivateProgress(getUnifiedState());
    expect(getUnifiedState().checkpoints).not.toHaveProperty(
      "account-b-checkpoint",
    );
    const putBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)) as {
      expectedOwnerId: string;
      progress: UnifiedProgress;
    };
    expect(putBody.expectedOwnerId).toBe(ACCOUNT_A);
    expect(putBody.progress.checkpoints).not.toHaveProperty(
      "account-b-checkpoint",
    );
  });

  it("keeps anonymous progress stored but inaccessible when the Supabase client cannot start", async () => {
    createBrowserClientMock.mockImplementation(() => {
      throw new Error("provider-url-with-secret");
    });
    replaceUnifiedState(learnerProgress);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(createElement(UserProgressSync));

    await waitFor(() =>
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(
      JSON.parse(window.localStorage.getItem(UNIFIED_STORAGE_KEY) ?? "null"),
    ).toEqual(learnerProgress);
    expect(getUnifiedState().checkpoints).not.toHaveProperty(
      "private-learning-checkpoint",
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("never applies a deferred remote GET after deletion pauses sync, then resumes with intact local data after definite failure", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    let resolveGet!: (response: Response) => void;
    const deferredGet = new Promise<Response>((resolve) => {
      resolveGet = resolve;
    });
    const remoteProgress: UnifiedProgress = {
      ...learnerProgress,
      xp: 999,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(deferredGet)
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_A, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: learnerProgress }, { status: 200 }),
      );

    render(createElement(UserProgressSync));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    resolveGet(
      Response.json(
        { ownerId: ACCOUNT_A, progress: remoteProgress },
        { status: 200 },
      ),
    );
    await Promise.resolve();
    await Promise.resolve();

    expectPrivateProgress(getUnifiedState());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(cancelAccountDeletion(epoch)).toBe(true);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const resumedPut = fetchMock.mock.calls[2];
    expect(resumedPut[1]?.method).toBe("PUT");
    expect(
      (
        JSON.parse(String(resumedPut[1]?.body)) as {
          progress: UnifiedProgress;
        }
      ).progress,
    ).toMatchObject({
      xp: learnerProgress.xp,
      checkpoints: learnerProgress.checkpoints,
    });
  });

  it("discards a deferred PUT response and clears browser learning data only after deletion is confirmed", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    replaceUnifiedState({
      ...progress,
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    let resolvePut!: (response: Response) => void;
    const deferredPut = new Promise<Response>((resolve) => {
      resolvePut = resolve;
    });
    const remoteProgress: UnifiedProgress = {
      ...learnerProgress,
      xp: 999,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_A, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockReturnValueOnce(deferredPut);

    render(createElement(UserProgressSync));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");

    const epoch = beginAccountDeletion(ACCOUNT_A)!;
    resolvePut(Response.json({ progress: remoteProgress }, { status: 200 }));
    await Promise.resolve();
    await Promise.resolve();

    expectPrivateProgress(getUnifiedState());
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).not.toBeNull();

    expect(await confirmUnderLock(epoch, ACCOUNT_A)).toBe(true);
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(UNIFIED_STORAGE_KEY) ?? "null"),
    ).toMatchObject({
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    });
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requires a successful authoritative GET after malformed-marker recovery and never uploads the scrubbed state", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, "{not-json");
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: ACCOUNT_A } },
          error: null,
        }),
      },
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));

    render(createElement(UserProgressSync));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "PUT"),
    ).toBe(false);
    expect(getLearningOwnerContext().kind).toBe("unknown");
  });

  it("accepts an owner-bound empty authoritative state and bootstraps a new account after malformed recovery", async () => {
    const anonymousProgress: UnifiedProgress = {
      ...progress,
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    };
    replaceUnifiedState(anonymousProgress);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, "{not-json");
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: ACCOUNT_A } },
          error: null,
        }),
      },
    });
    const bootstrapWrites: Array<{
      expectedOwnerId: string;
      progress: UnifiedProgress;
    }> = [];
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_input, init) => {
        if (init?.method === "PUT") {
          const request = JSON.parse(String(init.body)) as {
            expectedOwnerId: string;
            progress: UnifiedProgress;
          };
          bootstrapWrites.push(request);
          return Response.json({ progress: request.progress }, { status: 200 });
        }
        return Response.json(
          { ownerId: ACCOUNT_A, progress: null },
          { status: 200 },
        );
      });

    render(createElement(UserProgressSync));

    await waitFor(() => expect(bootstrapWrites).toHaveLength(1));
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(bootstrapWrites[0]).toMatchObject({
      expectedOwnerId: ACCOUNT_A,
      progress: {
        schemaVersion: 3,
        courses: {},
        xp: 0,
        checkpoints: {},
        badges: {},
        streak: { days: 1 },
      },
    });
    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: ACCOUNT_A,
    });
    expect(getUnifiedState()).toEqual(bootstrapWrites[0].progress);
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).not.toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(UNIFIED_STORAGE_KEY) ?? "null"),
    ).toMatchObject({
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    });
  });

  it("does not let the scalar idle replay unpause a tab whose recovery scrub failed", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const sessionKey = ownedLearningStorageKey("private-draft", {
      kind: "account",
      accountId: ACCOUNT_A,
      generation: 0,
    })!;
    window.sessionStorage.setItem(sessionKey, "private");
    const priorCutover = JSON.parse(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
    ) as { generation: number };
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: priorCutover.generation + 1,
        epoch: "recovery-cutover-epoch",
        phase: "ready",
      }),
    );
    const createdAt = Date.now();
    window.localStorage.setItem(
      ACCOUNT_DELETION_RECOVERY_KEY,
      JSON.stringify({
        version: 1,
        epoch: "recovery-notice-epoch",
        createdAt,
        expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
      }),
    );
    vi.spyOn(window.sessionStorage, "removeItem").mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(createElement(UserProgressSync));
    await act(async () => {
      await Promise.resolve();
    });

    expect(window.sessionStorage.getItem(sessionKey)).toBe("private");
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(createBrowserClientMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("coalesces a pageshow received during malformed-marker recovery into one deferred retry", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const accountKey = getAccountProgressStorageKey(ACCOUNT_A);
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, "{not-json");
    const nativeSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    let recoveryWrites = 0;
    vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === ACCOUNT_LEARNING_CUTOVER_KEY) {
        const candidate = JSON.parse(value) as { phase?: unknown };
        if (candidate.phase === "recovery-in-progress") {
          recoveryWrites += 1;
          if (recoveryWrites === 1) {
            throw new DOMException("storage denied", "QuotaExceededError");
          }
        }
      }
      nativeSetItem(key, value);
    });
    let releaseFirstLock!: () => void;
    let lockRequests = 0;
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          (
            name: string,
            _options: LockOptions,
            callback: (lock: Lock | null) => unknown,
          ) => {
            lockRequests += 1;
            const run = () =>
              callback({ name, mode: "exclusive" } as Lock);
            if (lockRequests === 1) {
              return new Promise((resolve) => {
                releaseFirstLock = () => resolve(run());
              });
            }
            return Promise.resolve(run());
          },
        ),
      },
    });
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(createElement(UserProgressSync));
    await waitFor(() => expect(lockRequests).toBe(1));
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
      releaseFirstLock();
    });

    await waitFor(() => expect(recoveryWrites).toBe(2));
    expect(recoveryWrites).toBe(2);
    // Two malformed-recovery attempts plus the required cleanup-all replay.
    expect(lockRequests).toBe(3);
    expect(window.localStorage.getItem(accountKey)).toBeNull();
    expect(
      window.localStorage.getItem(ACCOUNT_DELETION_CONTROL_KEY),
    ).toBeNull();
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("coalesces pageshow during recovery finalization into one retry and acknowledges the durable notice", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const accountKey = getAccountProgressStorageKey(ACCOUNT_A);
    const cutoverEpoch = "recovery-cutover-epoch";
    const recoveryEpoch = "recovery-notice-epoch";
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 1,
        generation: 2,
        epoch: cutoverEpoch,
        phase: "recovery-in-progress",
      }),
    );
    const createdAt = Date.now();
    window.localStorage.setItem(
      ACCOUNT_DELETION_RECOVERY_KEY,
      JSON.stringify({
        version: 2,
        epoch: recoveryEpoch,
        cutoverEpoch,
        createdAt,
        expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
      }),
    );

    const nativeSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    let readyWrites = 0;
    vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === ACCOUNT_LEARNING_CUTOVER_KEY) {
        const candidate = JSON.parse(value) as { phase?: unknown };
        if (candidate.phase === "ready") {
          readyWrites += 1;
          if (readyWrites === 1) {
            throw new DOMException("storage denied", "QuotaExceededError");
          }
        }
      }
      nativeSetItem(key, value);
    });
    let releaseFirstLock!: () => void;
    let lockRequests = 0;
    Object.defineProperty(window.navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          (
            name: string,
            _options: LockOptions,
            callback: (lock: Lock | null) => unknown,
          ) => {
            lockRequests += 1;
            const run = () =>
              callback({ name, mode: "exclusive" } as Lock);
            if (lockRequests === 1) {
              return new Promise((resolve) => {
                releaseFirstLock = () => resolve(run());
              });
            }
            return Promise.resolve(run());
          },
        ),
      },
    });
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(createElement(UserProgressSync));
    await waitFor(() => expect(lockRequests).toBe(1));
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
      releaseFirstLock();
    });

    await waitFor(() =>
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1),
    );
    expect(readyWrites).toBe(2);
    expect(lockRequests).toBe(2);
    expect(window.localStorage.getItem(accountKey)).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
      ),
    ).toMatchObject({
      epoch: cutoverEpoch,
      phase: "ready",
    });
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(readyWrites).toBe(2);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });

  it("discovers and replays a cleanup-all ledger missed by storage events on pageshow", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const accountKey = getAccountProgressStorageKey(ACCOUNT_A);
    const getUserMock = vi.fn().mockReturnValue(new Promise(() => {}));
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(createElement(UserProgressSync));
    await waitFor(() =>
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1),
    );

    const prior = JSON.parse(
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
    ) as {
      lineage: string;
      generation: number;
    };
    const generation = prior.generation + 1;
    const cutoverEpoch = "missed-storage-cutover-epoch";
    const recoveryEpoch = "missed-storage-recovery-epoch";
    window.localStorage.setItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
      JSON.stringify({
        version: 2,
        lineage: prior.lineage,
        generation,
        minimumGeneration: generation,
        epoch: cutoverEpoch,
        phase: "recovery-in-progress",
        retiredAccounts: [],
        legacyCutovers: [],
      }),
    );
    const createdAt = Date.now();
    window.localStorage.setItem(
      ACCOUNT_DELETION_RECOVERY_KEY,
      JSON.stringify({
        version: 2,
        epoch: recoveryEpoch,
        cutoverEpoch,
        createdAt,
        expiresAt: createdAt + ACCOUNT_DELETION_TOMBSTONE_TTL_MS,
      }),
    );
    expect(window.localStorage.getItem(accountKey)).not.toBeNull();

    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });

    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) ?? "",
        ),
      ).toMatchObject({
        epoch: cutoverEpoch,
        phase: "ready",
      }),
    );
    expect(window.localStorage.getItem(accountKey)).toBeNull();
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(getUserMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty authoritative GET labeled for another owner after a deletion cutover", async () => {
    seedAccountProgress(ACCOUNT_B, learnerProgress);
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: ACCOUNT_B } },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_B, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: learnerProgress }, { status: 200 }),
      )
      .mockResolvedValue(
        Response.json(
          { ownerId: ACCOUNT_A, progress: null },
          { status: 200 },
        ),
      );

    render(createElement(UserProgressSync));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);
    const cutoverValue = window.localStorage.getItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_LEARNING_CUTOVER_KEY,
        newValue: cutoverValue,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][1]?.method).toBeUndefined();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT"),
    ).toHaveLength(1);
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(getUserMock).toHaveBeenCalledTimes(2);
  });

  it("accepts an empty authoritative state after another account's deletion cutover without losing the active owner", async () => {
    seedAccountProgress(ACCOUNT_B, learnerProgress);
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: ACCOUNT_B } },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
    let getCount = 0;
    const writes: Array<{
      expectedOwnerId: string;
      progress: UnifiedProgress;
    }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        const request = JSON.parse(String(init.body)) as {
          expectedOwnerId: string;
          progress: UnifiedProgress;
        };
        writes.push(request);
        return Response.json({ progress: request.progress }, { status: 200 });
      }
      getCount += 1;
      return Response.json(
        {
          ownerId: ACCOUNT_B,
          progress: getCount === 1 ? learnerProgress : null,
        },
        { status: 200 },
      );
    });

    render(createElement(UserProgressSync));
    await waitFor(() => expect(writes).toHaveLength(1));

    expect(await rotateUnderLock(ACCOUNT_A)).toBe(true);
    const cutoverValue = window.localStorage.getItem(
      ACCOUNT_LEARNING_CUTOVER_KEY,
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_LEARNING_CUTOVER_KEY,
        newValue: cutoverValue,
      }),
    );

    await waitFor(() => {
      expect(getCount).toBe(2);
      expect(writes).toHaveLength(2);
    });
    expect(getUserMock).toHaveBeenCalledTimes(2);
    expect(writes[1].expectedOwnerId).toBe(ACCOUNT_B);
    expectPrivateProgress(writes[1].progress);
    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: ACCOUNT_B,
    });
    expectPrivateProgress(getUnifiedState());

    const cutover = JSON.parse(cutoverValue ?? "null") as {
      lineage: string;
      generation: number;
    };
    const stored = JSON.parse(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_B)) ??
        "null",
    ) as {
      storageLineage: string;
      storageGeneration: number;
      value: string;
    };
    expect(stored).toMatchObject({
      storageLineage: cutover.lineage,
      storageGeneration: cutover.generation,
    });
    expectPrivateProgress(JSON.parse(stored.value) as UnifiedProgress);
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
  });

  it("clears local learning data when another tab broadcasts confirmed deletion", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    replaceUnifiedState({
      ...progress,
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>(() => {}),
    );
    render(createElement(UserProgressSync));
    await waitFor(() =>
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1),
    );

    const epoch = "22222222-2222-4222-8222-222222222222";
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          version: 1,
          generation: 1,
          phase: "confirmed",
          epoch,
          accountId: ACCOUNT_A,
        }),
      }),
    );

    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(UNIFIED_STORAGE_KEY) ?? "null"),
    ).toMatchObject({
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    });
  });

  it("retries a transient confirmed-release failure on pageshow without touching another account", async () => {
    const accountBProgress: UnifiedProgress = {
      ...progress,
      xp: 240,
      checkpoints: { "account-b-checkpoint": true },
    };
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    seedAccountProgress(ACCOUNT_B, accountBProgress);
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>(() => {}),
    );
    render(createElement(UserProgressSync));
    await waitFor(() =>
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1),
    );

    const cleanupKey = `${ACCOUNT_DELETION_CLEANUP_KEY_PREFIX}${encodeURIComponent(ACCOUNT_A)}`;
    const nativeSetItem = window.localStorage.setItem.bind(
      window.localStorage,
    );
    let cleanupWrites = 0;
    vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === cleanupKey) {
        cleanupWrites += 1;
        if (cleanupWrites === 1) {
          throw new DOMException("storage denied", "QuotaExceededError");
        }
      }
      nativeSetItem(key, value);
    });

    const epoch = "25252525-2525-4252-8252-252525252525";
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: ACCOUNT_DELETION_CONTROL_KEY,
          newValue: JSON.stringify({
            version: 1,
            generation: 1,
            phase: "confirmed",
            epoch,
            accountId: ACCOUNT_A,
          }),
        }),
      );
    });

    expect(getAccountDeletionControlState()).toEqual({
      phase: "confirmed",
      epoch,
      accountId: ACCOUNT_A,
    });
    expect(cleanupWrites).toBe(1);
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();

    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });

    await waitFor(() =>
      expect(getAccountDeletionControlState()).toEqual({
        phase: "cleanup",
        epoch,
        accountId: ACCOUNT_A,
      }),
    );
    expect(cleanupWrites).toBe(2);
    expect(
      JSON.parse(
        readStoredAccountPayload(getAccountProgressStorageKey(ACCOUNT_B)) ??
          "null",
      ),
    ).toMatchObject(accountBProgress);
  });

  it("releases confirmed deletion while identity verification is unresolved and ignores the stale verification", async () => {
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    let resolveStaleVerification!: (value: {
      data: { user: { id: string } };
      error: null;
    }) => void;
    const staleVerification = new Promise<{
      data: { user: { id: string } };
      error: null;
    }>((resolve) => {
      resolveStaleVerification = resolve;
    });
    const getUserMock = vi
      .fn()
      .mockReturnValueOnce(staleVerification)
      .mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(createElement(UserProgressSync));
    await waitFor(() => expect(getUserMock).toHaveBeenCalledTimes(1));

    const epoch = "33333333-3333-4333-8333-333333333333";
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCOUNT_DELETION_CONTROL_KEY,
        newValue: JSON.stringify({
          version: 1,
          generation: 1,
          phase: "confirmed",
          epoch,
          accountId: ACCOUNT_A,
        }),
      }),
    );

    await waitFor(() => expect(getUserMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(getLearningOwnerContext().kind).toBe("anonymous"),
    );
    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });

    await act(async () => {
      resolveStaleVerification({
        data: { user: { id: ACCOUNT_A } },
        error: null,
      });
      await staleVerification;
      await Promise.resolve();
    });

    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("replays a durable cleanup tombstone when a suspended tab starts later", async () => {
    const accountBProgress: UnifiedProgress = {
      ...progress,
      xp: 240,
      checkpoints: { "account-b-checkpoint": true },
    };
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    seedAccountProgress(ACCOUNT_B, accountBProgress);
    const accountASessionKey = ownedLearningStorageKey(
      "ai-native-exercise-draft-test",
      { kind: "account", accountId: ACCOUNT_A, generation: 0 },
    )!;
    const accountBSessionKey = ownedLearningStorageKey(
      "ai-native-exercise-draft-test",
      { kind: "account", accountId: ACCOUNT_B, generation: 0 },
    )!;
    window.sessionStorage.setItem(accountASessionKey, "private-a");
    window.sessionStorage.setItem(accountBSessionKey, "private-b");
    const epoch = "44444444-4444-4444-8444-444444444444";
    const tombstone = JSON.stringify({
      version: 1,
      generation: 1,
      phase: "released",
      epoch,
      accountId: ACCOUNT_A,
    });
    __resetAccountDeletionControlForTests();
    window.localStorage.setItem(ACCOUNT_DELETION_CONTROL_KEY, tombstone);
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });

    render(createElement(UserProgressSync));
    await waitFor(() =>
      expect(getLearningOwnerContext().kind).toBe("anonymous"),
    );

    expect(
      window.localStorage.getItem(getAccountProgressStorageKey(ACCOUNT_A)),
    ).toBeNull();
    expect(
      JSON.parse(
        readStoredAccountPayload(getAccountProgressStorageKey(ACCOUNT_B)) ??
          "null",
      ),
    ).toMatchObject(accountBProgress);
    expect(window.sessionStorage.getItem(accountASessionKey)).toBeNull();
    expect(window.sessionStorage.getItem(accountBSessionKey)).toBe("private-b");
    expect(getAccountDeletionControlState()).toEqual({
      phase: "cleanup",
      epoch,
      accountId: ACCOUNT_A,
    });
  });

  it("uses unknown during A to signed-out to B verification and never applies A's deferred GET to B", async () => {
    const anonymousProgress: UnifiedProgress = {
      ...progress,
      xp: 7,
      checkpoints: { "anonymous-checkpoint": true },
    };
    const accountBProgress: UnifiedProgress = {
      ...progress,
      xp: 240,
      checkpoints: { "account-b-checkpoint": true },
    };
    replaceUnifiedState(anonymousProgress);
    activateAccountProgress(ACCOUNT_A);
    replaceUnifiedState(learnerProgress);
    activateAccountProgress(ACCOUNT_B);
    replaceUnifiedState(accountBProgress);
    activateAnonymousProgress();

    let authCallback: (() => void) | null = null;
    let resolveSignedOut!: (value: {
      data: { user: null };
      error: null;
    }) => void;
    const signedOutVerification = new Promise<{
      data: { user: null };
      error: null;
    }>((resolve) => {
      resolveSignedOut = resolve;
    });
    const getUserMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: { user: { id: ACCOUNT_A } },
        error: null,
      })
      .mockReturnValueOnce(signedOutVerification)
      .mockResolvedValueOnce({
        data: { user: { id: ACCOUNT_B } },
        error: null,
      });
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
        onAuthStateChange: vi.fn((callback: () => void) => {
          authCallback = callback;
          return {
            data: { subscription: { unsubscribe: vi.fn() } },
          };
        }),
      },
    });

    let resolveAccountAGet!: (response: Response) => void;
    const accountAGet = new Promise<Response>((resolve) => {
      resolveAccountAGet = resolve;
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(accountAGet)
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_B, progress: accountBProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: accountBProgress }, { status: 200 }),
      );

    render(createElement(UserProgressSync));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: ACCOUNT_A,
    });

    await act(async () => {
      authCallback?.();
      await Promise.resolve();
    });
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(getUnifiedState().checkpoints).not.toHaveProperty(
      "private-learning-checkpoint",
    );
    expect(getUnifiedState().checkpoints).not.toHaveProperty(
      "anonymous-checkpoint",
    );

    await act(async () => {
      resolveSignedOut({ data: { user: null }, error: null });
      await signedOutVerification;
    });
    await waitFor(() =>
      expect(getLearningOwnerContext().kind).toBe("anonymous"),
    );
    expect(getUnifiedState()).toMatchObject({
      xp: anonymousProgress.xp,
      checkpoints: anonymousProgress.checkpoints,
    });

    await act(async () => {
      authCallback?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: ACCOUNT_B,
    });

    await act(async () => {
      resolveAccountAGet(
        Response.json(
          {
            progress: {
              ...learnerProgress,
              xp: 999,
              checkpoints: {
                "private-learning-checkpoint": true,
                "stale-a-response": true,
              },
            },
            ownerId: ACCOUNT_A,
          },
          { status: 200 },
        ),
      );
      await accountAGet;
      await Promise.resolve();
    });

    expect(getUnifiedState()).toMatchObject({
      xp: accountBProgress.xp,
      checkpoints: accountBProgress.checkpoints,
    });
    expect(getUnifiedState().checkpoints).not.toHaveProperty(
      "private-learning-checkpoint",
    );
    const accountBPut = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PUT",
    );
    expect(JSON.parse(String(accountBPut?.[1]?.body))).toMatchObject({
      expectedOwnerId: ACCOUNT_B,
      progress: {
        xp: accountBProgress.xp,
        checkpoints: accountBProgress.checkpoints,
      },
    });
    expect(
      JSON.parse(
        readStoredAccountPayload(getAccountProgressStorageKey(ACCOUNT_A)) ??
          "null",
      ),
    ).toMatchObject({
      xp: learnerProgress.xp,
      checkpoints: learnerProgress.checkpoints,
    });
  });

  it("aborts A's in-flight PUT before B can become the verified owner", async () => {
    const accountBProgress: UnifiedProgress = {
      ...progress,
      xp: 240,
      checkpoints: { "account-b-checkpoint": true },
    };
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    activateAccountProgress(ACCOUNT_B);
    replaceUnifiedState(accountBProgress);
    activateAnonymousProgress();

    let authCallback: (() => void) | null = null;
    const getUserMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: { user: { id: ACCOUNT_A } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { id: ACCOUNT_B } },
        error: null,
      });
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
        onAuthStateChange: vi.fn((callback: () => void) => {
          authCallback = callback;
          return {
            data: { subscription: { unsubscribe: vi.fn() } },
          };
        }),
      },
    });

    let resolveAccountAPut!: (response: Response) => void;
    const accountAPut = new Promise<Response>((resolve) => {
      resolveAccountAPut = resolve;
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_A, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockReturnValueOnce(accountAPut)
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_B, progress: accountBProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ progress: accountBProgress }, { status: 200 }),
      );

    render(createElement(UserProgressSync));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const stalePutBody = JSON.parse(
      String(fetchMock.mock.calls[1][1]?.body),
    ) as {
      expectedOwnerId: string;
      progress: UnifiedProgress;
    };
    expect(stalePutBody.expectedOwnerId).toBe(ACCOUNT_A);
    expectPrivateProgress(stalePutBody.progress);

    await act(async () => {
      authCallback?.();
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(getLearningOwnerContext().kind).toBe("anonymous"),
    );

    await act(async () => {
      authCallback?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(getLearningOwnerContext()).toMatchObject({
      kind: "account",
      accountId: ACCOUNT_B,
    });

    await act(async () => {
      resolveAccountAPut(
        Response.json(
          {
            progress: {
              ...learnerProgress,
              xp: 999,
              checkpoints: { "stale-a-put": true },
            },
          },
          { status: 200 },
        ),
      );
      await accountAPut;
      await Promise.resolve();
    });

    expect(getUnifiedState()).toMatchObject({
      xp: accountBProgress.xp,
      checkpoints: accountBProgress.checkpoints,
    });
    expect(getUnifiedState().checkpoints).not.toHaveProperty("stale-a-put");
    const accountBPut = fetchMock.mock.calls.find(([, init]) => {
      if (init?.method !== "PUT") return false;
      const body = JSON.parse(String(init.body)) as {
        expectedOwnerId?: string;
      };
      return body.expectedOwnerId === ACCOUNT_B;
    });
    expect(accountBPut).toBeDefined();
  });

  it("publishes a permanent sync failure instead of failing silently", async () => {
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_A, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ error: "payload_too_large" }, { status: 413 }),
      );

    render(createElement(UserProgressSync));

    await waitFor(() => expect(getProgressSyncFailure()).toBe("permanent"));
    expectPrivateProgress(getUnifiedState());
  });

  it("publishes retry exhaustion and retains the unsaved local state", async () => {
    vi.useFakeTimers();
    createBrowserClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "learner-1" } },
          error: null,
        }),
      },
    });
    seedAccountProgress(ACCOUNT_A, learnerProgress);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { ownerId: ACCOUNT_A, progress: learnerProgress },
          { status: 200 },
        ),
      )
      .mockResolvedValue(
        Response.json({ error: "unavailable" }, { status: 503 }),
      );

    render(createElement(UserProgressSync));
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await vi.advanceTimersByTimeAsync(60_000);
      await Promise.resolve();
      if (getProgressSyncFailure() === "retry_exhausted") break;
    }

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(8);
    expect(getProgressSyncFailure()).toBe("retry_exhausted");
    expectPrivateProgress(getUnifiedState());
  });

  it("recovers from provider-client creation failure through long-tail revalidation without an online event", async () => {
    vi.useFakeTimers();
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    createBrowserClientMock
      .mockImplementationOnce(() => {
        throw new Error("temporary provider startup failure");
      })
      .mockReturnValueOnce({
        auth: { getUser: getUserMock },
      });

    render(createElement(UserProgressSync));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(getLearningOwnerContext().kind).toBe("unknown");
    expect(getProgressSyncFailure()).toBe("startup");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
      await Promise.resolve();
    });

    expect(createBrowserClientMock).toHaveBeenCalledTimes(2);
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(getProgressSyncFailure()).toBeNull();
  });

  it("continues identity verification after the bounded boot retries are exhausted", async () => {
    vi.useFakeTimers();
    const getUserMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("boot-1"))
      .mockRejectedValueOnce(new Error("boot-2"))
      .mockRejectedValueOnce(new Error("boot-3"))
      .mockRejectedValueOnce(new Error("boot-4"))
      .mockRejectedValueOnce(new Error("boot-5"))
      .mockRejectedValueOnce(new Error("boot-6"))
      .mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
    createBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });

    render(createElement(UserProgressSync));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(120_001);
      await Promise.resolve();
    });

    expect(getUserMock).toHaveBeenCalledTimes(7);
    expect(getLearningOwnerContext().kind).toBe("anonymous");
    expect(getProgressSyncFailure()).toBeNull();
  });
});
