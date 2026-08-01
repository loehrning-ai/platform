import { describe, expect, it } from "vitest";
import {
  hasJsonContentType,
  readBoundedJson,
} from "./read-json-body";

describe("bounded JSON request boundary", () => {
  it.each([
    "application/json",
    "application/json; charset=utf-8",
    " Application/JSON ; Charset=UTF-8",
  ])("accepts the JSON media type %s", (contentType) => {
    const request = new Request("https://loehrning.ai/api/test", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: "{}",
    });
    expect(hasJsonContentType(request)).toBe(true);
  });

  it.each([
    undefined,
    "text/plain",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "application/jsonp",
    "application/problem+json",
  ])("rejects a non-JSON media type %s", (contentType) => {
    const headers = contentType
      ? { "Content-Type": contentType }
      : undefined;
    const request = new Request("https://loehrning.ai/api/test", {
      method: "POST",
      headers,
      body: "{}",
    });
    expect(hasJsonContentType(request)).toBe(false);
  });

  it("parses a valid body within the byte limit", async () => {
    const request = new Request("https://loehrning.ai/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"ok":true}',
    });
    await expect(readBoundedJson(request, 32)).resolves.toEqual({
      ok: true,
      value: { ok: true },
    });
  });
});
