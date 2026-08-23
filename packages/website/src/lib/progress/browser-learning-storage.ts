"use client";

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

import {
  isAccountDeletionOriginLockLeaseActive,
  type AccountDeletionLockLease,
  withAccountDeletionOriginLock,
} from "./account-deletion-lock";

/**
 * Browser learning data has an explicit owner context. Until Auth has been
 * verified, reads and writes fail closed in memory. Anonymous learning keeps
 * the historical bare keys; verified accounts use disjoint namespaces.
 */

export const ACCOUNT_LEARNING_STORAGE_PREFIX = "loehrning-learning-account-v1:";
export const ACCOUNT_LEARNING_CUTOVER_KEY =
  "loehrning-learning-account-cutover-v1";

type AccountRetirement = {
  readonly accountHash: string;
  readonly minimumGeneration: number;
};

type LegacyCutoverAcceptance = {
  readonly generation: number;
  readonly epoch: string;
};

type AccountLearningCutover = {
  readonly version: 3;
  readonly lineage: string;
  readonly generation: number;
  readonly minimumGeneration: number;
  readonly epoch: string;
  readonly phase: "recovery-in-progress" | "ready";
  readonly retiredAccounts: readonly AccountRetirement[];
  readonly legacyCutovers: readonly LegacyCutoverAcceptance[];
};

type AccountLearningEnvelope =
  | {
      readonly version: 2;
      readonly storageLineage: string;
      readonly storageGeneration: number;
      readonly value: string;
    }
  | {
      readonly version: 1;
      readonly cutoverEpoch: string;
      readonly value: string;
    };

export type LearningOwnerContext =
  | { readonly kind: "unknown"; readonly generation: number }
  | { readonly kind: "anonymous"; readonly generation: number }
  | {
      readonly kind: "account";
      readonly accountId: string;
      readonly generation: number;
    };

const MAX_RETIRED_ACCOUNTS = 128;
const MAX_LEGACY_CUTOVERS = 256;
const ACCOUNT_RETIREMENT_HASH_DOMAIN =
  "loehrning.ai/browser-learning-retirement/v1:";

let context: LearningOwnerContext = { kind: "unknown", generation: 0 };
let localAnonymousOverride = false;
let activeAccountCutover: AccountLearningCutover | null = null;
const listeners = new Set<(context: LearningOwnerContext) => void>();

function normalizeAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!normalized || normalized.length > 256) {
    throw new Error("Invalid learning-data account identifier");
  }
  return normalized;
}

function validAccountId(accountId: unknown): accountId is string {
  return (
    typeof accountId === "string" &&
    accountId === accountId.trim() &&
    accountId.length >= 1 &&
    accountId.length <= 256
  );
}

function validStorageToken(token: unknown): token is string {
  return typeof token === "string" && token.length >= 8 && token.length <= 200;
}

function accountRetirementHash(accountId: string): string {
  return bytesToHex(
    sha256(
      utf8ToBytes(
        `${ACCOUNT_RETIREMENT_HASH_DOMAIN}${normalizeAccountId(accountId)}`,
      ),
    ),
  );
}

function validAccountRetirementHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function accountPrefix(accountId: string): string {
  return `${ACCOUNT_LEARNING_STORAGE_PREFIX}${encodeURIComponent(
    normalizeAccountId(accountId),
  )}:`;
}

function accountIdFromStorageKey(key: string): string | null {
  if (!key.startsWith(ACCOUNT_LEARNING_STORAGE_PREFIX)) return null;
  const encodedWithKey = key.slice(ACCOUNT_LEARNING_STORAGE_PREFIX.length);
  const separator = encodedWithKey.indexOf(":");
  if (separator <= 0) return null;
  try {
    const accountId = decodeURIComponent(encodedWithKey.slice(0, separator));
    return validAccountId(accountId) ? accountId : null;
  } catch {
    return null;
  }
}

function newCutoverEpoch(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  if (typeof cryptoApi?.getRandomValues === "function") {
    const entropy = new Uint8Array(16);
    cryptoApi.getRandomValues(entropy);
    return bytesToHex(entropy);
  }
  throw new Error("Secure randomness is unavailable for learning-data cutover");
}

