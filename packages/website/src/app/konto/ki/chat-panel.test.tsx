import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ChatPanel, type ChatLessonContext } from "./chat-panel";
import { CHAT_TRANSCRIPT_STORAGE_KEY } from "./chat-transcript";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

const COPY = AGENT_ACCOUNT_COPY.de;

const store = vi.hoisted(() => new Map<string, string>());
const owner = vi.hoisted(() => ({
  value: { kind: "account", accountId: "owner-1", generation: 1 } as {
    kind: string;
    accountId?: string;
    generation: number;
  },
}));

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => owner.value,
  getOwnedLocalLearningItem: (key: string) => store.get(key) ?? null,
  setOwnedLocalLearningItem: (key: string, value: string) => {
    store.set(key, value);
    return true;
  },
}));

vi.mock("@/lib/progress/use-learning-owner-generation", () => ({
  useLearningOwnerGeneration: () => owner.value.generation,
}));

const LESSON: ChatLessonContext = {
  uri: "lesson://ki-fuehrerschein/block-1-1",
  label: "ki-fuehrerschein · block-1-1",
};

function ndjsonResponse(lines: readonly string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${line}\n`));
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    body,
    json: async () => ({}),
  } as unknown as Response;
}

function errorResponse(code: string, status = 502) {
  return {
    ok: false,
    status,
    body: null,
    json: async () => ({ error: code }),
  } as unknown as Response;
}

function renderPanel(
  overrides: {
    hasKey?: boolean;
    models?: readonly string[];
    lesson?: ChatLessonContext | null;
  } = {},
) {
  return render(
    <ChatPanel
      locale="de"
      ownerId="owner-1"
      models={overrides.models ?? ["claude-sonnet-4-5"]}
      hasKey={overrides.hasKey ?? true}
      lesson={overrides.lesson ?? null}
    />,
  );
}

function ask(question: string) {
  fireEvent.change(screen.getByLabelText(COPY.chatLabel), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole("button", { name: COPY.chatSend }));
}

describe("account chat panel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    store.clear();
    owner.value = { kind: "account", accountId: "owner-1", generation: 1 };
  });

  afterEach(() => {
    cleanup();
  });

  it("starts empty and says where the transcript lives", () => {
    renderPanel();
    expect(screen.getByText(COPY.chatEmpty)).toBeInTheDocument();
    expect(screen.getByText(COPY.chatTranscriptNote)).toBeInTheDocument();
  });

  it("asks for a key before it will send anything", () => {
    renderPanel({ hasKey: false });
    expect(screen.getByText(COPY.chatNeedsKey)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.chatLabel)).toBeDisabled();
    expect(screen.getByRole("button", { name: COPY.chatSend })).toBeDisabled();
  });

  it("streams an answer, records the tools, and persists the transcript", async () => {
    const fetchMock = vi.fn(async () =>
      ndjsonResponse([
        JSON.stringify({ type: "tool", name: "get_lesson", ok: true }),
        JSON.stringify({ type: "text", text: "Ein Sprachmodell " }),
        JSON.stringify({ type: "text", text: "sagt Wörter voraus." }),
        JSON.stringify({ type: "done", stopReason: "end_turn" }),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    ask("Was ist ein Sprachmodell?");
    await waitFor(() =>
      expect(
        screen.getByText("Ein Sprachmodell sagt Wörter voraus."),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(COPY.chatToolUsed("get_lesson")),
    ).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/account/chat");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      locale: "de",
      model: "claude-sonnet-4-5",
      messages: [{ role: "user", content: "Was ist ein Sprachmodell?" }],
    });

    await waitFor(() => {
      const stored = JSON.parse(
        store.get(CHAT_TRANSCRIPT_STORAGE_KEY) ?? "null",
      );
      expect(stored.turns).toHaveLength(2);
      expect(stored.turns[1].content).toBe("Ein Sprachmodell sagt Wörter voraus.");
    });
  });

  it("restores a stored transcript for this account", () => {
    store.set(
      CHAT_TRANSCRIPT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        turns: [
          { id: "a", role: "user", content: "Frühere Frage", tools: [] },
          { id: "b", role: "assistant", content: "Frühere Antwort", tools: [] },
        ],
      }),
    );
    renderPanel();
    expect(screen.getByText("Frühere Frage")).toBeInTheDocument();
    expect(screen.getByText("Frühere Antwort")).toBeInTheDocument();
  });

  it("renders nothing from storage while the account owner is unresolved", () => {
    store.set(
      CHAT_TRANSCRIPT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        turns: [{ id: "a", role: "user", content: "Fremde Frage", tools: [] }],
      }),
    );
    owner.value = { kind: "unknown", generation: 1 };
    renderPanel();
    expect(screen.queryByText("Fremde Frage")).not.toBeInTheDocument();
    expect(screen.getByText(COPY.chatEmpty)).toBeInTheDocument();
  });

  it("maps a refused request to a sentence and leaves no empty answer behind", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => errorResponse("llm_key_rejected")),
    );
    renderPanel();

    ask("Frage");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Anthropic hat deinen gespeicherten Schlüssel abgelehnt/,
      ),
    );
    expect(screen.getAllByText(COPY.chatRoleUser)).toHaveLength(1);
    expect(screen.queryByText(COPY.chatRoleAssistant)).not.toBeInTheDocument();
  });

  it("surfaces a failure that arrives inside the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          JSON.stringify({ type: "text", text: "Teilantwort" }),
          JSON.stringify({ type: "error", error: "llm_timeout" }),
        ]),
      ),
    );
    renderPanel();

    ask("Frage");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /nicht rechtzeitig geantwortet/,
      ),
    );
    expect(screen.getByText("Teilantwort")).toBeInTheDocument();
  });

  it("carries the lesson context and drops it when removed", async () => {
    const fetchMock = vi.fn(async () =>
      ndjsonResponse([
        JSON.stringify({ type: "text", text: "Antwort" }),
        JSON.stringify({ type: "done", stopReason: "end_turn" }),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPanel({ lesson: LESSON });

    expect(
      screen.getByText(COPY.chatLessonChip(LESSON.label)),
    ).toBeInTheDocument();

    ask("Erste Frage");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))
        .lessonUri,
    ).toBe(LESSON.uri);

    fireEvent.click(
      screen.getByRole("button", { name: COPY.chatLessonRemove }),
    );
    expect(
      screen.queryByText(COPY.chatLessonChip(LESSON.label)),
    ).not.toBeInTheDocument();

    ask("Zweite Frage");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse(String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body))
        .lessonUri,
    ).toBeUndefined();
  });

  it("offers a model selector only when more than one model is allowed", () => {
    const single = renderPanel({ models: ["claude-sonnet-4-5"] });
    expect(screen.queryByLabelText(COPY.modelLabel)).not.toBeInTheDocument();
    single.unmount();

    renderPanel({ models: ["claude-sonnet-4-5", "claude-haiku-4-5"] });
    const selector = screen.getByLabelText(COPY.modelLabel);
    expect(selector).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: "claude-haiku-4-5" } });
    expect((selector as HTMLSelectElement).value).toBe("claude-haiku-4-5");
  });

  it("clears the transcript on request and empties the stored copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          JSON.stringify({ type: "text", text: "Antwort" }),
          JSON.stringify({ type: "done", stopReason: "end_turn" }),
        ]),
      ),
    );
    renderPanel();
    ask("Frage");
    await waitFor(() => expect(screen.getByText("Antwort")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: COPY.chatClear }));
    expect(screen.getByText(COPY.chatEmpty)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        JSON.parse(store.get(CHAT_TRANSCRIPT_STORAGE_KEY) ?? "null").turns,
      ).toEqual([]),
    );
  });

  it("replays prior turns as history on the next question", async () => {
    const fetchMock = vi.fn(async () =>
      ndjsonResponse([
        JSON.stringify({ type: "text", text: "Erste Antwort" }),
        JSON.stringify({ type: "done", stopReason: "end_turn" }),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    ask("Erste Frage");
    await waitFor(() =>
      expect(screen.getByText("Erste Antwort")).toBeInTheDocument(),
    );
    ask("Zweite Frage");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const second = JSON.parse(
      String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body),
    );
    expect(second.messages).toEqual([
      { role: "user", content: "Erste Frage" },
      { role: "assistant", content: "Erste Antwort" },
      { role: "user", content: "Zweite Frage" },
    ]);
  });
});
