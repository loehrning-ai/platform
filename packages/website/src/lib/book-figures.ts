/**
 * book-figures.ts
 *
 * Build-time loader for the figure data of an open book:
 *
 *   content/books/<slug>/figures/<id>.json         frozen aggregates (FigureSpec + meta)
 *   content/books/<slug>/figures/copy/<id>.json    the words that belong to a figure (step cards, wording)
 *
 * Every spec passes parseFigureSpec and the privacy gate of the engine
 * (findPrivacyFindings) before the reader sees it, so a bad file fails the
 * build instead of reaching a page. The figures folder is the single source of
 * the numbers: prose tokens ({{c4.raw_share}}), the charts, the CSV files
 * under public/books/<slug>/data and the PDF figures all read these files.
 *
 * Node.js fs, like book-reader-content.ts: pages that use it run on the
 * Node.js runtime.
 */

import { promises as fs } from "fs";
import path from "path";
import {
  findPrivacyFindings,
  parseFigureSpec,
  type FigureSpec,
  type SpecLookup,
} from "@/lib/figures";

export class FigureLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FigureLoadError";
  }
}

export interface BookFigures {
  readonly bookSlug: string;
  /** Lower-case figure id to spec. */
  readonly specs: ReadonlyMap<string, FigureSpec>;
  /** Lower-case figure id to the copy file (untouched JSON, tokens not yet resolved). */
  readonly copy: ReadonlyMap<string, unknown>;
  readonly lookup: SpecLookup;
}

/**
 * Figure ids that render without a JSON file: reader-input figures only
 * (the C13 calculator holds no data). Every other figure reads its JSON.
 */
export const FIXTURE_FIGURE_IDS: readonly string[] = ["c13"];

const SAFE = /^[a-z0-9][a-z0-9_-]*$/i;

function figuresDir(bookSlug: string, root: string): string {
  if (!SAFE.test(bookSlug)) throw new FigureLoadError(`Invalid book slug "${bookSlug}".`);
  return path.join(root, "content", "books", bookSlug, "figures");
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(file, "utf-8")) as unknown;
}

async function listJson(dir: string): Promise<string[]> {
  try {
    return (await fs.readdir(dir)).filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

const cache = new Map<string, Promise<BookFigures>>();

async function read(bookSlug: string, root: string): Promise<BookFigures> {
  const dir = figuresDir(bookSlug, root);
  const specs = new Map<string, FigureSpec>();
  for (const name of await listJson(dir)) {
    let spec: FigureSpec;
    try {
      spec = parseFigureSpec(await readJson(path.join(dir, name)));
    } catch (error) {
      throw new FigureLoadError(`${bookSlug}/figures/${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (`${spec.id}.json` !== name) throw new FigureLoadError(`${bookSlug}/figures/${name}: the file name must be ${spec.id}.json`);
    const findings = findPrivacyFindings(spec);
    if (findings.length > 0) {
      throw new FigureLoadError(
        `${bookSlug}/figures/${name}: privacy gate: ${findings.map((f) => `${f.path || "spec"} (${f.reason})`).join("; ")}`,
      );
    }
    specs.set(spec.id.toLowerCase(), spec);
  }
  const copy = new Map<string, unknown>();
  for (const name of await listJson(path.join(dir, "copy"))) {
    copy.set(name.replace(/\.json$/, "").toLowerCase(), await readJson(path.join(dir, "copy", name)));
  }
  return {
    bookSlug,
    specs,
    copy,
    lookup: (id: string) => specs.get(id.toLowerCase()),
  };
}

/**
 * The figures of a book (empty for a book without a figures folder). Cached
 * per process in production; in development and tests every call reads the
 * files again so an edit shows up without a restart.
 */
export function loadBookFigures(bookSlug: string, root: string = process.cwd()): Promise<BookFigures> {
  if (process.env["NODE_ENV"] !== "production") return read(bookSlug, root);
  const key = `${root}::${bookSlug}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const created = read(bookSlug, root);
  cache.set(key, created);
  return created;
}

/** True when the spec is still a pre-rescan export (meta.methodVersion starts with "v0"). */
export function isPreRescan(spec: FigureSpec | undefined): boolean {
  return Boolean(spec?.meta?.methodVersion && /^v0/.test(spec.meta.methodVersion));
}
