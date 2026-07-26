import type { OpenSourceArtifactKind } from "@/lib/open-source/artifacts";

/**
 * Singular German kind stamps pressed onto each Werkverzeichnis card. These
 * are deliberately NOT headings: the plural lane headings ("Werkzeuge",
 * "Projekte", "Videos") were removed with the taxonomy, and the absence
 * assertions in the shelf spec keep guarding that they never return as
 * headings. Mirrors the `STATUS_LABELS` single-source pattern, including the
 * convention that e2e specs duplicate expected strings on purpose.
 */
export const KIND_LABELS = {
  tool: "Werkzeug",
  project: "Projekt",
  video: "Video",
} as const satisfies Record<OpenSourceArtifactKind, string>;
