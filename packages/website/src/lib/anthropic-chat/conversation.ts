/**
 * The agentic loop of the account chat.
 *
 * Two properties matter more than anything else here.
 *
 * 1. The first provider call happens before the response headers are written,
 *    so a rejected key, an overloaded provider, or a timeout still reaches the
 *    browser as a real HTTP status instead of a 200 that carries bad news in
 *    its body. Everything after that is in-band, because the status is spent.
 * 2. The loop is bounded in both directions: at most `maxToolCalls` tool runs
 *    and at most `maxToolCalls + 2` provider turns. A model that keeps asking
 *    for tools runs out of budget and is told so, rather than spending a
 *    student's money until the platform kills the function.
 */

import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import {
  ACCOUNT_CHAT_MAX_OUTPUT_TOKENS,
  ACCOUNT_CHAT_MAX_TOOL_CALLS,
} from "./config";
import { mapProviderError, type AccountChatError } from "./errors";
import {
  type AccountChatStopReason,
  type AccountChatStreamEvent,
} from "./protocol";
import {
  ACCOUNT_CHAT_TOOLS,
  executeAccountChatTool,
  toolBudgetExhaustedResult,
  type AccountChatToolResult,
} from "./tools";
import { consumeProviderStream, type AccountChatToolUse } from "./turn";

/** Why the request stopped. `null` while it is still running. */
export type AccountChatAbortReason = "timeout" | "disconnect";

export interface AccountChatAbort {
  readonly signal: AbortSignal;
  readonly reason: () => AccountChatAbortReason | null;
}

/**
 * The one call this module makes into a provider. Narrow on purpose: the route
 * supplies an implementation bound to the student's key, and nothing in this
 * module can reach a client it was not handed.
 */
export interface AccountChatProvider {
  createMessageStream(
    params: Anthropic.MessageCreateParamsStreaming,
    options: { readonly signal: AbortSignal },
  ): Promise<AsyncIterable<Anthropic.RawMessageStreamEvent>>;
}

export interface AccountChatRunOptions {
  readonly provider: AccountChatProvider;
  readonly model: string;
  readonly system: string;
  readonly messages: readonly Anthropic.MessageParam[];
  /** Owner of the account. Every audit row is attributed to it. */
  readonly userId: string;
  readonly abort: AccountChatAbort;
  readonly maxToolCalls?: number;
}

export type AccountChatEmit = (event: AccountChatStreamEvent) => void;

export interface AccountChatSession {
  /** Consume the opened stream and finish the exchange. Never rejects. */
  run(emit: AccountChatEmit): Promise<void>;
}

