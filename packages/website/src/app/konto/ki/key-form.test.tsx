import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { KeyForm, type StoredKeyState } from "./key-form";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

const COPY = AGENT_ACCOUNT_COPY.de;
const VALID_KEY = `sk-ant-${"a".repeat(40)}`;

const NO_KEY: StoredKeyState = {
  hint: null,
  validatedAt: null,
  unavailable: false,
};
const STORED: StoredKeyState = {
  hint: "9xQ2",
  validatedAt: "2026-09-04T12:00:00.000Z",
  unavailable: false,
};

function renderForm(stored: StoredKeyState = NO_KEY) {
  const onStoredChange = vi.fn();
  render(
    <KeyForm
      locale="de"
      ownerId="owner-1"
      stored={stored}
      onStoredChange={onStoredChange}
    />,
  );
  return { onStoredChange };
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("bring-your-own-key form", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("states the cost and terms boundary before any field", () => {
    renderForm();
    expect(screen.getByText(COPY.keyDisclosure)).toBeInTheDocument();
  });

  it("says no key is stored, and offers only the save action", () => {
    renderForm();
    expect(screen.getByText(COPY.keyMissing)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: COPY.keySave })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.keyDelete }),
    ).not.toBeInTheDocument();
  });

  it("shows only the hint of a stored key, never the key", () => {
    renderForm(STORED);
    expect(screen.getByText(COPY.keyStored("9xQ2"))).toBeInTheDocument();
    expect(
      screen.getByText(/Zuletzt geprüft: 04\.09\.2026, 12:00 UTC/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: COPY.keyReplace })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: COPY.keyDelete })).toBeInTheDocument();
  });

  it("separates an unreadable key state from an absent key", () => {
    renderForm({ hint: null, validatedAt: null, unavailable: true });
    expect(screen.getByText(COPY.keyStateUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(COPY.keyMissing)).not.toBeInTheDocument();
  });

  it("rejects a wrongly shaped key without making a request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    fireEvent.change(screen.getByLabelText(COPY.keyLabel), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.keySave }));
    expect(screen.getByRole("alert")).toHaveTextContent(COPY.keyShapeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores a key and reports the new hint upwards", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ok: true,
        provider: "anthropic",
        hint: "aaaa",
        createdAt: "2026-09-05T10:00:00.000Z",
        validatedAt: "2026-09-05T10:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { onStoredChange } = renderForm();

    fireEvent.change(screen.getByLabelText(COPY.keyLabel), {
      target: { value: VALID_KEY },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.keySave }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(COPY.keySavedNotice),
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/account/llm-key");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      provider: "anthropic",
      apiKey: VALID_KEY,
    });
    expect(onStoredChange).toHaveBeenCalledWith({
      hint: "aaaa",
      validatedAt: "2026-09-05T10:00:00.000Z",
      unavailable: false,
    });
  });

  it("clears the field after a rejected key so no key material lingers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "llm_key_rejected" }, 400)),
    );
    renderForm();
    const field = screen.getByLabelText(COPY.keyLabel) as HTMLInputElement;
    fireEvent.change(field, { target: { value: VALID_KEY } });
    fireEvent.click(screen.getByRole("button", { name: COPY.keySave }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Anthropic hat diesen Schlüssel abgelehnt/,
      ),
    );
    expect(field.value).toBe("");
  });

  it("does not blame the key when the provider was unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: "llm_key_validation_failed" }, 502),
      ),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText(COPY.keyLabel), {
      target: { value: VALID_KEY },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.keySave }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /sagt nichts über den Schlüssel selbst aus/,
      ),
    );
  });

  it("deletes a stored key and clears the hint upwards", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ ok: true, provider: "anthropic", deleted: true }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { onStoredChange } = renderForm(STORED);

    fireEvent.click(screen.getByRole("button", { name: COPY.keyDelete }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        COPY.keyDeletedNotice,
      ),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      provider: "anthropic",
    });
    expect(onStoredChange).toHaveBeenCalledWith({
      hint: null,
      validatedAt: null,
      unavailable: false,
    });
  });

  it("never renders the key field as readable text", () => {
    renderForm();
    const field = screen.getByLabelText(COPY.keyLabel);
    expect(field).toHaveAttribute("type", "password");
    expect(field).toHaveAttribute("autocomplete", "off");
    expect(field.className).toContain("min-h-11");
  });
});
