import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Locale } from "@/lib/i18n/locale";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createAuthServerClient: vi.fn(),
  getRequestLocale: vi.fn(),
  isOAuthServerReady: vi.fn(),
  reportApiError: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  getAuthorizationDetails: vi.fn(),
  approveAuthorization: vi.fn(),
  denyAuthorization: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));
vi.mock("@/lib/provider-readiness", () => ({
  isOAuthServerReady: mocks.isOAuthServerReady,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));

import OAuthConsentPage, { generateMetadata } from "./page";
import { CONSENT_COPY, type ConsentErrorKind } from "./consent-copy";

const AUTHORIZATION_ID = "1f4d2a4e-5b6c-4d7e-8f90-a1b2c3d4e5f6";
const NEXT_REDIRECT = new Error("NEXT_REDIRECT");
const NEXT_NOT_FOUND = new Error("NEXT_NOT_FOUND");

function detailsPayload(overrides: Record<string, unknown> = {}) {
  return {
    authorization_id: AUTHORIZATION_ID,
    redirect_uri: "https://claude.ai/api/mcp/auth_callback",
    client: {
      id: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0",
      name: "Claude Desktop",
      uri: "https://claude.ai",
    },
    user: { id: "learner-1", email: "lernende@example.com" },
    scope: "openid email profile",
    ...overrides,
  };
}

function consentPage(
  params: { authorization_id?: string | string[]; fehler?: string } = {
    authorization_id: AUTHORIZATION_ID,
  },
) {
  return OAuthConsentPage({ searchParams: Promise.resolve(params) });
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.isOAuthServerReady.mockReturnValue(true);
  mocks.getRequestLocale.mockResolvedValue("de" satisfies Locale);
  mocks.getAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: { id: "learner-1", email: "lernende@example.com" },
  });
  mocks.createAuthServerClient.mockResolvedValue({
    auth: {
      oauth: {
        getAuthorizationDetails: mocks.getAuthorizationDetails,
        approveAuthorization: mocks.approveAuthorization,
        denyAuthorization: mocks.denyAuthorization,
      },
    },
  });
  mocks.getAuthorizationDetails.mockResolvedValue({
    data: detailsPayload(),
    error: null,
  });
  mocks.notFound.mockImplementation(() => {
    throw NEXT_NOT_FOUND;
  });
  mocks.redirect.mockImplementation(() => {
    throw NEXT_REDIRECT;
  });
});

describe("OAuth consent page readiness", () => {
  it("does not exist while the OAuth server is unconfirmed", async () => {
    mocks.isOAuthServerReady.mockReturnValue(false);

    await expect(consentPage()).rejects.toBe(NEXT_NOT_FOUND);
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.getAuthorizationDetails).not.toHaveBeenCalled();
  });

  it("stays out of search results in both locales", async () => {
    for (const locale of ["de", "en"] as const) {
      mocks.getRequestLocale.mockResolvedValue(locale);
      const metadata = await generateMetadata();
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.title).toBe(CONSENT_COPY[locale].metadata.title);
    }
  });
});