function parseAccountLearningCutover(
  value: unknown,
): AccountLearningCutover | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (
    (candidate.version !== 1 &&
      candidate.version !== 2 &&
      candidate.version !== 3) ||
    typeof candidate.generation !== "number" ||
    !Number.isSafeInteger(candidate.generation) ||
    candidate.generation < 1 ||
    !validStorageToken(candidate.epoch) ||
    (candidate.phase !== "recovery-in-progress" && candidate.phase !== "ready")
  ) {
    return null;
  }

  const generation = candidate.generation;
  if (candidate.version === 1) {
    if (
      candidate.lineage !== undefined ||
      candidate.minimumGeneration !== undefined ||
      candidate.retiredAccounts !== undefined ||
      candidate.legacyCutovers !== undefined
    ) {
      return null;
    }
    return {
      version: 3,
      // The legacy epoch already has the required entropy and stays within the
      // v2 token bound even when the v1 value uses the full 200 characters.
      lineage: candidate.epoch,
      generation,
      minimumGeneration: generation,
      epoch: candidate.epoch,
      phase: candidate.phase,
      retiredAccounts: [],
      legacyCutovers: [{ generation, epoch: candidate.epoch }],
    };
  }

  if (
    !validStorageToken(candidate.lineage) ||
    typeof candidate.minimumGeneration !== "number" ||
    !Number.isSafeInteger(candidate.minimumGeneration) ||
    candidate.minimumGeneration < 1 ||
    candidate.minimumGeneration > generation ||
    !Array.isArray(candidate.retiredAccounts) ||
    candidate.retiredAccounts.length > MAX_RETIRED_ACCOUNTS ||
    !Array.isArray(candidate.legacyCutovers) ||
    candidate.legacyCutovers.length > MAX_LEGACY_CUTOVERS
  ) {
    return null;
  }

  const retiredAccounts: AccountRetirement[] = [];
  const retiredHashes = new Set<string>();
  for (const retirement of candidate.retiredAccounts) {
    if (
      !retirement ||
      typeof retirement !== "object" ||
      Array.isArray(retirement)
    ) {
      return null;
    }
    const record = retirement as Record<string, unknown>;
    const accountHash =
      candidate.version === 2 && validAccountId(record.accountId)
        ? accountRetirementHash(record.accountId)
        : validAccountRetirementHash(record.accountHash)
          ? record.accountHash
          : null;
    if (
      accountHash === null ||
      typeof record.minimumGeneration !== "number" ||
      !Number.isSafeInteger(record.minimumGeneration) ||
      record.minimumGeneration < 1 ||
      record.minimumGeneration > generation ||
      retiredHashes.has(accountHash)
    ) {
      return null;
    }
    retiredHashes.add(accountHash);
    retiredAccounts.push({
      accountHash,
      minimumGeneration: record.minimumGeneration,
    });
  }

  const legacyCutovers: LegacyCutoverAcceptance[] = [];
  const legacyEpochs = new Set<string>();
  for (const legacyCutover of candidate.legacyCutovers) {
    if (
      !legacyCutover ||
      typeof legacyCutover !== "object" ||
      Array.isArray(legacyCutover)
    ) {
      return null;
    }
    const record = legacyCutover as Record<string, unknown>;
    if (
      typeof record.generation !== "number" ||
      !Number.isSafeInteger(record.generation) ||
      record.generation < 1 ||
      record.generation > generation ||
      !validStorageToken(record.epoch) ||
      legacyEpochs.has(record.epoch)
    ) {
      return null;
    }
    legacyEpochs.add(record.epoch);
    legacyCutovers.push({
      generation: record.generation,
      epoch: record.epoch,
    });
  }
  return {
    version: 3,
    lineage: candidate.lineage,
    generation,
    minimumGeneration: candidate.minimumGeneration,
    epoch: candidate.epoch,
    phase: candidate.phase,
    retiredAccounts,
    legacyCutovers,
  };
}

function markerUsesCurrentSchema(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.version === 3;
}

function readAccountLearningCutover(): AccountLearningCutover | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseAccountLearningCutover(parsed);
  } catch {
    return null;
  }
}

function inspectAccountLearningCutover():
  | { readonly kind: "missing" }
  | { readonly kind: "malformed" }
  | {
      readonly kind: "valid";
      readonly marker: AccountLearningCutover;
      readonly normalized: boolean;
    } {
  if (typeof window === "undefined") return { kind: "missing" };
  try {
    const raw = window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY);
    if (raw === null) return { kind: "missing" };
    const parsed: unknown = JSON.parse(raw);
    const marker = parseAccountLearningCutover(parsed);
    return marker
      ? {
          kind: "valid",
          marker,
          normalized: markerUsesCurrentSchema(parsed),
        }
      : { kind: "malformed" };
  } catch {
    return { kind: "malformed" };
  }
}

