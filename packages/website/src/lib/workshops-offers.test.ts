import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listZipEntries, readZipText } from "./zip/read";
import { OFFERS_HAND_EDITS, OFFERS_WORKSHOP } from "./workshops-offers";

/**
 * Workshop 06 against its own files: every number the page and the kit page print stands in the kit, the
 * size label is the zip's, and the provenance count is the numbered items of the two change logs.
 */
const slug = "angebote-mit-ki-vergleichen";
const zipPath = resolve(process.cwd(), "public/workshops", slug, "angebote-vergleichen-kit.zip");
const zip = new Uint8Array(readFileSync(zipPath));
const kitText = (file: string) => readZipText(zip, `angebote-vergleichen-kit/${file}`) ?? "";
const answers = kitText("ANSWERS.md");
const steps = kitText("schritte.md");
const fieldCard = kitText("karten/feldkarte.md");
const scripts = resolve(process.cwd(), "../../scripts/workshop06");
const flat = (text: string) => text.replace(/\s+/g, " ");
const both = [OFFERS_WORKSHOP.de, OFFERS_WORKSHOP.en] as const;

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const inner of value) strings(inner, out);
  else if (value && typeof value === "object") for (const inner of Object.values(value)) strings(inner, out);
  return out;
}

/** The numbered items ("1. ", "2. ", ...) of one Markdown section, from its heading to the next "## ". */
function numberedItems(file: string, heading: RegExp): number {
  const text = readFileSync(resolve(scripts, file), "utf8");
  const start = text.search(heading);
  expect(start, `${file}: ${heading}`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start).split("\n").slice(1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).filter((line) => /^\d+\. /.test(line)).length;
}

describe("Workshop 06 data", () => {
  it("counts the hand edits from both change logs, and the logs state their own counts", () => {
    const build = numberedItems("source/BUILD-LOG.md", /^## Handarbeit außerhalb des Ablaufs: (\d+) Stellen$/m);
    const port = numberedItems("PORT-LOG.md", /^## Changes for the site: (\d+) places$/m);
    expect(build).toBe(9);
    expect(port).toBe(4);
    expect(OFFERS_HAND_EDITS).toBe(build + port);
    expect(OFFERS_WORKSHOP.de.provenance.note).toContain(`an ${build + port} Stellen geändert`);
    expect(OFFERS_WORKSHOP.en.provenance.note).toContain(`changed in ${build + port} places`);
  });

  it("is an invented case with no live date and no client", () => {
    for (const workshop of both) {
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.caseStudy.isFictional).toBe(true);
      expect(workshop.realWorldCase).toBeUndefined();
      const text = strings(workshop).join("\n");
      expect(text).not.toMatch(/Live gehalten|Held live/);
      expect(text).not.toMatch(/[–—]/);
    }
  });

  it("labels the kit with the zip's size and counts its files", () => {
    const size = statSync(zipPath).size;
    const files = listZipEntries(zip).filter((entry) => !entry.path.endsWith("/"));
    for (const workshop of both) {
      const kit = workshop.materials.find((material) => material.role === "kit");
      expect(kit?.sizeLabel).toBe(`${Math.round(size / 1024)} KB`);
      expect(workshop.kit?.stats[0]?.value).toBe(String(files.length));
      expect(workshop.stageExplainer.facts?.[0]).toMatch(new RegExp(`^${files.length} `));
    }
  });

  it("prints only numbers the kit prints", () => {
    const sources = flat(`${answers}\n${steps}\n${fieldCard}`);
    for (const workshop of [OFFERS_WORKSHOP.de]) {
      for (const step of workshop.kit?.steps ?? []) {
        if (step.line) expect(sources, step.line.result).toContain(step.line.result.replace(/ €$/, ""));
        for (const number of `${step.line?.text ?? ""} ${step.note ?? ""}`.match(/\d[\d.,]*/g) ?? []) {
          expect(sources, `${step.tag}: ${number}`).toContain(number.replace(/[.,]$/, ""));
        }
      }
      for (const metric of workshop.caseStudy.metrics) {
        expect(sources, metric.label).toContain(metric.value.replace(/ €$/, ""));
      }
      for (const step of workshop.steps) {
        for (const number of step.description.match(/\d[\d.,]*\d/g) ?? []) expect(sources, `${step.n}: ${number}`).toContain(number);
      }
    }
    // A step's sum is the sum of its line.
    const sum = (text: string) =>
      [...text.matchAll(/([−+]?)\s*([\d.]+)/g)].reduce((total, [, sign, value]) => {
        const amount = Number(value!.replace(/\./g, ""));
        return sign === "−" ? total - amount : total + amount;
      }, 0);
    for (const step of OFFERS_WORKSHOP.de.kit?.steps ?? []) {
      if (!step.line) continue;
      expect(sum(step.line.text.replace(/€|Ware|Skonto|=/g, "")), step.tag).toBe(Number(step.line.result.replace(/\D/g, "")));
    }
  });

  it("states the method in the field card's words", () => {
    for (const rule of OFFERS_WORKSHOP.de.kit?.rules ?? []) expect(flat(fieldCard)).toContain(flat(rule));
  });

  it("times the live agenda to the deck's 90 minutes", () => {
    for (const workshop of both) {
      expect(workshop.agenda.reduce((total, item) => total + item.minutes, 0)).toBe(workshop.minutesLive);
      expect(workshop.minutesLive).toBe(90);
    }
  });
});
