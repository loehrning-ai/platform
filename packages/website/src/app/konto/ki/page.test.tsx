import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AgentAccessEventView } from "./account-agent-data";
import { AGENT_ACCOUNT_COPY } from "./ki-copy";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createAuthServerClient: vi.fn(),
  getRequestLocale: vi.fn(),
  reportApiError: vi.fn(),
  getAgentRuntimeFeatures: vi.fn(),
  fetchAgentAccessEvents: vi.fn(),
  fetchAgentTokens: vi.fn(),
  fetchOAuthGrants: vi.fn(),
  fetchAccountLlmKeySummary: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));
vi.mock("@/lib/runtime-features", () => ({
  getAgentRuntimeFeatures: mocks.getAgentRuntimeFeatures,
}));
vi.mock("./account-agent-data", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("./account-agent-data")
  >();
  return {
    ...actual,
    fetchAgentAccessEvents: mocks.fetchAgentAccessEvents,
    fetchAgentTokens: mocks.fetchAgentTokens,
    fetchOAuthGrants: mocks.fetchOAuthGrants,
  };
});
vi.mock("@/lib/llm-keys/store", () => ({
  fetchAccountLlmKeySummary: mocks.fetchAccountLlmKeySummary,
}));

// The three islands have their own suites. Here they stand in as markers, so
// this file tests the page's own wiring: gating, region order, and what each
// island is handed.
vi.mock("./chat-workbench", () => ({
  ChatWorkbench: (props: {
    models: readonly string[];
    initialKey: { hint: string | null; unavailable: boolean };
    lesson: { uri: string } | null;
  }) => (
    <div data-testid="chat-workbench">
      <span data-testid="chat-models">{props.models.join(",")}</span>
      <span data-testid="chat-hint">{props.initialKey.hint ?? "none"}</span>
      <span data-testid="chat-key-unavailable">
        {String(props.initialKey.unavailable)}
      </span>
      <span data-testid="chat-lesson">{props.lesson?.uri ?? "none"}</span>
    </div>
  ),
}));
vi.mock("./tokens-panel", () => ({
  TokensPanel: (props: { agentAccessReady: boolean; ownerId: string }) => (
    <div data-testid="tokens-panel">
      {String(props.agentAccessReady)}:{props.ownerId}
    </div>
  ),
}));
vi.mock("./grants-panel", () => ({
  GrantsPanel: (props: { oauthServerReady: boolean }) => (
    <div data-testid="grants-panel">{String(props.oauthServerReady)}</div>
  ),
}));

import KontoKiPage from "./page";
import { generateMetadata } from "./layout";

const COPY = AGENT_ACCOUNT_COPY.de;
const USER = { id: "3f4c2f4a-1111-4222-8333-444455556666", email: "a@b.test" };
const REDIRECT = new Error("NEXT_REDIRECT");

const EVENT: AgentAccessEventView = {
  id: "event-1",
  client: "pat:Laptop",
  tool: "get_my_progress",
  ok: true,
  durationMs: 42,
  createdAt: "2026-09-05T07:04:09.000Z",
};

const ALL_ON = {
  agentAccess: true,
  oauthServer: true,
  byoChat: true,
  byoChatModels: ["claude-sonnet-4-5", "claude-haiku-4-5"],
  cvEngineHosted: false,
};
const ALL_OFF = {
  agentAccess: false,
  oauthServer: false,
  byoChat: false,
  byoChatModels: [],
  cvEngineHosted: false,
};

async function renderPage(params: Record<string, unknown> = {}) {
  const element = await KontoKiPage({ searchParams: Promise.resolve(params) });
  return render(element);
}

