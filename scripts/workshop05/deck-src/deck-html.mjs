/**
 * Reads the built Workshop 05 deck pages for the node tests (words, polls, lockstep): the page text, its slides as small
 * element trees, the visibility rule of a press state (an element shows from its data-step to just before its data-out,
 * and only when every ancestor shows), the speaker notes and the poll buttons. Nothing here writes a file.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHtml, tokensOf } from "./count-words.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DECK_DIR = path.resolve(HERE, "../../../packages/website/public/workshops/audit-vorbereitung-mit-ki");
export const PAGES = { de: "slides.html", en: "en/slides.html" };
export const LANGS = ["en", "de"];

export const readPage = (lang) => readFileSync(path.join(DECK_DIR, PAGES[lang]), "utf8");
export const classesOf = (node) => (node.attrs?.class ?? "").split(/\s+/).filter(Boolean);
export const hasClass = (node, name) => classesOf(node).includes(name);

/** Text tokens (letter or digit) of a node, all descendants. */
export function tokensIn(node) {
  if (node.text !== undefined) return tokensOf(node.text);
  return (node.children ?? []).flatMap(tokensIn);
}

/** The text of a node as shown: entities resolved, white space collapsed (punctuation kept, unlike the token count). */
export function textOf(node) {
  const raw = node.text !== undefined ? node.text : (node.children ?? []).map(textOf).join(" ");
  return raw.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/** The slides of a page: the section nodes with class slide, in order. */
export function slidesOf(html) {
  const found = [];
  const visit = (node) => {
    if (node.tag === "section" && hasClass(node, "slide")) found.push(node);
    else for (const child of node.children ?? []) visit(child);
  };
  visit(parseHtml(html));
  return found;
}

export const mainSlides = (html) => slidesOf(html).filter((s) => s.attrs["data-kind"] === "main");

/** True when the element itself is visible at press k (its own data-step and data-out only). */
export function showsAt(node, k) {
  const a = node.attrs ?? {};
  if (a["data-step"] !== undefined && Number(a["data-step"]) > k) return false;
  if (a["data-out"] !== undefined && Number(a["data-out"]) <= k) return false;
  return true;
}

/**
 * Every element under a slide that matches `match(node)` and is visible at press k with all its ancestors.
 * `inside` is false for an element that lies inside another match (so nested matches count once).
 */
export function visibleMatches(section, k, match, { nested = false } = {}) {
  const hits = [];
  const walk = (node, within) => {
    if (!node.tag) return;
    if (!showsAt(node, k)) return;
    const hit = match(node);
    if (hit && (nested || !within)) hits.push(node);
    for (const child of node.children ?? []) walk(child, within || hit);
  };
  for (const child of section.children ?? []) walk(child, false);
  return hits;
}

export const stepsOf = (section) => Number(section.attrs["data-step-total"] ?? 0);

/** The speaker notes array of a page. */
export function notesOf(html) {
  const raw = /<script type="application\/json" id="speaker-notes">([\s\S]*?)<\/script>/.exec(html)?.[1];
  if (!raw) throw new Error("no speaker-notes block");
  return JSON.parse(raw.replace(/\\u003c/g, "<"));
}

/** All elements with an attribute, anywhere in a section. */
export function withAttr(section, name) {
  const hits = [];
  const walk = (node) => {
    if (!node.tag) return;
    if (node.attrs?.[name] !== undefined) hits.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(section);
  return hits;
}

/** Every element of the page (all slides), for page level checks. */
export function everyElement(html) {
  const out = [];
  const walk = (node) => {
    if (node.tag) out.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(parseHtml(html));
  return out;
}

/** Page without the speaker notes block (the notes may speak about what a slide must not show). */
export const withoutNotes = (html) => html.replace(/<script type="application\/json" id="speaker-notes">[\s\S]*?<\/script>/, "");
