"use strict";

/**
 * Verification subprocess preload.
 *
 * Next automatically reads local dotenv files even when the parent process
 * has a minimal environment. Verification must use only its explicit child
 * environment, so these exact runtime dotenv filenames appear absent. Tracked
 * templates such as `.env.example` remain readable by scanners and tests.
 */

const fs = require("node:fs");
const path = require("node:path");
const { fileURLToPath } = require("node:url");

const DOTENV_RUNTIME_FILE =
  /^\.env(?:\.local|\.(?:development|production|test)(?:\.local)?)?$/;

function pathString(candidate) {
  try {
    if (candidate instanceof URL) return fileURLToPath(candidate);
    if (Buffer.isBuffer(candidate)) return candidate.toString();
    return typeof candidate === "string" ? candidate : null;
  } catch {
    return null;
  }
}

function isRuntimeDotenv(candidate) {
  const value = pathString(candidate);
  return value !== null && DOTENV_RUNTIME_FILE.test(path.basename(value));
}

function missingFileError(candidate) {
  const error = new Error(`ENOENT: no such file or directory, stat '${pathString(candidate) ?? ""}'`);
  error.code = "ENOENT";
  error.errno = -2;
  error.syscall = "stat";
  error.path = pathString(candidate) ?? "";
  return error;
}

const originalStatSync = fs.statSync;
const originalReadFileSync = fs.readFileSync;
const originalExistsSync = fs.existsSync;
fs.statSync = function guardedStatSync(candidate, ...args) {
  if (isRuntimeDotenv(candidate)) throw missingFileError(candidate);
  return originalStatSync.call(this, candidate, ...args);
};
fs.readFileSync = function guardedReadFileSync(candidate, ...args) {
  if (isRuntimeDotenv(candidate)) throw missingFileError(candidate);
  return originalReadFileSync.call(this, candidate, ...args);
};
fs.existsSync = function guardedExistsSync(candidate) {
  if (isRuntimeDotenv(candidate)) return false;
  return originalExistsSync.call(this, candidate);
};

if (fs.promises) {
  const originalStat = fs.promises.stat.bind(fs.promises);
  const originalReadFile = fs.promises.readFile.bind(fs.promises);
  fs.promises.stat = async function guardedStat(candidate, ...args) {
    if (isRuntimeDotenv(candidate)) throw missingFileError(candidate);
    return originalStat(candidate, ...args);
  };
  fs.promises.readFile = async function guardedReadFile(candidate, ...args) {
    if (isRuntimeDotenv(candidate)) throw missingFileError(candidate);
    return originalReadFile(candidate, ...args);
  };
}
