import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isValidAccountLlmKek } from "@/lib/provider-readiness";
import {
  ACCOUNT_LLM_KEY_MAX_LENGTH,
  ACCOUNT_LLM_KEY_MIN_LENGTH,
  accountLlmKeyHint,
  isAccountLlmKeyShape,
  isAccountLlmProvider,
  type AccountLlmProvider,
} from "./providers";

/**
 * Envelope encryption for a student's own provider key.
 *
 * AES-256-GCM under the deployment key-encryption key in ACCOUNT_LLM_KEK. Two
 * properties matter more than anything else here.
 *
 * 1. The additional authenticated data binds every ciphertext to the account
 *    and the provider it was sealed for. A row copied into another user's
 *    account, or moved to a different provider column, fails the GCM tag check
 *    at decrypt time rather than yielding a usable key. Confidentiality alone
 *    would not give that: without bound AAD, whoever can write a row could
 *    replay someone else's sealed key under their own account and spend it.
 *
 * 2. No function in this module ever puts key material, ciphertext, or key
 *    fragments into an error, a message, or a log line. Failures carry a
 *    fixed reason code from the union below and nothing else, so an exception
 *    that escapes into an error reporter cannot become a key disclosure.
 *
 * The initialisation vector is 12 fresh random bytes per seal, never derived
 * and never reused: GCM loses all confidentiality guarantees on IV reuse under
 * the same key.
 */

const KEK_PREFIX = "kek1_";
const KEK_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const CIPHER = "aes-256-gcm";

/**
 * Version tag in the additional authenticated data. Changing the binding
 * material means changing this string, which makes every older ciphertext fail
 * to open rather than silently decrypting under weaker binding.
 */
const AAD_VERSION = "acct-llm-key.v1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Matches the account_llm_keys.iv column CHECK constraint. */
const IV_TEXT_LENGTH = 16;
/** Matches the account_llm_keys.ciphertext column CHECK constraint. */
const CIPHERTEXT_TEXT_MIN_LENGTH = 32;
const CIPHERTEXT_TEXT_MAX_LENGTH = 1024;

export type AccountKeyEnvelopeErrorReason =
  | "kek_unavailable"
  | "invalid_user_id"
  | "invalid_provider"
  | "invalid_key"
  | "invalid_ciphertext"
  | "decrypt_failed";

export class AccountKeyEnvelopeError extends Error {
  readonly reason: AccountKeyEnvelopeErrorReason;

  constructor(reason: AccountKeyEnvelopeErrorReason) {
    super(`Account key envelope failure: ${reason}`);
    this.name = "AccountKeyEnvelopeError";
    this.reason = reason;
  }
}

export function isAccountKeyEnvelopeError(
  error: unknown,
  reason?: AccountKeyEnvelopeErrorReason,
): error is AccountKeyEnvelopeError {
  if (!(error instanceof AccountKeyEnvelopeError)) return false;
  return reason === undefined || error.reason === reason;
}

/** A sealed key exactly as the three text columns store it. */
export interface SealedAccountKey {
  readonly ciphertext: string;
  readonly iv: string;
  readonly hint: string;
}

export interface SealAccountKeyInput {
  readonly userId: string;
  readonly provider: AccountLlmProvider;
  readonly apiKey: string;
}

export interface OpenAccountKeyInput {
  readonly userId: string;
  readonly provider: AccountLlmProvider;
  readonly ciphertext: string;
  readonly iv: string;
}

function keyEncryptionKey(): Buffer {
  const configured = process.env.ACCOUNT_LLM_KEK;
  if (!configured || !isValidAccountLlmKek(configured)) {
    throw new AccountKeyEnvelopeError("kek_unavailable");
  }
  const material = Buffer.from(configured.slice(KEK_PREFIX.length), "hex");
  if (material.byteLength !== KEK_BYTES) {
    throw new AccountKeyEnvelopeError("kek_unavailable");
  }
  return material;
}

/**
 * Bind a ciphertext to exactly one account and one provider. Both values are
 * validated before they enter the string, so neither can inject a separator
 * and shift the binding onto a different account.
 */
