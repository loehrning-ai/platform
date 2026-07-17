// ─── generateVorlagePdf render-tree tests (regression coverage) ────────────
//
// `generateVorlagePdf` is the module's only export; the markdown parser
// (parseMarkdown / stripInline / splitTableRow) is internal, so we assert its
// REAL behaviour end-to-end through the document tree that is handed to
// @react-pdf/renderer. The renderer is stubbed so the function runs its actual
// logic (leading-H1 strip, block parsing, inline stripping, cover-pill
// assembly, document metadata) and we capture the exact element tree + return
// value. React itself is real, so createElement produces a genuine tree we walk.

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { Vorlage } from "@/lib/vorlagen";
import { generateVorlagePdf } from "./vorlage-pdf";

// ---------------------------------------------------------------------------
// Mock only the heavy PDF renderer. Components become plain string tags so
// React.createElement builds an inspectable tree; StyleSheet.create is
// identity; renderToBuffer captures the doc and returns a real Buffer.
// ---------------------------------------------------------------------------

const { renderToBufferMock } = vi.hoisted(() => ({
  renderToBufferMock: vi.fn((_doc: unknown) => Buffer.from("%PDF-mock")),
}));

vi.mock("@react-pdf/renderer", () => ({
  Document: "Document",
  Page: "Page",
  Text: "Text",
  View: "View",
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  renderToBuffer: renderToBufferMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect every leaf text node from a React element tree. */
function collectStrings(node: unknown, out: string[]): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (typeof node === "number") {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out);
    return;
  }
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    collectStrings(props?.children, out);
  }
}

/** The document element handed to renderToBuffer on the last generate call. */
function lastDoc(): { type: unknown; props: Record<string, unknown> } {
  const doc = renderToBufferMock.mock.calls.at(-1)?.[0];
  expect(doc).toBeTruthy();
  return doc as { type: unknown; props: Record<string, unknown> };
}

/** Every leaf text node in the last rendered document. */
function lastTexts(): string[] {
  const out: string[] = [];
  collectStrings(lastDoc(), out);
  return out;
}

function makeVorlage(overrides: Partial<Vorlage> = {}): Vorlage {
  return {
    slug: "test-vorlage",
    title: "KI-Nutzungsrichtlinie",
    category: "pflicht",
    pflicht: true,
    articleRefs: ["Art. 4", "Art. 26"],
    pages: 6,
    jobToBeDone: "Klare Regeln für den KI-Einsatz im Betrieb.",
    audience: ["Geschäftsführung", "IT-Leitung"],
    estReadMinutes: 8,
    estCompleteMinutes: 25,
    relatedSlugs: [],
    editorNotes: ["Vor Einführung mit dem Betriebsrat abstimmen.", "Jährlich prüfen."],
    sources: [],
    lastReviewed: "Juni 2026",
    nextReview: "Dezember 2026",
    riskClass: "legal",
    downloads: [],
    body: "# Fallback-Titel\n\nEin kurzer Absatz.",
    ...overrides,
  };
}

// A body that exercises every parseMarkdown block type. Fence lines use the
// literal "```" string to avoid nested-template-literal escaping.
const RICH_BODY = [
  "# Titel der wegfaellt",
  "",
  "## Abschnitt Zwei",
  "",
  "Text mit **fett**, *kursiv*, __unterstrichen__, _leise_, `Code` und [Link](https://loehrning.ai).",
  "",
  "### Unterabschnitt",
  "",
  "#### Detailtitel",
  "",
  "- Erster Punkt",
  "- Zweiter **wichtiger** Punkt",
  "",
  "1. Schritt eins",
  "2. Schritt zwei",
  "",
  "> Ein Zitat der Governance.",
  "",
  "```",
  "const antwort = 42;",
  "```",
  "",
  "| Spalte A | Spalte B |",
  "| --- | --- |",
  "| a1 | b1 |",
  "| a2 | b2 |",
  "",
  "---",
].join("\n");

beforeEach(() => {
  renderToBufferMock.mockClear();
});

// ---------------------------------------------------------------------------
// Return contract + document metadata
// ---------------------------------------------------------------------------

