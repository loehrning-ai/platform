"use client";

import { useEffect } from "react";
import {
  ACCOUNT_LEARNING_CUTOVER_KEY,
  getActiveAccountLearningCutoverEpoch,
  getReadyAccountLearningCutoverEpoch,
  hasLocalAnonymousLearningOverride,
  isAccountLearningCutoverEpochCurrent,
  prepareAccountLearningStorage,
} from "@/lib/progress/browser-learning-storage";
import {
  activateAccountProgress,
  activateAnonymousProgress,
  activateUnknownProgress,
  clearAccountLocalLearningData,
  getActiveProgressAccountId,
  getUnifiedState,
  replaceUnifiedState,
  subscribeChanges,
} from "@/lib/progress/store";
import {
  isUnifiedProgress,
  mergeUnifiedProgress,
} from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";
import {
  getAccountDeletionCleanupReplayStates,
  getAccountDeletionControlState,
  recoverMalformedAccountDeletionControl,
  releaseConfirmedAccountDeletion,
  resumeMalformedAccountDeletionRecovery,
  subscribeAccountDeletionControl,
  type AccountDeletionControlState,
} from "@/lib/progress/account-deletion-control";
import { setProgressSyncFailure } from "@/lib/progress/sync-status";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

function abortError(): Error {
  const error = new Error("Progress synchronization aborted");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

async function loadRemoteProgress(
  expectedOwnerId: string,
  signal?: AbortSignal,
  expectedCutoverEpoch?: string,
  requireAuthoritativeResponse = false,
): Promise<UnifiedProgress | null> {
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  const response = await fetch("/api/progress", {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  if (!response.ok) {
    if (requireAuthoritativeResponse) throw new Error("Progress GET failed");
    return null;
  }
  const body = (await response.json()) as {
    ownerId?: unknown;
    progress?: unknown;
  };
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  const ownerMatches = body.ownerId === expectedOwnerId;
  // Zero rows is an authoritative account state, not a malformed payload. It is
  // accepted only when the response is bound to the exact verified owner; an
  // absent/mismatched owner or any non-null malformed payload still blocks
  // recovery before the account namespace can be exposed.
  const progressIsValid =
    body.progress === null || isUnifiedProgress(body.progress);
  if (
    requireAuthoritativeResponse &&
    (!ownerMatches || !progressIsValid)
  ) {
    throw new Error("Progress GET owner or payload mismatch");
  }
  return ownerMatches && isUnifiedProgress(body.progress)
    ? body.progress
    : null;
}

export type SaveRemoteResult =
  | { readonly kind: "saved"; readonly progress: UnifiedProgress }
  | {
      readonly kind: "retry";
      readonly progress?: UnifiedProgress;
      readonly retryAfterMs?: number;
    }
  | { readonly kind: "permanent" };

export async function saveRemoteProgress(
  expectedOwnerId: string,
  progress: UnifiedProgress,
  retryOnConflict = true,
  signal?: AbortSignal,
  expectedCutoverEpoch?: string,
): Promise<SaveRemoteResult> {
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  const response = await fetch("/api/progress", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedOwnerId, progress }),
    signal,
  });
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    progress?: unknown;
  } | null;
  throwIfAborted(signal);
  if (
    expectedCutoverEpoch &&
    !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
  ) {
    throw abortError();
  }
  const serverProgress = isUnifiedProgress(body?.progress)
    ? body.progress
    : undefined;
  if (response.status === 409 && retryOnConflict && serverProgress) {
    const merged = mergeUnifiedProgress(getUnifiedState(), serverProgress);
    throwIfAborted(signal);
    return saveRemoteProgress(
      expectedOwnerId,
      merged,
      false,
      signal,
      expectedCutoverEpoch,
    );
  }
  if (response.status === 409 && body?.error === "progress_owner_mismatch") {
    return { kind: "permanent" };
  }
  if (response.ok && serverProgress) {
    return { kind: "saved", progress: serverProgress };
  }

  if ([400, 401, 403, 404, 413, 422].includes(response.status)) {
    return { kind: "permanent" };
  }

  let retryAfterMs: number | undefined;
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      const parsed = Number.isFinite(seconds)
        ? seconds * 1_000
        : Date.parse(retryAfter) - Date.now();
      if (Number.isFinite(parsed) && parsed > 0) {
        retryAfterMs = Math.min(60_000, Math.max(1_000, parsed));
      }
    }
  }
  return {
    kind: "retry",
    ...(serverProgress ? { progress: serverProgress } : {}),
    ...(retryAfterMs ? { retryAfterMs } : {}),
  };
}

