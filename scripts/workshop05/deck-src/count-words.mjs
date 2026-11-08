/**
 * Counts the visible words of every press state of every slide in a built deck page (the rules of the deck standard:
 * a token counts when it holds a letter or a digit; the classes qd, qd-gloss, prompt-body, fig, out and focus are exempt;
 * the footer counter, scripts, svg and form chrome do not count). An element is visible at press k when its own data-step
 * is at most k and its data-out is above k, and the same holds for every ancestor.
 * Used by the words test and by the build lanes to check a slide against the printed counts of its spec.
 */
import { readFileSync } from "node:fs";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const SKIP = new Set(["script", "style", "svg", "template", "noscript", "title"]);
const EXEMPT = ["qd", "qd-gloss", "prompt-body", "fig", "out", "focus", "foot"];

/** A small tolerant HTML tree: { tag, attrs, children, text }. */
export function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"'=]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) {
      top.children.push({ text: m[5] });
    } else if (m[1]) {
      const name = m[2].toLowerCase();
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === name) { stack.length = i; break; }
      }
    } else {
      const tag = m[2].toLowerCase();
      const attrs = {};
      for (const a of m[3].matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? "";
      const node = { tag, attrs, children: [] };
      top.children.push(node);
      if (SKIP.has(tag)) {
        const close = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        if (close >= 0) re.lastIndex = html.indexOf(">", close) + 1;
      } else if (!VOID.has(tag) && !m[4]) stack.push(node);
    }
  }
  return root;
}

const unescape = (t) => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

export function tokensOf(text) {
  return unescape(text).split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t));
}

function walk(node, step, out) {
  if (!node.tag || SKIP.has(node.tag)) return;
  const a = node.attrs ?? {};
  const classes = (a.class ?? "").split(/\s+/);
  if (classes.some((c) => EXEMPT.includes(c))) return;
  if (a["data-step"] !== undefined && Number(a["data-step"]) > step) return;
  if (a["data-out"] !== undefined && Number(a["data-out"]) <= step) return;
  if (node.tag === "footer") return;
  for (const child of node.children) {
    if (child.text !== undefined) out.push(...tokensOf(child.text));
    else walk(child, step, out);
  }
}

/** Slides of a page: [{ id, kind, steps, states: [tokens per press] }]. */
export function countDeck(html) {
  const tree = parseHtml(html);
  const slides = [];
  const find = (node) => {
    if (node.tag === "section" && (node.attrs.class ?? "").split(/\s+/).includes("slide")) slides.push(node);
    else for (const c of node.children ?? []) find(c);
  };
  find(tree);
  return slides.map((section) => {
    const steps = Number(section.attrs["data-step-total"] ?? 0);
    const states = [];
    for (let k = 0; k <= steps; k += 1) {
      const tokens = [];
      for (const child of section.children) if (child.tag) walk(child, k, tokens);
      states.push(tokens);
    }
    return { id: section.attrs.id, kind: section.attrs["data-kind"], steps, states };
  });
}

if (process.argv[1] && process.argv[1].endsWith("count-words.mjs")) {
  const file = process.argv[2];
  const only = process.argv[3];
  for (const slide of countDeck(readFileSync(file, "utf8"))) {
    if (only && slide.id !== only) continue;
    console.log(slide.id.padEnd(12), slide.states.map((t) => t.length).join(", "));
    if (only) slide.states.forEach((t, i) => console.log(`  P${i}: ${t.join(" ")}`));
  }
}