describe("generateVorlagePdf return + metadata", () => {
  it("returns the renderer Buffer and renders exactly one document", async () => {
    const buf = await generateVorlagePdf(makeVorlage());
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe("%PDF-mock");
    expect(renderToBufferMock).toHaveBeenCalledTimes(1);
  });

  it("stamps the PDF document metadata from the vorlage", async () => {
    await generateVorlagePdf(makeVorlage());
    const { type, props } = lastDoc();
    expect(type).toBe("Document");
    expect(props.title).toBe("KI-Nutzungsrichtlinie (Governance-Vorlage)");
    expect(props.author).toBe("Tim Löhr · loehrning.ai");
    expect(props.subject).toBe("Klare Regeln für den KI-Einsatz im Betrieb.");
    expect(props.keywords).toBe("Art. 4, Art. 26");
  });

  it("joins articleRefs into the keywords string (empty when none)", async () => {
    await generateVorlagePdf(makeVorlage({ articleRefs: [] }));
    expect(lastDoc().props.keywords).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Cover page assembly
// ---------------------------------------------------------------------------

describe("generateVorlagePdf cover page", () => {
  it("renders the dossier line, title, subtitle, umfang, rights and stand", async () => {
    await generateVorlagePdf(makeVorlage());
    const texts = lastTexts();
    expect(texts).toContain("Governance-Vorlage · loehrning.ai");
    expect(texts).toContain("KI-Nutzungsrichtlinie");
    expect(texts).toContain("Klare Regeln für den KI-Einsatz im Betrieb.");
    expect(texts).toContain("6 Seiten · 8 Min. Lesezeit · 25 Min. Ausfüllen");
    expect(
      texts.some((t) =>
        t.startsWith("CC BY 4.0: frei nutzbar mit Quellenangabe."),
      ),
    ).toBe(true);
    expect(texts).toContain("Juni 2026");
  });

  it("maps a Pflicht category to its label and adds the Pflicht-Vorlage pill", async () => {
    await generateVorlagePdf(makeVorlage({ category: "pflicht", pflicht: true }));
    const texts = lastTexts();
    expect(texts).toContain("Compliance-Pflicht");
    expect(texts).toContain("Pflicht-Vorlage");
    expect(texts).toContain("Art. 4");
    expect(texts).toContain("Art. 26");
  });

  it("maps a Hygiene category and omits the Pflicht pill when not pflicht", async () => {
    await generateVorlagePdf(
      makeVorlage({
        category: "hygiene",
        pflicht: false,
        articleRefs: ["Art. 50"],
      }),
    );
    const texts = lastTexts();
    expect(texts).toContain("Governance-Hygiene");
    expect(texts).toContain("Art. 50");
    expect(texts).not.toContain("Pflicht-Vorlage");
  });

  it("maps a Werkzeug category to its operative label", async () => {
    await generateVorlagePdf(makeVorlage({ category: "werkzeug" }));
    expect(lastTexts()).toContain("Operative Werkzeuge");
  });

  it("joins the audience with a middot separator", async () => {
    await generateVorlagePdf(
      makeVorlage({ audience: ["Geschäftsführung", "IT-Leitung"] }),
    );
    expect(lastTexts()).toContain("Geschäftsführung · IT-Leitung");
  });

  it("falls back to '-' for an empty audience", async () => {
    await generateVorlagePdf(
      makeVorlage({ audience: [], body: "# X\n\nEin Absatz." }),
    );
    expect(lastTexts()).toContain("-");
  });

  it("renders the Editor's Notes heading and bulleted notes when present", async () => {
    await generateVorlagePdf(
      makeVorlage({
        editorNotes: ["Vor Einführung abstimmen.", "Jährlich prüfen."],
      }),
    );
    const texts = lastTexts();
    expect(texts).toContain("Editor's Notes");
    expect(texts).toContain("• Vor Einführung abstimmen.");
    expect(texts).toContain("• Jährlich prüfen.");
  });

  it("omits the Editor's Notes heading when there are none", async () => {
    await generateVorlagePdf(makeVorlage({ editorNotes: [] }));
    expect(lastTexts()).not.toContain("Editor's Notes");
  });

  it("renders the body footer with the slug-based canonical path", async () => {
    await generateVorlagePdf(
      makeVorlage({ title: "KI-Nutzungsrichtlinie", slug: "test-vorlage" }),
    );
    expect(lastTexts()).toContain(
      "KI-Nutzungsrichtlinie · loehrning.ai/vorlagen/test-vorlage",
    );
  });
});

// ---------------------------------------------------------------------------
// Markdown body parsing (asserted through the rendered tree)
// ---------------------------------------------------------------------------

describe("generateVorlagePdf markdown body", () => {
  it("drops the leading H1 from the body (already shown on the cover)", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).not.toContain("Titel der wegfaellt");
    // The section that followed the H1 survives as an H2.
    expect(texts).toContain("Abschnitt Zwei");
  });

  it("keeps a later H1 while only stripping the leading one", async () => {
    await generateVorlagePdf(
      makeVorlage({ body: "# Weg\n\nAbsatz\n\n# Behalten" }),
    );
    const texts = lastTexts();
    expect(texts).not.toContain("Weg");
    expect(texts).toContain("Behalten");
    expect(texts).toContain("Absatz");
  });

  it("does not strip a leading non-H1 heading", async () => {
    await generateVorlagePdf(
      makeVorlage({ body: "## Erhalten\n\nAbsatz." }),
    );
    expect(lastTexts()).toContain("Erhalten");
  });

  it("renders headings h2/h3/h4 as their text content", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).toContain("Abschnitt Zwei");
    expect(texts).toContain("Unterabschnitt");
    expect(texts).toContain("Detailtitel");
  });

  it("strips inline markdown (bold/italic/underscore/code/link) from paragraphs", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    expect(lastTexts()).toContain(
      "Text mit fett, kursiv, unterstrichen, leise, Code und Link.",
    );
  });

  it("prefixes unordered list items with a bullet and strips inline markup", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).toContain("• Erster Punkt");
    expect(texts).toContain("• Zweiter wichtiger Punkt");
  });

  it("numbers ordered list items sequentially from one", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).toContain("1. Schritt eins");
    expect(texts).toContain("2. Schritt zwei");
  });

  it("renders blockquotes and code fences verbatim", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).toContain("Ein Zitat der Governance.");
    expect(texts).toContain("const antwort = 42;");
  });

  it("renders table header cells and body rows", async () => {
    await generateVorlagePdf(makeVorlage({ body: RICH_BODY }));
    const texts = lastTexts();
    expect(texts).toContain("Spalte A");
    expect(texts).toContain("Spalte B");
    expect(texts).toContain("a1");
    expect(texts).toContain("b1");
    expect(texts).toContain("a2");
    expect(texts).toContain("b2");
  });

  it("collapses a multi-line paragraph into one stripped text block", async () => {
    await generateVorlagePdf(
      makeVorlage({ body: "Zeile eins\nZeile **zwei**." }),
    );
    expect(lastTexts()).toContain("Zeile eins Zeile zwei.");
  });
});
