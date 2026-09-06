import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { consumeProviderStream } from "./turn";

type RawEvent = Anthropic.RawMessageStreamEvent;

function raw(value: Record<string, unknown>): RawEvent {
  return value as unknown as RawEvent;
}

async function* streamOf(events: readonly RawEvent[]) {
  for (const event of events) yield event;
}

function consume(events: readonly RawEvent[]) {
  const texts: string[] = [];
  return consumeProviderStream(streamOf(events), {
    onText: (text) => texts.push(text),
    signal: new AbortController().signal,
  }).then((turn) => ({ turn, texts }));
}

describe("consumeProviderStream", () => {
  it("keeps the text a block started with and every delta after it", async () => {
    const { turn, texts } = await consume([
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "Hallo" },
      }),
      raw({
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: " Welt" },
      }),
    ]);

    expect(turn.content).toEqual([{ type: "text", text: "Hallo Welt" }]);
    // Only the deltas stream; the opening text is already in the frame.
    expect(texts).toEqual([" Welt"]);
  });

  it("orders the echoed blocks by index, not by arrival", async () => {
    const { turn } = await consume([
      raw({
        type: "content_block_start",
        index: 1,
        content_block: { type: "text", text: "zweitens" },
      }),
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "erstens" },
      }),
    ]);

    expect(turn.content).toEqual([
      { type: "text", text: "erstens" },
      { type: "text", text: "zweitens" },
    ]);
  });

  it("drops an empty text block the provider would refuse on the way back", async () => {
    const { turn } = await consume([
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      }),
    ]);
    expect(turn.content).toEqual([]);
  });

  it("ignores a block kind this route never asked for", async () => {
    const { turn } = await consume([
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "thinking", thinking: "" },
      }),
      raw({
        type: "content_block_delta",
        index: 0,
        delta: { type: "thinking_delta", thinking: "hmm" },
      }),
    ]);
    expect(turn.content).toEqual([]);
    expect(turn.toolUses).toEqual([]);
  });

  it("ignores a tool_use frame without an id or a name", async () => {
    const { turn } = await consume([
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "", name: "list_courses" },
      }),
      raw({
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: "{}" },
      }),
    ]);
    expect(turn.toolUses).toEqual([]);
  });

  it("ignores a delta for a block that never started", async () => {
    const { turn, texts } = await consume([
      raw({
        type: "content_block_delta",
        index: 7,
        delta: { type: "text_delta", text: "orphan" },
      }),
    ]);
    expect(texts).toEqual([]);
    expect(turn.content).toEqual([]);
  });

  it("refuses arguments that parse to something other than an object", async () => {
    const { turn } = await consume([
      raw({
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "toolu_1", name: "list_courses" },
      }),
      raw({
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: "[1,2,3]" },
      }),
    ]);
    expect(turn.toolUses[0]).toEqual({
      id: "toolu_1",
      name: "list_courses",
      input: undefined,
      malformed: true,
    });
  });

  it("stops at the first event once the request is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const texts: string[] = [];
    const turn = await consumeProviderStream(
      streamOf([
        raw({
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "Hallo" },
        }),
      ]),
      { onText: (text) => texts.push(text), signal: controller.signal },
    );

    expect(turn.aborted).toBe(true);
    expect(turn.content).toEqual([]);
    expect(texts).toEqual([]);
  });
});