function persistAccountLearningCutover(
  marker: AccountLearningCutover,
): boolean {
  if (typeof window === "undefined") return false;
  const serialized = JSON.stringify(marker);
  try {
    window.localStorage.setItem(ACCOUNT_LEARNING_CUTOVER_KEY, serialized);
    return (
      window.localStorage.getItem(ACCOUNT_LEARNING_CUTOVER_KEY) === serialized
    );
  } catch {
    return false;
  }
}

function accountMinimumGeneration(
  marker: AccountLearningCutover,
  accountId: string,
): number {
  const accountHash = accountRetirementHash(accountId);
  const retired = marker.retiredAccounts.find(
    (entry) => entry.accountHash === accountHash,
  );
  return Math.max(marker.minimumGeneration, retired?.minimumGeneration ?? 1);
}

function accountGenerationIsAccepted(
  marker: AccountLearningCutover,
  accountId: string,
  generation: number,
): boolean {
  return (
    Number.isSafeInteger(generation) &&
    generation >= accountMinimumGeneration(marker, accountId) &&
    generation <= marker.generation
  );
}

function parseAccountLearningEnvelope(
  value: unknown,
): AccountLearningEnvelope | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.value !== "string") {
    return null;
  }
  if (candidate.version === 1) {
    return validStorageToken(candidate.cutoverEpoch) &&
      candidate.storageLineage === undefined &&
      candidate.storageGeneration === undefined
      ? {
          version: 1,
          cutoverEpoch: candidate.cutoverEpoch,
          value: candidate.value,
        }
      : null;
  }
  if (
    candidate.version !== 2 ||
    !validStorageToken(candidate.storageLineage) ||
    typeof candidate.storageGeneration !== "number" ||
    !Number.isSafeInteger(candidate.storageGeneration) ||
    candidate.storageGeneration < 1
  ) {
    return null;
  }
  return {
    version: 2,
    storageLineage: candidate.storageLineage,
    storageGeneration: candidate.storageGeneration,
    value: candidate.value,
  };
}

function envelopeGeneration(
  envelope: AccountLearningEnvelope,
  marker: AccountLearningCutover,
): number | null {
  if (envelope.version === 2) {
    return envelope.storageLineage === marker.lineage
      ? envelope.storageGeneration
      : null;
  }
  return (
    marker.legacyCutovers.find((entry) => entry.epoch === envelope.cutoverEpoch)
      ?.generation ?? null
  );
}

function parsedStoredAccountValue(
  raw: string,
  marker: AccountLearningCutover,
  accountId: string,
): { readonly generation: number; readonly value: string } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = parseAccountLearningEnvelope(parsed);
    if (envelope) {
      const generation = envelopeGeneration(envelope, marker);
      return generation !== null &&
        accountGenerationIsAccepted(marker, accountId, generation)
        ? { generation, value: envelope.value }
        : null;
    }
  } catch {
    // Generation one adopts raw pre-cutover account values.
  }
  return marker.generation === 1 &&
    accountMinimumGeneration(marker, accountId) <= 1
    ? { generation: 1, value: raw }
    : null;
}

function storedAccountValueGeneration(
  raw: string | null,
  marker: AccountLearningCutover,
): number | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = parseAccountLearningEnvelope(parsed);
    return envelope ? envelopeGeneration(envelope, marker) : null;
  } catch {
    return marker.generation === 1 ? 1 : null;
  }
}

function serializeAccountValue(
  marker: AccountLearningCutover,
  value: string,
): string {
  return JSON.stringify({
    version: 2,
    storageLineage: marker.lineage,
    storageGeneration: marker.generation,
    value,
  } satisfies AccountLearningEnvelope);
}

function migrateLegacyAccountValues(marker: AccountLearningCutover): boolean {
  if (typeof window === "undefined") return false;
  const migrateStorage = (storage: Storage): boolean => {
    try {
      const keys = Array.from({ length: storage.length }, (_, index) =>
        storage.key(index),
      ).filter(
        (key): key is string =>
          key !== null && key.startsWith(ACCOUNT_LEARNING_STORAGE_PREFIX),
      );
      for (const key of keys) {
        const accountId = accountIdFromStorageKey(key);
        const raw = storage.getItem(key);
        if (!accountId || raw === null) return false;
        try {
          const parsed: unknown = JSON.parse(raw);
          const envelope = parseAccountLearningEnvelope(parsed);
          if (envelope) {
            const generation = envelopeGeneration(envelope, marker);
            if (
              generation !== null &&
              accountGenerationIsAccepted(marker, accountId, generation)
            ) {
              continue;
            }
            return false;
          }
        } catch {
          // Historical values are raw payloads.
        }
        if (marker.generation !== 1) return false;
        const migrated = serializeAccountValue(marker, raw);
        storage.setItem(key, migrated);
        if (storage.getItem(key) !== migrated) return false;
      }
      return true;
    } catch {
      return false;
    }
  };
  return (
    migrateStorage(window.localStorage) && migrateStorage(window.sessionStorage)
  );
}

