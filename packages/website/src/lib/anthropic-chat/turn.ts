/**
 * One provider turn: raw stream events in, an assistant message out.
 *
 * The accumulator is deliberately hand-written rather than borrowed from an
 * SDK helper. The route has to emit each text delta the instant it arrives,
 * decide what to echo back into the conversation, and tell a tool call whose
 * arguments never parsed apart from one that did. A helper that only resolves
 * a final message cannot do the first, and a helper that throws on malformed
 * arguments cannot do the third.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  toAccountChatStopReason,
  type AccountChatStopReason,
} from "./protocol";

export interface AccountChatToolUse {
  readonly id: string;
  readonly name: string;
  /** Parsed arguments, or `undefined` when the streamed JSON never parsed. */
  readonly input: unknown;
  readonly malformed: boolean;
}

export interface AccountChatAssistantTurn {
  /** Exactly what to append to the conversation as the assistant message. */
  readonly content: readonly Anthropic.ContentBlockParam[];
  readonly toolUses: readonly AccountChatToolUse[];
  readonly stopReason: AccountChatStopReason;
  /** Characters of visible answer text this turn produced. */
  readonly textLength: number;
  /** True when the consumer stopped early because the request was aborted. */
  readonly aborted: boolean;
}

type Accumulated =
  | { readonly kind: "text"; text: string }
  | { readonly kind: "tool_use"; readonly id: string; readonly name: string; json: string };

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function startBlock(raw: unknown): Accumulated | null {
  if (typeof raw !== "object" || raw === null) return null;
  const type = Reflect.get(raw, "type");
  if (type === "text") {
    return { kind: "text", text: readString(Reflect.get(raw, "text")) };
  }
  if (type === "tool_use") {
    const id = readString(Reflect.get(raw, "id"));
    const name = readString(Reflect.get(raw, "name"));
    if (id.length === 0 || name.length === 0) return null;
    return { kind: "tool_use", id, name, json: "" };
  }
  // Thinking and redacted-thinking blocks are not requested by this route and
  // are not echoed back, so they are simply not accumulated.
  return null;
}

function parseToolInput(json: string): {
  readonly input: unknown;
  readonly malformed: boolean;
} {
  const source = json.trim();
  // An empty argument stream is the wire form of "no arguments", not a broken
  // one: tools whose fields are all optional are called exactly like this.
  if (source.length === 0) return { input: {}, malformed: false };
  try {
    const parsed: unknown = JSON.parse(source);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { input: undefined, malformed: true };
    }
    return { input: parsed, malformed: false };
  } catch {
    return { input: undefined, malformed: true };
  }
}

export interface ConsumeProviderStreamOptions {
  /** Called for every text delta, in order, as it arrives. */
  readonly onText: (text: string) => void;
  readonly signal: AbortSignal;
}

/**
 * Drain one provider stream.
 *
 * Breaking out of `for await` closes the iterator, which is how the provider
 * connection is released when the student closes the tab mid-answer.
 */
export async function consumeProviderStream(
  stream: AsyncIterable<Anthropic.RawMessageStreamEvent>,
  options: ConsumeProviderStreamOptions,
): Promise<AccountChatAssistantTurn> {
  const blocks = new Map<number, Accumulated>();
  let stopReason: string | null = null;
  let textLength = 0;
  let aborted = false;

  for await (const event of stream) {
    if (options.signal.aborted) {
      aborted = true;
      break;
    }
    if (event.type === "content_block_start") {
      const started = startBlock(event.content_block);
      if (started) blocks.set(event.index, started);
      continue;
    }
    if (event.type === "content_block_delta") {
      const block = blocks.get(event.index);
      if (!block) continue;
      const delta = event.delta;
      if (block.kind === "text" && delta.type === "text_delta") {
        block.text += delta.text;
        textLength += delta.text.length;
        options.onText(delta.text);
        continue;
      }
      if (block.kind === "tool_use" && delta.type === "input_json_delta") {
        block.json += delta.partial_json;
      }
      continue;
    }
    if (event.type === "message_delta") {
      stopReason = event.delta.stop_reason ?? stopReason;
    }
  }

  const content: Anthropic.ContentBlockParam[] = [];
  const toolUses: AccountChatToolUse[] = [];
  for (const block of [...blocks.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, value]) => value)) {
    if (block.kind === "text") {
      // The provider rejects an empty text block on the way back in, and an
      // empty block carries nothing anyway.
      if (block.text.length > 0) {
        content.push({ type: "text", text: block.text });
      }
      continue;
    }
    const { input, malformed } = parseToolInput(block.json);
    content.push({
      type: "tool_use",
      id: block.id,
      name: block.name,
      // A block whose arguments never parsed still has to be echoed back with
      // an object, or the conversation cannot continue at all. The empty
      // object is a placeholder; `malformed` is what decides whether the tool
      // actually runs.
      input: malformed ? {} : input,
    });
    toolUses.push({ id: block.id, name: block.name, input, malformed });
  }

  return {
    content,
    toolUses,
    stopReason: toAccountChatStopReason(stopReason),
    textLength,
    aborted,
  };
}
