import type { DerivedFilm } from "./artifacts";

export interface ShelvedFilm {
  readonly film: DerivedFilm;
  /** Tailwind classes that pick the film for the screen it suits. */
  readonly className: string;
}

/**
 * The same film cut upright and wide is one recording, shown once: on a
 * phone (below `sm`) the upright cut, from `sm` up the wide one. Without
 * both cuts every film shows everywhere. `count` is what a reader sees at
 * any width.
 */
export function shelveFilms(films: readonly DerivedFilm[]): {
  readonly films: readonly ShelvedFilm[];
  readonly count: number;
} {
  const upright = (film: DerivedFilm) => film.height > film.width;
  const paired = films.some(upright) && films.some((film) => !upright(film));
  return {
    films: films.map((film) => ({
      film,
      className: !paired ? "" : upright(film) ? "sm:hidden" : "hidden sm:block",
    })),
    count: paired ? Math.max(films.filter(upright).length, films.filter((film) => !upright(film)).length) : films.length,
  };
}