function buildParams(
  options: AccountChatRunOptions,
  messages: readonly Anthropic.MessageParam[],
  toolsExhausted: boolean,
): Anthropic.MessageCreateParamsStreaming {
  return {
    model: options.model,
    max_tokens: ACCOUNT_CHAT_MAX_OUTPUT_TOKENS,
    // Tools render before the system block, so one breakpoint at the end of
    // the system prompt caches the whole stable prefix: the tool definitions
    // and the instructions. The student pays for the conversation, so the
    // saving is theirs.
    system: [
      {
        type: "text",
        text: options.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [...ACCOUNT_CHAT_TOOLS],
    // The tool list stays declared even once the budget is spent, because the
    // conversation already contains tool_use blocks that would otherwise be
    // unresolvable. `none` is what actually stops another call.
    ...(toolsExhausted ? { tool_choice: { type: "none" as const } } : {}),
    messages: [...messages],
    stream: true,
  };
}

/**
 * Open the exchange.
 *
 * Throws an {@link AccountChatError} when the first provider call fails, so
 * the route can answer with a status. Never throws after that point.
 */
export async function startAccountChat(
  options: AccountChatRunOptions,
): Promise<AccountChatSession> {
  const maxToolCalls = options.maxToolCalls ?? ACCOUNT_CHAT_MAX_TOOL_CALLS;
  const history: Anthropic.MessageParam[] = [...options.messages];

  let stream: AsyncIterable<Anthropic.RawMessageStreamEvent>;
  try {
    stream = await options.provider.createMessageStream(
      buildParams(options, history, false),
      { signal: options.abort.signal },
    );
  } catch (error) {
    throw mapProviderError(error, {
      timedOut: options.abort.reason() === "timeout",
    });
  }

  return {
    run: (emit) => runOpenedSession(options, maxToolCalls, history, stream, emit),
  };
}

function emitFailure(emit: AccountChatEmit, failure: AccountChatError): void {
  emit({
    type: "error",
    error: failure.code,
    ...(typeof failure.retryAfterSeconds === "number"
      ? { retryAfter: failure.retryAfterSeconds }
      : {}),
  });
  emit({ type: "done", stopReason: "failed" });
}

async function resolveToolUse(
  use: AccountChatToolUse,
  userId: string,
  budget: { used: number; readonly max: number; exhausted: boolean },
): Promise<AccountChatToolResult> {
  if (use.malformed) {
    // `undefined` fails every tool's object schema, which is exactly the
    // outcome wanted: the call is refused and recorded, and no tool runs on
    // arguments the model never finished writing.
    return executeAccountChatTool(use.name, undefined, { userId });
  }
  if (budget.used >= budget.max) {
    budget.exhausted = true;
    return toolBudgetExhaustedResult();
  }
  budget.used += 1;
  return executeAccountChatTool(use.name, use.input, { userId });
}

async function runOpenedSession(
  options: AccountChatRunOptions,
  maxToolCalls: number,
  history: Anthropic.MessageParam[],
  firstStream: AsyncIterable<Anthropic.RawMessageStreamEvent>,
  emit: AccountChatEmit,
): Promise<void> {
  const budget = { used: 0, max: maxToolCalls, exhausted: false };
  const maxTurns = maxToolCalls + 2;
  let stream = firstStream;
  let textLength = 0;
  // Falling out of the loop rather than breaking out of it means the model
  // never stopped asking for tools, so the budget is the honest reason.
  let stopReason: AccountChatStopReason = "tool_budget";

  const stopForAbort = (): void => {
    if (options.abort.reason() === "disconnect") return;
    emit({ type: "error", error: "llm_timeout" });
    emit({ type: "done", stopReason: "aborted" });
  };

  for (let turn = 0; turn < maxTurns; turn += 1) {
    let assistant;
    try {
      assistant = await consumeProviderStream(stream, {
        onText: (text) => emit({ type: "text", text }),
        signal: options.abort.signal,
      });
    } catch (error) {
      if (options.abort.reason() === "disconnect") return;
      emitFailure(
        emit,
        mapProviderError(error, {
          timedOut: options.abort.reason() === "timeout",
        }),
      );
      return;
    }
    textLength += assistant.textLength;

    if (assistant.aborted) {
      stopForAbort();
      return;
    }
    if (assistant.toolUses.length === 0) {
      stopReason = budget.exhausted ? "tool_budget" : assistant.stopReason;
      break;
    }

    history.push({ role: "assistant", content: [...assistant.content] });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of assistant.toolUses) {
      const result = await resolveToolUse(use, options.userId, budget);
      emit({ type: "tool", name: use.name, ok: !result.isError });
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: result.text,
        is_error: result.isError,
      });
    }
    history.push({ role: "user", content: results });

    if (options.abort.signal.aborted) {
      stopForAbort();
      return;
    }

    try {
      stream = await options.provider.createMessageStream(
        buildParams(options, history, budget.exhausted),
        { signal: options.abort.signal },
      );
    } catch (error) {
      if (options.abort.reason() === "disconnect") return;
      emitFailure(
        emit,
        mapProviderError(error, {
          timedOut: options.abort.reason() === "timeout",
        }),
      );
      return;
    }
  }

  // A turn that produced no visible text at all leaves the page with nothing
  // to render. A refusal is the one case where that is the correct answer.
  if (textLength === 0 && stopReason !== "refusal") {
    emit({ type: "error", error: "llm_empty_response" });
  }
  emit({ type: "done", stopReason });
}
