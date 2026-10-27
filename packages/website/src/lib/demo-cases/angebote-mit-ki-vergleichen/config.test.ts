import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { validateBeatsV4 } from "@/lib/demo-beats";
import { BEATS } from "./beats";
import { DEMO, HORIZON } from "./config";
import { COPY } from "./copy";

/**
 * The v4 path keeps rotfaden's red line with the method folded into the basis beat: demo.json's beats
 * in their order minus "methode", the same kinds, every kit file a beat names inside the published
 * zip, the objective and the field card's three lines word for word. The captions are the v4 copy's
 * own full sentences now (PORT-LOG: v4 rewrote every caption).
 */
const ZIP = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip")),
);
const KIT = "angebote-vergleichen-kit";

describe("Workshop 06 demo config", () => {
  it("has demo.json's beats in order with the method folded into the basis", () => {
    const kept = DEMO.beats.filter((beat) => beat.id !== "methode");
    expect(BEATS.map((beat) => beat.id)).toEqual(kept.map((beat) => beat.id));
    expect(BEATS.map((beat) => beat.kind)).toEqual(kept.map((beat) => beat.kind));
    expect(validateBeatsV4(BEATS)).toEqual([]);
  });

  it("names kit files that exist in the zip; the basis beat names the field card demo.json's method used", () => {
    for (const beat of BEATS) {
      if (!beat.kitFile) continue;
      expect(readZipText(ZIP, beat.kitFile), beat.kitFile).not.toBeNull();
    }
    const method = DEMO.beats.find((beat) => beat.id === "methode");
    expect(BEATS.find((beat) => beat.id === "kipp")?.kitFile).toBe(`${KIT}/${method && "kit_file" in method ? method.kit_file : ""}`);
  });

  it("keeps the objective and the field card's three lines word for word", () => {
    expect(COPY.de.objective).toBe(DEMO.promise);
    const method = DEMO.beats.find((beat) => beat.id === "methode");
    expect(COPY.de.methode.lines).toEqual(method && "lines" in method ? method.lines : []);
    const card = readZipText(ZIP, `${KIT}/karten/feldkarte.md`) ?? "";
    for (const line of COPY.de.methode.lines) expect(card).toContain(line);
    expect(card).toContain(`# Welches Angebot ist günstiger? ${COPY.de.methode.title}`);
    for (const quote of Object.values(COPY.de.lieferort.cardQuotes)) expect(card).toContain(quote);
  });

  it("gives English the same shape and the same placeholders", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(shape)
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
          : typeof value;
    expect(shape(COPY.en)).toEqual(shape(COPY.de));
    const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const walk = (de: unknown, en: unknown, at: string) => {
      if (typeof de === "string") {
        expect(holes(en as string), at).toEqual(holes(de));
        return;
      }
      if (de && typeof de === "object") {
        for (const [key, inner] of Object.entries(de)) walk(inner, (en as Record<string, unknown>)[key], `${at}.${key}`);
      }
    };
    walk(COPY.de, COPY.en, "COPY");
  });

  it("counts one year, the kit's horizon", () => {
    expect(HORIZON).toBe(1);
  });
});