describe("OAuth consent page sign-in", () => {
  it("sends a signed-out learner through login and back to the same request", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });

    await expect(consentPage()).rejects.toBe(NEXT_REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/login?${new URLSearchParams({
        next: `/oauth/consent?authorization_id=${AUTHORIZATION_ID}`,
      }).toString()}`,
    );
    expect(mocks.getAuthorizationDetails).not.toHaveBeenCalled();
  });

  it("keeps the English learner on the English login route", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });

    await expect(consentPage()).rejects.toBe(NEXT_REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringMatching(/^\/en\/login\?next=/),
    );
  });

  it("renders an outage instead of signing a learner out on an auth failure", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: new Error("supabase down"),
    });

    render(await consentPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "auth-get-user" }),
    );
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["backend-unavailable"]),
    ).toBeInTheDocument();
  });
});

describe("OAuth consent screen", () => {
  it("names the client, its id, the redirect host and one line per scope", async () => {
    render(await consentPage());

    expect(
      screen.getByRole("heading", { level: 1, name: CONSENT_COPY.de.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
    expect(
      screen.getByText("0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0"),
    ).toBeInTheDocument();
    expect(screen.getByText("claude.ai")).toBeInTheDocument();
    for (const scope of ["openid", "email", "profile"] as const) {
      expect(screen.getByText(scope)).toBeInTheDocument();
      expect(
        screen.getByText(CONSENT_COPY.de.scopeLines[scope]),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText(CONSENT_COPY.de.platformAccess),
    ).toBeInTheDocument();
  });

  it("explains an undocumented scope instead of showing a bare token", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: detailsPayload({ scope: "email mcp:write" }),
      error: null,
    });

    render(await consentPage());

    expect(
      screen.getByText(CONSENT_COPY.de.unknownScope("mcp:write")),
    ).toBeInTheDocument();
  });

  it("offers approve and deny as same-origin POST submits with 44px targets", async () => {
    const { container } = render(await consentPage());

    const form = container.querySelector("form");
    expect(form?.getAttribute("method")).toBe("post");
    expect(form?.getAttribute("action")).toBe("/oauth/consent/entscheidung");
    expect(
      container.querySelector('input[name="authorization_id"]'),
    ).toHaveValue(AUTHORIZATION_ID);
    expect(container.querySelector('input[name="sprache"]')).toHaveValue("de");

    const approve = screen.getByRole("button", {
      name: CONSENT_COPY.de.approve,
    });
    const deny = screen.getByRole("button", { name: CONSENT_COPY.de.deny });
    expect(approve).toHaveAttribute("type", "submit");
    expect(approve).toHaveAttribute("name", "entscheidung");
    expect(approve).toHaveAttribute("value", "zustimmen");
    expect(deny).toHaveAttribute("value", "ablehnen");
    for (const control of [approve, deny]) {
      expect(control.className).toContain("min-h-11");
    }
  });

  it("renders the English screen for an English request", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    const { container } = render(await consentPage());

    expect(
      screen.getByRole("heading", { level: 1, name: CONSENT_COPY.en.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONSENT_COPY.en.scopeLines.email),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="sprache"]')).toHaveValue("en");
  });

  it("shows a placeholder instead of an empty field for an unnamed client", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: detailsPayload({
        client: { id: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0" },
        scope: "",
      }),
      error: null,
    });

    render(await consentPage());

    expect(
      screen.getByText(CONSENT_COPY.de.clientNameUnknown),
    ).toBeInTheDocument();
    expect(screen.getByText(CONSENT_COPY.de.noScopes)).toBeInTheDocument();
  });

  it("says an unreadable redirect target is unreadable, not that none exists", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: detailsPayload({ redirect_uri: "not-a-url" }),
      error: null,
    });

    render(await consentPage());

    expect(
      screen.getByText(CONSENT_COPY.de.redirectHostUnknown),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(CONSENT_COPY.de.clientSiteUnknown),
    ).not.toBeInTheDocument();
  });

  it("never renders a client logo fetched from a third party", async () => {
    const { container } = render(await consentPage());

    expect(container.querySelector("img")).toBeNull();
  });
});

describe("OAuth consent page failures", () => {
  const brokenLinks: readonly [
    string,
    { authorization_id?: string | string[] },
    ConsentErrorKind,
  ][] = [
    ["a missing request id", {}, "missing-request"],
    [
      "a malformed request id",
      { authorization_id: "../../admin" },
      "invalid-request",
    ],
    [
      "a repeated request id",
      { authorization_id: [AUTHORIZATION_ID, AUTHORIZATION_ID] },
      "invalid-request",
    ],
  ];

  it.each(brokenLinks)("renders %s without asking the server", async (
    _label,
    params,
    kind,
  ) => {
    render(await consentPage(params));

    expect(mocks.getAuthorizationDetails).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies[kind]),
    ).toBeInTheDocument();
  });

  it("renders an expired request and redirects nowhere", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: null,
      error: { status: 404 },
    });

    render(await consentPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["unknown-request"]),
    ).toBeInTheDocument();
    expect(screen.getByText(CONSENT_COPY.de.errorNextStep)).toBeInTheDocument();
  });

  it("renders a failed decision handed back by the decision route", async () => {
    render(
      await consentPage({
        authorization_id: AUTHORIZATION_ID,
        fehler: "decision-failed",
      }),
    );

    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.getAuthorizationDetails).not.toHaveBeenCalled();
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["decision-failed"]),
    ).toBeInTheDocument();
  });

  it("ignores an error marker it does not render itself", async () => {
    render(
      await consentPage({
        authorization_id: AUTHORIZATION_ID,
        fehler: "beliebiger-text",
      }),
    );

    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
  });

  it("renders an outage when the auth client cannot be built", async () => {
    mocks.createAuthServerClient.mockRejectedValue(new Error("no cookies"));

    render(await consentPage());

    expect(mocks.reportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "auth-create-client" }),
    );
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["backend-unavailable"]),
    ).toBeInTheDocument();
  });

  it("renders an outage when Supabase is not configured at all", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: false,
      user: null,
    });

    render(await consentPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["backend-unavailable"]),
    ).toBeInTheDocument();
  });
});

describe("OAuth consent page existing grant", () => {
  it("follows the redirect the authorization server produced", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: { redirect_url: "https://claude.ai/callback?code=abc&state=xyz" },
      error: null,
    });

    await expect(consentPage()).rejects.toBe(NEXT_REDIRECT);
    expect(mocks.redirect).toHaveBeenCalledWith(
      "https://claude.ai/callback?code=abc&state=xyz",
    );
  });

  it("refuses a redirect target that is not an absolute HTTP address", async () => {
    mocks.getAuthorizationDetails.mockResolvedValue({
      data: { redirect_url: "javascript:alert(1)" },
      error: null,
    });

    render(await consentPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByText(CONSENT_COPY.de.errorBodies["unknown-request"]),
    ).toBeInTheDocument();
  });
});