export function UserProgressSyncRuntime() {
  useEffect(() => {
    // Provider-free builds have no remote progress path. Avoid fetching the
    // Supabase SDK just to have createBrowserSupabaseClient return null.
    if (!hasSupabasePublicConfig()) {
      activateAnonymousProgress();
      return;
    }
    // A configured provider means a prior account session may still exist.
    // Hide both account and anonymous namespaces until getUser() verifies the
    // current owner.
    activateUnknownProgress();

    let active = true;
    let debounceTimer: number | null = null;
    let bootRetryTimer: number | null = null;
    let longTailRetryTimer: number | null = null;
    let unsubscribeStore: (() => void) | null = null;
    let applyingServerState = false;
    let pendingState: UnifiedProgress | null = null;
    let inFlightWriteState: UnifiedProgress | null = null;
    let retryAttempts = 0;
    let bootRetryAttempts = 0;
    let syncDisabled = false;
    let authenticated = false;
    let bootstrapped = false;
    let verifiedUserId: string | null = null;
    let verifiedCutoverEpoch: string | null = null;
    let requiresAuthoritativeRecoveryGet = false;
    let recoveryScrubBlocked = false;
    let blockedRecoveryEpoch: string | null = null;
    let recoveryReplayInFlight = false;
    let recoveryReplayRetryEpoch: string | null = null;
    let malformedRecoveryInFlight = false;
    let malformedRecoveryRetryRequested = false;
    const confirmedReleasesInFlight = new Set<string>();
    const confirmedReleaseRetries = new Set<string>();
    const acknowledgedRecoveryEpochs = new Set<string>();
    let client: ReturnType<
      (typeof import("@/lib/supabase/browser"))["createBrowserSupabaseClient"]
    > | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let clientInitializationInFlight = false;
    let longTailRetryAttempts = 0;

    let deletionState: AccountDeletionControlState = {
      phase: "idle",
      epoch: null,
      accountId: null,
    };
    let paused = false;
    let operationGeneration = 0;
    let writeSequence = 0;
    let currentWriteId: number | null = null;
    let writeController: AbortController | null = null;
    let bootSequence = 0;
    let currentBootId: number | null = null;
    let bootController: AbortController | null = null;

    const MAX_RETRY_ATTEMPTS = 6;
    const MAX_BOOT_RETRY_ATTEMPTS = 5;
    const AUTH_VERIFICATION_TIMEOUT_MS = 10_000;
    const LONG_TAIL_RETRY_BASE_MS = 60_000;
    const LONG_TAIL_RETRY_MAX_MS = 5 * 60_000;

    function mergePending(state: UnifiedProgress): void {
      pendingState = pendingState
        ? mergeUnifiedProgress(pendingState, state)
        : state;
    }

    function clearTimers(): void {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (bootRetryTimer !== null) {
        window.clearTimeout(bootRetryTimer);
        bootRetryTimer = null;
      }
      if (longTailRetryTimer !== null) {
        window.clearTimeout(longTailRetryTimer);
        longTailRetryTimer = null;
      }
    }

    function invalidateNetworkOperations(preserveWrite: boolean): void {
      operationGeneration += 1;
      if (preserveWrite && inFlightWriteState) {
        mergePending(inFlightWriteState);
      }
      currentWriteId = null;
      inFlightWriteState = null;
      writeController?.abort();
      writeController = null;
      currentBootId = null;
      bootController?.abort();
      bootController = null;
    }

    function applyServerState(serverState: UnifiedProgress): void {
      const mergedWithCurrent = mergeUnifiedProgress(
        getUnifiedState(),
        serverState,
      );
      applyingServerState = true;
      try {
        replaceUnifiedState(mergedWithCurrent);
      } finally {
        applyingServerState = false;
      }
    }

    function armFlush(delay: number): void {
      if (!active || paused || syncDisabled) return;
      if (debounceTimer !== null) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        void flush();
      }, delay);
    }

    function scheduleRetry(
      state: UnifiedProgress,
      retryAfterMs?: number,
    ): void {
      mergePending(state);
      if (paused || !active) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
        setProgressSyncFailure("retry_exhausted");
        return;
      }
      const exponentialDelay = Math.min(60_000, 2_000 * 2 ** retryAttempts);
      retryAttempts += 1;
      armFlush(Math.max(exponentialDelay, retryAfterMs ?? 0));
    }

    function queueSave(state: UnifiedProgress, delay = 900): void {
      if (syncDisabled) return;
      if (paused) {
        if (deletionState.phase === "pending") mergePending(state);
        return;
      }
      retryAttempts = 0;
      mergePending(state);
      armFlush(delay);
    }

    async function flush(): Promise<void> {
      if (
        !active ||
        paused ||
        syncDisabled ||
        currentWriteId !== null ||
        !pendingState
      ) {
        return;
      }
      handleDeletionControl(getAccountDeletionControlState());
      if (!active || paused || syncDisabled || !pendingState) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const expectedOwnerId = verifiedUserId;
      const expectedCutoverEpoch = verifiedCutoverEpoch;
      if (
        !expectedOwnerId ||
        !expectedCutoverEpoch ||
        !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch) ||
        getActiveProgressAccountId() !== expectedOwnerId
      ) {
        return;
      }

      let next: UnifiedProgress;
      try {
        next = mergeUnifiedProgress(getUnifiedState(), pendingState);
      } catch {
        // Keep pendingState intact. A malformed in-memory snapshot must not
        // escape as an unhandled timer rejection or erase local progress.
        return;
      }

      pendingState = null;
      inFlightWriteState = next;
      const writeId = ++writeSequence;
      const generation = operationGeneration;
      const controller = new AbortController();
      currentWriteId = writeId;
      writeController = controller;
      let retryAfterMs: number | undefined;
      let retryState: UnifiedProgress | null = null;

      try {
        const result = await saveRemoteProgress(
          expectedOwnerId,
          next,
          true,
          controller.signal,
          expectedCutoverEpoch,
        );
        if (
          !active ||
          paused ||
          generation !== operationGeneration ||
          currentWriteId !== writeId
        ) {
          return;
        }
        handleDeletionControl(getAccountDeletionControlState());
        if (
          !active ||
          paused ||
          generation !== operationGeneration ||
          currentWriteId !== writeId
        ) {
          return;
        }
        if (result.kind === "saved") {
          retryAttempts = 0;
          setProgressSyncFailure(null);
          applyServerState(result.progress);
        } else if (result.kind === "permanent") {
          syncDisabled = true;
          pendingState = null;
          setProgressSyncFailure("permanent");
        } else {
          retryState = result.progress
            ? mergeUnifiedProgress(next, result.progress)
            : next;
          retryAfterMs = result.retryAfterMs;
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError" &&
          !isAccountLearningCutoverEpochCurrent(expectedCutoverEpoch)
        ) {
          revalidateCutoverAfterResume();
        } else if (
          active &&
          !paused &&
          generation === operationGeneration &&
          currentWriteId === writeId
        ) {
          retryState = next;
        }
      } finally {
        if (currentWriteId === writeId) {
          currentWriteId = null;
          inFlightWriteState = null;
          writeController = null;
          if (active && !paused && !syncDisabled) {
            if (retryState) {
              scheduleRetry(retryState, retryAfterMs);
            } else if (pendingState) {
              void flush();
            }
          }
        }
      }
    }

    function scheduleLongTailRevalidation(): void {
      if (!active || paused || bootstrapped || longTailRetryTimer !== null) {
        return;
      }
      setProgressSyncFailure("startup");
      const delay = Math.min(
        LONG_TAIL_RETRY_MAX_MS,
        LONG_TAIL_RETRY_BASE_MS * 2 ** Math.min(longTailRetryAttempts, 3),
      );
      longTailRetryAttempts += 1;
      longTailRetryTimer = window.setTimeout(() => {
        longTailRetryTimer = null;
        if (!active || paused || bootstrapped) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          scheduleLongTailRevalidation();
          return;
        }
        bootRetryAttempts = 0;
        if (client) {
          void boot();
        } else {
          void initializeClient();
        }
      }, delay);
    }

    function scheduleBootRetry(): void {
      if (!active || paused || bootRetryAttempts >= MAX_BOOT_RETRY_ATTEMPTS) {
        if (active && !paused && bootRetryAttempts >= MAX_BOOT_RETRY_ATTEMPTS) {
          setProgressSyncFailure("startup");
          scheduleLongTailRevalidation();
        }
        return;
      }
      const delay = Math.min(30_000, 2_000 * 2 ** bootRetryAttempts);
      bootRetryAttempts += 1;
      bootRetryTimer = window.setTimeout(() => {
        bootRetryTimer = null;
        void boot();
      }, delay);
    }

    async function boot(): Promise<void> {
      if (
        !active ||
        paused ||
        syncDisabled ||
        !client ||
        currentBootId !== null
      ) {
        return;
      }

      const bootId = ++bootSequence;
      const generation = operationGeneration;
      currentBootId = bootId;
      let user: { readonly id: string } | null;
      let authVerificationTimer: number | null = null;
      try {
        const result = await Promise.race([
          client.auth.getUser(),
          new Promise<never>((_resolve, reject) => {
            authVerificationTimer = window.setTimeout(() => {
              reject(new Error("Auth verification timed out"));
            }, AUTH_VERIFICATION_TIMEOUT_MS);
          }),
        ]);
        if (result.error) throw result.error;
        user = result.data.user;
      } catch {
        if (
          active &&
          !paused &&
          generation === operationGeneration &&
          currentBootId === bootId
        ) {
          currentBootId = null;
          scheduleBootRetry();
        }
        return;
      } finally {
        if (authVerificationTimer !== null) {
          window.clearTimeout(authVerificationTimer);
        }
      }

      if (
        !active ||
        paused ||
        generation !== operationGeneration ||
        currentBootId !== bootId
      ) {
        if (currentBootId === bootId) currentBootId = null;
        return;
      }

      if (hasLocalAnonymousLearningOverride()) {
        pendingState = null;
        authenticated = false;
        bootstrapped = true;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        syncDisabled = true;
        unsubscribeStore?.();
        unsubscribeStore = null;
        activateAnonymousProgress();
        currentBootId = null;
        clearTimers();
        setProgressSyncFailure(null);
        return;
      }

      if (!user) {
        pendingState = null;
        authenticated = false;
        bootstrapped = true;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        unsubscribeStore?.();
        unsubscribeStore = null;
        activateAnonymousProgress();
        currentBootId = null;
        longTailRetryAttempts = 0;
        setProgressSyncFailure(null);
        return;
      }

      const marker = getAccountDeletionControlState();
      if (marker.phase === "cleanup") {
        clearAccountLocalLearningData(marker.accountId);
        if (marker.accountId === user.id) {
          activateAnonymousProgress();
          authenticated = false;
          bootstrapped = true;
          verifiedUserId = null;
          verifiedCutoverEpoch = null;
          currentBootId = null;
          longTailRetryAttempts = 0;
          setProgressSyncFailure(null);
          return;
        }
      }
      if (
        marker.phase === "pending" &&
        (marker.accountId === null || marker.accountId === user.id)
      ) {
        paused = true;
        currentBootId = null;
        return;
      }
      if (marker.phase === "confirmed") {
        if (marker.accountId === null) {
          paused = true;
          currentBootId = null;
          return;
        }
        clearAccountLocalLearningData(marker.accountId);
        queueConfirmedRelease(marker.epoch);
        if (marker.accountId === user.id) {
          activateAnonymousProgress();
          authenticated = false;
          bootstrapped = true;
          verifiedUserId = null;
          verifiedCutoverEpoch = null;
          currentBootId = null;
          return;
        }
      }

      if (authenticated && bootstrapped && verifiedUserId === user.id) {
        currentBootId = null;
        return;
      }

      const storagePrepared = await prepareAccountLearningStorage();
      if (
        !active ||
        paused ||
        generation !== operationGeneration ||
        currentBootId !== bootId
      ) {
        if (currentBootId === bootId) currentBootId = null;
        return;
      }
      replayDeletionControlFromStorage();
      if (
        !active ||
        paused ||
        generation !== operationGeneration ||
        currentBootId !== bootId
      ) {
        if (currentBootId === bootId) currentBootId = null;
        return;
      }
      if (!storagePrepared) {
        authenticated = false;
        bootstrapped = false;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        currentBootId = null;
        scheduleBootRetry();
        return;
      }

      // getUser() verifies the identity with Auth. Only now may the browser
      // select an account namespace; anonymous, legacy, and another account's
      // records are never copied into it.
      const recoveringAccount = requiresAuthoritativeRecoveryGet;
      if (!recoveringAccount) activateAccountProgress(user.id);
      const cutoverEpoch = recoveringAccount
        ? getReadyAccountLearningCutoverEpoch()
        : getActiveAccountLearningCutoverEpoch();
      if (!cutoverEpoch) {
        authenticated = false;
        bootstrapped = false;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        currentBootId = null;
        scheduleBootRetry();
        return;
      }
      if (recoveringAccount) {
        // The cutover is captured only to fence the authoritative request.
        // Do not expose the scrubbed account namespace until that GET proves
        // both remote availability and owner identity.
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        authenticated = false;
      } else {
        verifiedUserId = user.id;
        verifiedCutoverEpoch = cutoverEpoch;
        authenticated = true;
      }

      let controller: AbortController | null = null;
      try {
        // Listen before network boot so learning completed while GET/PUT is in
        // flight cannot be overwritten by the boot response.
        if (!recoveringAccount && !unsubscribeStore) {
          unsubscribeStore = subscribeChanges((state) => {
            if (!applyingServerState) queueSave(state);
          });
        }

        controller = new AbortController();
        bootController = controller;
        let remote: UnifiedProgress | null = null;
        try {
          remote = await loadRemoteProgress(
            user.id,
            controller.signal,
            cutoverEpoch,
            requiresAuthoritativeRecoveryGet,
          );
        } catch (error) {
          if (recoveringAccount) {
            throw new Error("Authoritative recovery GET failed", {
              cause: error,
            });
          }
          if (error instanceof Error && error.name === "AbortError") {
            revalidateCutoverAfterResume();
            return;
          }
          // Keep and upload the current local state; a later queued save
          // retries the server path without discarding learning progress.
        }
        handleDeletionControl(getAccountDeletionControlState());
        if (
          !active ||
          paused ||
          generation !== operationGeneration ||
          currentBootId !== bootId
        ) {
          return;
        }

        if (recoveringAccount) {
          activateAccountProgress(user.id);
          const reactivatedCutover = getActiveAccountLearningCutoverEpoch();
          if (
            reactivatedCutover !== cutoverEpoch ||
            !isAccountLearningCutoverEpochCurrent(cutoverEpoch)
          ) {
            activateUnknownProgress();
            throw abortError();
          }
          verifiedUserId = user.id;
          verifiedCutoverEpoch = cutoverEpoch;
          authenticated = true;
          if (!unsubscribeStore) {
            unsubscribeStore = subscribeChanges((state) => {
              if (!applyingServerState) queueSave(state);
            });
          }
        }

        const merged = remote
          ? mergeUnifiedProgress(getUnifiedState(), remote)
          : getUnifiedState();
        applyServerState(merged);
        bootstrapped = true;
        requiresAuthoritativeRecoveryGet = false;
        bootRetryAttempts = 0;
        longTailRetryAttempts = 0;
        setProgressSyncFailure(null);
        // The boot write uses the same single-flight queue as later writes.
        queueSave(getUnifiedState(), 0);
      } catch {
        unsubscribeStore?.();
        unsubscribeStore = null;
        authenticated = false;
        bootstrapped = false;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        if (recoveringAccount) activateUnknownProgress();
        if (
          active &&
          !paused &&
          generation === operationGeneration &&
          currentBootId === bootId
        ) {
          scheduleBootRetry();
        }
      } finally {
        if (currentBootId === bootId) currentBootId = null;
        if (bootController === controller) {
          bootController = null;
        }
      }
    }

    function handleOnline(): void {
      if (!active || paused || syncDisabled) return;
      if (longTailRetryTimer !== null) {
        window.clearTimeout(longTailRetryTimer);
        longTailRetryTimer = null;
      }
      longTailRetryAttempts = 0;
      if (!client) {
        void initializeClient();
        return;
      }
      if (pendingState) {
        retryAttempts = 0;
        armFlush(0);
      } else if (!bootstrapped) {
        bootRetryAttempts = 0;
        void boot();
      }
    }

    function queueConfirmedRelease(epoch: string): void {
      if (!active) return;
      if (confirmedReleasesInFlight.has(epoch)) {
        confirmedReleaseRetries.add(epoch);
        return;
      }
      confirmedReleasesInFlight.add(epoch);
      void releaseConfirmedAccountDeletion(epoch).finally(() => {
        confirmedReleasesInFlight.delete(epoch);
        if (active && confirmedReleaseRetries.delete(epoch)) {
          queueConfirmedRelease(epoch);
        }
      });
    }

    function queueMalformedRecovery(): void {
      if (!active) return;
      if (malformedRecoveryInFlight) {
        malformedRecoveryRetryRequested = true;
        return;
      }
      malformedRecoveryInFlight = true;
      void recoverMalformedAccountDeletionControl()
        .then((recovered) => {
          if (active && recovered) revalidateCutoverAfterResume();
        })
        .finally(() => {
          malformedRecoveryInFlight = false;
          if (active && malformedRecoveryRetryRequested) {
            malformedRecoveryRetryRequested = false;
            queueMalformedRecovery();
          }
        });
    }

    function queueRecoveryReplay(epoch: string): void {
      if (!active) return;
      if (recoveryReplayInFlight) {
        recoveryReplayRetryEpoch = epoch;
        return;
      }
      recoveryReplayInFlight = true;
      void resumeMalformedAccountDeletionRecovery(epoch)
        .then((completed) => {
          if (
            !active ||
            !completed ||
            blockedRecoveryEpoch !== epoch
          ) {
            return;
          }
          acknowledgedRecoveryEpochs.add(epoch);
          blockedRecoveryEpoch = null;
          recoveryScrubBlocked = false;
          paused = false;
        })
        .finally(() => {
          recoveryReplayInFlight = false;
          if (!active) return;
          const requestedRetryEpoch = recoveryReplayRetryEpoch;
          recoveryReplayRetryEpoch = null;
          if (
            requestedRetryEpoch !== null &&
            blockedRecoveryEpoch === requestedRetryEpoch
          ) {
            queueRecoveryReplay(requestedRetryEpoch);
            return;
          }
          if (
            blockedRecoveryEpoch !== null &&
            blockedRecoveryEpoch !== epoch
          ) {
            queueRecoveryReplay(blockedRecoveryEpoch);
            return;
          }
          if (blockedRecoveryEpoch === null) {
            revalidateCutoverAfterResume();
          }
        });
    }

    function replayDeletionControlFromStorage(): void {
      for (const replay of getAccountDeletionCleanupReplayStates()) {
        if (
          replay.phase === "cleanup-all" &&
          acknowledgedRecoveryEpochs.has(replay.epoch)
        ) {
          continue;
        }
        handleDeletionControl(replay);
      }
      const scalar = getAccountDeletionControlState();
      if (
        scalar.phase !== "cleanup-all" ||
        !acknowledgedRecoveryEpochs.has(scalar.epoch)
      ) {
        handleDeletionControl(scalar);
      }
    }

    function revalidateCutoverAfterResume(): void {
      if (!active) return;
      replayDeletionControlFromStorage();
      if (!active) return;
      if (recoveryScrubBlocked) {
        if (blockedRecoveryEpoch !== null) {
          queueRecoveryReplay(blockedRecoveryEpoch);
        }
        return;
      }
      if (paused) return;
      if (
        verifiedCutoverEpoch &&
        isAccountLearningCutoverEpochCurrent(verifiedCutoverEpoch)
      ) {
        return;
      }
      if (!verifiedCutoverEpoch && !requiresAuthoritativeRecoveryGet) {
        return;
      }

      clearTimers();
      invalidateNetworkOperations(false);
      pendingState = null;
      authenticated = false;
      bootstrapped = false;
      verifiedUserId = null;
      verifiedCutoverEpoch = null;
      syncDisabled = false;
      retryAttempts = 0;
      bootRetryAttempts = 0;
      unsubscribeStore?.();
      unsubscribeStore = null;
      requiresAuthoritativeRecoveryGet = true;
      activateUnknownProgress();
      if (paused) return;
      if (client) void boot();
      else void initializeClient();
    }

    function handleCutoverStorage(event: StorageEvent): void {
      if (event.key === ACCOUNT_LEARNING_CUTOVER_KEY) {
        revalidateCutoverAfterResume();
      }
    }

    function handlePageShow(): void {
      revalidateCutoverAfterResume();
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === "visible") {
        revalidateCutoverAfterResume();
      }
    }

    function handleAuthStateChange(): void {
      if (!active) return;
      clearTimers();
      invalidateNetworkOperations(false);
      pendingState = null;
      authenticated = false;
      bootstrapped = false;
      verifiedUserId = null;
      verifiedCutoverEpoch = null;
      syncDisabled = false;
      retryAttempts = 0;
      bootRetryAttempts = 0;
      longTailRetryAttempts = 0;
      unsubscribeStore?.();
      unsubscribeStore = null;

      // An auth event is not identity proof. Hide every account namespace
      // until a fresh getUser() verification identifies the new owner.
      activateUnknownProgress();
      void boot();
    }

    function handleDeletionControl(next: AccountDeletionControlState): void {
      const previous = deletionState;
      if (
        next.phase === "cleanup-all" &&
        acknowledgedRecoveryEpochs.has(next.epoch)
      ) {
        return;
      }
      if (
        previous.phase === next.phase &&
        previous.epoch === next.epoch &&
        previous.accountId === next.accountId
      ) {
        // A confirmed marker has no expiry and intentionally keeps sync paused
        // until its per-account cleanup ledger is durable. The first release
        // attempt can fail transiently (for example, temporary storage denial).
        // Resume signals must retry only that idempotent persistence step; the
        // account-bound cleanup already ran when confirmation was first
        // observed.
        if (next.phase === "confirmed") {
          queueConfirmedRelease(next.epoch);
        } else if (next.phase === "cleanup-all") {
          queueRecoveryReplay(next.epoch);
        } else if (next.phase === "pending" && next.accountId === null) {
          queueMalformedRecovery();
        }
        return;
      }
      deletionState = next;

      if (next.phase === "cleanup-all") {
        clearTimers();
        invalidateNetworkOperations(false);
        pendingState = null;
        authenticated = false;
        bootstrapped = false;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        syncDisabled = false;
        retryAttempts = 0;
        bootRetryAttempts = 0;
        unsubscribeStore?.();
        unsubscribeStore = null;
        paused = true;
        activateUnknownProgress();
        requiresAuthoritativeRecoveryGet = true;
        recoveryScrubBlocked = true;
        blockedRecoveryEpoch = next.epoch;
        queueRecoveryReplay(next.epoch);
        return;
      }

      if (next.phase === "cleanup") {
        clearAccountLocalLearningData(next.accountId);
        const wasPausedForThisDeletion =
          paused &&
          (previous.accountId === next.accountId ||
            previous.accountId === null);
        const deletedVerifiedOwner = verifiedUserId === next.accountId;
        if (deletedVerifiedOwner || wasPausedForThisDeletion) {
          clearTimers();
          invalidateNetworkOperations(false);
          pendingState = null;
          authenticated = false;
          bootstrapped = false;
          verifiedUserId = null;
          verifiedCutoverEpoch = null;
          syncDisabled = false;
          retryAttempts = 0;
          bootRetryAttempts = 0;
          unsubscribeStore?.();
          unsubscribeStore = null;
          paused = false;
          activateUnknownProgress();
          if (active) {
            if (client) void boot();
            else void initializeClient();
          }
        } else if (
          verifiedUserId === null &&
          !bootstrapped &&
          !paused &&
          active &&
          !clientInitializationInFlight
        ) {
          bootRetryAttempts = 0;
          if (client) void boot();
          else void initializeClient();
        }
        return;
      }

      if (next.phase === "idle") {
        if (recoveryScrubBlocked) {
          paused = true;
          return;
        }
        if (!paused) return;
        paused = false;
        clearTimers();
        invalidateNetworkOperations(true);
        if (!active || syncDisabled) return;
        if (authenticated && bootstrapped && verifiedUserId) {
          queueSave(getUnifiedState(), 0);
        } else {
          bootRetryAttempts = 0;
          if (client) void boot();
          else void initializeClient();
        }
        return;
      }

      // A well-formed marker affects only its bound account. A malformed
      // marker has no account id and remains globally fail-closed, but can
      // never authorize deletion of any namespace.
      const targetsVerifiedAccount =
        next.accountId !== null && next.accountId === verifiedUserId;
      if (next.phase === "pending" && next.accountId === null) {
        clearTimers();
        invalidateNetworkOperations(false);
        pendingState = null;
        authenticated = false;
        bootstrapped = false;
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        unsubscribeStore?.();
        unsubscribeStore = null;
        paused = true;
        activateUnknownProgress();
        requiresAuthoritativeRecoveryGet = true;
        queueMalformedRecovery();
        return;
      }
      if (
        next.accountId !== null &&
        verifiedUserId !== null &&
        !targetsVerifiedAccount
      ) {
        if (next.phase === "confirmed") {
          clearAccountLocalLearningData(next.accountId);
          queueConfirmedRelease(next.epoch);
        }
        return;
      }
      if (next.accountId !== null && verifiedUserId === null) {
        if (next.phase === "confirmed") {
          clearTimers();
          invalidateNetworkOperations(false);
          pendingState = null;
          authenticated = false;
          bootstrapped = false;
          unsubscribeStore?.();
          unsubscribeStore = null;
          paused = true;
          activateUnknownProgress();
          clearAccountLocalLearningData(next.accountId);
          queueConfirmedRelease(next.epoch);
        }
        return;
      }

      clearTimers();
      invalidateNetworkOperations(next.phase === "pending");
      if (next.phase === "pending") {
        paused = true;
        return;
      }

      if (next.phase === "confirmed") {
        paused = true;
        pendingState = null;
        authenticated = false;
        bootstrapped = false;
        unsubscribeStore?.();
        unsubscribeStore = null;
        if (next.accountId !== null) {
          clearAccountLocalLearningData(next.accountId);
          queueConfirmedRelease(next.epoch);
        }
        verifiedUserId = null;
        verifiedCutoverEpoch = null;
        return;
      }
    }

    const unsubscribeDeletion = subscribeAccountDeletionControl(
      handleDeletionControl,
    );
    window.addEventListener("online", handleOnline);
    window.addEventListener("storage", handleCutoverStorage);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    async function initializeClient(): Promise<void> {
      if (!active || paused || client || clientInitializationInFlight) {
        return;
      }
      clientInitializationInFlight = true;
      try {
        // Dynamic import keeps the Supabase SDK out of the first-load bundle.
        const { createBrowserSupabaseClient } =
          await import("@/lib/supabase/browser");
        if (!active || paused) return;
        try {
          client = createBrowserSupabaseClient();
        } catch {
          client = null;
        }
        if (!client || !active) {
          scheduleLongTailRevalidation();
          return;
        }

        if (
          !unsubscribeAuth &&
          typeof client.auth.onAuthStateChange === "function"
        ) {
          const { data: authSubscription } = client.auth.onAuthStateChange(
            () => {
              // Supabase warns against awaiting other auth calls inside this
              // callback. Re-enter on a microtask, then verify with getUser().
              queueMicrotask(handleAuthStateChange);
            },
          );
          unsubscribeAuth = () => authSubscription.subscription.unsubscribe();
        }

        void boot();
      } catch {
        client = null;
        scheduleLongTailRevalidation();
      } finally {
        clientInitializationInFlight = false;
      }
    }

    void initializeClient();

    return () => {
      active = false;
      clearTimers();
      invalidateNetworkOperations(false);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("storage", handleCutoverStorage);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribeDeletion();
      unsubscribeStore?.();
      unsubscribeAuth?.();
    };
  }, []);

  return null;
}
