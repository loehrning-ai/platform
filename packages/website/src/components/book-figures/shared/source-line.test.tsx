import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { composeSourceLine, SourceLine, sourceLineFieldsOf, wordCount } from "./source-line";

const BASE = {
  id: "c4",
  n: 25581,
  asOf: "2026-10-18",
  source: "Eigene Auswertung",
  limitation: "Gemessen wird, was auf der Website steht. Nicht, was die Firma einsetzt.",
};

describe("composeSourceLine", () => {
  it("prefers the authored line", () => {
    expect(composeSourceLine({ ...BASE, sourceLine: "n = 21.402 Startseiten · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache" })).toBe(
      "n = 21.402 Startseiten · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache",
    );
  });

  it("composes n, the date and the first sentence of the limit when there is none", () => {
    expect(composeSourceLine(BASE)).toBe("n = 25.581 · Stand 18.10.2026 · Grenze: Gemessen wird, was auf der Website steht");
  });

  it("keeps the extra sample sizes in brackets", () => {
    expect(composeSourceLine({ ...BASE, nNote: "37.429 / 25.581 / 24.944" })).toContain("n = 25.581 (37.429 / 25.581 / 24.944)");
  });
});

describe("sourceLineFieldsOf", () => {
  it("reads sourceLine and rescanNote defensively and drops blanks", () => {
    expect(sourceLineFieldsOf({ ...BASE, sourceLine: "  ", rescanNote: 4 } as never)).toMatchObject({ sourceLine: undefined, rescanNote: undefined });
    expect(sourceLineFieldsOf({ ...BASE, sourceLine: " x ", rescanNote: " y " } as never)).toMatchObject({ sourceLine: "x", rescanNote: "y" });
  });
});

describe("SourceLine", () => {
  it("prints one visible paragraph with the static rescan sentence and plain CSV links", () => {
    const { container } = render(
      <SourceLine
        fields={{ ...BASE, rescanNote: "Wird mit geprüften Websites neu gerechnet." }}
        csv={[{ href: "/books/x/data/c4.csv", label: "Daten als CSV", fileName: "c4.csv" }]}
      />,
    );
    const line = container.querySelector("p[data-source-line='c4']")!;
    expect(line).toBeVisible();
    expect(line).toHaveTextContent("Wird mit geprüften Websites neu gerechnet.");
    expect(container.querySelector("[data-rescan-note]")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Daten als CSV" })).toHaveAttribute("download", "c4.csv");
    expect(container.querySelector("details, summary, button, [aria-expanded]")).toBeNull();
  });

  it("counts words for the 20-word rule", () => {
    expect(wordCount("n = 21.402 Startseiten mit eigener Domain · Scan 2026-03 bis 05 · Grenze: Zusammenhang, keine Ursache")).toBeLessThanOrEqual(20);
    expect(wordCount("")).toBe(0);
  });
});
