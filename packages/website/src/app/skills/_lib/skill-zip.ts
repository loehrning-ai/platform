import { zipStore } from "@/lib/zip/store";
import { SKILL_DOCUMENT_FILENAME } from "./registry";

/** The suffix of the one-tap download, /skills/<name>.zip. */
export const SKILL_ZIP_SUFFIX = ".zip";

/**
 * The upload-ready archive of one skill: exactly `<name>/SKILL.md` at the top
 * level (claude.ai does not recognise a SKILL.md at the zip root), STORE,
 * fixed 1980-01-01 timestamps, so the bytes depend on the document alone.
 */
export function skillZip(name: string, document: string): Uint8Array {
  return zipStore([{ path: `${name}/${SKILL_DOCUMENT_FILENAME}`, data: document }]);
}

/** "probe.zip" -> "probe"; anything else -> null. */
export function skillNameFromZipSegment(segment: string): string | null {
  return segment.endsWith(SKILL_ZIP_SUFFIX) ? segment.slice(0, -SKILL_ZIP_SUFFIX.length) : null;
}
