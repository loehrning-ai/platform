/**
 * Deterministic, stored ZIP for the Data Readiness kit.
 *
 * Shared by scripts/export-data-readiness-workshop.mjs and
 * scripts/course03/refresh-published.mjs so both produce byte-identical
 * archives: no timestamps, no platform metadata, no compression, 0644 files.
 */
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";

export const KIT_PREFIX = "data-readiness-kit/";

/**
 * The learner layer, written in this repository, in archive order. Each name
 * maps to its source file relative to the repository root: the question card
 * is the published template (content/vorlagen), the skill is the served one
 * (content/skills), and the claude/ editions are what the demo's "Deine Karte"
 * makes from the FOLDLINE preset (kit-lockstep.test.ts keeps them in step).
 */
export const KIT_LEARNER_SOURCES = {
  "START-HIER.md": "scripts/course03/kit/START-HIER.md",
  "START-HERE.md": "scripts/course03/kit/START-HERE.md",
  "FRAGEKARTE.md": "packages/website/content/vorlagen/fragekarte.md",
  "QUESTION-CARD.md": "packages/website/content/vorlagen/en/fragekarte.md",
  "claude/README.md": "scripts/course03/kit/claude/README.md",
  "claude/kennzahl-fragekarte/SKILL.md": "packages/website/content/skills/kennzahl-fragekarte/SKILL.md",
  "claude/kennzahl-fragekarte/references/kennzahlen.md": "scripts/course03/kit/claude/kennzahl-fragekarte/references/kennzahlen.md",
  "claude/PROJEKT-ANWEISUNG-VORLAGE.txt": "scripts/course03/kit/claude/PROJEKT-ANWEISUNG-VORLAGE.txt",
  "claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt": "scripts/course03/kit/claude/PROJECT-INSTRUCTIONS-TEMPLATE.txt",
  "claude/PRUEFLISTE-VORLAGE.md": "scripts/course03/kit/claude/PRUEFLISTE-VORLAGE.md",
  "claude/TEST-LIST-TEMPLATE.md": "scripts/course03/kit/claude/TEST-LIST-TEMPLATE.md",
};

export const KIT_LEARNER_FILES = Object.keys(KIT_LEARNER_SOURCES);

/** Files the export script writes itself. */
export const KIT_GENERATED_FILES = ["README.md", "ASSET-RIGHTS.md"];

/**
 * Archive entries relative to data-readiness-kit/: the learner layer, the
 * generated notes, then the repository-authored builder kit (sorted paths).
 * The builder page stays online only: it needs the published fonts and
 * assets next to it.
 */
export function kitArchiveFiles(builderFiles = []) {
  return [...KIT_LEARNER_FILES, ...KIT_GENERATED_FILES, ...[...builderFiles].sort().map((file) => `builder/${file}`)];
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Build the stored ZIP. `entries` is a list of [pathInsideKit, Buffer].
 * Every entry is stored under data-readiness-kit/ and inspected before return.
 */
export function buildKitArchive(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [file, content] of entries) {
    if (!Buffer.isBuffer(content)) throw new Error(`Kit archive entry is not a buffer: ${file}`);
    const name = Buffer.from(`${KIT_PREFIX}${file}`);
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(content.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(name.length, 26);
    locals.push(local, name, content);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(0x314, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(33, 14);
    entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(content.length, 20); entry.writeUInt32LE(content.length, 24); entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE((0o100644 * 65536) >>> 0, 38); entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += local.length + name.length + content.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  const archive = Buffer.concat([...locals, directory, end]);
  inspectZipArchive(archive, { label: "data-readiness-kit.zip" });
  return archive;
}
