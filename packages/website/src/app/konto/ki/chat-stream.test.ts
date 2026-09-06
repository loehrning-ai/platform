import { describe, expect, it } from "vitest";
import { ndjsonLines, nextTurnId } from "./chat-stream";

function streamOf(chunks: readonly (string | Uint8Array)[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          typeof chunk === "string" ? encoder.encode(chunk) : chunk,
        );
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const lines: string[] = [];
  for await (const line of ndjsonLines(stream)) lines.push(line);
  return lines;
}

describe("NDJSON line reader", () => {
  it("splits complete lines", async () => {
    expect(await collect(streamOf(['{"a":1}\n{"a":2}\n']))).toEqual([
      '{"a":1}',
      '{"a":2}',
    ]);
  });

  it("reassembles a line split across chunks", async () => {
    expect(await collect(streamOf(['{"a":', "1}\n", '{"b":2}\n']))).toEqual([
      '{"a":1}',
      '{"b":2}',
    ]);
  });

  it("reassembles a multi-byte character split across chunks", async () => {
    // "ä" is two bytes in UTF-8; a naive per-chunk decode would produce two
    // replacement characters instead of the letter.
    const encoded = new TextEncoder().encode('{"t":"ä"}\n');
    expect(
      await collect(streamOf([encoded.slice(0, 8), encoded.slice(8)])),
    ).toEqual(['{"t":"ä"}']);
  });

  it("yields a trailing fragment that never got its newline", async () => {
    expect(await collect(streamOf(['{"a":1}\n{"partial":true}']))).toEqual([
      '{"a":1}',
      '{"partial":true}',
    ]);
  });

  it("yields nothing for an empty stream", async () => {
    expect(await collect(streamOf([]))).toEqual([]);
  });

  it("releases the reader even when the stream errors", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("aborted"));
      },
    });
    await expect(collect(stream)).rejects.toThrow("aborted");
    // A released lock is what lets the caller cancel the body afterwards.
    expect(stream.locked).toBe(false);
  });
});

describe("turn ids", () => {
  it("never repeats within one page load", () => {
    const ids = new Set(
      Array.from({ length: 200 }, () => nextTurnId("assistant")),
    );
    expect(ids.size).toBe(200);
  });

  it("keeps the caller's prefix", () => {
    expect(nextTurnId("user").startsWith("user-")).toBe(true);
  });
});
