/**
 * The poster palettes ("Plakat"), the single TypeScript source for SVG
 * posters, OG images, social cards, deck covers and static generators.
 *
 * Four scenes of three colours each (ground, ink, mid), sampled from the four
 * reference posters: Lemons, IDEA, Bloom and Autumn. The CSS twin is the
 * `.plakat-*` scopes and the `@theme static` block in `src/app/globals.css`;
 * `palettes.test.ts` keeps both equal, and `docs/plakat-pairings.md` lists
 * every pairing with its contrast ratio.
 *
 * This module has no imports on purpose: `scripts/plakat/*.mjs` load it with
 * Node's type stripping, outside the Next and Vite toolchains.
 */

/** Role values of one scene. Hex values are six-digit, lower case. */
export interface PlakatPalette {
  /** Band or cover ground. */
  readonly ground: string;
  /** The one strong pair with the ground: type, buttons, the focus ring. */
  readonly ink: string;
  /** Decorative shapes (1.9 to 3.7:1 on the ground). Never text. */
  readonly mid: string;
  /** A shape that carries meaning: 3:1 or more on the ground. */
  readonly mark: string;
  /** Text in the mid hue: 4.5:1 or more on the ground. */
  readonly accentText: string;
  /**
   * The filled scene button (`--color-scene-button`). The ink where the ink
   * is light or a clear colour; never a near-black ink such as Aubergine,
   * which reads as a black button on the site.
   */
  readonly button: string;
  /** The filled button's label (`--color-scene-button-text`): 4.5:1 or more on `button`. */
  readonly buttonText: string;
  /** The scene's ink on paper: Kopflinie, tab marker, StatRow values, lesson H1. */
  readonly line: string;
  /** Weight of the poster numeral: 700, or 400 for the light autumn "04". */
  readonly numWeight: 400 | 700;
  /** Which role colours the numeral. IDEA sets it in Himbeere (display size only). */
  readonly numRole: "ink" | "mid";
  /** Four ink dots in the poster corners (IDEA only). */
  readonly cornerDots: boolean;
  /**
   * The second data series of a result chart on Kalkweiß; the first is
   * `line`. Charts never separate the two by hue alone: see
   * docs/plakat-pairings.md, "Charts on Kalkweiß".
   */
  readonly chartAccent: string;
}

export const PLAKAT = {
  lemons: {
    ground: "#152a79", // Ultramarin
    ink: "#fceeaf", // Butter, 10.97 on Ultramarin
    mid: "#b73a15", // Mennige, 2.21: shapes only
    mark: "#fceeaf",
    accentText: "#fceeaf",
    button: "#fceeaf", // Butter fill
    buttonText: "#152a79", // Ultramarin label, 10.97
    line: "#152a79", // 11.40 on Kalkweiß
    numWeight: 700,
    numRole: "ink",
    cornerDots: false,
    chartAccent: "#b73a15", // Mennige, 5.15 on Kalkweiß
  },
  idea: {
    ground: "#ecebdd", // Kreide
    ink: "#2e4d90", // Kobalt, 6.78 on Kreide
    mid: "#c94a7f", // Himbeere, 3.67: display type and shapes
    mark: "#c94a7f",
    accentText: "#b6386f", // Himbeere tief, 4.62 on Kreide
    button: "#2e4d90", // Kobalt fill
    buttonText: "#ecebdd", // Kreide label, 6.78
    line: "#2e4d90", // 7.24 on Kalkweiß
    numWeight: 700,
    numRole: "mid",
    cornerDots: true,
    chartAccent: "#b6386f", // Himbeere tief, 4.94 on Kalkweiß; hatch mandatory
  },
  bloom: {
    ground: "#e6d3af", // Sand
    ink: "#3b1f45", // Aubergine, 9.74 on Sand
    mid: "#d1733d", // Terrakotta, 2.30: shapes only
    mark: "#3b1f45",
    accentText: "#964305", // Terrakotta tief, 4.61 on Sand
    button: "#964305", // Terrakotta tief fill, not the Aubergine ink (reads black)
    buttonText: "#fffcf5", // Bogen label, 6.61
    line: "#3b1f45", // 12.73 on Kalkweiß
    numWeight: 700,
    numRole: "ink",
    cornerDots: false,
    chartAccent: "#964305", // Terrakotta tief, 6.03 on Kalkweiß
  },
  autumn: {
    ground: "#944d44", // Rost
    ink: "#f0e1ca", // Creme, 4.80 on Rost: 17px and 400 or more only
    mid: "#e4a057", // Ocker, 2.78: decoration only
    mark: "#ebb16a", // Ocker hell, 3.24
    accentText: "#f0e1ca",
    button: "#f0e1ca", // Creme fill
    buttonText: "#944d44", // Rost label, 4.80
    line: "#944d44", // 5.49 on Kalkweiß
    numWeight: 400,
    numRole: "ink",
    cornerDots: false,
    chartAccent: "#9b5e07", // Ocker tief, 4.68 on Kalkweiß only; hatch mandatory
  },
} as const satisfies Record<string, PlakatPalette>;