function ensureReadyAccountLearningCutover(
  lease: AccountDeletionLockLease,
): AccountLearningCutover | null {
  if (!isAccountDeletionOriginLockLeaseActive(lease)) return null;
  const inspected = inspectAccountLearningCutover();
  if (inspected.kind === "valid") {
    if (inspected.marker.phase === "ready") {
      if (inspected.normalized) return inspected.marker;
      // Migrate while the v1 marker is still durable. A partial storage failure
      // then leaves v1 in place so the next locked preparation can retry,
      // instead of stranding raw generation-one values behind a normalized v2
      // marker.
      if (
        !migrateLegacyAccountValues(inspected.marker) ||
        !persistAccountLearningCutover(inspected.marker)
      ) {
        return null;
      }
      return inspected.marker;
    }
    if (inspected.marker.generation !== 1) return null;
    if (
      (!inspected.normalized &&
        !persistAccountLearningCutover(inspected.marker)) ||
      !migrateLegacyAccountValues(inspected.marker)
    ) {
      return null;
    }
    const ready: AccountLearningCutover = {
      ...inspected.marker,
      phase: "ready",
    };
    return persistAccountLearningCutover(ready) ? ready : null;
  }
  if (inspected.kind === "malformed") return null;

  const epoch = newCutoverEpoch();
  const initialInProgress: AccountLearningCutover = {
    version: 3,
    lineage: newCutoverEpoch(),
    generation: 1,
    minimumGeneration: 1,
    epoch,
    phase: "recovery-in-progress",
    retiredAccounts: [],
    legacyCutovers: [],
  };
  if (
    !persistAccountLearningCutover(initialInProgress) ||
    !migrateLegacyAccountValues(initialInProgress)
  ) {
    return null;
  }
  const ready: AccountLearningCutover = {
    ...initialInProgress,
    phase: "ready",
  };
  return persistAccountLearningCutover(ready) ? ready : null;
}

/**
 * Establishes or normalizes the account-storage marker before synchronous
 * account activation. Every marker writer uses the same origin-global lock as
 * deletion and malformed recovery.
 */
export async function prepareAccountLearningStorage(): Promise<boolean> {
  const result = await withAccountDeletionOriginLock(
    { ifAvailable: false },
    (lease) => ensureReadyAccountLearningCutover(lease) !== null,
  );
  return result.kind === "acquired" && result.value;
}

function cutoverAcceptsActiveAccount(
  marker: AccountLearningCutover | null,
  requireReady: boolean,
): marker is AccountLearningCutover {
  return (
    context.kind === "account" &&
    activeAccountCutover !== null &&
    marker !== null &&
    (!requireReady || marker.phase === "ready") &&
    marker.lineage === activeAccountCutover.lineage &&
    accountGenerationIsAccepted(
      marker,
      context.accountId,
      activeAccountCutover.generation,
    )
  );
}

function currentAccountCutover(
  requireReady = true,
): AccountLearningCutover | null {
  const marker = readAccountLearningCutover();
  return cutoverAcceptsActiveAccount(marker, requireReady) ? marker : null;
}

function publish(
  next:
    | { readonly kind: "unknown" }
    | { readonly kind: "anonymous" }
    | { readonly kind: "account"; readonly accountId: string },
): LearningOwnerContext {
  if (
    context.kind === next.kind &&
    (context.kind !== "account" ||
      (next.kind === "account" && context.accountId === next.accountId))
  ) {
    return context;
  }
  context =
    next.kind === "account"
      ? {
          kind: "account",
          accountId: normalizeAccountId(next.accountId),
          generation: context.generation + 1,
        }
      : { kind: next.kind, generation: context.generation + 1 };
  for (const listener of listeners) {
    try {
      listener(context);
    } catch {
      // One component cannot block every other owner transition.
    }
  }
  return context;
}

