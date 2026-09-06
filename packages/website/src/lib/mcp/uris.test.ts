import { describe, expect, it } from "vitest";
import { isMcpToolError } from "./errors";
import {
  bookUri,
  lessonUri,
  parseResourceUri,
  workshopUri,
} from "./uris";

function reject(uri: string): string {
  try {
    parseResourceUri(uri);
  } catch (error) {
    if (isMcpToolError(error)) return error.code;
    return "not_an_mcp_error";
  }
  return "accepted";
}

describe("resource URIs", () => {
  it("round-trips every scheme", () => {
    expect(lessonUri("ki-fuehrerschein", "block_1_lesson_1")).toBe(
      "lesson://ki-fuehrerschein/block_1_lesson_1",
    );
    expect(lessonUri("ki-fuehrerschein", "block_1_lesson_1", "en")).toBe(
      "lesson://ki-fuehrerschein/block_1_lesson_1?locale=en",
    );
    expect(workshopUri("ki-prognosen-einschaetzen")).toBe(
      "workshop://ki-prognosen-einschaetzen",
    );
    expect(bookUri("ki-landschaft", "01_eisberg", "en")).toBe(
      "book://ki-landschaft/01_eisberg?locale=en",
    );

    expect(parseResourceUri(lessonUri("a-course", "b_lesson", "en"))).toEqual({
      kind: "lesson",
      course: "a-course",
      lessonId: "b_lesson",
      locale: "en",
    });
    expect(parseResourceUri(workshopUri("a-workshop"))).toEqual({
      kind: "workshop",
      slug: "a-workshop",
      locale: "de",
    });
    expect(parseResourceUri(bookUri("a-book", "01_intro"))).toEqual({
      kind: "book",
      book: "a-book",
      chapter: "01_intro",
      locale: "de",
    });
  });

  it("defaults to the canonical locale when none is given", () => {
    expect(parseResourceUri("lesson://course/lesson").locale).toBe("de");
  });

  it("refuses malformed, over-deep, and unknown addresses", () => {
    expect(reject("")).toBe("invalid_resource_uri");
    expect(reject("not a uri")).toBe("invalid_resource_uri");
    expect(reject("https://loehrning.ai/kurse")).toBe("invalid_resource_uri");
    expect(reject("lesson://course")).toBe("invalid_resource_uri");
    expect(reject("lesson://course/a/b")).toBe("invalid_resource_uri");
    expect(reject("workshop://slug/extra")).toBe("invalid_resource_uri");
    expect(reject("book://book")).toBe("invalid_resource_uri");
    expect(reject(`lesson://course/${"x".repeat(600)}`)).toBe(
      "invalid_resource_uri",
    );
    expect(reject("lesson://course/lesson?locale=fr")).toBe(
      "invalid_resource_uri",
    );
    expect(reject("lesson://course/../../etc/passwd")).toBe(
      "invalid_resource_uri",
    );
  });

  it("keeps a rejection message free of the caller's value", () => {
    try {
      parseResourceUri("lesson://course/SECRET-VALUE/extra");
      throw new Error("expected a rejection");
    } catch (error) {
      expect(isMcpToolError(error)).toBe(true);
      expect((error as Error).message).not.toContain("SECRET-VALUE");
    }
  });
});
