import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { trackLoginGateMock } = vi.hoisted(() => ({
  trackLoginGateMock: vi.fn(),
}));

vi.mock("@/lib/analytics/events", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/analytics/events")>();
  return { ...actual, trackLoginGate: trackLoginGateMock };
});

import { LoginGateSignal } from "./login-gate-signal";

afterEach(() => {
  vi.clearAllMocks();
});

describe("<LoginGateSignal>", () => {
  it.each([
    ["progress-save", "progress_save"],
    ["kurs-login", "kurs_login"],
    ["anderes-geraet", "anderes_geraet"],
    ["abgelaufen", "abgelaufen"],
    ["ungueltig", "ungueltig"],
    ["auth-not-configured", "auth_not_configured"],
    ["auth-unavailable", "auth_unavailable"],
    ["missing-code", "missing_code"],
    ["invalid-link", "invalid_link"],
    ["untrusted-origin", "untrusted_origin"],
    ["invalid-code-format", "invalid_code_format"],
  ] as const)("reports %s as %s", (reason, expected) => {
    render(<LoginGateSignal reason={reason} loginAvailability="all" />);

    expect(trackLoginGateMock).toHaveBeenCalledTimes(1);
    expect(trackLoginGateMock).toHaveBeenCalledWith(expected, "all");
  });

  it.each([
    "zzz-unbekannt",
    "learner@example.com",
    "3f1c2b9e-8a7d-4c6b-9e5f-1a2b3c4d5e6f",
    "Progress-Save",
    "progress_save",
    "",
  ])("maps the unknown reason %j to fallback and never forwards it", (reason) => {
    render(<LoginGateSignal reason={reason} loginAvailability="none" />);

    expect(trackLoginGateMock).toHaveBeenCalledTimes(1);
    expect(trackLoginGateMock).toHaveBeenCalledWith("fallback", "none");
    const forwarded = trackLoginGateMock.mock.calls.flat();
    if (reason !== "") expect(forwarded).not.toContain(reason);
  });

  it("maps a repeated query parameter (array) to fallback", () => {
    render(
      <LoginGateSignal
        reason={["progress-save", "kurs-login"] as unknown as string}
        loginAvailability="oauth_only"
      />,
    );

    expect(trackLoginGateMock).toHaveBeenCalledWith("fallback", "oauth_only");
  });

  it("renders nothing and reports once across re-renders with the same gate", () => {
    const { container, rerender } = render(
      <LoginGateSignal reason="abgelaufen" loginAvailability="magic_only" />,
    );
    rerender(
      <LoginGateSignal reason="abgelaufen" loginAvailability="magic_only" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(trackLoginGateMock).toHaveBeenCalledTimes(1);
  });
});
