import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getAllVorlagen, getRelatedVorlagen } from "./vorlagen";
import { LEARNING_EDGES } from "@/lib/learning-graph";

const EXPECTED_ORDER = [
  "ki-nutzungsrichtlinie",
  "risikoklassifizierung",
  "schulungsrahmen-art4",
  "dsfa-fuer-ki-systeme",
  "ki-anbieter-due-diligence",
  "ki-inventarliste",
  "pilot-charter",
  "use-case-bewertungsmatrix",
] as const;

function parseSemicolonCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      i += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === ";" && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

describe("governance template library", () => {
  const templates = getAllVorlagen();
  const slugs = templates.map((template) => template.slug);
  const allSlugSet = new Set(slugs);

  it("uses the explicit learner-pathway order", () => {
    expect(slugs).toEqual(EXPECTED_ORDER);
    expect(templates).toHaveLength(8);
  });

  it("loads markdown templates only and validates required metadata", () => {
    for (const template of templates) {
      expect(template.title).not.toHaveLength(0);
      expect(template.jobToBeDone).not.toHaveLength(0);
      expect(template.audience.length).toBeGreaterThan(0);
      expect(template.editorNotes.length).toBeGreaterThan(0);
      expect(template.sources.length).toBeGreaterThan(0);
      expect(template.body).not.toHaveLength(0);
      expect(template.pages).toBeGreaterThan(0);
      expect(template.estReadMinutes).toBeGreaterThan(0);
      expect(template.estCompleteMinutes).toBeGreaterThan(0);
      expect(template.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(fs.existsSync(path.join(process.cwd(), "content", "vorlagen", `${template.slug}.md`))).toBe(true);
    }
    expect(slugs).not.toContain("ki-inventarliste.csv");
  });

  it("keeps related template links valid", () => {
    for (const template of templates) {
      for (const relatedSlug of template.relatedSlugs) {
        expect(allSlugSet.has(relatedSlug), `${template.slug} -> ${relatedSlug}`).toBe(true);
        expect(relatedSlug).not.toBe(template.slug);
      }
      expect(getRelatedVorlagen(template.slug)).toHaveLength(template.relatedSlugs.length);
    }
  });

  it("uses https sources and avoids known dead source URLs", () => {
    const banned = new Set([
      "https://www.bundesnetzagentur.de/DE/Fachthemen/Digitalisierung/KI/start.html",
      "https://www.bmas.de/DE/Arbeit/Aus-und-Weiterbildung/Qualifizierungschancengesetz/qualifizierungschancengesetz.html",
    ]);
    for (const template of templates) {
      for (const source of template.sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(banned.has(source.url)).toBe(false);
        expect(source.url, `${template.slug}: must not use unofficial mirror`).not.toContain("artificialintelligenceact.eu");
      }
    }
  });

  it("exposes markdown and pdf for every template, csv only for the inventory", () => {
    for (const template of templates) {
      expect(template.downloads.map((download) => download.format)).toEqual(
        template.slug === "ki-inventarliste" ? ["md", "pdf", "csv"] : ["md", "pdf"],
      );
    }
  });

  it("keeps the inventory csv inside content with 21 columns and no bom", () => {
    const csvPath = path.join(process.cwd(), "content", "vorlagen", "ki-inventarliste.csv");
    const csv = fs.readFileSync(csvPath, "utf8");
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    const rows = parseSemicolonCsv(csv);
    expect(rows).toHaveLength(5);
    expect(rows.slice(1)).toHaveLength(4);
    for (const row of rows) expect(row).toHaveLength(21);
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "api", "vorlagen", "[slug]", "download.csv", "route.ts"),
      "utf8",
    );
    expect(routeSource).toContain("content");
    expect(routeSource).toContain("ki-inventarliste.csv");
    expect(routeSource).not.toContain("public/vorlagen");
  });

  it("does not use stale public/download/funding copy in the library surface", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "vorlagen", "vorlagen-content.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/Jede Vorlage zitiert EU AI Act, DSGVO, BetrVG/);
    expect(source).not.toMatch(/Ihre Compliance-Arbeit bezahlen/);
    expect(source).not.toMatch(/ungeschützt|ohne Login/);
  });

  it("course template count matches library count (no zwölf)", () => {
    const block6 = fs.readFileSync(
      path.join(process.cwd(), "content", "eu-ai-act-kurs", "block-6-praxis-lessons.json"),
      "utf8",
    );
    // Catch stale claims: "zwölf Vorlagen", "zwölf lebende Dokumente", "12 Vorlagen", "fünf der zwölf"
    // Use word-boundary patterns to avoid false-positives like "12-Dokument-Framework"
    expect(block6).not.toMatch(/zwölf (Vorlage|lebende Dokument|Governance)/);
    expect(block6).not.toMatch(/12 Vorlage/);
    expect(block6).not.toMatch(/fünf der zwölf/);
  });

  it("does not route to commercial surfaces from the vorlagen listing", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "vorlagen", "vorlagen-content.tsx"),
      "utf8",
    );
    expect(source).not.toContain("/foerdermittel");
    expect(source).not.toContain("/ki-transformation-check");
  });

  it("template content files contain no foerdermittel links", () => {
    const dir = path.join(process.cwd(), "content", "vorlagen");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      expect(content, `${file} must not link to foerdermittel`).not.toContain("foerdermittel");
    }
  });

  it("every template has a primary-source citation", () => {
    for (const template of templates) {
      expect(template.sources.length, `${template.slug} must cite at least one source`).toBeGreaterThan(0);
      for (const source of template.sources) {
        expect(source.title.length, `${template.slug} source needs a title`).toBeGreaterThan(0);
      }
    }
  });

  it("every template maps to exactly one course via a governance_artifact_for edge", () => {
    for (const template of templates) {
      const edges = LEARNING_EDGES.filter(
        (edge) => edge.from === `template:${template.slug}` && edge.type === "governance_artifact_for",
      );
      expect(edges, `${template.slug} must map to one course`).toHaveLength(1);
      expect(edges[0]?.to.startsWith("course:"), `${template.slug} must point to a course`).toBe(true);
    }
  });
});
