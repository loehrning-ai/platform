import "server-only";

import { randomBytes } from "node:crypto";
import {
  hashPersonalAccessToken,
  personalAccessTokenDisplayPrefix,
  PERSONAL_ACCESS_TOKEN_PREFIX,
  PERSONAL_ACCESS_TOKEN_SECRET_BYTES,
} from "@/lib/agent-access/personal-tokens";

/**
 * Minting one personal access token.
 *
 * The clear value exists for exactly one response: it is generated here,
 * returned once, and never stored, logged, or exported. What reaches the
 * database is the non-secret display prefix and the SHA-256 digest, which is
 * enough to recognise the token later and useless for producing one.
 *
 * The format, the digest, and the prefix rule all come from
 * `@/lib/agent-access/personal-tokens` rather than being restated here. One
 * definition means a token this route mints and a token the bearer resolver
 * accepts cannot drift apart.
 *
 *   lat_ + base64url(32 random bytes)  =  4 + 43 = 47 characters
 *
 * 32 bytes is 256 bits from the platform CSPRNG, so the space cannot be walked
 * and two minted tokens cannot collide in practice.
 */

/** Active tokens one account may hold at once. */
export const MAX_ACTIVE_AGENT_ACCESS_TOKENS = 5;
/** Owner-chosen label bound; mirrors the column CHECK constraint. */
export const AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH = 64;

export interface MintedPersonalAccessToken {
  /** The clear token. Returned to its owner once and never persisted. */
  readonly token: string;
  /** Non-secret display fragment stored alongside the digest. */
  readonly prefix: string;
  /** Lowercase hex SHA-256 digest of the complete clear token. */
  readonly tokenHash: string;
}

export class PersonalAccessTokenMintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersonalAccessTokenMintError";
  }
}

export async function mintPersonalAccessToken(): Promise<MintedPersonalAccessToken> {
  const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${randomBytes(
    PERSONAL_ACCESS_TOKEN_SECRET_BYTES,
  ).toString("base64url")}`;

  // The resolver's own format check decides whether this value is mintable.
  // A prefix it refuses would produce a token nothing could ever accept, so
  // the mint fails here rather than persisting a dead credential.
  const prefix = personalAccessTokenDisplayPrefix(token);
  if (prefix === null) {
    throw new PersonalAccessTokenMintError(
      "Generated token did not match the personal access token format.",
    );
  }

  return { token, prefix, tokenHash: await hashPersonalAccessToken(token) };
}
