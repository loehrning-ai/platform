import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_READINESS_WORKSHOP } from "./workshops-data-readiness";
import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";

const slug = "esg-berichte-mit-ki";
const publicRoot = resolve(process.cwd(), "public");
const root = resolve(publicRoot, "workshops", slug);
const de = ESG_REPORTING_WORKSHOP.de;
const en = ESG_REPORTING_WORKSHOP.en;
const both = [de, en] as const;

interface DataNumber {
  readonly en: string;
  readonly de: string;
}
// The dataset is build input and is not served: scripts/workshop04/data/w04-data.json at the repository root.
const data = JSON.parse(readFileSync(resolve(process.cwd(), "..", "..", "scripts/workshop04/data/w04-data.json"), "utf8")) as {
  numbers: Record<string, DataNumber>;
  inputs: { ws: { printed: string; priorYearPrinted: string } };
};

describe("Workshop 04 registry copy (ESG reporting)", () => {
  it("identifies itself as workshop 04 with the fixed catalogue labels", () => {
    for (const workshop of both) {
      expect(workshop.slug).toBe(slug);
      expect(workshop.number).toBe("04");
      expect(workshop.eyebrow).toBe(`Workshop 04 · ${workshop.topic}`);
      expect(workshop.summary.length).toBeLessThanOrEqual(160);
      expect(workshop.accessNote.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
      expect(workshop.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(workshop.outcomes.length).toBeLessThanOrEqual(4);
      expect(workshop.notCovered.length).toBeGreaterThanOrEqual(2);
      expect(workshop.notCovered.length).toBeLessThanOrEqual(4);
      expect(workshop.provenance.data).toBe("synthetic");
      expect(workshop.caseStudy.isFictional).toBe(true);
      // Nothing is recorded yet: the raw-folder answer is constructed, and the copy says so.
      expect(workshop.provenance.aiOutputsRecordedAt).toBeUndefined();
      expect(workshop.accessNote).toMatch(/konstruiert|constructed/);
    }
    expect(de.duration).toBe("~90 Minuten");
    expect(en.duration).toBe("~90 minutes");
    expect(de.format).not.toBe(en.format);
    expect(en.question).toBe("What were our Scope 1 and 2 emissions in 2025, and did they go down compared with 2024?");
  });

  it("uses no en or em dashes anywhere", () => {
    for (const workshop of both) expect(JSON.stringify(workshop)).not.toMatch(/[–—]/);
  });

  it("keeps the decision lab labels of the other workshops and exactly three facts", () => {
    for (const locale of ["de", "en"] as const) {
      const lab = ESG_REPORTING_WORKSHOP[locale].decisionLab;
      const reference = DATA_READINESS_WORKSHOP[locale].decisionLab;
      expect(lab.kicker).toMatch(locale === "de" ? /^Entscheidung 01 · / : /^Decision 01 · /);
      for (const key of ["decisionLegend", "evidenceLegend", "submitLabel", "resetLabel", "privacyNote", "resultLabel"] as const) {
        expect(lab[key], key).toBe(reference[key]);
      }
      expect(lab.facts).toHaveLength(3);
      expect(lab.choices).toHaveLength(3);
      expect(lab.evidence).toHaveLength(3);
      expect(lab.choices.map((choice) => choice.id)).toContain(lab.recommendedChoiceId);
      expect(lab.evidence.map((item) => item.id)).toContain(lab.strongestEvidenceId);
      expect(JSON.stringify(lab)).not.toMatch(/localStorage|sessionStorage|cookie|upload/i);
    }
    expect(de.decisionLab.choices.map((choice) => choice.id)).toEqual(en.decisionLab.choices.map((choice) => choice.id));
    expect(de.decisionLab.evidence.map((item) => item.id)).toEqual(en.decisionLab.evidence.map((item) => item.id));
    expect(Object.keys(de.decisionLab.feedback.byChoice ?? {})).toEqual(Object.keys(en.decisionLab.feedback.byChoice ?? {}));
  });

  it("has five to seven steps with the same numbering in both locales", () => {
    for (const workshop of both) {
      expect(workshop.steps.length).toBeGreaterThanOrEqual(5);
      expect(workshop.steps.length).toBeLessThanOrEqual(7);
      for (const step of workshop.steps) {
        for (const field of [step.n, step.title, step.description, step.tool]) expect(field.trim()).not.toBe("");
      }
    }
    expect(de.steps.map((step) => step.n)).toEqual(en.steps.map((step) => step.n));
    expect(de.caseStudy.metrics).toHaveLength(en.caseStudy.metrics.length);
    expect(de.caseStudy.dataLimitations).toHaveLength(en.caseStudy.dataLimitations.length);
  });

  it("adds its agenda up to 77 minutes of deck plus 13 minutes of questions", () => {
    for (const workshop of both) {
      expect(workshop.agendaSource).toBe("deck");
      const acts = workshop.agenda.filter((item) => item.mode !== "live");
      expect(acts.map((item) => item.minutes)).toEqual([4, 8, 16, 16, 16, 7, 10]);
      expect(workshop.agenda.reduce((sum, item) => sum + item.minutes, 0)).toBe(90);
      expect(workshop.minutesLive).toBe(90);
      expect(workshop.materials[0]?.minutes).toBe(77);
    }
    expect(de.agenda).toHaveLength(en.agenda.length);
  });

  it("lists the same English materials in both locales, and every file exists", () => {
    const frame = (workshop: typeof de) => workshop.materials.map(({ href, kind, language, role, phase, primary, optional, minutes }) => ({ href, kind, language, role, phase, primary, optional, minutes }));
    expect(frame(de)).toEqual(frame(en));
    expect(en.materials.map((material) => material.href.slice(`/workshops/${slug}/`.length))).toEqual([
      "slides.html",
      "presenter.html",
      "demo.html",
      "kellbrunn-esg-kit.zip",
      "transfer.html",
      "guide.html",
      "field-card.html",
    ]);
    for (const workshop of both) {
      expect(workshop.materials.filter((material) => material.primary).map((material) => material.role)).toEqual(["deck"]);
      for (const material of workshop.materials) {
        expect(material.language).toBe("en");
        expect(material.href.startsWith(`/workshops/${slug}/`)).toBe(true);
        expect(material.href.endsWith("/")).toBe(false);
        expect(material.label).not.toMatch(/\(|\)|Englisch|English|öffnen|\bOpen\b/);
        expect(material.description.trim()).not.toBe("");
        if (material.kind !== "html") expect(material.label).toMatch(/\.(?:zip|csv)$/);
        expect(existsSync(resolve(publicRoot, material.href.slice(1).split("#")[0])), material.href).toBe(true);
      }
    }
  });

  it("states the measured kit size", () => {
    const size = statSync(resolve(root, "kellbrunn-esg-kit.zip")).size;
    for (const workshop of both) {
      const kit = workshop.materials.find((material) => material.kind === "zip");
      expect(kit?.sizeLabel).toMatch(/^\d+(?:[.,]\d)? (?:KB|MB)$/);
      expect(kit?.sizeLabel).toBe(`${Math.round(size / 1024)} KB`);
    }
  });

  it("names the deck's scene count and act timings as the deck has them", () => {
    const slides = readFileSync(resolve(root, "slides.html"), "utf8");
    const main = [...slides.matchAll(/<section\b[^>]*>/g)].map(([tag]) => tag).filter((tag) => /data-kind="main"/.test(tag));
    expect(de.materials[0]?.label).toBe(`Deck · ${main.length} Szenen`);
    expect(en.materials[0]?.label).toBe(`Deck · ${main.length} scenes`);
    const seconds = new Map<string, number>();
    for (const tag of main) {
      const act = /data-act="(\d+)"/.exec(tag)?.[1];
      if (act !== undefined) seconds.set(act, (seconds.get(act) ?? 0) + Number(/data-seconds="(\d+)"/.exec(tag)?.[1] ?? 0));
    }
    const acts = en.agenda.filter((item) => item.mode !== "live");
    expect(seconds.size).toBe(acts.length);
    for (const [index, item] of acts.entries()) {
      expect(Math.abs(item.minutes - (seconds.get(String(index)) ?? 0) / 60), item.label).toBeLessThanOrEqual(1);
    }
  });

  it("uses only decimal figures that w04-data.json renders", () => {
    const allowed = new Set<string>();
    const bare = (value: string) => value.replace(/^[+−-]/, "").replace(/\s*(?:%|t|kWh|MWh|l|t\/Mio\. EUR)$/, "");
    for (const entry of Object.values(data.numbers)) {
      allowed.add(bare(entry.en));
      allowed.add(bare(entry.de));
    }
    for (const printed of [data.inputs.ws.printed, data.inputs.ws.priorYearPrinted]) allowed.add(printed.replace(/ MWh$/, ""));
    for (const workshop of both) {
      const text = JSON.stringify(workshop).replace(/\/workshops\/[^"]+/g, "");
      for (const [token] of text.matchAll(/\d+(?:[.,]\d+)+/g)) {
        expect(allowed.has(token), `${workshop.slug} ${token}`).toBe(true);
      }
    }
  });
});
