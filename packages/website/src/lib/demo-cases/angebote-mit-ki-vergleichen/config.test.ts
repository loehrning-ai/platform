import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { BEATS } from "./beats";
import { DEMO, HORIZON } from "./config";
import { COPY } from "./copy";

/**
 * The port keeps rotfaden's red line: the same beats in the same order with the same kinds and
 * German labels as demo.json, the German words of demo.json word for word, and every kit file a
 * beat names inside the published zip.
 */
const ZIP = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip")),
);

describe("Workshop 06 demo config", () => {
  it("has the beats of demo.json: ids, kinds and German labels, in order", () => {
    expect(BEATS.map((beat) => beat.id)).toEqual(DEMO.beats.map((beat) => beat.id));
    expect(BEATS.map((beat) => beat.kind)).toEqual(DEMO.beats.map((beat) => beat.kind));
    expect(BEATS.map((beat) => beat.label.de)).toEqual(DEMO.beats.map((beat) => beat.label));
  });

  it("keeps the reveal's length from demo.json", () => {
    const reveal = DEMO.beats.find((beat) => beat.kind === "reveal");
    expect(reveal && "seconds" in reveal ? reveal.seconds : null).toBe(BEATS.find((beat) => beat.kind === "reveal")?.seconds);
  });

  it("names kit files that exist in the zip, the method beat the one demo.json names", () => {
    for (const beat of BEATS) {
      if (!beat.kitFile) continue;
      expect(readZipText(ZIP, beat.kitFile), beat.kitFile).not.toBeNull();
    }
    const method = DEMO.beats.find((beat) => beat.id === "methode");
    expect(BEATS.find((beat) => beat.id === "methode")?.kitFile).toBe(
      `angebote-vergleichen-kit/${method && "kit_file" in method ? method.kit_file : ""}`,
    );
  });

  it("speaks demo.json's German word for word", () => {
    const de = COPY.de;
    const byId = Object.fromEntries(DEMO.beats.map((beat) => [beat.id, beat])) as Record<string, (typeof DEMO.beats)[number]>;
    const field = (id: string, key: string) => (byId[id] as Record<string, unknown>)[key];
    expect(de.question).toBe(DEMO.question);
    expect(de.caseLine).toBe(DEMO.case_line);
    expect(de.objective).toBe(DEMO.promise);
    expect(de.tipp.caption).toBe(field("tipp", "caption"));
    expect(de.tipp.lever).toBe(field("tipp", "lever"));
    expect(de.kipp.caption).toBe(field("kipp", "caption"));
    expect(de.methode.caption).toBe(field("methode", "caption"));
    expect(de.methode.lines).toEqual(field("methode", "lines"));
    expect(de.papier.caption).toBe(field("papier", "caption"));
    expect(de.papier.lever).toBe(field("papier", "lever"));
    expect(de.deins.caption).toBe(field("deins", "caption"));
    expect(de.mitnehmen.caption).toBe(field("mitnehmen", "caption"));
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
