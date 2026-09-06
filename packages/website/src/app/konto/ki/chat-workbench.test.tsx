import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ChatWorkbench } from "./chat-workbench";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

const COPY = AGENT_ACCOUNT_COPY.de;
const VALID_KEY = `sk-ant-${"a".repeat(40)}`;

const store = vi.hoisted(() => new Map<string, string>());

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => ({
    kind: "account",
    accountId: "owner-1",
    generation: 1,
  }),
  getOwnedLocalLearningItem: (key: string) => store.get(key) ?? null,
  setOwnedLocalLearningItem: (key: string, value: string) => {
    store.set(key, value);
    return true;
  },
}));
vi.mock("@/lib/progress/use-learning-owner-generation", () => ({
  useLearningOwnerGeneration: () => 1,
}));

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function renderWorkbench(hint: string | null) {
  render(
    <ChatWorkbench
      locale="de"
      ownerId="owner-1"
      models={["claude-sonnet-4-5"]}
      initialKey={{ hint, validatedAt: null, unavailable: false }}
      lesson={null}
    />,
  );
}

describe("chat workbench", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    store.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the chat closed until a key is stored", () => {
    renderWorkbench(null);
    expect(screen.getByText(COPY.keyMissing)).toBeInTheDocument();
    expect(screen.getByText(COPY.chatNeedsKey)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.chatLabel)).toBeDisabled();
  });

  it("opens the chat as soon as the key form reports a stored key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ok: true,
          provider: "anthropic",
          hint: "aaaa",
          createdAt: "2026-09-05T10:00:00.000Z",
          validatedAt: "2026-09-05T10:00:00.000Z",
        }),
      ),
    );
    renderWorkbench(null);

    fireEvent.change(screen.getByLabelText(COPY.keyLabel), {
      target: { value: VALID_KEY },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.keySave }));

    await waitFor(() =>
      expect(screen.getByText(COPY.keyStored("aaaa"))).toBeInTheDocument(),
    );
    expect(screen.queryByText(COPY.chatNeedsKey)).not.toBeInTheDocument();
    expect(screen.getByLabelText(COPY.chatLabel)).toBeEnabled();
  });

  it("closes the chat again when the key is deleted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ ok: true, provider: "anthropic", deleted: true }),
      ),
    );
    renderWorkbench("9xQ2");
    expect(screen.getByLabelText(COPY.chatLabel)).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: COPY.keyDelete }));
    await waitFor(() =>
      expect(screen.getByText(COPY.keyMissing)).toBeInTheDocument(),
    );
    expect(screen.getByText(COPY.chatNeedsKey)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.chatLabel)).toBeDisabled();
  });
});
