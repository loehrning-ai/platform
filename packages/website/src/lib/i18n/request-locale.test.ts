import { describe, expect, it } from "vitest";
import { localeFromRequestHeaders } from "./request-locale";

describe("request locale", () => {
  it("accepts only the middleware-owned locale header", () => {
    expect(
      localeFromRequestHeaders(new Headers({ "x-loehrning-locale": "en" })),
    ).toBe("en");
    expect(
      localeFromRequestHeaders(new Headers({ "x-loehrning-locale": "fr" })),
    ).toBe("de");
    expect(localeFromRequestHeaders(new Headers())).toBe("de");
  });
});
