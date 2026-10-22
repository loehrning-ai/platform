import { describe, expect, it } from "vitest";
import {
  contentLocalesForPath,
  hasEnglishContentParity,
} from "./content-parity";

describe("translated-content parity registry", () => {
  it("claims reviewed English parity only for audited routes", () => {
    for (const path of [
      "/",
      "/ai-native",
      "/ai-native/glossar",
      "/ai-native/verifizierung",
      "/blog",
      "/bot",
      "/blog/eu-ai-act-grundlagen",
      "/buecher",
      "/buecher/ki-landschaft",
      "/buecher/ki-landschaft/01_zweimal_gemessen",
      "/buecher/ki-landschaft/02_textmenge",
      "/buecher/ki-landschaft/03_schaufenster",
      "/buecher/ki-landschaft/04_stellen_namen",
      "/buecher/ki-landschaft/05_land",
      "/buecher/ki-landschaft/06_stimmen",
      "/buecher/ki-landschaft/07_schluessel",
      "/buecher/ki-landschaft/08_dein_zug",
      "/buecher/ki-landschaft/09_quellen",
      "/datenschutz",
      "/demos",
      "/demos/datenbereitschaft-fuer-ki",
      "/demos/esg-berichte-mit-ki",
      "/demos/geschaeftsberichte-mit-ki-lesen",
      "/demos/ki-im-unternehmen-sicher-nutzen",
      "/demos/ki-prognosen-einschaetzen",
      "/einstieg",
      "/eu-ai-act-kurs",
      "/hilfe",
      "/impressum",
      "/ki-check",
      "/ki-fuehrerschein",
      "/ki-und-gesellschaft",
      "/kurse",
      "/kurse/open-source/ai-native-operator",
      "/kurse/open-source/data-engineering-fundamentals",
      "/kurse/open-source/data-infrastructure",
      "/kurse/open-source/data-science",
      "/neuigkeiten",
      "/open-source",
      "/open-source/lizenzrichtlinie",
      "/open-source/tools/cv-engine",
      "/ueber-mich",
      "/workshops",
      "/workshops/esg-berichte-mit-ki/kit",
      "/workshops/geschaeftsberichte-mit-ki-lesen",
      "/workshops/ki-prognosen-einschaetzen",
    ]) {
      expect(contentLocalesForPath(path), path).toEqual(["de", "en"]);
      expect(hasEnglishContentParity(path), path).toBe(true);
    }
  });

  it("does not claim English parity for routes that remain untranslated", () => {
    for (const path of [
      "/open-source/tools/unreviewed",
      "/open-source/projects/unreviewed",
      "/buecher/ki-landschaft/untranslated-chapter",
      "/demos/unreviewed",
      "/workshops/unreviewed-slug",
    ]) {
      expect(contentLocalesForPath(path), path).toEqual(["de"]);
      expect(hasEnglishContentParity(path), path).toBe(false);
    }
  });
});
