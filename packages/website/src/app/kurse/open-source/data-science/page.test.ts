import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("data-science course root / Overview route ", () => {
  it("carries the real source title/description, not placeholders", () => {
    expect(metadata.title).toBe("Data Science Fundamentals · Interactive Course");
    expect(metadata.description).toContain("data science loop");
  });

  it("is indexable and canonical at the bare course root", () => {
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      "https://loehrning.ai/kurse/open-source/data-science",
    );
  });
});
