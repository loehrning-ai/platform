"use client";

export const ACCOUNT_DELETION_ORIGIN_LOCK_NAME =
  "loehrning-account-deletion-request-v1";

export type AccountDeletionLockResult<T> =
  | { readonly kind: "acquired"; readonly value: T }
  | { readonly kind: "contended" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "operation-failed"; readonly error: unknown };

declare const ACCOUNT_DELETION_LOCK_LEASE: unique symbol;
export type AccountDeletionLockLease = {
  readonly [ACCOUNT_DELETION_LOCK_LEASE]: true;
};
const activeLeases = new WeakSet<object>();

function getLockManager(): LockManager | null {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return null;
  }
  try {
    return typeof navigator.locks?.request === "function"
      ? navigator.locks
      : null;
  } catch {
    return null;
  }
}

/**
 * Runs one account-deletion/cutover transaction under the origin-global lock.
 * Page requests may refuse contention immediately; recovery queues so a
 * durable fail-closed marker is eventually repaired after the active DELETE
 * releases the lock.
 */
export async function withAccountDeletionOriginLock<T>(
  options: { readonly ifAvailable: boolean },
  operation: (lease: AccountDeletionLockLease) => T | Promise<T>,
): Promise<AccountDeletionLockResult<T>> {
  const manager = getLockManager();
  if (!manager) return { kind: "unavailable" };

  try {
    const lockOptions: LockOptions = options.ifAvailable
      ? { mode: "exclusive", ifAvailable: true }
      : { mode: "exclusive" };
    return await manager.request(
      ACCOUNT_DELETION_ORIGIN_LOCK_NAME,
      lockOptions,
      async (lock) => {
        if (!lock) return { kind: "contended" } as const;
        const lease = {} as AccountDeletionLockLease;
        activeLeases.add(lease);
        try {
          return {
            kind: "acquired",
            value: await operation(lease),
          } as const;
        } catch (error) {
          return { kind: "operation-failed", error } as const;
        } finally {
          activeLeases.delete(lease);
        }
      },
    );
  } catch {
    return { kind: "unavailable" };
  }
}

/**
 * Synchronous storage primitives use this assertion to make unlocked mutation
 * entrypoints fail closed. Only the helper above can establish the scope.
 */
export function isAccountDeletionOriginLockLeaseActive(
  lease: AccountDeletionLockLease,
): boolean {
  return activeLeases.has(lease);
}
