import { describe, expect, it } from "vitest";
import {
  CV_ENGINE_HANDOFF_PATH,
  cvEngineHandoffUrl,
  cvEngineSignInUrl,
  isHandoffTokenHash,
} from "./handoff-url";

const ORIGIN = "https://cv.loehrning.ai";
const TOKEN = "7f2a1c4e9b0d5a6f3e8c2b1d4a7f0e9c6b3d8a5f2e1c4b7a0d9e6c3b8a5f2e1c";

describe("hosted cv-engine handoff destinations", () => {
  it("carries the token in the fragment and nowhere else", () => {
    const built = cvEngineHandoffUrl(ORIGIN, TOKEN);
    expect(built).toBe(
      `${ORIGIN}${CV_ENGINE_HANDOFF_PATH}#token_hash=${TOKEN}&type=magiclink`,
    );

    const url = new URL(built as string);
    expect(url.origin).toBe(ORIGIN);
    expect(url.pathname).toBe(CV_ENGINE_HANDOFF_PATH);
    expect(url.search).toBe("");
    expect(url.hash).toContain(TOKEN);
    // The part a server can observe must not contain the credential.
    expect(`${url.origin}${url.pathname}${url.search}`).not.toContain(TOKEN);
  });

  it("refuses a token that could reshape the destination", () => {
    for (const rejected of [
      "",
      " ",
      "abc def",
      "abc/def",
      "abc?def",
      "abc#def",
      "abc&type=recovery",
      "abc%2f",
      "a".repeat(513),
      null,
      undefined,
      42,
      { hashed_token: TOKEN },
    ]) {
      expect(isHandoffTokenHash(rejected), String(rejected)).toBe(false);
      expect(cvEngineHandoffUrl(ORIGIN, rejected), String(rejected)).toBeNull();
    }
  });

  it("accepts the unreserved characters a hashed token can use", () => {
    for (const accepted of [TOKEN, "pkce_abc-DEF_123.~", "a"]) {
      expect(isHandoffTokenHash(accepted), accepted).toBe(true);
      expect(cvEngineHandoffUrl(ORIGIN, accepted)).toContain(
        `#token_hash=${accepted}&type=magiclink`,
      );
    }
  });

  it("builds a sign-in fallback that carries a notice and no credential", () => {
    const fallback = cvEngineSignInUrl(ORIGIN);
    expect(fallback).toBe(`${ORIGIN}/?hinweis=anmelden`);
    expect(fallback).not.toContain("token");
    expect(new URL(fallback).hash).toBe("");
  });
});
