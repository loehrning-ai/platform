import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { AgentTokenView, RegionOutcome } from "./account-agent-data";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";
import { TokensPanel } from "./tokens-panel";

const COPY = AGENT_ACCOUNT_COPY.de;

const TOKEN: AgentTokenView = {
  id: "9a4c2f4a-1111-4222-8333-444455556666",
  name: "Claude Desktop",
  prefix: "lat_ab12cd34",
  createdAt: "2026-09-01T09:00:00.000Z",
  lastUsedAt: null,
  revokedAt: null,
};

function ok(items: readonly AgentTokenView[]): RegionOutcome<AgentTokenView> {
  return { ok: true, items };
}

function renderPanel(
  initial: RegionOutcome<AgentTokenView> = ok([]),
  agentAccessReady = true,
) {
  return render(
    <TokensPanel
      locale="de"
      ownerId="owner-1"
      initial={initial}
      agentAccessReady={agentAccessReady}
    />,
  );
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("personal access token panel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the empty state only when the read succeeded", () => {
    renderPanel(ok([]));
    expect(screen.getByText(COPY.tokensEmpty)).toBeInTheDocument();
    expect(screen.queryByText(COPY.tokensUnavailable)).not.toBeInTheDocument();
  });

  it("says the list is unreadable rather than empty when the read failed", () => {
    renderPanel({ ok: false, reason: "unavailable" });
    expect(screen.getAllByText(COPY.tokensUnavailable).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(COPY.tokensEmpty)).not.toBeInTheDocument();
  });

  it("lists an existing token with its prefix and never a secret", () => {
    renderPanel(ok([TOKEN]));
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
    expect(screen.getByText("lat_ab12cd34")).toBeInTheDocument();
    expect(screen.getByText(/01\.09\.2026, 09:00 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/Noch nicht benutzt/)).toBeInTheDocument();
  });

  it("refuses to mint without a name and makes no request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPanel(ok([]));
    fireEvent.click(screen.getByRole("button", { name: COPY.tokenCreate }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      COPY.tokenNameRequired,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mints, shows the clear token once, and adds the row", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          ok: true,
          id: "new-token-id",
          token: "lat_" + "z".repeat(43),
          name: "Codex",
          prefix: "lat_zzzzzzzz",
          createdAt: "2026-09-05T10:00:00.000Z",
        },
        201,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPanel(ok([]));

    fireEvent.change(screen.getByLabelText(COPY.tokenNameLabel), {
      target: { value: "Codex" },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.tokenCreate }));

    await waitFor(() =>
      expect(screen.getByText(COPY.tokenOnceTitle)).toBeInTheDocument(),
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/account/agent-tokens");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      name: "Codex",
    });
    expect(screen.getByText("lat_" + "z".repeat(43))).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("1 von 5 aktiv")).toBeInTheDocument();
  });

  it("hides the clear token again on request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: true,
            id: "t2",
            token: "lat_" + "y".repeat(43),
            name: "Codex",
            prefix: "lat_yyyyyyyy",
            createdAt: "2026-09-05T10:00:00.000Z",
          },
          201,
        ),
      ),
    );
    renderPanel(ok([]));
    fireEvent.change(screen.getByLabelText(COPY.tokenNameLabel), {
      target: { value: "Codex" },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.tokenCreate }));
    await waitFor(() =>
      expect(screen.getByText(COPY.tokenOnceTitle)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: COPY.tokenDismiss }));
    expect(screen.queryByText(COPY.tokenOnceTitle)).not.toBeInTheDocument();
  });

  it("maps a named mint failure to a sentence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "token_limit", limit: 5 }, 409)),
    );
    renderPanel(ok([]));
    fireEvent.change(screen.getByLabelText(COPY.tokenNameLabel), {
      target: { value: "Sechster" },
    });
    fireEvent.click(screen.getByRole("button", { name: COPY.tokenCreate }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Höchstzahl aktiver Schlüssel/,
      ),
    );
  });

  it("revokes a token and keeps the row with its revocation moment", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ok: true,
        id: TOKEN.id,
        revokedAt: "2026-09-06T08:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPanel(ok([TOKEN]));

    fireEvent.click(screen.getByRole("button", { name: COPY.tokenRevoke }));
    await waitFor(() =>
      expect(
        screen.getByText(/Zurückgezogen: 06\.09\.2026, 08:00 UTC/),
      ).toBeInTheDocument(),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      tokenId: TOKEN.id,
    });
    expect(screen.getByText("0 von 5 aktiv")).toBeInTheDocument();
  });

  it("blocks minting while the agent surface is off", () => {
    renderPanel(ok([]), false);
    expect(screen.getByRole("button", { name: COPY.tokenCreate })).toBeDisabled();
    expect(screen.getByLabelText(COPY.tokenNameLabel)).toBeDisabled();
  });

  it("blocks minting at the active ceiling", () => {
    const tokens = Array.from({ length: 5 }, (_, index) => ({
      ...TOKEN,
      id: `token-${index}`,
      name: `Token ${index}`,
    }));
    renderPanel(ok(tokens));
    expect(screen.getByRole("button", { name: COPY.tokenCreate })).toBeDisabled();
    expect(screen.getByText(COPY.tokenLimitReached)).toBeInTheDocument();
  });

  it("keeps every control at the minimum target height", () => {
    renderPanel(ok([TOKEN]));
    for (const control of [
      screen.getByRole("button", { name: COPY.tokenCreate }),
      screen.getByRole("button", { name: COPY.tokenRevoke }),
      screen.getByLabelText(COPY.tokenNameLabel),
    ]) {
      expect(control.className).toContain("min-h-11");
    }
  });
});
