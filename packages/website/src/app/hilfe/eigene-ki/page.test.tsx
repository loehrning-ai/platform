import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getRequestLocale: vi.fn(),
  getAgentRuntimeFeatures: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/runtime-features", () => ({
  getAgentRuntimeFeatures: mocks.getAgentRuntimeFeatures,
}));

import EigeneKiHelpPage, { generateMetadata } from "./page";
import {
  AGENT_HELP_COPY,
  AGENT_HELP_SECTION_IDS,
  AGENT_HELP_SECTION_ORDER,
} from "./eigene-ki-copy";
import { MCP_ENDPOINT_PATH, MCP_RATE_LIMIT_MAX } from "@/lib/mcp/config";
import { ACCOUNT_CHAT_USER_RATE_LIMIT_MAX } from "@/lib/anthropic-chat/config";
import { MAX_ACTIVE_TOKENS } from "@/app/konto/ki/agent-account-contract";
import { absoluteUrl } from "@/lib/seo/entity";

/**
 * Drives the real page. What matters here is the wiring rather than the
 * prose: which regions appear in which readiness state, that the ceilings
 * come from the modules that enforce them, that no offer links to a surface
 * that is switched off, and that the page owns no `main` landmark.
 */

const DE = AGENT_HELP_COPY.de;
const EN = AGENT_HELP_COPY.en;
const SERVER_URL = absoluteUrl(MCP_ENDPOINT_PATH);

const ALL_ON = {
  agentAccess: true,
  oauthServer: true,
  byoChat: true,
  byoChatModels: ["claude-sonnet-4-5"] as readonly string[],
  cvEngineHosted: false,
};
const ALL_OFF = {
  agentAccess: false,
  oauthServer: false,
  byoChat: false,
  byoChatModels: [] as readonly string[],
  cvEngineHosted: false,
};

async function renderPage() {
  const element = await EigeneKiHelpPage();
  return render(element);
}

