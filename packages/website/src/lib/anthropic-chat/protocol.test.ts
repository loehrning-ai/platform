import { describe, expect, it } from "vitest";
import {
  decodeAccountChatEvent,
  encodeAccountChatEvent,
  toAccountChatStopReason,
} from "./protocol";

describe("account chat wire format", () => {
  it("writes one event per line", () => {
    expect(encodeAccountChatEvent({ type: "text", text: "Hallo" })).toBe(
      '{"type":"text","text":"Hallo"}\n',
    );
  });

  it("round-trips an event", () => {
    const event = { type: "tool", name: "list_courses", ok: true } as const;
    expect(decodeAccountChatEvent(encodeAccountChatEvent(event))).toEqual(event);
  });

  it("carries no prose, so the page owns every sentence", () => {
    const line = encodeAccountChatEvent({
      type: "error",
      error: "llm_busy",
      retryAfter: 12,
    });
    expect(JSON.parse(line)).toEqual({
      type: "error",
      error: "llm_busy",
      retryAfter: 12,
    });
  });

  it("ignores a blank line, a malformed line and an unknown event type", () => {
    expect(decodeAccountChatEvent("   ")).toBeNull();
    expect(decodeAccountChatEvent("{not json")).toBeNull();
    expect(decodeAccountChatEvent("null")).toBeNull();
    expect(decodeAccountChatEvent('{"type":"usage","tokens":4}')).toBeNull();
  });
});

describe("toAccountChatStopReason", () => {
  it("keeps a known reason", () => {
    expect(toAccountChatStopReason("refusal")).toBe("refusal");
    expect(toAccountChatStopReason("max_tokens")).toBe("max_tokens");
  });

  it("treats a reason the installed SDK does not know as a normal end", () => {
    expect(toAccountChatStopReason("model_context_window_exceeded")).toBe(
      "end_turn",
    );
    expect(toAccountChatStopReason(null)).toBe("end_turn");
    expect(toAccountChatStopReason(undefined)).toBe("end_turn");
  });
});
