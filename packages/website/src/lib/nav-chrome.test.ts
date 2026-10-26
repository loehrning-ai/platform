import { describe, expect, it } from "vitest";
import { navChrome } from "./nav-chrome";

describe("navChrome", () => {
  it("wears glass where the top of the page moves: home, demos, workshops, open source", () => {
    for (const path of [
      "/",
      "/demos",
      "/demos/ki-prognosen-einschaetzen",
      "/workshops",
      "/workshops/esg-berichte-mit-ki",
      "/open-source",
      "/open-source/tools/cv-engine",
      "/demos/",
    ]) {
      expect(navChrome(path), path).toBe("glass");
    }
  });

  it("stays paper on reading pages: lessons, articles, kit pages, legal, account", () => {
    for (const path of [
      "/blog",
      "/blog/eu-ai-act-grundlagen",
      "/workshops/esg-berichte-mit-ki/kit",
      "/impressum",
      "/datenschutz",
      "/open-source/lizenzrichtlinie",
      "/ki-fuehrerschein/kurs/1",
      "/kurse/open-source/data-science/einstieg",
      "/buecher/ki-kompass/kapitel-1",
      "/konto",
      "/login",
    ]) {
      expect(navChrome(path), path).toBe("paper");
    }
  });

  it("fails safe to paper for a route it does not know", () => {
    expect(navChrome("/irgendwas-neues")).toBe("paper");
    expect(navChrome("")).toBe("paper");
  });
});
