import { describe, expect, it } from "vitest";
import { detect } from "./detect";
import { citeLine, verdict } from "./verdict";
import { SAMPLES } from "./samples";
import type { AccountId, Hit } from "./types";

const [ana, marko, mila] = SAMPLES.de;
const run = (text: string, account: AccountId, opts: { publicText?: boolean; live?: readonly Hit[] } = {}) =>
  verdict({ live: opts.live ?? detect(text), account, publicText: opts.publicText ?? false, clean: text });

describe("the kit key, reproduced on the raw samples", () => {
  it("scene 1: Ana on a personal account is RED (customer data on a personal account)", () => {
    expect(run(ana.text, "personal")).toMatchObject({ light: "red", reason: "customerOnPersonal", todo: ["namesOut"] });
  });
  it("scene 4: Marko on a personal account is RED (a key is a secret)", () => {
    expect(run(marko.text, "personal")).toMatchObject({ light: "red", reason: "secret", todo: ["changeKey"] });
  });
  it("scene 6: Mila on Enterprise is AMBER, and Enterprise does not turn red into green", () => {
    const v = run(mila.text, "enterprise");
    expect(v).toMatchObject({ light: "amber", reason: "companyRaw", enterpriseNote: true });
  });
});

describe("the matrix", () => {
  const accounts: AccountId[] = ["personal", "team", "enterprise"];

  it("row 1: a live secret is red on every account", () => {
    for (const account of accounts) expect(run(marko.text, account).light).toBe("red");
  });

  it("row 2: live customer data is red on a personal account", () => {
    expect(run(ana.text, "personal").reason).toBe("customerOnPersonal");
  });

  it("row 3: public text is green only with zero live hits", () => {
    for (const account of accounts) {
      expect(run("Öffentlicher Text.", account, { publicText: true })).toMatchObject({ light: "green", reason: "publicText" });
    }
    expect(run(ana.text, "team", { publicText: true }).light).toBe("amber");
    expect(run(ana.text, "personal", { publicText: true }).light).toBe("red");
  });

  it("row 4: clean text on a personal account is OPEN, never green", () => {
    expect(run("Nichts Besonderes.", "personal")).toMatchObject({ light: "open", reason: "personalClean", cites: [10] });
  });

  it("row 5: live customer data on a company account is amber", () => {
    for (const account of ["team", "enterprise"] as const) {
      expect(run(ana.text, account)).toMatchObject({ light: "amber", reason: "companyRaw", todo: ["namesOut", "personReads"] });
    }
  });

  it("row 6: clean text on a company account is amber with contract and reader, plus company names when the text has a company form", () => {
    expect(run("Entwurf.", "team")).toMatchObject({ light: "amber", reason: "companyClean", todo: ["contract", "personReads"] });
    expect(run("Tannwald Haustechnik GmbH", "team", { live: [] }).todo).toEqual(["contract", "personReads", "companyNames"]);
    expect(run("Vardar Works DOOEL", "enterprise", { live: [] }).todo).toContain("companyNames");
  });

  it("shows the Enterprise note only for red and amber", () => {
    expect(run("x", "enterprise", { live: [] }).enterpriseNote).toBe(true);
    expect(run("x", "enterprise", { publicText: true, live: [] }).enterpriseNote).toBe(false);
    expect(run(ana.text, "team").enterpriseNote).toBe(false);
  });

  it("never lets an account alone make red green", () => {
    for (const account of accounts) {
      const lights = ["red", "amber", "open"];
      expect(lights).toContain(run(ana.text, account).light);
    }
  });

  it("drops to the clean verdict once the hits are blacked out (live shrinks)", () => {
    expect(run(ana.text, "personal", { live: [] }).light).toBe("open");
  });
});

describe("cite line", () => {
  const words = { slide: "Folie", mission: "Mission", fact: "Fakt" };
  it("orders slide, mission, then facts ascending", () => {
    expect(citeLine(["deck07", 10], words)).toBe("Folie 7 · Fakt 10");
    expect(citeLine([13, "answers3", "deck07", 4], words)).toBe("Folie 7 · Mission 3 · Fakt 4 · Fakt 13");
  });
});
