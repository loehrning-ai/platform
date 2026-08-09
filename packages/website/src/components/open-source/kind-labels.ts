import type { OpenSourceArtifactKind } from "@/lib/open-source/artifacts";
import type { Locale } from "@/lib/i18n/locale";
import { OPEN_SOURCE_SHARED_COPY } from "@/lib/open-source/display-copy";

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

export function kindLabel(
  kind: OpenSourceArtifactKind,
  locale: Locale,
): string {
  return OPEN_SOURCE_SHARED_COPY[locale].kinds[kind];
}
