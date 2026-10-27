/**
 * Build-time reads for the "Für deinen Claude" block: the kit zip's size and
 * the project instructions inside it, straight from public/. Server only.
 */

import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readZipText } from "@/lib/zip/read";
import type { TakeHomeKit } from "@/lib/demo-takehome";

export interface ResolvedKit {
  readonly href: string;
  readonly fileName: string;
  readonly bytes: number;
  readonly shown: readonly string[];
  readonly instructions: string;
}

/** The absolute path of a public URL path like /workshops/x/kit.zip. */
export function publicFile(href: string): string {
  if (!href.startsWith("/") || href.split("/").includes("..")) throw new Error(`not a public path: ${href}`);
  return path.join(process.cwd(), "public", href);
}

/** Reads the zip once and resolves what the block shows; throws when a named file is missing. */
export function resolveKit(kit: TakeHomeKit): ResolvedKit {
  const bytes = new Uint8Array(readFileSync(publicFile(kit.href)));
  const instructions = readZipText(bytes, kit.instructions);
  if (instructions === null) throw new Error(`${kit.href} has no ${kit.instructions}`);
  return {
    href: kit.href,
    fileName: kit.href.split("/").pop() ?? kit.href,
    bytes: bytes.length,
    shown: kit.shown,
    instructions,
  };
}
