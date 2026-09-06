/**
 * The public skills collection.
 *
 * A skill is one authored Markdown document under
 * `content/skills/<name>/SKILL.md`. That directory is the single source of
 * truth: the route below serves those exact bytes, and
 * `scripts/skills-mirror-check.mjs` compares every downstream copy against the
 * same files. Nothing here holds skill text of its own, so a served skill and
 * an authored skill cannot drift apart.
 *
 * Node.js fs, read at build time by the static route handler. Must not run on
 * the Edge runtime.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Every skill directory carries exactly this one document. */
export const SKILL_DOCUMENT_FILENAME = "SKILL.md";

/**
 * A skill name is also a URL segment and a directory name. Lower-case ASCII
 * words joined by single hyphens keep the three identical, and refuse anything
 * that could traverse out of the content directory.
 */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Long enough for a descriptive name, short enough to stay a readable URL. */
export const SKILL_NAME_MAX_LENGTH = 64;

export function isSkillName(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= SKILL_NAME_MAX_LENGTH &&
    SKILL_NAME_PATTERN.test(value)
  );
}

/**
 * Works in development and during the production build, where the working
 * directory is the website package in both cases (same resolution the book
 * reader uses for `content/books`).
 */
export function skillsContentRoot(): string {
  return path.join(process.cwd(), "content", "skills");
}

/** Absent file rather than an unreadable one: everything else is a real fault. */
function isMissingEntryError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code === "ENOENT" || code === "ENOTDIR" || code === "EISDIR";
}

/**
 * Skill names in the collection, sorted, derived from the content directory so
 * no second list can go stale. A directory whose name is not a valid skill name
 * is ignored rather than served under a name the router cannot reproduce.
 */
export async function listSkillNames(): Promise<readonly string[]> {
  let entries;
  try {
    entries = await readdir(skillsContentRoot(), { withFileTypes: true });
  } catch (error) {
    if (isMissingEntryError(error)) return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory() && isSkillName(entry.name))
    .map((entry) => entry.name)
    .sort();
}

/** The authored document, or null when the name is unknown or invalid. */
export async function readSkillDocument(name: string): Promise<string | null> {
  if (!isSkillName(name)) return null;
  const file = path.join(skillsContentRoot(), name, SKILL_DOCUMENT_FILENAME);
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (isMissingEntryError(error)) return null;
    throw error;
  }
}
