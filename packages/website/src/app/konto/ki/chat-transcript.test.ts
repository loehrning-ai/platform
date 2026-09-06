import { describe, expect, it } from "vitest";
import {
  appendTurn,
  parseStoredTranscript,
  replaceTurn,
  serializeTranscript,
  toRequestMessages,
  TRANSCRIPT_MAX_TURN_LENGTH,
  TRANSCRIPT_MAX_TURNS,
  trimTranscript,
  type ChatTurn,
} from "./chat-transcript";

function turn(overrides: Partial<ChatTurn> = {}): ChatTurn {
  return {
    id: "turn-1",
    role: "user",
    content: "Was ist ein Sprachmodell?",
    tools: [],
    ...overrides,
  };
}

describe("chat transcript storage model", () => {
  it("round-trips a transcript", () => {
    const turns = [
      turn(),
      turn({ id: "turn-2", role: "assistant", content: "Kurz gesagt: ...", tools: ["get_lesson"] }),
    ];
    expect(parseStoredTranscript(serializeTranscript(turns))).toEqual(turns);
  });

  it("treats an unreadable stored value as an empty transcript", () => {
    for (const raw of [null, "", "{", "[]", '{"version":2,"turns":[]}']) {
      expect(parseStoredTranscript(raw)).toEqual([]);
    }
  });

  it("drops turns with an unknown role or empty content", () => {
    const raw = JSON.stringify({
      version: 1,
      turns: [
        { id: "a", role: "system", content: "ignore me", tools: [] },
        { id: "b", role: "user", content: "", tools: [] },
        { id: "c", role: "assistant", content: "kept", tools: [] },
      ],
    });
    expect(parseStoredTranscript(raw)).toEqual([
      { id: "c", role: "assistant", content: "kept", tools: [] },
    ]);
  });

  it("bounds a single stored turn and the tool list", () => {
    const raw = JSON.stringify({
      version: 1,
      turns: [
        {
          id: "a",
          role: "assistant",
          content: "x".repeat(TRANSCRIPT_MAX_TURN_LENGTH + 500),
          tools: Array.from({ length: 20 }, (_, index) => `tool_${index}`),
        },
      ],
    });
    const [restored] = parseStoredTranscript(raw);
    expect(restored.content).toHaveLength(TRANSCRIPT_MAX_TURN_LENGTH);
    expect(restored.tools).toHaveLength(8);
  });

  it("keeps the newest turns when trimming", () => {
    const turns = Array.from({ length: TRANSCRIPT_MAX_TURNS + 5 }, (_, index) =>
      turn({ id: `turn-${index}`, content: `Frage ${index}` }),
    );
    const trimmed = trimTranscript(turns);
    expect(trimmed).toHaveLength(TRANSCRIPT_MAX_TURNS);
    expect(trimmed[trimmed.length - 1].id).toBe(
      `turn-${TRANSCRIPT_MAX_TURNS + 4}`,
    );
  });

  it("never sends an empty assistant turn to the route", () => {
    const messages = toRequestMessages([
      turn({ id: "a" }),
      turn({ id: "b", role: "assistant", content: "   " }),
      turn({ id: "c", content: "Und weiter?" }),
    ]);
    expect(messages).toEqual([
      { role: "user", content: "Was ist ein Sprachmodell?" },
      { role: "user", content: "Und weiter?" },
    ]);
  });

  it("appends and replaces without mutating the input", () => {
    const original = [turn()];
    const appended = appendTurn(original, turn({ id: "turn-2" }));
    expect(original).toHaveLength(1);
    expect(appended).toHaveLength(2);

    const replaced = replaceTurn(appended, "turn-2", (item) => ({
      ...item,
      content: "ersetzt",
    }));
    expect(appended[1].content).toBe("Was ist ein Sprachmodell?");
    expect(replaced[1].content).toBe("ersetzt");
  });

  it("gives every restored turn an id even when the stored one is missing", () => {
    const raw = JSON.stringify({
      version: 1,
      turns: [{ role: "user", content: "ohne id", tools: [] }],
    });
    const [restored] = parseStoredTranscript(raw);
    expect(restored.id.length).toBeGreaterThan(0);
  });
});