export function getLearningOwnerContext(): LearningOwnerContext {
  return context;
}

export function setUnknownLearningOwner(): LearningOwnerContext {
  activeAccountCutover = null;
  return publish({ kind: "unknown" });
}

export function activateAnonymousLearningOwner(): LearningOwnerContext {
  activeAccountCutover = null;
  return publish({ kind: "anonymous" });
}

export function activateAccountLearningOwner(
  accountId: string,
): LearningOwnerContext {
  localAnonymousOverride = false;
  const normalizedAccountId = normalizeAccountId(accountId);
  const inspected = inspectAccountLearningCutover();
  const cutover =
    inspected.kind === "valid" &&
    inspected.normalized &&
    inspected.marker.phase === "ready"
      ? inspected.marker
      : null;
  if (cutover === null) {
    activeAccountCutover = null;
    return publish({ kind: "unknown" });
  }
  const cutoverChanged =
    activeAccountCutover?.lineage !== cutover.lineage ||
    activeAccountCutover.generation !== cutover.generation ||
    activeAccountCutover.epoch !== cutover.epoch;
  if (
    cutoverChanged &&
    context.kind === "account" &&
    context.accountId === normalizedAccountId
  ) {
    context = {
      kind: "unknown",
      generation: context.generation + 1,
    };
  }
  activeAccountCutover = cutover;
  return publish({ kind: "account", accountId: normalizedAccountId });
}

/**
 * Explicit user choice for an unresolved provider session. It lasts for this
 * page lifetime only, so progress can continue in the isolated anonymous
 * namespace without a later retry silently switching owners underneath an
 * active interaction.
 */
export function continueWithAnonymousLearningOwner(): LearningOwnerContext {
  localAnonymousOverride = true;
  activeAccountCutover = null;
  return publish({ kind: "anonymous" });
}

export function hasLocalAnonymousLearningOverride(): boolean {
  return localAnonymousOverride;
}

