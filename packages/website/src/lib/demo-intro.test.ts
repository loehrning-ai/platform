import { describe, expect, it } from "vitest";
import { DEMO_INTROS, demoShell } from "./demo-intros";
import { introSentences, validateIntro } from "./demo-intro";
import { validateBeatsV4, type Beat } from "./demo-beats";
import { DEMO_SLUGS } from "./demos";

describe("demo intros (language-standard B.8)", () => {
  it("has an intro for all six demos that meets the formula in both languages", () => {
    expect(Object.keys(DEMO_INTROS).sort()).toEqual([...DEMO_SLUGS].sort());
    for (const slug of DEMO_SLUGS) {
      expect(validateIntro(DEMO_INTROS[slug].INTRO), slug).toEqual([]);
      expect(["v3", "v4"]).toContain(demoShell(slug));
    }
  });

  it("fills the minutes and rejects telegram style, dashes and long buttons", () => {
    const copy = DEMO_INTROS["ki-prognosen-einschaetzen"].INTRO.de;
    expect(introSentences(copy, 4)[3]).toContain("4 Minuten");
    const broken = {
      de: { ...copy, sentences: ["Kurz – knapp", copy.sentences[1], copy.sentences[2], "Ohne Minuten."] as const, start: "Ein sehr langer Knopf mit sieben Wörtern hier" },
      en: DEMO_INTROS["ki-prognosen-einschaetzen"].INTRO.en,
    };
    const errors = validateIntro(broken).join("\n");
    expect(errors).toMatch(/not a full sentence/);
    expect(errors).toMatch(/dash or symbol/);
    expect(errors).toMatch(/\{minutes\} slot/);
    expect(errors).toMatch(/six words/);
  });
});

describe("v4 beats", () => {
  const label = { de: "Schritt", en: "Step" };
  const beat = (id: string, kind: Beat["kind"], extra: Partial<Beat> = {}): Beat => ({ id, kind, seconds: 1, label, ...extra });

  it("lets the path take its own shape between the commit and the takehome", () => {
    const beats = [beat("schaetzen", "commit"), beat("werkzeug", "tool"), beat("aufloesung", "reveal"), beat("deins", "own"), beat("mitnehmen", "takehome")];
    expect(validateBeatsV4(beats)).toEqual([]);
  });

  it("requires a commit first, one own beat, the takehome last and full step sentences", () => {
    const errors = validateBeatsV4([
      beat("werkzeug", "tool", { step: { de: "Du rechnest", en: "You work it out." } }),
      beat("deins", "own"),
      beat("auch", "own"),
      beat("ende", "reveal", { nextName: { de: "die Spanne", en: "" } }),
    ]).join("\n");
    expect(errors).toMatch(/first beat must be a commit/);
    expect(errors).toMatch(/last beat must be the takehome/);
    expect(errors).toMatch(/exactly one own beat/);
    expect(errors).toMatch(/must be a full sentence/);
    expect(errors).toMatch(/nextName needs en/);
  });
});
