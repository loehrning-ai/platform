import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticModel } from "@/lib/explorer/synthetic-model";
import type { ChapterSegment } from "@/components/book-reader/chapter-markdown";
import type { Directive } from "@/lib/book-directives";

const rendered = vi.hoisted(() => ({ calls: [] as Directive[] }));

vi.mock("./blocks", () => ({
  blockContext: (figures: { bookSlug: string }, locale: string) => ({ figures, bookSlug: figures.bookSlug, locale, dataBase: `/books/${figures.bookSlug}/data` }),
  renderDirective: (_ctx: unknown, directive: Directive) => {
    rendered.calls.push(directive);
    return <svg data-testid="island" data-id={directive.attrs["id"]} data-stage={directive.attrs["stage"]} />;
  },
}));
vi.mock("@/components/book-reader/stage/stage-enhancer", () => ({ StageEnhancer: () => null }));

import { buildChapterFigureBlocks } from "./build-blocks";

const SLUG = "buildbook";
let root = "";

const spec = {
  id: "h01",
  kind: "bars",
  title: "Textmenge",
  alt: "Anteil nach Textmenge.",
  caption: "KI-Wort nach Fünfteln.",
  n: 21404,
  source: "Eigene Auswertung",
  asOf: "2026-10-18",
  limitation: "Zusammenhang, keine Ursache. Mehr Text kann Aufwand sein.",
  steps: [
    { id: "s1", label: "Fünftel" },
    { id: "s2", label: "Gleiche Menge" },
  ],
  data: { fmt: { style: "percent", digits: 1 }, items: [{ id: "q1", label: "kurz", value: 0.2 }] },
  meta: { values: { ratio: { value: 62, n: 21404, fmt: { style: "number", digits: 0, unit: "x" } } } },
};

function write(file: string, content: string): void {
  mkdirSync(join(root, file, ".."), { recursive: true });
  writeFileSync(join(root, file), content);
}

const directive = (name: string, attrs: Record<string, string> = {}): ChapterSegment => ({
  kind: "directive",
  directive: { name, attrs, source: `::${name}{}` },
});

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "build-"));
  write(`content/books/${SLUG}/figures/h01.json`, JSON.stringify(spec));
  write(
    `content/books/${SLUG}/figures/copy/h01.json`,
    JSON.stringify({
      stage: {
        steps: [
          { id: "bars", label: "Fünftel", numeral: "{{h01.ratio.num}}x", claim: "Wer viel schreibt, schreibt KI", text: "Das längste Fünftel schreibt {{h01.ratio.num}}-mal so oft KI.", unit: "1 Quadrat = 21 Startseiten" },
          { id: "flat", label: "Gleiche Menge", numeral: "224", claim: "Die Hälfte fällt weg", text: "Bei gleicher Textmenge bleibt kaum etwas." },
        ],
      },
    }),
  );
  write(`content/books/${SLUG}/explorer.json`, JSON.stringify(syntheticModel()));
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

beforeEach(() => {
  rendered.calls.length = 0;
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

afterAll(() => {
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe("buildChapterFigureBlocks", () => {
  it("returns null for text runs and builds a stage with resolved numerals, claims and cards", async () => {
    const blocks = await buildChapterFigureBlocks(SLUG, "de", [{ kind: "html", html: "<p>x</p>" }, directive("stage", { id: "H01" })]);
    expect(blocks[0]).toBeNull();
    const { container } = render(<>{blocks[1]}</>);
    const stage = container.querySelector("[data-chapter-stage='h01']")!;
    expect(stage).not.toBeNull();
    expect(stage.querySelectorAll(".cs-step")).toHaveLength(2);
    expect(stage.querySelector(".cs-numeral")).toHaveTextContent("62x");
    expect(stage.querySelector(".cs-step")).toHaveTextContent("Das längste Fünftel schreibt 62-mal so oft KI.");
    expect(stage.querySelector("[data-cs-unit]")).toHaveTextContent("1 Quadrat = 21 Startseiten");
    expect(container.querySelector("[data-source-line='h01']")).toHaveTextContent("n = 21.404");
  });

  it("asks the island to draw without numeral and claim, because the stage prints them", async () => {
    await buildChapterFigureBlocks(SLUG, "de", [directive("stage", { id: "H01" })]);
    expect(rendered.calls).toHaveLength(1);
    expect(rendered.calls[0]?.attrs).toEqual({ id: "h01", stage: "true" });
    const blocks = await buildChapterFigureBlocks(SLUG, "de", [directive("stage", { id: "H01" })]);
    render(<>{blocks[0]}</>);
    expect(screen.getByTestId("island")).toHaveAttribute("data-stage", "true");
  });

  it("hands the island the detent of each step when the copy names one", async () => {
    write(
      `content/books/${SLUG}/figures/copy/h01.json`,
      JSON.stringify({
        stage: {
          steps: [
            { id: "a", label: "A", text: "Erster Satz.", variant: "roh" },
            { id: "b", label: "B", text: "Zweiter Satz." },
            { id: "c", label: "C", text: "Dritter Satz.", variant: "s10" },
          ],
        },
      }),
    );
    await buildChapterFigureBlocks(SLUG, "de", [directive("stage", { id: "H01" })]);
    expect(rendered.calls[0]?.attrs).toEqual({ id: "h01", stage: "true", variants: "roh,,s10" });
  });

  it("places a plain figure line through the island builders, untouched", async () => {
    const blocks = await buildChapterFigureBlocks(SLUG, "de", [directive("figure", { id: "C3" })]);
    expect(rendered.calls[0]?.attrs).toEqual({ id: "C3" });
    expect(blocks[0]).not.toBeNull();
  });

  it("builds the explorer from explorer.json", async () => {
    const blocks = await buildChapterFigureBlocks(SLUG, "de", [directive("explorer")]);
    const { container } = render(<>{blocks[0]}</>);
    expect(container.querySelector("[data-explorer]")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Wo stehe ich?" })).toBeVisible();
  });

  it("fails the build for an explorer line without a model", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(mkdtempSync(join(tmpdir(), "empty-")));
    await expect(buildChapterFigureBlocks("nomodel", "de", [directive("explorer")])).rejects.toThrow(/explorer\.json/);
  });

  it("fails the build for a stage whose claim is over 12 words", async () => {
    write(
      `content/books/${SLUG}/figures/copy/h01.json`,
      JSON.stringify({ stage: { steps: [{ id: "a", label: "A", text: "Ein Satz.", claim: "eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn" }] } }),
    );
    await expect(buildChapterFigureBlocks(SLUG, "de", [directive("stage", { id: "H01" })])).rejects.toThrow(/claim has 13 words/);
  });

  it("falls back to the spec's step labels when there is no copy file", async () => {
    rmSync(join(root, "content/books", SLUG, "figures/copy"), { recursive: true, force: true });
    const blocks = await buildChapterFigureBlocks(SLUG, "de", [directive("stage", { id: "H01" })]);
    const { container } = render(<>{blocks[0]}</>);
    expect(container.querySelectorAll(".cs-step")).toHaveLength(2);
    expect(container.querySelector(".cs-step")).toHaveTextContent("Fünftel");
  });
});