export function subscribeLearningOwner(
  listener: (context: LearningOwnerContext) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function ownedLearningStorageKey(
  key: string,
  owner = context,
): string | null {
  if (owner.kind === "unknown") return null;
  if (owner.kind === "anonymous") return key;
  return `${accountPrefix(owner.accountId)}${key}`;
}

function storageItem(storage: Storage | undefined, key: string): string | null {
  const ownedKey = ownedLearningStorageKey(key);
  if (!storage || !ownedKey) return null;
  const marker = context.kind === "account" ? currentAccountCutover() : null;
  if (context.kind === "account" && !marker) return null;
  try {
    const raw = storage.getItem(ownedKey);
    if (raw === null) return null;
    if (context.kind !== "account" || !marker) return raw;
    return (
      parsedStoredAccountValue(raw, marker, context.accountId)?.value ?? null
    );
  } catch {
    return null;
  }
}

function setStorageItem(
  storage: Storage | undefined,
  key: string,
  value: string,
  expectedGeneration?: number,
): boolean {
  if (
    expectedGeneration !== undefined &&
    context.generation !== expectedGeneration
  ) {
    return false;
  }
  const ownedKey = ownedLearningStorageKey(key);
  if (!storage || !ownedKey) return false;

  const accountId = context.kind === "account" ? context.accountId : null;
  const activeGeneration = activeAccountCutover?.generation ?? null;
  const preflight = accountId ? currentAccountCutover() : null;
  if (accountId && (!preflight || activeGeneration === null)) return false;

  try {
    const priorRaw = storage.getItem(ownedKey);
    if (accountId && preflight && activeGeneration !== null) {
      const priorGeneration = storedAccountValueGeneration(priorRaw, preflight);
      if (priorGeneration !== null && priorGeneration > activeGeneration) {
        return false;
      }

      // This second fence and exact-value check preserve a newer generation
      // that arrived after the first marker read. Web Storage has no CAS: a
      // newer write in the final interval between this comparison and setItem
      // cannot be detected or restored without generation-qualified physical
      // keys or an async shared lock.
      if (!currentAccountCutover()) return false;
      if (storage.getItem(ownedKey) !== priorRaw) return false;
    }

    const persistedValue =
      accountId && activeAccountCutover
        ? serializeAccountValue(activeAccountCutover, value)
        : value;
    storage.setItem(ownedKey, persistedValue);
    const writeSucceeded = storage.getItem(ownedKey) === persistedValue;
    if (!accountId) return writeSucceeded;

    const postflight = readAccountLearningCutover();
    if (cutoverAcceptsActiveAccount(postflight, false)) {
      // Unrelated-account deletion does not retire this generation. Its value
      // is deliberately left byte-for-byte unchanged; no global migration or
      // rollback can overwrite it.
      return writeSucceeded;
    }

    // The active account was retired or the lineage became invalid. Never
    // restore its prior value: doing so would resurrect deleted account data.
    // Cleanup is limited to this call's exact stale bytes. A same-account
    // re-creation racing between equality and removeItem remains irreducible
    // without generation-qualified physical keys or an async shared lock.
    if (writeSucceeded && storage.getItem(ownedKey) === persistedValue) {
      storage.removeItem(ownedKey);
    }
    return false;
  } catch {
    return false;
  }
}

function removeStorageItem(
  storage: Storage | undefined,
  key: string,
  expectedGeneration?: number,
): void {
  if (
    expectedGeneration !== undefined &&
    context.generation !== expectedGeneration
  ) {
    return;
  }
  const ownedKey = ownedLearningStorageKey(key);
  if (!storage || !ownedKey) return;

  const accountId = context.kind === "account" ? context.accountId : null;
  const activeGeneration = activeAccountCutover?.generation ?? null;
  const preflight = accountId ? currentAccountCutover() : null;
  if (accountId && (!preflight || activeGeneration === null)) return;

  try {
    if (!accountId || !preflight || activeGeneration === null) {
      storage.removeItem(ownedKey);
      return;
    }

    const candidate = storage.getItem(ownedKey);
    if (candidate === null) return;
    const candidateGeneration = storedAccountValueGeneration(
      candidate,
      preflight,
    );
    if (
      candidateGeneration !== null &&
      candidateGeneration > activeGeneration
    ) {
      return;
    }

    // A marker recheck plus an exact byte comparison prevents an old tab from
    // deleting a newer-generation value already committed by another tab.
    // localStorage exposes no atomic compare-and-remove; a write in the final
    // interval between this comparison and removeItem cannot be distinguished.
    if (!currentAccountCutover()) return;
    if (storage.getItem(ownedKey) !== candidate) return;
    storage.removeItem(ownedKey);
  } catch {
    // Storage denial is non-fatal.
  }
}

export function getOwnedLocalLearningItem(key: string): string | null {
  return storageItem(
    typeof window === "undefined" ? undefined : window.localStorage,
    key,
  );
}

export function setOwnedLocalLearningItem(
  key: string,
  value: string,
  expectedGeneration?: number,
): boolean {
  return setStorageItem(
    typeof window === "undefined" ? undefined : window.localStorage,
    key,
    value,
    expectedGeneration,
  );
}

export function removeOwnedLocalLearningItem(
  key: string,
  expectedGeneration?: number,
): void {
  removeStorageItem(
    typeof window === "undefined" ? undefined : window.localStorage,
    key,
    expectedGeneration,
  );
}

export function getOwnedSessionLearningItem(key: string): string | null {
  return storageItem(
    typeof window === "undefined" ? undefined : window.sessionStorage,
    key,
  );
}

export function setOwnedSessionLearningItem(
  key: string,
  value: string,
  expectedGeneration?: number,
): boolean {
  return setStorageItem(
    typeof window === "undefined" ? undefined : window.sessionStorage,
    key,
    value,
    expectedGeneration,
  );
}

export function removeOwnedSessionLearningItem(
  key: string,
  expectedGeneration?: number,
): void {
  removeStorageItem(
    typeof window === "undefined" ? undefined : window.sessionStorage,
    key,
    expectedGeneration,
  );
}

function prefixedKeys(storage: Storage, prefix: string): string[] {
  return Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => key !== null && key.startsWith(prefix));
}

function removePrefixedKeys(storage: Storage, prefix: string): void {
  for (const key of prefixedKeys(storage, prefix)) {
    storage.removeItem(key);
  }
}

function valueBelongsToCutover(
  key: string,
  raw: string | null,
  marker: AccountLearningCutover,
): boolean {
  if (raw === null) return false;
  const accountId = accountIdFromStorageKey(key);
  return (
    accountId !== null &&
    parsedStoredAccountValue(raw, marker, accountId) !== null
  );
}

