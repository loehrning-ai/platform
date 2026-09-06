import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { OAuthGrantView, RegionOutcome } from "./account-agent-data";
import { GrantsPanel } from "./grants-panel";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

const COPY = AGENT_ACCOUNT_COPY.de;

const GRANT: OAuthGrantView = {
  clientId: "6b2f4a11-2222-4333-8444-555566667777",
  clientName: "Claude Desktop",
  clientUri: "https://claude.ai",
  scopes: ["progress:read"],
  grantedAt: "2026-09-04T12:00:00.000Z",
};

function renderPanel(
  initial: RegionOutcome<OAuthGrantView>,
  oauthServerReady = true,
) {
  return render(
    <GrantsPanel
      locale="de"
      ownerId="owner-1"
      initial={initial}
      oauthServerReady={oauthServerReady}
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

describe("granted OAuth clients panel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("explains the access-key path when the deployment issues no grants", () => {
    renderPanel({ ok: true, items: [] }, false);
    expect(screen.getByText(COPY.grantsSetupTitle)).toBeInTheDocument();
    expect(screen.queryByText(COPY.grantsEmpty)).not.toBeInTheDocument();
  });

  it("treats a missing OAuth namespace the same way", () => {
    renderPanel({ ok: false, reason: "not-configured" });
    expect(screen.getByText(COPY.grantsSetupTitle)).toBeInTheDocument();
  });

  it("never shows an empty list when the read failed", () => {
    renderPanel({ ok: false, reason: "unavailable" });
    expect(screen.getByRole("alert")).toHaveTextContent(COPY.grantsUnavailable);
    expect(screen.queryByText(COPY.grantsEmpty)).not.toBeInTheDocument();
  });

  it("shows the empty state after a successful read", () => {
    renderPanel({ ok: true, items: [] });
    expect(screen.getByText(COPY.grantsEmpty)).toBeInTheDocument();
  });

  it("lists a grant with its client id, scopes, and moment", () => {
    renderPanel({ ok: true, items: [GRANT] });
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
    expect(screen.getByText(GRANT.clientId)).toBeInTheDocument();
    expect(screen.getByText(/progress:read/)).toBeInTheDocument();
    expect(screen.getByText(/04\.09\.2026, 12:00 UTC/)).toBeInTheDocument();
  });

  it("falls back to the client id when the client registered no name", () => {
    renderPanel({
      ok: true,
      items: [{ ...GRANT, clientName: null, scopes: [] }],
    });
    expect(screen.getAllByText(GRANT.clientId).length).toBe(2);
    expect(screen.getByText(new RegExp(COPY.grantNoScopes))).toBeInTheDocument();
  });

  it("revokes a grant and drops it from the list", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    renderPanel({ ok: true, items: [GRANT] });

    fireEvent.click(screen.getByRole("button", { name: COPY.grantRevoke }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        COPY.grantRevokedNotice,
      ),
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/account/oauth-grants");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      expectedOwnerId: "owner-1",
      clientId: GRANT.clientId,
    });
    expect(screen.getByText(COPY.grantsEmpty)).toBeInTheDocument();
  });

  it("keeps the grant listed when the revocation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "grant_revoke_failed" }, 502)),
    );
    renderPanel({ ok: true, items: [GRANT] });

    fireEvent.click(screen.getByRole("button", { name: COPY.grantRevoke }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/besteht weiter/),
    );
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
  });

  it("gives the list its own accessible name", () => {
    renderPanel({ ok: true, items: [GRANT] });
    expect(
      screen.getByRole("list", { name: COPY.grantsListLabel }),
    ).toBeInTheDocument();
  });
});