export type PlakatKey = keyof typeof PLAKAT;

/** The scenes in the series order the owner sent the reference posters in. */
export const PLAKAT_KEYS = ["lemons", "idea", "bloom", "autumn"] as const satisfies readonly PlakatKey[];

/**
 * Poster motifs. Geometry lives in `src/lib/plakat/motifs.ts`; ids only here,
 * so the mappings below stay importable without the geometry.
 */
export const MOTIF_IDS = [
  // Workshops
  "fan",
  "pie",
  "dome",
  "leaves",
  // Grundlagenpfad
  "disc",
  "pair",
  "ring",
  "steps",
  // Visuelles Lernen, Betriebsmodell (quarter and wedge are spare motifs)
  "quarter",
  "wedge",
  "halfdisc",
  // Visuelles Lernen, Daten
  "slab",
  "band",
  "sun",
] as const;

export type MotifId = (typeof MOTIF_IDS)[number];

export interface WorkshopPlakat {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
}

/**
 * Locked (Werkzeichnung v2, decision D3): one palette per workshop, four
 * workshops, four palettes, in the series order. The deck, the social card,
 * the OG image and the static materials read this map and no other.
 */
export const WORKSHOP_PLAKAT = {
  "ki-prognosen-einschaetzen": { plakat: "lemons", motif: "fan" },
  "geschaeftsberichte-mit-ki-lesen": { plakat: "idea", motif: "pie" },
  "datenbereitschaft-fuer-ki": { plakat: "bloom", motif: "dome" },
  "esg-berichte-mit-ki": { plakat: "autumn", motif: "leaves" },
} as const satisfies Record<string, WorkshopPlakat>;

export type WorkshopPlakatSlug = keyof typeof WORKSHOP_PLAKAT;

/** A poster numeral exists only where a sequence exists (Grundlagenpfad 01 to 04). */
export type PlakatNumeral = "01" | "02" | "03" | "04";

export interface CoursePlakat {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  readonly numeral: PlakatNumeral | null;
}

/**
 * Track palettes. Keys equal the `TechnicalCourseFrame` `courseId` values and
 * the course catalogue slugs. Colour groups by track: Grundlagenpfad is
 * Lemons with its numerals, the visual-learning courses are IDEA (operating
 * model) and Bloom (data), without numerals.
 */