function clearAndVerifyStalePrefixedKeys(
  storage: Storage,
  prefix: string,
  marker: AccountLearningCutover,
): boolean {
  try {
    for (const key of prefixedKeys(storage, prefix)) {
      if (!valueBelongsToCutover(key, storage.getItem(key), marker)) {
        storage.removeItem(key);
      }
    }
    return !prefixedKeys(storage, prefix).some(
      (key) => !valueBelongsToCutover(key, storage.getItem(key), marker),
    );
  } catch {
    return false;
  }
}

/** Remove only one verified account's local and tab-session learning data. */
export function clearAccountLearningStorage(accountId: string): void {
  if (typeof window === "undefined") return;
  const prefix = accountPrefix(accountId);
  try {
    removePrefixedKeys(window.localStorage, prefix);
  } catch {
    // Other tabs repeat the account-bound cleanup through deletion control.
  }
  try {
    removePrefixedKeys(window.sessionStorage, prefix);
  } catch {
    // Session storage can be unavailable independently.
  }
}

/**
 * Remove account values older than the durable global/account generation
 * floors while preserving anonymous learning and already-current account data.
 */
export function clearAllAccountLearningStorage(
  lease: AccountDeletionLockLease,
): boolean {
  if (
    typeof window === "undefined" ||
    !isAccountDeletionOriginLockLeaseActive(lease)
  ) {
    return false;
  }
  const cutover = readAccountLearningCutover();
  if (!cutover) return false;
  const localCleared = clearAndVerifyStalePrefixedKeys(
    window.localStorage,
    ACCOUNT_LEARNING_STORAGE_PREFIX,
    cutover,
  );
  const sessionCleared = clearAndVerifyStalePrefixedKeys(
    window.sessionStorage,
    ACCOUNT_LEARNING_STORAGE_PREFIX,
    cutover,
  );
  return localCleared && sessionCleared;
}

export function beginAccountLearningCutoverRecovery(
  lease: AccountDeletionLockLease,
): string | null {
  if (!isAccountDeletionOriginLockLeaseActive(lease)) return null;
  const inspected = inspectAccountLearningCutover();
  const previous = inspected.kind === "valid" ? inspected.marker : null;
  if (previous?.generation === Number.MAX_SAFE_INTEGER) return null;

  const generation = previous ? previous.generation + 1 : 2;
  const epoch = newCutoverEpoch();
  const marker: AccountLearningCutover = {
    version: 3,
    lineage: previous?.lineage ?? newCutoverEpoch(),
    generation,
    minimumGeneration: generation,
    epoch,
    phase: "recovery-in-progress",
    // The new global floor invalidates every prior account generation. Old
    // per-account floors and legacy epochs are redundant, retain deleted UUIDs,
    // and would otherwise impose permanent capacity ceilings.
    retiredAccounts: [],
    legacyCutovers: [],
  };
  return persistAccountLearningCutover(marker) ? marker.epoch : null;
}

function clearRetiredAccountStorage(
  storage: Storage,
  deletedPrefix: string,
): boolean {
  try {
    // Re-enumeration catches an old tab that finished a synchronous stale write
    // during the first pass. The stale writer's own postflight performs the
    // same exact-value cleanup if it lands after this verification.
    for (let pass = 0; pass < 2; pass += 1) {
      removePrefixedKeys(storage, deletedPrefix);
    }
    return prefixedKeys(storage, deletedPrefix).length === 0;
  } catch {
    return false;
  }
}

function retireAccountAtGeneration(
  retirements: readonly AccountRetirement[],
  accountId: string,
  generation: number,
): readonly AccountRetirement[] | null {
  const accountHash = accountRetirementHash(accountId);
  const retained = retirements.filter(
    (entry) => entry.accountHash !== accountHash,
  );
  if (retained.length >= MAX_RETIRED_ACCOUNTS) return null;
  return [...retained, { accountHash, minimumGeneration: generation }];
}

function cutoverStillMatches(expected: AccountLearningCutover): boolean {
  const current = readAccountLearningCutover();
  return (
    current !== null &&
    current.phase === expected.phase &&
    current.lineage === expected.lineage &&
    current.generation === expected.generation &&
    current.minimumGeneration === expected.minimumGeneration &&
    current.epoch === expected.epoch
  );
}

