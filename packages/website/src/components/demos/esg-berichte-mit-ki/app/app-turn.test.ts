import { describe, expect, it } from "vitest";
import { citeParts } from "@/lib/demo-cases/esg-berichte-mit-ki/citations";
import { answerSegments, citeSegments } from "./app-turn";

describe("a citation chip in an answer", () => {
  it("keeps the word before it and the punctuation after it on its line, without changing the text", () => {
    const text = "Belegt durch strom_2025.csv Z. 3–10, und kompensation_2025.txt:5.";
    const parts = citeParts(text, ["strom_2025.csv", "kompensation_2025.txt"]);
    const segments = citeSegments(parts);
    const joined = segments.map((segment) => `${segment.lead}${segment.part.text}${segment.tail}`).join("");
    expect(joined).toBe(text);
    const cites = segments.filter((segment) => segment.part.kind === "cite");
    expect(cites.map((segment) => segment.lead)).toEqual(["durch ", "und "]);
    expect(cites.map((segment) => segment.tail)).toEqual([",", "."]);
  });
});

describe("an answer with a table", () => {
  it("splits the recorded Markdown around each table without changing a line", () => {
    const source = ["Kurz vorweg.", "", "| Nr | Status |", "| --- | --- |", "| Q1 | LÜCKE |", "", "Danach weiter."].join("\n");
    const segments = answerSegments(source);
    expect(segments.map((segment) => segment.kind)).toEqual(["md", "table", "md"]);
    expect(segments[1]?.text).toBe("| Nr | Status |\n| --- | --- |\n| Q1 | LÜCKE |");
    expect(segments.map((segment) => segment.text).join("\n")).toBe(source);
  });

  it("leaves a table inside a code fence as code", () => {
    const source = ["```", "| a | b |", "| --- | --- |", "```"].join("\n");
    expect(answerSegments(source).map((segment) => segment.kind)).toEqual(["md"]);
  });
});
