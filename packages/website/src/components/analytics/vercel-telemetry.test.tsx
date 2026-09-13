/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type BeforeSend = (event: { type: string; url: string }) => unknown;

const captured = vi.hoisted(() => ({
  analytics: undefined as { beforeSend?: BeforeSend } | undefined,
  speedInsights: undefined as { beforeSend?: BeforeSend } | undefined,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: { beforeSend?: BeforeSend }) => {
    captured.analytics = props;
    return null;
  },
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: (props: { beforeSend?: BeforeSend }) => {
    captured.speedInsights = props;
    return null;
  },
}));

import { VercelTelemetry, withSanitizedTelemetryUrl } from "./vercel-telemetry";

describe("VercelTelemetry", () => {
  it("passes the URL policy to both SDKs", () => {
    render(<VercelTelemetry />);
    expect(captured.analytics?.beforeSend).toBe(withSanitizedTelemetryUrl);
    expect(captured.speedInsights?.beforeSend).toBe(withSanitizedTelemetryUrl);
  });

  it("sanitises pageview, custom event and vital URLs", () => {
    render(<VercelTelemetry />);
    const analyticsSend = captured.analytics?.beforeSend;
    const vitalsSend = captured.speedInsights?.beforeSend;
    expect(
      analyticsSend?.({
        type: "pageview",
        url: "https://loehrning.ai/login?next=%2Fkonto#frag",
      }),
    ).toEqual({ type: "pageview", url: "https://loehrning.ai/login" });
    expect(
      analyticsSend?.({ type: "event", url: "https://loehrning.ai/demos?cat=agenten&q=x" }),
    ).toEqual({ type: "event", url: "https://loehrning.ai/demos?cat=agenten" });
    expect(
      vitalsSend?.({ type: "vital", url: "https://loehrning.ai/kurse?ref=mail" }),
    ).toEqual({ type: "vital", url: "https://loehrning.ai/kurse" });
  });

  it("cancels an event whose URL cannot be sanitised", () => {
    expect(withSanitizedTelemetryUrl({ type: "pageview", url: "::" })).toBeNull();
  });

  it("returns a new event and never mutates the input", () => {
    const event = Object.freeze({
      type: "pageview",
      url: "https://loehrning.ai/konto?tab=ki",
    });
    const result = withSanitizedTelemetryUrl(event);
    expect(result).not.toBe(event);
    expect(event.url).toBe("https://loehrning.ai/konto?tab=ki");
    expect(result?.url).toBe("https://loehrning.ai/konto");
  });
});