export const COURSE_PLAKAT = {
  "ki-fuehrerschein": { plakat: "lemons", motif: "disc", numeral: "01" },
  "ki-und-gesellschaft": { plakat: "lemons", motif: "pair", numeral: "02" },
  "eu-ai-act-kurs": { plakat: "lemons", motif: "ring", numeral: "03" },
  "ai-native": { plakat: "lemons", motif: "steps", numeral: "04" },
  "ai-native-capstone-policy": { plakat: "lemons", motif: "steps", numeral: null },
  "ai-native-operator": { plakat: "idea", motif: "halfdisc", numeral: null },
  "data-infrastructure": { plakat: "bloom", motif: "slab", numeral: null },
  "data-engineering-fundamentals": { plakat: "bloom", motif: "band", numeral: null },
  "data-science": { plakat: "bloom", motif: "sun", numeral: null },
} as const satisfies Record<string, CoursePlakat>;

export type CoursePlakatId = keyof typeof COURSE_PLAKAT;

/**
 * `TechnicalCourseFrame` ids that stay paper on purpose, with no scene and no
 * `data-plakat-page` (SPEC §3.1 and §5): the AI-Native demos keep their own
 * light engine panels, the glossary is a reading surface and the fluency test
 * is a form. A frame reads its scene through `coursePlakat(courseId)` and renders
 * no scene when it returns undefined; `palettes.test.ts` fails on any other
 * unmapped id.
 */
export const UNSCENED_COURSE_IDS = [
  "ai-native-demos",
  "ai-native-glossary",
  "ai-native-fluency-test",
  "ai-native-fluency-result",
] as const;

/**
 * The paper and ink of the chrome, for renderers that cannot read CSS tokens
 * (Satori OG images, static generators). Equal to `--color-background`,
 * `--color-paper`, `--color-foreground`, `--color-muted-foreground` and
 * `--color-mennige` in globals.css.
 */
export const PAPER = {
  kalkweiss: "#f7f1e7",
  bogen: "#fffcf5",
  druckschwarz: "#121212",
  schiefer: "#4f4640",
  mennige: "#b73a15",
} as const;

/** Route families with a fixed scene. Workshops and courses use the maps above. */
export const ROUTE_PLAKAT = {
  home: "lemons",
  demos: "idea",
  blog: "idea",
} as const satisfies Record<string, PlakatKey>;

/**
 * The home hero's ground: "lemons" (the Ultramarin poster) or "paper", the
 * old paper hero with the ink line globe that the site keeps. There is no
 * graphit fallback: the site has no black grounds.
 */
export const HOME_SCENE: "lemons" | "paper" = "paper";

/** The class that scopes an element to a scene, e.g. `plakat-autumn`. */
export function plakatClass(key: PlakatKey): `plakat-${PlakatKey}` {
  return `plakat-${key}`;
}

export function isPlakatKey(value: string): value is PlakatKey {
  return Object.hasOwn(PLAKAT, value);
}

/** The workshop's scene and motif, or undefined for a slug without a poster. */
export function workshopPlakat(slug: string): WorkshopPlakat | undefined {
  return Object.hasOwn(WORKSHOP_PLAKAT, slug)
    ? WORKSHOP_PLAKAT[slug as WorkshopPlakatSlug]
    : undefined;
}

/** The course's scene, motif and numeral, or undefined for an unmapped id. */
export function coursePlakat(courseId: string): CoursePlakat | undefined {
  return Object.hasOwn(COURSE_PLAKAT, courseId)
    ? COURSE_PLAKAT[courseId as CoursePlakatId]
    : undefined;
}

/**
 * The workshops hub band takes the newest workshop's palette: the mapped
 * workshop with the highest catalogue number. An empty or unmapped list
 * falls back to the home scene, so the hub never renders without a scene.
 */
export function hubPlakat(
  workshops: readonly { readonly slug: string; readonly number: string }[],
): PlakatKey {
  let newest: { readonly number: number; readonly plakat: PlakatKey } | undefined;
  for (const workshop of workshops) {
    const entry = workshopPlakat(workshop.slug);
    const number = Number.parseInt(workshop.number, 10);
    if (!entry || !Number.isFinite(number)) continue;
    if (!newest || number > newest.number) newest = { number, plakat: entry.plakat };
  }
  return newest?.plakat ?? ROUTE_PLAKAT.home;
}