describe("/konto/ki", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequestLocale.mockResolvedValue("de");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: USER,
      error: undefined,
    });
    mocks.createAuthServerClient.mockResolvedValue({ kind: "auth-client" });
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_ON);
    mocks.fetchAgentAccessEvents.mockResolvedValue({ ok: true, items: [] });
    mocks.fetchAgentTokens.mockResolvedValue({ ok: true, items: [] });
    mocks.fetchOAuthGrants.mockResolvedValue({ ok: true, items: [] });
    mocks.fetchAccountLlmKeySummary.mockResolvedValue({
      ok: true,
      summary: { provider: "anthropic", hint: "9xQ2", createdAt: "2026-09-01T09:00:00.000Z", validatedAt: "2026-09-04T12:00:00.000Z" },
    });
    mocks.redirect.mockImplementation(() => {
      throw REDIRECT;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("sends a signed-out visitor to the login page with a return target", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: undefined,
    });
    await expect(renderPage()).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=/konto/ki");
  });

  it("localises the login return target", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: undefined,
    });
    await expect(renderPage()).rejects.toBe(REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith("/en/login?next=/en/konto/ki");
  });

  it("never signs a learner out because the auth backend is down", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: new Error("supabase down"),
    });
    await renderPage();
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      COPY.accountUnavailableTitle,
    );
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/konto/ki", step: "auth-get-user" }),
    );
    // No empty account regions during an outage.
    expect(screen.queryByTestId("tokens-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.activityEmpty)).not.toBeInTheDocument();
  });

  it("renders the four regions in order with one first-level heading", async () => {
    await renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const regions = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(regions).toEqual([
      COPY.chatHeading,
      COPY.tokensHeading,
      COPY.grantsHeading,
      COPY.activityHeading,
    ]);
  });

  it("gives the section navigation its own accessible name", async () => {
    await renderPage();
    expect(
      screen.getByRole("navigation", { name: COPY.sectionNavigationLabel }),
    ).toBeInTheDocument();
  });

  it("renders no main element, because the app layout owns the only one", async () => {
    const { container } = await renderPage();
    expect(container.querySelector("main")).toBeNull();
  });

  it("shows the endpoint when the agent surface is on", async () => {
    const { container } = await renderPage();
    expect(container.textContent).toContain("/api/mcp");
    expect(screen.queryByText(COPY.endpointOffTitle)).not.toBeInTheDocument();
  });

  it("points the owner at the setup guide beside the address", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: COPY.endpointHelpLink }),
    ).toHaveAttribute("href", "/hilfe/eigene-ki");
  });

  it("localises the setup guide link", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    await renderPage();
    expect(
      screen.getByRole("link", {
        name: AGENT_ACCOUNT_COPY.en.endpointHelpLink,
      }),
    ).toHaveAttribute("href", "/en/hilfe/eigene-ki");
  });

  it("offers no setup guide while the agent surface is off", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_OFF);
    await renderPage();
    expect(
      screen.queryByRole("link", { name: COPY.endpointHelpLink }),
    ).not.toBeInTheDocument();
  });

  it("fails closed: no endpoint and no chat when nothing is configured", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_OFF);
    const { container } = await renderPage();
    expect(screen.getByText(COPY.endpointOffTitle)).toBeInTheDocument();
    expect(container.textContent).not.toContain("/api/mcp");
    expect(screen.getByText(COPY.chatOffTitle)).toBeInTheDocument();
    expect(screen.queryByTestId("chat-workbench")).not.toBeInTheDocument();
    // The two account regions still render: revoking a credential must work
    // even while the surface that would honour it is switched off.
    expect(screen.getByTestId("tokens-panel")).toHaveTextContent("false:");
    expect(screen.getByTestId("grants-panel")).toHaveTextContent("false");
  });

  it("hands the chat its allow-listed models and the stored key hint", async () => {
    await renderPage();
    expect(screen.getByTestId("chat-models")).toHaveTextContent(
      "claude-sonnet-4-5,claude-haiku-4-5",
    );
    expect(screen.getByTestId("chat-hint")).toHaveTextContent("9xQ2");
    expect(screen.getByTestId("chat-key-unavailable")).toHaveTextContent(
      "false",
    );
  });

  it("marks the key state unreadable rather than absent when the read fails", async () => {
    mocks.fetchAccountLlmKeySummary.mockResolvedValue({
      ok: false,
      error: new Error("boom"),
    });
    await renderPage();
    expect(screen.getByTestId("chat-hint")).toHaveTextContent("none");
    expect(screen.getByTestId("chat-key-unavailable")).toHaveTextContent("true");
  });

  it("does not read the key vault while the chat is off", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue({
      ...ALL_ON,
      byoChat: false,
      byoChatModels: [],
    });
    await renderPage();
    expect(mocks.fetchAccountLlmKeySummary).not.toHaveBeenCalled();
  });

  it("does not ask for grants while the OAuth server is unattested", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue({
      ...ALL_ON,
      oauthServer: false,
    });
    await renderPage();
    expect(mocks.fetchOAuthGrants).not.toHaveBeenCalled();
    expect(screen.getByTestId("grants-panel")).toHaveTextContent("false");
  });

  it("passes a valid lesson context through and drops an invalid one", async () => {
    const good = await renderPage({
      lektion: "lesson://ki-fuehrerschein/block-1-1",
    });
    expect(screen.getByTestId("chat-lesson")).toHaveTextContent(
      "lesson://ki-fuehrerschein/block-1-1",
    );
    good.unmount();

    await renderPage({ lektion: "https://example.test/lektion" });
    expect(screen.getByTestId("chat-lesson")).toHaveTextContent("none");
  });

  it("renders the audit trail with UTC moments and an outcome per row", async () => {
    mocks.fetchAgentAccessEvents.mockResolvedValue({
      ok: true,
      items: [EVENT, { ...EVENT, id: "event-2", ok: false, durationMs: 900 }],
    });
    await renderPage();
    expect(screen.getAllByText("05.09.2026, 07:04 UTC")).toHaveLength(2);
    expect(screen.getAllByText("pat:Laptop")).toHaveLength(2);
    expect(screen.getByText(COPY.activityOk)).toBeInTheDocument();
    expect(screen.getByText(COPY.activityFailed)).toBeInTheDocument();
    expect(screen.getByText("900 ms")).toBeInTheDocument();
    expect(screen.getByText(COPY.activityRetention)).toBeInTheDocument();
  });

  it("separates an empty audit trail from an unreadable one", async () => {
    const empty = await renderPage();
    expect(screen.getByText(COPY.activityEmpty)).toBeInTheDocument();
    empty.unmount();

    mocks.fetchAgentAccessEvents.mockResolvedValue({
      ok: false,
      reason: "unavailable",
    });
    await renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent(
      COPY.activityUnavailable,
    );
    expect(screen.queryByText(COPY.activityEmpty)).not.toBeInTheDocument();
  });

  it("treats an unusable auth client as an unreadable account, not an empty one", async () => {
    mocks.createAuthServerClient.mockRejectedValue(new Error("no cookies"));
    await renderPage();
    expect(mocks.fetchAgentAccessEvents).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      COPY.activityUnavailable,
    );
    expect(screen.getByTestId("chat-key-unavailable")).toHaveTextContent("true");
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "auth-create-client" }),
    );
  });

  it("renders the English mirror in English", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: AGENT_ACCOUNT_COPY.en.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: AGENT_ACCOUNT_COPY.en.activityHeading }),
    ).toBeInTheDocument();
  });

  it("keeps the page out of every index", async () => {
    const metadata = await generateMetadata();
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toEqual({ canonical: null });
    expect(metadata.title).toBe(COPY.metadata.title);
  });
});
