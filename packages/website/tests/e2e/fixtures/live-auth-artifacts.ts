import {
  lstatSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const LIVE_AUTH_DIRECTORY_NAME =
  /^loehrning-live-auth-[A-Za-z0-9_-]{6,80}$/;

export function validateLiveAuthStorageStatePath(value: unknown): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error(
      "Live auth requires an absolute E2E_AUTH_STORAGE_STATE.",
    );
  }
  const normalized = path.resolve(value);
  const directory = path.dirname(normalized);
  const temporaryRoot = path.resolve(tmpdir());
  if (
    path.dirname(directory) !== temporaryRoot ||
    !LIVE_AUTH_DIRECTORY_NAME.test(path.basename(directory)) ||
    path.basename(normalized) !== "user.json"
  ) {
    throw new Error(
      "Live auth requires E2E_AUTH_STORAGE_STATE at the exact <os-temp>/loehrning-live-auth-*/user.json boundary.",
    );
  }

  let metadata;
  let realDirectory;
  try {
    metadata = lstatSync(directory);
    realDirectory = realpathSync(directory);
  } catch {
    throw new Error(
      "Live auth requires E2E_AUTH_STORAGE_STATE inside an existing runner-owned temporary directory.",
    );
  }
  const currentUserId =
    typeof process.getuid === "function" ? process.getuid() : null;
  if (
    !metadata.isDirectory() ||
    metadata.isSymbolicLink() ||
    (currentUserId !== null && metadata.uid !== currentUserId) ||
    (metadata.mode & 0o077) !== 0 ||
    path.dirname(realDirectory) !== realpathSync(temporaryRoot) ||
    path.basename(realDirectory) !== path.basename(directory)
  ) {
    throw new Error(
      "Live auth requires a private, real, runner-owned temporary directory; symlinks and shared directories are forbidden.",
    );
  }
  return normalized;
}
