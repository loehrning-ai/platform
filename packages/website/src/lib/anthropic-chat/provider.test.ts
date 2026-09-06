/**
 * The provider factory is the one place a client is constructed, and the one
 * place that can accidentally fall back to the operator credential. These
 * tests keep both properties nailed down.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockConstructor, mockCreate } = vi.hoisted(() => ({
  mockConstructor: vi.fn<(options: unknown) => void>(),
  mockCreate: vi.fn<
    (...args: unknown[]) => Promise<AsyncIterable<never>>
  >(async () => ({
    async *[Symbol.asyncIterator]() {
      // An empty stream is enough: this suite is about construction.
    },
  })),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class FakeAnthropic {
    readonly messages: { create: (...args: unknown[]) => unknown };

    constructor(options: unknown) {
      mockConstructor(options);
      this.messages = { create: (...args: unknown[]) => mockCreate(...args) };
    }
  },
}));

import { ACCOUNT_CHAT_DEADLINE_MS } from "./config";
import {
  AccountChatKeyRequiredError,
  createAccountChatProvider,
} from "./provider";

// Split across two lines on purpose. The publication scanner refuses any
// "sk-" run of 20 characters or more, and a validly shaped Anthropic key is
// never shorter than that, so a single pasted literal cannot be both a real
// shape and publishable. The assembled value is what the shape gate sees.
const ANTHROPIC_KEY_PREFIX = "sk-ant-";
const STUDENT_KEY = `${ANTHROPIC_KEY_PREFIX}fake-student-key-0000`;
const OPERATOR_KEY = `${ANTHROPIC_KEY_PREFIX}fake-operator-key-000`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ANTHROPIC_API_KEY", OPERATOR_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createAccountChatProvider", () => {
  it("binds the client to the key it was handed", () => {
    createAccountChatProvider("anthropic", STUDENT_KEY);
    expect(mockConstructor).toHaveBeenCalledWith({
      apiKey: STUDENT_KEY,
      maxRetries: 0,
      timeout: ACCOUNT_CHAT_DEADLINE_MS,
    });
  });

  it("never retries, because every retry bills the student again", () => {
    createAccountChatProvider("anthropic", STUDENT_KEY);
    const options = mockConstructor.mock.calls[0]?.[0] as { maxRetries: number };
    expect(options.maxRetries).toBe(0);
  });

  for (const [label, key] of [
    ["an empty key", ""],
    ["a key of the wrong shape", "not-a-key"],
    ["a whitespace-padded key", ` ${STUDENT_KEY} `],
  ] as const) {
    it(`refuses to build a client for ${label}`, () => {
      expect(() => createAccountChatProvider("anthropic", key)).toThrow(
        AccountChatKeyRequiredError,
      );
      // Constructing without an explicit key is exactly how the SDK would fall
      // back to the operator credential in the environment.
      expect(mockConstructor).not.toHaveBeenCalled();
    });
  }

  it("forwards the abort signal to the provider call", async () => {
    const provider = createAccountChatProvider("anthropic", STUDENT_KEY);
    const controller = new AbortController();
    await provider.createMessageStream(
      {
        model: "claude-haiku-4.5",
        max_tokens: 16,
        messages: [{ role: "user", content: "Hallo" }],
        stream: true,
      },
      { signal: controller.signal },
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true }),
      { signal: controller.signal },
    );
  });
});
