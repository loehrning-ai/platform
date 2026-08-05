import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateLiveAuthStorageStatePath } from "./fixtures/live-auth-artifacts";

const STATIC_SCAFFOLD_STORAGE_STATE = fileURLToPath(
  new URL("./.auth/user.json", import.meta.url),
);

function validatedLiveStorageStatePath(): string | null {
  if (process.env.E2E_AUTH_LIVE !== "1") {
    return STATIC_SCAFFOLD_STORAGE_STATE;
  }
  if (process.env.E2E_AUTH_PRESERVE_STORAGE_STATE === "1") {
    return null;
  }
  return validateLiveAuthStorageStatePath(
    process.env.E2E_AUTH_STORAGE_STATE,
  );
}

export default async function globalTeardown(): Promise<void> {
  const storageStatePath = validatedLiveStorageStatePath();
  if (storageStatePath) {
    await rm(storageStatePath, { force: true });
  }
}