function finalizeDeletionCutover(
  marker: AccountLearningCutover,
  accountId: string,
  lease: AccountDeletionLockLease,
): boolean {
  const globalRecovery = marker.minimumGeneration === marker.generation;
  const accountHash = accountRetirementHash(accountId);
  const accountRetired = marker.retiredAccounts.some(
    (entry) =>
      entry.accountHash === accountHash &&
      entry.minimumGeneration === marker.generation,
  );
  if (!globalRecovery && !accountRetired) return false;

  if (globalRecovery) {
    if (!clearAllAccountLearningStorage(lease)) return false;
  } else {
    const deletedPrefix = accountPrefix(accountId);
    if (
      !clearRetiredAccountStorage(window.localStorage, deletedPrefix) ||
      !clearRetiredAccountStorage(window.sessionStorage, deletedPrefix)
    ) {
      return false;
    }
  }
  if (!cutoverStillMatches(marker)) return false;
  return persistAccountLearningCutover({
    ...marker,
    phase: "ready",
  });
}

/**
 * Permanently retires only the deleted account's storage generation under a
 * one-way handle. The raw account identifier is never retained in the durable
 * cutover marker. Other accounts are not re-enveloped, so their exact values
 * and in-flight writes do not collide with a global E1 -> E2 rewrite.
 */
export function rotateAccountLearningCutoverForDeletion(
  accountId: string,
  lease: AccountDeletionLockLease,
): boolean {
  if (
    typeof window === "undefined" ||
    !isAccountDeletionOriginLockLeaseActive(lease)
  ) {
    return false;
  }
  const normalizedAccountId = normalizeAccountId(accountId);
  const normalizedAccountHash = accountRetirementHash(normalizedAccountId);
  const interrupted = readAccountLearningCutover();
  if (interrupted?.phase === "recovery-in-progress") {
    return finalizeDeletionCutover(interrupted, normalizedAccountId, lease);
  }
  const prior = ensureReadyAccountLearningCutover(lease);
  if (!prior || prior.generation >= Number.MAX_SAFE_INTEGER) {
    return false;
  }
  if (
    prior.retiredAccounts.some(
      (entry) =>
        entry.accountHash === normalizedAccountHash &&
        entry.minimumGeneration === prior.generation,
    )
  ) {
    return true;
  }

  const generation = prior.generation + 1;
  const epoch = newCutoverEpoch();
  const retiredAccounts = retireAccountAtGeneration(
    prior.retiredAccounts,
    normalizedAccountId,
    generation,
  );
  // At the bounded retirement capacity, advance the global floor and scrub all
  // account namespaces. This is destructive only to browser-local account
  // caches, preserves anonymous learning, prevents stale resurrection, and
  // restores retirement capacity instead of permanently blocking deletion.
  const globalFallback = retiredAccounts === null;

  const next: AccountLearningCutover = {
    version: 3,
    lineage: prior.lineage,
    generation,
    minimumGeneration: globalFallback ? generation : prior.minimumGeneration,
    epoch,
    phase: "recovery-in-progress",
    // Retain only the deletion that caused a global fallback. The global floor
    // already invalidates every older account generation, while this one
    // record makes confirmation/release replay idempotent.
    retiredAccounts: globalFallback
      ? [
          {
            accountHash: normalizedAccountHash,
            minimumGeneration: generation,
          },
        ]
      : retiredAccounts,
    legacyCutovers: globalFallback ? [] : prior.legacyCutovers,
  };
  if (!persistAccountLearningCutover(next)) return false;
  return finalizeDeletionCutover(next, normalizedAccountId, lease);
}

export function completeAccountLearningCutoverRecovery(
  epoch: string,
  lease: AccountDeletionLockLease,
): boolean {
  if (!isAccountDeletionOriginLockLeaseActive(lease)) return false;
  const marker = readAccountLearningCutover();
  if (
    !marker ||
    marker.phase !== "recovery-in-progress" ||
    marker.epoch !== epoch
  ) {
    return false;
  }
  return persistAccountLearningCutover({
    ...marker,
    phase: "ready",
  });
}

export function getActiveAccountLearningCutoverEpoch(): string | null {
  return currentAccountCutover()?.epoch ?? null;
}

export function getReadyAccountLearningCutoverEpoch(): string | null {
  const marker = readAccountLearningCutover();
  return marker?.phase === "ready" ? marker.epoch : null;
}

export function isAccountLearningCutoverEpochCurrent(epoch: string): boolean {
  const marker = readAccountLearningCutover();
  return marker?.phase === "ready" && marker.epoch === epoch;
}

export function __resetLearningOwnerForTests(
  owner: "unknown" | "anonymous" = "anonymous",
): void {
  localAnonymousOverride = false;
  activeAccountCutover = null;
  context =
    owner === "anonymous"
      ? { kind: "anonymous", generation: 0 }
      : { kind: "unknown", generation: 0 };
}