describe("/hilfe/eigene-ki", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequestLocale.mockResolvedValue("de");
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_ON);
  });

  afterEach(cleanup);

  it("renders the German page with the endpoint address and its own copy control", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: DE.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(SERVER_URL)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `${DE.endpointLabel}: Kopieren`,
      }),
    ).toBeInTheDocument();
  });

  it("renders the English page when the request locale is English", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: EN.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText(DE.title)).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: EN.sectionTitles.tokens }),
    ).toBeInTheDocument();
  });

  it("gives the jump index an accessible name and one link per section", async () => {
    await renderPage();

    const index = screen.getByRole("navigation", { name: DE.indexLabel });
    const links = index.querySelectorAll("a");
    expect(links).toHaveLength(AGENT_HELP_SECTION_ORDER.length);
    for (const key of AGENT_HELP_SECTION_ORDER) {
      expect(
        index.querySelector(
          `a[href="/hilfe/eigene-ki#${AGENT_HELP_SECTION_IDS[key]}"]`,
        ),
      ).not.toBeNull();
    }
  });

  it("gives every section a stable anchor and a heading", async () => {
    const { container } = await renderPage();

    for (const key of AGENT_HELP_SECTION_ORDER) {
      const id = AGENT_HELP_SECTION_IDS[key];
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: DE.sectionTitles[key],
        }),
      ).toBeInTheDocument();
    }
  });

  it("localizes the jump links for the English mirror", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    await renderPage();

    const index = screen.getByRole("navigation", { name: EN.indexLabel });
    expect(
      index.querySelector(
        `a[href="/en/hilfe/eigene-ki#${AGENT_HELP_SECTION_IDS.overview}"]`,
      ),
    ).not.toBeNull();
  });

  it("says the access is live when the surface is ready", async () => {
    await renderPage();

    expect(screen.getByText(DE.statusReady.title)).toBeInTheDocument();
    expect(screen.queryByText(DE.statusOff.title)).toBeNull();
  });

  it("says the access is off in this environment and still keeps the walkthroughs", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_OFF);
    await renderPage();

    expect(screen.getByText(DE.statusOff.title)).toBeInTheDocument();
    expect(screen.queryByText(DE.statusReady.title)).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: DE.sectionTitles.desktop }),
    ).toBeInTheDocument();
    expect(screen.getByText(DE.code.snippet(SERVER_URL))).toBeInTheDocument();
  });

  it("offers no account link while the agent surface is off", async () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_OFF);
    await renderPage();

    expect(
      screen.queryByRole("link", { name: DE.tokens.accountLink }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: DE.privacy.accountLink }),
    ).toBeNull();
  });

  it("links to the account once the agent surface is ready", async () => {
    await renderPage();

    expect(
      screen.getByRole("link", { name: DE.tokens.accountLink }),
    ).toHaveAttribute("href", "/konto/ki");
    expect(
      screen.getByRole("link", { name: DE.privacy.accountLink }),
    ).toHaveAttribute("href", "/konto/ki");
  });

  it("names the grant route as pending only while the OAuth server is off", async () => {
    await renderPage();
    expect(screen.queryByText(DE.tokens.oauthPending)).toBeNull();

    cleanup();
    mocks.getAgentRuntimeFeatures.mockReturnValue({
      ...ALL_ON,
      oauthServer: false,
    });
    await renderPage();
    expect(screen.getByText(DE.tokens.oauthPending)).toBeInTheDocument();
  });

  it("states what a credential unlocks today in every readiness state", async () => {
    // Copy lock updated: the endpoint resolves a bearer now, so the live
    // sentence moved from tokens.bearerPending (empty, and no longer
    // rendered) to tokens.bearerActive. The assertion keeps its intent:
    // both readiness states must still say what a token unlocks.
    await renderPage();
    expect(screen.getByText(DE.tokens.bearerActive)).toBeInTheDocument();

    cleanup();
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_OFF);
    await renderPage();
    expect(screen.getByText(DE.tokens.bearerActive)).toBeInTheDocument();
  });

  it("shows the chat walkthrough only when the chat is configured", async () => {
    await renderPage();
    expect(screen.getByText(DE.chat.cost)).toBeInTheDocument();
    expect(screen.getByText(DE.chat.transcript)).toBeInTheDocument();
    expect(screen.queryByText(DE.chat.offTitle)).toBeNull();

    cleanup();
    mocks.getAgentRuntimeFeatures.mockReturnValue({
      ...ALL_ON,
      byoChat: false,
    });
    await renderPage();
    expect(screen.getByText(DE.chat.offTitle)).toBeInTheDocument();
    expect(screen.queryByText(DE.chat.cost)).toBeNull();
    expect(
      screen.queryByRole("link", { name: DE.chat.accountLink }),
    ).toBeNull();
  });

  it("prints the ceilings the enforcing modules define", async () => {
    await renderPage();

    expect(
      screen.getByText(DE.limits.requests(MCP_RATE_LIMIT_MAX)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DE.limits.tokens(MAX_ACTIVE_TOKENS, 64)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DE.chat.limits(ACCOUNT_CHAT_USER_RATE_LIMIT_MAX, 8)),
    ).toBeInTheDocument();
  });

  it("shows every addressable scheme with a copyable snippet per client", async () => {
    const { container } = await renderPage();

    for (const example of DE.addresses.examples) {
      expect(screen.getByText(example.uri)).toBeInTheDocument();
    }
    // Three client walkthroughs, the token header snippet, and the endpoint
    // address itself all get their own control.
    expect(container.querySelectorAll("pre")).toHaveLength(4);
  });

  it("gives every control on the page a 44 pixel target", async () => {
    const { container } = await renderPage();

    const controls = container.querySelectorAll("a, button");
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.className).toContain("min-h-11");
    }
  });

  it("owns no main landmark", async () => {
    const { container } = await renderPage();
    expect(container.querySelector("main")).toBeNull();
  });

  it("links back to the help overview", async () => {
    await renderPage();
    expect(screen.getByRole("link", { name: DE.backToHelp })).toHaveAttribute(
      "href",
      "/hilfe",
    );
  });
});

describe("/hilfe/eigene-ki metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequestLocale.mockResolvedValue("de");
    mocks.getAgentRuntimeFeatures.mockReturnValue(ALL_ON);
  });

  it("is indexable and canonical to the German path", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe(DE.metadata.title);
    expect(metadata.description).toBe(DE.metadata.description);
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe("/hilfe/eigene-ki");
  });

  it("carries the English canonical and locale on the mirror", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    const metadata = await generateMetadata();

    expect(metadata.title).toBe(EN.metadata.title);
    expect(metadata.alternates?.canonical).toBe("/en/hilfe/eigene-ki");
    expect(metadata.openGraph?.locale).toBe("en_GB");
  });
});