function additionalAuthenticatedData(
  userId: string,
  provider: AccountLlmProvider,
): Buffer {
  return Buffer.from(`${AAD_VERSION}|${userId}|${provider}`, "utf8");
}

function requireBoundIdentity(userId: unknown, provider: unknown): void {
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
    throw new AccountKeyEnvelopeError("invalid_user_id");
  }
  if (!isAccountLlmProvider(provider)) {
    throw new AccountKeyEnvelopeError("invalid_provider");
  }
}

export function sealAccountKey(input: SealAccountKeyInput): SealedAccountKey {
  requireBoundIdentity(input.userId, input.provider);
  if (!isAccountLlmKeyShape(input.provider, input.apiKey)) {
    throw new AccountKeyEnvelopeError("invalid_key");
  }

  const kek = keyEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, kek, iv);
  cipher.setAAD(additionalAuthenticatedData(input.userId, input.provider));
  const body = Buffer.concat([
    cipher.update(input.apiKey, "utf8"),
    cipher.final(),
  ]);
  const sealed = Buffer.concat([body, cipher.getAuthTag()]);

  return {
    ciphertext: sealed.toString("base64url"),
    iv: iv.toString("base64url"),
    hint: accountLlmKeyHint(input.apiKey),
  };
}

function decodeIv(value: unknown): Buffer {
  if (
    typeof value !== "string" ||
    value.length !== IV_TEXT_LENGTH ||
    !BASE64URL_PATTERN.test(value)
  ) {
    throw new AccountKeyEnvelopeError("invalid_ciphertext");
  }
  const iv = Buffer.from(value, "base64url");
  if (iv.byteLength !== IV_BYTES) {
    throw new AccountKeyEnvelopeError("invalid_ciphertext");
  }
  return iv;
}

function decodeSealed(value: unknown): Buffer {
  if (
    typeof value !== "string" ||
    value.length < CIPHERTEXT_TEXT_MIN_LENGTH ||
    value.length > CIPHERTEXT_TEXT_MAX_LENGTH ||
    !BASE64URL_PATTERN.test(value)
  ) {
    throw new AccountKeyEnvelopeError("invalid_ciphertext");
  }
  const sealed = Buffer.from(value, "base64url");
  if (
    sealed.byteLength < AUTH_TAG_BYTES + ACCOUNT_LLM_KEY_MIN_LENGTH ||
    sealed.byteLength > AUTH_TAG_BYTES + ACCOUNT_LLM_KEY_MAX_LENGTH
  ) {
    throw new AccountKeyEnvelopeError("invalid_ciphertext");
  }
  return sealed;
}

/**
 * Open a sealed key for the account and provider it was sealed for. Any
 * mismatch in the binding material, any tampering, and any key-encryption key
 * other than the one that sealed it all end in `decrypt_failed`; the GCM tag
 * check is what makes those cases indistinguishable to a caller, which is
 * exactly the property wanted here.
 */
export function openAccountKey(input: OpenAccountKeyInput): string {
  requireBoundIdentity(input.userId, input.provider);
  const kek = keyEncryptionKey();
  const iv = decodeIv(input.iv);
  const sealed = decodeSealed(input.ciphertext);
  const body = sealed.subarray(0, sealed.byteLength - AUTH_TAG_BYTES);
  const authTag = sealed.subarray(sealed.byteLength - AUTH_TAG_BYTES);

  let apiKey: string;
  try {
    const decipher = createDecipheriv(CIPHER, kek, iv);
    decipher.setAAD(additionalAuthenticatedData(input.userId, input.provider));
    decipher.setAuthTag(authTag);
    apiKey = Buffer.concat([
      decipher.update(body),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // The underlying error object can carry OpenSSL detail and, in some Node
    // builds, buffer contents. It never leaves this function.
    throw new AccountKeyEnvelopeError("decrypt_failed");
  }

  // A tag that verifies proves the bytes are ours. Re-checking the shape
  // catches a stored row written by an older, looser code path rather than
  // handing an unusable value to a provider request.
  if (!isAccountLlmKeyShape(input.provider, apiKey)) {
    throw new AccountKeyEnvelopeError("decrypt_failed");
  }
  return apiKey;
}
