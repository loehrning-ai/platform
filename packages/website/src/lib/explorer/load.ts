/**
 * Build-time loader of the placement model: content/books/<slug>/explorer.json.
 * Node.js fs, like book-figures.ts. A missing or invalid file is an authoring
 * error: the chapter that places `::explorer{}` fails the build instead of
 * printing a number from nothing.
 */

import { promises as fs } from "fs";
import path from "path";
import { ExplorerModelError, localizeModel, parseExplorerModel, type ExplorerLocale, type ExplorerModel } from "./model";

const SAFE = /^[a-z0-9][a-z0-9_-]*$/i;

export async function loadExplorerModel(bookSlug: string, root: string = process.cwd(), locale: ExplorerLocale = "de"): Promise<ExplorerModel> {
  if (!SAFE.test(bookSlug)) throw new ExplorerModelError(`Invalid book slug "${bookSlug}".`);
  const file = path.join(root, "content", "books", bookSlug, "explorer.json");
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ExplorerModelError(
        `${bookSlug}: ::explorer{} needs content/books/${bookSlug}/explorer.json (coefficients and bootstrap draws from the analysis freeze).`,
      );
    }
    throw error;
  }
  const model = parseExplorerModel(JSON.parse(raw) as unknown);
  if (locale === "de") return model;
  const overlayFile = path.join(root, "content", "books", bookSlug, "explorer.en.json");
  let overlay: string;
  try {
    overlay = await fs.readFile(overlayFile, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ExplorerModelError(`${bookSlug}: the English explorer needs content/books/${bookSlug}/explorer.en.json (the model's words in English).`);
    }
    throw error;
  }
  return localizeModel(model, JSON.parse(overlay) as unknown, locale);
}
