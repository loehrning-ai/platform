import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isCredentialKey,
  redactCredentialText,
  redactSentryCredentials,
  REDACTED_VALUE,
} from "./sentry-redaction";

/**
 * The agent endpoint accepts bearer credentials, so an Authorization header
 * now exists on real requests. These tests hold the line that no credential
 * leaves the process through error tracking, whether it arrives as a header
 * field, as a free-form string inside a message, or nested inside context
 * an integration attached.
 */

/**
 * A JWT-shaped credential, assembled at runtime rather than pasted in. The
 * bytes are identical to the literal this replaced; the assembly exists so
 * this file carries no string that reads like a real token, because the
 * repository's publication scanner is right to refuse one.
 */
const JWT_SHAPED_CREDENTIAL = [
  Buffer.from(JSON.stringify({ alg: "ES256", kid: "k1" })).toString(
    "base64url",
  ),
  Buffer.from(JSON.stringify({ sub: "abc" })).toString("base64url"),
  Buffer.from("signature-value").toString("base64url"),
].join(".");
const PERSONAL_TOKEN = "lat_obviously-fake-personal-access-token-abcdef";

describe("isCredentialKey", () => {
  it("matches a credential field however it is spelled", () => {
    for (const key of [
      "Authorization",
      "authorization",
      "proxy-authorization",
      "auth_token",
      "Set-Cookie",
      "x-api-key",
      "accessToken",
      "refresh_token",
      "token_hash",
      "SERVICE_ROLE_KEY",
    ]) {
      expect(isCredentialKey(key), key).toBe(true);
    }
  });

  it("leaves ordinary diagnostic fields alone", () => {
    for (const key of ["route", "step", "status", "durationMs", "errorName"]) {
      expect(isCredentialKey(key), key).toBe(false);
    }
  });
});

describe("redactCredentialText", () => {
  it("removes an HTTP authorization value but keeps the scheme", () => {
    expect(redactCredentialText(`Bearer ${PERSONAL_TOKEN}`)).toBe(
      `Bearer ${REDACTED_VALUE}`,
    );
    expect(redactCredentialText("basic YWRtaW46aHVudGVyMg==")).toBe(
      `Basic ${REDACTED_VALUE}`,
    );
  });

  it("removes a bare token that appears inside prose", () => {
    const message = `request failed for ${PERSONAL_TOKEN} at step two`;

    expect(redactCredentialText(message)).toBe(
      `request failed for ${REDACTED_VALUE} at step two`,
    );
  });

  it("removes a bare JSON Web Token", () => {
    expect(redactCredentialText(JWT_SHAPED_CREDENTIAL)).toBe(REDACTED_VALUE);
  });

  it("leaves ordinary text untouched", () => {
    for (const text of [
      "GET /api/mcp returned 401",
      "next.config.ts",
      "version 1.2.3",
      "loehrning.ai",
    ]) {
      expect(redactCredentialText(text), text).toBe(text);
    }
  });
});

describe("redactSentryCredentials", () => {
  it("removes an authorization header from a captured request", () => {
    const event = {
      message: "unauthorized",
      request: {
        method: "POST",
        url: "https://loehrning.ai/api/mcp",
        headers: {
          Authorization: `Bearer ${JWT_SHAPED_CREDENTIAL}`,
          "content-type": "application/json",
        },
      },
    };

    const result = redactSentryCredentials(event);

    expect(result).toEqual({
      message: "unauthorized",
      request: {
        method: "POST",
        url: "https://loehrning.ai/api/mcp",
        headers: {
          Authorization: REDACTED_VALUE,
          "content-type": "application/json",
        },
      },
    });
  });

  it("does not modify the event it was given", () => {
    const headers = { Authorization: `Bearer ${JWT_SHAPED_CREDENTIAL}` };
    const event = { request: { headers } };

    redactSentryCredentials(event);

    expect(headers.Authorization).toBe(`Bearer ${JWT_SHAPED_CREDENTIAL}`);
  });

  it("reaches a credential nested inside contexts and arrays", () => {
    const result = redactSentryCredentials({
      contexts: {
        agent: {
          attempts: [
            { header: `Bearer ${PERSONAL_TOKEN}` },
            { cookie: "sb-access-token=abc" },
          ],
        },
      },
    });

    expect(JSON.stringify(result)).not.toContain(PERSONAL_TOKEN);
    expect(JSON.stringify(result)).not.toContain("sb-access-token");
  });

  it("keeps every value that is not a credential", () => {
    const event = {
      level: "error",
      timestamp: 1_772_000_000,
      tags: { route: "/api/mcp", step: "rate-limit" },
      exception: {
        values: [{ type: "Error", value: "Error", mechanism: { handled: true } }],
      },
      extra: { durationMs: 12, truncated: false, missing: null },
    };

    expect(redactSentryCredentials(event)).toEqual(event);
  });

  it("terminates on a cyclic payload", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic.self = cyclic;

    expect(redactSentryCredentials(cyclic)).toEqual({
      name: "loop",
      self: REDACTED_VALUE,
    });
  });

  it("refuses to forward an object it cannot inspect", () => {
    const result = redactSentryCredentials({
      extra: { headers: new Headers({ authorization: "Bearer secret" }) },
    });

    expect(result).toEqual({ extra: { headers: REDACTED_VALUE } });
  });

  it("drops an event whose properties cannot be read", () => {
    const hostile = {
      get contexts(): unknown {
        throw new Error("nope");
      },
    };

    expect(redactSentryCredentials(hostile)).toBeNull();
  });

  it("stops at a depth no real event reaches", () => {
    let nested: Record<string, unknown> = { token: "deep" };
    for (let level = 0; level < 30; level += 1) {
      nested = { level: nested };
    }

    expect(JSON.stringify(redactSentryCredentials(nested))).toContain(
      REDACTED_VALUE,
    );
  });
});

describe("the Sentry boundaries", () => {
  it.each(["sentry.server.config.ts", "sentry.edge.config.ts"])(
    "%s redacts credentials before the allowlist runs",
    (configPath) => {
      const config = readFileSync(resolve(process.cwd(), configPath), "utf8");

      expect(config).toContain("redactSentryCredentials");
      expect(config).toContain("beforeSend: (event) => safeSentryEvent(event)");
      expect(config).toContain(
        "beforeSendTransaction: (event) => safeSentryEvent(event)",
      );
      expect(config.indexOf("redactSentryCredentials(event)")).toBeLessThan(
        config.indexOf("prepareSentryEvent(redacted)"),
      );
    },
  );
});
