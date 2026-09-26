import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  WORKSHOPS,
  WORKSHOPS_BY_LOCALE,
  getWorkshopBySlug,
  getWorkshopSlugs,
  getWorkshops,
  primaryWorkshopMaterial,
  workshopAgendaMinutes,
  type WorkshopMaterial,
} from "./workshops";

describe("workshops catalog", () => {
  it("is non-empty", () => {
    expect(WORKSHOPS.length).toBeGreaterThan(0);
  });

  it("has unique slugs", () => {
    const slugs = WORKSHOPS.map((workshop) => workshop.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has all required string fields non-empty for every workshop", () => {
    for (const workshop of WORKSHOPS) {
      expect(
        workshop.slug.trim().length,
        `${workshop.slug}.slug`,
      ).toBeGreaterThan(0);
      expect(
        workshop.title.trim().length,
        `${workshop.slug}.title`,
      ).toBeGreaterThan(0);
      expect(
        workshop.eyebrow.trim().length,
        `${workshop.slug}.eyebrow`,
      ).toBeGreaterThan(0);
      expect(
        workshop.description.trim().length,
        `${workshop.slug}.description`,
      ).toBeGreaterThan(0);
      expect(
        workshop.format.trim().length,
        `${workshop.slug}.format`,
      ).toBeGreaterThan(0);
      expect(
        workshop.duration.trim().length,
        `${workshop.slug}.duration`,
      ).toBeGreaterThan(0);
      expect(
        workshop.accessNote.trim().length,
        `${workshop.slug}.accessNote`,
      ).toBeGreaterThan(0);
      expect(
        workshop.summary.trim().length,
        `${workshop.slug}.summary`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps every card summary short enough for a card and a meta description", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        expect(
          workshop.summary.length,
          `${locale}/${workshop.slug}.summary is too long for the card`,
        ).toBeLessThanOrEqual(160);
      }
    }
  });

  it("numbers workshops from data and follows one naming pattern in both locales", () => {
    const formats = {
      de: ["Selbstlern-Kit", "Selbstlern-Kit", "Live-Workshop mit Deck", "Live-Workshop mit Deck"],
      en: ["Self-study kit", "Self-study kit", "Live workshop with deck", "Live workshop with deck"],
    } as const;
    for (const locale of ["de", "en"] as const) {
      const workshops = getWorkshops(locale);
      expect(workshops.map(({ number }) => number)).toEqual(["01", "02", "03", "04"]);
      for (const [index, workshop] of workshops.entries()) {
        expect(workshop.eyebrow).toBe(
          `Workshop ${workshop.number} · ${workshop.topic}`,
        );
        expect(workshop.duration).toBe(
          locale === "de" ? "~90 Minuten" : "~90 minutes",
        );
        expect(workshop.format).toBe(formats[locale][index]);
        expect(workshop.outcome.trim().length).toBeGreaterThan(0);
        expect(workshop.accessNote.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
        for (const material of workshop.materials) {
          expect(material.label).not.toMatch(/\(|\)|Englisch|English|öffnen|\bOpen\b/);
          if (material.kind !== "html") {
            expect(material.label).toMatch(new RegExp(`\\.${material.kind}$`));
          }
        }
      }
    }
    expect(getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")?.eyebrow).toBe(
      "Workshop 02 · Geschäftsberichte",
    );
    expect(
      getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "de")?.materials[0]?.label,
    ).toBe("Deck · 22 Folien");
    expect(
      getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")?.materials[0]?.label,
    ).toBe("Deck · 22 slides");
  });

  it("gives every real-world second case a source and a decision", () => {
    for (const workshop of WORKSHOPS) {
      const realWorld = workshop.realWorldCase;
      if (!realWorld) continue;
      expect(
        realWorld.companyName.trim().length,
        `${workshop.slug}.realWorldCase`,
      ).toBeGreaterThan(0);
      expect(
        realWorld.source.trim().length,
        `${workshop.slug}.realWorldCase.source`,
      ).toBeGreaterThan(0);
      expect(realWorld.decisionQuestion.trim().length).toBeGreaterThan(0);
      expect(realWorld.metrics.length).toBeGreaterThan(0);
    }
  });

  it("has at least one audience entry per workshop, all non-empty", () => {
    for (const workshop of WORKSHOPS) {
      expect(
        workshop.audience.length,
        `${workshop.slug}.audience`,
      ).toBeGreaterThan(0);
      for (const line of workshop.audience) {
        expect(
          line.trim().length,
          `${workshop.slug}.audience item`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("has five to seven non-empty build-flow steps per workshop", () => {
    for (const workshop of WORKSHOPS) {
      expect(
        workshop.steps.length,
        `${workshop.slug}.steps`,
      ).toBeGreaterThanOrEqual(5);
      expect(
        workshop.steps.length,
        `${workshop.slug}.steps`,
      ).toBeLessThanOrEqual(7);
      for (const step of workshop.steps) {
        expect(step.n.trim().length, `${workshop.slug} step.n`).toBeGreaterThan(
          0,
        );
        expect(
          step.title.trim().length,
          `${workshop.slug} step.title`,
        ).toBeGreaterThan(0);
        expect(
          step.description.trim().length,
          `${workshop.slug} step.description`,
        ).toBeGreaterThan(0);
        expect(
          step.tool.trim().length,
          `${workshop.slug} step.tool`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("gives every workshop one bounded, internally consistent first decision", () => {
    for (const workshop of WORKSHOPS) {
      const lab = workshop.decisionLab;
      expect(lab.facts).toHaveLength(3);
      expect(lab.choices.length).toBeGreaterThanOrEqual(2);
      expect(lab.evidence.length).toBeGreaterThanOrEqual(2);
      expect(new Set(lab.choices.map(({ id }) => id)).size).toBe(
        lab.choices.length,
      );
      expect(new Set(lab.evidence.map(({ id }) => id)).size).toBe(
        lab.evidence.length,
      );
      expect(lab.choices.map(({ id }) => id)).toContain(
        lab.recommendedChoiceId,
      );
      expect(lab.evidence.map(({ id }) => id)).toContain(
        lab.strongestEvidenceId,
      );
      expect(JSON.stringify(lab)).not.toMatch(
        /localStorage|sessionStorage|cookie|upload/i,
      );
    }
  });

  it("states plainly whether each case study is fictional, with non-empty narrative and metrics", () => {
    for (const workshop of WORKSHOPS) {
      const { caseStudy } = workshop;
      expect(
        typeof caseStudy.isFictional,
        `${workshop.slug}.caseStudy.isFictional`,
      ).toBe("boolean");
      expect(caseStudy.companyName.trim().length).toBeGreaterThan(0);
      expect(caseStudy.narrative.trim().length).toBeGreaterThan(0);
      expect(caseStudy.decisionQuestion.trim().length).toBeGreaterThan(0);
      expect(caseStudy.metrics.length).toBeGreaterThan(0);
      expect(caseStudy.dataLimitations.length).toBeGreaterThan(0);
      for (const metric of caseStudy.metrics) {
        expect(metric.label.trim().length).toBeGreaterThan(0);
        expect(metric.value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("references materials that exist as real files under public/workshops/<slug>/", () => {
    for (const workshop of WORKSHOPS) {
      expect(
        workshop.materials.length,
        `${workshop.slug}.materials`,
      ).toBeGreaterThan(0);
      for (const material of workshop.materials) {
        expect(
          material.href.startsWith(`/workshops/${workshop.slug}/`),
          material.href,
        ).toBe(true);
        // An in-page fragment (#section) addresses part of an existing file.
        const relativePath = material.href.replace(/^\//, "").split("#")[0];
        const filePath = resolve(process.cwd(), "public", relativePath);
        expect(existsSync(filePath), `missing file for ${material.href}`).toBe(
          true,
        );
        expect(["de", "en"]).toContain(material.language);
      }
    }
  });

  it("keeps German and English catalogs structurally aligned", () => {
    const german = WORKSHOPS_BY_LOCALE.de;
    const english = WORKSHOPS_BY_LOCALE.en;

    expect(english.map(({ slug }) => slug)).toEqual(
      german.map(({ slug }) => slug),
    );
    for (const germanWorkshop of german) {
      const englishWorkshop = getWorkshopBySlug(germanWorkshop.slug, "en");
      expect(englishWorkshop).toBeDefined();
      expect(englishWorkshop?.title).not.toBe(germanWorkshop.title);
      expect(englishWorkshop?.steps.map(({ n }) => n)).toEqual(
        germanWorkshop.steps.map(({ n }) => n),
      );
      const materialShape = ({
        href,
        kind,
        language,
        role,
        phase,
        minutes,
        optional,
        primary,
      }: WorkshopMaterial) => ({
        href,
        kind,
        language,
        role,
        phase,
        minutes,
        optional,
        primary,
      });
      expect(englishWorkshop?.materials.map(materialShape)).toEqual(
        germanWorkshop.materials.map(materialShape),
      );
      expect(
        englishWorkshop?.agenda.map(({ minutes, mode, activity, optional }) => ({
          minutes,
          mode,
          activity,
          optional,
        })),
      ).toEqual(
        germanWorkshop.agenda.map(({ minutes, mode, activity, optional }) => ({
          minutes,
          mode,
          activity,
          optional,
        })),
      );
      expect(englishWorkshop?.outcomes).toHaveLength(
        germanWorkshop.outcomes.length,
      );
      expect(englishWorkshop?.minutesLive).toBe(germanWorkshop.minutesLive);
      expect(englishWorkshop?.minutesSelfStudy).toBe(
        germanWorkshop.minutesSelfStudy,
      );
      expect(englishWorkshop?.agendaSource).toBe(germanWorkshop.agendaSource);
      expect({ ...englishWorkshop?.provenance, note: "" }).toEqual({
        ...germanWorkshop.provenance,
        note: "",
      });
      expect(
        englishWorkshop?.caseStudy.metrics.map(({ value }) => value),
      ).toHaveLength(germanWorkshop.caseStudy.metrics.length);
      expect(englishWorkshop?.caseStudy.dataLimitations).toHaveLength(
        germanWorkshop.caseStudy.dataLimitations.length,
      );
      expect(Boolean(englishWorkshop?.realWorldCase)).toBe(
        Boolean(germanWorkshop.realWorldCase),
      );
      expect(englishWorkshop?.decisionLab.choices.map(({ id }) => id)).toEqual(
        germanWorkshop.decisionLab.choices.map(({ id }) => id),
      );
      expect(englishWorkshop?.decisionLab.evidence.map(({ id }) => id)).toEqual(
        germanWorkshop.decisionLab.evidence.map(({ id }) => id),
      );
      expect(englishWorkshop?.decisionLab.recommendedChoiceId).toBe(
        germanWorkshop.decisionLab.recommendedChoiceId,
      );
      expect(englishWorkshop?.decisionLab.strongestEvidenceId).toBe(
        germanWorkshop.decisionLab.strongestEvidenceId,
      );
    }
  });

  it("states that every currently published material is English", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        for (const material of workshop.materials) {
          expect(
            material.language,
            `${locale}/${workshop.slug}/${material.href}`,
          ).toBe("en");
        }
      }
    }
  });

  it("does not claim that selecting workshop files prevents provider transfer", () => {
    const serialized = JSON.stringify(WORKSHOPS_BY_LOCALE);
    expect(serialized).not.toMatch(
      /nichts wird hochgeladen|nothing is uploaded|no separate upload/i,
    );
    expect(serialized).toMatch(/übertragen werden/i);
    expect(serialized).toMatch(/may be transferred/i);
  });
});


/** Verbs that describe a state of mind rather than something a learner can show. */
const UNOBSERVABLE_OUTCOME = {
  de: /\b(?:verstehen|verstehst|kennen|kennst|kennenlernen|lernst|lernen|wissen|weißt|beherrschen|beherrschst|meistern|Einblick|Gefühl)\b/i,
  en: /\b(?:understand|know|learn|learn about|master|appreciate|get a feel|unlock|empower)\b/i,
} as const;

describe("workshop standard fields", () => {
  it("holds one fixed question and three or four observable outcomes per workshop", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const label = `${locale}/${workshop.slug}`;
        expect(workshop.question.trim().length, label).toBeGreaterThan(10);
        expect(workshop.outcomes.length, label).toBeGreaterThanOrEqual(3);
        expect(workshop.outcomes.length, label).toBeLessThanOrEqual(4);
        for (const outcome of workshop.outcomes) {
          expect(outcome, label).not.toMatch(UNOBSERVABLE_OUTCOME[locale]);
          expect(outcome.split(/\s+/).length, label).toBeLessThanOrEqual(25);
        }
        expect(workshop.notForYou.trim().length, label).toBeGreaterThan(0);
      }
    }
  });

  it("has an agenda whose minutes add up to the stated live and self-study times", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const label = `${locale}/${workshop.slug}`;
        expect(workshop.agenda.length, label).toBeGreaterThanOrEqual(4);
        for (const item of workshop.agenda) {
          expect(item.label.trim().length, label).toBeGreaterThan(0);
          expect(Number.isInteger(item.minutes), label).toBe(true);
          expect(item.minutes, label).toBeGreaterThan(0);
        }
        if (workshop.minutesLive !== undefined) {
          expect(workshopAgendaMinutes(workshop, "live"), label).toBe(
            workshop.minutesLive,
          );
          // Self-study skips live-only items such as the question round.
          expect(workshop.minutesSelfStudy, label).toBeLessThanOrEqual(
            workshop.minutesLive,
          );
        } else {
          expect(workshop.agenda.every((item) => item.mode === "self"), label).toBe(true);
          expect(workshopAgendaMinutes(workshop, "self"), label).toBe(
            workshop.minutesSelfStudy,
          );
        }
        // A learner acts at least every 15 minutes of main path.
        let sinceAction = 0;
        for (const item of workshop.agenda.filter((entry) => entry.mode !== "live")) {
          sinceAction = item.activity === "listen" || item.activity === undefined
            ? sinceAction + item.minutes
            : 0;
          expect(sinceAction, `${label}: ${item.label}`).toBeLessThanOrEqual(15);
        }
      }
    }
  });

  it("states exact needs, what is not needed and two to four things left out", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const label = `${locale}/${workshop.slug}`;
        expect(workshop.needs.length, label).toBeGreaterThan(0);
        expect(workshop.notNeeded.length, label).toBeGreaterThan(0);
        expect(workshop.notCovered.length, label).toBeGreaterThanOrEqual(2);
        expect(workshop.notCovered.length, label).toBeLessThanOrEqual(4);
        for (const line of [...workshop.needs, ...workshop.notNeeded, ...workshop.notCovered]) {
          expect(line.trim().length, label).toBeGreaterThan(0);
        }
      }
    }
  });

  it("records provenance with ISO dates", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const { provenance } = workshop;
        const label = `${locale}/${workshop.slug}`;
        expect(provenance.author.trim().length, label).toBeGreaterThan(0);
        expect(provenance.reviewedAt, label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (provenance.liveRunAt) expect(provenance.liveRunAt, label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (provenance.aiOutputsRecordedAt) {
          expect(provenance.aiOutputsRecordedAt, label).toMatch(/^\d{4}-\d{2}(?:-\d{2})?$/);
        }
        expect(provenance.note.trim().length, label).toBeGreaterThan(0);
        expect(provenance.data === "synthetic", label).toBe(!workshop.realWorldCase);
      }
    }
  });

  it("gives every material a role and a phase, and marks exactly one place to start", () => {
    for (const locale of ["de", "en"] as const) {
      for (const workshop of getWorkshops(locale)) {
        const label = `${locale}/${workshop.slug}`;
        expect(workshop.materials.filter((material) => material.primary), label).toHaveLength(1);
        const primary = primaryWorkshopMaterial(workshop);
        expect(primary?.optional, label).not.toBe(true);
        for (const material of workshop.materials) {
          expect(["before", "during", "after"], material.href).toContain(material.phase);
          expect(material.role.length, material.href).toBeGreaterThan(0);
          // Downloads say how big they are; pages do not.
          if (material.kind === "html") expect(material.sizeLabel, material.href).toBeUndefined();
          else expect(material.sizeLabel, material.href).toMatch(/^\d+(?:[.,]\d)? (?:KB|MB)$/);
        }
      }
    }
  });

  it("keeps typographic dashes and staged slogans out of every workshop string", () => {
    const serialized = JSON.stringify(WORKSHOPS_BY_LOCALE);
    expect(serialized).not.toMatch(/[\u2014\u2013]/);
    expect(serialized).not.toMatch(
      /verdient ihren Aufwand|earns its (?:cost|keep)|Instructions guide, grants enforce|Anweisungen leiten, Rechte setzen durch|Herzstück|Erster Akt|Zweiter Akt|Dritter Akt|ehrliche Nachfrage|Ohne Code, ohne|No code, no/i,
    );
  });
});

describe("getWorkshopBySlug", () => {
  it("returns the matching workshop", () => {
    const workshop = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen");
    expect(workshop).toBeDefined();
    expect(workshop?.title).toBe("Geschäftsberichte mit KI lesen");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getWorkshopBySlug("gibt-es-nicht")).toBeUndefined();
  });

  it("returns the reviewed English version", () => {
    expect(
      getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", "en")?.title,
    ).toBe("Read business reports with AI");
  });
});

describe("getWorkshopSlugs", () => {
  it("returns every catalog slug", () => {
    expect(getWorkshopSlugs()).toEqual(
      WORKSHOPS.map((workshop) => workshop.slug),
    );
  });
});
