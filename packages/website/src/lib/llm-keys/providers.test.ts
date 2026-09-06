/**
 * Accepted key shapes and the derived hint.
 *
 * The shape gate exists so a pasted password, a whole shell command, or a
 * multi-line blob is refused before any network call, and so the four
 * characters stored next to the sealed key always satisfy the
 * account_llm_keys.hint CHECK constraint.
 */

import { describe, expect, it } from "vitest";
import {
  ACCOUNT_LLM_KEY_HINT_PATTERN,
  ACCOUNT_LLM_PROVIDERS,
  AccountLlmKeyHintError,
  accountLlmKeyHint,
  isAccountLlmKeyShape,
  isAccountLlmProvider,
} from "./providers";

const PREFIX = ["sk", "ant", "api03"].join("-");
const VALID_KEY = `${PREFIX}-${"m".repeat(40)}wxyz`;

describe("isAccountLlmProvider", () => {
  it("accepts only the registered providers", () => {
    for (const provider of ACCOUNT_LLM_PROVIDERS) {
      expect(isAccountLlmProvider(provider)).toBe(true);
    }
    for (const value of ["openai", "", "ANTHROPIC", null, undefined, 7, {}]) {
      expect(isAccountLlmProvider(value)).toBe(false);
    }
  });
});

describe("isAccountLlmKeyShape", () => {
  it("accepts a well-formed provider key", () => {
    expect(isAccountLlmKeyShape("anthropic", VALID_KEY)).toBe(true);
  });

  it("refuses everything that is not one", () => {
    const rejected = [
      "",
      "hunter2",
      `${PREFIX}-short`,
      ` ${VALID_KEY}`,
      `${VALID_KEY} `,
      `${VALID_KEY}\n`,
      `curl -H "x-api-key: ${VALID_KEY}"`,
      `${PREFIX}-${"m".repeat(600)}`,
      VALID_KEY.replace("sk-ant-", "sk-oai-"),
      undefined,
      null,
      12345,
      { key: VALID_KEY },
    ];
    for (const value of rejected) {
      expect(isAccountLlmKeyShape("anthropic", value)).toBe(false);
    }
  });
});

describe("accountLlmKeyHint", () => {
  it("returns the last four characters", () => {
    expect(accountLlmKeyHint(VALID_KEY)).toBe("wxyz");
  });

  it("produces a hint that satisfies the stored column shape for every accepted key", () => {
    const accepted = [
      VALID_KEY,
      `${PREFIX}-${"m".repeat(20)}_-Ab`,
      `${PREFIX}-${"m".repeat(16)}`,
      `${PREFIX}-${"m".repeat(480)}`.slice(0, 487),
    ];
    for (const key of accepted) {
      expect(isAccountLlmKeyShape("anthropic", key)).toBe(true);
      expect(accountLlmKeyHint(key)).toMatch(ACCOUNT_LLM_KEY_HINT_PATTERN);
    }
  });

  it("refuses to derive a hint the column would reject", () => {
    // Reached only if the accepted-key pattern and the migration ever drift
    // apart. Failing here beats failing at the INSERT with a sealed key in
    // hand and nowhere to put it.
    expect(() => accountLlmKeyHint("abc def")).toThrow(AccountLlmKeyHintError);
    expect(() => accountLlmKeyHint("ab")).toThrow(AccountLlmKeyHintError);
  });

  it("keeps the key out of the hint failure", () => {
    try {
      accountLlmKeyHint(`${VALID_KEY}!!!!`);
      expect.unreachable("an out-of-shape hint must throw");
    } catch (error) {
      expect((error as Error).message).not.toContain(VALID_KEY);
      expect((error as Error).message).not.toContain("sk-ant");
    }
  });
});
