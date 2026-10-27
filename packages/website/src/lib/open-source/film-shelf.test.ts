import { describe, expect, it } from "vitest";
import type { DerivedFilm } from "./artifacts";
import { shelveFilms } from "./film-shelf";

const film = (src: string, width: number, height: number): DerivedFilm => ({
  src,
  sha256: "0".repeat(64),
  sizeBytes: 1,
  derivedFrom: src,
  width,
  height,
  durationS: 1,
  poster: { src: `${src}.jpg`, sha256: "0".repeat(64), sizeBytes: 1 },
  alt: src,
});

describe("shelveFilms", () => {
  it("shows the upright cut on a phone and the wide cut from sm up, counted once", () => {
    const shelf = shelveFilms([film("wide", 1280, 720), film("upright", 720, 1280)]);
    expect(shelf.films.map((entry) => entry.className)).toEqual(["hidden sm:block", "sm:hidden"]);
    expect(shelf.count).toBe(1);
  });

  it("shows every film everywhere when there is only one orientation", () => {
    const shelf = shelveFilms([film("a", 504, 484), film("b", 720, 720)]);
    expect(shelf.films.map((entry) => entry.className)).toEqual(["", ""]);
    expect(shelf.count).toBe(2);
  });
});
