/**
 * Abort wiring and the streamed body.
 *
 * The two abort meanings are the point: a deadline is something the student
 * should be told about, a disconnect is not, and the recorded reason is what
 * the loop branches on.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountChatSession } from "./conversation";
import { decodeAccountChatEvent } from "./protocol";
import type { AccountChatStreamEvent } from "./protocol";
import {
  accountChatStreamResponse,
  createAccountChatAbortHandles,
} from "./stream";

function postRequest(): Request {
  return new Request("http://localhost/api/account/chat", {
    method: "POST",
    body: "{}",
  });
}

async function readEvents(response: Response): Promise<AccountChatStreamEvent[]> {
  return (await response.text())
    .split("\n")
    .map((line) => decodeAccountChatEvent(line))
    .filter((event): event is AccountChatStreamEvent => event !== null);
}

describe("createAccountChatAbortHandles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts unaborted with no reason", () => {
    const handles = createAccountChatAbortHandles(postRequest(), 1_000);
    expect(handles.abort.signal.aborted).toBe(false);
    expect(handles.abort.reason()).toBeNull();
    handles.dispose();
  });

  it("aborts with a timeout once the deadline passes", () => {
    const handles = createAccountChatAbortHandles(postRequest(), 1_000);
    vi.advanceTimersByTime(1_000);
    expect(handles.abort.signal.aborted).toBe(true);
    expect(handles.abort.reason()).toBe("timeout");
    handles.dispose();
  });

  it("records a client disconnect as its own reason", () => {
    const handles = createAccountChatAbortHandles(postRequest(), 1_000);
    handles.disconnect();
    expect(handles.abort.reason()).toBe("disconnect");
    handles.dispose();
  });

  it("keeps the first reason when both fire", () => {
    const handles = createAccountChatAbortHandles(postRequest(), 1_000);
    handles.disconnect();
    vi.advanceTimersByTime(5_000);
    expect(handles.abort.reason()).toBe("disconnect");
    handles.dispose();
  });

  it("stops the deadline once the exchange is over", () => {
    const handles = createAccountChatAbortHandles(postRequest(), 1_000);
    handles.dispose();
    vi.advanceTimersByTime(5_000);
    expect(handles.abort.signal.aborted).toBe(false);
  });

  it("follows the request's own abort signal", () => {
    const controller = new AbortController();
    const request = new Request("http://localhost/api/account/chat", {
      method: "POST",
      body: "{}",
      signal: controller.signal,
    });
    const handles = createAccountChatAbortHandles(request, 60_000);
    controller.abort();
    expect(handles.abort.signal.aborted).toBe(true);
    expect(handles.abort.reason()).toBe("disconnect");
    handles.dispose();
  });
});

describe("accountChatStreamResponse", () => {
  it("writes the session's events and closes the body", async () => {
    const session: AccountChatSession = {
      run: async (emit) => {
        emit({ type: "text", text: "Hallo" });
        emit({ type: "done", stopReason: "end_turn" });
      },
    };
    const handles = createAccountChatAbortHandles(postRequest(), 60_000);
    const response = accountChatStreamResponse(session, handles, () => {
      throw new Error("no unhandled error expected");
    });

    expect(await readEvents(response)).toEqual([
      { type: "text", text: "Hallo" },
      { type: "done", stopReason: "end_turn" },
    ]);
  });

  it("reports an unexpected failure and still closes the stream cleanly", async () => {
    const reported: unknown[] = [];
    const session: AccountChatSession = {
      run: async () => {
        throw new Error("something nobody planned for");
      },
    };
    const handles = createAccountChatAbortHandles(postRequest(), 60_000);
    const response = accountChatStreamResponse(session, handles, (error) => {
      reported.push(error);
    });

    expect(await readEvents(response)).toEqual([
      { type: "error", error: "llm_unavailable" },
      { type: "done", stopReason: "failed" },
    ]);
    expect(reported).toHaveLength(1);
  });

  it("treats a cancelled reader as a disconnect", async () => {
    let seen: (() => "timeout" | "disconnect" | null) | null = null;
    const session: AccountChatSession = {
      run: async (emit) => {
        emit({ type: "text", text: "Hallo" });
      },
    };
    const handles = createAccountChatAbortHandles(postRequest(), 60_000);
    seen = handles.abort.reason;
    const response = accountChatStreamResponse(session, handles, () => undefined);

    await response.body?.cancel();

    expect(seen()).toBe("disconnect");
    expect(handles.abort.signal.aborted).toBe(true);
  });
});
