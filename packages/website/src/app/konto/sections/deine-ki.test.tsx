import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SITE_ORIGIN } from "@/lib/seo/entity";

const mocks = vi.hoisted(() => ({
  isAgentAccessReady: vi.fn(),
}));

vi.mock("@/lib/provider-readiness", () => ({
  isAgentAccessReady: mocks.isAgentAccessReady,
}));

import { DEINE_KI_SECTION_ID, DeineKiSection } from "./deine-ki";
import { AGENT_MCP_PATH, agentMcpEndpoint } from "./region-copy";

const ENDPOINT = `${SITE_ORIGIN}${AGENT_MCP_PATH}`;

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.isAgentAccessReady.mockReturnValue(true);
});

describe("Deine KI region", () => {
  it("renders no markup at all while agent access is off", () => {
    mocks.isAgentAccessReady.mockReturnValue(false);

    const { container } = render(<DeineKiSection />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading", { name: "Deine KI" })).toBeNull();
  });

  it("derives the endpoint from the site origin", () => {
    expect(agentMcpEndpoint()).toBe(ENDPOINT);
    const parsed = new URL(agentMcpEndpoint());
    expect(parsed.origin).toBe(SITE_ORIGIN);
    expect(parsed.protocol).toBe("https:");
    expect(parsed.pathname).toBe(AGENT_MCP_PATH);
  });

  it("shows the endpoint once, with its own copy control", () => {
    const { container } = render(<DeineKiSection />);

    const region = container.querySelector(
      `#${DEINE_KI_SECTION_ID}`,
    ) as HTMLElement;
    expect(region).not.toBeNull();
    expect(
      within(region).getByRole("heading", { level: 2, name: "Deine KI" }),
    ).toBeVisible();
    expect(within(region).getAllByText(ENDPOINT)).toHaveLength(2);
    expect(
      within(region).getByRole("button", { name: "MCP-Endpunkt: Kopieren" }),
    ).toBeVisible();
  });

  it("carries one copyable install snippet per supported client", () => {
    const { container } = render(<DeineKiSection />);

    const region = container.querySelector(
      `#${DEINE_KI_SECTION_ID}`,
    ) as HTMLElement;
    // Claude Desktop takes the bare address in its custom-connector dialog,
    // so its snippet is the endpoint itself and appears alongside the
    // endpoint block above.
    expect(
      within(region).getByText(
        `claude mcp add --transport http loehrning ${ENDPOINT}`,
      ),
    ).toBeVisible();
    expect(
      // Identity normalizer: the TOML table's newline is load-bearing and the
      // default normalizer would collapse it away before comparing.
      within(region).getByText(`[mcp_servers.loehrning]\nurl = "${ENDPOINT}"`, {
        normalizer: (value) => value,
      }),
    ).toBeVisible();

    expect(
      within(region)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "MCP-Endpunkt: Kopieren",
      "Einrichtung für Claude Desktop: Kopieren",
      "Einrichtung für Claude Code: Kopieren",
      "Einrichtung für Codex: Kopieren",
    ]);
  });

  it("states that the endpoint answers nothing without a grant", () => {
    const { container } = render(<DeineKiSection />);

    const region = container.querySelector(
      `#${DEINE_KI_SECTION_ID}`,
    ) as HTMLElement;
    expect(region).toHaveTextContent(
      "Ohne einen Zugang aus deinem Konto beantwortet er keine Anfrage",
    );
    expect(
      within(region).getByRole("link", { name: "Zugänge und Protokoll" }),
    ).toHaveAttribute("href", "/konto/ki");
    expect(
      within(region).getByRole("link", {
        name: "Anleitung: eigene KI verbinden",
      }),
    ).toHaveAttribute("href", "/hilfe/eigene-ki");
  });

  it("keeps every copy control and link at the 44px target floor", () => {
    const { container } = render(<DeineKiSection />);

    const region = container.querySelector(
      `#${DEINE_KI_SECTION_ID}`,
    ) as HTMLElement;
    for (const target of [
      ...within(region).getAllByRole("button"),
      ...within(region).getAllByRole("link"),
    ]) {
      expect(target.className).toContain("min-h-11");
    }
  });

  it("renders the English panel with locale-prefixed links", () => {
    const { container } = render(<DeineKiSection locale="en" />);

    const region = container.querySelector(
      `#${DEINE_KI_SECTION_ID}`,
    ) as HTMLElement;
    expect(
      within(region).getByRole("heading", { level: 2, name: "Your AI" }),
    ).toBeVisible();
    expect(
      within(region).getByRole("link", { name: "Grants and audit trail" }),
    ).toHaveAttribute("href", "/en/konto/ki");
    expect(
      within(region).getByRole("link", {
        name: "Guide: connect your own AI",
      }),
    ).toHaveAttribute("href", "/en/hilfe/eigene-ki");
    // The commands stay identical: a translated command is a broken command.
    expect(
      within(region).getByText(
        `claude mcp add --transport http loehrning ${ENDPOINT}`,
      ),
    ).toBeVisible();
  });
});
