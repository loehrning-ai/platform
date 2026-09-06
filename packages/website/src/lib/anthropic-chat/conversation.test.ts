/**
 * The agentic loop, driven by a stand-in provider.
 *
 * The provider is a plain async iterable, exactly the contract the SDK's
 * `Stream` satisfies, so these tests exercise the real accumulation, the real
 * tool budget, and the real abort handling without a network call or a key.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

interface StubToolResult {
  readonly text: string;
  readonly isError: boolean;
  readonly truncated: boolean;
}

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn<
    (name: string, input: unknown, context: unknown) => Promise<StubToolResult>
  >(async () => ({
    text: '{"courses":[]}',
    isError: false,
    truncated: false,
  })),
}));

vi.mock("./tools", () => ({
  ACCOUNT_CHAT_TOOLS: [
    {
      name: "list_courses",
      description: "List every course on the platform for the given locale.",
      input_schema: { type: "object", properties: {}, additionalProperties: false },
    },
  ],
  ACCOUNT_CHAT_TOOL_NAMES: ["list_courses"],
  executeAccountChatTool: (name: string, input: unknown, context: unknown) =>
    mockExecute(name, input, context),
  toolBudgetExhaustedResult: () => ({
    text: '{"error":"tool_budget_exhausted"}',
    isError: true,
    truncated: false,
  }),
}));

import {
  startAccountChat,
  type AccountChatAbort,
  type AccountChatProvider,
} from "./conversation";
import { AccountChatError } from "./errors";
import type { AccountChatStreamEvent } from "./protocol";

const USER_ID = "11111111-1111-4111-8111-111111111111";

type RawEvent = Anthropic.RawMessageStreamEvent;

function raw(value: Record<string, unknown>): RawEvent {
  return value as unknown as RawEvent;
}

function textTurn(chunks: readonly string[], stopReason = "end_turn"): RawEvent[] {
  return [
    raw({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }),
    ...chunks.map((text) =>
      raw({
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text },
      }),
    ),
    raw({ type: "content_block_stop", index: 0 }),
    raw({
      type: "message_delta",
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 4 },
    }),
  ];
}

function toolTurn(
  name: string,
  json: string,
  id = "toolu_1",
): RawEvent[] {
  return [
    raw({
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", id, name, input: {} },
    }),
    raw({
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: json },
    }),
    raw({ type: "content_block_stop", index: 0 }),
    raw({
      type: "message_delta",
      delta: { stop_reason: "tool_use", stop_sequence: null },
      usage: { output_tokens: 4 },
    }),
  ];
}

interface StreamHandle {
  readonly iterable: AsyncIterable<RawEvent>;
  readonly state: { closed: boolean; delivered: number };
}

function streamOf(
  events: readonly RawEvent[],
  onDelivered?: (count: number) => void,
): StreamHandle {
  const state = { closed: false, delivered: 0 };
  const iterable: AsyncIterable<RawEvent> = {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        next: async () => {
          if (index >= events.length) {
            return { done: true as const, value: undefined };
          }
          const value = events[index] as RawEvent;
          index += 1;
          state.delivered += 1;
          onDelivered?.(state.delivered);
          return { done: false as const, value };
        },
        return: async () => {
          state.closed = true;
          return { done: true as const, value: undefined };
        },
      };
    },
  };
  return { iterable, state };
}

interface Recorder {
  readonly provider: AccountChatProvider;
  readonly calls: Anthropic.MessageCreateParamsStreaming[];
}

function providerOf(
  turns: readonly (StreamHandle | Error)[],
): Recorder {
  const calls: Anthropic.MessageCreateParamsStreaming[] = [];
  let index = 0;
  return {
    calls,
    provider: {
      createMessageStream: async (params) => {
        calls.push(params);
        const turn = turns[index];
        index += 1;
        if (turn === undefined) throw new Error("provider called too often");
        if (turn instanceof Error) throw turn;
        return turn.iterable;
      },
    },
  };
}

function abortHandles(): {
  readonly abort: AccountChatAbort;
  readonly trigger: (reason: "timeout" | "disconnect") => void;
} {
  const controller = new AbortController();
  let reason: "timeout" | "disconnect" | null = null;
  return {
    abort: { signal: controller.signal, reason: () => reason },
    trigger: (next) => {
      reason ??= next;
      controller.abort();
    },
  };
}

function providerError(status: number, headers?: Record<string, string>): Error {
  const error = new Error("provider rejected the request");
  error.name = "APIError";
  Object.assign(error, { status, headers });
  return error;
}

async function collect(
  turns: readonly (StreamHandle | Error)[],
  options?: {
    readonly abort?: AccountChatAbort;
    readonly maxToolCalls?: number;
  },
): Promise<{
  readonly events: AccountChatStreamEvent[];
  readonly calls: Anthropic.MessageCreateParamsStreaming[];
}> {
  const recorder = providerOf(turns);
  const abort = options?.abort ?? abortHandles().abort;
  const session = await startAccountChat({
    provider: recorder.provider,
    model: "claude-haiku-4.5",
    system: "Du bist der Lernbegleiter.",
    messages: [{ role: "user", content: "Welche Kurse gibt es?" }],
    userId: USER_ID,
    abort,
    ...(options?.maxToolCalls !== undefined
      ? { maxToolCalls: options.maxToolCalls }
      : {}),
  });
  const events: AccountChatStreamEvent[] = [];
  await session.run((event) => events.push(event));
  return { events, calls: recorder.calls };
}

beforeEach(() => {
  mockExecute.mockClear();
  mockExecute.mockResolvedValue({
    text: '{"courses":[]}',
    isError: false,
    truncated: false,
  });
});

describe("startAccountChat", () => {
  it("streams text deltas in order and closes with the stop reason", async () => {
    const { events, calls } = await collect([
      streamOf(textTurn(["Es gibt ", "vier Kurse."])),
    ]);

    expect(events).toEqual([
      { type: "text", text: "Es gibt " },
      { type: "text", text: "vier Kurse." },
      { type: "done", stopReason: "end_turn" },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.stream).toBe(true);
    expect(calls[0]?.model).toBe("claude-haiku-4.5");
    expect(calls[0]?.tool_choice).toBeUndefined();
  });

  it("caches the stable prefix on the system block", async () => {
    const { calls } = await collect([streamOf(textTurn(["Hallo"]))]);
    expect(calls[0]?.system).toEqual([
      {
        type: "text",
        text: "Du bist der Lernbegleiter.",
        cache_control: { type: "ephemeral" },
      },
    ]);
  });

  it("reports a refusal as its own stop reason and not as an empty answer", async () => {
    const { events } = await collect([streamOf(textTurn([], "refusal"))]);

    expect(events).toEqual([{ type: "done", stopReason: "refusal" }]);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("names an answer that carried no text at all", async () => {
    const { events } = await collect([
      streamOf([
        raw({
          type: "message_delta",
          delta: { stop_reason: "end_turn", stop_sequence: null },
          usage: { output_tokens: 0 },
        }),
      ]),
    ]);

    expect(events).toEqual([
      { type: "error", error: "llm_empty_response" },
      { type: "done", stopReason: "end_turn" },
    ]);
  });

  it("runs a tool, feeds the result back, and answers", async () => {
    const { events, calls } = await collect([
      streamOf(toolTurn("list_courses", '{"locale":"de"}')),
      streamOf(textTurn(["Vier Kurse."])),
    ]);

    expect(mockExecute).toHaveBeenCalledWith(
      "list_courses",
      { locale: "de" },
      { userId: USER_ID },
    );
    expect(events).toEqual([
      { type: "tool", name: "list_courses", ok: true },
      { type: "text", text: "Vier Kurse." },
      { type: "done", stopReason: "end_turn" },
    ]);

    const second = calls[1];
    expect(second?.messages).toHaveLength(3);
    expect(second?.messages[1]).toEqual({
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "list_courses",
          input: { locale: "de" },
        },
      ],
    });
    expect(second?.messages[2]).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_1",
          content: '{"courses":[]}',
          is_error: false,
        },
      ],
    });
  });

  it("refuses a tool call whose arguments never parsed", async () => {
    const { events } = await collect([
      streamOf(toolTurn("list_courses", '{"locale":"d')),
      streamOf(textTurn(["Das hat nicht geklappt."])),
    ]);

    // `undefined` fails every tool schema, so nothing runs on half-written
    // arguments.
    expect(mockExecute).toHaveBeenCalledWith("list_courses", undefined, {
      userId: USER_ID,
    });
    expect(events[0]).toEqual({ type: "tool", name: "list_courses", ok: true });
  });

  it("echoes a malformed tool call back with an object the provider accepts", async () => {
    const { calls } = await collect([
      streamOf(toolTurn("list_courses", "not json at all")),
      streamOf(textTurn(["Ich versuche es anders."])),
    ]);

    expect(calls[1]?.messages[1]).toEqual({
      role: "assistant",
      content: [
        { type: "tool_use", id: "toolu_1", name: "list_courses", input: {} },
      ],
    });
  });

  it("marks a failed tool result as an error for the model and the page", async () => {
    mockExecute.mockResolvedValue({
      text: '{"error":"unknown_course"}',
      isError: true,
      truncated: false,
    });

    const { events, calls } = await collect([
      streamOf(toolTurn("list_courses", "{}")),
      streamOf(textTurn(["Den Kurs gibt es nicht."])),
    ]);

    expect(events[0]).toEqual({ type: "tool", name: "list_courses", ok: false });
    const results = calls[1]?.messages[2] as { content: unknown[] };
    expect(results.content[0]).toMatchObject({ is_error: true });
  });

  it("treats an empty argument stream as no arguments", async () => {
    await collect([
      streamOf(toolTurn("list_courses", "")),
      streamOf(textTurn(["Vier Kurse."])),
    ]);
    expect(mockExecute).toHaveBeenCalledWith(
      "list_courses",
      {},
      { userId: USER_ID },
    );
  });

  it("stops at the tool budget and takes the tools away for the last turn", async () => {
    const turns = [
      ...Array.from({ length: 3 }, (_unused, index) =>
        streamOf(toolTurn("list_courses", "{}", `toolu_${index}`)),
      ),
      streamOf(textTurn(["Mehr geht nicht."])),
    ];

    const { events, calls } = await collect(turns, { maxToolCalls: 2 });

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(calls[0]?.tool_choice).toBeUndefined();
    expect(calls[3]?.tool_choice).toEqual({ type: "none" });
    // The tool list stays declared: the conversation already contains
    // tool_use blocks that would otherwise be unresolvable.
    expect(calls[3]?.tools).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: "done", stopReason: "tool_budget" });
    expect(events).toContainEqual({
      type: "tool",
      name: "list_courses",
      ok: false,
    });
  });
});

describe("provider failures", () => {
  it("throws a named error before any header is written", async () => {
    const recorder = providerOf([
      providerError(429, { "retry-after": "42" }),
    ]);

    await expect(
      startAccountChat({
        provider: recorder.provider,
        model: "claude-haiku-4.5",
        system: "Du bist der Lernbegleiter.",
        messages: [{ role: "user", content: "Hallo" }],
        userId: USER_ID,
        abort: abortHandles().abort,
      }),
    ).rejects.toMatchObject({
      name: "AccountChatError",
      code: "llm_busy",
      status: 503,
      retryAfterSeconds: 42,
    });
  });

  it("maps a rejected key to its own status", async () => {
    const recorder = providerOf([providerError(401)]);
    await expect(
      startAccountChat({
        provider: recorder.provider,
        model: "claude-haiku-4.5",
        system: "Du bist der Lernbegleiter.",
        messages: [{ role: "user", content: "Hallo" }],
        userId: USER_ID,
        abort: abortHandles().abort,
      }),
    ).rejects.toBeInstanceOf(AccountChatError);
  });

  it("reports a mid-stream provider rejection in band with a retry hint", async () => {
    const { events } = await collect([
      streamOf(toolTurn("list_courses", "{}")),
      providerError(429, { "retry-after": "7" }),
    ]);

    expect(events).toEqual([
      { type: "tool", name: "list_courses", ok: true },
      { type: "error", error: "llm_busy", retryAfter: 7 },
      { type: "done", stopReason: "failed" },
    ]);
  });
});

describe("aborts", () => {
  it("stops writing and releases the provider stream when the client leaves", async () => {
    const handles = abortHandles();
    // Three events delivered: the block start, the "Hallo" delta, and the
    // "Welt" delta. The loop has already emitted "Hallo" and is about to
    // handle "Welt" when the signal trips, so "Welt" is never written.
    const handle = streamOf(textTurn(["Hallo", "Welt"]), (delivered) => {
      if (delivered === 3) handles.trigger("disconnect");
    });

    const { events } = await collect([handle], { abort: handles.abort });

    expect(events).toEqual([{ type: "text", text: "Hallo" }]);
    expect(handle.state.closed).toBe(true);
  });

  it("does not open another provider turn once the deadline passed during a tool call", async () => {
    const handles = abortHandles();
    mockExecute.mockImplementation(async () => {
      handles.trigger("timeout");
      return { text: '{"courses":[]}', isError: false, truncated: false };
    });

    const { events, calls } = await collect(
      [streamOf(toolTurn("list_courses", "{}"))],
      { abort: handles.abort },
    );

    expect(calls).toHaveLength(1);
    expect(events).toEqual([
      { type: "tool", name: "list_courses", ok: true },
      { type: "error", error: "llm_timeout" },
      { type: "done", stopReason: "aborted" },
    ]);
  });

  it("stays silent when the client left during a tool call", async () => {
    const handles = abortHandles();
    mockExecute.mockImplementation(async () => {
      handles.trigger("disconnect");
      return { text: '{"courses":[]}', isError: false, truncated: false };
    });

    const { events, calls } = await collect(
      [streamOf(toolTurn("list_courses", "{}"))],
      { abort: handles.abort },
    );

    expect(calls).toHaveLength(1);
    expect(events).toEqual([{ type: "tool", name: "list_courses", ok: true }]);
  });

  it("tells the student when the deadline, not the client, ended the answer", async () => {
    const handles = abortHandles();
    const handle = streamOf(textTurn(["Hallo", "Welt"]), (delivered) => {
      if (delivered === 3) handles.trigger("timeout");
    });

    const { events } = await collect([handle], { abort: handles.abort });

    expect(events).toEqual([
      { type: "text", text: "Hallo" },
      { type: "error", error: "llm_timeout" },
      { type: "done", stopReason: "aborted" },
    ]);
  });
});
