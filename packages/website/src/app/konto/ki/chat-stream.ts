/**
 * Reading the account chat's newline-delimited JSON response.
 *
 * The route frames one event per line, so the browser side needs exactly two
 * things: a splitter that reassembles lines across chunk boundaries, and an id
 * generator for the turns being filled in. Both live here rather than inside
 * the panel so they can be tested without a DOM, and so the panel stays a
 * component instead of half a parser.
 */

/**
 * Yield complete lines from a byte stream, in order.
 *
 * A chunk boundary can fall anywhere, including inside a multi-byte character,
 * so the decoder runs in streaming mode and the tail is only flushed once the
 * stream ends. A trailing fragment without a newline is still yielded: a
 * stream that was cut off mid-answer should surrender whatever last complete
 * event it managed to send.
 */
export async function* ndjsonLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        yield buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
      }
    }
    buffer += decoder.decode();
    if (buffer.length > 0) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

let turnCounter = 0;

/**
 * A transcript id that is unique within this page load. It addresses one turn
 * while the stream fills it in and keys its list item; it is never sent to the
 * server and carries no meaning beyond identity.
 */
export function nextTurnId(prefix: string): string {
  turnCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${turnCounter}`;
}
