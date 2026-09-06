/**
 * Envelope contract for stored student provider keys.
 *
 * The suite pins the three properties the vault depends on: a round trip under
 * the right binding, a hard failure under any other binding, and errors that
 * carry no key material. The clear key is assembled from fragments so no
 * credential-shaped literal exists in the repository.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccountKeyEnvelopeError,
  isAccountKeyEnvelopeError,
  openAccountKey,
  sealAccountKey,
} from "./envelope";

const KEK = `kek1_${"a1b2c3d4".repeat(8)}`;
const OTHER_KEK = `kek1_${"9f8e7d6c".repeat(8)}`;
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const API_KEY = `${["sk", "ant", "api03"].join("-")}-${"m".repeat(40)}wxyz`;

function withKek(value: string): void {
  vi.stubEnv("ACCOUNT_LLM_KEK", value);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sealAccountKey", () => {
  it("produces column-shaped ciphertext, iv, and hint", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });

    // The three CHECK constraints on public.account_llm_keys, verbatim.
    expect(sealed.ciphertext).toMatch(/^[A-Za-z0-9_-]{32,1024}$/);
    expect(sealed.iv).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(sealed.hint).toMatch(/^[A-Za-z0-9_-]{4}$/);
    expect(sealed.hint).toBe("wxyz");
  });

  it("never emits the clear key inside the sealed row", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    const serialized = JSON.stringify(sealed);
    expect(serialized).not.toContain(API_KEY);
    expect(serialized).not.toContain(API_KEY.slice(0, 24));
    expect(serialized).not.toContain("sk-ant");
  });

  it("uses a fresh initialisation vector for every seal", () => {
    withKek(KEK);
    const first = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    const second = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });

    // Reusing an IV under one key destroys every guarantee GCM makes.
    expect(second.iv).not.toBe(first.iv);
    expect(second.ciphertext).not.toBe(first.ciphertext);
  });

  it("refuses a malformed account id, provider, or key", () => {
    withKek(KEK);
    const attempt = (overrides: Record<string, unknown>) => () =>
      sealAccountKey({
        userId: USER_A,
        provider: "anthropic",
        apiKey: API_KEY,
        ...overrides,
      } as Parameters<typeof sealAccountKey>[0]);

    expect(attempt({ userId: "not-a-uuid" })).toThrow(AccountKeyEnvelopeError);
    expect(attempt({ provider: "openai" })).toThrow(AccountKeyEnvelopeError);
    expect(attempt({ apiKey: "short" })).toThrow(AccountKeyEnvelopeError);
  });

  it("fails closed when the key-encryption key is missing or malformed", () => {
    vi.stubEnv("ACCOUNT_LLM_KEK", "");
    expect(() =>
      sealAccountKey({
        userId: USER_A,
        provider: "anthropic",
        apiKey: API_KEY,
      }),
    ).toThrow(AccountKeyEnvelopeError);

    withKek("kek1_not-hexadecimal");
    try {
      sealAccountKey({
        userId: USER_A,
        provider: "anthropic",
        apiKey: API_KEY,
      });
      expect.unreachable("a malformed key-encryption key must not seal");
    } catch (error) {
      expect(isAccountKeyEnvelopeError(error, "kek_unavailable")).toBe(true);
    }
  });
});

describe("openAccountKey", () => {
  it("returns the clear key for the account and provider it was sealed for", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    expect(
      openAccountKey({
        userId: USER_A,
        provider: "anthropic",
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
      }),
    ).toBe(API_KEY);
  });

  it("refuses a row replayed under another account", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });

    // Whoever can write a row must not be able to spend someone else's key by
    // copying the ciphertext into their own row.
    try {
      openAccountKey({
        userId: USER_B,
        provider: "anthropic",
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
      });
      expect.unreachable("a replayed row must not open");
    } catch (error) {
      expect(isAccountKeyEnvelopeError(error, "decrypt_failed")).toBe(true);
    }
  });

  it("refuses a tampered ciphertext, a swapped iv, and a rotated key", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    const other = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    const flipped =
      (sealed.ciphertext[0] === "A" ? "B" : "A") + sealed.ciphertext.slice(1);

    const open = (ciphertext: string, iv: string) => () =>
      openAccountKey({
        userId: USER_A,
        provider: "anthropic",
        ciphertext,
        iv,
      });

    expect(open(flipped, sealed.iv)).toThrow(AccountKeyEnvelopeError);
    expect(open(sealed.ciphertext, other.iv)).toThrow(AccountKeyEnvelopeError);

    withKek(OTHER_KEK);
    expect(open(sealed.ciphertext, sealed.iv)).toThrow(AccountKeyEnvelopeError);
  });

  it("refuses stored values that do not match the column shapes", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });
    const open = (ciphertext: string, iv: string) => () =>
      openAccountKey({
        userId: USER_A,
        provider: "anthropic",
        ciphertext,
        iv,
      });

    expect(open("!!!not-base64url!!!", sealed.iv)).toThrow(
      AccountKeyEnvelopeError,
    );
    expect(open(sealed.ciphertext, "too-short")).toThrow(
      AccountKeyEnvelopeError,
    );
    expect(open("a".repeat(2000), sealed.iv)).toThrow(AccountKeyEnvelopeError);
  });

  it("keeps key material out of every thrown error", () => {
    withKek(KEK);
    const sealed = sealAccountKey({
      userId: USER_A,
      provider: "anthropic",
      apiKey: API_KEY,
    });

    try {
      openAccountKey({
        userId: USER_B,
        provider: "anthropic",
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
      });
      expect.unreachable("a replayed row must not open");
    } catch (error) {
      const rendered = [
        String(error),
        (error as Error).message,
        (error as Error).stack ?? "",
        JSON.stringify(error, Object.getOwnPropertyNames(error as Error)),
      ].join("\n");
      expect(rendered).not.toContain(API_KEY);
      expect(rendered).not.toContain(sealed.ciphertext);
      expect(rendered).not.toContain(sealed.iv);
      expect(rendered).not.toContain(USER_A);
      expect(rendered).not.toContain(KEK);
    }
  });
});
