/**
 * Response plumbing: the abort wiring and the NDJSON body.
 *
 * The abort controller carries two distinct meanings that must not be
 * confused. A deadline abort is a timeout the student should be told about; a
 * disconnect abort means nobody is listening any more, and writing to a closed
 * stream then is pointless. The recorded reason is what keeps them apart.
 */

import "server-only";

import {
  ACCOUNT_CHAT_DEADLINE_MS,
  ACCOUNT_CHAT_MEDIA_TYPE,
} from "./config";
import type {
  AccountChatAbort,
  AccountChatAbortReason,
  AccountChatSession,
} from "./conversation";
import {
  encodeAccountChatEvent,
  type AccountChatStreamEvent,
} from "./protocol";

export interface AccountChatAbortHandles {
  readonly abort: AccountChatAbort;
  /** Record a client disconnect and stop the exchange. */
  readonly disconnect: () => void;
  /** Release the deadline timer and the disconnect listener. */
  readonly dispose: () => void;
}

/**
 * Wire a request to a single abort controller.
 *
 * The deadline sits below the route's `maxDuration`, so a provider that never
 * answers ends as this route's own named timeout rather than as a platform
 * kill that leaves the browser with a truncated body and no explanation.
 */
export function createAccountChatAbortHandles(
  request: Request,
  deadlineMs: number = ACCOUNT_CHAT_DEADLINE_MS,
): AccountChatAbortHandles {
  const controller = new AbortController();
  let reason: AccountChatAbortReason | null = null;

  const abortWith = (next: AccountChatAbortReason): void => {
    if (reason === null) reason = next;
    if (!controller.signal.aborted) controller.abort();
  };

  const timer = setTimeout(() => abortWith("timeout"), deadlineMs);
  const onClientAbort = (): void => abortWith("disconnect");
  const clientSignal: AbortSignal | undefined = request.signal;
  clientSignal?.addEventListener("abort", onClientAbort, { once: true });

  return {
    abort: { signal: controller.signal, reason: () => reason },
    disconnect: () => abortWith("disconnect"),
    dispose: () => {
      clearTimeout(timer);
      clientSignal?.removeEventListener("abort", onClientAbort);
    },
  };
}

export const ACCOUNT_CHAT_STREAM_HEADERS: Readonly<Record<string, string>> = {
  "Content-Type": `${ACCOUNT_CHAT_MEDIA_TYPE}; charset=utf-8`,
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  // Proxies that buffer a response would defeat the point of streaming.
  "X-Accel-Buffering": "no",
};

/**
 * Turn an opened session into the streamed response.
 *
 * Every write is guarded: once the browser is gone the controller throws on
 * `enqueue`, and a chat that cannot be delivered must still unwind cleanly and
 * release the provider connection.
 */
export function accountChatStreamResponse(
  session: AccountChatSession,
  handles: AccountChatAbortHandles,
  onUnhandledError: (error: unknown) => void,
): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AccountChatStreamEvent): void => {
        try {
          controller.enqueue(encoder.encode(encodeAccountChatEvent(event)));
        } catch {
          // The reader is gone. The loop notices through the abort signal.
        }
      };
      try {
        await session.run(emit);
      } catch (error) {
        // `run` is written not to reject. Reaching here means something
        // genuinely unexpected happened, and the browser still gets a last
        // line it can act on rather than a body that simply stops.
        onUnhandledError(error);
        emit({ type: "error", error: "llm_unavailable" });
        emit({ type: "done", stopReason: "failed" });
      } finally {
        handles.dispose();
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled reader.
        }
      }
    },
    cancel() {
      handles.disconnect();
    },
  });

  return new Response(body, {
    status: 200,
    headers: ACCOUNT_CHAT_STREAM_HEADERS,
  });
}
