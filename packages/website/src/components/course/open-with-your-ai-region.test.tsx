import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getAgentRuntimeFeatures: vi.fn(),
}));

vi.mock("@/lib/runtime-features", () => ({
  getAgentRuntimeFeatures: mocks.getAgentRuntimeFeatures,
}));

import { OpenWithYourAiRegion } from "./open-with-your-ai-region";
import { OPEN_WITH_YOUR_AI_COPY } from "./open-with-your-ai-copy";
import { MCP_ENDPOINT_PATH } from "@/lib/mcp/config";
import { absoluteUrl } from "@/lib/seo/entity";

/**
 * The gate is the point of this module: an offer that leads to an address
 * answering 503 is worse than no offer at all, and the readiness predicate
 * only exists on the server.
 */

const RESOURCES = [
  { uri: "workshop://ki-prognosen-einschaetzen", title: "Prognosen" },
] as const;

const ON = {
  agentAccess: true,
  oauthServer: false,
  byoChat: false,
  byoChatModels: [] as readonly string[],
  cvEngineHosted: false,
};

describe("<OpenWithYourAiRegion>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAgentRuntimeFeatures.mockReturnValue(ON);
  });

  afterEach(cleanup);

  it("renders the island with the canonical endpoint address when the surface is ready", () => {
    render(
      <OpenWithYourAiRegion
        kind="workshop"
        contextTitle="KI-Prognosen einschätzen"
        resources={RESOURCES}
        locale="de"
      />,
    );

    expect(
      screen.getByRole("region", { name: OPEN_WITH_YOUR_AI_COPY.de.label }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(absoluteUrl(MCP_ENDPOINT_PATH)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: OPEN_WITH_YOUR_AI_COPY.de.helpLink }),
    ).toHaveAttribute("href", "/hilfe/eigene-ki");
  });

  it("localizes the setup link for the English surface", () => {
    render(
      <OpenWithYourAiRegion
        kind="workshop"
        contextTitle="Reading AI forecasts"
        resources={RESOURCES}
        locale="en"
      />,
    );

    expect(
      screen.getByRole("link", { name: OPEN_WITH_YOUR_AI_COPY.en.helpLink }),
    ).toHaveAttribute("href", "/en/hilfe/eigene-ki");
  });

  it("renders nothing when the agent surface is not ready", () => {
    mocks.getAgentRuntimeFeatures.mockReturnValue({
      ...ON,
      agentAccess: false,
    });

    const { container } = render(
      <OpenWithYourAiRegion
        kind="workshop"
        contextTitle="KI-Prognosen einschätzen"
        resources={RESOURCES}
        locale="de"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the page has no addressable resource", () => {
    const { container } = render(
      <OpenWithYourAiRegion
        kind="lesson"
        contextTitle="Ein Kurs ohne Lektionskörper"
        resources={[]}
        locale="de"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(mocks.getAgentRuntimeFeatures).not.toHaveBeenCalled();
  });
});
