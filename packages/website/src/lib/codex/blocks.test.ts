import { describe, it, expect } from "vitest";
import { deriveSectionContent } from "./blocks";
import type { CodexBlock } from "./types";

describe("deriveSectionContent ", () => {
  it("joins every block kind into readable plain markdown", () => {
    const blocks: readonly CodexBlock[] = [
      { kind: "prose", markdown: "Some prose." },
      { kind: "pull-quote", text: "A quote." },
      { kind: "callout", title: "Rule", body: "A callout body." },
      {
        kind: "card-grid",
        cards: [{ eyebrow: "01", title: "Card A", body: "Body A." }],
      },
    ];
    const content = deriveSectionContent(blocks);
    expect(content).toContain("Some prose.");
    expect(content).toContain("> A quote.");
    expect(content).toContain("**Rule** A callout body.");
    expect(content).toContain("**Card A**: Body A.");
  });

  it("handles a callout with no title", () => {
    const content = deriveSectionContent([{ kind: "callout", body: "Just the body." }]);
    expect(content).toBe("Just the body.");
  });

  it("returns an empty string for no blocks", () => {
    expect(deriveSectionContent([])).toBe("");
  });
});
